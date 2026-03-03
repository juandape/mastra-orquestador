# Mastra Orquestador de Agentes para Proyectos React/React Native

Este orquestador automatiza y evalúa actividades clave en proyectos React/React Native usando agentes inteligentes y flujos Mastra. Es independiente del framework (CRA, Next.js, Expo, etc.) y puede adaptarse a cualquier estructura de proyecto.

## ¿Qué automatiza este orquestador?

- Análisis de la estructura y dependencias del proyecto
- Revisión y mejora de historias de usuario
- Generación de pantallas/componentes React a partir de historias y Figma
- Ejecución de tests unitarios y verificación de cobertura (>83%)
- Integración automática de Katalon, AppsFlyer y Google Analytics
- Análisis de calidad y seguridad con SonarQube y npm audit

## Estructura del proyecto

- `/agents`: scripts legacy (no se usan si usas Mastra, solo referencia)
- `/src/mastra/agents`: agentes Mastra (TypeScript)
- `/src/mastra/workflows`: flujos Mastra
- `/src/mastra/tools`: herramientas auxiliares
- `/src/index.ts`: entry point CLI
- `/utils`: utilidades compartidas

## ¿Cómo usarlo en cualquier proyecto React/React Native?

### 1. Instala el orquestador

Clona o copia la carpeta `mastra-orquestador` dentro de tu proyecto:

```sh
git clone <repo-url> mastra-orquestador
# o copia la carpeta manualmente
```

### 2. Instala dependencias

```sh
cd mastra-orquestador
npm install
# o
yarn install
```

### 3. Configura los agentes y herramientas

Edita los archivos en `/src/mastra/agents` y `/src/mastra/tools` para personalizar reglas, prompts o integraciones según tu stack.

### 4. Ejecuta el orquestador

Desde la raíz del orquestador:

```sh
npm start
# o
yarn start
```

El CLI te pedirá:

- Ruta absoluta del proyecto a analizar
- Descripción de la funcionalidad a implementar
- Historias de usuario (en texto, JSON o Markdown)
- (Opcional) Imagen de Figma

### 5. Integra los resultados

El orquestador ejecuta el siguiente flujo:

1. **Análisis del proyecto**: estructura y dependencias
2. **Revisión de historias de usuario**
3. **Generación de pantallas/componentes**
4. **Ejecución de tests y cobertura**
5. **Integraciones (Katalon, AppsFlyer, Google Analytics)**
6. **Análisis de calidad y seguridad (SonarQube, npm audit)**

Al finalizar, tendrás un resumen de seguridad y recomendaciones. Puedes adaptar cada paso editando los agentes o el workflow.

## Requisitos

- Node.js >= 18
- Acceso a la carpeta del proyecto React/React Native

## Arquitectura

El orquestador sigue una arquitectura hexagonal (Ports & Adapters):

- **/src/mastra/agents**: lógica de negocio (dominio)
- **/src/mastra/workflows**: orquestación (aplicación)
- **/utils**: adaptadores y utilidades
- **/src**: punto de entrada y configuración

Esto desacopla la lógica de los agentes de las integraciones externas y facilita pruebas y mantenibilidad.

```sh
npm start
```

## Personalización

- Modifica los agentes en `/src/mastra/agents` para adaptarlos a tus reglas o herramientas.
- Agrega o edita herramientas en `/src/mastra/tools`.
- Cambia el flujo en `/src/mastra/workflows/orquestadorWorkflow.ts` si necesitas pasos adicionales.

---

> **Nota:** Los scripts legacy en `/agents` ya no se usan directamente. Toda la lógica debe estar en `/src/mastra/agents` y el workflow.
