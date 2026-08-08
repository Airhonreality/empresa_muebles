# Pase A1-5 — Schema por datos: lineage, trazabilidad y auditoría (subagente, loop de 3 iteraciones)

**Lente:** quién hizo qué, cuándo, sobre qué entidad, desde qué estado a qué estado (event sourcing liviano). **Objetivo del grafo A1:** que los 61 eventos queden auditables y los gates tengan evidencia de su disparo, con trazabilidad evento→tabla→columna 100%.

**Fuentes leídas (solo estas):** `diamante2_define_eventos.md`, `diamante2_discover_eventos.md`, `logica_de_negocio.md`, `log_insights_fase2.md`, `lib/db/schema.ts`, `lib/modules/*`, `pasadas/diamante3_metodologia.md`.

---

## Iteración 1 (bruta)

Diseño crudo, sin autocrítica:

1. **Tabla `eventos`** (auditoría) con columnas: `id`, `tipoEvento` (enum E-01..E-61), `entidad`, `entidadId`, `estadoAntes`, `estadoDespues`, `actorId`, `timestamp`, `payload jsonb`, `contextoNegocio jsonb`.
2. **Loguear los 61 eventos** sin excepción, incluidos los de lectura.
3. **Identidad compartida lead→cliente→proyecto:** asumir que "mismo registro que cambia de estado" (`diamante2_define_eventos.md:51`) significa mutar la misma fila.
4. **Lineage:** una columna `padreId` en cada tabla de negocio (contratos.proyectoId, ordenes.pedidoId...) y derivar la procedencia recorriendo FKs.
5. **Retención:** 2 años (igual que la garantía), poda física de filas viejas.
6. **Gates:** una fila de `eventos` con el veredicto embebido en `payload`.

---

## Iteración 2 (autocrítica)

Crítica de la iteración 1 contra las fuentes:

- **(2a) Loguear los 61, incluso lecturas, es ruido.** E-42, E-47, E-43 y E-58 son **lecturas/agregados** (`diamante2_discover_eventos.md:118,119,117,106`): "sistema (agregado)", "sistema", "lectura". E-42 (embudo) y E-47 (KPIs) **consumen el log, no se loguean a sí mismos**. Loguearlos sería auto-referencia y volumen inútil → **`RUIDO_SCHEMA`**. Corrección: loguear toda **mutación** (crea/actualiza/transiciona) + todo **gate** con evidencia completa; las lecturas se derivan. → 56 eventos logueados, 4 derivados, 1 diferido (ver tabla).
- **(2b) "Mismo registro" vs. schema existente.** `leads` y `clientes` son **tablas distintas** (`schema.ts:271-281` y `:77-87`) y `proyectos.clienteId` referencia `clientes` (`schema.ts:93`). Mutar "la misma fila" no es consistente con lo construido. Corrección: identidad evolutiva = `lead.id` estable + FK `leads.cliente_id` que se fija en E-51 + `proyectos.clienteId` apuntando al mismo cliente + filas de `procedencia`. La cadena completa queda resoluble sin reconstruir nada (anti-memoria, H-10).
- **(2c) `contextoNegocio jsonb` duplicado con FKs.** Un jsonb de contexto + FKs dedicadas crea dos fuentes de verdad → `RUIDO_SCHEMA`. Corrección: el contexto de negocio **son** los FKs de cadena `leadId/clienteId/proyectoId/contratoId` (patrón ya usado en `movimientosFinancieros`, `schema.ts:246-250`); `payload` solo lleva lo específico del evento.
- **(2d) `estadoAntes/estadoDespues` como enum FK = acople frágil.** `estadoProyectoEnum` actual (`schema.ts:36-45`) no contiene los estados de los eventos (borrador/en_revision/cotizado/aprobado_compras/armado/verificado/instalado — `diamante2_discover_eventos.md:37,45,47,66,81,83,90`). La auditoría debe capturar **snapshot de texto** (semántica de registro), no FK al enum que A1-1/A2 van a rediseñar.
- **(2e) `actorId` solo no basta.** El Define exige **rol tipado** (rol-vs-persona, `diamante2_define_eventos.md:55-61`) y el rol de autorización es el determinante de los gates (verificador único = comercial vendedor, `:153`). La auditoría denormaliza `actorRol` al momento de escribir, para que un cambio futuro de asignación persona→rol no reescriba la historia.
- **(2f) Retención "2 años" es arbitraria.** La auditoría alimenta E-35 (comisiones), E-42/E-47 (KPIs), disputas y obligaciones legales (DIAN). Poda física rompería el cálculo histórico. Corrección: **append-only**, retención indefinida con archive opcional; el plazo legal exacto es `DECISION_PENDIENTE`.
- **(2g) Falta el vínculo causal entre eventos.** E-33 traza "composición causal de dependencias" (`diamante2_define_eventos.md:79,139`), E-54 referencia el gate que lo rechazó (`:116`), E-35 consume desfases E-33 (`diamante2_discover_eventos.md:116`). Faltaba `eventoReferenciaId` (self-FK a `eventos`) y `ocurrenciaId` (una ocurrencia de negocio puede tocar N entidades, ej. E-51 toca lead+proyecto, E-14 toca cronograma+proyecto).
- **(2h) Atomicidad.** El evento no puede escribirse "después" de la mutación por un servicio separado: si el guard falla no hay evento y si el evento no se pudo escribir la mutación no debe confirmarse. Mismo patrón transaccional ya existente (`lib/modules/contratos/queries.ts:87`, `lib/modules/finanzas/acciones.ts:58`). La auditoría se escribe **dentro de la misma transacción** de la mutación.
- **(2i) Backfill de `proyecto_id` en eventos de lead (E-01..E-04) prohibido** (append-only). Corrección: los FKs de contexto se llenan cuando se conocen en el momento de escribir; la conexión lead→proyecto se cierra por `procedencia`, no por UPDATE al log.

