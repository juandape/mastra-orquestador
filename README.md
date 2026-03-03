# Mastra Orquestador de Agentes para Proyectos React/React Native

Librería de agentes IA con Mastra que automatiza las tareas de desarrollo en proyectos React y React Native. Describe lo que quieres construir y los agentes hacen el resto.

## ¿Qué hace?

1. **Analiza** la estructura, dependencias y framework de tu proyecto
2. **Entiende** tu historia de usuario y la estructura en pantallas concretas
3. **Genera** los componentes React adaptados a tu framework (CRA, Next.js, Expo, etc.)
4. **Verifica** los estándares de código si tu proyecto tiene script `standards`
5. **Ejecuta** los tests unitarios y reporta cobertura (umbral mínimo: 83%)
6. **Agrega** tags de Katalon, AppsFlyer y Google Analytics
7. **Audita** seguridad con SonarQube y npm audit

## Uso como CLI (la forma más fácil)

```sh
# Ejecutar sin instalar nada
npx mastra-orquestador

# O instalar globalmente
npm install -g mastra-orquestador
mastra-orquestador
```

**No necesitas configurar nada antes.** El CLI te guía paso a paso:

1. Te pregunta qué modelo de IA quieres usar (con opciones claras)
2. Te pide tu API Key de OpenAI y la guarda automáticamente en `.env`
3. Te pide tu historia de usuario en texto libre
4. Te pide (opcionalmente) una imagen de diseño de Figma u otro editor
5. Detecta automáticamente tu proyecto en la carpeta actual (o te deja especificar otra)
6. Ejecuta todos los pasos y te muestra un resumen completo

> **Primer uso**: se mostrará el asistente de configuración. Las siguientes veces arranca directamente.

## Instalación como librería

```sh
npm install mastra-orquestador
```

### Configurar variables de entorno

```sh
# .env de tu proyecto
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o    # opcional — el CLI te ayuda a elegirlo
```

> La librería **no inicializa dotenv** por sí sola. Llama a `cargarEnv()` antes de importar los agentes, o carga las vars con tu mecanismo habitual (Next.js lo hace automáticamente).

## Uso programático

```typescript
import { cargarEnv, mastra, orquestadorWorkflow } from 'mastra-orquestador';

// Carga el .env local antes de iniciar los agentes
cargarEnv();

// Ejecutar el flujo completo
const workflow = mastra.getWorkflow('orquestador-workflow');
const run = workflow.createRun();

const result = await run.start({
  triggerData: {
    proyectoPath: '/ruta/absoluta/a/mi-app',
    historiasRaw: `
      Como usuario quiero poder iniciar sesión con Google
      para acceder a mi cuenta de forma segura y rápida.
      La pantalla debe mostrar el logo de la app, un campo
      de email y un botón "Continuar con Google".
    `,
    imagenFigma: 'https://figma.com/... (opcional)',
  },
});

console.log(result.result?.resumenSeguridad);
```

## Uso de agentes individualmente

```typescript
import { mediadorAgente, analisisAgente } from 'mastra-orquestador';

// Chat con el mediador
const respuesta = await mediadorAgente.generate(
  '¿Qué pasos debo seguir para implementar autenticación?'
);
console.log(respuesta.text);

// Analizar un proyecto específico
const analisis = await analisisAgente.generate(
  'Analiza el proyecto en /home/user/mi-app y busca implementaciones de "auth"'
);
console.log(analisis.text);
```

## Sub-paths disponibles

```typescript
// Todos los exports (recomendado)
import { mastra, mediadorAgente, orquestadorWorkflow } from 'mastra-orquestador';

// Solo agentes
import { analisisAgente, historiasAgente } from 'mastra-orquestador/agents';

// Solo herramientas
import { analizarEstructuraTool } from 'mastra-orquestador/tools';

// Solo el workflow
import { orquestadorWorkflow } from 'mastra-orquestador/workflows';
```

