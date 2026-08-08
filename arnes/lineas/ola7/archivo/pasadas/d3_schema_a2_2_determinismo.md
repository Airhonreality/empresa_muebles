# Pase A2-2 — Determinismo de gates (subagente, loop de 3 iteraciones)

**Lente:** determinismo de los gates en el schema convergido. **Sub-agente:** A2-2 del Diamante 3 (`diamante3_metodologia.md`).
**Fuente primaria declarada:** `pasadas/d3_schema_a2_1_normalizacion.md` (schema consolidado de A2-1).
**Modo:** `opencode general`, loop interno de 3 iteraciones.

> ⚠️ **HALLAZGO CRÍTICO ANTICIPADO (DET-01):** la fuente primaria `d3_schema_a2_1_normalizacion.md` **NO EXISTE** en `arnes/diagnostico/pasadas/` al momento de correr este pase (glob 2026-08-04: ausente; la serie A2-1..A2-5 está prevista en la ola 2 en paralelo, `diamante3_metodologia.md:131`). A2-2 fue disparado sin su input. Per la regla de no-parar del método (`diamante3_metodologia.md:16`), este pase **aplica el mejor juicio y documenta**: verifica el determinismo de los 5 gates contra la **unión de las propuestas A1** (A1-1 contextos, A1-2 enforcement, A1-3 roles, A1-4 dinero, A1-5 datos), que es exactamente el insumo que A2-1 debe consolidar, y emite el **contrato de no-rotura** que A2-1 debe respetar para que ningún gate quede `DETERMINISMO_ROTO`. La re-verificación contra el consolidado real queda registrada para A3/Orquestador.

---

## Iteración 1 (bruta)

Barrido crudo, sin filtro, del estado real:

1. **Schema vigente (`lib/db/schema.ts`, 18 tablas):** ninguna de las tablas de los gates existe. No hay `veredictos`/`verificaciones`, `recepciones`, `cronograma`/`cronograma_etapas`, `desfases_cronograma`, `ordenes_compra`/`items_orden_compra`, `pagos_proveedor`, `citaciones_calidad`. `proyectos.estado` es el enum legacy de 8 valores (schema.ts:36-45) que no cubre `desarrollo/aprobado_compras/armado/verificado`. `rol_empleado` es un enum de 4 valores (schema.ts:27-32). `fecha_vencimiento` y `fecha` de finanzas son `text` (schema.ts:241, 260). → Los 5 gates dependen **100 % de tablas/columnas propuestas**, no de lo existente.

2. **Predicados originales (A1-2, `d3_schema_a1_2_enforcement.md:75-79`):** los 5 gates están definidos como predicados booleanos sobre columnas propuestas, con transición de estado y bloqueo. Todos son SQL-evaluables **en su formulación** (A1-2:219-227).

3. **Divergencias de nomenclatura entre los A1** (lo que A2-1 deberá unificar, detectadas en crudo):
   - E-18/E-24 → veredictos: A1-2 `veredictos` con `tipo` discriminador (:75,77) vs A1-1 `verificaciones_schema` + `veredictos_calidad` separadas (A1-1:153,185) vs A1-3 `verificaciones` con `tipoGate` (A1-3:150-158).
   - E-21 → recepción: A1-2 `recepciones`/`recepcion_items`/`orden_compra_items` (:76) vs A1-1 `recepciones_material` con `checklist` jsonb + `items_orden_compra` con `recibidoCantidad`/`sinDefectos` (A1-1:163,165) vs A1-4 `itemsOrdenCompra` **sin** campos de recepción (A1-4:129-137).
   - E-33 → A1-2 `cronograma.tipo_linea` + `desfases_cronograma.aplicado` (:78) vs A1-1 `cronograma_etapas.linea` + `desfases_cronograma` sin `aplicado` (A1-1:138,139).
   - E-20 → caja: A1-2/ENF-11 caja **derivada** (A1-2:47) vs A1-4 `saldo_actual` almacenado como fuente única transaccional (A1-4:310); enum estado obligación `vencida` (A1-2:79) vs `atrasada` (A1-4:172); enum OC `emitida/recibida_verificada` (A1-1:162) vs `solicitada/aprobada/pagada/recibida` (A1-4:109-111); monto del pago `monto_a_pagar` (A1-2:79) vs `pagos_proveedor.monto`/`ordenes_compra.montoTotal` (A1-1:164; A1-4:120).
   - SLA E-50 y 12 días E-29: columnas en `leads` (A1-2:153-159; A1-5:106) vs `clientes` absorbente (A1-1:77); fechas en texto.