**Qué sobrevive de la iteración 1:** la tabla única de eventos (2g la enriquece, no la rompe), enum de tipoEvento (el contrato de 61 eventos está cerrado y aprobado), el principio de lineage (pero como tabla propia `procedencia`, no FKs de padre esparcidos).

---

## Iteración 3 (refinamiento final)

Diseño depurado. Decisiones de fondo:

- **D1. Una tabla `eventos` = registrador de la realidad** (el sistema es "guía + registrador", `diamante2_define_eventos.md:71`; cronograma dinámico `logica_de_negocio.md:262`). Append-only. Cada fila = una entidad mutada por una ocurrencia; una ocurrencia = N filas con el mismo `ocurrenciaId`.
- **D2. Escritura transaccional atómica** (2h): evento + mutación en el mismo `tx`; helper `registrarEvento(tx, ...)` en un nuevo módulo `lib/modules/auditoria/` (patrón `lib/modules/*`).
- **D3. Procedencia en tabla `procedencia`** escrita **al nacer el dato**, no inferida después (2b, 2i). Es la "tabla de procedencia" del enunciado.
- **D4. Snapshot denormalizado** en `estadoAntes/estadoDespues` (text) y `actorRol` (text): la historia no cambia si enums o asignaciones cambian (2d, 2e).
- **D5. Los 5 gates son eventos con payload de evidencia mínimo definido** (sección Gates).
- **D6. `leads` recibe `estado` + `cliente_id`** (GAP para E-51); el enum `estado_proyecto` y la tabla `cronograma` se rediseñan en A1-1/A2 — la auditoría no se acopla (estados en text).

### Entregable: tabla de auditoría y lineage

**Tabla `eventos`** (añadir a `lib/db/schema.ts`):

| Columna Drizzle | Tipo | Regla | Por qué (traza) |
|---|---|---|---|
| `id` | uuid PK defaultRandom | — | patrón de todas las tablas (`schema.ts:64`) |
| `ocurrenciaId` | uuid NOT NULL | mismo valor en todas las filas de una ocurrencia de negocio | E-51 toca lead+proyecto (`diamante2_discover_eventos.md:48`), E-14 toca cronograma+proyecto (`:57`) |
| `tipoEvento` | pgEnum `tipo_evento` (61 códigos E-01..E-61) | NOT NULL | contrato cerrado 61/61 (`diamante2_define_eventos.md:49`) |
| `entidad` | text NOT NULL | vocabulario cerrado en código: lead, cliente, proyecto, contrato, hito_pago, cronograma, orden_compra, recepcion, modulo_fila, movimiento_financiero, obligacion, notificacion, nomina, comision, cuenta_cobro, cita, visita, diseno_3d, estimacion, propuesta, cotizacion, documento, integracion, reseña, pedido_web, orden_garantia, señal | no enum: la capa 1 agregará tablas (D1 flexibilidad) |
| `entidadId` | uuid NOT NULL | PK de la entidad afectada | historial por entidad |
| `estadoAntes` | text NULL | snapshot previo de la entidad | semántica de registro, no FK (2d) |
| `estadoDespues` | text NULL | snapshot posterior | idem |
| `actorId` | uuid NULL → `usuarios.id` | NULL = sistema/automático | E-50/E-59/E-56/E-14/E-35 son de sistema (`diamante2_discover_eventos.md:34,112,98,57,116`) |
| `actorRol` | text NULL | rol tipado denormalizado al escribir | rol-vs-persona (`diamante2_define_eventos.md:55-61`) |
| `eventoReferenciaId` | uuid NULL → `eventos.id` | vínculo causal: rama negativa, desfase, causa | E-33 composición causal (`:79`), E-54→gate (`:116`), E-35→E-33 (`diamante2_discover_eventos.md:116`) |
| `leadId` | uuid NULL → `leads.id` | contexto de negocio, lleno cuando se conoce | identidad compartida (`diamante2_define_eventos.md:51`) |
| `clienteId` | uuid NULL → `clientes.id` | idem | idem |
| `proyectoId` | uuid NULL → `proyectos.id` | idem | idem |
| `contratoId` | uuid NULL → `contratos.id` | idem | idem |
| `payload` | jsonb NULL | evidencia específica del evento | tabla de evidencia de gates |
| `createdAt` | timestamp NOT NULL defaultNow | patrón existente | `schema.ts:73` |

