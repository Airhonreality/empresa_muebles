# Pase A1-2 — Schema por enforcement (subagente, loop de 3 iteraciones)

**Lente:** schema por enforcement — gates deterministas y máquina de estados.
**Misión:** materializar los 5 gates (E-18, E-21, E-24, E-33, E-20), las transiciones de estado de los 61 eventos, el SLA de primera respuesta (E-50) y los valores numéricos resueltos (I-054) como columnas/checks/estados evaluables, consistentes con el schema Drizzle existente.
**Regla de oro:** cada gate DEBE ser un predicado booleano evaluable sobre columnas reales. Si depende de juicio humano → `DECISION_PENDIENTE` o registro explícito (sistema = guía + registrador de la realidad, D1/C1).

---

## Iteración 1 (bruta)

Reconocimiento crudo de lo que el enforcement necesita, evento por evento:

1. **Los 5 gates del Define** (`diamante2_define_eventos.md:73-79` + `§4.3` línea 87 para E-20):
   - E-18 check de schema pre-compras → dueño Compras, guard `desarrollo → aprobado_compras` con veredicto del **verificador único = comercial vendedor** (D3, `:75`, `:153`).
   - E-21 recepción triple → dueño Compras→Taller, guard = **checklist de la lista de compra esperada** (C3, `:76`) → `recibido_verificado`; rama negativa = rastreo de origen (D2).
   - E-24 veredicto pre-despacho → dueño Calidad, guard = veredicto del verificador único antes del despacho (`:78`); rama negativa E-54.
   - E-33 cambio de cronograma con causa → dueño Control de cronograma, ninguna fecha se recalcula sin **causa estructurada** (interno/externo/cambio de contrato I-027 + motivo + composición causal D4) (`:79`, `:139`, `:155`).
   - E-20 pago a proveedor / gate de caja → **COMPLETAMENTE BLOQUEANTE** (D1), la respuesta es del gerente moviendo cronogramas (`:87`, `logica_de_negocio.md:261`).
   - E-23 (citación de calidad) **no bloquea por sí sola** (`:77`) — es señal que se resuelve en E-24. No entra en la tabla de los 5 gates.

2. **El schema actual no tiene ni una de las tablas/columnas de enforcement:**
   - `leads` (`schema.ts:271-281`) sin `estado`, sin `primera_respuesta_at`, sin canal, sin FK a proyectos → E-02/E-03/E-46/E-49/E-50/E-51 no modelables (coincide con I-005).
   - `proyectos.estado` (`schema.ts:36-45`) con enum legacy (`activa/enviada/en_contrato/pre_produccion/produccion/entregado/perdida/cancelada`) que no cubre los estados del Define (`desarrollo/aprobado_compras/armado/verificado/instalado`).
   - Sin `veredictos` (E-18/E-24), sin `ordenes_compra` (E-19/E-20/E-21), sin `cronograma` (E-14/E-33), sin `modulos_taller` (fila del taller, capa 1, B2), sin `reprocesos` (E-54).
   - `rol_empleado` (`schema.ts:27-32`) = admin/comercial/taller/finanzas — sin desarrollador, verificador, gerente, instalador, diseñador → **precondición de todos los guards** (P2-12/P4-F2/F4, `diamante2_define_eventos.md:59-61`).

3. **Valores numéricos resueltos** (`diamante2_define_eventos.md:128-145`, `log_insights_fase2.md:69` I-054): SLA primera respuesta = 5 min → escalación IA/segundo comercial; atraso 12 días → aviso gerente; lead no viable → se pierde, solo se registra motivo; SLA novedad crítica → registro + visibilidad + escalación gerente sin multa; carpintero 5% + módulo instalado; neto diseñador = parámetro configurable (retención ± IVA pendiente contador).

4. **Tensión guard vs. "guía + registrador de la realidad"** (`diamante2_define_eventos.md:71`, `log_insights_fase2.md:67` I-053 D1): el sistema no es una camisa de fuerza. El schema necesita un mecanismo de **excepción auditable** que represente "avanza y registra, permite el cambio" sin romper el predicado del gate.

---

## Iteración 2 (autocrítica)

Lo que sobrevive, lo que cae y por qué:

1. **Cae:** modelar E-23 como gate. Es señal de ventana de calidad, no bloquea (`:77`). Queda como tabla `citaciones_calidad` (estado `pendiente → citado`) que es **dato previo** del predicado P24, no un gate propio.

2. **Se corrige:** la transición `aprobado_compras → armado` por E-21. El Define dice que E-21 transfiere "control total al subsistema desarrollo-taller" (C3) y E-22 produce el estado `armado` (capa 2). Resolución de enforcement: **E-21 completa el gate** (proyecto `aprobado_compras → armado`), y la fila del taller (`modulos_taller`, capa 1 por B2) lleva el detalle por módulo. E-22 en sí (órdenes de armado detalladas) queda `DIFERIDO`.

