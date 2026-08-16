# P-06 — Dashboard de Proyecto (Hub) y Flujo Diario

**Fecha:** 2026-08-15 · **Estado:** propuesta — pendiente checkpoint Supervisor · **Fase:** F3 (cronograma + gates) · **Tarea:** t-137 · **Ruta:** `/erp/proyectos/[proyectoId]` (hub P-06) · **Roles:** admin, desarrollador, comercial

---

## Alcance y relación con artefactos

- Este documento es el **diseño dedicado del hub P-06** (`/erp/proyectos/[proyectoId]/page.tsx`), que hoy **no tiene `disenio_PXX.md` propio** (se construyó sin documento de diseño). `disenio_f3_cronograma_gates.md` lo lista como ruta de destino de P-07..P-12, pero no diseña el shell/dashboard que las contiene. Este artefacto llena ese vacío y **no reemplaza** a `disenio_f3_cronograma_gates.md` (las pantallas P-07..P-12 individuales siguen rigiéndose por ese diseño).
- Fuente de verdad del pedido: `input_diseno_javier_20260815.md` §2 (t-137), incluyendo la Nota de contexto que ordena leer el hallazgo diferido **D-16** de `backlog_auditoria_pantallas.md` antes de proponer diseño. El pronunciamiento sobre D-16 está en §9.
- Problema que resuelve (texto de Javier): el diseño actual se enfoca excesivamente en los Gates mediante **cards estáticas y emojis hardcodeados**, descuidando el flujo operativo diario (Daily Flow) y el acceso a la información técnica.

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, direccion_obra, verificador_id, fecha_entrada_desarrollo, comercial_vendedor_id | Header del hub; estado actual para derivar timeline (origen/actual/siguiente hito); T0 para E-18; guard de acciones rápidas |
| `clientes` | §3 Comercial | id, nombre | Header: "Cliente: {nombre}" |
| `espacio_variantes` | §3 Comercial | id, proyecto_id, activa | Navegación modular: Espacios del proyecto (una activa) |
| `items_variante` | §3 Comercial | id, espacio_variante_id, es_referencial | Navegación modular: Ítems de cotización por espacio |
| `espacios_artefactos` | §3 Comercial | espacio_variante_id, categoria (determinante/bloqueante), medidas, requiere_verificacion | Overlay Retoma: verificación de artefactos determinantes (E-15) |
| `verificaciones` | §6 Desarrollo | proyecto_id, tipo_gate (schema/calidad), veredicto, verificador_id, creado_en | Predicados E-18 (schema) y E-24 (calidad) del timeline |
| `schemas_proyecto` | §6 Desarrollo | id, proyecto_id, estado (borrador/para_revision/en_reproceso), version | Rama de reproceso E-18 (`en_reproceso`); lista de versiones en detalle |
| `reprocesos` | §6 Desarrollo | proyecto_id, origen (schema/calidad/instalacion), culpable, granularidad (módulo/componente) | Bifurcaciones visuales por gate. **Campos propuestos nuevos `estado`/`modulo_id` — no existen hoy, ver §10** |
| `retomas` | §6 Desarrollo | proyecto_id, medidas, anomalías detectadas | Overlay Retoma (E-15/E-16) |
| `bom_materiales` | §6 Desarrollo | schema_id, producto_id, cantidad, unidad | Navegación modular: materiales del ítem (detalle técnico) |
| `cronogramas` | §5 Cronograma | proyecto_id, base_semanas, promesa_semanas | Panel "Dirección y datos de instalación": plazos |
| `cronograma_etapas` | §5 Cronograma | cronograma_id, linea (contractual/interna), etapa (instalacion), fecha_ideal, fecha_real | Panel instalación: fecha prevista (línea contractual) |
| `desfases_cronograma` | §5 Cronograma | proyecto_id, causa, motivo, composicion_causal, aplicado | Gate E-33 (predicado P33) — nodo transversal |
| `novedades_criticas` | §5 Cronograma | proyecto_id, descripcion, fase, ventana_sla_horas, estado, escalado_a | QuickActionModal E-34 (Registrar novedad) |
| `check_produccion` | §5 Cronograma | proyecto_id, ratio_insumos/pagos/produccion, desenlace_sugerido/final, override_justificacion | QuickActionModal E-59 (Confirmar check) — desenlace derivado, nunca asentado a mano |
| `ordenes_compra` | §7 Compras | id, proyecto_id, estado (en_pago/recibida_verificada) | Contexto de E-21 y E-20 (nunca "OC" en UI, label H07 "Orden de compra") |
| `recepciones_material` | §7 Compras | proyecto_id, checkPedidoBien/checkDespachoBien/checkMaterial | Gate E-21 (triple verificación) — **resuelve el gap técnico del page.tsx actual** (E-21/E-20 hoy son placeholders solo porque faltaban métodos de store, no columnas: `recepciones_material.proyecto_id` existe) |
| `modulos` | §8 Producción | id, padre_id (árbol recursivo), estado, espacio_variante_id, proyecto_id | Navegación modular Daily Flow (árbol Nodos→Espacios→Módulos). **Nota REGISTRO: "Gates por nodo (no por proyecto)" + Axioma 5 — ver §9** |
| `modulos_artefactos` | §8 Producción | modulo_id, fuente, plano_armado/modelo_3d/imagen | Navegación modular: Ítem / planos de detalle |
| `citaciones_calidad` | §8 Producción | proyecto_id, modulos_ids (jsonb), estado (citada/verificada) | Señal E-23 (no gate) |
| `instalaciones` | §8 Producción | proyecto_id, fecha, observaciones, fotos | Hito E-25 + panel "Dirección y datos de instalación" |
| `actas_entrega` | §8 Producción | proyecto_id, estado, firma | Hito E-26 (cierre) |
| `cuentas_financieras` | §9 Finanzas | saldo_actual | P20: caja_disponible = Σ saldos |
| `obligaciones_pendientes` | §9 Finanzas | estado (pendiente/atrasada), monto_total, monto_pagado | P20: caja_disponible = Σ obligaciones pendientes/atrasadas (monto_total−monto_pagado) |
| `registros_gate_caja` | §9 Finanzas | orden_compra_id, monto_solicitado, saldo_disponible, resolución | Traza de la rama negativa del gate E-20 (pagos bloqueados) |
| `eventos` | §1 Cimientos F0 | tipo_evento, proyecto_id, actor_id, contexto | Historial de un gate (auditoría append-only) al hacer click en un nodo completado |
| `parametros` | §1 Cimientos F0 | transiciones_proyecto | Valida botones de acción rápida (E-25/E-26) contra las transiciones permitidas |