**Índices:**
- `eventos(entidad, entidadId)` + `createdAt` — historial de una entidad.
- `eventos(proyectoId, createdAt)` — línea de tiempo por proyecto (base de E-60 frontstage, `diamante2_discover_eventos.md:114`).
- `eventos(tipoEvento, createdAt)` — los 61 por ventana de tiempo (embudo E-42 y KPIs E-47, `:118,119`).
- `eventos(actorId, createdAt)` — qué hizo cada persona (base del KPI de horas automáticas E-47, `diamante2_define_eventos.md:142`).

**Tabla `procedencia`** (lineage):

| Columna | Tipo | Regla |
|---|---|---|
| `id` | uuid PK defaultRandom | — |
| `hijoEntidad` | text NOT NULL | entidad nacida |
| `hijoId` | uuid NOT NULL | PK nacida |
| `padreEntidad` | text NOT NULL | entidad origen |
| `padreId` | uuid NOT NULL | PK origen |
| `tipoEvento` | pgEnum tipo_evento NOT NULL | el E-XX que nace el dato |
| `tipoRelacion` | text NOT NULL | `nace_de` / `guarda_con` / `refleja` |
| `createdAt` | timestamp NOT NULL defaultNow | — |

- UNIQUE `(hijoEntidad, hijoId)` — un dato nace una sola vez.
- INDEX `(padreEntidad, padreId)` — "¿qué nació de X?".

**Retención (append-only):** sin UPDATE/DELETE de aplicación (regla de capa de acceso, no constraint). Retención física indefinida; archive por partición anual opcional → `DIFERIDO`; plazo legal exacto a validar → `DECISION_PENDIENTE`.

### Tabla: eventos → evidencia de auditoría

Leyenda: **L = se loguea en `eventos`** · **G = gate con evidencia completa** · **N = no se loguea (se deriva del log)** · **D = diferido**. `entidad` principal entre paréntesis.

