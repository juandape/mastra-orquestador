// Agente para revisión de historias de usuario
const fs = require('fs');
const path = require('path');

module.exports.revisarHistorias = async function revisarHistorias() {
  console.log('Revisando historias de usuario...');
  // Busca historias en un archivo stories.json o stories.md
  const storiesPath = path.resolve(process.cwd(), '../stories.json');
  if (fs.existsSync(storiesPath)) {
    const historias = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
    historias.forEach((h, i) => {
      console.log(`Historia ${i + 1}: ${h.titulo || h.title}`);
      console.log(`Descripción: ${h.descripcion || h.description}`);
    });
  } else {
    console.log(
      'No se encontró stories.json. Agrega tus historias de usuario en ese archivo.',
    );
  }
  console.log('Revisión de historias completa.');
};
