const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconSizes = [72, 96, 128, 144, 152, 192, 288, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generowanie ikon PNG z SVG...');

  // Sprawdź czy sharp jest zainstalowany
  try {
    require('sharp');
  } catch (error) {
    console.error('❌ Sharp nie jest zainstalowany. Uruchom: npm install sharp --save-dev');
    process.exit(1);
  }

  // Sprawdź czy plik SVG istnieje
  if (!fs.existsSync(inputSvg)) {
    console.error('❌ Nie znaleziono pliku icon.svg');
    process.exit(1);
  }

  // Utwórz katalog jeśli nie istnieje
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svgContent = fs.readFileSync(inputSvg);

  // Generuj ikony dla każdego rozmiaru
  for (const size of iconSizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgContent)
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 9,
          progressive: true
        })
        .toFile(outputPath);
      
      console.log(`✅ Utworzono: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Błąd podczas tworzenia ikony ${size}x${size}:`, error.message);
    }
  }

  // Utworz favicon.ico (32x32)
  try {
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(svgContent)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('✅ Utworzono favicon.png (skopiuj jako favicon.ico)');
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia favicon:', error.message);
  }

  console.log('🎉 Zakończono generowanie ikon!');
}

// Uruchom jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  generateIcons().catch(console.error);
}

module.exports = { generateIcons }; 