| ID | L | Entidad | estado_antes → estado_despues | Evidencia en `payload` (y notas) |
|---|---|---|---|---|
| E-01 | SÍ | lead | — (nace) | `{canal, contacto}` (`diamante2_discover_eventos.md:32`) |
| E-02 | SÍ | lead | nuevo → en_contacto | `{hora_primera_respuesta}` (`:33`) |
| E-50 | SÍ | lead | marca cumplimiento SLA | `{ventana_sla:5min, cumplio, escalacion:{tipo,destino}}` (`diamante2_define_eventos.md:132`) |
| E-03 | SÍ | lead | en_contacto → {calificado, descartado, redirigido} | `{resultado_cualificacion}` (`diamante2_discover_eventos.md:35`) |
| E-04 | SÍ | lead | → {descartado, redirigido} | `{motivo, destino}` (`:36`) |
| E-05 | SÍ | proyecto | — (nace, borrador) | `{presupuesto_preliminar, fotos}`; + `procedencia(proyecto ← lead, E-05)` (`:37`) |
| E-49 | SÍ | lead | → no_viable | `{motivo_no_viabilidad}` — se pierde del flujo activo, solo se registra (`diamante2_define_eventos.md:134`) |
| E-06 | SÍ | cita | — (nace) | `{fecha, franja, canal}` (`diamante2_discover_eventos.md:39`) |
| E-07 | SÍ | proyecto | visita realizada | `{medidas, contexto}` (H4: instrumentar lo que ya pasa, `:40`) |
| E-46 | SÍ | cita | agendada → no_show | `{reagenda:1, destino}` (V-1: reagenda UNA vez, luego descartado, `diamante2_define_eventos.md:140`) |
| E-48 | SÍ | proyecto | se produce diseño pagado | `{artefacto_3d, precio}` (`diamante2_discover_eventos.md:42`) |
| E-08 | SÍ | movimiento_financiero | pago registrado | `{monto, cuenta_cobro_diseñador}` — frontera: el dinero nace en Finanzas (`diamante2_define_eventos.md:120`); doble nacimiento con E-32 (`:120`) |
| E-52 | SÍ | proyecto | se proyecta/recalcula cronograma | `{estimacion, %_crecimiento}` (`diamante2_discover_eventos.md:44`) |
| E-09 | SÍ | proyecto | borrador → en_revision | `{snapshot_publicado}` (snapshot congelado, P3-07, `:45`) |
| E-10 | SÍ | proyecto | revisión con cambios | `{cambios, version_cotizacion}` (`:46`) |
| E-11 | SÍ | proyecto | en_revision → cotizado | `{cotizacion_formal, promesa_7semanas}` (`:47`); input del embudo E-42 |
| E-51 | SÍ | lead + proyecto | lead → cliente; proyecto.clienteId | 2 filas, mismo `ocurrenciaId`; `procedencia(cliente ← lead, E-51)`; set `leads.cliente_id` (`:48`, `diamante2_define_eventos.md:33`) |
| E-12 | SÍ | contrato + hitos_pago | — (borrador) | `{hitos}`; `procedencia(contrato ← proyecto, E-12)` (`diamante2_discover_eventos.md:54`) |
| E-13 | SÍ | contrato | borrador → firmado | `{firma:{hash, fecha, subsistema_verificado}}` (D8/V-6, `diamante2_define_eventos.md:143`) |
| E-53 | SÍ | contrato | se registran restricciones | `{cuestionario_viajes}` (`diamante2_discover_eventos.md:56`) |
| E-14 | SÍ | cronograma + proyecto | cronograma programado | `{fechas_por_etapa, linea_contractual, linea_interna, holgura}` — DOBLE línea (I-034, `diamante2_define_eventos.md:20`); `procedencia(cronograma ← contrato, E-14)` |
| E-15 | SÍ | proyecto | → desarrollo | `{medidas, notas_retoma}` (`diamante2_discover_eventos.md:63`) |
| E-16 | SÍ | contrato + proyecto | revisión de cambios | `{tipo: adicional|cambio|reproceso, impacto_medible, costo_cliente, tiempo}` — doble destino schema+costo (I-027, `diamante2_define_eventos.md:23,113-114`) |
| E-17 | SÍ | proyecto | → desarrollo | `{modelo_3d, bom, lista_compras, version_schema}` — versionado exigido (P2-8, `diamante2_discover_eventos.md:65`) |
| E-18 | **G** | proyecto | desarrollo → aprobado_compras | evidencia completa (sección Gates) (`:66`) |
| E-19 | SÍ | orden_compra | — (nace) | `{mecanica: pago_unico|anticipo_saldo|subcontrato, items}`; `procedencia(orden_compra ← proyecto, E-19)` (`:72`) |
| E-20 | **G** | orden_compra + movimiento_financiero | pago registrado | evidencia completa (sección Gates) (D1, `diamante2_define_eventos.md:87`) |
| E-21 | **G** | proyecto | → recibido_verificado | evidencia completa (sección Gates) (C3, `:76`) |
| E-45 | SÍ | orden_compra | — (nace, sin proyecto) | `{herramienta, proveedor}` — vista por proveedor con E-19 (`diamante2_discover_eventos.md:75`) |
| E-22 | SÍ | proyecto + modulo_fila | → armado | `{modulos:[{id, estado}]}` — fila de salida del taller, capa 1 (B2, `diamante2_define_eventos.md:170`) |
| E-23 | SÍ | señal | citación push | `{ventana_calidad, push_hacia}` (`diamante2_discover_eventos.md:82`) |
| E-24 | **G** | proyecto | armado → verificado | evidencia completa (sección Gates) (`:83`) |
| E-54 | SÍ | proyecto | vuelve a la etapa anterior | `{origen_gate, modulo, componente, culpable}` — rastreo de origen D2 (`diamante2_define_eventos.md:76,137`); granularidad módulo/componente (C2, `:116`); `eventoReferenciaId` → gate que rechazó |
| E-25 | SÍ | proyecto | verificado → instalado | `{rango_instalacion, desenlace_check}` (`diamante2_discover_eventos.md:90`) |
| E-26 | SÍ | proyecto | instalado → entregado | `{acta:{hash, firma_digital}, holgura_operativa}` (`:91`) |
| E-55 | SÍ | reseña | — (nace) | `{testimonio_curado, protocolo_I-013}` (`:92`) |
| E-56 | SÍ | obligacion | — (nace) | `{hito, monto}`; `procedencia(obligacion ← contrato, E-56)` (P3-02, `:98`, `diamante2_define_eventos.md:122`) |
| E-27 | SÍ | notificacion | — | `{hito, monto, fecha}` (`diamante2_discover_eventos.md:99`) |
| E-28 | SÍ | obligacion + movimiento_financiero | pendiente → {pagado, parcial} | `{monto, saldo}` (reconciliación P3-02/P3-12, `:100`) |
| E-29 | SÍ | obligacion | marca atraso | `{dias_atraso, recordatorio}`; aviso automático al gerente (I-054, `log_insights_fase2.md:69`) |
| E-30 | SÍ | obligacion / anticipo | se descuenta | `{monto_descuento}` — el sistema, no la memoria (H-10, `diamante2_discover_eventos.md:102`) |
| E-31 | SÍ | nomina | — | `{rol, periodo, base, comision}` (`:103`) |
| E-57 | SÍ | movimiento_financiero | — | `{flujo: arriendo}` — 3er flujo de pago (P2-1, `:104`) |
| E-32 | SÍ | cuenta_cobro | — (nace) | `{socio, registro_transaccional}`; doble nacimiento con E-08 (`:105`, `diamante2_define_eventos.md:120`) |
| E-58 | **N** | — | — | lectura de saldo derivada de `movimientos_financieros` (`diamante2_discover_eventos.md:106`); log de acceso opcional → `DIFERIDO` |
| E-35 | SÍ | comision | ajuste liquidado | `{periodo, rol, monto, desfase_ids:[E-33]}` — `eventoReferenciaId` → cada E-33 consumido (`:116`) |
| E-43 | **N** | — | — | lectura de caja derivada de movimientos (`:117`); idem |
| E-59 | **G** | cronograma / proyecto | se decide desenlace | evidencia completa (sección Gates) (I-025, `:112`) |
| E-33 | **G** | cronograma | recalculo automático | evidencia completa (sección Gates) (D4, `:113`) |
| E-60 | SÍ (condicional) | — | — | solo se loguea la **emisión** (canal, contenido, destino); el progreso visible es derivado del log (`:114`) |
| E-34 | SÍ | incidente | entra al SLA | `{ventana_sla, hora_entrada, hora_resolucion, escalacion}` (`:115`, I-054) |
| E-36 | SÍ | orden_garantia | — (nace) | `{cita, ventana_8_12}` (`:125`) |
| E-61 | **G** | orden_garantia | lista para salir | `{checklist_completitud}` — evita las 2-3 vueltas (F-11, `:126`) |
| E-37 | SÍ | orden_garantia | → en_garantia | `{materiales_incluidos}` (`:127`) |
| E-38 | SÍ | integracion | — | `{etiquetas_3d, version_schema}` — precedencia E-18 (P5-13, `:133`) |
| E-39 | SÍ | integracion | — | `{archivo_cvc, proveedor_corte}` — precedencia E-18 (`:134`) |
| E-40 | **D** | — | — | señal derivada de E-11/E-13; backlog t-034 (`:135`, `diamante2_define_eventos.md:174`) |
| E-41 | SÍ | documento | — | `{alojador, url, tipo_documento, etapa}` — D5: comercial define + desarrollador en retoma (`diamante2_define_eventos.md:138`) |
| E-44 | SÍ | pedido_web + orden_compra | pedido → producción | `{items, producto, orden}` — enganche que hoy no existe (`diamante2_discover_eventos.md:147`) |
| E-42 | **N** | — | — | agregado que **consume** el log (`:118`); capa de lectura (Gobierno/Medición, `diamante2_define_eventos.md:36`) |
| E-47 | **N** | — | — | idem, incluye horas de `actorId` del log (`:119`, `diamante2_define_eventos.md:142`) |

