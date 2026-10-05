const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'public', 'imagenes_patologia');
const destBasePath = path.join(__dirname, 'public', 'patologias'); // Nueva carpeta en public
const libDir = path.join(__dirname, 'lib');
const outputJson = path.join(libDir, 'patologias.json');

// Crear carpetas de destino si no existen
if (!fs.existsSync(destBasePath)) fs.mkdirSync(destBasePath, { recursive: true });
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

const result = [];
const folders = fs.readdirSync(basePath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory());

let procesadas = 0;

for (const folder of folders) {
  const folderPath = path.join(basePath, folder.name);
  const subfolders = fs.readdirSync(folderPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.toLowerCase() === 'imagenes');

  if (subfolders.length > 0) {
    const imagenesDir = path.join(folderPath, subfolders[0].name);
    // Filtrar solo imágenes
    let images = fs.readdirSync(imagenesDir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(f));
    
    if (images.length > 0) {
      procesadas++;
      // Limpiar nombre para la ID
      let cleanName = folder.name.replace(/\(CD.*\)/i, '').replace(/}/g, '').trim();
      let id = cleanName.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/gi, '-').replace(/(^-|-$)/g, '');
      
      // Crear subcarpeta para esta patología en el nuevo destino
      const destFolder = path.join(destBasePath, id);
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      
      let portadaPath = '';
      let catalogoPaths = [];
      
      // Migrar y renombrar las imágenes
      images.forEach((img, index) => {
        const ext = path.extname(img).toLowerCase();
        const sourceFile = path.join(imagenesDir, img);
        let newFileName = '';
        
        if (index === 0) {
          newFileName = `portada${ext}`;
          portadaPath = `/patologias/${id}/${newFileName}`;
        } else {
          newFileName = `catalogo${index}${ext}`;
          catalogoPaths.push(`/patologias/${id}/${newFileName}`);
        }
        
        const destFile = path.join(destFolder, newFileName);
        // Copiamos el archivo al nuevo destino (manteniendo el original como respaldo)
        fs.copyFileSync(sourceFile, destFile);
      });
      
      result.push({
        id: id,
        nombre_display: cleanName,
        portada: portadaPath,
        catalogo: catalogoPaths
      });
    }
  }
}

// Actualizar el archivo JSON con las nuevas rutas
fs.writeFileSync(outputJson, JSON.stringify(result, null, 2));
console.log(`✅ ¡Migración exitosa! Se copiaron y renombraron las imágenes de ${procesadas} patologías en la nueva carpeta 'public/patologias/'.`);
console.log(`✅ El archivo 'lib/patologias.json' fue actualizado con las nuevas rutas de portada y catálogo.`);