3. **Se añade:** `excepciones_gate`. El patrón "el estado no transiciona sin el guard" (P2, `:71`) convive con "guía + registrador de la realidad" (C1, `:87`). La conciliación es un bypass **auditable**: toda transición de gate puede avanzar con una `excepciones_gate` (motivo + responsable + autorizador) — así el sistema nunca se bugea con la realidad inesperada pero la desviación queda registrada. E-20 es la excepción: **sin bypass** (bloqueo completo, D1).

4. **Se detecta ambigüedad del D4** (`:79`, `:139`, `:155`): la "composición causal de dependencias que traza el origen" no es computable en SQL — es semántica. El predicado determinista se limita a exigir que **exista** la causa estructurada (enum + motivo + composición causal no vacía). La veracidad del trazado es decisión manual justificada → `DECISION_PENDIENTE` (registrada como dato, no computada).

5. **Se separan los dos cronogramas** (I-034, `log_insights_fase2.md:48`): la tabla `cronograma` lleva `tipo_linea ∈ {contractual, interna}`. El recálculo de E-33 solo toca `interna`; `contractual` es inmutable dentro de las 7 semanas.

6. **Se resuelve la doble verdad de caja** (P3-12, `diamante2_discover_eventos.md:117`): `saldo_actual` almacenado (`schema.ts:236`) vs. derivado de movimientos. Para el gate E-20 el predicado usa **caja derivada** (Σ saldos − Σ por_pagar pendientes), y `saldo_actual` queda como materializado de lectura con regla de reconciliación → `NORMALIZACION`.

7. **Se precisa qué es "primera respuesta"** (E-50): la hora del primer mensaje saliente del comercial en el canal (fuente = plataforma de mensajería Chatwoot, externa). El schema guarda `primera_respuesta_at`; la captura del dato es integración externa → nota de frontera, no bloqueante del modelado.

8. **Se revisa el determinismo de "sin defectos"** en E-21: el juicio humano (¿el material llegó sin defectos?) no es computable, pero **el predicado evalúa el booleano registrado** `sin_defectos` — el gate es determinista sobre columnas; el juicio es del rol verificador (desarrollador). Aceptable: el registro es el dato.

---

## Iteración 3 (refinamiento final)

Resultado depurado:

- **Cada gate = predicado booleano sobre columnas propuestas**, con su tabla de nacimiento (`veredictos`, `recepciones`, `desfases_cronograma`, `cuentas_financieras` derivado), su transición, su evento y su bloqueo.
- **Cada entidad = máquina de estados** con estado actual, evento permitido, estado destino y guard (rol). Los guards se evalúan contra el **rol** del actor (nunca la persona, `:57`), lo que requiere extender `rol_empleado` (GAP_ENF-07).
- **SLA (E-50) y valores numéricos (I-054) = columnas + tabla `parametros`** (configuración, no constantes en código).
- **Lo no capturable = `DECISION_PENDIENTE`** (composición causal, origen del reproceso, umbral de novedad del check 15 días, reducción de comisiones por causa interna) y **`DIFERIDO`** (taller interno, firma digital como subsistema, horas bienestar, marketing/tienda/gobierno).
- **Consistencia con el schema actual:** se proponen extensiones y tablas nuevas sin reescribir las 18 existentes; el conflicto único es `estado_proyecto` (CORRECCION_ENF-01) con mapeo de migración.

---

## Entregable: gates y máquinas de estado

### 1. Los 5 gates (predicados evaluables)

Notación: `∧` = Y, `∃` = existe, `parametro('clave')` = lookup en tabla `parametros`. Todas las columnas marcadas **[nuevo]** son propuestas de esta pasada.