**Balance:** 56 SÍ (de los cuales 5 son G: E-18, E-20, E-21, E-24, E-33, + E-59 y E-61 como gates de evidencia de SLA/check) · 4 N (E-58, E-43, E-42, E-47) · 1 D (E-40) = **61**.

### Identidad compartida lead → cliente → proyecto (rastreable)

1. **E-01..E-04:** eventos con `leadId` (el id de `leads` es la raíz estable de la cadena).
2. **E-05:** nace `proyectos` (clienteId null, `schema.ts:93`); `procedencia(proyecto ← lead, E-05)`.
3. **E-51:** nace `clientes` (filas `clientes`); se fija `leads.cliente_id` (GAP nuevo) y `proyectos.clienteId = clientes.id`; fila de evento sobre lead + fila sobre proyecto (mismo `ocurrenciaId`); `procedencia(cliente ← lead, E-51)`.
4. **Post-contrato:** todos los eventos llevan `proyectoId` y/o `contratoId`; la cadena completa `lead.id → clientes.id → proyecto.id` se resuelve por `procedencia` + los FKs de contexto, **sin reconstruir** (anti-memoria humana H-10, `diamante2_discover_eventos.md:102`).

**GAP identificado:** `leads` sin columna `estado` (no existen los estados nuevo/en_contacto/calificado/descartado/no_viable/no_show de E-02..E-49/E-46) y sin `cliente_id`. Ambos campos son requisito de la identidad evolutiva y de los saltos del embudo (E-42).

