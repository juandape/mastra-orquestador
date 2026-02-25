import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const generarPantallasTool = createTool({
  id: 'generar-pantallas',
  description:
    'Genera archivos de componentes React (index.jsx) en src/screens para cada historia de usuario proporcionada. Opcionalmente asocia una imagen de Figma.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto React'),
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
    pantallasGeneradas: z.array(z.string()),
    mensaje: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath, historias, imagenFigma } = context;
    const screensDir = path.join(proyectoPath, 'src', 'screens');

    if (!fs.existsSync(screensDir)) {
      fs.mkdirSync(screensDir, { recursive: true });
    }

    const generadas: string[] = [];

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

      const archivoComponente = path.join(nombreDir, 'index.jsx');
      if (!fs.existsSync(archivoComponente)) {
        const descripcion = historia.descripcion || '';
        fs.writeFileSync(
          archivoComponente,
          `// Pantalla generada para: ${historia.titulo}
// Descripción: ${descripcion}
// Imagen de referencia: figma.png

import React from 'react';

export default function ${nombre}() {
  return (
    <div>
      <h1>${historia.titulo}</h1>
      <p>${descripcion}</p>
    </div>
  );
}
`,
        );
        generadas.push(archivoComponente);
      }
    }

    return {
      pantallasGeneradas: generadas,
      mensaje:
        generadas.length > 0
          ? `Se generaron ${generadas.length} pantalla(s) en src/screens.`
          : 'Todas las pantallas ya existían.',
    };
  },
});