---

## 2. Estados que transiciona

*El hub NO transiciona estados por sí mismo: es un agregador. Toda mutación se delega a los mismos POST/PATCH que ya definen las pantallas P-07..P-12 (misma API, mismos guards, misma traza E-XX — regla R7 de §4). Las transiciones que este hub orquesta son las de la máquina de estado de proyecto (glosario §B.0 / `disenio_f3_cronograma_gates.md` §2.1).*

### 2.1 Proyecto (máquina global — §B.0 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `desarrollo` | "Aprobar schema" (overlay E-18) | `aprobado_compras` | E-18 | P18: ∃ verificaciones tipo_gate='schema' aprobado, verificador_id=proyectos.verificador_id, creado_en ≥ fecha_entrada_desarrollo |
| `armado` | "Iniciar" instalación (acción rápida E-25) | `en_instalacion` | E-25 | Requiere P24 (calidad) + rango de 5 días |
| `en_instalacion` | "Marcar instalada" (acción rápida E-25) | `instalado` | E-25 | — |
| `instalado` | "Generar acta" (acción rápida E-26) | `entregado` | E-26 | — |

### 2.2 Schema de proyecto (rama del gate E-18 — §B.7 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `para_revision` | "Rechazar schema" (overlay E-18) | schema → `en_reproceso` | E-18 / E-54 | Detalle requerido → reproceso (abre bifurcación visual, §2.4) |
| `en_reproceso` | "Marcar para revisión" | schema → `para_revision` | E-17 | Desarrollador corrige → cierra la bifurcación |

### 2.3 Veredictos de gate (overlay — §B.8 del glosario)

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (nodo E-24) | "Registrar veredicto" (overlay calidad) | `verificado` (interno; cliente ve "En armado") | E-24 | Verificador único = comercial vendedor |
| — (nodo E-21) | "Confirmar recepción" | OC → `recibida_verificada` | E-21 | Checklist C3 completo (P21) |

### 2.4 Nodos del timeline (secuencia canónica del hub)

*Los nodos son **derivados** (regla R1, §4): el predicado de cada gate se evalúa contra datos reales; ningún nodo se pinta a mano. E-20 y E-33 son gates **transversales** (nodos secundarios, no del camino lineal). E-23 es **señal**, no gate.*