| Gate | Tabla(s) | Columnas involucradas | Predicado (condición booleana exacta) | Transición de estado resultante | Evento que lo dispara | Bloqueo si falla |
|---|---|---|---|---|---|---|
| **E-18** check de schema pre-compras | `proyectos` [nuevo estado]; `veredictos` **[nuevo]**; `usuarios` (rol) | `proyectos.estado`; `veredictos.tipo='schema_pre_compras'`, `veredictos.veredicto`, `veredictos.verificador_id`, `veredictos.fecha`; `usuarios.rol_empleado='comercial'` | `P18(p) = p.estado = 'desarrollo' ∧ ∃v ∈ veredictos: v.proyecto_id=p.id ∧ v.tipo='schema_pre_compras' ∧ v.veredicto='aprobado' ∧ rol(v.verificador_id)='comercial' ∧ v.fecha ≥ p.fecha_entrada_desarrollo` | `proyectos.estado: desarrollo → aprobado_compras` | E-18 (verificador único = comercial vendedor, D3) | No se crea orden de compra (E-19): guard de apertura de pedidos. Si `veredicto='rechazado'` → rama negativa E-54 (reproceso) → vuelve a `desarrollo` y dispara E-33 (recalculo) |
| **E-21** recepción triple verificación | `ordenes_compra` **[nuevo]**; `orden_compra_items` **[nuevo]**; `recepciones` **[nuevo]**; `recepcion_items` **[nuevo]**; `proyectos` | `recepciones.verificacion_pedido_ok`, `recepciones.verificacion_despacho_ok`; `recepcion_items.cantidad_recibida`, `recepcion_items.sin_defectos`, `recepcion_items.catalogo_id`; `orden_compra_items.cantidad_esperada`, `orden_compra_items.catalogo_id` | `P21(r) = r.verificacion_pedido_ok = true ∧ r.verificacion_despacho_ok = true ∧ NOT EXISTS (SELECT 1 FROM recepcion_items ri JOIN orden_compra_items oi ON ri.orden_compra_item_id = oi.id WHERE ri.recepcion_id = r.id ∧ (ri.cantidad_recibida < oi.cantidad_esperada ∨ ri.catalogo_id IS DISTINCT FROM oi.catalogo_id ∨ ri.sin_defectos = false))` | `proyectos.estado: aprobado_compras → armado` (control total al desarrollo-taller, C3); `orden_compra.estado → recibido_verificado` | E-21 (desarrollador completa el checklist, C3) | El proyecto no pasa a taller; no se crean módulos de armado. Si falla → recepción `rechazada` → E-54 con `origen_reproceso` (proveedor/desarrollador/comercial, D2) |
| **E-24** veredicto pre-despacho | `proyectos`; `veredictos` **[nuevo]**; `citaciones_calidad` **[nuevo]** | `proyectos.estado='armado'`; `citaciones_calidad.estado='citado'`; `veredictos.tipo='calidad_predespacho'`, `veredictos.veredicto`, `veredictos.fecha`; rol verificador = `comercial` | `P24(p) = p.estado='armado' ∧ ∃c ∈ citaciones_calidad: c.proyecto_id=p.id ∧ c.estado='citado' ∧ ∃v ∈ veredictos: v.proyecto_id=p.id ∧ v.tipo='calidad_predespacho' ∧ v.veredicto='aprobado' ∧ rol(v.verificador_id)='comercial' ∧ v.fecha ≥ c.fecha` | `proyectos.estado: armado → verificado` | E-24 (verificador único, precedido por E-23 citación push) | No se crea la instalación (E-25). Si `veredicto='rechazado'` → E-54 reproceso de módulos → vuelve a `armado` y dispara E-33 |
| **E-33** cambio de cronograma con causa | `cronograma` **[nuevo]**; `desfases_cronograma` **[nuevo]** | `cronograma.tipo_linea ∈ {'contractual','interna'}`; `desfases_cronograma.causa ∈ {'interna','externa','cambio_contrato'}`, `desfases_cronograma.motivo`, `desfases_cronograma.composicion_causal` (jsonb), `desfases_cronograma.aplicado` | `P33(p) = ∃d ∈ desfases_cronograma: d.proyecto_id=p.id ∧ d.aplicado=true ∧ d.causa ∈ {'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicion_causal)>0` | Recálculo automático solo de `cronograma.tipo_linea='interna'`; `contractual` inmutable dentro de la promesa de 7 semanas (I-034) | E-33 (cambio con causa), E-59 (check 15 días), E-16 (cambio de contrato), E-54 (reproceso), E-20 (dinero) | Ninguna fecha se recalcula sin desfase estructurado. Causa `interna` → E-35 reduce comisiones; el dato es auditable |
| **E-20** pago a proveedor (gate de caja) | `cuentas_financieras`; `obligaciones_pendientes`; `ordenes_compra` **[nuevo]**; `movimientos_financieros` | `cuentas_financieras.saldo_actual`; `obligaciones_pendientes.tipo='por_pagar'`, `.estado`, `.monto_total`, `.monto_pagado`; `orden_compra.monto_a_pagar` | `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes.estado ∈ {'pendiente','vencida'} ∧ tipo='por_pagar' de monto_total−monto_pagado)`; `P20(o) = caja_disponible ≥ o.monto_a_pagar` | `orden_compra.estado: aprobada → pagada`; nace `movimientos_financieros` (egreso) | E-20 (compras), requiere E-43 lectura de caja | **Bloqueo COMPLETO (D1)**: no se registra pago sin caja real; la respuesta es del gerente moviendo cronogramas (E-33 causa `externa`/dinero); la penalización cae en el eslabón origen (RED3, `:87`) |

