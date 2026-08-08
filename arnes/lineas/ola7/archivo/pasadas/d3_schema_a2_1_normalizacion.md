# Pase A2-1 — Normalización del schema relacional consolidado (subagente, loop de 3 iteraciones)

**Lente:** convergencia de las 5 propuestas A1 (contextos, enforcement, roles, dinero, datos) en **UN schema relacional normalizado**, consistente con `lib/db/schema.ts` (18 tablas) y con el contrato vivo (t-008..t-022).
**Rol:** sub-agente A2-1 del Diamante 3 (`diamante3_metodologia.md:33`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_a1_1_contextos.md` (c1), `d3_schema_a1_2_enforcement.md` (c2), `d3_schema_a1_3_roles.md` (c3), `d3_schema_a1_4_dinero.md` (c4), `d3_schema_a1_5_datos.md` (c5), `lib/db/schema.ts` (sch), `diamante2_define_eventos.md` (define), `diamante3_metodologia.md` (met), y los pases A2-2 (DET-01..DET-17), A2-3 (G-1..G-8, H01..H12), A2-4 (CC-01..CC-10), A2-5 (P-01..P-14) que se ejecutaron **sin** este consolidado y lo esperan para re-verificación.
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md`.

---

## Iteración 1 (bruta)

Barrido crudo, sin filtro, de la divergencia A1 contra su checklist de convergencia:

1. **5 listas de tablas con nombres distintos para el mismo concepto** — las 9 familias gemelas que A2-4 contó (`a2_4:20`): verificaciones / verificaciones_schema / veredictos / veredictos_calidad; recepciones / recepcion_items / recepciones_material; modulos_armado / modulos_taller; compensaciones / liquidaciones_compensacion; comisiones / comisiones_proyecto; eventos_negocio / eventos / registro_actividad; parametros / parametros_compensacion; documentos / documentos_proyecto; registro_horas / registros_horas.
2. **Dos esquemas de identidad lead→cliente incompatibles:** A1-1 fusiona `leads` en `clientes` (c1:73); A1-2/A1-5 conservan `leads` con `estado` + `cliente_id` FK (c2:157; c5:49,175).
3. **Tres tablas de auditoría rivales:** `eventos_negocio` (c1:113), `registro_actividad` (c3:166-175), `eventos`+`procedencia` (c5:53-94).
4. **GAP_SCHEMA de columnas que ningún A1 propone** (los 3 que A2-2 marcó): `proyectos.fecha_entrada_desarrollo` (DET-02), `desfases_cronograma.aplicado` (DET-03), campos de recepción por ítem en `items_orden_compra` (DET-09).
5. **Enums en conflicto:** estado obligación `vencida` (c2:79) vs `atrasada` (c4:172); estado OC `emitida/recibida_verificada` (c1:162) vs `solicitada/aprobada/en_pago/pagada/recibida/cancelada` (c4:109-111); `citado` (c2:77) vs `citada` (c1:184).
6. **Fechas como `text`** bloqueando el cálculo del atraso de 12 días (E-29) y agregaciones de caja: `movimientos_financieros.fecha` (sch:244), `obligaciones_pendientes.fecha_vencimiento` (sch:260) — H9 de c4, CC-09 de A2-4, DET-12 de A2-2.
7. **Dual-identidad `personas` vs `usuarios`:** lo existente FK a `usuarios` (`tareas_produccion.operarioId`, sch:225), lo nuevo de dinero/roles FK a `personas` (c4:152,221,247; c3:121-130) — CC-08.
8. **Ancla del SLA E-50 ambigua:** `hora_primer_contacto` en `clientes` (c1:77) vs `created_at` de `leads` (c2:164) — DET-13.
9. **Caja E-20 con dos fuentes de verdad:** derivada Σsaldos−Σpor_pagar (c2:47 ENF-11) vs `saldo_actual` almacenado transaccional (c4:306-310) — DET-08.
10. **Cobertura declarada por cada A1:** 63 tablas / 61/61 eventos (c1:373), 5 gates evaluables (c2:219-227), 8 roles + rol-vs-persona (c3:96-110), 8 tablas financieras (c4:57), 2 tablas de auditoría (c5:53-94).

Resultado bruto: ~9 familias gemelas, 2 esquemas de identidad, 3 auditorías, 3 GAP de columna, 4 enums en conflicto, 2 fuentes de caja, 1 dual-identidad — el inventario exacto que este pase debe colapsar.

---

## Iteración 2 (autocrítica)

Qué sobrevive, qué cae y por qué (cada resolución con su traza; donde dos propuestas contradicen el Define, gana el Define):

1. **Sobrevive `leads` conservada (no absorción) — CORRECCION_SCHEMA contra A1-1.** Absorber rompe el endpoint público vivo `api/leads/route.ts:23` y `agendar/page.tsx:26-31` (CC-01, `a2_4:76`), y nada referencia `leads` hoy (FK-safe, `a2_4:67`). La identidad evolutiva E-51 (define:51) se materializa con `leads.cliente_id` FK + `procedencia(cliente←lead, E-51)` + `proyectos.clienteId` (c5:120,173) — sin reconstruir nada y sin duplicar contacto (P3-01). El ancla del SLA queda en `leads.hora_primer_contacto` (DET-13).
2. **Cae `pagos_proveedor` → `movimientos_financieros` ampliado (G-8).** El pago a proveedor es un movimiento con `orden_compra_id` + `prioridad_pago` + `comprobante_url` + `medio_pago` (c4:152-158); una tabla propia duplicaría la fuente de dinero (P3-12). La rama negativa del gate E-20 deja de ser tabla `registros_gate_caja` → **fila `eventos` gate E-20** con payload `{dinero_disponible_antes, monto, decision_gerente}` (c5:207).
3. **Cae la triple vía de veredictos (G-4/DET-04) → UNA tabla `verificaciones`** con `tipo_gate ∈ {schema, calidad}` (c3:150-158; opción ya anotada por c1:40). `citaciones_calidad` se conserva como dato previo del predicado P24 (E-23 es señal, no gate — c2:37).
4. **Sobrevive `cronogramas` + `cronograma_etapas.linea` (G-6)** — más granular que `cronograma.tipo_linea` (c2:78); materializa la doble línea contractual/interna de I-034 (log:48) y E-33 solo recalcula la línea `interna`.
5. **Sobrevive el par de compensación A1-4 (G-7):** `liquidaciones_compensacion` + `comisiones_proyecto` (nómina compuesta base E-31 + ajuste E-35, P3-04). Caen `compensaciones`/`comisiones` de c1.
6. **Cae `parametros_compensacion` → UNA `parametros` con `grupo` + `parametros_historial`** (P-03, P-04, P-10 de A2-5): misma forma/ciclo/API, separar por dominio era RUIDO_SCHEMA.
7. **Cae la auditoría triple → `eventos` + `procedencia`** (H03/H04): la única propuesta que cumple el contrato completo (enum 61, `ocurrenciaId`, `eventoReferenciaId`, payload de gates, lineage). `eventos_negocio` y `registro_actividad` se colapsan (c5:53-94,158).
8. **Cae `arriendos` como tabla → obligaciones `origen='arriendo'` + `periodicidad='mensual'` + movimiento egreso** (c4:338).
9. **GAP_SCHEMA se resuelven añadiendo columnas (no re-expresando predicados):** `proyectos.fecha_entrada_desarrollo` (t0 del predicado E-18), `desfases_cronograma.aplicado` (boolean), `items_orden_compra.recibido_cantidad/sin_defectos` (checklist C3 por ítem, define:76). Así el contrato de no-rotura de A2-2 (`a2_2:155`) se cumple sin tocar la semántica de los predicados.
10. **Enums unificados:** obligación `atrasada` (no `vencida`; compatible con los 3 valores que escribe `estado.ts:15-21`); estado OC = 7 valores (`solicitada → aprobada → en_pago → pagada → recibida_verificada | rechazada | cancelada`); citación `citada`.
11. **Fechas → `timestamp`/`date`** (H9/DET-12/CC-09) con actualización de `acciones.ts:78` en la misma release; alternativa de menor fricción documentada si no se migra.
12. **Caja → derivada como fuente de verdad** (Σ `saldo_actual` − Σ por_pagar pendientes) con `saldo_actual` conservado como materializado reconciliado (ENF-11; el código de `acciones.ts:96-101` depende de él — no se borra).
13. **Se corrige mi propia pasada 1:** en el barrido bruto marqué `modulos_taller` (c2:123) como nombre a conservar; tras cruzar con c1 (B2, fila de salida, `modulos_armado`) y con la regla de que el nombre se hereda de la propuesta que define el concepto (c1:175, input de E-59/E-34), **adopto `modulos_armado`** (G-5). Igual para `personas_roles` (c1:65) sobre `usuarios_roles` (c3:134): el puente con `usuarios.persona_id` (CC-08) hace de `personas` la identidad de negocio y `usuarios` la identidad de login.

**Lo que sobrevive de la divergencia completa:** las 18 tablas existentes (11 conservadas + 7 ampliadas, sin borrar ninguna — se cumple la regla A2-4: "ninguna fase rompe un módulo que ya corre"), y 47 tablas nuevas. Nada de este pase modifica `lib/db/schema.ts`.

---

## Iteración 3 (refinamiento final)

Resultado depurado:

- **1 schema relacional de 65 tablas** = 18 existentes (11 conservadas + 7 ampliadas aditivamente) + 47 nuevas, organizadas en 15 bounded contexts + sección transversal. Cobertura **61/61 eventos** (E-42/E-43/E-47/E-58 son lecturas derivadas, sin tabla propia — c5:26,148,163,164).
- **Cada conflicto de la divergencia resuelto en la tabla de la sección siguiente**, con decisión, justificación y traza `archivo:línea`. 0 correcciones estructurales pendientes contra el contrato de no-rotura de A2-2 (`a2_2:155`).
- **Identidad única decidida:** `leads` se conserva y evoluciona (`estado`, `cliente_id`, embudo completo); `personas` + `roles` + `personas_roles` como modelo rol-vs-persona (define:55-61); verificador designado = `proyectos.verificador_id → personas` (D3/I-035, define:153).
- **Auditoría única:** `eventos` + `procedencia` (c5), con guard anti-`agnostic_records` (c1:43, NORMALIZACION heredada).
- **Parámetros únicos:** `parametros` (grupo de dominio) + `parametros_historial` (append-only, P-03/P-04/P-10).
- **Los 3 GAP_SCHEMA de columnas resueltos por adición** (DET-02/DET-03/DET-09) — sin re-expresar ningún predicado de gate.
- **Decisiones que requieren Supervisor se conservan como `DECISION_PENDIENTE`** (valores numéricos sin fuente, rol "compras", deprecación `usuarios.rolEmpleado`, composición causal D4) — ninguna bloquea el modelado (los parámetros se crean con valor vacío, A2-5).

---

## Resolución de conflictos entre propuestas

Notación: `c1..c5` = pasadas A1 · `sch` = `lib/db/schema.ts` · `a2_2/a2_3/a2_4/a2_5` = pases A2. La regla del método: si dos propuestas contradicen el Define, gana el Define (`met:18`).

| # | Conflicto | Propuestas en pugna | Decisión A2-1 | Fuente (archivo:línea) |
|---|---|---|---|---|
| CF-01 | Identidad lead→cliente (E-51) | c1 fusiona `leads` en `clientes` (c1:73,314) vs c2/c5 conservan `leads` + `estado` + `cliente_id` FK (c2:157; c5:49,175) | **Conservar `leads`** con `estado`, `cliente_id` FK, columnas de embudo; `clientes` queda como referente. Absorber rompe `api/leads/route.ts:23`; FK-safe porque nada referencia `leads` (a2_4:67). E-51 se cierra con `procedencia(cliente←lead, E-51)` | a2_4:76 (CC-01); a2_3:137 (G-1); a2_2:141 (DET-11); c1:73; c2:157; c5:169-175; sch:271-281 |
| CF-02 | Veredictos de E-18/E-24 (triple diseño) | `veredictos` con `tipo` (c2:75,77) vs `verificaciones` con `tipoGate` (c3:150-158) vs `verificaciones_schema`+`veredictos_calidad` separadas (c1:153,185) | **UNA tabla `verificaciones`** con `tipo_gate ∈ {schema, calidad}`, `verificador_id`, `veredicto`, `detalle`, `creado_en`. `citaciones_calidad` queda separada (E-23 es señal, no gate) | a2_2:134 (DET-04); a2_3:140 (G-4); c3:150-158; c1:40 |
| CF-03 | Recepción E-21 (checklist por ítem) | `recepciones`+`recepcion_items` (c2:76) vs `recepciones_material` con `checklist` jsonb (c1:165) vs `items_orden_compra` de c4 sin campos de recepción (c4:129-137) | **`recepciones_material`** (checks + estado) **+ campos por ítem en `items_orden_compra`**: `recibido_cantidad`, `sin_defectos`, `catalogo_id`. Rechazo del jsonb blob (DET-10). Si se adoptara solo c4 → E-21 DETERMINISMO_ROTO | a2_2:139-140 (DET-09/10); c1:163,165; c4:129-137; define:76 |
| CF-04 | Cronograma E-14/E-33 (estructura) | `cronogramas`+`cronograma_etapas` con `linea` (c1:137-138) vs `cronograma.tipo_linea` (c2:78) | **`cronogramas` (1 por proyecto) + `cronograma_etapas.linea ∈ {contractual, interna}`** — doble línea I-034; E-33 recalcula solo `interna` | a2_3:142 (G-6); c1:137-138; c2:78; log_insights:48 |
| CF-05 | Pago a proveedor E-20 | `pagos_proveedor` (c1:164) vs `movimientos_financieros` ampliado (c4:152-158) | **`movimientos_financieros`** con `orden_compra_id`, `prioridad_pago`, `comprobante_url`, `medio_pago`; sin tabla `pagos_proveedor` (evita dos fuentes de dinero, P3-12) | a2_3:144 (G-8); c1:164; c4:152-158; define:136 |
| CF-06 | Rama negativa del gate E-20 | `registros_gate_caja` (c4:286-295) vs fila `eventos` gate (c5:150,207) | **Fila `eventos` gate E-20** con payload `{dinero_disponible_antes, monto, decision_gerente}`; sin tabla propia (una sola traza auditable) | a2_3:144 (G-8); c5:150,207; c4:286 |
| CF-07 | Compensación E-31 (base) | `compensaciones` (c1:214) vs `liquidaciones_compensacion` (c4:219-230) | **`liquidaciones_compensacion`** (nómina compuesta, P3-04) | a2_3:143 (G-7); c4:219-230; c1:214 |
| CF-08 | Comisiones E-35 (ajuste) | `comisiones` (c1:215) vs `comisiones_proyecto` (c4:244-258) | **`comisiones_proyecto`** con `desfase_id` auditable (E-33→E-35) | a2_3:143 (G-7); c4:244-258; c1:215 |
| CF-09 | Parámetros configurables | `parametros` (c2:172-189) vs `parametros_compensacion` (c4:67-98) | **UNA `parametros`** (clave única, `grupo` de dominio, CHECK exclusión) **+ `parametros_historial`** append-only (P-03/P-04/P-10) | a2_5:123,147,163 (P-03/P-04/P-10); c2:172; c4:67-98 |
| CF-10 | Auditoría (triple) | `eventos_negocio` (c1:113) vs `registro_actividad` (c3:166-175) vs `eventos`+`procedencia` (c5:53-94) | **`eventos` + `procedencia`** (única que cumple contrato completo: enum 61, ocurrenciaId, eventoReferenciaId, payload de gates). Las otras se colapsan | a2_3:152-158 (H03/H04); c5:53-94; c1:113; c3:166-175 |
| CF-11 | Fila del taller E-22 | `modulos_armado` (c1:175) vs `modulos_taller` (c2:123) | **`modulos_armado`** (nombre heredado del pase que define el concepto; input de E-59/E-34, B2) | a2_3:141 (G-5); c1:175; c2:123; define:118,170 |
| CF-12 | Enum estado obligación | `vencida` (c2:79) vs `atrasada` (c4:172) | **`atrasada`** (compatible con los 3 valores que escribe `estado.ts:15-21`) | a2_2:136 (DET-06); c4:172; c2:79; lib/modules/finanzas/estado.ts:15-21 |
| CF-13 | Enum estado `ordenes_compra` | c1 `emitida/recibida_verificada/rechazada` (c1:162) vs c4 `solicitada/aprobada/en_pago/pagada/recibida/cancelada` (c4:109-111) | **7 estados:** `solicitada → aprobada → en_pago → pagada → recibida_verificada | rechazada | cancelada` | a2_2:137 (DET-07); c1:162; c4:109-111 |
| CF-14 | Enum estado citación E-23 | `citado` (c2:77) vs `citada` (c1:184) | **`citada`** (citada → en_verificacion → verificada) | a2_2:135 (DET-05); c1:184 |
| CF-15 | Ancla del SLA E-50 (t0) | `hora_primer_contacto` en `clientes` (c1:77) vs `created_at` de `leads` (c2:164) | **`leads.hora_primer_contacto`** como t0 (jamás `clientes.created_at` si se conservara la absorción) — `hora_primera_respuesta` en `leads`/`conversaciones` | a2_2:143 (DET-13); c1:77; c2:163-165; c5:106 |
| CF-16 | Fuente del monto a pagar E-20 | `monto_a_pagar` (c2:79) vs `pagos_proveedor.monto` (c1:164) vs `ordenes_compra.monto_total/anticipo_monto` (c4:120-121) | **`ordenes_compra.monto_total`** y `anticipo_monto` según mecánica de pago | a2_2:147 (DET-17); c4:120-121; c1:162 |
| CF-17 | Caja E-20 (fuente de verdad) | derivada Σsaldos−Σpor_pagar (c2:47) vs `saldo_actual` almacenado transaccional (c4:306-310) | **Caja derivada como fuente** para el predicado; `saldo_actual` conservado como materializado reconciliado (P3-12; `acciones.ts:96-101` depende de él) | a2_2:138 (DET-08); c2:47; c4:306-310; sch:236 |
| CF-18 | Fechas como `text` | sch:244,260 (H9 c4:354; CC-09 a2_4:84) | **`movimientos_financieros.fecha` → timestamp; `obligaciones_pendientes.fecha_vencimiento` → date**; actualizar `acciones.ts:78` en la misma release. Alternativa de menor fricción documentada | a2_2:142 (DET-12); c4:162,185; a2_4:84 (CC-09); sch:244,260 |
| CF-19 | Dual-identidad `personas` vs `usuarios` | lo existente FK→`usuarios` (sch:225) vs lo nuevo FK→`personas` (c4:152,221,247; c3:121-130) | **`personas` = identidad de negocio; `usuarios` = identidad de login, con puente `usuarios.persona_id`**; `verificador_id → personas` | a2_4:83 (CC-08); c3:121-130; c4:152,221,247; sch:225 |
| CF-20 | Designación del verificador | `asignaciones_proyecto` (c1:66) vs `proyectos.verificador_id` (c3:144) vs `comercial_vendedor_id` (c2:242) | **`proyectos.verificador_id → personas`** (designación por despacho, D3/I-035); sin rol "verificador" permanente | a2_4:82 (CC-07); c3:144; c1:66; define:153 |
| CF-21 | GAP columna `fecha_entrada_desarrollo` | ausente en todos los A1 (a2_2:132 DET-02) | **Añadir `proyectos.fecha_entrada_desarrollo`** (t0 del predicado E-18: `veredicto.creado_en ≥ fecha_entrada_desarrollo`) | a2_2:132 (DET-02); c2:75,259 |
| CF-22 | GAP columna `desfases_cronograma.aplicado` | ausente en c1:139 (a2_2:133 DET-03) | **Añadir `desfases_cronograma.aplicado` (boolean)**; el predicado E-33 exige `aplicado=true` | a2_2:133 (DET-03); c2:78; c1:139 |
| CF-23 | Arriendos E-57 | tabla `arriendos` (c1:217) vs obligaciones `origen='arriendo'` (c4:338) | **Obligaciones `origen='arriendo'` + `periodicidad='mensual'` + movimiento egreso** (tercer flujo de pago) | c4:338; c1:217; discover:104 |

---

## Schema consolidado (tabla definitiva)

**Conteo: 65 tablas** = 18 existentes (11 conservadas + 7 ampliadas) + 47 nuevas. **Cobertura 61/61 eventos** (E-42, E-43, E-47, E-58 = lecturas derivadas, sin tabla). Convención: `[nueva]` = tabla nueva; `[ampliada]` = existente con columnas nuevas; `[conservada]` = sin cambio estructural. Columnas en snake_case (patrón c5:219).

### 1. Transversal (identidad, roles, auditoría, parámetros) — precondición de capa 1 (define:55-61,176)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `roles` | [nueva] | id, codigo (unique), nombre, descripcion | — | Guards E-18/E-24; E-31 por rol (c3:121-130) |
| `personas` | [nueva] | id, nombre, documento, telefono, activo | — | Identidad de negocio de todos los FKs de dinero/roles (CC-08) |
| `personas_roles` | [nueva] | id, personaId→personas, rolId→roles, activo, desde | personaId→personas; rolId→roles | Una persona varios roles (define:57; c1:65) |
| `asignaciones_proyecto` | [nueva] | id, proyectoId→proyectos, personaId→personas, rolId→roles, activo | proyectoId→proyectos; personaId→personas; rolId→roles | Rol por despacho; base de la designación del verificador (c1:66) |
| `usuarios` | [conservada] | (sch:64-75) + `personaId` → personas (puente login↔negocio) | clienteId→clientes; personaId→personas | Login/identidad (c3; CC-08) |
| `verificaciones` | [nueva] | id, proyectoId→proyectos, tipoGate ('schema'\|'calidad'), verificadorId→personas, veredicto ('aprobado'\|'rechazado'), detalle, creadoEn | proyectoId→proyectos; verificadorId→personas | E-18/E-24 (veredicto del verificador único, D3) |
| `excepciones_gate` | [nueva] | id, gate (E-XX), entidad, entidadId, motivo, responsableId→personas, autorizadorId→personas, createdAt | responsableId→personas; autorizadorId→personas | "Guía + registrador de la realidad" (D1/C1); E-20 **sin** bypass (ENF-21) |
| `eventos` | [nueva] | (c5:53-78: 15 columnas: id, ocurrenciaId, tipoEvento enum 61, entidad, entidadId, estadoAntes/Despues text, actorId→usuarios, actorRol text, eventoReferenciaId self-FK, leadId/clienteId/proyectoId/contratoId, payload jsonb, createdAt) | actorId→usuarios; contexto FKs | Auditoría append-only de mutaciones y gates (56 logueados, 4 derivados, 1 diferido) |
| `procedencia` | [nueva] | (c5:80-94: hijoEntidad, hijoId, padreEntidad, padreId, tipoEvento, tipoRelacion, createdAt) | — | Lineage "al nacer el dato" (D3); cadena lead→cliente→proyecto y BOM→OC→recepción |
| `parametros` | [nueva] | id, clave (unique), grupo, tipo (numerico/texto/booleano), valorNumeric, valorTexto, valorBooleano, unidad, descripcion, vigenteDesde, updatedAt; CHECK exclusión | — | SLA E-50, novedad E-34, 12 días E-29, comisiones E-31/E-35, bruto diseño E-08 (16 RESUELTAS + 10 PENDIENTES) |
| `parametros_historial` | [nueva] | id, parametroId, claveSnapshot, valorNumericAnterior/Nuevo, valorTextoAnterior/Nuevo, valorBooleanoAnterior/Nuevo, actorId→usuarios, actorRol, motivo, vigenteDesde, createdAt | parametroId→parametros; actorId→usuarios | Versionado/auditoría de parámetros (append-only, P-04/P-10) |

### 2. Comercial / Cotizador (15 eventos: E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `leads` | [ampliada] | (sch:271-281) + `estado` (nuevo/en_contacto/calificado/no_viable/descartado/redirigido/cliente), `canal`, `gclid`, `hora_primer_contacto`, `hora_primera_respuesta`, `sla_cumplido`, `sla_ventana_min` (default 5), `escalacion_sla` jsonb, `reagenda_count`, `motivo_no_viable`, `cliente_id` → clientes | clienteId→clientes | E-01..E-04, E-46, E-49, E-50, E-51 (identidad conservada, CF-01) |
| `clientes` | [ampliada] | (sch:77-87) + `etapa_funnel` (referencia de la evolución del lead; no duplica el embudo) | 1—N proyectos/obligaciones/usuarios/pedidos | Referente de identidad (E-51) |
| `conversaciones` | [nueva] | id, clienteId→clientes, canal, mensajes jsonb, horaPrimeraRespuesta | clienteId→clientes | E-02 (hora de primera respuesta, c1:78) |
| `citas` | [nueva] | id, clienteId→clientes, franjaInicio, franjaFin, tipo ('visita'), agendadaPor, reagendaConteo (máx 1), estado (agendada/realizada/no_show/cancelada) | clienteId→clientes | E-06, E-07, E-46 (V-1 reagenda, define:140) |
| `visitas` | [nueva] | id, citaId→citas, proyectoId→proyectos, observaciones, medidasTomadas jsonb, fecha, tomadaPor→personas | citaId→citas; proyectoId→proyectos | E-07 (registro estructurado, I-010) |
| `proyectos` | [ampliada] | (sch:91-109) + `verificador_id`→personas, `fecha_entrada_desarrollo`, `comercial_vendedor_id`→personas; **enum estado extendido** (mapa ENF-01 completo: borrador/en_revision/cotizado/desarrollo/aprobado_compras/armado/verificado/instalado/entregado/perdida/cancelada) | clienteId→clientes; verificadorId→personas | E-05; máquina de estados de E-09..E-51 (c2:101-113) |
| `cotizaciones` | [nueva] | id, proyectoId→proyectos, version, estado (borrador/en_revision/cotizado/anulada), snapshotProyecto jsonb, valorTotal, publicadaAt, ajustesCount | proyectoId→proyectos | E-05/E-09/E-10/E-11 (snapshot congelado P3-07) |
| `diseños3d` | [nueva] | id, proyectoId→proyectos, creadoPor→personas, precio (default 130000), estado (propuesto/pagado/descontado), descuentoAplicadoEn | proyectoId→proyectos; creadoPor→personas | E-48, E-08, E-30 (c1:83) |
| `espacio_variantes` | [conservada] | (sch:111-127) | proyectoId→proyectos; 1—N itemsVariante | Base dimensional E-05..E-11 |
| `items_variante` | [conservada] | (sch:152-162) | varianteId→espacioVariantes; catalogoId→productosCatalogo | Ítems de cotización (E-10/E-11) |
| `productos_catalogo` | [conservada] | (sch:129-150) | proveedorId→proveedores; proyectoOrigenId→proyectos | Catálogo (mezcla insumos/producto = DECISION_PENDIENTE, c1:356) |

### 3. Contratos (4 eventos: E-12, E-13, E-16, E-53)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `contratos` | [conservada] | (sch:174-194; estado borrador/firmado; `valor_total` NO se toca — CC-10) | proyectoId→proyectos; 1—N hitosPago | E-12 |
| `hitos_pago` | [conservada] | (sch:198-206) | contratoId→contratos; 1—N obligacionesPendientes.hito_id | E-12; especifica nacimiento de obligación E-56 |
| `firmas_contrato` | [nueva] | id, contratoId→contratos, tipo (cliente/empresa), firmanteNombre, documento, metodo ('firma_digital'), tokenFirma, fechaFirma | contratoId→contratos | E-13 (firma virtual; subsistema DIFERIDO) |
| `disponibilidad_cliente` | [nueva] | id, contratoId→contratos, proyectoId→proyectos, tieneViajes, viajesProgramados jsonb, situacionesExternas, capturadoEn | contratoId→contratos; proyectoId→proyectos | E-53 (cuestionario de viajes; consumidor en cronograma) |
| `cambios_contrato` | [nueva] | id, contratoId→contratos, tipo (adicional/cambio/reproceso), descripcion, especificacion jsonb, impactoMedible jsonb, costoCliente, tiempoPropio, estado (propuesto/aprobado/aplicado), origen | contratoId→contratos | E-16 (flow I-027; doble destino Desarrollo+Finanzas; dispara E-33) |

### 4. Control de cronograma (6 eventos: E-14, E-33, E-34, E-52, E-59, E-60)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `estimaciones` | [nueva] | id, proyectoId→proyectos, valor, cantidadModulos, duracionEstimadaJornadas, factorCrecimientoPct, estado (borrador/acordada), acordadaEntre jsonb | proyectoId→proyectos | E-52 (disparada en Comercial, fijada en Control) |
| `cronogramas` | [nueva] | id, proyectoId→proyectos, fechaFijacion, estado (fijado/recalculado/cerrado), baseSemanas (default 4), holguraTotalDias (máx 5), estimacionId→estimaciones | proyectoId→proyectos; estimacionId→estimaciones | E-14 (promesa 7 semanas; ancla I-024) |
| `cronograma_etapas` | [nueva] | id, cronogramaId→cronogramas, linea (contractual/interna), etapa (aprobacion/compras/ensamblaje/instalacion — P5-09), fechaInicio, fechaFin, jornadas, orden, estado (pendiente/en_curso/cumplida/desfasada) | cronogramaId→cronogramas | E-14; doble línea I-034; E-33 recalcula `interna` |
| `desfases_cronograma` | [nueva] | id, proyectoId→proyectos, cronogramaEtapaId→cronograma_etapas, causa (interna/externa/cambio_contrato), motivo, composicionCausal jsonb (D4), decisionManual, justificacionManual, nuevasFechas jsonb, **aplicado** (boolean), createdAt | proyectoId→proyectos; cronogramaEtapaId→cronograma_etapas | E-33 (predicado P33; causa estructurada; consumido por E-35) |
| `novedades_criticas` | [nueva] | id, proyectoId→proyectos, descripcion, fase, ventanaSlaHoras (5-24), horaEntrada, horaResolucion, estado (abierta/en_atencion/resuelta/escalada), cumplioSla, escaladoA→personas | proyectoId→proyectos; escaladoA→personas | E-34 (SLA; sin multa — I-054/4) |
| `check_15_dias` | [nueva] | id, proyectoId→proyectos, fechaCheck, insumosEnTaller, compradosOPagados, proyectosEnFila, desenlace (todo_bien/novedad/extremo), decision, comisionesReducidas | proyectoId→proyectos | E-59 (log real; 3 desenlaces; alimenta E-25/E-35/E-60) |
| `comunicaciones_progreso` | [nueva] | id, proyectoId→proyectos, tipo (progreso/adelanto_instalacion), contenido, visibleAlCliente, canal (app_cliente/whatsapp), creadoPor (sistema/comercial) | proyectoId→proyectos | E-60 (único frontstage, define:38) |

### 5. Desarrollo (4 eventos: E-15, E-17, E-18, E-54)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `retomas` | [nueva] | id, proyectoId→proyectos, fecha, realizadaPor jsonb (comercial+desarrollador), medidas jsonb, notasRetoma, electrodomesticos jsonb, obstaculos, anomaliaDetectada | proyectoId→proyectos | E-15 (post-contrato; anomalía → E-16) |
| `schemas_proyecto` | [nueva] | id, proyectoId→proyectos, version, estado (borrador/en_desarrollo/para_revision/aprobado_compras/rechazado/en_reproceso), autorRol, schemaDatos jsonb, aprobadoPorRol, aprobadoEn, activo | proyectoId→proyectos; 1—N bom_materiales/verificaciones/modelos_3d | E-17 (versionado tesis); E-18; E-54 |
| `bom_materiales` | [nueva] | id, schemaId→schemas_proyecto, catalogoId→productos_catalogo (nullable), nombreMaterial, cantidad, unidadMedida, origen (cotizacion/desarrollo), homologable, linajeItemId→items_variante | schemaId→schemas_proyecto; catalogoId→productos_catalogo; linajeItemId→items_variante | E-17 (linaje P3-05; origen de la lista de compras) |
| `verificaciones` | [nueva] | (ver sección Transversal) | — | E-18 (gate, verificador único) |
| `reprocesos` | [nueva] | id, proyectoId→proyectos, origen (schema/calidad/instalacion), modulo, componente, culpable (proveedor/desarrollador/comercial — D2), estado (abierto/en_reproceso/resuelto/cerrado), recalculaCronograma | proyectoId→proyectos | E-54 (granularidad módulo/componente, C2; dispara E-33) |

### 6. Compras (4 eventos: E-19, E-20, E-21, E-45)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `ordenes_compra` | [nueva] | id, codigoOrden, proyectoId→proyectos (nullable E-45), schemaId→schemas_proyecto (nullable), proveedorId→proveedores, mecanicaPago (anticipo_saldo/unico/subcontratacion), origen (proyecto/operativa), montoTotal, anticipoMonto, **estado (7: solicitada/aprobada/en_pago/pagada/recibida_verificada/rechazada/cancelada)**, fechas | proyectoId→proyectos; schemaId→schemas_proyecto; proveedorId→proveedores; 1—N itemsOrdenCompra | E-19 (3 mecánicas); E-20 (gate de caja); E-45 (operativa) |
| `items_orden_compra` | [nueva] | id, ordenId→ordenes_compra, catalogoId→productos_catalogo (nullable), nombrePersonalizado, cantidad (esperada), precioUnitario, totalLinea, **recibidoCantidad (default 0), sinDefectos (nullable)** | ordenId→ordenes_compra; catalogoId→productos_catalogo | E-19; checklist C3 de E-21 (CF-03, DET-09/10) |
| `recepciones_material` | [nueva] | id, ordenCompraId→ordenes_compra, proyectoId→proyectos, checkPedidoBien, checkDespachoBien, checkMaterial, estado (pendiente/recibido_verificado/recibido_defectuoso), fecha, verificadoPorRol ('desarrollador') | ordenCompraId→ordenes_compra; proyectoId→proyectos | E-21 (triple verificación; el `checklist` por ítem vive en items_orden_compra, CF-03) |
| `herramientas` | [nueva] | id, nombre, tipo, valor, fotoUrl, estado (operativa/mantenimiento/dañada/necesita_reposicion), proveedorId→proveedores, notas | proveedorId→proveedores | E-45 (reposición → OC origen='operativa') |

### 7. Taller / Armado (1 evento de frontera: E-22) — detalle interno DIFERIDO (capa 2)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `ordenes_trabajo` | [ampliada] | (sch:210-218) + `tipo` (produccion/garantia), `origen` (proyecto/pedido_web), `pedidoWebId`→pedidos_web, `checkCompletitud`, `completitudChecklist` jsonb, `fechaCheckCompletitud`; **estado text→enum** (aditivo, incluye 'pendiente' — CC-03) | proyectoId→proyectos; pedidoWebId→pedidos_web | E-22; E-37 (garantía); E-61 (check completitud); E-44 (enganche) |
| `modulos_armado` | [nueva] | id, proyectoId→proyectos, ordenTrabajoId→ordenes_trabajo, modulo, estado (por_armar/en_armado/armado/en_calidad/aprobado/en_instalacion), horasEstimadas | proyectoId→proyectos; ordenTrabajoId→ordenes_trabajo | E-22 (fila de salida; input de E-59/E-34) |
| `tareas_produccion` | [conservada] | (sch:220-227; **estado NO se tipa** — la API escribe 4 valores de texto) | ordenId→ordenes_trabajo; operarioId→usuarios | DIFERIDO capa 2 (define:173) |

### 8. Calidad / Verificación (2 eventos: E-23, E-24)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `citaciones_calidad` | [nueva] | id, proyectoId→proyectos, modulosIds jsonb, citadoEn, ventanaProgramada, estado (**citada**/en_verificacion/verificada) | proyectoId→proyectos | E-23 (push, señal — no gate) |
| `verificaciones` | [nueva] | (sección Transversal; `tipo_gate='calidad'`) | — | E-24 (veredicto pre-despacho) |

### 9. Entrega / Instalación (2 eventos: E-25, E-26)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `instalaciones` | [nueva] | id, proyectoId→proyectos, rangoFechaInicio, rangoFechaFin, fechaReal, instaladorRol, estado (programada/en_curso/instalada/fallida), adelantadaPor→check_15_dias | proyectoId→proyectos; adelantadaPor→check_15_dias | E-25 (rango 5 días; fallida → E-54) |
| `actas_entrega` | [nueva] | id, proyectoId→proyectos, instalacionId→instalaciones, firmadoPor (cliente/empresa), fechaFirma, holguraOperativaDias (default 12), estado (pendiente/firmada), pdfUrl | proyectoId→proyectos; instalacionId→instalaciones | E-26 (acta digital 100%; proyecto→entregado) |

### 10. Garantía (3 eventos: E-36, E-37, E-61)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `citas_garantia` | [nueva] | id, proyectoId→proyectos, clienteId→clientes, problemaReportado, fechaAgendada, ventanaDias (8-12 hábiles), estado (agendada/confirmada/atendida/cancelada) | proyectoId→proyectos; clienteId→clientes | E-36 (ventana contractual) |
| `ordenes_trabajo` (tipo='garantia') | [ampliada] | (ver Taller) | — | E-37; E-61 (check completitud F-11) |

### 11. Finanzas / Compensación (12 eventos: E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `cuentas_financieras` | [conservada] | (sch:231-237; `saldo_actual` conservado como materializado reconciliado — CF-17) | 1—N movimientos | E-43 (caja derivada) |
| `movimientos_financieros` | [ampliada] | (sch:239-252) + `socioId`→personas, `ordenCompraId`→ordenes_compra, `medioPago`, `comprobanteUrl`, `prioridadPago` (materiales/arriendos/nominas), `referencia`, `concepto` (diseno_3d/anticipo/hito_cliente/pago_proveedor/arriendo/nomina/comision); **`fecha` text→timestamp** (CF-18) | socioId→personas; ordenCompraId→ordenes_compra; + FKs existentes | E-08 (diseno_3d), E-20 (pago proveedor, sustituye pagos_proveedor), E-28, E-30, E-57 (arriendo), E-58 (lectura por socio) |
| `obligaciones_pendientes` | [ampliada] | (sch:254-267) + `hitoId`→hitos_pago, `origen` (contrato_hito/diseno_3d/proveedor/arriendo/nomina), `deduccionDiseno3d`, `periodicidad`, `fechaNotificacion`, `atrasoDias`, `notificadoGerente`; **estado enum aditivo (+`atrasada`)**; **`fecha_vencimiento` text→date** (CF-18) | hitoId→hitos_pago; + FKs existentes | E-56 (nacimiento por hito), E-27, E-28, E-29 (atraso + aviso gerente), E-30 (deducción) |
| `liquidaciones_compensacion` | [nueva] | id, personaId→personas, rol, periodoInicio, periodoFin, tipoBase (quincena/horas/proyecto/diseno_3d), montoBase, estado (proyectada/pagada), cuentaCobroUrl, fechaPago | personaId→personas; 1—N comisionesProyecto | E-31 (base); E-32 (cuenta de cobro); E-58 (lectura) |
| `comisiones_proyecto` | [nueva] | id, proyectoId→proyectos, personaId→personas, rol, tipoComision (cumplimiento_cronograma/tamano/venta/modulo_instalado/diseno_3d), baseCalculo, porcentaje, montoFijo, cantidadModulos, monto, estado (proyectada/liquidada/ajustada), desfaseId→desfases_cronograma, liquidacionId→liquidaciones_compensacion | proyectoId→proyectos; personaId→personas; desfaseId→desfases_cronograma; liquidacionId→liquidaciones_compensacion | E-35 (ajuste por cumplimiento; causa interna reduce); E-31 |
| `registros_horas` | [nueva] | id, personaId→personas, fecha, rol, horasNormales, horasExtra, observacion; UNIQUE(personaId, fecha) | personaId→personas | E-31 (auxiliar por horas); E-47 (bienestar V-5) |
| `facturas` | [nueva] | id, contratoId→contratos, numeroFactura, fechaEmision, valorTotal, estado (emitida/anulada), urlDocumento | contratoId→contratos | Registro del hecho facturado en "Aliado" (externo) |

### 12. Documentación (1 evento: E-41)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `documentos_proyecto` | [nueva] | id, proyectoId→proyectos, etapa (embudo/cotizacion/contrato/retoma/desarrollo/compras/taller/calidad/entrega/garantia), tipo (foto/documento/pdf), archivoUrl, alojador (drive_veta_erp/r2 — R2 DIFERIDO), subidoPorRol (comercial/desarrollador) | proyectoId→proyectos | E-41 (taxonomía VETA_ERP; D5 sin rol catch-all) |

### 13. Integraciones (2 eventos: E-38, E-39)

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `modelos_3d` | [nueva] | id, schemaId→schemas_proyecto, proyectoId→proyectos, etiquetas jsonb, estado (pendiente/generado/enviado), herramienta (veta_designer/sketchup_opencutlist) | schemaId→schemas_proyecto; proyectoId→proyectos | E-38 (precedencia E-18) |
| `pedidos_corte` | [nueva] | id, modelo3dId→modelos_3d, archivoCvc, proveedorCorte (sivaltriplex preferido), estado (generado/enviado/confirmado) | modelo3dId→modelos_3d | E-39 (CVC→corte) |

### 14. Marketing / Demanda (3 eventos: E-40, E-42, E-55) — ⚠ construcción DIFERIDO (t-034), interfaces de frontera

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `conversiones_ads` | [nueva] | id, clienteId→clientes, proyectoId→proyectos, tipo (gclid/enhanced_conversion), gclid, emailHash, telefonoHash, enviado, enviadoAt | clienteId→clientes; proyectoId→proyectos | E-40 (DIFERIDO t-034) |
| `testimonios` | [nueva] | id, proyectoId→proyectos, clienteId→clientes, contenido, rating, curado, aprobado, publicado | proyectoId→proyectos; clienteId→clientes | E-55 (DIFERIDO t-034) |

### 15. Gobierno / Medición (1 evento: E-47) — lectura, sin escritura; construcción DIFERIDO

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `registros_horas` | [nueva] | (ver Finanzas) | — | E-47 (KPI bienestar, V-5) |

**Lecturas derivadas (sin tabla propia):** E-42 (embudo, sobre `eventos`), E-43 (caja, sobre `cuentas_financieras`/`movimientos_financieros`), E-47 (KPIs, sobre `proyectos`/`cronogramas`/`movimientos`/`registros_horas`), E-58 (saldo por socio, sobre `movimientos_financieros.socio_id` + `liquidaciones_compensacion`). Regla c5: "se derivan del log, no se loguean a sí mismos" (c5:26).

---

## Normalización y campos muertos

### NORMALIZACION aplicada (violaciones FN/identidad/relación resueltas)

| # | Normalización | Resolución | Fuente |
|---|---|---|---|
| N-01 | Identidad lead→cliente en dos tablas sin vínculo tipado | `leads.cliente_id` FK + `procedencia(cliente←lead, E-51)` + `proyectos.clienteId` — identidad evolutiva sin duplicado (P3-01) | c5:27,120,175; c1:73; sch:271-281,93 |
| N-02 | Rol único por persona (`usuarios.rolEmpleado` enum 4 valores) vs rol-vs-persona | Modelo N:N `roles` + `personas_roles` (8 roles del Define + contador); `rolEmpleado` se depreca en release coordinada (CC-05), conservándose temporalmente para no romper auth | c3:72,121-140; define:57; sch:27-32 |
| N-03 | Dual-identidad `personas` vs `usuarios` (login vs negocio) | `personas` = identidad de negocio; `usuarios.persona_id` como puente tipado; FKs de negocio (`socio_id`, `persona_id`, `verificador_id`) → `personas` | a2_4:83 (CC-08); c3:121-130; c4:152,221,247 |
| N-04 | Veredictos de gates duplicados en 3 diseños | UNA `verificaciones` con `tipo_gate ∈ {schema, calidad}` | a2_2:134 (DET-04); a2_3:140 (G-4); c3:150-158 |
| N-05 | Cronograma con dos esquemas para la misma doble línea I-034 | `cronogramas` + `cronograma_etapas.linea` (contractual/interna) | a2_3:142 (G-6); c1:137-138; c2:78 |
| N-06 | Fechas `text` bloqueando aritmética (E-29 12 días, caja) | `movimientos_financieros.fecha` → timestamp; `obligaciones_pendientes.fecha_vencimiento` → date; actualizar `acciones.ts:78` en la misma release | a2_2:142 (DET-12); c4:162,185; a2_4:84 (CC-09); sch:244,260 |
| N-07 | Estado de obligación con dos nombres ('vencida'/'atrasada') | Unificar a `atrasada`, aditivo sobre los 3 valores que escribe `estado.ts:15-21` (pendiente/parcial/pagado) | a2_2:136 (DET-06); c4:172; c2:79 |
| N-08 | Estado `ordenes_compra` con dos enums | 7 estados unificados: solicitada/aprobada/en_pago/pagada/recibida_verificada/rechazada/cancelada | a2_2:137 (DET-07); c1:162; c4:109-111 |
| N-09 | Caja con dos fuentes de verdad (P3-12) | Predicado E-20 usa **caja derivada** (Σ `saldo_actual` − Σ por_pagar pendientes); `saldo_actual` conservado como materializado reconciliado | a2_2:138 (DET-08); c2:47; c4:306-310; sch:236 |
| N-10 | Captura duplicada visita (E-07) vs retoma (E-15) sin relación de superación | `visitas` y `retomas` coexisten con propósitos distintos (visita pre-cotización, retoma post-contrato); sin relación de superación — documentado (P3-09) | c1:80; discover:41,63 |

### RUIDO_SCHEMA colapsado / evitado (campos y tablas sin consumidor único)

| # | Tabla/campo | Veredicto | Razón y tratamiento | Fuente |
|---|---|---|---|---|
| R-01 | `pagos_proveedor` | Colapsado | El pago es un `movimientos_financieros` con `orden_compra_id`/`prioridad_pago` — una tabla propia duplicaría la fuente de dinero | a2_3:144 (G-8); c4:152-158 |
| R-02 | `registros_gate_caja` | Colapsado | Rama negativa del gate E-20 → fila `eventos` gate con payload; una sola traza auditable | a2_3:144 (G-8); c5:207 |
| R-03 | `veredictos_calidad` / `verificaciones_schema` | Colapsadas | Unificadas en `verificaciones.tipo_gate` | a2_3:140 (G-4) |
| R-04 | `eventos_negocio` / `registro_actividad` | Colapsadas | Unificadas en `eventos` + `procedencia` (la única que cumple el contrato completo) | a2_3:152-158 (H03); c5:53-94 |
| R-05 | `parametros_compensacion` | Colapsada | Unificada en `parametros` con columna `grupo` (P-03) | a2_5:123 (P-03) |
| R-06 | `transiciones_embudo`, `cuentas_socios`, `metricas_kpi` | Evitadas | Derivaciones sin tabla (lección P3-12) | c1:37-39; c1:219 |
| R-07 | `arriendos` como tabla | Evitada | E-57 = obligaciones `origen='arriendo'` + movimiento egreso | c4:338 |
| R-08 | `checklist` jsonb en `recepciones_material` | Corregido | Reemplazado por columnas tipadas por ítem en `items_orden_compra` (`recibido_cantidad`, `sin_defectos`, `catalogo_id`) | a2_2:140 (DET-10); c1:163 |
| R-09 | jsonb `contextoNegocio` en eventos | Evitado | El contexto son los FKs de cadena (`leadId/clienteId/proyectoId/contratoId`) | c5:28 (2c); sch:246-250 |
| R-10 | Loguear lecturas (E-42/E-43/E-47/E-58) | Evitado | Se derivan; loguearlas sería auto-referencia | c5:26,148,163,164 |

### NO es RUIDO (campos que sobreviven con consumidor documentado)

| # | Campo | Veredicto | Consumidor | Fuente |
|---|---|---|---|---|
| S-01 | `leads.score_conversion` (sch:279) | Conservar | Score 1-10 de conversiones offline (I-012), consumido por E-03/E-42 | c1:41,360; log_insights:27 |
| S-02 | `cuentas_financieras.saldo_actual` (sch:236) | Conservar | Materializado transaccional; el código depende de él (`acciones.ts:96-101`) | a2_4:64; c2:47 |
| S-03 | `tareas_produccion.estado` (sch:224) | Conservar sin tipar | La API escribe 4 valores de texto; DIFERIDO capa 2 | a2_4:63; sch:224 |
| S-04 | `contratos.valor_total` | No tocar | La deducción del diseño 3D vive en `obligaciones_pendientes.deduccion_diseno_3d`; restarlo rompería `validar_hitos` (validacion.ts:37-43) | a2_4:85 (CC-10); c4:187 |

---

## Decisiones de identidad

1. **Identidad lead → cliente → proyecto (E-51):** `leads` se conserva como tabla (CF-01). El "mismo registro que cambia de estado" del Define (define:51) se materializa con `leads.cliente_id` FK que se fija en E-51 + `procedencia(cliente ← lead, E-51)` + `proyectos.clienteId`. Razones: absorber `leads` rompe `api/leads/route.ts:23` y `agendar/page.tsx:26-31` (a2_4:76) y pierde la separación "no es cliente aún"; nada referencia `leads` hoy → FK-safe. La alternativa `leads.cliente_id` no duplica contacto (P3-01) y deja `clientes` como referente del dinero (obligaciones, pedidos).
2. **Rol-vs-persona (precondición de capa 1, define:55-61,176):** `roles` (8 tipados del Define + `contador`; sin `verificador` porque es designación, sin `compras` hasta DECISION) + `personas` + `personas_roles` (N:N). `usuarios.rolEmpleado` se depreca en la Fase 4 de migración (CC-05) — no en este pase.
3. **Verificador único (D3/I-035):** designación por despacho en `proyectos.verificador_id → personas` (el comercial vendedor del proyecto). No es rol permanente ni el gerente (define:153). Se evalua con rol incluido en `personas_roles` (intersección en los guards).
4. **Auditoría única (c5):** `eventos` append-only (snapshot de texto en `estadoAntes/Despues`, `actorRol` denormalizado) + `procedencia` (lineage escrito al nacer el dato). Guard anti-`agnostic_records`: las tablas de dominio son la fuente de verdad, el stream es observabilidad (c1:43).
5. **Lecturas derivadas sin tabla:** E-42 (embudo), E-43 (caja), E-47 (KPIs), E-58 (saldo por socio) — nunca tablas almacenadas (lección P3-12, c1:219).
6. **`excepciones_gate`** materializa "guía + registrador de la realidad" (D1/C1): toda transición de gate puede avanzar con bypass auditable (motivo + responsable + autorizador), **excepto E-20** (bloqueo completo, define:87).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| A2-1-01 | `CORRECCION_SCHEMA` | Identidad lead→cliente resuelta conservando `leads` (no absorción en `clientes` como proponía A1-1). Alineado a CC-01/DET-11/G-1; la migración de la variante de absorción queda descartada | a2_4:76 (CC-01); a2_2:141 (DET-11); a2_3:137 (G-1); c1:73,314; c5:169-175 |
| A2-1-02 | `CORRECCION_SCHEMA` | Veredictos E-18/E-24 unificados en `verificaciones.tipo_gate` (colapsa `veredictos`, `verificaciones_schema`, `veredictos_calidad`) | a2_2:134 (DET-04); a2_3:140 (G-4); c3:150-158 |
| A2-1-03 | `GAP_SCHEMA` (resuelto) | `proyectos.fecha_entrada_desarrollo` añadida — t0 del predicado E-18 (`veredicto.creado_en ≥ fecha_entrada_desarrollo`); ninguno de los A1 la proponía | a2_2:132 (DET-02); c2:75,259 |
| A2-1-04 | `GAP_SCHEMA` (resuelto) | `desfases_cronograma.aplicado` (boolean) añadida — el predicado E-33 exige `aplicado=true`; ausente en A1-1 | a2_2:133 (DET-03); c2:78; c1:139 |
| A2-1-05 | `GAP_SCHEMA` (resuelto) | Campos de recepción por ítem en `items_orden_compra` (`recibido_cantidad`, `sin_defectos`) — sin ellos, E-21 quedaba DETERMINISMO_ROTO si se adoptaba solo A1-4 | a2_2:139-140 (DET-09/10); c4:129-137; c1:163 |
| A2-1-06 | `NORMALIZACION` | Fechas `text`→timestamp/date (`movimientos_financieros.fecha`, `obligaciones_pendientes.fecha_vencimiento`); la aritmética del atraso de 12 días (E-29) queda `DETERMINISMO_OK` al corregirse | a2_2:142 (DET-12); c4:162,185 (H9); sch:244,260 |
| A2-1-07 | `NORMALIZACION` | Dual-identidad `personas` vs `usuarios` resuelta con puente `usuarios.persona_id`; FKs de negocio → `personas` | a2_4:83 (CC-08); c3:121-130; c4:152,221,247 |
| A2-1-08 | `DECISION_PENDIENTE` | Valores numéricos sin fuente se modelan como parámetros con valor vacío (retención/IVA diseñador, comisión de cierre, módulo instalado, tarifa hora, quincena, umbral check15, base del 5%) — no se inventan (regla `met:18`) | a2_5:87-101; define:128,145; c4:362 |
| A2-1-09 | `DECISION_PENDIENTE` | ¿"compras" es rol tipado o función del gerente? (E-19/E-20 disparan "compras"; caja la maneja el gerente) | a2_4; c3:107 (H6); discover:72,73,117 |
| A2-1-10 | `DECISION_PENDIENTE` | Deprecación de `usuarios.rolEmpleado` hacia `personas_roles`: es cambio de contrato (firma de 6+ archivos de auth/nav/equipo), requiere release coordinada — no un pase de schema suelto | a2_4:80 (CC-05); c3:72-73; lib/auth/session.ts:9 |
| A2-1-11 | `DECISION_PENDIENTE` | Veracidad de la composición causal de E-33 (D4): el predicado exige existencia, no verdad; `decision_manual`/`justificacion_manual` registran la desviación | a2_2:144 (DET-14); c2:246 (ENF-12); define:79,139,155 |
| A2-1-12 | `DECISION_PENDIENTE` | Catálogo: mezcla insumos vs producto terminado en `productos_catalogo` — distinguir a nivel de validación | c1:356 (H-A1-43); logica:159 |
| A2-1-13 | `DIFERIDO` | Detalle interno del taller (capa 2), Marketing/Tienda/Gobierno (t-034), firma digital como subsistema, alojador R2, facturación DIAN | define:173-174; c1:45; c2:209-212 |
| A2-1-14 | `CORRECCION_SCHEMA` | Enum `proyectos.estado` extendido con mapeo 1:1 COMPLETO de los 8 valores legacy (incluye `entregado`/`perdida`/`cancelada`, que ENF-01 omitía) + `borrador/en_revision/cotizado/desarrollo/aprobado_compras/armado/verificado/instalado` | a2_4:77 (CC-02); c2:235 (ENF-01); sch:36-45 |

---

## Notas para el Orquestador

1. **Conteo del entregable: 65 tablas** = 18 existentes (11 conservadas + 7 ampliadas) + 47 nuevas, organizadas en 15 bounded contexts + sección transversal. **Cobertura: 61/61 eventos** (E-42/E-43/E-47/E-58 = lecturas derivadas sin tabla). Los 5 gates son `DETERMINISMO_OK` bajo el contrato de no-rotura de A2-2 (3 GAP de columna resueltos por adición, 6 divergencias de naming unificadas).
2. **Re-enlace obligatorio de los pases A2 que corrieron sin este consolidado:** A2-2 (DET-01), A2-3 (H01/G-3), A2-4 (P01) y A2-5 (P-01) declararon explícitamente que su fuente primaria (`d3_schema_a2_1_normalizacion.md`) **no existía** al ejecutarse. Este archivo ES esa fuente. **A2-3 (trazabilidad) debe re-verificar su matriz de 61 eventos contra este consolidado**, y **A2-2** re-chequear los 5 predicados contra las tablas/columnas finales. La decisión de identidad de este pase (CF-01) desbloquea los 8 GAP del embudo de lead de A2-3 (G-1).
3. **Decisiones tomadas que los demás pases deben respetar:** auditoría = `eventos`+`procedencia` (c5) — colapsa `eventos_negocio` y `registro_actividad`; parámetros = `parametros`+`parametros_historial` (A2-5 P-03); pago proveedor = `movimientos_financieros` (no `pagos_proveedor`); compensación = `liquidaciones_compensacion`+`comisiones_proyecto` (A1-4). Verificado: ninguna de las 10 tablas marcadas CONSERVAR por A2-4 se borra o renombra.
4. **Para A2-3 (trazabilidad):** los 61 eventos tienen huella en el consolidado; la atomicidad evento+mutación en el mismo `tx` (regla A1-5:214) debe verificarse en la implementación, no en el schema.
5. **Para A3 (auditor final):** los goals duros de `met:147` (61/61 huella, 5 gates deterministas, 0 campos muertos) ahora SÍ son auditables contra este archivo. Checklist heredado: la matriz de A2-3, la verificación de A2-2 y las tablas de consistencia de A2-4.
6. **Prohibido cumplido:** este pase solo escribió `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md`. No modificó `lib/db/schema.ts`, `lib/modules/*`, `arnes/*` ni ningún otro archivo. Los cambios propuestos quedan documentados como esquema objetivo para la migración en 4 fases de A2-4.

---

## Registro

- Fecha: 2026-08-04 · Pase A2-1 (ola 2, en paralelo con A2-2..A2-5 — los pases hermanos se ejecutaron sin esta salida y quedan pendientes de re-verificación).
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md`.
- Loop de 3 iteraciones completado: 1 bruta → 2 autocrítica (13 resoluciones) → 3 refinamiento (schema consolidado).
- Conteo final: **65 tablas** (18 existentes: 11 conservadas + 7 ampliadas; 47 nuevas) · **61/61 eventos** · 23 conflictos resueltos (CF-01..CF-23) · 10 normalizaciones · 10 RUIDO colapsados/evitados · 4 "no es ruido" confirmados · 14 hallazgos · 6 decisiones de identidad.





