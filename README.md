# Mastra Orquestador de Agentes para Proyectos React/React Native

Este proyecto permite orquestar agentes independientes para automatizar y evaluar actividades clave en proyectos de React y React Native, sin importar el framework utilizado.

## Características principales

- Análisis independiente del proyecto actual
- Revisión de historias de usuario
- Creación de pantallas según historias y Figma
- Tests unitarios con cobertura >83%
- Implementación de Katalon, Appsflyer y Google Analytics
- Revisión e implementación de integraciones API

## Estructura sugerida

- `/agents`: Lógica de agentes independientes
- `/workflows`: Orquestación y flujos de trabajo
- `/utils`: Utilidades compartidas

## Uso en cualquier proyecto React/React Native

1. Clona o copia este orquestador en tu proyecto.
2. Configura los agentes según tus necesidades (ver `/agents`).
3. Ejecuta los flujos desde `/workflows` según el análisis o tarea requerida.
4. Integra los resultados en tu pipeline de desarrollo.

## Requisitos

- Node.js >= 18
- Acceso a los archivos del proyecto React/React Native

## Instalación

```sh
cd mastra-orquestador
npm install
```

## Ejecución

```sh
npm start
```

## Personalización

- Modifica los agentes en `/agents` para adaptarlos a tus reglas o herramientas.
- Agrega integraciones en `/utils` según tus necesidades.

---

> **Nota:** Este orquestador es independiente del framework (CRA, Next.js, Expo, etc.) y puede adaptarse a cualquier estructura de proyecto React/React Native.
