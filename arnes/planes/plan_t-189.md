# Plan t-189 — Mapping bidireccional cliente ↔ conversión (sin pantalla nueva)

**Decisión del Supervisor (Javier, 2026-10-26, en conversación):** la pantalla `Clientes` existe
solo porque se vincula con marketing; separarla en `/erp/marketing` sería "un sinsentido
axiomático" y agregaría ruido al menú. Se mantiene **fusionada**, reutilizando el mismo snapshot,
y se agrega lo que faltaba: poder asociar una conversión concreta del sitio a un cliente/proyecto
que ya existía en el ERP (universos separados hoy).

## Diagnóstico

- `leads` solo se vinculaba a `clientes` de forma directa (`leads.cliente_id`). Un cliente o
  proyecto creado a mano en el cotizador podía no tener nunca una conversión asociada, y no había
  forma de mapearlo desde el ERP.
- La cola `eventos_conversion_offline` solo se escribía al crear/editar un contrato. Un contrato
  ya firmado antes de existir el lead quedaba fuera.
- La tabla de clientes no mostraba qué clientes no tenían conversión, así que el trabajo de
  mapping no era accionable.

## Cambios

1. **Acción `asociarLeadAClienteAction`** (`lib/data/actions/leads.ts`): acepta `proyectoId`
   opcional, valida que el proyecto pertenezca al cliente, actualiza `clienteId` + `proyectoId`,
   avanza la etapa (nunca la degrada) y —si el proyecto ya tiene contrato y el lead tiene
   gclid/wbraid/gbraid— encola `contrato_firmado` de inmediato.
2. **Cola compartida** (`lib/data/conversion-offline.ts`): el helper de idempotencia sale de
   `core.ts` para reutilizarse desde contratos y desde la asociación. Acepta un `leadId` explícito
   para no depender del "lead más reciente del proyecto".
3. **Modal bidireccional** (`components/veta/asociar-conversion-modal.tsx`): dos modos con el
   mismo componente — conversión→cliente (el original) y cliente→conversión (nuevo). En ambos se
   elige el proyecto cotizado; si tiene contrato se avisa que se encolará para Google Ads.
4. **Tabla de clientes**: columna `Origen` (n conversiones + campaña, o badge "Sin conversión"),
   filtro "Solo sin conversión" y acción "Vincular conversión" por fila. Cuenta también las
   conversiones vinculadas por proyecto, no solo por `cliente_id`.
5. **Ficha del cliente**: la pestaña de conversiones incluye las vinculadas por proyecto.
6. **Refresco**: la mutación invalida el snapshot al asentar (la asociación puede encolar un
   evento que el lead reconciliado no trae); así la cola se ve sin recargar.
7. **Ficha de datos capturados** (`components/veta/detalle-conversion-modal.tsx`): botón "Datos"
   por conversión con todo lo que guardó el pixel — gclid/wbraid/gbraid, fuente/medio/campaña/
   término/contenido, teléfono/correo hasheados, etapa, vínculos y eventos pendientes. `FilaConversion`
   expone esos campos crudos (sin cambiar el significado de `gclid` = clic efectivo).

## Lo que NO se hace

- No se crea `/erp/marketing` ni se duplica el snapshot: se reutiliza `ClientesCompat`.
- No se inventan métricas de Ads (costo/clics/impresiones siguen bloqueadas por t-110).
- Sin cambios de schema ni migraciones.

## Riesgos y rollback

- **Reasignación accidental**: el modo cliente→conversión solo ofrece leads sin cliente o ya del
  mismo cliente. Rollback: revertir el commit; no hay migración.
- **Doble encolado**: el helper es idempotente por (lead, contrato). Re-asociar no duplica.
- **Etapa degradada**: solo se avanza (`nuevo_lead`→`cotizado`, o `contrato_firmado` si hay
  contrato); nunca se retrocede.
- **Fallo de cola**: el helper captura el error y devuelve `false`; la asociación y la firma del
  contrato no se caen por la cola.

## Verificación

- `npx tsc --noEmit` (solo falla el script untracked ajeno `scripts/clear-bronce-nombre.ts`).
- `npx eslint` de los archivos tocados: 0 errores.
- `conversiones.test.ts`, `coverage.test.ts`, `snapshot-tables.test.ts` OK.
- `npx next build` exit 0.
- QA manual: cliente sin conversión → "Vincular conversión" → elegir ref + proyecto con contrato
  → ver la conversión en la ficha y el evento en la cola.
