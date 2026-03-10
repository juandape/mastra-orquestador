import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { writeFileSafe } from '../utils/safeFileWriter.js';

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

const KATALON_RN = `// KATALON_INTEGRATION
// Instala: npm install @katalon/testops-jest
// Configura katalon.config.js con tu projectId
// Ver: https://docs.katalon.com/docs/test-ops/integrate-with-katalon-testops`;

const APPSFLYER_RN = `// APPSFLYER_INTEGRATION
import appsFlyer from 'react-native-appsflyer';

appsFlyer.initSdk(
  {
    devKey: 'YOUR_APPSFLYER_DEV_KEY',
    isDebug: false,
    appId: 'YOUR_APP_ID', // iOS App ID
  },
  (result) => console.log('[AppsFlyer] Init OK:', result),
  (error) => console.error('[AppsFlyer] Init Error:', error),
);`;

const GA_RN = `// GA_INTEGRATION
// Instala: npm install @react-native-firebase/analytics
// O: npm install react-native-google-analytics-bridge
import analytics from '@react-native-firebase/analytics';

// Uso: await analytics().logScreenView({ screen_name: 'Home' });`;

/** Detecta si el proyecto es React Native (no web) */
function esReactNative(proyectoPath: string): boolean {
  const pkgPath = path.join(proyectoPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return 'react-native' in deps || 'expo' in deps;
}

/**
 * Busca un archivo de analytics/tracking ya existente en el proyecto.
 * Devuelve la ruta si lo encuentra, null si no.
 */
function buscarArchivoAnalyticsExistente(proyectoPath: string): string | null {
  const candidatos = [
    'src/analytics.ts',
    'src/analytics.js',
    'src/analytics/index.ts',
    'src/analytics/index.js',
    'src/services/analytics.ts',
    'src/services/analytics.js',
    'src/services/tracking.ts',
    'src/services/tracking.js',
    'src/utils/analytics.ts',
    'src/utils/analytics.js',
    'src/lib/analytics.ts',
    'src/lib/analytics.js',
  ];
  for (const candidato of candidatos) {
    const ruta = path.join(proyectoPath, candidato);
    if (fs.existsSync(ruta)) return ruta;
  }
  return null;
}

/**
 * Busca si alguna integración ya está en App.tsx / App.jsx / app/_layout.tsx
 */
function buscarIntegracionEnEntryPoint(
  proyectoPath: string,
  marcador: string,
): boolean {
  const entryPoints = [
    'App.tsx',
    'App.jsx',
    'App.js',
    'app/_layout.tsx',
    'app/_layout.jsx',
    'src/App.tsx',
    'src/App.jsx',
  ];
  for (const ep of entryPoints) {
    const ruta = path.join(proyectoPath, ep);
    if (
      fs.existsSync(ruta) &&
      fs.readFileSync(ruta, 'utf8').includes(marcador)
    ) {
      return true;
    }
  }
  return false;
}

export const insertarTagsIntegracionTool = createTool({
  id: 'insertar-tags-integracion',
  description:
    'Detecta el tipo de proyecto (web o React Native) y las integraciones existentes. ' +
    'Para web inserta en public/index.html si no hay archivo de analytics JS/TS dedicado. ' +
    'Para React Native genera snippets de código para el archivo de analytics existente o App.tsx.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
  }),
  outputSchema: z.object({
    esReactNative: z.boolean(),
    archivoAnalyticsExistente: z.string().nullable(),
    katalon: z.boolean(),
    appsflyer: z.boolean(),
    googleAnalytics: z.boolean(),
    mensaje: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;
    const esRN = esReactNative(proyectoPath);
    const archivoAnalytics = buscarArchivoAnalyticsExistente(proyectoPath);

    // ── React Native: no hay public/index.html ────────────────────────────────
    if (esRN) {
      const snippets: string[] = [];
      let katalon = false,
        appsflyer = false,
        googleAnalytics = false;

      const katalonYaExiste =
        buscarIntegracionEnEntryPoint(proyectoPath, 'KATALON_INTEGRATION') ||
        (archivoAnalytics
          ? fs
              .readFileSync(archivoAnalytics, 'utf8')
              .includes('KATALON_INTEGRATION')
          : false);
      const appsflyerYaExiste =
        buscarIntegracionEnEntryPoint(proyectoPath, 'APPSFLYER_INTEGRATION') ||
        (archivoAnalytics
          ? fs
              .readFileSync(archivoAnalytics, 'utf8')
              .includes('APPSFLYER_INTEGRATION')
          : false);
      const gaYaExiste =
        buscarIntegracionEnEntryPoint(proyectoPath, 'GA_INTEGRATION') ||
        (archivoAnalytics
          ? fs.readFileSync(archivoAnalytics, 'utf8').includes('GA_INTEGRATION')
          : false);

      if (!katalonYaExiste) {
        snippets.push(KATALON_RN);
        katalon = true;
      }
      if (!appsflyerYaExiste) {
        snippets.push(APPSFLYER_RN);
        appsflyer = true;
      }
      if (!gaYaExiste) {
        snippets.push(GA_RN);
        googleAnalytics = true;
      }

      const destino =
        archivoAnalytics ?? path.join(proyectoPath, 'src', 'analytics.ts');
      const destinoEsNuevo = !fs.existsSync(destino);

      if (snippets.length > 0) {
        const contenidoActual = !destinoEsNuevo
          ? fs.readFileSync(destino, 'utf8')
          : '';
        const nuevoContenido = contenidoActual
          ? `${contenidoActual.trimEnd()}

${snippets.join('\n\n')}
`
          : `${snippets.join('\n\n')}
`;
        writeFileSafe(
          destino,
          nuevoContenido,
          'backup-overwrite',
          proyectoPath,
        );
      }

      const insertados = [
        katalon ? 'Katalon' : null,
        appsflyer ? 'AppsFlyer' : null,
        googleAnalytics ? 'Google Analytics' : null,
      ].filter(Boolean);

      const mensajeBase =
        insertados.length > 0
          ? `Snippets de React Native ${destinoEsNuevo ? 'creados en archivo nuevo' : 'agregados al archivo existente'}: ${insertados.join(', ')}`
          : 'Todas las integraciones ya estaban presentes.';

      return {
        esReactNative: true,
        archivoAnalyticsExistente: archivoAnalytics,
        katalon,
        appsflyer,
        googleAnalytics,
        mensaje: `${mensajeBase}\n📄 Archivo: ${destino}`,
      };
    }

    // ── Web: si hay archivo analytics JS/TS dedicado, no tocar index.html ─────
    if (archivoAnalytics) {
      const contenido = fs.readFileSync(archivoAnalytics, 'utf8');
      const snippets: string[] = [];
      let katalon = false,
        appsflyer = false,
        googleAnalytics = false;

      if (!contenido.includes('KATALON_INTEGRATION')) {
        snippets.push(
          `// KATALON_INTEGRATION\n// Configura @katalon/testops con tu projectId`,
        );
        katalon = true;
      }
      if (!contenido.includes('APPSFLYER_INTEGRATION')) {
        snippets.push(
          `// APPSFLYER_INTEGRATION\n// AppsFlyer es para móvil; considera omitir para web`,
        );
        appsflyer = true;
      }
      if (!contenido.includes('GA_INTEGRATION')) {
        snippets.push(
          `// GA_INTEGRATION\n` +
            `import ReactGA from 'react-ga4'\n` +
            `ReactGA.initialize('GA_MEASUREMENT_ID');`,
        );
        googleAnalytics = true;
      }

      if (snippets.length > 0) {
        const nuevoContenido = `${contenido.trimEnd()}\n\n${snippets.join('\n\n')}\n`;
        writeFileSafe(
          archivoAnalytics,
          nuevoContenido,
          'backup-overwrite',
          proyectoPath,
        );
      }

      const insertados = [
        katalon ? 'Katalon' : null,
        appsflyer ? 'AppsFlyer' : null,
        googleAnalytics ? 'Google Analytics' : null,
      ].filter(Boolean);

      return {
        esReactNative: false,
        archivoAnalyticsExistente: archivoAnalytics,
        katalon,
        appsflyer,
        googleAnalytics,
        mensaje:
          insertados.length > 0
            ? `Integraciones añadidas al archivo existente (${archivoAnalytics}): ${insertados.join(', ')}`
            : `Todas las integraciones ya estaban en ${archivoAnalytics}.`,
      };
    }

    // ── Web sin archivo analytics: insertar en public/index.html (CRA/Vite) ───
    const indexPath = path.join(proyectoPath, 'public', 'index.html');

    if (!fs.existsSync(indexPath)) {
      return {
        esReactNative: false,
        archivoAnalyticsExistente: null,
        katalon: false,
        appsflyer: false,
        googleAnalytics: false,
        mensaje:
          'No se encontró public/index.html ni un archivo de analytics existente. ' +
          'Crea src/analytics.ts o public/index.html antes de continuar.',
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

    const writeResult = writeFileSafe(
      indexPath,
      html,
      'backup-overwrite',
      proyectoPath,
    );

    const insertados = [
      katalon ? 'Katalon' : null,
      appsflyer ? 'AppsFlyer' : null,
      googleAnalytics ? 'Google Analytics' : null,
    ].filter(Boolean);

    const mensajeBase =
      insertados.length > 0
        ? `Tags insertados en public/index.html: ${insertados.join(', ')}`
        : 'Todos los tags ya estaban presentes en public/index.html.';

    const mensajeBackup = writeResult.backupPath
      ? `\n🔒 Backup guardado en:\n   ${writeResult.backupPath}`
      : '';

    return {
      esReactNative: false,
      archivoAnalyticsExistente: null,
      katalon,
      appsflyer,
      googleAnalytics,
      mensaje: mensajeBase + mensajeBackup,
    };
  },
});
