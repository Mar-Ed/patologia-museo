# Museo de Patología Veterinaria

Sitio informativo de la Facultad de Ciencias Veterinarias de la Universidad Nacional de Cajamarca.

## Ejecutar el proyecto

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación de producción.
- `npm start`: servidor de producción después de compilar.
- `npm run lint`: revisión estática del código.
- `npm run prepare:site`: actualizar índice y vistas de imágenes después de cambiar fuentes durante una sesión de desarrollo.
- `npm run test:performance`: verificar las optimizaciones después de compilar.
- `npm run test:motion`: verificar revelado repetible, accesibilidad y CSS de producción después de compilar.

## Tecnología

Next.js con App Router, React, Tailwind CSS, Sharp y Lucide React.

## Contenido de las fichas

Cada patología tiene su contenido editado en `lib/content/patologias/<slug>.ts`: descripción, origen, características, diagnóstico, relevancia, observaciones y resumen. `index.ts` registra las 91 fichas. Para corregir Milagritos, por ejemplo, edita `lib/content/patologias/milagritos.ts`. Los componentes compartidos conservan el diseño y las secciones actuales; cada página recibe únicamente los datos de su ficha, no los de todo el museo.

La web no lee, convierte ni necesita Markdown al iniciar, compilar o servir las páginas. Los documentos solo se utilizaron como referencia para extraer y organizar la información; los Markdown de `public/patologias` se retiraron después de verificar la migración. `sourceCount` conserva el número histórico de documentos utilizados, no una dependencia de archivos presentes.

Las imágenes locales permanecen en `public/patologias`:

- `portada.webp`: fotografía junto al nombre de la patología y en su tarjeta.
- `catalogo*.webp`: fotografías ordenadas numéricamente, con visor ampliable y sin etiquetas de anexos.
- Videos: sustituyen las fotografías del catálogo cuando están disponibles; la portada se mantiene. El reproductor usa controles nativos y no descarga el video hasta que se solicita su reproducción.

Para una patología nueva, añade sus imágenes en `public/patologias`, su contenido TypeScript y su entrada en el registro de fichas; la compilación avisa si falta el contenido. Se conservan las rutas existentes. Los archivos de video locales se retiraron a petición del usuario para sustituirlos por enlaces externos; sus extensiones están excluidas de Git en `public/patologias`. `lib/pathology-videos.ts` configura los 18 enlaces de Google Drive suministrados para 14 patologías. Las primeras cuatro comparten el mismo archivo de Drive, tal como fueron enviadas, y Leiomioma contiene un único enlace. Los scripts de preparación audiovisual se conservan como utilidades opcionales, pero no son necesarios para ejecutar la web.

Se conservaron las 19 miniaturas WebP extraídas de los videos; se reutilizan 18 en los registros enlazados. El componente audiovisual conserva su botón central accesible y su disposición responsive: un video centrado o varios en dos columnas en escritorio y una en tablet/móvil. Al pulsar «Ver video» se carga el visor `/preview` de Drive; la reproducción se controla dentro del visor y no se presupone reproducción automática. Cada registro incluye un enlace alternativo «Abrir en Drive». Los archivos deben compartirse como «Cualquier persona con el enlace», con permiso de lector. Las miniaturas originales deben revisarse si se cambia el video enlazado; no se descarga contenido remoto al repositorio.

### Documentación Word adicional

Se extrajo información de los 12 archivos de `public/nuevos_word` para 11 patologías, conservando los Word originales. Miocarcinoma incluye dos reportes distintos; polidactilia porcina incluye la información adicional. El informe `scripts/reports/new-word-conversion.json` conserva la correspondencia histórica de archivos y sus hashes. El contenido de las fichas reside ahora en TypeScript, sin introducciones conversacionales ni dedicatorias/agradecimientos.

Los scripts de conversión Word y sus informes se conservan como herramientas históricas de extracción; no forman parte del flujo de ejecución de la web. Sus comprobaciones de Markdown corresponden a la importación anterior, no al formato actual. La nueva información debe adaptarse al archivo TypeScript de su patología.

