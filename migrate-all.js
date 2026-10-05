const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const TurndownService = require('turndown');

const turndownService = new TurndownService();

const sourceBasePath = path.join(__dirname, 'public', 'documentos_patologia_actualizados');
const destBasePath = path.join(__dirname, 'public', 'patologias');
const libDir = path.join(__dirname, 'lib');
const jsonPath = path.join(libDir, 'patologias.json');

// Reiniciar la carpeta de destino para empezar limpios
if (fs.existsSync(destBasePath)) {
  fs.rmSync(destBasePath, { recursive: true, force: true });
}
fs.mkdirSync(destBasePath, { recursive: true });
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

async function processAll() {
  const folders = fs.readdirSync(sourceBasePath, { withFileTypes: true }).filter(d => d.isDirectory());
  const patologias = [];
  
  let stats = {
    procesadas: 0,
    imagenes: 0,
    documentos: 0,
    videos: 0,
    fallos: 0
  };

  console.log("Iniciando procesamiento total. Esto puede tomar unos minutos...");

  for (const folder of folders) {
    const folderPath = path.join(sourceBasePath, folder.name);
    
    // Generar un ID limpio para la URL
    let cleanName = folder.name.replace(/\(CD.*\)/i, '').replace(/}/g, '').trim();
    let id = cleanName.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/gi, '-').replace(/(^-|-$)/g, '');
    
    let entry = {
      id: id,
      nombre_display: cleanName,
      portada: "",
      catalogo: [],
      documentos: [],
      videos: []
    };
    
    let hasContent = false;
    const destFolder = path.join(destBasePath, id);
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

    // --- 1. PROCESAR IMÁGENES (Solo si están en la subcarpeta que empiece con "imag") ---
    const subfolders = fs.readdirSync(folderPath, { withFileTypes: true }).filter(d => d.isDirectory() && d.name.toLowerCase().match(/^imag/));
    if (subfolders.length > 0) {
      const imagenesDir = path.join(folderPath, subfolders[0].name);
      let images = fs.readdirSync(imagenesDir).filter(f => /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(f));
      
      for (let i = 0; i < images.length; i++) {
        let img = images[i];
        let ext = path.extname(img).toLowerCase();
        let srcFile = path.join(imagenesDir, img);
        
        let newFileName = i === 0 ? 'portada.webp' : `catalogo${i}.webp`;
        let destFile = path.join(destFolder, newFileName);
        let webPath = `/patologias/${id}/${newFileName}`;
        
        try {
          await sharp(srcFile).webp({ quality: 80 }).toFile(destFile);
          if (i === 0) {
            entry.portada = webPath;
          } else {
            entry.catalogo.push(webPath);
          }
          stats.imagenes++;
          hasContent = true;
        } catch (e) {
          // Si es un HEIC que no se puede convertir, lo pasamos tal cual
          newFileName = i === 0 ? `portada${ext}` : `catalogo${i}${ext}`;
          destFile = path.join(destFolder, newFileName);
          webPath = `/patologias/${id}/${newFileName}`;
          fs.copyFileSync(srcFile, destFile);
          if (i === 0) {
            entry.portada = webPath;
          } else {
            entry.catalogo.push(webPath);
          }
          stats.fallos++;
          hasContent = true;
        }
      }
    }

    // Función auxiliar para buscar documentos y videos de forma recursiva
    const findFiles = (dir) => {
      let results = { docs: [], videos: [] };
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          let sub = findFiles(fullPath);
          results.docs = results.docs.concat(sub.docs);
          results.videos = results.videos.concat(sub.videos);
        } else {
          if (/\.(docx?|pdf|txt|rtf)$/i.test(item.name)) results.docs.push(fullPath);
          if (/\.(mp4|wmv|avi|mov|mts|vob)$/i.test(item.name)) results.videos.push(fullPath);
        }
      }
      return results;
    };

    let files = findFiles(folderPath);

    // --- 2. PROCESAR DOCUMENTOS (Convertir a Markdown) ---
    for (let i = 0; i < files.docs.length; i++) {
      let docPath = files.docs[i];
      let ext = path.extname(docPath).toLowerCase();
      let newFileName = `documento-${i + 1}.md`;
      let destFile = path.join(destFolder, newFileName);
      let webPath = `/patologias/${id}/${newFileName}`;
      
      try {
        let markdown = "";
        if (ext === '.docx') {
          let result = await mammoth.convertToHtml({ path: docPath });
          markdown = turndownService.turndown(result.value);
          if (!markdown.trim()) {
             let raw = await mammoth.extractRawText({ path: docPath });
             markdown = raw.value;
          }
        } else if (ext === '.pdf') {
          let dataBuffer = fs.readFileSync(docPath);
          let data = await pdfParse(dataBuffer);
          markdown = data.text;
        } else if (ext === '.txt' || ext === '.rtf') {
          markdown = fs.readFileSync(docPath, 'utf8');
        } else if (ext === '.doc') {
          markdown = "# Documento Antiguo\n\nEl archivo original era formato `.doc` antiguo. Por favor, conviértelo a `.docx`.";
        }
        
        fs.writeFileSync(destFile, markdown);
        entry.documentos.push(webPath);
        stats.documentos++;
        hasContent = true;
      } catch (e) {
        console.error(`Error procesando doc ${docPath}:`, e.message);
      }
    }

    // --- 3. PROCESAR VIDEOS (Copiarlos) ---
    for (let i = 0; i < files.videos.length; i++) {
      let vidPath = files.videos[i];
      let ext = path.extname(vidPath).toLowerCase();
      let newFileName = `video-${i + 1}${ext}`;
      let destFile = path.join(destFolder, newFileName);
      let webPath = `/patologias/${id}/${newFileName}`;
      
      fs.copyFileSync(vidPath, destFile);
      entry.videos.push(webPath);
      stats.videos++;
      hasContent = true;
    }

    // --- 4. GUARDAR EN EL REGISTRO ---
    if (hasContent) {
      patologias.push(entry);
      stats.procesadas++;
    } else {
      // Si la carpeta no tenía absolutamente nada, la borramos
      fs.rmSync(destFolder, { recursive: true, force: true });
    }
  }

  // Escribir el JSON Final
  fs.writeFileSync(jsonPath, JSON.stringify(patologias, null, 2));
  
  console.log(`\n==============================================`);
  console.log(`✅ ¡MIGRACIÓN TOTAL COMPLETADA CON ÉXITO!`);
  console.log(`==============================================`);
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(` - Casos procesados exitosamente: ${stats.procesadas}`);
  console.log(` - Imágenes optimizadas a WebP: ${stats.imagenes}`);
  console.log(` - Documentos pasados a Markdown: ${stats.documentos}`);
  console.log(` - Videos copiados y enlazados: ${stats.videos}`);
  console.log(` - Imágenes mantenidas en formato original (ej. HEIC): ${stats.fallos}`);
}

processAll();
