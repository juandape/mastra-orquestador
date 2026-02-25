import 'dotenv/config';
import { Mastra } from '@mastra/core';

import { analisisAgente } from './agents/analisisAgente.js';
import { historiasAgente } from './agents/historiasAgente.js';
import { pantallasAgente } from './agents/pantallasAgente.js';
import { testsAgente } from './agents/testsAgente.js';
import { integracionesAgente } from './agents/integracionesAgente.js';
import { sonarqubeAgente } from './agents/sonarqubeAgente.js';
import { mediadorAgente } from './agents/mediadorAgente.js';
import { orquestadorWorkflow } from './workflows/orquestadorWorkflow.js';

export const mastra = new Mastra({
  agents: {
    'analisis-agente': analisisAgente,
    'historias-agente': historiasAgente,
    'pantallas-agente': pantallasAgente,
    'tests-agente': testsAgente,
    'integraciones-agente': integracionesAgente,
    'sonarqube-agente': sonarqubeAgente,
    'mediador-agente': mediadorAgente,
  },
  workflows: {
    'orquestador-workflow': orquestadorWorkflow,
  },
});