### Lineage / tabla de procedencia (dato crítico → evento que lo nace → padre)

| Dato crítico | Entidad | Nace por | Padre | Tipo relación |
|---|---|---|---|---|
| Proyecto (presupuesto preliminar) | proyecto | E-05 | lead | nace_de |
| Cliente (materialización) | cliente | E-51 | lead | nace_de |
| Cotización formal | proyecto (estado `cotizado`) | E-11 | proyecto (en_revision) | nace_de |
| Contrato + hitos de pago | contrato | E-12 | proyecto (cotizado) | nace_de |
| Obligación de cobro por hito | obligacion | E-56 | contrato (firmado) | nace_de |
| Cronograma (2 líneas) | cronograma | E-14 | contrato (firmado) + estimación E-52 | nace_de |
| BOM / lista de compras | (dentro de E-17) | E-17 | proyecto (retoma E-15) | nace_de |
| Orden de compra | orden_compra | E-19 | proyecto (schema aprobado E-18) | nace_de |
| Movimiento de pago a proveedor | movimiento_financiero | E-20 | orden_compra | nace_de |
| Recepción verificada | recepcion | E-21 | orden_compra | guarda_con |
| Fila del taller (módulos) | modulo_fila | E-22 | recepción E-21 | nace_de |
| Veredicto pre-despacho | (estado proyecto) | E-24 | armado E-22 + citación E-23 | nace_de |
| Acta de entrega | (estado proyecto) | E-26 | instalación E-25 | nace_de |
| Orden de garantía | orden_garantia | E-37 | proyecto (entregado E-26) + cita E-36 | nace_de |
| Producto público desde proyecto fijo | producto_catalogo | publicacion (t-023) | proyecto tipo producto_fijo | refleja |
| Movimiento de cobro del cliente | movimiento_financiero | E-28 | obligacion E-56 | guarda_con |
| Cuenta de cobro del socio | cuenta_cobro | E-32 | registro transaccional E-31/E-08 | nace_de |
| Reproceso | (estado proyecto) | E-54 | gate E-18/E-24 que rechazó | nace_de (con `eventoReferenciaId`) |

Cada fila de `procedencia` se escribe **en la misma transacción** que crea `hijoId`. No hay reconstrucción posterior (regla D3).

### Trazabilidad de los gates (evidencia en la auditoría)

