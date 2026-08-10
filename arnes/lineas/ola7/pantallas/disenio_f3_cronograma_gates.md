# F3 — Cronograma + Gates E-18/E-33 (Veta de Oro)

**Fecha:** 2026-08-05 · **Estado:** APROBADO (`plan_t-B2.md`, 2026-08-09) · **Fase:** F3 · **Ruta:** `/erp/proyectos/[proyectoId]` (hub P-06) + `/erp/proyectos/[proyectoId]/cronograma` (P-09/P-10/P-11) + `/retoma` + `/desarrollo` + `/erp/equipo` + `/erp/gates` — rutas híbridas, ver `plan_t-B2.md` §"Decisiones del Supervisor" punto 3 (reemplaza la propuesta de ruta original de esta línea) · **Roles:** admin, desarrollador, comercial

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, verificador_id, fecha_entrada_desarrollo, comercial_vendedor_id | Header proyecto; máquina de estados; lectura de verificador único (D3/I-035); T0 para E-18 |
| `cronogramas` | §5 Cronograma | proyecto_id, base_semanas, holgura_maxima_dias, promesa_semanas | Cronograma maestro; doble línea contractual/interna; base para recálculo E-33 |
| `cronograma_etapas` | §5 Cronograma | cronograma_id, linea (contractual/interna), etapa, fecha_ideal, fecha_real, estado | Tabla doble línea P-09; contractual inmutable, interna recalculable (I-034) |
| `desfases_cronograma` | §5 Cronograma | proyecto_id, dias_desfase, aplicado, causa (interna/externa/cambio_contrato), composicion_causal (jsonb), motivo, decision_manual, autorizado_por, resultado_recalculo | Editor de desfase E-33 en P-09; predicado P33 |
| `novedades_criticas` | §5 Cronograma | proyecto_id, descripcion, fase, ventana_sla_horas (5-24), estado, escalado_a | P-10: lista de novedades + SLA + escalación |
| `check_produccion` | §5 Cronograma | proyecto_id, fecha_check, desenlace (todo_bien/novedad/extremo), ratio_insumos, ratio_pagos, ratio_produccion, desenlace_sugerido, desenlace_final, override_justificacion, comisiones_reducidas_pct, verificador_id | P-11: check de producción + 3 desenlaces + reducción comisiones |
| `comunicaciones_progreso` | §5 Cronograma | proyecto_id | P-09: comunicación E-60 (solo adelantos positivos) |
| `schemas_proyecto` | §6 Desarrollo y schema | id, proyecto_id, estado (borrador/en_desarrollo/para_revision/aprobado_compras/rechazado/en_reproceso), version | P-08: schema versionado + veredicto E-18 |
| `bom_materiales` | §6 Desarrollo y schema | schema_id, producto_id, cantidad, unidad, origen (cotizacion/desarrollo), homologable, item_variante_id | P-08: BOM del schema |
| `verificaciones` | §6 Desarrollo y schema | proyecto_id, tipo_gate (schema/recepcion/calidad), veredicto (aprobado/rechazado/rechazado_total/reproceso_parcial), verificador_id, creado_en | P-08: veredicto E-18 (gate schema); P-06: badges de estado de gates |
| `estimaciones` | §5 Cronograma | proyecto_id, valor, cantidad_modulos, duracion_estimada, factor_crecimiento | P-11: factor_tamano_aplicado = snapshot de factor_crecimiento; P-04: timeline resumido |
| `contratos` | §4 Contratos | id, proyecto_id, codigo_contrato, valor_total, plazos | Contexto del proyecto; fija cronograma contractual |
| `cambios_contrato` | §4 Contratos | proyecto_id, tipo_cambio, descripcion, dispara_desfase | P-09: tercer origen del flujo I-027 → E-33 |
| `modulos` | §8 Producción | id, proyecto_id, estado, espacio_variante_id | P-11: modulos esperados vs. armado+ (ratio_produccion); P-06: deep-link a pantallas de módulo |
| `citaciones_calidad` | §8 Producción | proyecto_id, modulos_ids (jsonb) | P-06: señal E-23 en timeline de gates |
| `personas` | §1 Cimientos F0 | id, nombre, documento, telefono | P-12: designación verificador_id; P-08: guard botón "Aprobar" |
| `personas_roles` | §1 Cimientos F0 | persona_id, rol_id, activo, desde | P-12: lista de roles activos |
| `parametros` | §1 Cimientos F0 | base_semanas_cronograma, holgura_maxima_dias, promesa_semanas, tarifa_*, umbral_todo_bien_pct, umbral_extremo_pct, reduccion_comision_novedad_pct, reduccion_comision_extremo_pct, transiciones_proyecto | Valores configurables para cronograma, check de producción, comisiones, y transiciones de kanban |
| `eventos` | §1 Cimientos F0 | tipo_evento, proyecto_id, actor_id, contexto | Auditoría de toda transición de estado y gate |

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