| Posición | Nodo | Tipo | Estado origen → destino | Predicado | Fuente de datos (§1) |
|---|---|---|---|---|---|
| 1 | E-18 Esquema | gate secuencial | `desarrollo` → `aprobado_compras` | P18 | `verificaciones` |
| 2 | E-21 Recepción | gate secuencial | (compras; sin cambio de estado de proyecto) | P21 | `recepciones_material` + `ordenes_compra` |
| T | E-20 Caja | gate transversal | — | P20 | `cuentas_financieras`, `obligaciones_pendientes`, `registros_gate_caja` |
| T | E-33 Desfase | gate transversal | — | P33 | `desfases_cronograma` |
| 3 | E-23 Citación | señal (no bloquea) | — | — | `citaciones_calidad` |
| 4 | E-24 Calidad | gate secuencial | `armado` → `verificado` (interno) | — | `verificaciones` |
| 5 | E-25 Instalación | hito de cierre | `verificado` → `en_instalacion` → `instalado` | P24 (precondición) | `instalaciones` |
| 6 | E-26 Entrega | hito de cierre | `instalado` → `entregado` | — | `actas_entrega` |

**Semántica visual del timeline (pedido 1 de Javier):**
- **Estado de origen (de dónde vienes):** el último nodo completado antes del nodo actual (predicado TRUE).
- **Estado actual (dónde estás):** el primer nodo pendiente del camino primario cuyo estado_origen coincide con `proyectos.estado` (único nodo actual, regla R3).
- **Siguiente hito (a dónde vas):** primer nodo pendiente tras el actual en el orden canónico (regla R4).
- **Bifurcación (branch):** un `reprocesos` con origen ∈ {schema, calidad, instalacion} se dibuja como rama visual del nodo del gate correspondiente (E-18, E-24, E-25). Rama abierta ⇔ no resuelta — ver regla R5 y propuestas nuevas en §10.

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí. Los estados internos (verificado, aprobado_compras) no se muestran al cliente; el ERP sí puede mostrarlos (frontstage vs. backstage, regla E.5).*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Esquema" | — | `schemas_proyecto` (gate E-18) |
| "Recepción" | — | `recepciones_material` (gate E-21) |
| "Calidad" | — | `verificaciones` tipo_gate='calidad' (gate E-24) |
| "Citación" | — | `citaciones_calidad` (señal E-23) |
| "Desfase" | — | `desfases_cronograma` (gate E-33) |
| "Caja" | — | gate E-20 |
| "Instalación" | — | `instalaciones` (E-25) |
| "Entrega" | — | `actas_entrega` (E-26) |
| "Retoma de medidas" | — | `retomas` |
| "Novedad crítica" | — | `novedades_criticas` |
| "Check de producción" | — | `check_produccion` (nunca "check de los 15 días" en UI) |
| "Orden de compra" | — | `ordenes_compra` (nunca el acrónimo "OC") |
| "Borrador" | `borrador` | `proyectos.estado` |
| "En revisión" | `en_revision` | `proyectos.estado` |
| "Cotizado" | `cotizado` | `proyectos.estado` |
| "En contrato" | `en_contrato` | `proyectos.estado` |
| "En desarrollo técnico" | `desarrollo` | `proyectos.estado` |
| "Aprobado para compras" | `aprobado_compras` | `proyectos.estado` |
| "En armado" | `armado` | `proyectos.estado` |
| "Verificado" (interno) | `verificado` | `proyectos.estado` — oculto al cliente |
| "En instalación" | `en_instalacion` | `proyectos.estado` |
| "Instalado" | `instalado` | `proyectos.estado` |
| "Entregado" | `entregado` | `proyectos.estado` |
| "Por armar" | `por_armar` | `modulos.estado` |
| "En armado" | `en_armado` | `modulos.estado` |
| "Armado" | `armado` | `modulos.estado` |
| "En calidad" | `en_calidad` | `modulos.estado` |
| "Aprobado" | `aprobado` | `modulos.estado` |
| "En instalación" | `en_instal` | `modulos.estado` |
| "Cerrar retoma" | — | Verbo E-15 (overlay) |
| "Marcar anomalía" | — | Verbo E-16 (overlay) |
| "Aprobar schema" | — | Verbo E-18 (overlay) |
| "Rechazar schema" | — | Verbo E-18 (overlay) |
| "Confirmar recepción" | — | Verbo E-21 |
| "Citar calidad" | — | Verbo E-23 (señal) |
| "Registrar veredicto" | — | Verbo E-24 (overlay) |
| "Aplicar desfase" | — | Verbo E-33 (overlay) |
| "Registrar novedad" | — | Verbo E-34 (overlay) |
| "Confirmar check" | — | Verbo E-59 (overlay) |
| "Iniciar" | — | Verbo E-25 (acción rápida) |
| "Marcar instalada" | — | Verbo E-25 (acción rápida) |
| "Generar acta" | — | Verbo E-26 (acción rápida) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | El timeline de gates es **derivado**, nunca asentado a mano (mismo axioma que el desenlace del check de producción, `mini_diamante_check_produccion.md`). Cada nodo = predicado del gate real de F3 (P18/P21/P20/P33) contra datos del store; no hay columna "estado de timeline" | Servidor, al renderizar | Test: `npx tsx __tests__/dashboard/derivar_timeline.test.ts` → PASS |
| R2 | Nodo completado ⇔ predicado TRUE. **Los emojis hardcodeados desaparecen de la UI** (pedido explícito de Javier); el estado se pinta con punto de color + chip tipográfico | Servidor, derivación | Test: veredicto schema aprobado → E-18 completado; sin él → pendiente |
| R3 | Existe UN único nodo "estado actual": el primer nodo pendiente del camino primario cuyo estado_origen coincide con `proyectos.estado` | Servidor, derivación | Test: proyectos.estado='desarrollo' sin E-18 → actual=E-18; con E-18 → actual=E-21 |
| R4 | "Siguiente hito" = primer nodo pendiente tras el actual en el orden canónico de §2.4 | Servidor, derivación | Test: estado='en_instalacion' → siguiente hito=E-26 (Entrega) |
| R5 | Bifurcación de reproceso: cada `reprocesos` con origen ∈ {schema, calidad, instalacion} se pinta como rama del nodo E-18/E-24/E-25 respectivamente. Rama abierta ⇔ no resuelta. **Hoy solo se puede inferir la resolución para schema** vía `schemas_proyecto.estado='en_reproceso'` → `para_revision`; para calidad/instalación se necesita el campo propuesto `reprocesos.estado` (§10) | Servidor, derivación | Test: `npx tsx __tests__/dashboard/ramas_reproceso.test.ts` → PASS |
| R6 | Las ramas de reproceso **no** evalúan gates por nodo en v1: la granularidad (módulo/componente) se muestra como detalle de la rama, pero el predicado del gate sigue siendo por proyecto (P18/P20/P33 de F3). Pronunciamiento sobre D-16 en §9 | Servidor, derivación | Test: agregar reproceso `origen='calidad'` cambia el detalle de la rama E-24, no el predicado P24 |
| R7 | Las acciones rápidas del hub **no duplican la máquina de estados**: llaman a la MISMA API (POST/PATCH) que P-07..P-12, con los mismos guards y traza E-XX | Guard en overlay + servidor | Test: PATCH "Iniciar" sin P24 → 422 (misma regla que P-18); verificación que el POST de veredicto exige verificador único |
| R8 | Los overlays conservan el contexto del proyecto: `BreadcrumbProyecto` persistente bajo la capa superpuesta; al cerrar se re-deriva el timeline (R1) | Cliente | Test de render: con overlay abierto el breadcrumb del proyecto sigue visible |
| R9 | E-20 (Caja) y E-33 (Desfase) son gates **transversales**: se muestran como nodos secundarios en la posición del flujo en que aplican (E-20 junto a compras cuando hay OCs `en_pago` o `registros_gate_caja`; E-33 cuando existe desfase), nunca como parte del camino lineal primario | Servidor, derivación | Test: sin desfases → nodo E-33 oculto; con desfase aplicado (P33) → nodo visible |
| R10 | E-23 (Citación) es **señal**, no gate: no bloquea el camino; se muestra como nodo informativo antes de E-24 | Servidor, derivación | Test: citación 'citada' pinta la señal, no marca E-24 como completado |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `HeaderProyectoHub` | Server | `proyecto, cliente` | `proyectos`, `clientes` | `Fraunces` (font-display), `--color-primary`, `text-heading`/`text-muted` |
| `TimelineGates` | Server + Client | `nodos: GateNodoDerivado[], proyecto` | derivado (R1..R10, §2.4) | Carrusel/timeline horizontal con scroll-x, `--radius-md`, separadores `bg-border-subtle` |
| `GateNode` | Client | `nodo: GateNodoDerivado, esActual, esSiguiente, onAbrirAccion` | `verificaciones`, `recepciones_material`, `desfases_cronograma`, `actas_entrega`, ... | **Chip minimalista** (estética §1 t-136): punto con efecto pulsante e irradiación blur, sin bordes, fuente Light muy reducida (mini); colores `gold-*`/`info`/`warning`/`danger` |
| `RamaReproceso` | Client | `ramas: ReprocesoRama[]` | `reprocesos` (origen, culpable, granularidad) | Bifurcación visual (branch) sobre el nodo del gate; badge de granularidad módulo/componente |
| `ArbolProyecto` | Server + Client | `proyectoId` | `modulos` (árbol `padre_id`), `espacio_variantes` | Explorador izquierdo (master) con drill-down Espacios→Módulos; `--radius-md` |
| `PanelDetalleNodo` | Client | `seleccion: {tipo, id}` | `modulos`, `modulos_artefactos`, `items_variante`, `bom_materiales` | Panel derecho (detail): Ítem / planos de detalle; `11 CollapseStrips`; breadcrumb |
| `PanelInstalacion` | Client | `proyecto, instalaciones, cronogramaEtapas, cronograma` | `proyectos`, `instalaciones`, `cronograma_etapas`, `cronogramas` | "Dirección y datos de instalación": dirección de obra, fechas (línea contractual), fotos, observaciones |
| `GateOverlay` | Client | `proyecto, gate: GateTipo, onCerrar` | — | Capa superpuesta contextual (overlay/modal) con backdrop blur; simula estar dentro del nodo del proyecto |
| `OverlayRetoma` | Client | `proyecto, retoma, artefactos` | `retomas`, `espacios_artefactos` | E-15 (medidas, artefactos determinantes, checkbox "Anomalía detectada" → E-16); auto-save con debounce 2s (patrón P-07) |
| `VeredictoModal` | Client | `gate: {tipo: 'schema'\|'calidad'}, verificadorId, currentUserId` | `verificaciones`, `personas` | Botones "Aprobar schema"/"Rechazar schema" (E-18) y "Registrar veredicto" (E-24); deshabilitados si verificador_id ≠ currentUser.id; detalle obligatorio en rechazo |
| `QuickActionModal` | Client | `accion: 'desfase'\|'novedad'\|'check'\|'citar_calidad'` | `desfases_cronograma`, `novedades_criticas`, `check_produccion`, `citaciones_calidad` | E-33 (causa+composición+motivo), E-34 (SLA 5-24h), E-59 (desenlace derivado), E-23 (citación) |
| `BreadcrumbProyecto` | Client | `proyecto, ruta` | `proyectos` | Navegación contextual persistente (R8): `Proyecto / Espacio / Módulo / Ítem` |