**Precedencia corregida en el cronograma** (P5-09, `:81-83`): etapas = `aprobacion → compras → ensamblaje → instalacion` (el check de schema precede a las compras). Aplica a la columna `etapa` de `cronograma` y a la lista de etapas del contrato.

### 2. Máquinas de estado por entidad

| Entidad | Estado actual | Evento permitido | Estado destino | Guard (rol) |
|---|---|---|---|---|
| **Lead** (`leads.estado` **[nuevo]**) | `nuevo` | E-02 se atiende | `en_contacto` | comercial |
| | `en_contacto` | E-50 SLA (temporizador) | marca `sla_cumplido`/escalación (no transición de estado) | sistema (temporizador) |
| | `en_contacto` | E-03 califica | `calificado` | comercial |
| | `en_contacto` | E-04 descarta/redirige | `descartado` / `redirigido` | comercial |
| | `calificado` | E-49 presupuesto no viable | `no_viable` (terminal: solo registra motivo, I-054/3) | comercial |
| | `calificado` | E-06 agenda visita | `visita_agendada` | comercial / IA |
| | `calificado` | E-11 cotización formal + E-51 | `cliente` (mismo registro, C1-01) | sistema + comercial |
| | `visita_agendada` | E-46 no-show | `no_show` (transitorio) | sistema (regla V-1) |
| | `no_show` | E-46 reagenda si `reagenda_count < parametro('reagenda_max')` (1) | `calificado` + `reagenda_count+1` | comercial |
| | `no_show` | E-46 segunda falla (`reagenda_count ≥ 1`) | `descartado` | sistema (regla V-1, `logica_de_negocio.md:414`) |
| **Cita/visita** (`citas` **[nuevo]**) | `agendada` | E-07 visita ocurre | `realizada` (+ registro de visita estructurado, H4) | comercial + cliente |
| | `agendada` | E-46 no-show | `no_show` | sistema |
| | `no_show` | E-46 reagenda (1 vez) | `agendada` | comercial |
| | `no_show` | E-46 segunda falla | `descartada` (→ lead `descartado`) | sistema |
| **Proyecto** (`proyectos.estado` **[extendido]**) | `borrador` | E-09 publica propuesta | `en_revision` | sistema |
| | `en_revision` | E-10/E-11 ajustes → cotización formal | `cotizado` | comercial |
| | `cotizado` | E-12/E-13 contrato firmado (firma digital verificada, V-6) + E-15 retoma | `desarrollo` | comercial (retoma) + sistema (verificación de firma) |
| | `desarrollo` | E-18 veredicto `aprobado` (**P18**) | `aprobado_compras` | verificador = rol comercial (D3) |
| | `desarrollo` | E-54 rechazo de schema | `desarrollo` (se mantiene) + dispara E-33 | desarrollador |
| | `aprobado_compras` | E-21 recepción verificada (**P21**) | `armado` | desarrollador |
| | `armado` | E-23 citación de calidad (push) | (señal, sin transición) | subsistema desarrollo-taller |
| | `armado` | E-24 veredicto `aprobado` (**P24**) | `verificado` | verificador = rol comercial (D3) |
| | `armado` | E-54 reproceso de calidad | `armado` (reproceso módulo/componente, C2) + dispara E-33 | quien ejecuta la etapa |
| | `verificado` | E-25 instalación | `instalado` | instalador |
| | `instalado` | E-26 acta de entrega | `entregado` | cliente + empresa |
| | `cotizado` | E-49 / E-04 | `perdida` | comercial |
| | `*` | cancelación | `cancelada` | gerente |
| **Contrato** (`contratos.estado`, `schema.ts:47`) | `borrador` | E-13 firma digital verificada (V-6) | `firmado` | cliente (firma) + sistema (subsistema de firma) |
| | `firmado` | E-16 cambio de contrato (tipo `adicional`/`cambio`/`reproceso`, I-027) | `firmado` (+ registro en `cambios_contrato`; si impacto → E-33) | comercial |
| **Orden de compra** (`ordenes_compra.estado` **[nuevo]**) | `borrador` | E-19 crear pedido (**P18** = existe schema aprobado) | `aprobada` | compras / desarrollador |
| | `aprobada` | E-20 pago (**P20** = caja disponible) | `pagada` | finanzas |
| | `pagada` | E-21 checklist completo (**P21**) | `recibido_verificado` | desarrollador |
| | `pagada` | E-21 falla checklist | `rechazada` | desarrollador |
| | `rechazada` | E-54 reproceso con `origen_reproceso` (D2) | reabre según origen (proveedor/dev/comercial) | responsable del origen |
| **Recepción** (`recepciones.estado` **[nuevo]**) | `pendiente` | E-21 triple check (**P21**) | `recibido_verificado` | desarrollador |
| | `pendiente` | E-21 falla | `rechazada` | desarrollador |
| **Módulo de taller — fila de salida, capa 1** (`modulos_taller.estado` **[nuevo]**, B2 `:118`) | `pendiente` | E-22 armado | `en_armado` | desarrollador |
| | `en_armado` | avance | `armado` | desarrollador |
| | `armado` | E-24 rechazo del módulo | `rechazado` | verificador (comercial) |
| | `rechazado` | E-54 reproceso (exacto al módulo/componente, C2) | `en_reproceso` | responsable origen (D2) |
| | `en_reproceso` | rearmado | `armado` | desarrollador |
| **Novedad crítica** (`novedades_criticas.estado` **[nuevo]**, E-34) | `abierta` | E-34 registro de hora de entrada | `en_sla` | sistema |
| | `en_sla` | E-34 resolución | `resuelta` | rol respondiente |
| | `en_sla` | SLA excedido (ventana 5-24 h) | `escalada` (+ `visibilidad_gerente=true`, sin multa) | sistema |
| **Obligación/factura** (`obligaciones_pendientes.estado`, `schema.ts:261`) | nace por hito del contrato (E-56) | — | `pendiente` | sistema (nacimiento automático, P3-02) |
| | `pendiente` | E-28 pago del cliente | `pagada` | cliente / sistema |
| | `pendiente` | E-29 vencimiento | `vencida` (+ 12 días → aviso gerente, I-054/2) | sistema (temporizador) |
| | `vencida` | E-28 pago | `pagada` | cliente |
| **Garantía** (`ordenes_trabajo.tipo='garantia'` **[nuevo columna]**, E-37) | `agendada` | E-61 check de completitud | `lista_para_salir` | instalador |
| | `lista_para_salir` | E-37 orden de garantía | `en_garantia` | instalador |
| | `en_garantia` | resolución | `resuelta` | instalador |
| **Pedido web** (`pedidos_web.estado`, `schema.ts:311`) | `pendiente` | pago | `pagado` → dispara orden de producción (E-44, enganche) | cliente + sistema |

