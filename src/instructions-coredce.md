## Descripción

Este conjunto de agentes y tools automáticos generan la estructura mínima en un proyecto CoreDCE a partir del contrato API (OpenAPI/JSON) que provee el backend. La idea es que, dado un endpoint y su contrato, los agentes creen entidades, interfaces, repositorios (implementaciones que usan `sendRequest`) y controllers siguiendo las convenciones existentes en `BluCoreDCE`.

## Palabra clave de inicialización

Usa la palabra clave `@coredce` para activar este flujo. Ejemplo de prompt en el chat de Copilot o en el agente mediador:

@coredce
contrato: ./specs/customer-api.json
proyecto: /Users/juan.pena/Projects/Blu20/BluCoreDCE
forzar: no

## Comportamiento

- Valida que la ruta del proyecto exista.
- Parsea el contrato OpenAPI/JSON (local o URL).
- Genera/propone archivos en las carpetas:
  - `src/core/domain/entities/`
  - `src/core/domain/interfaces/`
  - `src/core/infraestructure/repositories/`
  - `src/core/infraestructure/controllers/`
- Si el archivo existe, crea una propuesta en `_staging/` (no sobrescribe por defecto).
- Si `forzar: si`, sobrescribe con backup (`.bak.TIMESTAMP`).

## Cómo se integra con GitHub Copilot / VS Code

1. Abre el workspace que contiene `mastra-orquestador` y tu proyecto CoreDCE en la misma ventana de VS Code.
2. En el chat de Copilot en modo `Agent`, escribe el prompt con `@coredce` y los parámetros.
3. Copilot invocará la herramienta MCP `coredce-generate-from-contract` y devolverá el listado de archivos creados o propuestos en `_staging/`.

## Uso con modelo externo (agentes Mastra autónomos)

Si prefieres ejecutar el flujo sin Copilot, configura un proveedor de IA en `.env` (por ejemplo `AI_PROVIDER=openai` con su `API_KEY`) y usa el agente `coredce-agente` directamente. El agente hará las mismas preguntas interactivas (contrato, ruta de proyecto, forzar) y ejecutará la tool.

## Notas de seguridad y buenas prácticas

- Los archivos generados contienen `TODO` para que el desarrollador ajuste tipos y detalles de mapeo explícitos del contrato.
- El agente respeta la regla de oro: no modifica código en producción sin aprobación explícita.
- Revisa las propuestas en `_staging/` antes de integrar.