**Patrones M-06 L1 usados:** Suspense (Server + Client split), derivación server-side, auto-save con debounce (OverlayRetoma), SmartSearch (personas en VeredictoModal), deep-links a P-08/P-09/P-18/P-19/P-26/P-27, type-to-confirm (acciones rápidas E-25/E-26).

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar dashboard | `page.tsx` mount | `Promise.all([proyecto, cliente, verificaciones, recepciones, ordenes_compra, desfases, citaciones, reprocesos, modulos, espacio_variantes, eventos])` → derivación server-side R1..R10 | Timeline + árbol + panel instalación renderizados | — |
| 2 | Click en nodo E-18 pendiente | Click en `GateNode` | Abre `GateOverlay` "Veredicto del esquema" (Aprobar/Rechazar) | — | — |
| 3 | Aprobar schema (overlay) | Botón "Aprobar schema" | `POST /api/erp/verificaciones {tipo_gate:'schema', veredicto:'aprobado'}` + `PATCH proyectos {estado:'aprobado_compras'}` en 1 tx (misma API P-08) | `eventos` registra E-18; re-derivación del timeline (R1) | **E-18** |
| 4 | Rechazar schema (overlay) | Botón "Rechazar schema" | `POST verificaciones {tipo_gate:'schema', veredicto:'rechazado', detalle}` → schema `en_reproceso` | Rama de reproceso E-18 visible (R5); `eventos` E-18/E-54 | E-18, E-54 |
| 5 | Click en rama de reproceso | Click en `RamaReproceso` | Panel de reprocesos del gate (origen, culpable, granularidad) + deep-link a P-08/P-17/P-18 | — | E-54 |
| 6 | Click "Retoma de medidas" | Botón en panel de acciones | Abre `OverlayRetoma` (E-15, auto-save 2s); checkbox "Marcar anomalía" → E-16 → crea `cambios_contrato` con `dispara_desfase=true` | `eventos` E-15/E-16; si dispara desfase, nodo E-33 pasa a visible (R9) | E-15, E-16 |
| 7 | Cerrar overlay | Botón cerrar / backdrop | Re-deriva timeline (R1) y árbol | — | — |
| 8 | Click en Espacio (árbol) | Click nodo espacio | Panel de módulos del espacio (`modulos` por `espacio_variante_id`, agrupados por estado §B.18) | — | — |
| 9 | Click en Módulo | Click nodo módulo | Panel de Ítem/planos: `modulos_artefactos` (imagen/plano_armado/modelo_3d), `items_variante`, `bom_materiales` del schema | Deep-links a `/erp/taller` (fila del taller) y P-08 (schema) | — |
| 10 | Click "Dirección y datos de instalación" | Botón en panel inferior | Muestra `direccion_obra`, `instalaciones` (fechas, observaciones, fotos) y fecha prevista de `cronograma_etapas` (línea contractual) | — | — |
| 11 | Acción rápida E-25 "Iniciar" | Botón en nodo E-25 | `PATCH /api/erp/proyectos/:id {estado:'en_instalacion'}` (misma guard P-24 + rango 5 días de P-18) | `eventos` E-25; re-derivación timeline | E-25 |
| 12 | Acción rápida E-25 "Marcar instalada" | Botón en nodo E-25 | `PATCH /api/erp/proyectos/:id {estado:'instalado'}` | `eventos` E-25 | E-25 |
| 13 | Acción rápida E-26 "Generar acta" | Botón en nodo E-26 | `POST /api/erp/actas-entrega` (misma API P-19) | `eventos` E-26 | E-26 |
| 14 | Aplicar desfase (overlay E-33) | Botón "Aplicar desfase" desde nodo transversal | `POST /api/erp/desfases {causa, composicion_causal, motivo}` → recálculo SOLO línea `interna` (P33, I-034) | `eventos` E-33; contractual inmutable | **E-33** |
| 15 | Registrar novedad (overlay E-34) | Botón "[+ Registrar novedad]" | `POST /api/erp/novedades {proyecto_id, descripcion, fase, ventana_sla_horas}` | Corre SLA 5-24h; `eventos` E-34 | E-34 |
| 16 | Confirmar check (overlay E-59) | Botón "Confirmar check" | `POST /api/erp/check-produccion {desenlace_final derivado de MIN(ratios) vs umbrales}` (misma derivación P-11) | `eventos` E-59; alimenta E-60 (adelanto) si todo_bien | E-59 |
| 17 | Ver historial de un gate | Click en nodo completado | Panel de `eventos` del gate (auditoría append-only, actor, fecha) | — | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores en todos los archivos del hub | `npx tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos del hub | `npx eslint app/erp/proyectos/` |
| CA-3 | Los nodos del timeline usan los gates reales de F3: E-18, E-21, E-24, E-33, E-20 + señal E-23 + cierre E-25/E-26, con predicados P18/P21/P20/P33 | `grep -c "P18\|P21\|P20\|P33\|E-23\|E-25\|E-26"` en el módulo de derivación del timeline ≥ 7 |
| CA-4 | Cero emojis hardcodeados en el hub (Javier: "cards estáticas y emojis hardcodeados") | `grep -r "✅\|🔴\|⏳\|⚠️\|📦\|💰\|🔔\|✔️" app/erp/proyectos/` = 0 resultados |
| CA-5 | Todos los labels usan H07; no hay strings sueltos de estado | `grep -r "'[A-Z]" app/erp/proyectos/` = 0 resultados no documentados |
| CA-6 | Derivación del timeline (R1..R10) cubierta por test | `npx tsx __tests__/dashboard/derivar_timeline.test.ts` → PASS |
| CA-7 | Ramas de reproceso derivadas de `reprocesos.origen` (R5) | `npx tsx __tests__/dashboard/ramas_reproceso.test.ts` → PASS |
| CA-8 | Acciones rápidas reusan la misma API de P-07..P-12 (R7), no endpoints propios | `grep -r "fetch\|POST\|PATCH" app/erp/proyectos/[proyectoId]/` apunta a los endpoints compartidos |
| CA-9 | Overlays conservan el breadcrumb del proyecto (R8) | `grep -c "BreadcrumbProyecto"` en el host de overlays ≥ 1; test de render con overlay abierto |
| CA-10 | Pronunciamiento D-16 documentado + cambio de schema señalado como riesgo alto | `grep -c "modulo_id\|padreLinaje\|gate-por-nodo\|Axioma 5" arnes/lineas/ola7/pantallas/disenio_dashboard_proyecto.md` ≥ 4 |
| CA-11 | Navegación modular consume entidades reales del REGISTRO | `grep -c "modulos\|espacio_variantes\|items_variante\|modulos_artefactos\|bom_materiales"` en el módulo de árbol ≥ 5 |
| CA-12 | E-21/E-20 ya no son placeholders: derivan de entidades reales (`recepciones_material.proyecto_id`, `cuentas_financieras`/`obligaciones_pendientes`) | `grep -c "recepciones_material\|registros_gate_caja\|obligaciones_pendientes"` en el módulo de derivación ≥ 3; sin texto "Badges sin datos" en el hub |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md` — 29 entidades citadas con su § exacto; las propuestas nuevas marcadas en §10
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md` — §B.0 (proyecto), §B.7 (schema), §B.8 (veredicto), §B.18 (módulo) verificados
- [ ] Todo label en §3 existe en `glosario_h07.md` — §B.0, §B.8, §B.15, §B.17, §C (verbos) verificados
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien") — R1..R10 con test o grep
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1 — 12 componentes listados con tokens y patrones
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md` — E-15..E-26, E-33, E-34, E-54, E-59 con trace
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables) — CA-1..CA-12 con comandos verificables

