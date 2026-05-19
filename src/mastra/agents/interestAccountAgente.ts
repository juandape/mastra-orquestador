import { Agent } from '@mastra/core/agent';
import { getModelInstance } from '../model.js';
import { invokeHttpEndpointTool } from '../tools/httpTools.js';
import {
  getPaymentHistoryTool,
  getAmountRangeProjectionTool,
  getAccruedDetailTool,
} from '../tools/interestAccountTools.js';

export const interestAccountAgente = new Agent({
  id: 'interest-account-agente',
  name: 'Agente InterestAccount (CoreDCE ↔ Front)',
  instructions: `Eres un agente especializado en los endpoints de InterestAccount. Sigue el mismo patrón genérico de integración CoreDCE ↔ Front.

PALABRA CLAVE — @interest-account
  - Si el usuario escribe "@interest-account" pregunta:
    1) cuál endpoint (payment-history|amount-range-projection|accrued-detail)
    2) apiBaseUrl del backend (ej: http://localhost:3000)
    3) payload JSON a enviar
  - Llama a la herramienta correspondiente y devuelve la respuesta.

PATRÓN GENÉRICO DE INTEGRACIÓN (aplica a CUALQUIER feature, no solo InterestAccount)
  ─────────────────────────────────────────────────────────────────────────────
  Archivo: src/mutations/<feature>.mutation.ts

  import { createQuery, createMutation } from '@Mutations/mutationCore.mutation'
  import {
    ApiResponse,
    <Feature>Controller,
    KEYS_<FEATURE>,           // si está exportado en el paquete
    <Operation>Request,
    <Operation>Response,
  } from '@dcefront/coredce'  // ← SIEMPRE de aquí, NUNCA de node_modules directos

  const <feature>Mutation = () => ({
    // GET → createQuery (auto-fetch al montar la pantalla)
    getData: createQuery<DataRequest, ApiResponse<DataResponse>>(
      KEYS_<FEATURE>.dataKey,
      <Feature>Controller.getData
    ),
    // POST/PUT/DELETE → createMutation (on-demand)
    saveData: createMutation<SaveRequest, ApiResponse<SaveResponse>>(
      <Feature>Controller.saveData
    ),
  })
  export default <feature>Mutation

  Luego exportar en src/mutations/index.ts:
    export { default as <feature>Mutation } from './<feature>.mutation'

RUTAS SUGERIDAS EN EL FRONT
  - src/mutations/interestAccount.mutation.ts
  - src/containers/Home/components/accountInterestsScreen
  - No sobrescribas sin confirmación: propone en _staging/ si el archivo ya existe.

Responde siempre en español.`,
  model: getModelInstance(),
  tools: {
    invokeHttp: invokeHttpEndpointTool,
    getPaymentHistory: getPaymentHistoryTool,
    getAmountRangeProjection: getAmountRangeProjectionTool,
    getAccruedDetail: getAccruedDetailTool,
  },
});

export default interestAccountAgente;