| Gate | Dueño | Fila(s) de `eventos` | Evidencia mínima en `payload` | Rama negativa |
|---|---|---|---|---|
| **E-18** check de schema pre-compras | Compras (`diamante2_define_eventos.md:75`) | entidad=proyecto, `desarrollo → aprobado_compras` | `{veredicto, version_schema, modulos:[...], nota, verificador: 'comercial vendedor'}` — actorId+actorRol del verificador único (D3, `:153`) | E-54 con `eventoReferenciaId`→E-18; `{culpable:'desarrollador'}`; dispara E-33 recálculo |
| **E-20** pago a proveedor (gate de caja) | Finanzas → Compras (RED3, `:87,107`) | entidad=orden_compra + movimiento_financiero | `{dinero_disponible_antes, monto, prioridad:materiales→arriendos→nominas, resultado:'aprobado'|'rechazado', decision_gerente}` — snapshot de la caja real al momento del guard (D1 bloqueante, `:136,154`) | si rechazado → E-33 con causa; el sistema avanza y registra (guía + registrador, `:71`) |
| **E-21** recepción triple | Compras → Taller (`:76`) | entidad=proyecto, `→ recibido_verificado` | `{checklist:{pedido_ok, despacho_ok, material_ok}, items_esperados:[...], items_recibidos:[...]}` (C3 checklist de compra esperada, `:76`) | E-54 con `eventoReferenciaId`→E-21; culpable por rastreo de origen D2 (proveedor/desarrollador/comercial, `:137`) |
| **E-24** veredicto pre-despacho | Calidad (`:78`) | entidad=proyecto, `armado → verificado` | `{veredicto, verificador:'comercial vendedor', modulo/componente, nota}` — sin conflicto de interés (I-043, `log_insights_fase2.md:50`) | E-54 con `eventoReferenciaId`→E-24; solo con veredicto positivo se instala (E-25) |
| **E-33** cambio de cronograma con causa | Control de cronograma (`diamante2_define_eventos.md:79`) | entidad=cronograma, fechas antes/después | `{causa_tipo: interno|externo|cambio_contrato, motivo, composicion_causal:[{evento_id, tipo}], fechas_antes, fechas_despues, decision_manual:{justificacion, autoridad}}` (D4: composición causal traza el origen, `:139,155`) | causa interna → E-35 reduce comisiones; el dato es auditable (`:79`); el cliente NO ve la línea interna (I-034, `log_insights_fase2.md:48`) |
| **E-59** check de los 15 días (evidencia del enforcement de I-025) | Control de cronograma (`diamante2_define_eventos.md:19`) | entidad=cronograma/proyecto | `{insumos_taller, comprados_pagados, fila_taller, desenlace:1|2|3}` — los 3 inputs del log real (`diamante2_discover_eventos.md:112`) | desenlace 2 → pospone línea interna + E-35 reduce; desenlace 3 → negociar con el cliente |
| **E-61** check de completitud de garantía (evidencia F-11) | Garantía | entidad=orden_garantia | `{checklist_completitud, materiales_incluidos}` (`diamante2_discover_eventos.md:126`) | orden no sale sin check completo |

**Principio transversal de los gates:** la fila de evento se escribe **dentro de la transacción** que ejecuta la transición (2h). Si el guard falla, no hay fila; si la fila no se pudo escribir, la transición no se confirma. Esa atomicidad es la "evidencia de disparo" (determinismo A3: "5 gates deterministas", `pasadas/diamante3_metodologia.md:147`).

### Consistencia con schema.ts (respuesta al punto 6)

- **No existe ninguna tabla de auditoría/eventos/historial en `schema.ts`** (18 tablas: usuarios..pedidosWeb, `schema.ts:64-313`) — grep de `auditoria|historial|evento|lineage|trazabilidad` en `lib/` sin coincidencias. La propuesta es **aditiva** (2 tablas nuevas + 2 columnas nuevas en `leads`), no toca ninguna existente.
- Patrones respetados: nombres de tablas/columnas en español con camelCase de propiedad/snake_case de columna (ej. `movimientosFinancieros`, `schema.ts:239`); FKs de contexto múltiple ya usados en `movimientosFinancieros` (`:246-250`); timestamps `createdAt/updatedAt` (`:73-74`); transacciones `db.transaction(tx)` (`lib/modules/contratos/queries.ts:87`, `lib/modules/finanzas/acciones.ts:58`); lógica pura testeable por separado (patrón `lib/modules/finanzas/estado.ts:15-21`).
- La auditoría **no se acopla** a enums que A1-1/A2 van a rediseñar: `estadoAntes/estadoDespues` y `actorRol` son texto snapshot (2d/2e).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| A1-5-H01 | `GAP_SCHEMA` | No existe tabla de auditoría/eventos; se propone `eventos` (15 columnas + índices) y `procedencia` (lineage). Aditivo, 0 colisiones | `schema.ts:64-313` (ausencia), `diamante2_define_eventos.md:71` (registrador de la realidad) |
| A1-5-H02 | `GAP_SCHEMA` | `leads` sin `estado` ni `cliente_id`: imposible materializar E-51 (identidad compartida) ni los saltos del embudo (E-02..E-49/E-46) | `schema.ts:271-281`, `diamante2_discover_eventos.md:48,33,35,38,41` |
| A1-5-H03 | `NORMALIZACION` | Identidad lead→cliente como dos tablas sin vínculo: se cierra con `leads.cliente_id` + `procedencia(cliente←lead, E-51)` + `proyectos.clienteId` | `schema.ts:77-87,93,271-281`, `diamante2_define_eventos.md:51` |
| A1-5-H04 | `CORRECCION_SCHEMA` | `estadoProyectoEnum` actual no cubre los estados de los eventos (borrador/en_revision/cotizado/aprobado_compras/armado/verificado/instalado); la auditoría usa texto snapshot para no heredar el acople — el enum se corrige en A1-1/A2 | `schema.ts:36-45`, `diamante2_discover_eventos.md:37,45,47,66,81,83,90` |
| A1-5-H05 | `GAP_SCHEMA` | No existe tabla `cronograma` (E-14/E-33/E-59 la presuponen): la entidad `cronograma` de `eventos` queda pendiente de que A1-1/A2 la cree | `schema.ts:174-194` (contratos sin fechas por etapa), `diamante2_discover_eventos.md:57,113,112` |
| A1-5-H06 | `GAP_SCHEMA` | Roles tipados ausentes (`rolEmpleadoEnum` solo admin/comercial/taller/finanzas); `actorRol` en `eventos` es denormalizado hasta que A1-3 defina el modelo persona→rol | `schema.ts:27-32`, `diamante2_define_eventos.md:55-61` |
| A1-5-H07 | `RUIDO_SCHEMA` | No loguear lecturas/agregados (E-42, E-47, E-43, E-58): se derivan del log; E-60 solo loguea emisiones. Loguearlos sería auto-referencia | `diamante2_discover_eventos.md:118,119,117,106,114` |
| A1-5-H08 | `RUIDO_SCHEMA` | Descartado el jsonb `contextoNegocio` duplicado con FKs de cadena: el contexto de negocio SON los FKs `leadId/clienteId/proyectoId/contratoId` | `schema.ts:246-250` (patrón existente), `diamante2_define_eventos.md:51` |
| A1-5-H09 | `DECISION_PENDIENTE` | Retención física del log: propuesta append-only indefinida + archive por partición anual; el plazo legal colombiano (DIAN/facturación, garantía 2 años) requiere validación del contador | `diamante2_define_eventos.md:143` (firma), `:145` (validación contador), `log_insights_fase2.md:69` |
| A1-5-H10 | `DECISION_PENDIENTE` | ¿Registrar accesos a E-43/E-58 (lecturas de dinero/saldos) por auditoría de seguridad? Hoy: NO (derivados); activarlo es opcional y no bloquea | `diamante2_discover_eventos.md:117,106` |
| A1-5-H11 | `DIFERIDO` | Particionado por año / cold storage del log; E-40 conversión offline (backlog t-034) | `diamante2_define_eventos.md:174`, `diamante2_discover_eventos.md:135` |
| A1-5-H12 | `NORMALIZACION` | Una ocurrencia de negocio toca N entidades (E-51: lead+proyecto; E-14: cronograma+proyecto; E-20: OC+movimiento): 1 fila por entidad, agrupadas por `ocurrenciaId` | `diamante2_discover_eventos.md:48,57,73` |