### 2.1 Proyecto (máquina global — §B.0 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `desarrollo` | "Aprobar schema" | `aprobado_compras` | E-18 | P18: ∃ verificaciones con tipo_gate='schema', veredicto='aprobado', verificador_id=proyectos.verificador_id, creado_en ≥ fecha_entrada_desarrollo |
| `desarrollo` | "Rechazar schema" | `desarrollo` (schema → `en_reproceso`) | E-18 / E-54 | Detalle requerido → reproceso |
| `armado` | "Iniciar instalación" | `en_instalacion` | E-25 | Requiere P24 (calidad) + rango de 5 días |
| `en_instalacion` | "Marcar instalada" | `instalado` | E-25 | — |
| `instalado` | "Generar acta de entrega" | `entregado` | E-26 | — |

### 2.2 Schema de proyecto (§B.7 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `borrador` | "Subir schema" | `para_revision` | E-17 | Version +1 |
| `para_revision` | "Aprobar schema" | `aprobado` (implícito por veredicto) | E-18 | Verificador único = comercial vendedor |
| `para_revision` | "Rechazar schema" | `en_reproceso` | E-18 / E-54 | Detalle requerido |
| `en_reproceso` | "Marcar para revisión" | `para_revision` | E-17 | Desarrollador corrige |

### 2.3 Desfase de cronograma (§B.15 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (nuevo) | "Aplicar desfase" | `aplicado=true` | E-33 | P33: ∃ desfase con causa∈{interna,externa,cambio_contrato} ∧ motivo>0 ∧ composicion_causal>0 |
| `aplicado=true` | "Decisión manual" | decisión registrada | E-33/D4 | Solo gerente; justificación obligatoria |

### 2.4 Check de producción (§B.16 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (nuevo check) | "Confirmar check" → `todo_bien` | Adelanto E-60, sin reducción comisión | E-59 | MIN(ratios) ≥ umbral_todo_bien_pct |
| — (nuevo check) | "Confirmar check" → `novedad` | Pospone línea interna, comisión -reduccion_comision_novedad_pct | E-59 | umbral_extremo_pct ≤ MIN(ratios) < umbral_todo_bien_pct |
| — (nuevo check) | "Confirmar check" → `extremo` | Escalar + negociar cliente, comisión -reduccion_comision_extremo_pct | E-59 | MIN(ratios) < umbral_extremo_pct |
| Cualquiera | "Anular sugerencia" → override manual | desenlace_final ≠ desenlace_sugerido | — | override_justificacion obligatoria antes de habilitar [Confirmar check] |

