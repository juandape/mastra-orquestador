// Agente para revisión de historias de usuario
const fs = require('fs');
const path = require('path');

module.exports.revisarHistorias = async function revisarHistorias() {
  console.log(
    'Por favor, pega tus historias de usuario en formato JSON y presiona Enter dos veces:',
  );
  const stdin = process.stdin;
  let input = '';
  stdin.setEncoding('utf8');
  for await (const chunk of stdin) {
    if (chunk.trim() === '') break;
    input += chunk;
  }
  let historias = [];
  try {
    // Intentar parsear como JSON
    historias = JSON.parse(input);
    if (!Array.isArray(historias)) historias = [historias];
  } catch {
    // Si no es JSON, intentar extraer historias de Markdown o texto plano
    const lines = input.split(/\r?\n/);
    let actual = {};
    for (const line of lines) {
      if (/^(Historia|#|\*|\d+\.)/i.test(line)) {
        if (Object.keys(actual).length) historias.push(actual);
        actual = { titulo: line.replace(/^(Historia|#|\*|\d+\.)/i, '').trim() };
      } else if (/^(Descripción|Descripcion|:|-)/i.test(line)) {
        actual.descripcion = line
          .replace(/^(Descripción|Descripcion|:|-)/i, '')
          .trim();
      } else if (line.trim()) {
        actual.descripcion = (actual.descripcion || '') + ' ' + line.trim();
      }
    }
    if (Object.keys(actual).length) historias.push(actual);
  }
  if (historias.length) {
    historias.forEach((h, i) => {
      console.log(`Historia ${i + 1}: ${h.titulo || h.title || 'Sin título'}`);
      console.log(
        `Descripción: ${h.descripcion || h.description || 'Sin descripción'}`,
      );
    });
    console.log('Revisión de historias completa.');
  } else {
    console.error('No se detectaron historias válidas.');
  }
};
