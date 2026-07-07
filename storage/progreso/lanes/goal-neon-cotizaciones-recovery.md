# Contrato de lane: goal/neon-cotizaciones-recovery  (KEYSTONE)

> Contrato para delegar a un worker liviano. Repara datos de producción reales en Neon
> (proyecto de Lorena Vaca y el resto del namespace huérfano `cotizaciones`). Prioridad
> absoluta: **NO PERDER INFORMACIÓN**. Ninguna escritura sin snapshot previo y verificación
> posterior. El Orquestador (Opus) solo planificó esto — no ejecutó nada.

## Identidad
- **Rama:** `goal/neon-cotizaciones-recovery`
- **Worktree:** `git worktree add ../wt-neon-recovery -b goal/neon-cotizaciones-recovery`
- **Rol/modelo:** worker de ejecución (liviano) para Fases 0-2. Fase 3 requiere criterio (worker de plan). Fase 4 espera aprobación humana explícita antes de tocar nada.
- **Estado:** plan_borrador
- **Sitio de producción:** `https://vetadorada.netlify.app` (site_id `918cb007-ea8c-4528-8453-169c464998c9`, deploy actual congelado en commit `41960fe`)

## Goal (teleología)
Recuperar y reconciliar los datos de cotizaciones/proyectos huérfanos en Neon producto de un
rename de schema (`cotizaciones` → `proyectos`, commit `41960fe`, 2026-06-28) que nunca pasó
por la operación atómica segura del motor (`PostgresStrategy.renameCollection`), sino por una
copia manual registro-por-registro que dejó duplicados obsoletos y, en al menos un caso
(Lorena Vaca), un registro padre completo desconectado de sus hijos.

## Contexto verificado (ver memoria `incidente-neon-cotizaciones-proyectos`)
- `namespace=cotizaciones` (obsoleto): 18 registros, los 18 con sucesor íntegro en `proyectos`.
- `namespace=proyectos` (canon): 27 registros.
- `namespace=cotizaciones_snapshot`: 0 registros — nada que recuperar ahí.
- 2 campos confirmados perdidos en la copia de 2026-06-24 (aún NO reparados, incluidos en
  esta lane): `ead24f73.imprevistos_instalacion=250000`, `da6b8131.cliente_id=c69a648c-0b1d-4213-a103-906ecfe97455`.
