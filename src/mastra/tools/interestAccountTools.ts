import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { invokeHttpEndpointTool } from './httpTools.js';

const PAYMENT_HISTORY_PATH =
  '/api/cbf-loandepo-interest-account/v0/payment-history';
const AMOUNT_RANGE_PATH =
  '/api/cbf-loandepo-interest-account/v0/amount-range-projection';
const ACCRUED_DETAIL_PATH =
  '/api/cbf-loandepo-interest-account/v0/accrued-detail';

export const getPaymentHistoryTool = createTool({
  id: 'interest-account-get-payment-history',
  description:
    'Llama al endpoint payment-history (POST) y devuelve la respuesta.',
  inputSchema: z.object({
    apiBaseUrl: z
      .string()
      .describe('Base URL del backend (ej: http://localhost:3000)'),
    body: z.any().describe('Payload del request (JSON)'),
    timeout: z.number().optional(),
  }),
  outputSchema: z.object({
    status: z.number(),
    data: z.any(),
    message: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { apiBaseUrl, body, timeout = 15000 } = context as any;
    if (!apiBaseUrl)
      return { status: 0, data: null, message: 'apiBaseUrl es requerido' };
    // Delegate to generic HTTP tool
    const resp: any = await invokeHttpEndpointTool.execute({
      context: {
        apiBaseUrl,
        path: PAYMENT_HISTORY_PATH,
        method: 'POST',
        body,
        timeout,
      },
    });
    return resp;
  },
});

export const getAmountRangeProjectionTool = createTool({
  id: 'interest-account-get-amount-range-projection',
  description:
    'Llama al endpoint amount-range-projection (POST) y devuelve la respuesta.',
  inputSchema: z.object({
    apiBaseUrl: z
      .string()
      .describe('Base URL del backend (ej: http://localhost:3000)'),
    body: z.any().describe('Payload del request (JSON)'),
    timeout: z.number().optional(),
  }),
  outputSchema: z.object({
    status: z.number(),
    data: z.any(),
    message: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { apiBaseUrl, body, timeout = 15000 } = context as any;
    if (!apiBaseUrl)
      return { status: 0, data: null, message: 'apiBaseUrl es requerido' };
    const resp: any = await invokeHttpEndpointTool.execute({
      context: {
        apiBaseUrl,
        path: AMOUNT_RANGE_PATH,
        method: 'POST',
        body,
        timeout,
      },
    });
    return resp;
  },
});

export const getAccruedDetailTool = createTool({
  id: 'interest-account-get-accrued-detail',
  description:
    'Llama al endpoint accrued-detail (POST) y devuelve la respuesta.',
  inputSchema: z.object({
    apiBaseUrl: z
      .string()
      .describe('Base URL del backend (ej: http://localhost:3000)'),
    body: z.any().describe('Payload del request (JSON)'),
    timeout: z.number().optional(),
  }),
  outputSchema: z.object({
    status: z.number(),
    data: z.any(),
    message: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { apiBaseUrl, body, timeout = 15000 } = context as any;
    if (!apiBaseUrl)
      return { status: 0, data: null, message: 'apiBaseUrl es requerido' };
    const resp: any = await invokeHttpEndpointTool.execute({
      context: {
        apiBaseUrl,
        path: ACCRUED_DETAIL_PATH,
        method: 'POST',
        body,
        timeout,
      },
    });
    return resp;
  },
});

export default {
  getPaymentHistoryTool,
  getAmountRangeProjectionTool,
  getAccruedDetailTool,
};
