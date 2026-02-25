// Agente para creación de pantallas según historias y Figma
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.crearPantallas = async function crearPantallas() {
  console.log('Creando pantallas según historias y Figma...');
  // Ejemplo: leer historias y crear carpetas de pantallas
  const storiesPath = path.resolve(process.cwd(), '../stories.json');
  const screensDir = path.resolve(process.cwd(), '../src/screens');
  if (fs.existsSync(storiesPath)) {
    const historias = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
    if (!fs.existsSync(screensDir))
      fs.mkdirSync(screensDir, { recursive: true });
    historias.forEach((h) => {
      const nombre = h.titulo || h.title || 'Pantalla';
      const nombreDir = path.join(screensDir, nombre.replace(/\s+/g, ''));
      if (!fs.existsSync(nombreDir)) fs.mkdirSync(nombreDir);
      // Crea un archivo base para la pantalla
      const archivo = path.join(nombreDir, 'index.jsx');
      if (!fs.existsSync(archivo)) {
        fs.writeFileSync(
          archivo,
          `// Pantalla generada para: ${nombre}\nexport default function ${nombre.replace(/\s+/g, '')}() {\n  return <div>${nombre}</div>;\n}`,
        );
      }
    });
    console.log('Pantallas generadas en src/screens.');
  } else {
    console.log('No se encontró stories.json. No se pueden crear pantallas.');
  }
  // (Opcional) Integración con Figma: puedes agregar aquí lógica para consumir la API de Figma
  // ...
};
