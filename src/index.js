// Punto de entrada del orquestador Mastra
const { analizarProyecto } = require('../agents/analisisAgente');
const { revisarHistorias } = require('../agents/historiasAgente');
const { crearPantallas } = require('../agents/pantallasAgente');
const { ejecutarTests } = require('../agents/testsAgente');
const { integrarHerramientas } = require('../agents/integracionesAgente');
const { validarSonarQube } = require('../agents/sonarqubeAgente');

async function main() {
  console.log('--- MASRTA ORQUESTADOR ---');
  await analizarProyecto();
  await revisarHistorias();
  await crearPantallas();
  await ejecutarTests();
  await integrarHerramientas();
  await validarSonarQube();
  console.log('--- FLUJO COMPLETO ---');
}

main();
