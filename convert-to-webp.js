const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const jsonPath = path.join(__dirname, 'lib', 'patologias.json');

async function convertToWebp() {
  if (!fs.existsSync(jsonPath)) {
    console.error("JSON no encontrado");
    return;
  }
  
  let patologias = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let processedImages = 0;
  let failedImages = 0;

  for (let patologia of patologias) {
    // Procesar Portada
    if (patologia.portada) {
      let docWebPath = patologia.portada;
      if (!docWebPath.endsWith('.webp')) {
        let docLocalPath = path.join(__dirname, 'public', docWebPath.replace(/^\//, ''));
        let ext = path.extname(docLocalPath).toLowerCase();
        let webpLocalPath = docLocalPath.substring(0, docLocalPath.length - ext.length) + '.webp';
        let webpWebPath = docWebPath.substring(0, docWebPath.length - ext.length) + '.webp';
        
        if (fs.existsSync(docLocalPath)) {
          try {
            await sharp(docLocalPath).webp({ quality: 80 }).toFile(webpLocalPath);
            fs.unlinkSync(docLocalPath); // Borrar original
            patologia.portada = webpWebPath; // Actualizar JSON
            processedImages++;
          } catch (e) {
            console.error(`Error convirtiendo portada ${docLocalPath}:`, e.message);
            failedImages++;
          }
        }
      }
    }

    // Procesar Catálogo
    if (patologia.catalogo && patologia.catalogo.length > 0) {
      let newCatalogo = [];
      for (let i = 0; i < patologia.catalogo.length; i++) {
        let docWebPath = patologia.catalogo[i];
        if (!docWebPath.endsWith('.webp')) {
          let docLocalPath = path.join(__dirname, 'public', docWebPath.replace(/^\//, ''));
          let ext = path.extname(docLocalPath).toLowerCase();
          let webpLocalPath = docLocalPath.substring(0, docLocalPath.length - ext.length) + '.webp';
          let webpWebPath = docWebPath.substring(0, docWebPath.length - ext.length) + '.webp';

          if (fs.existsSync(docLocalPath)) {
            try {
              await sharp(docLocalPath).webp({ quality: 80 }).toFile(webpLocalPath);
              fs.unlinkSync(docLocalPath); // Borrar original
              newCatalogo.push(webpWebPath); // Actualizar JSON
              processedImages++;
            } catch (e) {
              console.error(`Error convirtiendo catálogo ${docLocalPath}:`, e.message);
              newCatalogo.push(docWebPath); // Mantener la original si falla
              failedImages++;
            }
          } else {
            newCatalogo.push(docWebPath);
          }
        } else {
          newCatalogo.push(docWebPath);
        }
      }
      patologia.catalogo = newCatalogo;
    }
  }

  // Guardar el JSON actualizado
  fs.writeFileSync(jsonPath, JSON.stringify(patologias, null, 2));
  console.log(`✅ ¡Conversión exitosa! Se transformaron a WebP y eliminaron las originales de ${processedImages} imágenes.`);
  if (failedImages > 0) {
    console.log(`⚠️ Hubo ${failedImages} imágenes que no se pudieron convertir (usualmente fotos en formato HEIC de iPhone que requieren codecs especiales). Conservarán su formato original.`);
  }
}

convertToWebp();