**Notas de frontera de la máquina:**
- **Identidad compartida** (C1-01, `:51`): lead → cliente es el MISMO registro (`leads.cliente_id` **[nuevo]**), no duplicado — Finanzas la usa como referente sin poseerla.
- **Facturación DIAN es externa** (Aliado, `logica_de_negocio.md:386-393`): la máquina interna cubre `obligaciones_pendientes`; el documento fiscal vive fuera → `DIFERIDO`.
- **Firma del contrato** (V-6/RED2, `:143`): el schema guarda `firma_digital_id` + `hash_firma` + `metodo_firma`; el subsistema verificador es `DIFERIDO` (construcción propia).

### 3. Enforcement del SLA de primera respuesta (E-50, 5 min → escalación a IA / segundo comercial)

Tabla `leads` — columnas nuevas:

| Columna | Tipo | Origen |
|---|---|---|
| `estado` | enum `estado_lead` (nuevo) | E-01..E-51 |
| `canal` | text ('web'\|'ig'\|'tiktok'\|'whatsapp') | E-01 |
| `primera_respuesta_at` | timestamp | E-02 (fuente: plataforma de mensajería Chatwoot, integración externa) |
| `sla_cumplido` | boolean | E-50 |
| `sla_escalado_a` | text ('ia_llm' \| 'comercial_2'), null si no escaló | E-50 |
| `sla_escalado_at` | timestamp | E-50 |
| `cliente_id` | uuid FK → `clientes` | E-51 |
| `reagenda_count` | integer default 0 | E-46 (V-1) |
| `motivo_no_viable` | text | E-49 |

**Predicado de incumplimiento (determinista, temporizador):**

```
P_sla(l) = l.primera_respuesta_at IS NOT NULL
        ∧ l.primera_respuesta_at - l.created_at > parametro('sla_primera_respuesta_min')::interval
```

Si `P_sla` → el sistema: `sla_cumplido=false`, inserta fila en `sla_eventos` (registro del incumplimiento), `sla_escalado_a = CASE WHEN parametro('llm_disponible') THEN 'ia_llm' ELSE 'comercial_2' END`, `sla_escalado_at=now()` (D8, `:132`, I-054/1). El registro es independiente de qué escalado ocurre (guía + registrador).

### 4. Valores numéricos resueltos como campos o checks

Tabla `parametros` **[nuevo]** (clave/valor tipado) — todos los valores resueltos I-054 son configuración, no constantes:

