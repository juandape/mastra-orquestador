#!/usr/bin/env node
/**
 * src/index.ts — CLI principal de mastra-orquestador
 *
 * Flujo:
 *  1. Cargar .env local
 *  2. Setup wizard si faltan credenciales / modelo
 *  3. Pedir historia de usuario + imagen de diseño (opcional)
 *  4. Pedir ruta del proyecto (por defecto: directorio actual)
 *  5. Ejecutar el workflow completo
 *  6. Mostrar resumen con resultados por etapa
 *  7. Chat interactivo con el mediador (opcional)
 */

// ── Las variables de entorno deben cargarse ANTES de importar @ai-sdk/openai ──
import { cargarEnv, runSetup, preguntar } from './setup.js';
cargarEnv(); // 1️⃣ carga el .env que exista antes de cualquier import de OpenAI

import readline from 'readline';
import path from 'path';
import fs from 'fs';

// ── Separador visual ──────────────────────────────────────────────────────────
const SEP = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

function titulo(texto: string): void {
  console.log(`\n${SEP}`);
  console.log(`  ${texto}`);
  console.log(`${SEP}\n`);
}

function paso(n: number, total: number, texto: string): void {
  console.log(`\n  [${n}/${total}] ${texto}...`);
}

// ── Lectura multilínea ────────────────────────────────────────────────────────
async function leerMultilinea(
  rl: readline.Interface,
  instruccion: string,
  finToken = 'FIN',
): Promise<string> {
  console.log(instruccion);
  const lineas: string[] = [];
  return new Promise<string>((resolve) => {
    const listener = (line: string): void => {
      if (line.trim() === finToken) {
        rl.removeListener('line', listener);
        resolve(lineas.join('\n'));
      } else {
        lineas.push(line);
      }
    };
    rl.on('line', listener);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n');
  console.log(
    '╔══════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║         🤖  MASTRA ORQUESTADOR  v2.0                        ║',
  );
  console.log(
    '║         Agentes IA para React / React Native                 ║',
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝',
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // ── 2. Setup wizard (solo si no hay config) ───────────────────────────────
    await runSetup(rl);

    // Importar mastra DESPUÉS del setup para que OpenAI ya tenga la key
    const { mastra } = await import('./mastra/index.js');

    // ── 3. Historia de usuario ────────────────────────────────────────────────
    titulo('📖  CUÉNTAME QUÉ QUIERES CONSTRUIR');

    console.log(
      '  Describe la funcionalidad o historia de usuario que quieres',
    );
    console.log('  implementar. Puedes ser tan detallado como quieras.\n');
    console.log('  Ejemplo:');
    console.log('    "Como usuario quiero iniciar sesión con Google para');
    console.log('     acceder a mi cuenta. La pantalla debe tener logo,');
    console.log(
      '     campo de email y botón de inicio de sesión con Google."\n',
    );

    const historiasRaw = await leerMultilinea(
      rl,
      '  ✏️  Escribe (o pega) tu historia. Cuando termines escribe FIN en una línea nueva:\n',
    );

    if (!historiasRaw.trim()) {
      console.log('\n  ⚠️  No escribiste ninguna historia. Terminando.\n');
      rl.close();
      process.exit(0);
    }

    // ── 4. Imagen de diseño (Figma u otro) ────────────────────────────────────
    titulo('🎨  DISEÑO DE REFERENCIA (OPCIONAL)');

    console.log('  Si tienes un diseño en Figma, Zeplin u otro editor,');
    console.log('  puedes pasarlo aquí. Acepta:\n');
    console.log('    • URL pública de Figma (https://www.figma.com/...)');
    console.log('    • Ruta a una imagen local  (/home/user/diseño.png)');
    console.log('    • Deja vacío si no tienes diseño todavía\n');

    const imagenFigma = await preguntar(
      rl,
      '  🔗  URL o ruta de imagen (Enter para omitir): ',
    );

    // ── 5. Ruta del proyecto ──────────────────────────────────────────────────
    titulo('📁  ¿EN QUÉ PROYECTO TRABAJAMOS?');

    const dirActual = process.cwd();
    console.log(`  Directorio actual: ${dirActual}\n`);

    const rutaIngresada = await preguntar(
      rl,
      '  📂  Ruta del proyecto (Enter para usar el directorio actual): ',
    );

    const proyectoPath = rutaIngresada
      ? path.resolve(rutaIngresada)
      : dirActual;

    // Validar que la ruta existe y tiene package.json
    if (!fs.existsSync(path.join(proyectoPath, 'package.json'))) {
      console.log(`\n  ⚠️  No se encontró package.json en: ${proyectoPath}`);
      console.log(
        '      Asegúrate de que la ruta apunta a la raíz de tu proyecto.\n',
      );
      rl.close();
      process.exit(1);
    }

    console.log(`\n  ✅  Proyecto: ${proyectoPath}\n`);
    rl.close();

    // ── 6. Ejecutar workflow ──────────────────────────────────────────────────
    titulo('🚀  INICIANDO FLUJO DE TRABAJO');

    console.log('  El orquestador ejecutará los siguientes pasos:\n');
    console.log('   1. Análisis del proyecto existente');
    console.log('   2. Revisión y estructuración de tu historia');
    console.log('   3. Generación de componentes React');
    console.log('   4. Verificación de estándares frontend');
    console.log('   5. Ejecución de tests y cobertura');
    console.log('   6. Integración de tags (Katalon, AppsFlyer, Analytics)');
    console.log('   7. Análisis de seguridad (SonarQube + npm audit)');
    console.log('\n  Esto puede tomar algunos minutos...\n');

    const TOTAL_PASOS = 7;
    paso(1, TOTAL_PASOS, 'Analizando estructura del proyecto');

    const workflow = mastra.getWorkflow('orquestador-workflow');
    const run = workflow.createRun();

    const result = await run.start({
      triggerData: {
        proyectoPath,
        historiasRaw,
        imagenFigma: imagenFigma || undefined,
      },
    });

    // ── 7. Mostrar resultados ─────────────────────────────────────────────────
    console.log('\n');
    console.log(
      '╔══════════════════════════════════════════════════════════════╗',
    );
    console.log(
      '║                  ✅  RESUMEN DE RESULTADOS                   ║',
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n',
    );

    if (result.results) {
      const res = result.results as Record<string, any>;

      const imprimirEtapa = (
        stepId: string,
        etiqueta: string,
        campo: string,
      ): void => {
        const stepResult = res[stepId];
        if (!stepResult) return;
        if (stepResult.status === 'success') {
          const texto: string = stepResult.output?.[campo] ?? '';
          console.log(`${SEP}`);
          console.log(`  ${etiqueta}\n`);
          // Mostrar las primeras 600 caracteres del resumen
          const preview =
            texto.length > 600
              ? texto.slice(0, 600) +
                '\n  ...(ver proyecto para detalle completo)'
              : texto;
          console.log(`  ${preview.replace(/\n/g, '\n  ')}`);
          console.log('');
        } else if (stepResult.status === 'failed') {
          console.log(`${SEP}`);
          console.log(`  ${etiqueta}  ⚠️  Error en este paso`);
          console.log(`  ${stepResult.error ?? 'Sin detalle'}`);
          console.log('');
        }
      };

      imprimirEtapa(
        'analizar-proyecto',
        '📊  ANÁLISIS DEL PROYECTO',
        'resumenAnalisis',
      );
      imprimirEtapa(
        'revisar-historias',
        '📖  HISTORIAS DE USUARIO',
        'resumenHistorias',
      );
      imprimirEtapa(
        'generar-pantallas',
        '🖥️   COMPONENTES GENERADOS',
        'resumenPantallas',
      );
      imprimirEtapa(
        'verificar-standards',
        '📐  ESTÁNDARES FRONTEND',
        'resumenStandards',
      );
      imprimirEtapa('ejecutar-tests', '🧪  TESTS Y COBERTURA', 'resumenTests');
      imprimirEtapa(
        'aplicar-integraciones',
        '🔌  INTEGRACIONES',
        'resumenIntegraciones',
      );
      imprimirEtapa(
        'validar-seguridad',
        '🔒  SEGURIDAD Y CALIDAD',
        'resumenSeguridad',
      );

      console.log(SEP);
      console.log(
        '\n  ✅  Flujo completado. Revisa tu proyecto para ver los cambios.\n',
      );
    } else {
      console.log('  ⚠️  El flujo no devolvió resultados. Revisa los logs.\n');
    }

    // ── 8. Chat interactivo con el mediador ───────────────────────────────────
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const seguir = await preguntar(
      rl2,
      '💬  ¿Tienes alguna pregunta sobre los resultados? (s/n): ',
    );

    if (['s', 'si', 'sí', 'yes', 'y'].includes(seguir.toLowerCase())) {
      const mediador = mastra.getAgent('mediador-agente');

      console.log('\n  🤖  Modo consulta — escribe "salir" para terminar\n');
      console.log(
        '  Puedes preguntar sobre cualquier parte del proceso o pedir',
      );
      console.log('  que se explique algún resultado con más detalle.\n');
      console.log(SEP + '\n');

      const chatLoop = async (): Promise<void> => {
        const msg = await preguntar(rl2, '  Tú: ');
        if (!msg || msg.toLowerCase() === 'salir') {
          rl2.close();
          console.log('\n  👋  ¡Hasta luego!\n');
          return;
        }
        process.stdout.write('\n  🤖  Mediador: ');
        const response = await mediador.generate(msg);
        console.log(response.text + '\n');
        console.log(SEP + '\n');
        await chatLoop();
      };

      await chatLoop();
    } else {
      rl2.close();
      console.log('\n  👋  ¡Proceso completado!\n');
    }
  } catch (error) {
    console.error(
      '\n  ❌  Error inesperado:',
      error instanceof Error ? error.message : error,
    );
    console.error(
      '      Si el problema persiste, verifica tu OPENAI_API_KEY en el archivo .env\n',
    );
    rl.close();
    process.exit(1);
  }
}

main();
