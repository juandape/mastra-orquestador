import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';

export const invokeHttpEndpointTool = createTool({
  id: 'invoke-http-endpoint',
  description:
    'Realiza una petición HTTP genérica (GET/POST/PUT/PATCH/DELETE) contra un backend. Útil para integrar cualquier endpoint desde agentes.',
  inputSchema: z.object({
    apiBaseUrl: z
      .string()
      .describe('Base URL del backend, ej: http://localhost:3000'),
    path: z.string().describe('Ruta del endpoint, ej: /api/foo'),
    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
      .optional()
      .describe('Método HTTP (por defecto POST)'),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    params: z.any().optional(),
    timeout: z.number().optional(),
  }),
  outputSchema: z.object({
    status: z.number(),
    data: z.any(),
    headers: z.any().optional(),
    message: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const {
      apiBaseUrl,
      path,
      method = 'POST',
      headers = {},
      body = undefined,
      params = undefined,
      timeout = 15000,
    } = context as any;

    if (!apiBaseUrl || !path) {
      return {
        status: 0,
        data: null,
        message: 'apiBaseUrl y path son requeridos',
      };
    }

    try {
      const url = `${apiBaseUrl.replace(/\/$/, '')}${path}`;
      const resp = await axios.request({
        url,
        method: (method as string).toLowerCase() as any,
        headers,
        data: body,
        params,
        timeout,
      });
      return { status: resp.status, data: resp.data, headers: resp.headers };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { status: -1, data: null, message: msg };
    }
  },
});

export default invokeHttpEndpointTool;