4. **Revalidación de valores:** SLA primera respuesta = **5 minutos** (define:132; log:69 I-054/1; A1-2:176); atraso E-29 = **12 días** → aviso automático al gerente, prioridad baja, no bloquea (define:133; A1-2:178,192).

5. **Juicio humano:** ninguno de los 5 predicados exige juicio **al momento de evaluarse**; el juicio vive antes, como dato registrado por un rol (verificador, desarrollador) o como flag (decisionManual). La excepción declarada es la veracidad de la composición causal de E-33 (D4) — `DECISION_PENDIENTE` registrada, el predicado exige existencia, no verdad (A1-2:44,202; define:79,139,155).

---

## Iteración 2 (autocrítica)

Qué sobrevive, qué cae y qué se escapó en la pasada 1:

1. **Cae la idea de declarar cualquier gate `DETERMINISMO_ROTO` por el renombrado entre A1.** No hay consolidado: las diferencias de nombre (veredictos/verificaciones, tipo_linea/linea, vencida/atrasada) son **divergencias de convergencia que A2-1 debe resolver**, no roturas del determinismo. Rotura real solo hay si una columna que el predicado necesita **desaparece en todos los A1** o **no es evaluable por tipo de dato**.

2. **Sobrevive como GAP_SCHEMA real (ausente en todos los A1):**
   - `proyectos.fecha_entrada_desarrollo` — el predicado E-18 exige `veredicto.fecha ≥ fecha_entrada_desarrollo` (A1-2:75, ENF-25 en A1-2:259); ningún A1 propone la columna. Alternativa determinista: derivar el t0 del estado desde `eventos` (A1-5: `estadoDespues='desarrollo'` + `createdAt`, A1-5:62-72) o desde `schemas_proyecto.creadoEn` (A1-1:151). → A2-1 debe añadir la columna o re-expresar el predicado.
   - `desfases_cronograma.aplicado` — el predicado E-33 exige `d.aplicado=true` (A1-2:78); A1-1 no lo propone (A1-1:139). Proxy posible: `nuevasFechas` no vacío. → A2-1 debe añadirlo o re-expresar.
   - `items_orden_compra` con campos de recepción (`recibidoCantidad`, `sinDefectos`) — A1-4 (el lente de dinero, autoridad natural de la tabla) **no los incluye** (A1-4:129-137); el checklist C3 los necesita por ítem (define:76; A1-1:163). Si A2-1 adopta el A1-4 sin el merge del A1-1 → **E-21 queda `DETERMINISMO_ROTO`**.

3. **Se corrige el análisis de la caja (E-20):** no es defecto de determinismo sino **decisión de fuente de verdad** que A2-1 debe fijar: ENF-11 dice caja derivada `Σsaldos − Σpor_pagar pendientes` con `saldo_actual` materializado reconciliado (A1-2:47), mientras A1-4 dice `saldo_actual` almacenado como único origen actualizado en la misma transacción (A1-4:310; registros_gate_caja A1-4:286-295). Ambas formulaciones son deterministas; la elección cambia qué columna se lee.

4. **Se precisa el ancla del SLA E-50 (se escapó en la 1):** A1-2 usa `primera_respuesta_at − created_at` sobre `leads` (A1-2:164); A1-1 mueve el embudo a `clientes` con `hora_primer_contacto`/`hora_primera_respuesta` (A1-1:77). Si A2-1 absorbe `leads` en `clientes`, `clientes.created_at` **no es** el t0 del lead (es la fecha del registro cliente) → el intervalo se debe medir contra `hora_primer_contacto`. De lo contrario el SLA de 5 min se mide contra el ancla equivocada (mismo determinismo formal, semántica rota).

5. **Se corrobora el patrón "juicio pre-registrado":** E-18/E-24 el verificador único designado (D3: comercial vendedor) registra el veredicto; E-21 el desarrollador registra `sin_defectos`. En el momento de evaluar el gate no hay subjetividad: todo es booleano sobre columnas (A1-2:51,207). El rol se evalúa contra el modelo rol-vs-persona (A1-3: roles/usuarios_roles/asignaciones), no contra la persona (define:57).

