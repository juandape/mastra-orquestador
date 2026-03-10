import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { writeFileSafe } from '../utils/safeFileWriter.js';

/**
 * Detecta el directorio de screens/pages del proyecto en el siguiente orden:
 * src/screens/ → src/pages/ → src/app/ → src/views/ → app/ → (fallback a src/screens/)
 */
function detectarScreensDir(proyectoPath: string): string {
  const candidatos = [
    path.join(proyectoPath, 'src', 'screens'),
    path.join(proyectoPath, 'src', 'pages'),
    path.join(proyectoPath, 'src', 'app'),
    path.join(proyectoPath, 'src', 'views'),
    path.join(proyectoPath, 'app'),
  ];
  for (const dir of candidatos) {
    if (fs.existsSync(dir)) return dir;
  }
  // Fallback: crear en src/screens/
  return path.join(proyectoPath, 'src', 'screens');
}

/**
 * Detecta si el proyecto usa TypeScript (.tsx/.ts) o JavaScript (.jsx/.js)
 */
function detectarExtension(proyectoPath: string): '.tsx' | '.jsx' {
  const tsConfig = path.join(proyectoPath, 'tsconfig.json');
  if (fs.existsSync(tsConfig)) return '.tsx';
  return '.jsx';
}

/**
 * Detecta si el proyecto es React Native (usa View/Text en vez de div/h1)
 */
function esReactNative(proyectoPath: string): boolean {
  const pkgPath = path.join(proyectoPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return 'react-native' in deps || 'expo' in deps;
}

export const generarPantallasTool = createTool({
  id: 'generar-pantallas',
  description:
    'Detecta la estructura de rutas/screens del proyecto y genera los componentes en el directorio existente. ' +
    'Si ya existe una pantalla, la propuesta va a _staging/. Adapta la sintaxis al framework (RN vs web, TS vs JS).',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto React'),
    screensDir: z
      .string()
      .optional()
      .describe(
        'Directorio destino de pantallas detectado por analisisAgente. ' +
          'Si se omite, la herramienta lo detecta automáticamente.',
      ),
    historias: z
      .array(
        z.object({
          titulo: z.string(),
          descripcion: z.string().optional(),
        }),
      )
      .describe('Lista de historias de usuario con título y descripción'),
    imagenFigma: z
      .string()
      .optional()
      .describe(
        'URL, base64 (data:image/png;base64,...) o ruta local de la imagen de Figma',
      ),
  }),
  outputSchema: z.object({
    screensDir: z.string(),
    pantallasGeneradas: z.array(z.string()),
    pantallasEnStaging: z.array(z.string()),
    mensaje: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath, historias, imagenFigma } = context;

    const screensDir = context.screensDir ?? detectarScreensDir(proyectoPath);
    const ext = detectarExtension(proyectoPath);
    const esRN = esReactNative(proyectoPath);

    if (!fs.existsSync(screensDir)) {
      fs.mkdirSync(screensDir, { recursive: true });
    }

    const generadas: string[] = [];
    const enStaging: string[] = [];

    for (const historia of historias) {
      const nombre = historia.titulo.replace(/\s+/g, '');
      const nombreDir = path.join(screensDir, nombre);

      if (!fs.existsSync(nombreDir)) {
        fs.mkdirSync(nombreDir, { recursive: true });
      }

      // Guardar imagen de Figma si se proporcionó
      if (imagenFigma) {
        const imgPath = path.join(nombreDir, 'figma.png');
        if (imagenFigma.startsWith('data:image/png;base64,')) {
          const base64 = imagenFigma.replace('data:image/png;base64,', '');
          fs.writeFileSync(imgPath, base64, 'base64');
        } else if (imagenFigma.endsWith('.png') && fs.existsSync(imagenFigma)) {
          fs.copyFileSync(imagenFigma, imgPath);
        } else if (/^https?:\/\//.test(imagenFigma)) {
          try {
            const resp = await axios({
              url: imagenFigma,
              responseType: 'arraybuffer',
            });
            fs.writeFileSync(imgPath, resp.data as Buffer);
          } catch {
            // No bloquear el flujo si la imagen no se puede descargar
          }
        }
      }

      const archivoComponente = path.join(nombreDir, `index${ext}`);
      const descripcion = historia.descripcion ?? '';

      // ── Plantilla adaptada al framework ───────────────────────────────────
      const contenidoComponente = esRN
        ? `// Pantalla generada para: ${historia.titulo}\n// Descripción: ${descripcion}\n// Imagen de referencia: figma.png\n\nimport React from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\n\nexport default function ${nombre}() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.titulo}>${historia.titulo}</Text>\n      <Text>${descripcion}</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, padding: 16 },\n  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },\n});\n`
        : `// Pantalla generada para: ${historia.titulo}\n// Descripción: ${descripcion}\n// Imagen de referencia: figma.png\n\nimport React from 'react';\n\nexport default function ${nombre}() {\n  return (\n    <div>\n      <h1>${historia.titulo}</h1>\n      <p>${descripcion}</p>\n    </div>\n  );\n}\n`;

      // ── Escritura segura: nunca sobrescribe producción ────────────────────
      const resultado = writeFileSafe(
        archivoComponente,
        contenidoComponente,
        'create-only',
        proyectoPath,
      );

      if (resultado.finalPath === archivoComponente) {
        generadas.push(resultado.finalPath);
      } else {
        enStaging.push(resultado.finalPath);
      }
    }

    const mensajePartes: string[] = [];
    if (generadas.length > 0)
      mensajePartes.push(
        `✅ ${generadas.length} pantalla(s) creadas en ${screensDir}.`,
      );
    if (enStaging.length > 0)
      mensajePartes.push(
        `⚠️  ${enStaging.length} pantalla(s) ya existían en producción. ` +
          `Sus propuestas se guardaron en _staging/ para revisión manual.`,
      );
    if (mensajePartes.length === 0)
      mensajePartes.push('Sin cambios: ninguna pantalla fue procesada.');

    return {
      screensDir,
      pantallasGeneradas: generadas,
      pantallasEnStaging: enStaging,
      mensaje: mensajePartes.join('\n'),
    };
  },
});