Los originales Word y las imágenes no se modifican. Los nombres históricos con diferencias ortográficas se vinculan explícitamente en `lib/pathology-content.ts`, sin renombrar las imágenes ni fusionar especímenes. Las fichas TypeScript conservan la síntesis científica y las observaciones particulares por separado; `lib/scientific-profiles.ts` conserva la bibliografía. Los códigos MPV son identificadores digitales, no códigos institucionales confirmados. Dedicatoria y agradecimientos aparecen exclusivamente en la página principal.

`proxy.ts` mantiene el bloqueo HTTP 404 de las antiguas rutas Markdown, aunque esos documentos ya no estén en las carpetas de patologías.

`scripts/reports/pathology-text-migration.json` registra las huellas de los campos de texto antes de retirar los documentos. `node scripts/check-pathology-migration.mjs` verifica la igualdad completa de la migración; es una auditoría puntual, no una restricción para futuras correcciones editoriales. El script de migración no se ejecuta automáticamente y se niega a sobrescribir fichas existentes.

`npm run dev` y `npm run build` preparan automáticamente un índice breve del catálogo y las imágenes optimizadas. Si cambias el contenido TypeScript o las imágenes con el servidor de desarrollo ya abierto, ejecuta `npm run prepare:site` y recarga para actualizar también las tarjetas. En producción hay que volver a ejecutar `npm run build`. No se necesitan migraciones ni base de datos.

## SEO y publicación

El dominio canónico es `https://www.museopatologiaveterinaria.com`, centralizado en `lib/site-config.ts`. Cada página declara su canonical y sus metadatos Open Graph/Twitter. `public/social-card.png` es la imagen social de 1200 × 630; se puede regenerar con `node scripts/prepare-social-card.mjs`.

`app/sitemap.ts` genera `/sitemap.xml` con todas las páginas públicas, fichas y páginas adicionales del catálogo. No se inventan fechas de modificación. `app/robots.ts` permite rastrear la web y declara el sitemap. Los documentos editoriales originales no forman parte del sitemap y se bloquean por HTTP junto con los Markdown internos.

El catálogo conserva búsqueda, filtros y «Cargar más», y añade páginas estáticas de 24 fichas con enlaces HTML y canonical propio. Todas las fichas se pueden descubrir sin activar botones. El texto de anatomía, diagnóstico, estudio y bibliografía se incluye en el HTML inicial; la galería conserva carga bajo demanda. Sin JavaScript se muestran las secciones de texto completas.

El marcado JSON-LD describe el museo, el sitio, las rutas de navegación y las fichas educativas. Los identificadores MPV distinguen los títulos de especímenes similares y no se presentan como códigos institucionales. No se inventan revisores, historias clínicas ni fechas. Una revisión científica y la incorporación de responsables reales requieren datos confirmados por la institución.

`proxy.ts` redirige el dominio sin `www` y el antiguo dominio de producción de Vercel al dominio oficial, conservando ruta y consulta. Las otras URLs de Vercel reciben `X-Robots-Tag: noindex, nofollow`. En el proveedor deben permanecer vinculados ambos dominios, con certificados HTTPS válidos; DNS y certificados no se configuran desde este repositorio.

Después de `npm run build`, ejecutar `npm run test:seo`; con un servidor de producción activo, ejecutar `npm run test:seo -- http://localhost:3000` para comprobar también respuestas HTTP, bloqueos y redirecciones. Las pruebas de rendimiento existentes comprueban las optimizaciones locales; los Core Web Vitals reales se deben medir en producción.

Antes de verificar Search Console, publicar esta versión y comprobar `https://www.museopatologiaveterinaria.com/sitemap.xml` y `https://www.museopatologiaveterinaria.com/robots.txt`. Después de verificar la propiedad, enviar `sitemap.xml` e inspeccionar inicio, una categoría, una página adicional y una ficha. La verificación de Google y el envío del sitemap quedan fuera de esta implementación.

