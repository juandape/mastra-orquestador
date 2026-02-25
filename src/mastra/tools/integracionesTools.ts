import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const CATALON_TAG = `<!-- KATALON_TAG --><script src="https://cdn.katalon.com/agent.js"></script>`;
const APPSFLYER_TAG = `<!-- APPSFLYER_TAG --><script src="https://cdn.appsflyer.com/agent.js"></script>`;
const GA_TAG = `<!-- GA_TAG -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>`;

export const insertarTagsIntegracionTool = createTool({
  id: 'insertar-tags-integracion',
  description:
    'Inserta scripts de Katalon, AppsFlyer y Google Analytics en el public/index.html del proyecto si no existen ya.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
  }),
  outputSchema: z.object({
    katalon: z.boolean(),
    appsflyer: z.boolean(),
    googleAnalytics: z.boolean(),
    mensaje: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;
    const indexPath = path.join(proyectoPath, 'public', 'index.html');

    if (!fs.existsSync(indexPath)) {
      return {
        katalon: false,
        appsflyer: false,
        googleAnalytics: false,
        mensaje: `No se encontró ${indexPath}. Crea el archivo public/index.html primero.`,
      };
    }

    let html = fs.readFileSync(indexPath, 'utf8');
    let katalon = false;
    let appsflyer = false;
    let googleAnalytics = false;

    if (!html.includes('<!-- KATALON_TAG -->')) {
      html = html.replace('</head>', `${CATALON_TAG}\n</head>`);
      katalon = true;
    }
    if (!html.includes('<!-- APPSFLYER_TAG -->')) {
      html = html.replace('</head>', `${APPSFLYER_TAG}\n</head>`);
      appsflyer = true;
    }
    if (!html.includes('<!-- GA_TAG -->')) {
      html = html.replace('</head>', `${GA_TAG}\n</head>`);
      googleAnalytics = true;
    }

    fs.writeFileSync(indexPath, html, 'utf8');

    const insertados = [
      katalon ? 'Katalon' : null,
      appsflyer ? 'AppsFlyer' : null,
      googleAnalytics ? 'Google Analytics' : null,
    ].filter(Boolean);

    return {
      katalon,
      appsflyer,
      googleAnalytics,
      mensaje:
        insertados.length > 0
          ? `Tags insertados: ${insertados.join(', ')}`
          : 'Todos los tags ya estaban presentes.',
    };
  },
});