---

## 9. Pronunciamiento sobre hallazgo diferido D-16 (gates por nodo)

El hallazgo D-16 de `backlog_auditoria_pantallas.md` (estado: auditado) encontró que **los gates se evalúan por proyecto COMPLETO, no por `modulos.id`**, contradiciendo la premisa central del diseño de módulo/espacio ("evaluar los gates por proyecto completo rompe el despacho parcial") y el propio Axioma 5 del `REGISTRO_DE_ENTIDADES.md` ("Gates por nodo, no por proyecto: cada `modulo.id` tiene su propio ciclo de gates"). Hallazgos derivados: falta `padreLinaje` en `modulos` y no hay agregación recursiva padre↔hijos.

**Decisión de este diseño:**

1. **v1 (sin cambio de schema) evalúa gates por proyecto.** Los predicados de F3 (P18/P20/P33) son por proyecto, y `verificaciones`/`instalaciones` no tienen `modulo_id`. El timeline y las ramas de reproceso de este diseño **ya separan visualmente la granularidad** (una rama de `reprocesos` con `granularidad='modulo'` muestra el nodo al que pertenece), pero el predicado del gate sigue siendo por proyecto.
2. **El salto a gates-por-nodo es un cambio de fuente de datos, no de layout.** El timeline deriva de una función `derivarTimeline(...)` (R1); cuando el schema soporte nodos, la misma función evalúa los predicados por `modulos.id` y agrega recursivamente (padre aprueba ⇔ todos los hijos aprobaron). El layout del timeline y del árbol no cambia.
3. **Riesgo: ALTO para la fase de código si se decide implementar despacho parcial real** — requiere migración de schema (ver §10). Este diseño lo declara como deuda contra el Axioma 5, NO lo esconde ni lo resuelve en el layout.
4. **No bloquea v1** del hub: el dashboard funciona con gates por proyecto y queda estructuralmente listo para el salto.

