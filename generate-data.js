const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'public', 'imagenes_patologia');
const libDir = path.join(__dirname, 'lib');
const outputJson = path.join(libDir, 'patologias.json');

// Ensure lib folder exists
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir);
}

const result = [];
const folders = fs.readdirSync(basePath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory());

for (const folder of folders) {
  const folderPath = path.join(basePath, folder.name);
  const subfolders = fs.readdirSync(folderPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.toLowerCase() === 'imagenes');

  if (subfolders.length > 0) {
    const imagenesDir = path.join(folderPath, subfolders[0].name);
    // Filtrar solo archivos de imagen
    let images = fs.readdirSync(imagenesDir)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(f));
    
    if (images.length > 0) {
      // Limpiar el nombre para visualización
      let cleanName = folder.name
        .replace(/\(CD.*\)/i, '') // Remover (CD)
        .replace(/}/g, '')        // Remover caracteres raros como }
        .trim();
      
      // Construir las rutas absolutas para la web (empezando con /imagenes_patologia)
      const imagePaths = images.map(img => `/imagenes_patologia/${folder.name}/${subfolders[0].name}/${img}`);
      
      result.push({
        id: cleanName.toLowerCase().replace(/[^a-z0-9ñáéíóú]+/gi, '-').replace(/(^-|-$)/g, ''),
        nombre_display: cleanName,
        ruta_original: folder.name,
        portada: imagePaths[0],
        catalogo: imagePaths.slice(1)
      });
    }
  }
}

fs.writeFileSync(outputJson, JSON.stringify(result, null, 2));
console.log(`✅ ¡Éxito! Se generaron ${result.length} patologías en lib/patologias.json`);