---

## Notas para el Orquestador

1. **Aditivo, no conflictivo:** `eventos` + `procedencia` no tocan ninguna de las 18 tablas existentes. Únicas mutaciones: `leads.estado` + `leads.cliente_id` (H02/H03).
2. **Dependencias cruzadas para la convergencia A2:** (a) `actorRol` depende del modelo de roles de A1-3; (b) entidad `cronograma` depende de la tabla cronograma de A1-1; (c) `estadoAntes/Despues` son texto a propósito — no bloquear A2 por el enum (H04). La auditoría es el único pase que puede existir sin resolver los otros; los FKs referencian solo tablas que ya existen (usuarios, leads, clientes, proyectos, contratos).
3. **El log ES el sustrato de Gobierno/Medición (E-42/E-47):** recomiendo que A2 no cree tablas de KPIs separadas; los agregados se computan del log (`eventos(tipoEvento, createdAt)` y `eventos(actorId, createdAt)`).
4. **Determinismo de gates:** el pase A1-2 (enforcement) debe importar la regla 2h (evento + transición en el mismo `tx`); sin eso, "el gate no deja avanzar" no tiene prueba.
5. **Implementación:** nuevo módulo `lib/modules/auditoria/` con `registrarEvento(tx, input)` y `registrarProcedencia(tx, input)` — patrón de `lib/modules/finanzas/acciones.ts:58` (transacción) y `lib/modules/finanzas/estado.ts` (validación pura testeable). Los tests del módulo seguirán el patrón `*.test.ts` con el placeholder de `DATABASE_URL` indicado en `AGENTS.md`.
6. **Veredicto del pase:** 61/61 eventos con trayectoria de auditoría definida (56 logueados, 4 derivados, 1 diferido); 5 gates + E-59 + E-61 con payload de evidencia mínimo; identidad compartida resuelta por FK + procedencia sin reconstrucción; 0 contradicciones con `schema.ts`.

---

## Registro

- Fecha: 2026-08-04
- Pase: A1-5 (ola 1, en paralelo con A1-1..A1-4 y B1-1..B1-3)
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a1_5_datos.md`
- Loop de 3 iteraciones completado: 1 bruta → 2 autocrítica (9 correcciones 2a-2i) → 3 refinamiento (D1-D6 + entregable).