---

## 10. Entidades/campos propuestos nuevos (no existen hoy en `REGISTRO_DE_ENTIDADES.md`) + riesgo de schema

*Todo lo que no existe hoy está marcado aquí, explícitamente, para que la fase de código lo trate como propuesta pendiente de aprobación — nunca como schema dado.*

| # | Propuesta | Entidad | Campo / tipo | Por qué se propone | Riesgo de schema |
|---|---|---|---|---|---|
| N1 | `reprocesos.estado` | `reprocesos` | enum `{abierto, cerrado}` o `resuelto_en` timestamp nullable | Sin esto la rama de reproceso (R5) no sabe si está abierta o resuelta; hoy solo es inferible para schema vía `schemas_proyecto.estado` (`en_reproceso`→`para_revision`) | MEDIO (tabla existente, columna aditiva) |
| N2 | `reprocesos.modulo_id` | `reprocesos` | FK nullable → `modulos` | Vínculo de la rama al nodo concreto; hoy `granularidad` es texto sin FK | MEDIO (aditiva) |
| N3 | `verificaciones.modulo_id` | `verificaciones` | FK nullable → `modulos` | Requerido para gates-por-nodo (D-16 / Axioma 5) y para que E-24 no pierda el subconjunto de nodos que `citaciones_calidad.modulos_ids` sí guarda | **ALTO** |
| N4 | `instalaciones.modulo_id` | `instalaciones` | FK nullable → `modulos` | Ídem D-16: despacho parcial real | **ALTO** |
| N5 | `modulos.padreLinaje` | `modulos` | texto de linaje (rastreo) | Propuesto en D-16 para rastreo E-54; hoy solo existe `padre_id` | MEDIO (aditiva) |

