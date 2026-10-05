const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const TurndownService = require('turndown');

const turndownService = new TurndownService();

const destBasePath = path.join(__dirname, 'public', 'patologias');
const jsonPath = path.join(__dirname, 'lib', 'patologias.json');

async function processDocs() {
  if (!fs.existsSync(jsonPath)) {
    console.error("JSON no encontrado");
    return;
  }
  
  let patologias = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let processedFiles = 0;

  for (let patologia of patologias) {
    if (patologia.documentos && patologia.documentos.length > 0) {
      let newDocs = [];
      
      for (let i = 0; i < patologia.documentos.length; i++) {
        let docWebPath = patologia.documentos[i];
        let docLocalPath = path.join(__dirname, 'public', docWebPath.replace(/^\//, ''));
        let ext = path.extname(docLocalPath).toLowerCase();
        let basePath = docLocalPath.substring(0, docLocalPath.length - ext.length);
        let mdLocalPath = basePath + '.md';
        let mdWebPath = docWebPath.substring(0, docWebPath.length - ext.length) + '.md';
        
        let success = false;

        if (fs.existsSync(docLocalPath)) {
          try {
            if (ext === '.docx') {
              let result = await mammoth.convertToHtml({ path: docLocalPath });
              let markdown = turndownService.turndown(result.value);
              // Fallback si no generó nada útil
              if (!markdown.trim()) {
                 let raw = await mammoth.extractRawText({ path: docLocalPath });
                 markdown = raw.value;
              }
              fs.writeFileSync(mdLocalPath, markdown);
              success = true;
            } else if (ext === '.pdf') {
              let dataBuffer = fs.readFileSync(docLocalPath);
              let data = await pdfParse(dataBuffer);
              fs.writeFileSync(mdLocalPath, data.text);
              success = true;
            } else if (ext === '.txt' || ext === '.rtf') {
              let text = fs.readFileSync(docLocalPath, 'utf8');
              fs.writeFileSync(mdLocalPath, text);
              success = true;
            } else if (ext === '.doc') {
                // Mammoth no soporta .doc antiguo directamente, escribimos un mensaje
                fs.writeFileSync(mdLocalPath, "# Documento Antiguo\n\nEl archivo original era formato `.doc` antiguo. Por favor, conviértelo a `.docx` y agrégalo manualmente.");
                success = true;
            }
          } catch (e) {
            console.error(`Error convirtiendo ${docLocalPath}:`, e);
          }

          if (success) {
            // Eliminar el archivo original
            fs.unlinkSync(docLocalPath);
            newDocs.push(mdWebPath);
            processedFiles++;
          } else {
            // Si falló, mantenemos el original en el JSON
            newDocs.push(docWebPath);
          }
        } else {
          // Si ya no existe, mantenemos su ruta original o quizás deberíamos quitarlo, pero lo mantenemos por seguridad.
          newDocs.push(docWebPath);
        }
      }
      
      // Actualizar los documentos de esta patología para que apunten a los .md
      patologia.documentos = newDocs;
    }
  }

  // Guardar JSON
  fs.writeFileSync(jsonPath, JSON.stringify(patologias, null, 2));
  console.log(`✅ ¡Conversión exitosa! Se transformaron a Markdown y eliminaron los originales de ${processedFiles} archivos.`);
}

processDocs();