6. **Se detecta un riesgo de tipo de dato propio del consolidado:** si A2-1 conserva `checklist` como jsonb no tipado en `recepciones_material` (A1-1:165), el `NOT EXISTS` por ítem del predicado E-21 (A1-2:76) exige `jsonb_array_elements` con shape fija. Es evaluable en SQL pero frágil; columna tipada por ítem es más robusta. → Recomendación de `CORRECCION_SCHEMA`.

---

## Iteración 3 (refinamiento final)

Resultado depurado:

- **Veredicto por gate (ver Tabla de verificación):** los 5 gates son `DETERMINISMO_OK` en su formulación, verificados contra la unión A1 (proxy del consolidado ausente). **Ninguno quedó `DETERMINISMO_ROTO` por una normalización de A2-1 — porque A2-1 aún no existe.** El riesgo de rotura está contenido en 3 GAP_SCHEMA de columnas (fecha_entrada_desarrollo, desfase.aplicado, campos de recepción del ítem) y en ~6 divergencias de naming que A2-1 debe resolver sin tocar la semántica del predicado.
- **Contrato de no-rotura (lo que A2-1 NO puede omitir/renombrar sin re-expresar el predicado y avisar a A3):** invariantes por gate listadas en "Caminos de evaluación".
- **Revalidaciones cruzadas:** SLA E-50 = 5 min `DETERMINISMO_OK` condicionado al ancla correcta (DET-13); 12 días E-29 = `DETERMINISMO_ROTO` en el **schema vigente** por `fecha_vencimiento` text (schema.ts:260), pendiente de la normalización de tipos que A2-1 tiene exactamente en su mandato (A1-4 H9, `d3_schema_a1_4_dinero.md:354`).
- **Recomendación de gobernanza:** A2-3 (trazabilidad) debe re-verificar estos predicados contra el consolidado real cuando exista; A3 (auditor final) tiene los invariantes de este pase como check.

---

## Verificación de determinismo de los 5 gates

Notación: `∃` = existe, `∧` = Y, `param('clave')` = lookup en `parametros`. Columnas en nomenclatura consolidada (unión A1); las marcas `[DECIDIR A2-1]` señalan las divergencias de naming que el consolidado debe resolver.