- **Caso Lorena Vaca:** proyecto real y sano = `286b5b77-02da-49e4-a32e-d54020e713a7`
  (cliente `5fc1b7cb-5a9e-441e-a519-9329105c7c08`, `estado: produccion`). Contrato firmado
  existente = `da87530b-9d31-4c5a-87c7-3b7b57a6a6aa` (`valor_total: 15436750`, texto completo
  del contrato disponible, hitos 50/25/25 = 7718375/3859188/3859187 — suman exacto).
  Su espacio real con 4 ítems de material (`29209ca8-d9f3-422a-bca0-97d26c86c5e5`, "Cocina
  integral") quedó apuntando a un `proyecto_id` fantasma `933c4919-...` que no existe en
  ningún namespace — hay que re-vincularlo a `286b5b77`, sin tocar sus 4 ítems reales.
- **`zap_activar_produccion` nunca completó el paso de crear `obligaciones_pendientes`**
  para NINGÚN proyecto en producción (0 registros `tipo=por_cobrar` en toda la tabla).
  El proyecto de Lorena ya está en `produccion` con su `orden_trabajo` creada, pero sin sus
  3 cobros. Esto bloquea la visibilidad financiera y es probablemente la causa de que el
  usuario sienta que "no puede pasar proyectos a producción" — el estado cambia pero el
  flujo no cierra.
- Existen otros 2 huérfanos de `espacio_variantes` sin dueño confirmado: `43aad4be-...`
  ("Nuevo Espacio", 1 ítem, $897.000, sin cliente identificable) y un bug de placeholder
  (`proyecto_id: "%3Aid"` literal, sin datos reales). Fuera de alcance de esta lane salvo
  para documentarlos (Fase 4, no ejecutar sin dueño confirmado).
- Ya existe un intento de reparación previo en `scratch/` (`align_db.js`, `populate_lorena.js`)
  que **NUNCA se aplicó a Neon producción** (verificado en vivo, 2026-07-07) y que además es
  parcialmente peligroso: `populate_lorena.js` borraría los 4 ítems reales del espacio de
  Lorena y los reemplazaría por una reconstrucción aproximada a mano cuyas cantidades no
  coinciden con las reales (ej. Bisagras: 10 reales vs 17 reconstruidas). **No usar ese
  script.** Esta lane reemplaza ese intento con un enfoque no destructivo.

## Superficie (y SOLO esta)
- Escrituras vía `POST https://vetadorada.netlify.app/api/vault` (`action: WRITE`), namespaces:
  `obligaciones_pendientes`, `espacio_variantes`, `proyectos` (solo los 2 campos puntuales).
- Lecturas vía `GET https://vetadorada.netlify.app/api/vault?namespace=X` (público, solo lectura, sin auth — ver hallazgo de seguridad abajo).
- Snapshots de respaldo en `storage/progreso/backups/` (archivos nuevos, timestamped).
- Este archivo y su actualización de estado.

<!-- lane-surface: storage/progreso/backups/** | storage/progreso/lanes/goal-neon-cotizaciones-recovery.md -->

## Fuera de alcance
- **NO** tocar `scratch/populate_lorena.js` ni ejecutarlo — está vetado (ver contexto arriba).
- **NO** borrar los 18 huérfanos de `namespace=cotizaciones` en esta pasada (Fase 4, requiere
  aprobación humana explícita adicional aunque ya estén verificados como seguros).
- **NO** tocar los huérfanos `43aad4be` / `%3Aid` (dueño no confirmado).
- **NO** tocar schema, `agnostic.config.ts`, ni código de componentes — esta lane es pura
  reconciliación de datos.
- **NO** el campo IVA opcional del cotizador — es una lane aparte, ver
  `goal-cotizador-iva-opcional.md`, bloqueada hasta que esta cierre.
- **NO** redeploy de producción ni investigación de por qué el deploy quedó congelado en
  `41960fe` — hallazgo aparte, no bloqueante.

## Depende de / bloquea a
- Bloquea: `goal-cotizador-iva-opcional` (no iniciar esa lane hasta `APROBAR CIERRE` aquí).
- No depende de ninguna lane previa.

---

## FASE 0 — Snapshot de seguridad (obligatorio antes de escribir NADA)

### DAG
1. Descargar y guardar snapshot completo de los namespaces que esta lane va a tocar, ANTES
   de cualquier escritura. DoD:
   ```bash
   TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
   mkdir -p storage/progreso/backups/${TS}-neon-recovery
   for ns in proyectos contratos obligaciones_pendientes espacio_variantes items_variante cotizaciones; do
     curl -s "https://vetadorada.netlify.app/api/vault?namespace=${ns}" \
       -o "storage/progreso/backups/${TS}-neon-recovery/${ns}.json"
   done
   ```
   DoD verificable: los 6 archivos existen y cada uno tiene `"success":true` y un array `records` no vacío (excepto `cotizaciones` que puede tener 18).
2. Commitear el snapshot en la rama de esta lane ANTES de tocar Neon.

### Cierre de Fase 0
- [x] 6 archivos de snapshot en `storage/progreso/backups/2026-07-07T22-13-04Z-neon-recovery/`.
- [x] Commit hecho y pusheado (regla post-incidente: toda lane cierra con push).

---

## FASE 1 — Recuperar los 2 campos perdidos (schema rename, 2026-06-24)

### DAG
1. Restaurar `imprevistos_instalacion` en el proyecto `ead24f73-2633-43ea-9bc8-12375103c4da`.
   DoD:
   ```bash
   curl -s -X POST https://vetadorada.netlify.app/api/vault \
     -H "Content-Type: application/json" \
     -d '{"action":"WRITE","namespace":"proyectos","record":{"id":"ead24f73-2633-43ea-9bc8-12375103c4da","data":{"imprevistos_instalacion":250000}}}'
   ```
   Nota: el motor hace merge de campos (Field-Level LWW, ver `PostgresStrategy.write`), no hace
   falta reenviar el resto de campos del proyecto — solo el campo a restaurar.
2. Restaurar `cliente_id` en el proyecto `da6b8131-1800-43c0-9dd3-7b1a0c896669`. DoD:
   ```bash
   curl -s -X POST https://vetadorada.netlify.app/api/vault \
     -H "Content-Type: application/json" \
     -d '{"action":"WRITE","namespace":"proyectos","record":{"id":"da6b8131-1800-43c0-9dd3-7b1a0c896669","data":{"cliente_id":"c69a648c-0b1d-4213-a103-906ecfe97455"}}}'
   ```
3. Verificar ambos. DoD:
   ```bash
   curl -s "https://vetadorada.netlify.app/api/vault?namespace=proyectos" | \
     node -e "const d=JSON.parse(require('fs').readFileSync(0));const r=d.records;
       const a=r.find(x=>x.id==='ead24f73-2633-43ea-9bc8-12375103c4da');
       const b=r.find(x=>x.id==='da6b8131-1800-43c0-9dd3-7b1a0c896669');
       console.log('imprevistos_instalacion:', a.data.imprevistos_instalacion, '(esperado 250000)');
       console.log('cliente_id:', b.data.cliente_id, '(esperado c69a648c-0b1d-4213-a103-906ecfe97455)');"
   ```

### Cierre de Fase 1
- [x] `imprevistos_instalacion=250000` confirmado en `ead24f73`.
- [x] `cliente_id=c69a648c-...` confirmado en `da6b8131`.
- [x] Nada más cambió en esos 2 registros (diff contra el snapshot de Fase 0 solo muestra el campo restaurado).

---

## FASE 2 — Caso Lorena Vaca: cobros + reconexión del espacio

### DAG
1. Crear las 3 `obligaciones_pendientes` (por_cobrar) que `zap_activar_produccion` debió
   crear y no creó, usando el valor EXACTO del contrato firmado (no recalcular). DoD — 3 POST:
   ```bash
   BASE='https://vetadorada.netlify.app/api/vault'
   curl -s -X POST $BASE -H "Content-Type: application/json" -d '{
     "action":"WRITE","namespace":"obligaciones_pendientes",
     "record":{"data":{
       "descripcion":"Anticipo 50% — Cocina integral",
       "tipo":"por_cobrar","monto_total":7718375,"monto_pagado":0,
       "fecha_vencimiento":"2026-06-19","estado":"pendiente",
       "cliente_id":"5fc1b7cb-5a9e-441e-a519-9329105c7c08",
       "proyecto_id":"286b5b77-02da-49e4-a32e-d54020e713a7",
       "contrato_id":"da87530b-9d31-4c5a-87c7-3b7b57a6a6aa",
       "descripcion_semantica":"Primer cobro del 50% correspondiente al anticipo para iniciar la fabricación del proyecto Cocina integral."
     }}}'
   curl -s -X POST $BASE -H "Content-Type: application/json" -d '{
     "action":"WRITE","namespace":"obligaciones_pendientes",
     "record":{"data":{
       "descripcion":"Instalación 25% — Cocina integral",
       "tipo":"por_cobrar","monto_total":3859188,"monto_pagado":0,
       "fecha_vencimiento":"2026-06-19","estado":"pendiente",
       "cliente_id":"5fc1b7cb-5a9e-441e-a519-9329105c7c08",
       "proyecto_id":"286b5b77-02da-49e4-a32e-d54020e713a7",
       "contrato_id":"da87530b-9d31-4c5a-87c7-3b7b57a6a6aa",
       "descripcion_semantica":"Segundo cobro del 25% al iniciar la instalación física del mobiliario para el proyecto Cocina integral."
     }}}'
   curl -s -X POST $BASE -H "Content-Type: application/json" -d '{
     "action":"WRITE","namespace":"obligaciones_pendientes",
     "record":{"data":{
       "descripcion":"Pago Final 25% — Cocina integral",
       "tipo":"por_cobrar","monto_total":3859187,"monto_pagado":0,
       "fecha_vencimiento":"2026-06-19","estado":"pendiente",
       "cliente_id":"5fc1b7cb-5a9e-441e-a519-9329105c7c08",
       "proyecto_id":"286b5b77-02da-49e4-a32e-d54020e713a7",
       "contrato_id":"da87530b-9d31-4c5a-87c7-3b7b57a6a6aa",
       "descripcion_semantica":"Tercer y último cobro del 25% contra entrega a satisfacción del proyecto Cocina integral."
     }}}'
   ```
   Nota sobre `fecha_vencimiento`: se usa `2026-06-19` (fecha de firma del contrato) como
   placeholder para los 3 — igual que el zap original, que tampoco escalona fechas por hito.
   Si el usuario quiere fechas reales por hito (anticipo/instalación/entrega), debe indicarlas;
   no hay forma de derivarlas del contrato sin esa info.
2. Re-vincular el espacio huérfano al proyecto correcto, SIN tocar sus 4 ítems reales. DoD:
   ```bash
   curl -s -X POST $BASE -H "Content-Type: application/json" -d '{
     "action":"WRITE","namespace":"espacio_variantes",
     "record":{"id":"29209ca8-d9f3-422a-bca0-97d26c86c5e5","data":{
       "proyecto_id":"286b5b77-02da-49e4-a32e-d54020e713a7"
     }}}'
   ```
3. Verificar todo. DoD:
   ```bash
   curl -s "$BASE?namespace=obligaciones_pendientes" | node -e "
     const d=JSON.parse(require('fs').readFileSync(0));
     const r=d.records.filter(x=>x.data.proyecto_id==='286b5b77-02da-49e4-a32e-d54020e713a7');
     console.log('obligaciones de Lorena:', r.length, '(esperado 3)');
     console.log('suma montos:', r.reduce((s,x)=>s+x.data.monto_total,0), '(esperado 15436750)');"
   curl -s "$BASE?namespace=espacio_variantes" | node -e "
     const d=JSON.parse(require('fs').readFileSync(0));
     const e=d.records.find(x=>x.id==='29209ca8-d9f3-422a-bca0-97d26c86c5e5');
     console.log('proyecto_id del espacio:', e.data.proyecto_id, '(esperado 286b5b77-...)');"
   curl -s "$BASE?namespace=items_variante" | node -e "
     const d=JSON.parse(require('fs').readFileSync(0));
     const items=d.records.filter(x=>x.data.variante_id==='29209ca8-d9f3-422a-bca0-97d26c86c5e5');
     console.log('items del espacio de Lorena:', items.length, '(esperado 4, sin cambios respecto al snapshot Fase 0)');"
   ```

### Cierre de Fase 2
- [x] 3 `obligaciones_pendientes` creadas, suma exacta $15.436.750, ligadas a `contrato_id=da87530b`.
- [x] Espacio `29209ca8` con `proyecto_id=286b5b77`.
- [x] Los 4 ítems reales del espacio siguen intactos (mismos ids, mismos montos que en el snapshot de Fase 0).
- [x] `scratch/populate_lorena.js` NO se ejecutó.

---

## FASE 3 — Diagnóstico: por qué `zap_activar_produccion` no crea `obligaciones_pendientes`

### DAG
1. Reproducir en aislado (sin escribir a Neon) el bloque de creación de `obligaciones_pendientes`
   del zap (`storage/db/scripts.json`, campo `code` de `zap_activar_produccion`) para el caso de
   un proyecto SIN contrato previo — es la rama que calcula `grandTotal` desde `espacio_variantes`
   activos. DoD: identificar si algún proyecto activo tiene 0 `espacio_variantes` con `activa:true`
   (causaría `grandTotal=0` silencioso, no un error) — reportar cuáles.
2. Revisar si el zap sandbox (`src/app/api/engine/route.ts`) traga excepciones a mitad de
   ejecución (por ejemplo, si el `saveItem` de una obligación falla, ¿continúa con las
   siguientes 2 o aborta todo silenciosamente?). DoD: cita de código exacta (archivo:línea) que
   explique el comportamiento ante error parcial.
3. Producir un hallazgo corto (no un fix) en este mismo archivo, sección "Hallazgo Fase 3" abajo.
   **No modificar el zap ni el sandbox en esta lane** — eso, si aplica, es una lane de código
   aparte a proponer después de este diagnóstico.

### Cierre de Fase 3
- [x] Hallazgo documentado con archivo:línea exacto.
- [x] Ningún cambio de código hecho.

## Hallazgo Fase 3

**H1 — Sandbox traga excepciones parciales sin rollback (`src/app/api/engine/route.ts:94-101`).**

El código del zap se ejecuta dentro de un `try { ${scriptCode} } catch (err) { errorCallback(err.message) }`. Si un `api.saveItem` lanza excepción, el error se captura, se almacena en `scriptErrorMessage`, y el resto del código NO se ejecuta. Sin embargo, los `saveItem` que ya completaron (antes del fallo) quedan COMMITEADOS en la BD — no hay transacción, no hay rollback. Esto produce escrituras parciales silenciosas si el frontend no inspecciona la respuesta de error del engine.

**H2 — `grandTotal=0` silencioso si no hay espacios activos vinculados al proyecto.**

El zap filtra `espacio_variantes` con `proyecto_id === cotizacion.id && activa === true` (línea `if (!contrato)` block). Si el resultado es vacío, el loop `for (const sv of mySpaces)` no se ejecuta → `grandTotal` queda en 0 y el contrato se crea con `valor_total=0`. Esto es particularmente relevante para:

- `286b5b77` (Cocina integral, Lorena): su espacio apuntaba al proyecto fantasma `933c4919-...`, por lo que el zap encontró 0 espacios activos para el proyecto real. El contrato `da87530b` ya existía (creado antes del rename de schema), así que el bug no afectó su valor, pero sí impidió recalcular grandTotal para las obligaciones en la rama `if (!contrato)`.
- `8399a364` (Barra, estado: activa): 1 espacio pero con `activa=false`.
- `c1900d20` (Nuevo Proyecto, estado: activa): 0 espacios registrados.

**H3 — El bloque de creación de obligaciones (`if (!obligacionExistente)`) tiene una dependencia del valor del contrato que puede fallar.**

En la rama `else` (contrato existente), el código calcula `valorTotalFinal = Number(contrato.valor_total || ...)`. En el sandbox `api.query` aplana el record (`{ id: ..., ...r.data }`), por lo que `contrato.valor_total` debería funcionar. Sin embargo, si el valor es `undefined` o `0` (por el H2), las 3 obligaciones se crean con monto 0.

**Causa raíz probable para Lorena:** El contrato `da87530b` existía y el zap entró por la rama `else` (solo actualiza estado del contrato). Luego el bloque `if (!obligacionExistente)` debió crear las 3 obligaciones. Como hay 0 registros, es probable que el primer `api.saveItem('obligaciones_pendientes', ...)` fallara (error de red, timeout, o constraint) y el sandbox abortara las siguientes sin rollback de las anteriores (que no hubo). Esto es consistente con el H1.

**No se modifica código en esta lane.** Si se requiere fix, debe ser una lane de código aparte (p.ej. envolver la creación de obligaciones en una transacción, o validar grandTotal > 0 antes de continuar).

---

## FASE 4 — Limpieza de huérfanos (NO ejecutar sin aprobación humana explícita adicional, aunque este documento ya esté aprobado)

Marcado deliberadamente como bloqueado. Contiene:
- Borrado de los 18 registros duplicados en `namespace=cotizaciones` (ya verificados 18/18
  con sucesor íntegro en `proyectos` tras Fase 1).
- Decisión sobre `43aad4be` (dueño no confirmado — requiere que el usuario identifique el
  proyecto/cliente antes de tocarlo).
- Decisión sobre el registro con `proyecto_id: "%3Aid"` (bug de placeholder, 1 registro sin
  datos reales — candidato a borrado simple, pero requiere confirmación).

**No incluir DoD ejecutable aquí todavía — se detalla en un contrato de lane separado una vez
cerradas las Fases 0-3 y con aprobación humana expresa para el borrado.**

---

## Matriz de verificación

| # | Check | Comando | Esperado | Resultado | Evidencia |
|--|-------|---------|----------|-----------|-----------|
| V1 | Snapshot tomado antes de escribir | `ls storage/progreso/backups/*-neon-recovery/` | 6 archivos | 6 archivos (proyectos: 27, contratos: 3, obligaciones_pendientes: 1, espacio_variantes: 44, items_variante: 301, cotizaciones: 18) | `contratos.json (6021B), cotizaciones.json (5609B), espacio_variantes.json (25830B), items_variante.json (106174B), obligaciones_pendientes.json (730B), proyectos.json (8114B)` |
| V2 | Campo `imprevistos_instalacion` restaurado | GET proyectos, filtrar `ead24f73` | `250000` | `imprevistos_instalacion: 250000 (esperado 250000)` | Verificación node: `a.data.imprevistos_instalacion = 250000` |
| V3 | Campo `cliente_id` restaurado | GET proyectos, filtrar `da6b8131` | `c69a648c-...` | `cliente_id: c69a648c-0b1d-4213-a103-906ecfe97455 (esperado c69a648c-0b1d-4213-a103-906ecfe97455)` | Verificación node: `b.data.cliente_id = c69a648c-0b1d-4213-a103-906ecfe97455` |
| V4 | 3 cobros de Lorena creados | GET obligaciones_pendientes, filtrar `proyecto_id=286b5b77` | 3 registros, suma `15436750` | `obligaciones de Lorena: 3 (esperado 3)` | `suma montos: 15436750 (esperado 15436750)` — items: Anticipo 50% $7,718,375 + Instalación 25% $3,859,188 + Pago Final 25% $3,859,187 |
| V5 | Espacio re-vinculado | GET espacio_variantes, filtrar `id=29209ca8` | `proyecto_id=286b5b77` | `proyecto_id del espacio: 286b5b77-02da-49e4-a32e-d54020e713a7 (esperado 286b5b77-...)` | `e.data.proyecto_id = 286b5b77-02da-49e4-a32e-d54020e713a7` |
| V6 | Ítems reales intactos | GET items_variante, filtrar `variante_id=29209ca8` | 4 registros, mismos ids que snapshot Fase 0 | `items del espacio de Lorena: 4 (esperado 4, sin cambios respecto al snapshot Fase 0)` | IDs: `b8166512, 863a30c3, 2b4a7e07, 86316ca2` — mismos que en snapshot |
| V7 | `populate_lorena.js` no ejecutado | revisión manual / `git log` de la rama | sin evidencia de ejecución | Sin evidencia de ejecución | `git log --oneline` muestra solo commit de Fase 0; no hay referencia a populate_lorena en el historial de la rama |

## Handoff
Fase 0-2 → worker liviano ejecuta y llena la Matriz de verificación con evidencia real (pegar
salida de los comandos, no solo "OK"). Fase 3 → hallazgo documentado, sin código tocado.
Devolver todo al Orquestador/humano antes de considerar Fase 4. El Orquestador no ejecuta
nada de este contrato — solo lo audita al cierre.