### 2.5 Novedad crítica (§B.17 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (nueva) | "Registrar novedad" | `abierta` | E-34 | Descripción + fase; corre SLA 5–24h |
| `abierta` | "Escalar" | `escalada` | E-34 | Se asigna escalado_a |
| `abierta` / `escalada` | "Marcar resuelta" | `resuelta` | E-34 | cumple SLA verificado |

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Cronograma" | — | `cronogramas` (nunca "plan de obra" suelto) |
| "Desfase" | — | `desfases_cronograma` |
| "Gate" / "Aprobación" | — | `verificaciones` |
| "Novedad crítica" | — | `novedades_criticas` |
| "Check de producción" | — | `check_produccion` (nunca "check de los 15 días" en UI, el nombre canónico es "Check de producción") |
| "Esquema" (schema) | — | `schemas_proyecto` |
| "Módulo" | — | `modulos` |
| "Borrador" | `borrador` | `proyectos.estado` / `schemas_proyecto.estado` |
| "En desarrollo técnico" | `desarrollo` | `proyectos.estado` |
| "Aprobado para compras" | `aprobado_compras` | `proyectos.estado` |
| "En armado" | `armado` | `proyectos.estado` |
| "En instalación" | `en_instalacion` | `proyectos.estado` |
| "Instalado" | `instalado` | `proyectos.estado` |
| "Entregado" | `entregado` | `proyectos.estado` |
| "Verificado" (interno) | `verificado` | `proyectos.estado` — oculto al cliente |
| "Aprobado" | `aprobado` | `verificaciones.veredicto` |
| "Rechazado" | `rechazado` | `verificaciones.veredicto` |
| "Causa interna" | `interna` | `desfases_cronograma.causa` |
| "Causa externa" | `externa` | `desfases_cronograma.causa` |
| "Cambio de contrato" | `cambio_contrato` | `desfases_cronograma.causa` |
| "Línea contractual" | `contractual` | `cronograma_etapas.linea` |
| "Línea interna" | `interna` | `cronograma_etapas.linea` |
| "Todo listo" | `todo_bien` | `check_produccion.desenlace_final` |
| "Novedad" | `novedad` | `check_produccion.desenlace_final` |
| "Situación extrema" | `extremo` | `check_produccion.desenlace_final` |
| "Abierta" | `abierta` | `novedades_criticas.estado` |
| "Escalada" | `escalada` | `novedades_criticas.estado` |
| "Resuelta" | `resuelta` | `novedades_criticas.estado` |
| "Aprobar schema" | — | Verbo único E-18 (P-08) |
| "Rechazar schema" | — | Verbo único E-18 (P-08) |
| "Aplicar desfase" | — | Verbo único E-33 (P-09) |
| "Decisión manual" | — | Verbo único E-33/D4 (P-09) |
| "Confirmar check" | — | Verbo único E-59 (P-11) |
| "Registrar novedad" | — | Verbo único E-34 (P-10) |
| "Escalar" | — | Verbo único E-34 (P-10) |
| "Marcar resuelta" | — | Verbo único E-34 (P-10) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | E-18: Check de schema pre-compras (P-08) — `P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='schema' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ p.fecha_entrada_desarrollo` | Servidor, al ejecutar veredicto | Test: veredicto sin verificador correcto → 422; veredicto antes de fecha_entrada_desarrollo → 422 |
| R2 | E-33: Cambio de cronograma con causa (P-09) — `P33(p) = ∃d∈desfases_cronograma: d.proyecto_id=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicion_causal)>0` | Servidor, al aplicar desfase | Test: desfase sin motivo → 422; desfase sin composicion_causal → 422 |
| R3 | I-034: Línea `contractual` del cronograma NUNCA se recalcula. Solo `cronograma_etapas.linea='interna'` se recalcula al aplicar E-33 | Servidor, en recálculo | Test: verificar que contractual.fecha_real = contractual.fecha_ideal tras aplicar desfase |
| R4 | I-034: Adelanto positivo (E-59→E-60) NO pasa por E-33 | Guard en flujo de P-09→P-11 | Test: desenlace todo_bien no dispara E-33 |
| R5 | C1: Las 3 tarifas de mano de obra se calculan en runtime desde `parametros`; el cronograma cuantifica jornadas (horas/tiempo), no costo | Servidor, al derivar costo | Test: costo_derivado = jornadas × tarifa_parametro vigente |
| R6 | D3: Verificador único E-18/E-24 = comercial vendedor (`proyectos.comercial_vendedor_id`). Botón "Aprobar" solo si `verificador_id = currentUser.id` | Guard en UI + servidor | Test: usuario no comercial vendedor → botón deshabilitado; POST con otro verificador_id → 403 |
| R7 | E-33 recálculo: SOLO línea `interna` se recalcula; `contractual` permanece inmutable (I-034) | Servidor, al guardar desfase | Test: desfase aplicado → cronograma_etapas WHERE linea='interna' tiene fecha_real ≠ fecha_ideal; WHERE linea='contractual' permanece igual |
| R8 | E-20: Bloqueo de caja (F4, no F3) — `P20(o) = caja_disponible ≥ monto_pago` donde `caja_disponible = Σcuentas_financieras.saldo_actual − Σobligaciones_pendientes(pendiente/atrasada)(monto_total−monto_pagado)` | Servidor, al registrar pago OC | Test: POST pago con caja insuficiente → 402; se registra en `registros_gate_caja` |
| R9 | Check de producción: desenlace_sugerido = MIN(ratio_insumos, ratio_pagos, ratio_produccion) contra `parametros.umbral_todo_bien_pct`/`umbral_extremo_pct`. Ambos desenlaces novedad y extremo reducen comisión (extremo más que novedad) | Servidor, al generar check | Test: ratios [0.60, 0.98, 0.98] → MIN=0.60 < umbral_extremo_pct → extremo; ratios [0.80, 0.98, 0.98] → MIN=0.80 entre umbrales → novedad |
| R10 | Verificador puede anular desenlace_sugerido con "Anular sugerencia" → requiere `override_justificacion` obligatoria antes de habilitar `[Confirmar check]` | Guard en UI + servidor | Test: confirmar sin override_justificacion tras anular → 422 |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `MapaGatesTimeline` (P-06) | Server + Client | `proyecto: Proyecto, verificaciones: Verificacion[], desfases: DesfaseCronograma[]` | `proyectos`, `verificaciones`, `desfases_cronograma` | `--color-primary`, timeline horizontal, badges de estado (✅ pendiente ⚠ bloqueado 🔴 rechazado) |
| `GateBadge` (P-06) | Client | `gate: GateEstado, tipo: GateTipo` | `verificaciones` | Colores de estado, deep-link a P-08/P-14/P-17/P-09/P-20 |
| `PanelDecisionGerente` (P-06) | Client | `decisiones: DecisionPendiente[]` | `verificaciones`, `desfases_cronograma` | Panel "Requiere tu decisión", solo rol gerente |
| `RetomaForm` (P-07) | Client | `proyecto: Proyecto, onSave: (data) => void` | `retomas` | Inputs jsonb por módulo, captura foto (E-41), checkbox "Anomalía detectada", auto-save |
| `SchemaViewer` (P-08) | Client | `schema: SchemaProyecto, bom: BomMaterial[], version: number` | `schemas_proyecto`, `bom_materiales` | Schema versionado, BOM expandible |
| `VeredictoGate` (P-08) | Client | `gate: Verificacion, verificadorId: string, currentUserId: string` | `verificaciones` | Botones Aprobar/Rechazar; deshabilitados si verificador_id ≠ currentUser.id; requiere detalle si rechazo |
| `IntegracionesPanel` (P-08) | Client | `schemaAprobado: boolean` | — | E-38 (modelo 3D), E-39 (corte); deshabilitados hasta E-18 aprobado |
| `CronogramaDobleTabla` (P-09) | Server + Client | `etapas: CronogramaEtapa[], editable: boolean` | `cronograma_etapas` | Tabla doble línea: Contractual (inmutable, columnas bloqueadas) | Interna (movible, editable) | Estado; 11 CollapseStrips |
| `EditorDesfase` (P-09) | Client | `proyecto: Proyecto, onAplicar: (desfase) => void` | `desfases_cronograma` | Causa + composición causal (jsonb) + motivo + decisión manual (solo gerente); botón "Aplicar desfase" |
| `ComunicacionAdelanto` (P-09) | Client | `desenlace: 'todo_bien'` | `comunicaciones_progreso` | Solo visible si check 15 → todo_bien; botón "Crear comunicación" (E-60) |
| `NovedadCard` (P-10) | Client | `novedad: NovedadCritica` | `novedades_criticas` | Descripción, fase, chip SLA (temporizador 5-24h), badge estado; botones Escalar/Resolver según rol |
| `NovedadLista` (P-10) | Server + Client | `novedades: NovedadCritica[]` | `novedades_criticas` | Lista de cards; botón `[+ Registrar novedad]` |
| `MedidoresCheck` (P-11) | Client | `ratios: {insumos, pagos, produccion}, parametros: Parametros` | `check_produccion` | 3 medidores independientes (ratio_insumos, ratio_pagos, ratio_produccion) con barra/badge cada uno |
| `DesenlacePanel` (P-11) | Client | `sugerido: Desenlace, final: Desenlace, onAnular, onConfirmar` | `check_produccion` | Muestra desenlace_sugerido (derivado); botón `[Anular sugerencia]` → requiere override_justificacion; botón `[Confirmar check]` |
| `EquipoLista` (P-12) | Client | `personas: PersonaRol[]` | `personas_roles` | Lista de personas con rol activo; botón `[+ Crear empleado]` |
| `VerificadorDesignacion` (P-12) | Client | `proyecto: Proyecto, onDesignar: (personaId) => void` | `personas`, `proyectos` | Dropdown de personas con rol comercial; asigna `proyectos.verificador_id` (único comercial vendedor) |

