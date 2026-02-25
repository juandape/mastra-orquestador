// Agente para ejecución de tests unitarios y verificación de cobertura
const { execSync } = require('child_process');

module.exports.ejecutarTests = async function ejecutarTests() {
  console.log('Ejecutando tests unitarios...');
  try {
    const output = execSync('npm test -- --coverage --json --outputFile=coverage.json', { stdio: 'pipe' }).toString();
    const coverage = require('../../coverage/coverage-summary.json');
    const pct = coverage.total.statements.pct;
    console.log(`Cobertura de statements: ${pct}%`);
    if (pct < 83) {
      console.warn('La cobertura es menor al 83%. Mejora tus tests.');
    } else {
      console.log('Cobertura OK (>83%)');
    }
  } catch (e) {
    console.error('Error ejecutando tests:', e.message);
  }
  console.log('Tests ejecutados y cobertura verificada.');
};
