- [ ] Verificar requisitos del proyecto
- [ ] Instalar dependencias con `npm install` o `yarn install`
- [ ] Configurar agentes en `/agents` (incluye análisis, historias, pantallas, tests, integraciones y SonarQube/seguridad)
- [ ] Ejecutar flujos desde `/workflows`
- [ ] Personalizar integración con Figma, Katalon, Appsflyer y Google Analytics
- [ ] Revisar cobertura de tests (>83%)
- [ ] Validar SonarQube y brechas de seguridad
- [ ] Documentar integraciones API

## Uso paso a paso en cualquier proyecto React/React Native

1. Copia la carpeta `mastra-orquestador` a la raíz de tu proyecto.
2. Ejecuta `npm install` o `yarn install` dentro de `mastra-orquestador`.
3. Configura los agentes en `/agents` según tus reglas y necesidades (incluye el agente de SonarQube/seguridad).
4. Ejecuta los flujos de trabajo desde `/workflows` para automatizar tareas.
5. Personaliza la integración con Figma, Katalon, Appsflyer y Google Analytics en `/utils`.
6. Asegúrate de que los tests unitarios superen el 83% de cobertura (`npm test` o `yarn test`).
7. Ejecuta el agente de SonarQube/seguridad para validar calidad y vulnerabilidades.
8. Documenta y revisa las integraciones API en `/utils` y `/workflows`.

## Arquitectura Hexagonal

El orquestador sigue una arquitectura hexagonal (Ports & Adapters):

- `/agents`: lógica de negocio (dominio)
- `/workflows`: orquestación (aplicación)
- `/utils`: adaptadores y utilidades
- `/src`: punto de entrada y configuración

> Este orquestador es independiente del framework y puede adaptarse a cualquier estructura de proyecto React o React Native.
