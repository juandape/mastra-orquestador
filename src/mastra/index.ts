import { Mastra } from '@mastra/core';

import { analisisAgente } from './agents/analisisAgente.js';
import { historiasAgente } from './agents/historiasAgente.js';
import { pantallasAgente } from './agents/pantallasAgente.js';
import { testsAgente } from './agents/testsAgente.js';
import { integracionesAgente } from './agents/integracionesAgente.js';
import { sonarqubeAgente } from './agents/sonarqubeAgente.js';
import { mediadorAgente } from './agents/mediadorAgente.js';
import { coredceAgente } from './agents/coredceAgente.js';
import { coredceEntitiesAgente } from './agents/coredceEntitiesAgente.js';
import { coredceReposAgente } from './agents/coredceReposAgente.js';
import { orquestadorWorkflow } from './workflows/orquestadorWorkflow.js';

// Widened type annotation to avoid TS2742 (inferred type referencing internal dist files)
export const mastra: Mastra = new Mastra({
  agents: {
    'analisis-agente': analisisAgente,
    'historias-agente': historiasAgente,
    'pantallas-agente': pantallasAgente,
    'tests-agente': testsAgente,
    'coredce-agente': coredceAgente,
    'coredce-entities-agente': coredceEntitiesAgente,
    'coredce-repos-agente': coredceReposAgente,
    'integraciones-agente': integracionesAgente,
    'sonarqube-agente': sonarqubeAgente,
    'mediador-agente': mediadorAgente,
  },
  workflows: {
    'orquestador-workflow': orquestadorWorkflow,
  },
}) as Mastra;
