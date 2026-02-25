// Punto de entrada del orquestador Mastra
const { analizarProyecto } = require('../agents/analisisAgente');
const { revisarHistorias } = require('../agents/historiasAgente');
const { crearPantallas } = require('../agents/pantallasAgente');
const { ejecutarTests } = require('../agents/testsAgente');
const { integrarHerramientas } = require('../agents/integracionesAgente');

async function main() {
  console.log('--- MASRTA ORQUESTADOR ---');
  await analizarProyecto();
  await revisarHistorias();
  await crearPantallas();
  await ejecutarTests();
  await integrarHerramientas();
  console.log('--- FLUJO COMPLETO ---');
}

main();