**Patrones M-06 L1 usados:** Suspense (Server + Client split), auto-save con debounce, SmartSearch (personas), MoneyInput (costos derivados), deep-links entre pantallas, type-to-confirm (anular sugerencia)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar P-06 (Mapa de Gates) | `/app/erp/proyectos/[id]` mount | `Promise.all([proyecto, verificaciones, recepciones_material, desfases_cronograma, eventos])` | Timeline horizontal con badges de estado para los 5 gates + E-23 señal | E-18, E-21, E-24, E-33, E-20, E-23 |
| 2 | Cargar P-07 (Retoma) | `/app/erp/proyectos/[id]/retoma` mount | Carga retoma existente o formulario nuevo | Auto-save cada 2s | E-15 |
| 3 | Marcar anomalía (P-07) | Checkbox "Anomalía detectada" | Dispara E-16 → cambio de contrato | Crea `cambios_contrato` con `tipo_cambio`, `dispara_desfase=true` | E-16 |
| 4 | Subir schema (P-08) | Botón "Subir schema" | `POST /api/erp/schemas {proyecto_id, version+1}` | Schema versionado; `eventos` registra E-17 | E-17 |
| 5 | Marcar para revisión (P-08) | Botón "Marcar para revisión" | `PATCH /api/erp/schemas/:id {estado: 'para_revision'}` | Habilita veredicto para comercial | E-17 |
| 6 | **Aprobar schema** (P-08) | Botón "Aprobar schema" | `POST /api/erp/verificaciones {tipo_gate:'schema', veredicto:'aprobado'}` en 1 tx con `PATCH proyectos {estado: 'aprobado_compras'}` | Guard: verificador_id = currentUser.id; `eventos` registra E-18 | **E-18** |
| 7 | Rechazar schema (P-08) | Botón "Rechazar schema" | `POST /api/erp/verificaciones {tipo_gate:'schema', veredicto:'rechazado', detalle}` | Schema → `en_reproceso`; dispara E-54 | E-18, E-54 |
| 8 | Generar modelo 3D (P-08) | Botón "Generar modelo 3D" | Habilita solo si E-18 aprobado | `eventos` registra E-38 | E-38 |
| 9 | Enviar a corte (P-08) | Botón "Enviar a corte" | Habilita solo si modelo generado | `eventos` registra E-39 | E-39 |
| 10 | **Aplicar desfase** (P-09) | Botón "Aplicar desfase" | `POST /api/erp/desfases {proyecto_id, causa, composicion_causal, motivo}` → recálculo servidor SOLO línea `interna` | `eventos` registra E-33; contractual inmutable (I-034) | **E-33** |
| 11 | Decisión manual (P-09) | Botón "Decisión manual" | `PATCH /api/erp/desfases/:id {decision_manual, autorizado_por}` | Solo gerente; `eventos` registra E-33/D4 | E-33/D4 |
| 12 | Crear comunicación adelanto (P-09) | Botón "Crear comunicación" | `POST /api/erp/comunicaciones {proyecto_id, tipo: 'adelanto'}` | Solo si check 15 → todo_bien (E-59→E-60 positivo) | E-60 |
| 13 | Registrar novedad (P-10) | Botón `[+ Registrar novedad]` | `POST /api/erp/novedades {proyecto_id, descripcion, fase, ventana_sla_horas}` | Corre SLA 5–24h desde creación; `eventos` registra E-34 | E-34 |
| 14 | Escalar novedad (P-10) | Botón "Escalar" | `PATCH /api/erp/novedades/:id {estado: 'escalada', escalado_a}` | Visible en panel gerente; `eventos` registra E-34 | E-34 |
| 15 | Resolver novedad (P-10) | Botón "Marcar resuelta" | `PATCH /api/erp/novedades/:id {estado: 'resuelta'}` | Verifica cumple SLA; `eventos` registra E-34 | E-34 |
| 16 | Generar check (P-11) | Cronograma del proyecto dispara check | Servidor calcula 3 ratios + desenlace_sugerido = MIN(ratios) vs umbrales | `eventos` registra E-59 | E-59 |
| 17 | Anular sugerencia (P-11) | Botón `[Anular sugerencia]` | Muestra campo `override_justificacion`; habilita `[Confirmar check]` solo tras justificación | — | — |
| 18 | Confirmar check (P-11) | Botón `[Confirmar check]` | `POST /api/erp/check-produccion {proyecto_id, desenlace_final, verificador_id}` | Log de desenlace_final; alimenta E-25 (instalación) / E-35 (comisiones) / E-60 (comunicación) | E-59 |
| 19 | Cargar P-12 (Equipo) | `/app/erp/equipo` mount | `Promise.all([personas_roles, proyectos.verificador_id])` | Lista de personas con rol activo | E-18/E-24 (precondición) |
| 20 | Designar verificador (P-12) | Dropdown select | `PATCH /api/erp/proyectos/:id {verificador_id}` | Solo personas con rol comercial; `eventos` registra | D3/I-035 |
| 21 | Cambiar rol (P-12) | Botón "Asignar rol" | `POST /api/erp/personas-roles {persona_id, rol_id}` | Rol tipado de los 7 canónicos | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores en todos los archivos de F3 | `npx tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de F3 | `npx eslint app/erp/cronograma/ app/erp/gates/ app/erp/proyectos/ app/erp/equipo/` |
| CA-3 | Predicados E-18 y E-33 verificables con SQL | `grep -c "P18\|P33"` en código de gates ≥ 2; tests SQL ejecutables contra `dev-local` |
| CA-4 | Todos los labels usan H07 (no hay strings sueltos de estado) | `grep -r "'[A-Z]" app/erp/cronograma/ app/erp/gates/` = 0 resultados no documentados |
| CA-5 | Schema F3: tablas `cronogramas`, `cronograma_etapas`, `desfases_cronograma` existen en migración | `grep -c "cronogramas\|cronograma_etapas\|desfases_cronograma" lib/db/schema.ts` ≥ 3 |
| CA-6 | Schema F3: `proyectos` ampliada con `estado` (enum ampliado), `verificador_id`, `fecha_entrada_desarrollo`, `comercial_vendedor_id` | `grep -c "verificador_id\|fecha_entrada_desarrollo\|comercial_vendedor_id" lib/db/schema.ts` ≥ 3 |
| CA-7 | I-034: recálculo solo toca línea `interna`, contractual inmutable | Test: `npx tsx __tests__/cronograma/desfase.test.ts` → PASS (contractual sin cambios, interna recalculada) |
| CA-8 | E-18 guard: botón "Aprobar" solo habilitado para verificador único correcto | Test: `npx tsx __tests__/cronograma/gate_e18.test.ts` → PASS |
| CA-9 | E-33 guard: desfase requiere causa + composición causal + motivo | Test: `npx tsx __tests__/cronograma/gate_e33.test.ts` → PASS |
| CA-10 | P-11: check de producción deriva desenlace de 3 ratios (no se asienta a mano) | Test: `npx tsx __tests__/cronograma/check_produccion.test.ts` → PASS |
| CA-11 | Integración con P-04 (cotizador): P-04 consume estados/transiciones/params/cronograma de F3 | `grep -c "cronogramas\|verificaciones.tipo_gate\|proyectos.estado" app/erp/cotizador/` ≥ 3 |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md` — 21 entidades citadas con su § exacto
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md` — §B.0, B.7, B.8, B.15, B.16, B.17 verificados
- [ ] Todo label en §3 existe en `glosario_h07.md` — §A (entidades), §B (estados), §C (verbos) verificados
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien") — R1–R10 con test SQL o unitario
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1 — 16 componentes listados con tokens y patrones
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md` — 21 comportamientos con trace E-14..E-60
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables) — CA-1..CA-11 con comandos verificables

