// Agente para creación de pantallas según historias y Figma
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Este agente solo recibe imágenes (URL/base64) y toma la información de historias desde el agente de historias
const historiasAgente = require('./historiasAgente');

module.exports.crearPantallas = async function crearPantallas() {
  console.log(
    'Pega la URL, base64 o ruta de archivo PNG de la imagen de Figma y presiona Enter dos veces:',
  );
  const stdin = process.stdin;
  let imagen = '';
  stdin.setEncoding('utf8');
  for await (const chunk of stdin) {
    if (chunk.trim() === '') break;
    imagen += chunk;
  }
  imagen = imagen.trim();
  // Obtener historias procesadas por el agente de historias
  let historias = global.__historiasProcesadas;
  if (!historias) {
    console.error(
      'No hay historias procesadas. Ejecuta primero el agente de historias.',
    );
    return;
  }
  if (historias.length) {
    const screensDir = path.resolve(process.cwd(), '../src/screens');
    if (!fs.existsSync(screensDir))
      fs.mkdirSync(screensDir, { recursive: true });
    historias.forEach((h, idx) => {
      const nombre = h.titulo || h.title || `Pantalla${idx + 1}`;
      const nombreDir = path.join(screensDir, nombre.replace(/\s+/g, ''));
      if (!fs.existsSync(nombreDir)) fs.mkdirSync(nombreDir);
      // Manejo de imagen PNG
      let imagenGuardada = '';
      if (imagen.startsWith('data:image/png;base64,')) {
        // Imagen en base64
        const base64Data = imagen.replace('data:image/png;base64,', '');
        imagenGuardada = path.join(nombreDir, 'figma.png');
        fs.writeFileSync(imagenGuardada, base64Data, 'base64');
      } else if (imagen.endsWith('.png') && fs.existsSync(imagen)) {
        // Ruta de archivo local
        imagenGuardada = path.join(nombreDir, 'figma.png');
        fs.copyFileSync(imagen, imagenGuardada);
      } else if (/^https?:\/\//.test(imagen)) {
        // URL remota
        imagenGuardada = path.join(nombreDir, 'figma.png');
        axios({ url: imagen, responseType: 'arraybuffer' })
          .then((resp) => fs.writeFileSync(imagenGuardada, resp.data))
          .catch(() => console.warn('No se pudo descargar la imagen remota.'));
      }
      // Crea un archivo base para la pantalla, asociando la imagen
      const archivo = path.join(nombreDir, 'index.jsx');
      if (!fs.existsSync(archivo)) {
        fs.writeFileSync(
          archivo,
          `// Pantalla generada para: ${nombre}\n// Imagen de referencia: figma.png\nexport default function ${nombre.replace(/\s+/g, '')}() {\n  return <div>${nombre}</div>;\n}`,
        );
      }
    });
    console.log('Pantallas generadas en src/screens.');
  } else {
    console.error('No se detectaron historias válidas.');
  }
  // (Opcional) Integración con Figma: puedes agregar aquí lógica para consumir la API de Figma
  // ...
};