| Gate | Predicado en schema consolidado | Columnas reales (tabla.columna) | Evaluable sin juicio humano? (SÍ/NO) | Si NO → GAP o DECISION_PENDIENTE | Bloqueo resultante |
|---|---|---|---|---|---|
| **E-18** check de schema pre-compras | `P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyectoId=p.id ∧ v.tipoGate='schema' ∧ v.veredicto='aprobado' ∧ v.verificadorId=p.verificadorId ∧ v.creadoEn ≥ p.fecha_entrada_desarrollo` | `proyectos.estado` [ext]; `proyectos.verificador_id` [nuevo, A1-3:86]; `verificaciones.proyecto_id`+`.tipo_gate`+`.veredicto`+`.verificador_id`+`.creado_en` [nuevo, A1-3:150-158]; `proyectos.fecha_entrada_desarrollo` [**FALTA en todos los A1 → GAP**] | **SÍ** | GAP_SCHEMA: `fecha_entrada_desarrollo` (alternativa: `eventos.estadoDespues='desarrollo'`+`createdAt`, A1-5:62-72) | No se crea orden de compra (E-19); `desarrollo → aprobado_compras`; rechazo → E-54 + E-33 recalculo |
| **E-21** recepción triple verificación | `P21(r) = r.check_pedido_bien ∧ r.check_despacho_bien ∧ NOT EXISTS (SELECT 1 FROM items_orden_compra i WHERE i.orden_id=:oc AND (i.recibido_cantidad < i.cantidad ∨ i.sin_defectos = false ∨ (i.catalogo_id IS NOT NULL AND i.catalogo_id IS DISTINCT FROM i.catalogo_esperado_id)))` | `recepciones_material.check_pedido_bien`+`.check_despacho_bien`+`.estado` [nuevo, A1-1:165]; `items_orden_compra.cantidad` (esperada)+`.recibido_cantidad`+`.sin_defectos`+`.catalogo_id` [nuevo; **A1-4 no trae recibido_cantidad/sin_defectos → merge obligatorio del A1-1, A1-1:163 vs A1-4:129-137**] | **SÍ** | GAP_SCHEMA: campos de recepción del ítem si A2-1 adopta solo el A1-4; `DECISION_PENDIENTE` confirmada: juicio "sin defectos" pre-registrado por el rol desarrollador (A1-2:207) | `aprobado_compras → armado` + OC `recibida_verificada`; falla → `rechazada` → E-54 origen D2 |
| **E-24** veredicto pre-despacho | `P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyectoId=p.id ∧ c.estado='citada' ∧ ∃v∈veredictos: v.proyectoId=p.id ∧ v.veredicto='aprobado' ∧ v.verificadorId=p.verificadorId ∧ v.fecha ≥ c.citadoEn` | `proyectos.estado` [ext]; `citaciones_calidad.estado`+`.citado_en` [nuevo, A1-1:184; enum 'citado' vs 'citada' → DECIDIR]; `veredictos_calidad.veredicto`+`.verificador_rol`/`.fecha` [nuevo, A1-1:185; o `verificaciones.tipoGate='calidad'`, DECIDIR] | **SÍ** | Ninguno (solo divergencia de naming DET-05/DET-04) | No hay instalación (E-25); `armado → verificado`; rechazo → E-54 módulos + E-33 |
| **E-33** cambio de cronograma con causa | `P33(p) = ∃d∈desfases_cronograma: d.proyectoId=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicionCausal)>0` → recálculo SOLO de `cronograma_etapas.linea='interna'`; `contractual` inmutable | `desfases_cronograma.causa`+`.motivo`+`.composicion_causal`(jsonb)+`.decision_manual`+`.justificacion_manual` [nuevo, A1-1:139]; `desfases_cronograma.aplicado` [**FALTA en A1-1 → GAP** o proxy `nuevas_fechas`]; `cronograma_etapas.linea` [nuevo, A1-1:138] | **SÍ** (veracidad del trazado es semántica, registrada como `DECISION_PENDIENTE` D4) | GAP_SCHEMA: `aplicado`; `DECISION_PENDIENTE` confirmada: composición causal (D4, define:139,155; ENF-12 A1-2:246) | Ninguna fecha se recalcula sin desfase estructurado; causa interna → E-35 reduce comisiones; dato auditable |
| **E-20** pago a proveedor (gate de caja) | `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF monto_total−monto_pagado)`; `P20 = caja_disponible ≥ :monto_pago` | `cuentas_financieras.saldo_actual` [existente, schema.ts:236]; `obligaciones_pendientes.tipo`+`.estado`+`.monto_total`+`.monto_pagado` [existente, schema.ts:254-267]; `pagos_proveedor.monto` [nuevo, A1-1:164] o `ordenes_compra.monto_total`/`anticipo_monto` [A1-4:120-121, DECIDIR fuente del monto]; `registros_gate_caja` [rama negativa, A1-4:286-295] | **SÍ** | Ninguno (decisión de fuente de verdad caja: ENF-11 derivada vs A1-4 almacenada → DECIDIR en A2-1, DET-08; enum 'vencida' vs 'atrasada' → DECIDIR, DET-06) | **Bloqueo COMPLETO (D1)**: no se registra pago sin caja real; gerente mueve cronogramas (E-33 causa 'externa'/'dinero'); penalización cae en el eslabón origen |

**Resumen: 5/5 gates = `DETERMINISMO_OK`** (predicados booleanos sobre columnas tipadas, sin juicio humano al evaluar), con 3 GAP_SCHEMA de columnas y 6 divergencias de naming que A2-1 debe resolver. Ningún gate quedó `DETERMINISMO_ROTO` por una normalización efectiva — la normalización aún no existe.

---

## Caminos de evaluación por gate

Cada gate se evalúa con una transacción atómica: **transición de estado + fila de auditoría en `eventos` en el mismo `tx`** (regla A1-5:214; patrón transaccional `lib/modules/finanzas/acciones.ts:58`). Si el guard falla no hay fila; si la fila no se puede escribir, la transición no se confirma.

### E-18 — check de schema pre-compras
1. `SELECT estado FROM proyectos WHERE id=:p` → debe ser `'desarrollo'`.
2. `SELECT EXISTS (SELECT 1 FROM verificaciones v JOIN proyectos p2 ON p2.id=v.proyecto_id WHERE v.proyecto_id=:p AND v.tipo_gate='schema' AND v.veredicto='aprobado' AND v.verificador_id=p2.verificador_id AND v.creado_en >= p2.fecha_entrada_desarrollo)` — el verificador del veredicto debe ser el **designado por despacho** (D3, define:153; A1-3:86) y su rol incluir `comercial` (usuarios_roles).
3. Si P18 → `proyectos.estado: desarrollo → aprobado_compras` (guarda la apertura de OC E-19). Si `veredicto='rechazado'` → E-54 + E-33. Bloqueo: no se crea orden de compra.

