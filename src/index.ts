import 'dotenv/config';
import readline from 'readline';
import { mastra } from './mastra/index.js';

async function pregunta(
  rl: readline.Interface,
  prompt: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    MASTRA ORQUESTADOR - v2.0           ║');
  console.log('║    Agentes IA para React/React Native  ║');
  console.log('╚════════════════════════════════════════╝\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Recopilar información del usuario
    const proyectoPath = await pregunta(
      rl,
      '📁 Ruta absoluta al proyecto React/React Native: ',
    );

    const funcionalidad = await pregunta(
      rl,
      '💡 Describe brevemente la funcionalidad a implementar: ',
    );

    console.log(
      '\n📝 Pega tus historias de usuario (JSON, Markdown o texto plano).',
    );
    console.log('   Escribe "FIN" en una línea nueva cuando termines:\n');
    let historiasRaw = '';
    const lineasHistorias: string[] = [];
    await new Promise<void>((resolve) => {
      rl.on('line', (line) => {
        if (line.trim() === 'FIN') {
          rl.removeAllListeners('line');
          resolve();
        } else {
          lineasHistorias.push(line);
        }
      });
    });
    historiasRaw = lineasHistorias.join('\n');

    const imagenFigma = await pregunta(
      rl,
      '\n🎨 URL/base64/ruta de imagen Figma (opcional, Enter para omitir): ',
    );

    rl.close();

    // Ejecutar el workflow completo
    console.log('\n🚀 Iniciando flujo de trabajo con Mastra...\n');

    const workflow = mastra.getWorkflow('orquestador-workflow');
    const run = workflow.createRun();

    const result = await run.start({
      triggerData: {
        proyectoPath,
        funcionalidad,
        historiasRaw,
        imagenFigma: imagenFigma || undefined,
      },
    });

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         RESUMEN DE RESULTADOS          ║');
    console.log('╚════════════════════════════════════════╝\n');

    if (result.result) {
      console.log('✅ Flujo completado exitosamente.\n');
      console.log('📋 Informe de seguridad y calidad:');
      console.log(result.result.resumenSeguridad ?? 'Sin informe disponible.');
    } else {
      console.error('❌ El flujo terminó sin resultado final.');
    }

    // Modo interactivo: chatear con el mediador para consultas adicionales
    const interactivo = await new Promise<string>((resolve) => {
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl2.question(
        '\n💬 ¿Deseas hacer consultas adicionales al mediador? (s/n): ',
        (a) => {
          rl2.close();
          resolve(a.trim().toLowerCase());
        },
      );
    });

    if (interactivo === 's' || interactivo === 'si' || interactivo === 'sí') {
      const rl3 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const mediador = mastra.getAgent('mediador-agente');

      console.log(
        '\n🤖 Modo interactivo con el Mediador (escribe "salir" para terminar):\n',
      );

      const chat = async () => {
        rl3.question('Tú: ', async (input) => {
          if (input.toLowerCase() === 'salir') {
            rl3.close();
            console.log('\n👋 ¡Hasta luego!');
            return;
          }
          const response = await mediador.generate(input);
          console.log(`\nMediador: ${response.text}\n`);
          chat();
        });
      };

      await chat();
    } else {
      console.log('\n👋 ¡Proceso completado!');
    }
  } catch (error) {
    rl.close();
    console.error(
      '❌ Error inesperado:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
