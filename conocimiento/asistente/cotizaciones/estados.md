---
titulo: Estados de una cotización
dueno: "area-cotizaciones"
revisado: 2026-11-26
permiso: cotizador:leer
---

# Estados de una cotización

Una cotización es un proyecto en el ERP. Su estado vive en el campo `estado`.

## Estado inicial

- Una cotización nueva nace en **activa** (la creación la fija así en el servidor).

## Transiciones por defecto

Estas son las transiciones que usa el sistema cuando la base no define otra matriz:

| Desde | Puede pasar a |
|---|---|
| activa | enviada, perdida, cancelada |
| enviada | activa, negociacion, en_contrato, perdida, cancelada |
| negociacion | en_contrato, enviada, perdida, cancelada |
| en_contrato | pre_produccion, retoma, negociacion, perdida, cancelada |
| retoma | en_contrato, pre_produccion, perdida, cancelada |
| pre_produccion | produccion, retoma, cancelada |
| produccion | entregado, retoma, pre_produccion, cancelada |
| entregado | produccion, perdida, cancelada |
| perdida | (ninguno: estado final) |
| cancelada | (ninguno: estado final) |

Si en la base existe la configuración `transiciones_proyecto` y define un estado, esa configuración manda sobre la tabla anterior.

## Qué no hace el asistente

- El asistente **no cambia el estado** de una cotización. Para cambiarlo, el empleado usa la pantalla del cotizador.
- Crear una cotización con el asistente siempre deja el proyecto en **activa**.

Fuente en el código: `lib/data/transiciones-proyecto.ts` y `crearProyectoAction` en `lib/data/actions/core.ts`.