### E-21 — recepción triple verificación
1. `SELECT check_pedido_bien, check_despacho_bien FROM recepciones_material WHERE id=:r` → ambos `true`.
2. `SELECT NOT EXISTS (SELECT 1 FROM items_orden_compra i WHERE i.orden_id=:oc AND (i.recibido_cantidad < i.cantidad OR i.sin_defectos=false OR (i.catalogo_id IS NOT NULL AND i.catalogo_id IS DISTINCT FROM i.catalogo_esperado_id)))` — checklist C3 de la lista de compra esperada (tipo + cantidades + sin defectos, define:76).
3. Si P21 → `proyectos.estado: aprobado_compras → armado` + `ordenes_compra.estado → recibida_verificada`. Si falla → recepción `rechazada` + E-54 con `origen_reproceso` (culpable proveedor/desarrollador/comercial, D2). Bloqueo: el proyecto no pasa a taller.

### E-24 — veredicto pre-despacho
1. `SELECT estado FROM proyectos WHERE id=:p` → `'armado'`.
2. `SELECT EXISTS (SELECT 1 FROM citaciones_calidad WHERE proyecto_id=:p AND estado='citada')` — push de ventana de calidad E-23 previo.
3. `SELECT EXISTS (SELECT 1 FROM veredictos_calidad v JOIN proyectos p2 ON p2.id=v.proyecto_id JOIN citaciones_calidad c ON c.proyecto_id=v.proyecto_id WHERE v.proyecto_id=:p AND v.veredicto='aprobado' AND v.verificador_id=p2.verificador_id AND v.fecha >= c.citado_en)`.
4. Si P24 → `armado → verificado` (habilita instalación E-25). Si `rechazado` → E-54 módulos + E-33. Bloqueo: no se crea la instalación.

### E-33 — cambio de cronograma con causa
1. `SELECT EXISTS (SELECT 1 FROM desfases_cronograma WHERE proyecto_id=:p AND aplicado=true AND causa IN ('interna','externa','cambio_contrato') AND length(motivo)>0 AND jsonb_array_length(composicion_causal)>0)` — causa estructurada (I-027 tercer origen) + motivo + composición causal no vacía (D4).
2. Si P33 → recálculo **automático** de `cronograma_etapas` donde `linea='interna'`; `linea='contractual'` inmutable dentro de la promesa de 7 semanas (I-034). Fila de `eventos` con `payload {causa_tipo, motivo, composicion_causal, fechas_antes, fechas_despues, decision_manual}` (A1-5:210).
3. Causa `interna` → E-35 reduce comisiones (desfase_id auditable). Bloqueo: sin desfase estructurado no se recalcula ninguna fecha.

### E-20 — pago a proveedor (gate de caja)
1. `caja_disponible = (SELECT COALESCE(SUM(saldo_actual),0) FROM cuentas_financieras) − (SELECT COALESCE(SUM(monto_total−monto_pagado),0) FROM obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada'))`.
2. `P20 = caja_disponible ≥ :monto_pago` donde `:monto_pago` = `pagos_proveedor.monto` (o `ordenes_compra.anticipo_monto`/`monto_total` según la mecánica, A1-4:120-121).
3. Si P20 → `ordenes_compra.estado: aprobada → pagada` + movimiento egreso con `orden_compra_id` (A1-4:153). Si falla → **bloqueo completo (D1)**: no hay movimiento ni transición; se inserta `registros_gate_caja` (bloqueado=true, saldo real, A1-4:286-295) y el cronograma se recalcula vía E-33 con causa externa/dinero (define:87).

---

## Revalidación del enforcement de SLA (E-50, 5 min → IA/segundo comercial)

