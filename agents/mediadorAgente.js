// Agente mediador: solicita toda la información al usuario, coordina subagentes y muestra resultados
const historiasAgente = require('./historiasAgente');
const pantallasAgente = require('./pantallasAgente');
const analisisAgente = require('./analisisAgente');
const testsAgente = require('./testsAgente');
const integracionesAgente = require('./integracionesAgente');
const sonarqubeAgente = require('./sonarqubeAgente');

module.exports.ejecutarMediador = async function ejecutarMediador() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 1. Solicitar historias
  console.log('--- MEDIADOR MASRTA ---');
  console.log(
    'Pega tus historias de usuario (JSON, Markdown o texto plano) y presiona Enter dos veces:',
  );
  let historiasInput = await new Promise((resolve) => {
    let input = '';
    rl.on('line', (line) => {
      if (line.trim() === '') {
        rl.removeAllListeners('line');
        resolve(input);
      } else {
        input += line + '\n';
      }
    });
  });
  // Procesar historias y guardar en global
  let historias = [];
  try {
    historias = JSON.parse(historiasInput);
    if (!Array.isArray(historias)) historias = [historias];
  } catch {
    // Extraer de texto plano/markdown
    const lines = historiasInput.split(/\r?\n/);
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
  if (!historias.length) {
    console.error('No se detectaron historias válidas.');
    rl.close();
    return;
  }
  global.__historiasProcesadas = historias;
  console.log('Historias procesadas:', historias);

  // 2. Solicitar imagen PNG (URL, base64 o ruta)
  console.log(
    '\nPega la URL, base64 o ruta de archivo PNG de la imagen de Figma y presiona Enter dos veces:',
  );
  let imagenInput = await new Promise((resolve) => {
    let input = '';
    rl.on('line', (line) => {
      if (line.trim() === '') {
        rl.removeAllListeners('line');
        resolve(input);
      } else {
        input += line + '\n';
      }
    });
  });
  global.__imagenFigma = imagenInput.trim();

  // 3. Ejecutar subagentes
  await analisisAgente.analizarProyecto();
  await historiasAgente.revisarHistorias();
  await pantallasAgente.crearPantallas();
  await testsAgente.ejecutarTests();
  await integracionesAgente.integrarHerramientas();
  await sonarqubeAgente.validarSonarQube();

  // 4. Mostrar resumen
  console.log('\n--- RESULTADOS GENERADOS ---');
  console.log('Pantallas generadas en src/screens');
  console.log(
    'Integraciones y análisis completados. Revisa la consola y carpetas para más detalles.',
  );
  rl.close();
};
