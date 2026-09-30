# Decisiones cerradas — fuente única de verdad

Este archivo existe para resolver un problema concreto detectado el 2026-09-30: una decisión (ej. el precio del diseño 3D) podía estar cerrada e implementada en código, pero seguía documentada como "abierta" en más de una decena de archivos de planeación histórica — un agente nuevo caía en cualquiera de esos archivos y volvía a tratarla como pendiente.

**Regla de oro:** si una decisión de negocio está cerrada, su única fila de verdad vive aquí. No se repite en ningún otro archivo nuevo. Si un archivo histórico la menciona, ese archivo es contexto de cómo se llegó a la decisión — no la fuente de si sigue vigente.

**Cómo se actualiza:** Javier (Supervisor) puede editar esta tabla directamente, sin pasar por un agente. Un agente solo la edita cuando cierra una decisión nueva con checkpoint explícito del Supervisor en la misma conversación.

| Decisión | Valor / resolución | Dónde vive en código | Cerrada |
|---|---|---|---|
| Precio de la asesoría con diseño 3D | $130.000 + IVA (2 espacios), parámetro configurable, no hardcodeado. Deducible del anticipo. | `parametros` (clave `precio_asesoria_3d`, seed en `lib/data/fixtures.ts:73`), más `neto_diseno_3d_pct`/`iva_diseno_3d_pct` en el mismo módulo | 2026-08-08 |
| Modal de contrato requiere cliente vinculado | Resuelto: selector de cliente real en el modal, con opción explícita "Sin cliente — se crea con los datos de abajo". Ya no es callejón sin salida. | `app/erp/cotizador/ContratoModal.tsx` (t-169) | 2026-09-29 (commit `a8d028a`) |
| Foco de la V3 (2026-09-30) | El esfuerzo activo se concentra en el ciclo núcleo: cotizador (definidor de proyecto) → ficha de proyecto → contrato → seguimiento, más la primitiva UI agnóstica de selector/creador de entidad. **Decisión final tras auditoría de dependencias (no borrado masivo):** de 10 módulos candidatos, solo `gates` se elimina (cero entrelazamiento real, confirmado por auditoría — el supuesto acoplamiento contrato↔cronograma no existía en código, era duplicación de parámetros de negocio). Los otros 9 (`comercial`, `taller`, `compras`, `equipo`, `herramientas`, `pedidos-web`, `portafolio`, `catalogos/espacios-arquitectonicos`, `garantia`) son funcionales y algunos son backend real de funciones públicas vivas (`portafolio` y `garantia` alimentan el sitio público) — **quedan congelados, no se borran.** "Congelado" significa: no se planifica trabajo nuevo ahí sin pedido explícito del Supervisor, pero el código se queda tal cual, funcional, editable cuando haga falta. | `gates` eliminado (commit pendiente 2026-09-30, `app/erp/gates/` + link en `components/veta/erp-sidebar.tsx`) | 2026-09-30 |
| Módulo de finanzas | Se reemplaza el modelo actual (5 pantallas, una máquina de estados por tipo de movimiento) por un registro simple: entidad + entrada/salida + asociación opcional a proyecto/proveedor. | Pendiente ejecutar | 2026-09-30 (decisión), implementación pendiente |

## Cómo usar este archivo (para agentes)

1. Antes de tratar cualquier valor de negocio (precio, parámetro, regla) como "sin definir", busca aquí primero.
2. Si no está aquí, entonces sí puede estar genuinamente abierto — pregunta al Supervisor, no lo inventes ni lo dejes implícito en un archivo de planeación nuevo.
3. Si encuentras una decisión cerrada en un archivo histórico que NO está en esta tabla, agrégala aquí en vez de solo citarla — así se vuelve encontrable para el siguiente agente.
