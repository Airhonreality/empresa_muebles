# Registro de líneas de trabajo

Índice de las líneas de trabajo activas en el arnés. Una línea es un frente de trabajo con su propio progreso y sus propios bucles/diamantes, sin vivir mezclada con el histórico de otra línea. Las dos líneas de hoy (`ola7`, `demanda`) además escriben hacia `arnes/nucleo/` (verdad de negocio compartida) o hacia `lineas/ola7/pantallas/` (determinantes de pantalla) — pero eso es una consecuencia de que ambas producen software o insumos para software, **no un requisito de toda línea.** Una línea de finanzas, legal o RRHH puede no tocar `nucleo/` ni `pantallas/` nunca — su entregable puede ser puramente una decisión o un documento, y eso también cuenta como progreso real.

Para abrir una línea nueva, usar `_plantilla/LEEME.md`.

| Línea | Estado | Qué produce | Escribe hacia | Detalle |
|---|---|---|---|---|
| `ola7` | F0–F7 aprobado, F8 abierto | Schema (F0/F1), pantallas (F2-F7), hardening/QA (F8/F9) del ERP + sitio | `nucleo/` (propone cambios de schema/eventos) | `ola7/estado_ola7.md`, `ola7/plan_ola7_maestro.md` |
| `demanda` | v3 del marco, sin aprobar — bloqueada esperando Supervisor | Diagnóstico y plan de captación/conversión/marca; determinantes de pantalla para el sitio público | `nucleo/` (ej. schema de `leads`, Bloque A) y `lineas/ola7/pantallas/` (determinantes F-09..F-13) | `demanda/estado_demanda.md`, `demanda/plan_demanda.md` |

## Regla de convivencia entre líneas

1. **`nucleo/` es tierra común.** Cualquier línea puede proponer un cambio (nueva tabla, campo, evento, entrada de vocabulario), pero el cambio se aplica en `nucleo/` una sola vez — no se duplica el dato en la carpeta de la línea.
2. **Una línea no edita el archivo histórico de otra.** `lineas/ola7/archivo/` y `lineas/demanda/archivo/` son propiedad de su línea.
3. **Una línea puede insertar trabajo en otra explícitamente**, citando el documento que lo hace (ej. `plan_estructura_sitio_publico.md` de `demanda` reserva F-09..F-13 en `ola7/pantallas/`) — nunca implícitamente.
4. **El ledger (`arnes/tareas/`) es compartido.** Los IDs de tarea son un solo pool secuencial entre todas las líneas.