- **Valor revalidado:** `sla_primera_respuesta_min = 5` (define:132; log:69 I-054/1; A1-2:176). Sin cambio tras la convergencia.
- **Predicado (consolidado):** `P_sla(l) = hora_primera_respuesta − hora_primer_contacto > param('sla_primera_respuesta_min')::interval` (A1-1 naming, `clientes:77`) o `primera_respuesta_at − created_at` (A1-2:163-165, `leads`).
- **Consecuencia (determinista, temporizador):** `sla_cumplido=false` + registro en `eventos` (payload `{ventana_sla:5, cumplio:false, escalacion:{tipo}}`) + `escalacion_sla = CASE WHEN param('llm_disponible') THEN 'ia_llm' ELSE 'segundo_comercial' END` (define:132; A1-2:168).
- **Veredicto: `DETERMINISMO_OK`** — aritmética de timestamps pura, sin juicio humano. Condiciones para A2-1: (a) fijar el **ancla del t0** (DET-13): si `leads` se absorbe en `clientes`, el intervalo se mide contra `hora_primer_contacto`, jamás contra `clientes.created_at`; (b) la fuente de `hora_primera_respuesta` es Chatwoot (integración externa) — nota de frontera, no bloquea el modelado (A1-2:49,269).

## Revalidación del valor de 12 días (E-29 → aviso a gerente)

