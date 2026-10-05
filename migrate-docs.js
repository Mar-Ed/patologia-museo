const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'public', 'imagenes_patologia');
const destBasePath = path.join(__dirname, 'public', 'patologias');
const jsonPath = path.join(__dirname, 'lib', 'patologias.json');

// Leer el JSON actual para mantener lo que ya migramos
let patologias = [];
if (fs.existsSync(jsonPath)) {
  patologias = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

const folders = fs.readdirSync(basePath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory());

let procesadas = 0;
let docsCopiados = 0;

for (const folder of folders) {
  const folderPath = path.join(basePath, folder.name);
  
  // Función para buscar documentos recursivamente dentro de cada patología
  const findDocsRecursively = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(findDocsRecursively(fullPath));
      } else {
        if (/\.(docx?|pdf|txt|rtf)$/i.test(item.name)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  };
  
  const docs = findDocsRecursively(folderPath);

  if (docs.length > 0) {
    procesadas++;
    // Limpiar el nombre y generar el ID igual que antes
    let cleanName = folder.name.replace(/\(CD.*\)/i, '').replace(/}/g, '').trim();
    let id = cleanName.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/gi, '-').replace(/(^-|-$)/g, '');
    
    // Buscar si esta patología ya existe en nuestro JSON (por si ya tenía imágenes)
    let entry = patologias.find(p => p.id === id);
    
    // Si no existía (es decir, no tenía imágenes pero sí tiene documentos), la creamos
    if (!entry) {
      entry = {
        id: id,
        nombre_display: cleanName,
        portada: "",
        catalogo: [],
        documentos: []
      };
      patologias.push(entry);
    }
    
    // Asegurarnos de que el array de documentos exista
    if (!entry.documentos) {
      entry.documentos = [];
    }
    
    // Asegurar que la carpeta de destino exista
    const destFolder = path.join(destBasePath, id);
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
    
    // Migrar y renombrar cada documento
    docs.forEach((docPath, index) => {
      const ext = path.extname(docPath).toLowerCase();
      // Los nombramos de forma ordenada y limpia para la web: documento-1.pdf, documento-2.docx, etc.
      const newFileName = `documento-${index + 1}${ext}`;
      const destFile = path.join(destFolder, newFileName);
      
      // Copiar el documento
      fs.copyFileSync(docPath, destFile);
      docsCopiados++;
      
      // Añadir la nueva ruta al JSON
      const docWebPath = `/patologias/${id}/${newFileName}`;
      if (!entry.documentos.includes(docWebPath)) {
        entry.documentos.push(docWebPath);
      }
    });
  }
}

// Guardar el JSON actualizado
fs.writeFileSync(jsonPath, JSON.stringify(patologias, null, 2));
console.log(`✅ ¡Migración de documentos exitosa! Se copiaron ${docsCopiados} documentos de ${procesadas} patologías.`);
console.log(`✅ El archivo 'lib/patologias.json' fue actualizado. Total de patologías registradas ahora: ${patologias.length}`);