## Uso como CLI (desarrollo local)

Clona el repositorio y ejecuta directamente:

```sh
git clone https://github.com/juandape/mastra-orquestador.git
cd mastra-orquestador
npm install
cp .env.example .env        # completa OPENAI_API_KEY
npm run dev                  # modo interactivo CLI
npm run mastra:dev           # playground visual de Mastra
```

## Estructura del proyecto

```
src/
├── lib.ts                    ← Entry point de librería (exporta todo)
├── index.ts                  ← Entry point CLI (modo interactivo)
├── setup.ts                  ← Wizard de configuración (modelo + API Key)
└── mastra/
    ├── index.ts              ← Instancia Mastra
    ├── agents/
    │   ├── index.ts          ← Barrel de agentes
    │   ├── analisisAgente.ts ← Análisis + standards
    │   ├── historiasAgente.ts
    │   ├── integracionesAgente.ts
    │   ├── mediadorAgente.ts
    │   ├── pantallasAgente.ts
    │   ├── sonarqubeAgente.ts
    │   └── testsAgente.ts
    ├── tools/
    │   ├── index.ts          ← Barrel de herramientas
    │   ├── proyectoTools.ts  ← analizarEstructura + buscarImplementaciones + ejecutarStandards
    │   ├── pantallasTools.ts
    │   ├── testsTools.ts
    │   ├── integracionesTools.ts
    │   └── sonarqubeTools.ts
    └── workflows/
        └── orquestadorWorkflow.ts
```

## Flujo del workflow (`orquestador-workflow`)

| Paso | ID del step             | Qué hace                                                 |
| ---- | ----------------------- | -------------------------------------------------------- |
| 1    | `analizar-proyecto`     | Lee estructura, dependencias y scripts del proyecto      |
| 2    | `revisar-historias`     | Estructura la historia de usuario en pantallas concretas |
| 3    | `generar-pantallas`     | Genera componentes React en `src/screens/<Pantalla>/`    |
| 4    | `verificar-standards`   | Ejecuta `npm run standards` si el proyecto lo tiene      |
| 5    | `ejecutar-tests`        | Tests con cobertura (umbral 83%)                         |
| 6    | `aplicar-integraciones` | Inserta tags de Katalon, AppsFlyer y Google Analytics    |
| 7    | `validar-seguridad`     | SonarQube + npm audit                                    |

## Modelos de IA disponibles

El CLI te permite elegir en el primer uso:

| #   | Modelo        | Descripción                    |
| --- | ------------- | ------------------------------ |
| 1   | `gpt-4o`      | ⭐ Recomendado — el más capaz  |
| 2   | `gpt-4o-mini` | 💰 Económico — rápido y barato |
| 3   | `gpt-4-turbo` | 🚀 Potente — gran contexto     |

Todos requieren una `OPENAI_API_KEY`. Obtenla en https://platform.openai.com/api-keys

## Publicar en npm

```sh
npm run build   # compila a dist/ y aplica chmod +x al CLI
npm publish     # prepublishOnly ejecuta build automáticamente
```

## Arquitectura

- **`src/setup.ts`** — wizard de configuración: selección de modelo y guardado de API Key
- **`src/lib.ts`** — entry point de librería: re-exporta agents, tools, workflow y utils de setup
- **`src/mastra/agents`** — lógica de cada agente IA
- **`src/mastra/workflows`** — orquestación con `.step().then().commit()`
- **`src/mastra/tools`** — adaptadores a sistemas externos (fs, execSync, axios)
- **`src/index.ts`** — CLI interactivo con UX guiada paso a paso

- Cambia el flujo en `/src/mastra/workflows/orquestadorWorkflow.ts` si necesitas pasos adicionales.

---

> **Nota:** Los scripts legacy en `/agents` ya no se usan directamente. Toda la lógica debe estar en `/src/mastra/agents` y el workflow.