- **Valor revalidado:** `holgura_cobro_dias = 12` (define:133; log:69 I-054/2; A1-2:178). Sin cambio tras la convergencia.
- **Check:** `hoy − fecha_vencimiento > 12 días` → estado `atrasada` + `notificado_gerente=true` (A1-1:211) + aviso automático al gerente. **Prioridad baja, no bloquea** (define:133; A1-2:192).
- **Veredicto: `DETERMINISMO_ROTO` en el schema vigente** porque `obligaciones_pendientes.fecha_vencimiento` es `text` (schema.ts:260) — la aritmética de intervalos no es evaluable sin conversión. La corrección es exactamente el mandato de normalización de A2-1/A1-4 (H9: `date`/`timestamp`, `d3_schema_a1_4_dinero.md:354`; idem `movimientos_financieros.fecha`, schema.ts:241). **No es un defecto del predicado** — es un defecto de tipo de dato pendiente de la pasada que este pase audita. Al corregirlo → `DETERMINISMO_OK`.

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| DET-01 | `GAP_SCHEMA` (crítico de proceso) | **A2-1 (`d3_schema_a2_1_normalizacion.md`) NO EXISTE** al ejecutar A2-2 — ola 2 en paralelo disparó el pase sin su input. Este pase verificó contra la unión A1 como proxy; la re-verificación contra el consolidado real queda para A2-3/A3. Escalar al Orquestador | glob pasadas (ausente); diamante3_metodologia.md:131,34 |
| DET-02 | `GAP_SCHEMA` | `proyectos.fecha_entrada_desarrollo` no propuesta por ningún A1; el predicado E-18 exige `veredicto.fecha ≥ fecha_entrada_desarrollo`. Alternativas deterministas: columna nueva o derivar el t0 de `eventos` (A1-5: `estadoDespues='desarrollo'`+`createdAt`) / `schemas_proyecto.creadoEn` | d3_schema_a1_2_enforcement.md:75,259; d3_schema_a1_5_datos.md:62-72; d3_schema_a1_1_contextos.md:151 |
| DET-03 | `GAP_SCHEMA` | `desfases_cronograma.aplicado` ausente en A1-1:139; el predicado E-33 exige `aplicado=true`. Proxy posible: `nuevas_fechas` no vacío. A2-1 debe añadir la columna o re-expresar el predicado | d3_schema_a1_2_enforcement.md:78; d3_schema_a1_1_contextos.md:139 |
| DET-04 | `CORRECCION_SCHEMA` | Nomenclatura de veredictos triplicada: `veredictos` con `tipo` (A1-2) vs `verificaciones_schema`+`veredictos_calidad` (A1-1) vs `verificaciones` con `tipoGate` (A1-3). A2-1 debe elegir UNA tabla conservando las columnas del predicado: `proyecto_id`, `veredicto`, `verificador_id/rol`, `fecha` | d3_schema_a1_2_enforcement.md:75,77; d3_schema_a1_1_contextos.md:153,185; d3_schema_a1_3_roles.md:150-158 |
| DET-05 | `CORRECCION_SCHEMA` | Enum `citaciones_calidad.estado`: 'citado' (predicado A1-2) vs 'citada' (A1-1:184). Unificar el valor — si A2-1 conserva 'citada', el predicado E-24 se re-expresa con ese valor | d3_schema_a1_2_enforcement.md:77; d3_schema_a1_1_contextos.md:184 |
| DET-06 | `CORRECCION_SCHEMA` | Enum estado de obligación para E-20: 'vencida' (predicado A1-2) vs 'atrasada' (A1-4:172, H8). Unificar; el `IN ('pendiente','vencida')` del predicado debe apuntar al valor sobreviviente | d3_schema_a1_2_enforcement.md:79; d3_schema_a1_4_dinero.md:172 |
| DET-07 | `CORRECCION_SCHEMA` | Enum estado `ordenes_compra` en conflicto: A1-1 `emitida/recibida_verificada/rechazada` (162) vs A1-4 `solicitada/aprobada/en_pago/pagada/recibida/cancelada` (109-111). A2-1 debe unificar enum + máquina de estados (E-19/E-20/E-21) sin romper las transiciones del predicado | d3_schema_a1_1_contextos.md:162; d3_schema_a1_4_dinero.md:109-111 |
| DET-08 | `NORMALIZACION` / `DECISION_PENDIENTE` | Caja E-20 con dos fuentes de verdad propuestas: ENF-11 caja **derivada** `Σsaldos − Σpor_pagar` con `saldo_actual` reconciliado vs A1-4 `saldo_actual` almacenado único origen transaccional (P3-12). A2-1 debe fijar la fuente; ambas formulaciones son deterministas | d3_schema_a1_2_enforcement.md:47; d3_schema_a1_4_dinero.md:306-310 |
| DET-09 | `GAP_SCHEMA` | `items_orden_compra` de A1-4 **sin** `recibido_cantidad`/`sin_defectos` (A1-4:129-137); el checklist C3 de E-21 los necesita por ítem (A1-1:163; define:76). Si A2-1 adopta solo el A1-4 → **E-21 queda `DETERMINISMO_ROTO`** | d3_schema_a1_4_dinero.md:129-137; d3_schema_a1_1_contextos.md:163; diamante2_define_eventos.md:76 |
| DET-10 | `CORRECCION_SCHEMA` | `checklist` jsonb no tipado en `recepciones_material` (A1-1:165): el `NOT EXISTS` por ítem de E-21 exige shape fija. Recomendación: columnas tipadas por ítem (`recibido_cantidad`, `sin_defectos`, `catalogo_id`) en vez de blob | d3_schema_a1_1_contextos.md:165; d3_schema_a1_2_enforcement.md:76 |
| DET-11 | `NORMALIZACION` | Hogar del embudo/SLA en conflicto: `leads` absorbe en `clientes` (A1-1 H-A1-01) vs `leads` se conserva con `estado`+`cliente_id` (A1-5 H02/H03). A2-1 debe resolver la identidad evolutiva; de ahí cuelga dónde viven `hora_primera_respuesta`/`sla_cumplido` | d3_schema_a1_1_contextos.md:314; d3_schema_a1_5_datos.md:229,175 |
| DET-12 | `DETERMINISMO_ROTO` (schema vigente) | E-29 12 días no evaluable: `obligaciones_pendientes.fecha_vencimiento` text (schema.ts:260) y `movimientos_financieros.fecha` text (schema.ts:241) impiden la aritmética de intervalos. Corrección = normalización de tipos del mandato A2-1/A1-4 (H9). Al corregir → `DETERMINISMO_OK` | schema.ts:241,260; d3_schema_a1_4_dinero.md:354 |
| DET-13 | `CORRECCION_SCHEMA` | Ancla del SLA E-50: A1-1 mide `hora_primera_respuesta − hora_primer_contacto` en `clientes` (77); A1-2/A1-5 miden `primera_respuesta_at − created_at` en `leads` (163-165; 106). Si A2-1 absorbe `leads`, el t0 debe ser `hora_primer_contacto`, no `clientes.created_at` | d3_schema_a1_1_contextos.md:77; d3_schema_a1_2_enforcement.md:163-165; d3_schema_a1_5_datos.md:106 |
| DET-14 | `DECISION_PENDIENTE` (confirmada, no nueva) | Veracidad de la composición causal de E-33 (D4): el predicado exige existencia (`jsonb_array_length>0`), no verdad; `decision_manual`/`justificacion_manual` registran la desviación. Reafirma ENF-12 | diamante2_define_eventos.md:79,139,155; d3_schema_a1_2_enforcement.md:246 |
| DET-15 | `DECISION_PENDIENTE` (confirmada, no nueva) | Juicio "sin defectos" de E-21: no computable; el predicado evalúa el booleano registrado por el rol desarrollador. Reafirma A1-2:207 | d3_schema_a1_2_enforcement.md:207 |
| DET-16 | `CORRECCION_SCHEMA` (menor) | E-21, ítems sin catálogo (`catalogo_id` nullable, A1-1:163): `IS DISTINCT FROM` maneja los nulls pero no compara `nombre_item` para ítems personalizados; añadir la comparación de nombre si se exige fidelidad de "tipo" | d3_schema_a1_1_contextos.md:163; d3_schema_a1_2_enforcement.md:76 |
| DET-17 | `CORRECCION_SCHEMA` | Fuente del monto a pagar de E-20: `monto_a_pagar` del predicado no existe como columna; mapear a `pagos_proveedor.monto` (pago concreto, A1-1:164) o `ordenes_compra.monto_total`/`anticipo_monto` según mecánica (A1-4:120-121). A2-1 debe declarar la fuente | d3_schema_a1_2_enforcement.md:79; d3_schema_a1_1_contextos.md:164; d3_schema_a1_4_dinero.md:120-121 |

