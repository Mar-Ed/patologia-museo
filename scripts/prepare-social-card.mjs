import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#f5f3ee"/>
<rect x="70" y="70" width="8" height="490" fill="#7a2c2c"/>
<text x="110" y="150" font-family="Arial" font-size="22" fill="#66706c">UNIVERSIDAD NACIONAL DE CAJAMARCA</text>
<text x="110" y="260" font-family="Georgia" font-size="65" fill="#16231d">Museo de Patología</text>
<text x="110" y="340" font-family="Georgia" font-size="65" fill="#7a2c2c">Veterinaria</text>
<text x="110" y="425" font-family="Arial" font-size="26" fill="#66706c">Colección científica y educativa</text>
<text x="110" y="530" font-family="Arial" font-size="23" fill="#16231d">www.museopatologiaveterinaria.com</text>
</svg>`;
const logo = await sharp("public/logo.png").resize(200, 200, { fit: "inside" }).png().toBuffer();
await sharp(Buffer.from(svg)).composite([{ input: logo, left: 920, top: 215 }]).png().toFile("public/social-card.png");
console.log("Social card: public/social-card.png (1200 × 630)");