**Declaración explícita (pedido de la tarea):** resolver bien las bifurcaciones de reproceso a nivel de nodo (rama abierta/cerrada + a qué módulo pertenece) y el despacho parcial real **requiere cambio de schema** (N1..N5). La fase de código que implemente este diseño debe tratar estas 5 propuestas como **riesgo alto de migración** y no asumirlas como existentes. v1 puede implementarse sin N3/N4 (gates por proyecto, §9), pero N1 se necesita para que la rama de reproceso sea fiel a la realidad.

---

## 11. Rutas existentes: cuáles migran al patrón overlay y cuáles conservan página completa

**Patrón overlay (pedido 3 de Javier — Gates Inmersivos):** acción puntual de un gate se abre como capa superpuesta contextual dentro del hub (con `BreadcrumbProyecto` persistente, R8). La ruta standalone **permanece como deep-link/fallback**, no se borra.

| Ruta actual | Pantalla | Decisión | Motivo |
|---|---|---|---|
| `/erp/proyectos/[proyectoId]/retoma` | P-07 Retoma (E-15/E-16) | **Migra a `OverlayRetoma`** | Es exactamente el ejemplo de Javier: gate de acción puntual que hoy desliga al usuario del proyecto |
| `/erp/proyectos/[proyectoId]/desarrollo` (bloque veredicto) | P-08 E-18 | **Migra el veredicto a `VeredictoModal`** | Aprobar/Rechazar schema es acción puntual; la página completa se conserva como visor de schema/BOM (complejidad alta) |
| `/erp/proyectos/[proyectoId]/calidad` (bloque veredicto) | P-17 E-24 | **Migra el veredicto a `VeredictoModal`** | Ídem; citación E-23 como `QuickActionModal` |
| `/erp/proyectos/[proyectoId]/cronograma` | P-09/P-10/P-11 | **Conserva página completa**; acciones puntuales (E-33 desfase, E-34 novedad, E-59 check) se exponen como `QuickActionModal` desde el hub | Complejidad alta (3 pantallas con diseño propio en F3) |
| `/erp/proyectos/[proyectoId]/instalacion` | P-18 E-25 | **Conserva página completa**; "Iniciar"/"Marcar instalada" como acción rápida del nodo E-25 | Máquina con rango de 5 días e historial |
| `/erp/proyectos/[proyectoId]/entrega` | P-19 E-26 | **Conserva página completa**; "Generar acta" como acción rápida | Firma/acta con historial |
| `/erp/proyectos/[proyectoId]/documentos` | P-26 | **Conserva página completa** | Gestión de archivos por etapa (E-41) |
| `/erp/proyectos/[proyectoId]/portafolio` | P-27 | **Conserva página completa** | Publicación manual (T-02) con control editorial |

---

## 12. Próximos pasos (tras aprobación del Supervisor)

1. Checkpoint del Supervisor sobre este diseño (estado actual: **propuesta**).
2. Si se aprueba → fase de código: componente `TimelineGates` + función de derivación server-side (R1..R10), `ArbolProyecto`, `GateOverlay`/`OverlayRetoma`/`VeredictoModal`, migración de `/retoma` a overlay.
3. La decisión D-16 / Axioma 5 (gates por nodo) se agenda como tarea de schema separada (riesgo alto, §10) — **no bloquea v1**.
4. Verificación final según `AGENTS.md`: `npx tsc --noEmit`, `npx eslint .`, tests `npx tsx __tests__/dashboard/*.test.ts`, `npx next build`.

---

¿Apruebas este diseño del Dashboard de Proyecto (P-06 hub + Daily Flow)?
Si sí → pasa a fase de código (t-137). Si ajustes → indícalos y re-itero.