| clave | valor | Fuente |
|---|---|---|
| `sla_primera_respuesta_min` | 5 | `log_insights_fase2.md:69` (I-054/1), `:132` |
| `sla_novedad_critica_horas_min` / `_max` | 5 / 24 | `logica_de_negocio.md:258` |
| `holgura_cobro_dias` | 12 | `logica_de_negocio.md:480`; `diamante2_discover_eventos.md:101` (E-29) |
| `holgura_cronograma_max_dias` | 5 | `logica_de_negocio.md:255` |
| `rango_instalacion_dias` | 5 | `logica_de_negocio.md:254` |
| `promesa_semanas` | 7 | `log_insights_fase2.md:39` (I-024) |
| `reagenda_max` | 1 | `diamante2_define_eventos.md:140` (V-1) |
| `comision_desarrollador_pct` | 5 | `diamante2_define_eventos.md:178` (D6) |
| `comision_carpintero_pct` | 5 | `log_insights_fase2.md:69` (I-054/5) |
| `diseno3d_bruto` | 130000 | `logica_de_negocio.md:225`; I-022 |
| `retencion_disenador_pct` (o ±IVA) | **PENDIENTE contador** | `diamante2_define_eventos.md:145` |
| `reduccion_comision_causa_interna_pct` | **PENDIENTE** (no especificado) | `:79` |
| `umbral_novedad_check15` | **PENDIENTE** (no especificado) | I-025 `log_insights_fase2.md:40` |
| `llm_disponible` | config infra | `:132` |

**Checks en columnas:**
- `obligaciones_pendientes` (E-29): check de atraso `hoy > fecha_vencimiento + holgura_cobro_dias` → notificación automática al gerente (prioridad baja, **no bloquea**).
- `novedades_criticas` (E-34): check `(hora_resolucion - hora_entrada) > ventana_sla` → estado `escalada` + `visibilidad_gerente=true`; **sin multa automática** (I-054/4).
- `leads.estado='no_viable'` (E-49): se pierde del flujo activo; `motivo_no_viable` obligatorio (dato para el embudo, I-054/3).
- E-30 (deducción del diseño 3D): `obligaciones_pendientes` del anticipo nace con descuento = `diseno3d_bruto` si existe pago E-08 registrado (sistema, no memoria — `logica_de_negocio.md:460`).
- E-35 (comisiones): causa interna registrada en `desfases_cronograma` → reduce comisión desarrollador/carpintero; causa externa → se mide contra nuevos plazos; el % es parámetro.

### 5. Lo que NO es capturable en schema

| Ítem | Tipo | Razón y tratamiento |
|---|---|---|
| Composición causal de E-33 (D4) | `DECISION_PENDIENTE` | El predicado exige que exista el registro; la **veracidad** del trazado es semántica → `desfases_cronograma.decision_manual` + `decision_manual_responsable_id` + `justificacion` (`:79`, `:139`) |
| Origen del reproceso (culpable, D2) | `DECISION_PENDIENTE` | Atribución humana (proveedor/desarrollador/comercial) registrada en `reprocesos.origen`; no computable por schema (`:76`, `:137`) |
| Umbral de "novedad" del check de 15 días (E-59) | `DECISION_PENDIENTE` | Los inputs (a) insumos en taller → `recepciones`, (b) comprados/pagados → `ordenes_compra.estado`, (c) fila del taller → `modulos_taller` son deterministas; el desenlace `insinuar_instalacion`/`posponer_interno`/`negociar` necesita umbral numérico no especificado → parámetro pendiente (I-025) |
| % de reducción de comisión por causa interna (E-35) | `DECISION_PENDIENTE` | No hay número en el Define → parámetro |
| Neto del diseñador (retención ± IVA) | `DECISION_PENDIENTE` | Valor real pendiente de validación con el contador (`:145`) |
| Juicio "sin defectos" de E-21 | `DECISION_PENDIENTE` (parcial) | El juicio humano no es computable; el **predicado evalúa el booleano registrado** — el rol verificador (desarrollador) lo declara |
| Detalle interno del taller (E-22 tareas, manual ISO, pantallas de carpinteros) | `DIFERIDO` | Capa 2 (`:172-174`); solo la fila de módulos es capa 1 (B2) |
| Subsistema de firma digital (V-6/RED2) | `DIFERIDO` | Construcción propia verificada; el schema guarda la referencia, no la verificación (`:143`) |
| Horas/bienestar (V-5) | `DIFERIDO` | Registro automático de horas requiere módulo RRHH/Nómina (capa 2) (`:142`) |
| Marketing/Demanda, Tienda web, Gobierno/Medición (E-40/E-42/E-44/E-47/E-55) | `DIFERIDO` | Construcción en t-034; solo interfaces de frontera (`:174`) |
| Alojador de documentación R2 (E-41) | `DIFERIDO` | Elección Drive vs. R2; hoy `documentos.almacen='drive'` (`logica_de_negocio.md:372`) |
| Facturación DIAN | `DIFERIDO` | Software externo "Aliado"; el ERP no la construye (`logica_de_negocio.md:386-393`) |

---

## Tabla resumen: los 5 gates (predicados evaluables)