## Rendimiento

Las páginas comparten un revelado editorial de 540–600 ms al entrar en pantalla, que se reinicia solo cuando cada componente sale completamente y se repite al bajar o subir. Las tarjetas/columnas tienen un escalonado acotado de 60 ms. `lib/scroll-reveal.ts` combina un único IntersectionObserver con Web Animations; mantiene el estado en memoria y no cambia clases, atributos ni estilos inline del HTML, evitando interferir con la hidratación diferida de React/Suspense. Detecta contenido nuevo mediante MutationObserver (rutas, filtros, galerías y «Cargar más»), sin escuchar cada evento de scroll ni añadir bibliotecas. Las cabeceras marcadas tienen entrada inicial escalonada; el resto del primer contenido visible permanece inmediato. Se cancelan los efectos terminados o de nodos eliminados, se protege el foco y los videos abiertos, y `prefers-reduced-motion` desactiva los efectos. Sin JavaScript o sin las APIs necesarias, el contenido sigue visible. `app/motion.css` conserva las microinteracciones de hover y el ajuste de movimiento reducido.

El catálogo general y las cuatro categorías se generan como páginas estáticas. Al cambiar la clasificación dentro del catálogo, se filtra en el navegador y se actualiza la ruta mediante el historial de Next.js, sin descargar otra ficha de catálogo. Se conservan los filtros de texto/especie y funcionan los enlaces directos y Atrás/Adelante. La búsqueda revisa todos los registros; se muestran 24 tarjetas inicialmente y el resto con «Cargar más». Las tarjetas precargan una ficha solo al señalarla, enfocarla o tocarla.

`scripts/prepare-site.mjs` prepara una síntesis de máximo 180 caracteres para las tarjetas en `.generated/catalog.json`, a partir del contenido TypeScript editado. La información completa sigue disponible en cada ficha. Prepara miniaturas de hasta 256 px y vistas de hasta 1200 px, sin recortar ni ampliar los originales, con una vista previa diminuta para evitar espacios vacíos. Las copias están en `public/media/patologias`, tienen una huella de contenido y caché `immutable` de un año. El visor solicita la alta resolución solo cuando se abre. Las imágenes y el índice derivados se excluyen de Git y se regeneran al iniciar/compilar; no hay que añadirlos a los commits. La primera preparación tarda más; las siguientes reutilizan las imágenes existentes.

`npm run test:performance -- http://localhost:3000` también comprueba redirecciones históricas, caché de imágenes y respuestas HTTP. La comprobación de contenido sigue diferenciando los pequeños placeholders de las imágenes base64 incrustadas en documentos.

`node scripts/check-pathology-content.mjs` verifica cobertura científica, referencias, rutas de imágenes y ausencia de contenido preliminar o enlaces Markdown en las fichas. Con una URL como argumento también verifica las páginas y las fotografías por HTTP.

## Recuperar imágenes de los documentos originales

`node scripts/export-pathology-images.mjs --apply` revisa cada patología de `public/documentos_patologia_actualizados`, pero solo exporta imágenes dentro de subcarpetas llamadas `IMAGENES`, `Imágenes_`, `img`, `IMAGEN_` o variantes con tildes, símbolos y guiones bajos. Incluye niveles anidados dentro de esas carpetas. Excluye las fotos sueltas en la raíz de la patología y las de otras carpetas. Convierte a WebP, conserva los originales y las portadas válidas existentes, añade fotografías al final del catálogo y evita duplicados mediante huellas SHA-256. Para HEIC necesita el decodificador opcional `heic-decode` en `.media-tools/node_modules`.

El informe `scripts/reports/pathology-image-export.json` detalla cada archivo de origen y su destino, incluidos los archivos ya exportados, duplicados o fallidos. Sin `--apply`, el script solo audita los pendientes. No ejecuta la migración destructiva de `migrate-all.js` ni reemplaza los Markdown o videos.