---

## Decisiones pendientes (bloqueantes para F3, NO afectan F2 cierre)

| ID | Descripción | Impacto |
|---|---|---|
| H-B3-2-01 | `base_comision_tamano` (E-35): ¿subtotal o total con IVA? | P-11 (check desenlace "extremo") → P-22 (comisiones F6) |
| H-B3-2-02 | Veracidad de la composición causal E-33 (D4): ¿auditar truth del trazado? | P-09 — predicado solo exige existencia, no veracidad |
| H-B3-2-06 | `sla_novedad_critica` (5-24h) y `holgura_cronograma_max_dias` (5) provienen del mapa | P-10, P-09 — validar fuente numérica |

---

## Próximos pasos (tras aprobación F3)

1. Schema F3 → migración aditiva hacia `dev-local`
2. P-01 (Kanban) + P-04 (cotizador) + P-06 (mapa gates) pueden implementarse en paralelo
3. P-08/P-09 (gates) después de F2/F3 schema fusionado
4. M-06 L1 (capa técnica) se cruza al final de F9

---

¿Apruebas este diseño F3 (cronograma + gates E-18/E-33)?
Si sí → F2 puede cerrarse (P-01..P-05 aprobados) y F3 pasa a implementación.
Si ajustes → indícalos y re-itero.