| Gate | Predicado resumido | Transición | Bloqueo |
|---|---|---|---|
| E-18 | `estado='desarrollo' ∧ ∃veredicto schema aprobado por rol comercial` | `desarrollo → aprobado_compras` | No hay orden de compra; rechazo → E-54 + recalculo |
| E-21 | `check pedido ∧ check despacho ∧ ∀ítem: cantidad≥esperada ∧ sin defectos ∧ catálogo coincide` | `aprobado_compras → armado` + OC `recibido_verificado` | No pasa a taller; falla → E-54 origen D2 |
| E-24 | `estado='armado' ∧ ∃citación ∧ ∃veredicto calidad aprobado por rol comercial` | `armado → verificado` | No hay instalación; rechazo → E-54 módulos + recalculo |
| E-33 | `∃desfase aplicado con causa∈{interna,externa,cambio_contrato} ∧ motivo ∧ composición_causal` | recálculo solo línea `interna`; `contractual` inmutable 7 semanas | Sin causa estructurada no se recalcula; causa interna → comisiones bajan |
| E-20 | `caja_disponible = Σ saldos − Σ por_pagar pendientes ≥ monto_a_pagar` | OC `aprobada → pagada` | **Bloqueo completo** (D1); gerente mueve cronogramas |

Todos son evaluables con SQL sobre columnas reales (existentes o propuestas); ninguno depende de juicio subjetivo en el momento de evaluarse — el juicio vive **antes** del predicado, como dato registrado por un rol (verificador, desarrollador, gerente).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| ENF-01 | `CORRECCION_SCHEMA` | `estado_proyecto` actual (8 valores legacy) no cubre los estados del Define (`desarrollo/aprobado_compras/armado/verificado/instalado`) → extender enum + mapeo de migración (activa→borrador, enviada→en_revision, en_contrato→cotizado, pre_produccion→desarrollo, produccion→armado) | schema.ts:36-45; diamante2_discover_eventos.md:37,47,63,66,74,81,83,90,91 |
| ENF-02 | `GAP_SCHEMA` | `leads` sin estado, canal, primera_respuesta_at, cliente_id, reagenda_count, motivo_no_viable → E-02/E-03/E-04/E-46/E-49/E-50/E-51 no modelables (reafirma I-005) | schema.ts:271-281; log_insights_fase2.md:20 |
| ENF-03 | `GAP_SCHEMA` | No existen `veredictos` ni `citaciones_calidad` → E-18/E-23/E-24 sin materialización | schema.ts (ausente); diamante2_define_eventos.md:75,77,78 |
| ENF-04 | `GAP_SCHEMA` | No existen `ordenes_compra`, `orden_compra_items`, `recepciones`, `recepcion_items` → E-19/E-20/E-21 sin materialización | schema.ts (ausente); diamante2_discover_eventos.md:72-74 |
| ENF-05 | `GAP_SCHEMA` | No existe `cronograma` ni `desfases_cronograma` → E-14/E-33/E-59 sin materialización (contexto central) | schema.ts (ausente); diamante2_discover_eventos.md:57,113,112 |
| ENF-06 | `GAP_SCHEMA` | No existe `modulos_taller` (fila de salida del taller, capa 1 por B2) — input de E-59/E-34 | schema.ts (ausente); diamante2_define_eventos.md:118 |
| ENF-07 | `GAP_SCHEMA` | `rol_empleado` sin desarrollador/verificador/gerente/instalador/diseñador — precondición de todos los guards | schema.ts:27-32; diamante2_define_eventos.md:57-61 |
| ENF-08 | `GAP_SCHEMA` | `proyectos` sin `comercial_vendedor_id` — el verificador único es el comercial vendedor (D3); sin la asignación el guard no tiene a quién evaluar | diamante2_define_eventos.md:75,153 |
| ENF-09 | `GAP_SCHEMA` | `leads` sin `gclid` → conversiones offline (E-40) no capturables (perdido en migración, I-005) | schema.ts:271-281; log_insights_fase2.md:20 |
| ENF-10 | `RUIDO_SCHEMA` | `score_conversion` (schema.ts:279) sin lecturas — no se modela en la máquina de lead salvo que I-012 lo reviva con propósito documentado | schema.ts:279; log_insights_fase2.md:20,27 |
| ENF-11 | `NORMALIZACION` | `saldo_actual` almacenado (cuentas_financieras) vs. derivado de movimientos = dos verdades (P3-12); el gate E-20 usa caja **derivada** y `saldo_actual` queda materializado con regla de reconciliación | schema.ts:236; diamante2_discover_eventos.md:117 |
| ENF-12 | `DECISION_PENDIENTE` | Composición causal de E-33: el predicado exige el registro, la veracidad del trazado es semántica → `decision_manual` + responsable | diamante2_define_eventos.md:79,139,155 |
| ENF-13 | `DECISION_PENDIENTE` | Origen del reproceso (D2): atribución humana registrada, no computable | diamante2_define_eventos.md:76,137 |
| ENF-14 | `DECISION_PENDIENTE` | Umbral de "novedad" del check de 15 días no especificado → parámetro `umbral_novedad_check15` | log_insights_fase2.md:40; diamante2_define_eventos.md:19 |
| ENF-15 | `DECISION_PENDIENTE` | % de reducción de comisiones por causa interna (E-35) no especificado → parámetro | diamante2_define_eventos.md:79 |
| ENF-16 | `DECISION_PENDIENTE` | Retención del diseñador ± IVA pendiente de validación con el contador → parámetro `retencion_disenador_pct` | diamante2_define_eventos.md:128,145 |
| ENF-17 | `DIFERIDO` | Detalle interno del taller (E-22 tareas, manual ISO, pantallas de carpinteros) capa 2 | diamante2_define_eventos.md:172-174 |
| ENF-18 | `DIFERIDO` | Subsistema de firma digital (V-6); el schema guarda referencia, no la verificación | diamante2_define_eventos.md:143 |
| ENF-19 | `DIFERIDO` | Horas/bienestar (V-5) requiere módulo RRHH/Nómina (capa 2) | diamante2_define_eventos.md:142 |
| ENF-20 | `DIFERIDO` | Construcción de Marketing/Tienda/Gobierno en t-034; solo interfaces de frontera | diamante2_define_eventos.md:174 |
| ENF-21 | `GAP_SCHEMA` | No existe `excepciones_gate` (guía + registrador de la realidad, D1/C1): bypass auditable de gates con motivo+responsable+autorizador; E-20 sin bypass | diamante2_define_eventos.md:71,87; log_insights_fase2.md:67 |
| ENF-22 | `CORRECCION_SCHEMA` | Precedencia de etapas: `aprobacion → compras → ensamblaje → instalacion` (P5-09) debe reflejarse en `cronograma.etapa` y en la lista de etapas del contrato | diamante2_define_eventos.md:81-83 |
| ENF-23 | `GAP_SCHEMA` | `ordenes_trabajo.estado` (texto, schema.ts:214) sin tipado; requiere `tipo ∈ {produccion, garantia}` para E-37 y estados de garantía | schema.ts:214; diamante2_discover_eventos.md:127 |
| ENF-24 | `GAP_SCHEMA` | `pedidos_web` sin enganche a orden de producción (E-44): falta columna/vínculo pedido→orden | schema.ts:304-313; diamante2_discover_eventos.md:147 |
| ENF-25 | `GAP_SCHEMA` | `proyectos` sin `fecha_entrada_desarrollo` (o `updated_at` de estado) — los predicados P18/P24 exigen ordenar el veredicto después del ingreso al estado | schema.ts:91-109; diamante2_define_eventos.md:75 |

