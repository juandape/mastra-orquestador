import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { writeFileSafe } from '../utils/safeFileWriter.js';

function pascalCase(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function parseOpenApiSpec(spec: any) {
  const schemas = spec.components?.schemas ?? {};
  const paths = spec.paths ?? {};
  const schemaList = Object.keys(schemas).map((k) => ({
    name: k,
    schema: schemas[k],
  }));
  const endpoints: Array<any> = [];

  for (const [p, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries<any>(methods as any)) {
      const operationId =
        op.operationId ?? `${method}_${p.replace(/[\/{}]/g, '_')}`;
      // try to resolve first request/response schema names
      let reqSchema = null;
      let respSchema = null;
      try {
        reqSchema =
          op.requestBody?.content?.['application/json']?.schema?.['$ref'];
        if (typeof reqSchema === 'string' && reqSchema.includes('/'))
          reqSchema = reqSchema.split('/').slice(-1)[0];
      } catch {}
      try {
        const responses = op.responses ?? {};
        const ok = responses['200'] || responses['201'] || responses['default'];
        respSchema = ok?.content?.['application/json']?.schema?.['$ref'];
        if (typeof respSchema === 'string' && respSchema.includes('/'))
          respSchema = respSchema.split('/').slice(-1)[0];
      } catch {}

      endpoints.push({
        path: p,
        method,
        operationId,
        requestSchema: reqSchema,
        responseSchema: respSchema,
        summary: op.summary ?? '',
      });
    }
  }

  return { schemaList, endpoints };
}

export const coredceGenerateFromContractTool = createTool({
  id: 'coredce-generate-from-contract',
  description:
    'Parsa un contrato OpenAPI/JSON (local o URL) y genera entidades, interfaces, repositorios y controllers en un proyecto CoreDCE siguiendo las convenciones existentes.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe(
        'Ruta absoluta al repositorio CoreDCE donde crear la estructura',
      ),
    contractPathOrUrl: z
      .string()
      .describe(
        'Ruta local o URL del contrato OpenAPI/JSON proporcionado por el backend',
      ),
    force: z
      .boolean()
      .optional()
      .describe('Si true, fuerza overwrite con backup (backup-overwrite)'),
    only: z
      .union([
        z.literal('entities'),
        z.literal('repos'),
        z.literal('controllers'),
        z.literal('all'),
      ])
      .optional()
      .describe(
        'Si se especifica, limita la generación a una parte: entities|repos|controllers|all',
      ),
  }),
  outputSchema: z.object({
    createdFiles: z.array(z.string()),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath, contractPathOrUrl, force, only } = context;

    // validar proyecto
    if (!fs.existsSync(proyectoPath)) {
      return {
        createdFiles: [],
        message: `Proyecto no encontrado: ${proyectoPath}`,
      };
    }

    let spec: any = null;
    try {
      if (/^https?:\/\//.test(contractPathOrUrl)) {
        const resp = await axios.get(contractPathOrUrl);
        spec = resp.data;
      } else {
        const raw = fs.readFileSync(contractPathOrUrl, 'utf8');
        spec = JSON.parse(raw);
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      return {
        createdFiles: [],
        message: `No se pudo leer/parsar el contrato: ${err}`,
      };
    }

    // Soporta OpenAPI-like o formato simplificado
    const { schemaList, endpoints } = parseOpenApiSpec(spec);

    // Asegurar directorios base
    const dirs = [
      'src/core/domain/entities',
      'src/core/domain/interfaces',
      'src/core/application',
      'src/core/infraestructure/controllers',
      'src/core/infraestructure/repositories',
      'src/core/infraestructure/dataSources',
      'src/helpers',
    ];
    for (const d of dirs) {
      const full = path.join(proyectoPath, d);
      if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    }

    const createdFiles: string[] = [];

    // Generar entidades sencillas desde schemas (si hay)
    if (!only || only === 'entities' || only === 'all') {
      for (const s of schemaList) {
        const name = s.name;
        const pascal = pascalCase(name);
        const fileName = safeFileName(name) + '.interface.ts';
        const filePath = path.join(
          proyectoPath,
          'src',
          'core',
          'domain',
          'interfaces',
          fileName,
        );
        const content = `// Auto-generado por mastra-orquestador — entidad ${pascal}\nexport interface ${pascal} {\n  // TODO: mapear propiedades desde el contrato\n  [key: string]: any\n}\n`;
        const mode = force ? 'backup-overwrite' : 'create-only';
        const res = writeFileSafe(filePath, content, mode as any, proyectoPath);
        createdFiles.push(res.finalPath);
      }
    }

    // Para cada endpoint generar: entidad request/response, interfaz repo, repoImp y controller
    for (const ep of endpoints) {
      const op = ep.operationId || ep.path.replace(/[^a-z0-9]/gi, '_');
      const pascal = pascalCase(op);
      const safeName = safeFileName(op);

      // entidades (request/response)
      // entidades (request/response)
      if (
        !only ||
        only === 'entities' ||
        only === 'all' ||
        only === 'repos' ||
        only === 'controllers'
      ) {
        const entitiesPath = path.join(
          proyectoPath,
          'src',
          'core',
          'domain',
          'entities',
          `${safeName}.ts`,
        );
        const entitiesContent = `// Auto-generado: entidades para ${pascal}\nexport interface ${pascal}Request {\n  // TODO: mapear campos del request desde el contrato\n  [key: string]: any\n}\n\nexport interface ${pascal}Response {\n  // TODO: mapear campos de la respuesta desde el contrato\n  [key: string]: any\n}\n`;
        createdFiles.push(
          writeFileSafe(
            entitiesPath,
            entitiesContent,
            force ? 'backup-overwrite' : 'create-only',
            proyectoPath,
          ).finalPath,
        );
      }

      // interfaz repo
      if (!only || only === 'repos' || only === 'all') {
        const ifacePath = path.join(
          proyectoPath,
          'src',
          'core',
          'domain',
          'interfaces',
          `${safeName}.interface.ts`,
        );
        const ifaceContent = `import { AsyncApiResponse } from '../../infraestructure/dataSources/response.model'\nimport { ${pascal}Request, ${pascal}Response } from '../entities/${safeName}'\n\nexport interface ${pascal}Repository {\n  ${safeName}(data: ${pascal}Request): AsyncApiResponse<${pascal}Response>\n}\n`;
        createdFiles.push(
          writeFileSafe(
            ifacePath,
            ifaceContent,
            force ? 'backup-overwrite' : 'create-only',
            proyectoPath,
          ).finalPath,
        );

        // repo implementation
        const repoImpPath = path.join(
          proyectoPath,
          'src',
          'core',
          'infraestructure',
          'repositories',
          `${safeName}.repositoryImp.ts`,
        );
        const repoImpContent = `import { ${pascal}Request, ${pascal}Response } from '../../domain/entities/${safeName}'\nimport { HeadersValues } from '../../../helpers/Constants'\nimport { RequestProps } from '../dataSources/request.model'\nimport { AsyncApiResponse } from '../dataSources/response.model'\nimport { sendRequest } from '../dataSources/sendRequest'\nimport { ${pascal}Repository } from '../../domain/interfaces/${safeName}.interface'\n\nexport class ${pascal}RepositoryImp implements ${pascal}Repository {\n  async ${safeName}(data: ${pascal}Request): AsyncApiResponse<${pascal}Response> {\n    const request: RequestProps = {\n      postEncrypted: {\n        path: '${ep.path}',\n        body: data,\n        api: 'apiKey',\n      },\n      connection: {\n        encrypted: true,\n        portal: HeadersValues.PBN_ID,\n        isAuthorized: false,\n        requiresSymmetric: true,\n      },\n    }\n    return await sendRequest<${pascal}Response>(request)\n  }\n}\n`;
        createdFiles.push(
          writeFileSafe(
            repoImpPath,
            repoImpContent,
            force ? 'backup-overwrite' : 'create-only',
            proyectoPath,
          ).finalPath,
        );
      }

      // controller
      if (!only || only === 'controllers' || only === 'all') {
        const controllerPath = path.join(
          proyectoPath,
          'src',
          'core',
          'infraestructure',
          'controllers',
          `${safeName}.controller.ts`,
        );
        const controllerContent = `import { ${pascal}Repository } from '../../domain/interfaces/${safeName}.interface'\n\nexport const create${pascal}Controller = (repo: ${pascal}Repository) => ({\n  async execute(data: any) {\n    return await repo.${safeName}(data)\n  },\n})\n`;
        createdFiles.push(
          writeFileSafe(
            controllerPath,
            controllerContent,
            force ? 'backup-overwrite' : 'create-only',
            proyectoPath,
          ).finalPath,
        );
      }
    }

    const mensaje = `Generación completada. Archivos escritos o propuestos en _staging/: ${createdFiles.length} elementos.`;
    return { createdFiles, message: mensaje };
  },
});

export default coredceGenerateFromContractTool;