---

## Notas para el Orquestador

1. **DET-01 es bloqueante del goal de A2 ("0 correcciones estructurales pendientes", `diamante3_metodologia.md:146`):** este pase no pudo revalidar contra el schema consolidado porque A2-1 no existe. **Acción: re-enlazar A2-2 (o delegar a A2-3/A3) para re-verificar estos 5 predicados contra `d3_schema_a2_1_normalizacion.md` cuando exista**, usando la tabla de verificación y los caminos de evaluación de este pase como checklist. Registrar en el ledger como `esperando_humano`/orquestación; el grafo no se detiene (metodologia:16).
2. **Veredicto de los 5 gates:** **5/5 `DETERMINISMO_OK`** (predicados booleanos evaluables sobre columnas tipadas, sin juicio humano al evaluarse), **condicionado** a que A2-1 resuelva: 3 GAP_SCHEMA (DET-02 `fecha_entrada_desarrollo`, DET-03 `aplicado`, DET-09 campos de recepción del ítem) y 6 divergencias de naming (DET-04..DET-08, DET-11, DET-13, DET-17). **Ninguno `DETERMINISMO_ROTO` por una normalización efectiva.**
3. **Contrato de no-rotura para A2-1 (invariantes que NO puede omitir sin romper el predicado):** E-18 → tabla de veredictos con `(proyecto_id, veredicto, verificador_id, fecha)` + t0 del estado `desarrollo`; E-21 → por ítem `(cantidad_esperada, cantidad_recibida, sin_defectos, catalogo_id)` comparables en SQL; E-24 → `citaciones_calidad.estado` + `veredictos.fecha ≥ citación`; E-33 → `desfases(proyecto_id, causa, motivo, composicion_causal, aplicado)`; E-20 → caja calculable por SUM (una sola fuente de verdad) + `obligaciones(por_pagar, estado, monto_total, monto_pagado)`.
4. **SLA E-50 y 12 días E-29 revalidados sin cambio de valor** (5 min y 12 días, define:132,133; log:69). El único `DETERMINISMO_ROTO` detectado está **fuera** de los 5 gates: la aritmética del atraso de 12 días (DET-12), por `fecha_vencimiento` text — corrección que A2-1 tiene en su mandato.
5. **Deuda entre pases para A2-3 (trazabilidad):** el registro de cada gate en `eventos` debe llevar el payload de evidencia mínimo (A1-5:206-210) y escribirse en el mismo `tx` que la transición (A1-5:214); verificar ahí la atomicidad, no en este pase.
6. **Prohibido cumplido:** este pase solo escribió `arnes/diagnostico/pasadas/d3_schema_a2_2_determinismo.md`. No modificó ningún otro archivo.

## Registro

- Fecha: 2026-08-04 · Pase A2-2 (ola 2, en paralelo con A2-1/A2-3/A2-4/A2-5).
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a2_2_determinismo.md`.
- Loop de 3 iteraciones completado: 1 bruta → 2 autocrítica → 3 refinamiento.
- Veredicto: **5/5 gates `DETERMINISMO_OK`** (condicionado a A2-1) · **0 gates `DETERMINISMO_ROTO`** · 1 `DETERMINISMO_ROTO` en schema vigente fuera de los gates (E-29, DET-12) · fuente primaria A2-1 **ausente** (DET-01, escalado).