---

## Notas para el Orquestador

1. **Este pase propone +8 tablas nuevas** (`veredictos`, `citaciones_calidad`, `ordenes_compra`, `orden_compra_items`, `recepciones`, `recepcion_items`, `cronograma`, `desfases_cronograma`, `modulos_taller`, `novedades_criticas`, `reprocesos`, `sla_eventos`, `cambios_contrato`, `excepciones_gate`, `citas`, `parametros`, `documentos`) y **extensiones** a `leads`, `proyectos` (enum + `comercial_vendedor_id`), `ordenes_trabajo` (tipo), `pedidos_web` (enganche). Es divergencia (A1): A2 converge.
2. **Dependencias con otros pases:** ENF-07 (rol-vs-persona) es competencia de **A1-3 (roles)** pero es precondición de todos los guards — coordinar el enum `rol_empleado` con las tablas de asignación persona→rol. La caja y los movimientos financieros son de **A1-4 (dinero)** (E-08/E-20/E-43/E-56). Las columnas de `leads` (canal, gclid, utm) son de **A1-5 (datos)**.
3. **Sobre el "recibido_verificado":** es estado de `recepciones`/`ordenes_compra`, NO de `proyectos`; el proyecto pasa a `armado` al completarse el gate. Verificado por el ciclo A2.
4. **Decisión que el Orquestador debe llevar al A2:** la reconciliación guard-duro vs. "guía + registrador" materializada como `excepciones_gate` (ENF-21). Es la única tensión estructural del enforcement; el resto es despliegue de columnas.
5. **El SLA de primera respuesta (E-50) es 100% determinista** (ventana 5 min = parámetro), pero depende de la fuente de `primera_respuesta_at` (integración Chatwoot, externa). Marcar en A2 como integración de frontera, no como campo muerto.
6. **Nada de este pase modifica `lib/db/schema.ts` ni ningún archivo fuera de esta salida.** Prohibido cumplido.
