# Pase B2-2 — Inventario de pantallas requeridas (subagente, loop de 3 iteraciones)

**Lente:** inventario de pantallas requeridas (roles × gates × eventos × entidades del Define).
**Sub-agente:** B2-2. **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuente primaria:** `diamante2_define_eventos.md` (15 bounded contexts, 61 eventos, gates E-18/E-21/E-23/E-33/E-20, capa 1/2, decisiones D1-D8). Complementos: `diamante2_discover_eventos.md` (estados y disparadores), `logica_de_negocio.md` (mapa maestro), `d3_schema_a1_3_roles.md` (roles), `d3_schema_a1_1_contextos.md` (entidades por contexto), `diamante3_metodologia.md` (reglas del método), más verificación de consistencia contra `lib/erp-nav.ts` y `app/` (rutas existentes).

---

## Iteración 1 (bruta)

Barrido crudo: por cada uno de los 61 eventos, ¿dónde ocurre? Resultado inicial: **41 pantallas propuestas** (30 admin + 11 frontstage), una por entidad/evento, sin agrupar ni filtrar. Se incluyeron pantallas para E-40 (Google Ads), E-42 (embudo), E-47 (KPIs), E-55 (testimonio) como si fueran capa 1, y se propusieron pantallas separadas para cada tabla del pase A1-1 (una pantalla por tabla = sobre-fragmentación). No se verificó contra las rutas existentes del repo (`app/app/erp/`, `app/cuenta/`, `app/(publico)/`).

## Iteración 2 (autocrítica)

Qué cae, qué se fusiona y por qué:

1. **Pantallas de Marketing/Tienda/Gobierno → DIFERIDO.** E-40/E-42/E-47/E-55 y la construcción de tienda son **capa 2 / palanca de demanda (t-034)**, solo se diseñan interfaces de frontera (`diamante2_define_eventos.md:174`). Se eliminan del inventario core: la curaduría de testimonios y el panel de KPIs pasan a `DIFERIDO` (P-32/P-33).
2. **Pantallas de carpinteros / detalle interno del taller → CAEN (capa 2).** "Sin pantallas de carpinteros; solo la fila de estado por módulo" (`diamante2_define_eventos.md:170`). Solo sobrevive la **fila de salida del taller** (`diamante2_define_eventos.md:118`, decisión B2).
3. **Una pantalla por tabla → sobre-fragmentación.** E-52 (estimación) se dispara en Comercial pero se fija en Control de cronograma (`diamante2_define_eventos.md:109`): se fusiona como sección del Cotizador (P-04) y del Cronograma (P-09), no pantalla propia. E-48 (diseño 3D) es una sección del Cotizador, no un módulo aparte (el rol diseñador actúa dentro de P-04). `citaciones_calidad` + `veredictos_calidad` comparten UNA pantalla de Calidad (P-17) — E-23 empuja y E-24 veda en el mismo lugar (`diamante2_discover_eventos.md:82-83`). El detalle `[proyectoId]` es la MISMA pantalla con contexto, no una nueva (patrón de `app/app/erp/cotizador/[proyectoId]` ya existente).
4. **Verificación contra rutas existentes (se escapó en la bruta):** `/app/erp/comercial`, `/app/erp/cotizador`, `/app/erp/contratos`, `/app/erp/taller`, `/app/erp/finanzas`, `/app/erp/calendario`, `/app/erp/equipo`, `/app/erp/pedidos` ya existen (`lib/erp-nav.ts:19-28`; `app/app/erp/`), al igual que `/propuesta/[proyectoId]`, `/agendar`, `/cuenta/proyectos`, `/cuenta/pedido` (`app/(publico)`, `app/cuenta`). El inventario **extiende** esas rutas (se marcan "existe, extiende") y propone **nuevas** donde el Define lo exige (proyectos, desarrollo, cronograma, compras, calidad, instalación, garantía, documentación). No se inventan módulos sobre los ya construidos.
5. **E-08 es una pantalla ambigua, no tres.** La frontera del Define es explícita: "Comercial solo registra el hecho, Finanzas crea el dinero y el documento" (`diamante2_define_eventos.md:120`). Se mantiene una sola pantalla de pago del cliente (F-08, paso de la propuesta) + registro del hecho en P-04 + nacimiento del dinero en P-20, con la frontera documentada (hallazgo H-B2-2-01).
6. **E-38/E-39 (integraciones) NO tienen pantalla propia**: son acciones disparadas desde el desarrollo con precedencia "solo con schema aprobado" (`diamante2_define_eventos.md:88`). Viven como acciones en P-08, no como módulos (hallazgo H-B2-2-06).
7. **E-50 (SLA) es de sistema con visibilidad de UI**: el temporizador y la escalación a LLM son automatización (`diamante2_discover_eventos.md:34`); la UI (P-01/P-02) muestra cumplimiento y escalación (hallazgo H-B2-2-09).
8. **El mapa de gates vive en el detalle de proyecto (P-06)** para que B3-2 cumpla "gates E-18/E-21/E-24/E-33" como **pantalla-sumidero** que deep-linkea a las pantallas operativas donde cada gate se ejecuta (E-18→P-08, E-21→P-14, E-23/E-24→P-17, E-20→P-20/P-13, E-33→P-09). Sin esta pantalla, el gate queda disperso y el auditor B4-1 (determinismo de gates) no tiene ancla.

Resultado: de 41 → **34 pantallas core** (26 admin + 8 frontstage) + 5 de soporte existentes + 2 diferidas. Se conserva la regla "cada evento con al menos una pantalla".

## Iteración 3 (refinamiento final)

Depuración final con tres correcciones:

1. **Frontera admin/frontstage explícita.** El panel admin es `/app/erp/...`; el frontstage es tienda + propuesta + agendar + portal cliente (`app/(publico)`, `app/cuenta`). El cliente NO entra al admin: "nunca toca backstage; solo E-60 frontstage" (`d3_schema_a1_3_roles.md:195`).
2. **`proyectos.verificador_id` como infra de gates.** La designación del verificador único por despacho (`diamante2_define_eventos.md:153`, D3/I-035) se administra en Equipo/proyecto (P-12/P-06), no como rol permanente (`d3_schema_a1_3_roles.md:58`). P-12 (Equipo) se agrupa en B3-2 porque es precondición de los gates E-18/E-24.
3. **Notación de estado por pantalla.** Cada fila del inventario marca: `(existe)` = ya construida hoy, `(extiende)` = existe y se amplía al alcance del Define, `(nuevo)` = no existe, `DIFERIDO` = backlog t-034/capa 2 (se diseña la frontera, no se construye). Esto evita que B3 re-construya lo ya hecho.

---

## Inventario de pantallas (tabla definitiva)

### Panel admin — `/app/erp/...`

| ID | Nombre | Ruta propuesta | Rol(es) | Contexto(s) | Eventos E-XX que cubre | Gates que bloquea/aprueba | Familia B3 |
|---|---|---|---|---|---|---|---|
| **P-01** | Embudo comercial (kanban de leads) | `/app/erp/comercial` (existe, extiende) | comercial, gerente | Comercial/Cotizador | E-01, E-02, E-03, E-04, E-49, E-50, E-51 | — | **B3-1** |
| **P-02** | Ficha de lead/cliente (historial + calificación + SLA) | `/app/erp/comercial/[clienteId]` (nuevo) | comercial, gerente | Comercial/Cotizador | E-02, E-03, E-04, E-07, E-46, E-49, E-50, E-51 | — | **B3-1** |
| **P-03** | Agenda / calendario de visitas (franjas libres) | `/app/erp/calendario` (existe, extiende) | comercial, gerente | Comercial/Cotizador | E-06, E-07, E-46 | — | **B3-1** |
| **P-04** | Cotizador (cotización + diseño 3D + estimación) | `/app/erp/cotizador` + `/app/erp/cotizador/[proyectoId]` (existe, extiende) | comercial, diseñador, gerente | Comercial/Cotizador + Control de cronograma (frontera E-52) | E-05, E-09, E-10, E-11, E-48, E-52 (proyecta), E-08 (registro del hecho) | — | **B3-1** |
| **P-05** | Contratos + firma + cambios + cuestionario de viajes | `/app/erp/contratos` + `/app/erp/contratos/[proyectoId]` (existe, extiende) | comercial, gerente | Contratos | E-12, E-13, E-16, E-53 | — | **B3-1** |
| **P-06** | Proyectos: lista + detalle con **mapa de gates** | `/app/erp/proyectos` + `/app/erp/proyectos/[id]` (nuevo) | comercial, gerente, desarrollador, diseñador | Transversal (Control de cronograma + todos los contextos del proyecto) | E-14 (resumen), E-05/E-51 (estado proyecto), E-59 (badge), E-34 (badge) | **Sumidero de los 5 gates**: E-18, E-21, E-24, E-20, E-33 (estado + deep link a la pantalla operativa) + **E-23 señal** (no gate) | **B3-2** |
| **P-07** | Retoma de medidas | `/app/erp/proyectos/[id]/retoma` (nuevo) | comercial, desarrollador | Desarrollo | E-15, E-41 (captura D5), E-16 (dispara anomalía) | — | **B3-2** |
| **P-08** | Desarrollo técnico / schema (BOM + veredicto E-18 + integraciones E-38/E-39) | `/app/erp/proyectos/[id]/desarrollo` (nuevo) | desarrollador (ejecuta), comercial (veredicto, D3), gerente (ve) | Desarrollo + Integraciones (frontera) | E-17, E-18, E-54, E-38, E-39 | **E-18** aprueba (verificador único = comercial vendedor) → desbloquea apertura de OC (E-19, P-13). Precedencia E-38/E-39 solo con schema aprobado | **B3-2** |
| **P-09** | Cronograma doble (línea contractual + línea interna) | `/app/erp/cronograma` + `/app/erp/proyectos/[id]/cronograma` (nuevo) | gerente, comercial, desarrollador, instalador | Control de cronograma | E-14, E-33, E-52 (acordada), E-59 (desencadena), E-60 (crea comunicación) | **E-33** (recalculo solo con causa estructurada; decisión manual justificada = gerente/comercial) | **B3-2** |
| **P-10** | Novedades críticas (SLA 5-24 h) | `/app/erp/cronograma/novedades` (nuevo) | todos los roles (registran), gerente (ve/escala) | Control de cronograma | E-34 | — | **B3-2** |
| **P-11** | Check de los 15 días (log de producción + 3 desenlaces) | `/app/erp/proyectos/[id]/check-15-dias` (nuevo) | gerente, desarrollador, comercial | Control de cronograma | E-59 | — | **B3-2** |
| **P-12** | Equipo / roles / designación de verificador por despacho | `/app/erp/equipo` (existe, extiende) | gerente (admin) | Transversal (identidad, rol-vs-persona) | E-18/E-24 (asignación `proyectos.verificador_id`) | **Designa el verificador** que aprueba E-18/E-24 | **B3-2** (infra de gates) |
| **P-13** | Compras: órdenes de compra (3 mecánicas) | `/app/erp/compras` + `/app/erp/compras/[ocId]` (nuevo) | gerente (o rol `compras`, H6), desarrollador | Compras | E-19, E-20 (dispara pago), E-45 (OC operativa) | **E-20** (pago bloqueado por gate de caja D1, P-20); guard **E-18** (no OC de proyecto sin schema aprobado) | **B3-3** |
| **P-14** | Recepción de material (triple verificación + checklist C3) | `/app/erp/compras/[ocId]/recepcion` (nuevo) | desarrollador (ejecuta, E-21), gerente (ve) | Compras → Taller (frontera) | E-21, E-54 (rastreo de origen) | **E-21** (checklist por ítem tipo/cantidad/sin defectos) → pasa control total al taller (P-16) | **B3-3** |
| **P-15** | Herramientas / reposición | `/app/erp/compras/herramientas` (nuevo) | gerente, desarrollador | Compras | E-45 | — | **B3-3** |
| **P-16** | Fila del taller (avance por módulo, capa 1 B2) | `/app/erp/taller` + `/app/erp/taller/[ordenId]` (existe, extiende) | desarrollador, gerente, comercial (visibilidad, H8) | Taller (solo fila de salida) | E-22, E-44 (enganche pedido→orden) | input de E-59/E-34 (lee la fila) | **B3-3** |
| **P-17** | Calidad: citación + veredicto pre-despacho | `/app/erp/calidad` (nuevo) | comercial (veredicto D3), desarrollador (empuja citación), gerente (ve) | Calidad/Verificación | E-23, E-24, E-54 (dispara reproceso) | **E-23** (push, no bloquea sola); **E-24** (veredicto del verificador único) → desbloquea instalación (E-25, P-18) | **B3-3** |
| **P-18** | Instalación (rango de 5 días) | `/app/erp/instalaciones` + `[id]` (nuevo) | instalador, gerente, comercial | Entrega/Instalación | E-25, E-54 (fallida en sitio) | guard **E-24** (instalación solo con veredicto positivo) | **B3-3** |
| **P-19** | Acta de entrega digital | `/app/erp/instalaciones/[id]/acta` (nuevo) | instalador, cliente (firma), gerente | Entrega/Instalación | E-26 | — | **B3-3** |
| **P-20** | Caja / movimientos financieros (caja real derivada) | `/app/erp/finanzas` (existe, extiende) | gerente (E-43), contador (lectura), comercial (registro del hecho E-08) | Finanzas | E-43, E-08 (dinero), E-20 (movimiento), E-28 (cobro), E-57 (arriendos) | **E-20** gate de caja: bloqueante (D1), lo resuelve el gerente moviendo cronogramas | **B3-4** |
| **P-21** | Obligaciones y cobros | `/app/erp/finanzas/obligaciones` (nuevo) | gerente, comercial, contador (lectura) | Finanzas | E-56, E-27, E-28, E-29, E-30 | — | **B3-4** |
| **P-22** | Compensación y comisiones (+ cuenta por socio) | `/app/erp/finanzas/compensacion` (nuevo) | gerente, contador, diseñador/desarrollador/carpintero/auxiliar/instalador (ven su saldo E-58) | Finanzas | E-31, E-32, E-35, E-57 (pago nómina), E-58 | — | **B3-4** |
| **P-23** | Dashboard del contador (facturación pendiente) | `/app/erp/finanzas/contador` (nuevo) | contador | Finanzas (lectura) | E-28 (estado cobros), contratos pendientes de facturar | — | **B3-4** (H9) |
| **P-24** | Pedidos web (admin) + enganche a producción | `/app/erp/pedidos` (existe, extiende) | gerente, comercial, desarrollador | Tienda web (frontera) | E-44 | — | **B3-5** |
| **P-25** | Garantía: agenda + orden + check de completitud | `/app/erp/garantia` (nuevo) | comercial, instalador, gerente | Garantía | E-36, E-37, E-61 | — | **B3-5** |
| **P-26** | Documentación del proyecto (fotos/docs por etapa) | `/app/erp/proyectos/[id]/documentacion` (nuevo) | comercial, desarrollador, gerente | Documentación | E-41 | — | **B3-5** |

### Pantallas de soporte ya existentes (se conservan, no las rediseña B3)

| ID | Nombre | Ruta (existe) | Rol(es) | Familia B3 | Nota |
|---|---|---|---|---|---|
| **P-27** | Catálogo de productos | `/app/erp/catalogo` + `[id]` | comercial, gerente | B3-1/B3-5 | Insumos vs producto_terminado → `DECISION_PENDIENTE` (logica:159) |
| **P-28** | Proveedores | `/app/erp/proveedores` | gerente, comercial | B3-3 | Dato de OC (E-19) |
| **P-29** | Portfolio (publicación pública) | `/app/erp/portfolio` | comercial, gerente | B3-5 | Consumidor de E-55 (DIFERIDO) |
| **P-30** | Perfil (cuenta de empleado) | `/app/erp/perfil` | todos los empleados | transversal | — |
| **P-31** | Prefabricados (producto_fijo t-023) | `/app/erp/prefabricados` + `[proyectoId]` | comercial, gerente | B3-1 | Publica a `productos_catalogo` → alimenta tienda |

### Pantallas DIFERIDO (t-034 / capa 2 — se diseña la frontera, no se construye)

| ID | Nombre | Ruta propuesta | Familia B3 | Eventos | Nota |
|---|---|---|---|---|---|
| **P-32** | Panel gerencial / KPIs operativos | `/app/erp/dashboard` | transversal (B3-4 gerencial) | E-47 | Gobierno/Medición → construcción backlog t-034 (define:174) |
| **P-33** | Curaduría de testimonios | `/app/erp/comercial/testimonios` | B3-5 | E-55 | Protocolo de reseñas curadas I-013; capture en F-07 |

### Frontstage (tienda pública + propuesta + portal del cliente)

| ID | Nombre | Ruta propuesta | Rol(es) | Contexto(s) | Eventos E-XX que cubre | Gates | Familia B3 |
|---|---|---|---|---|---|---|---|
| **F-01** | Landing + formulario de contacto/lead | `/` + `/api/leads` (existe) | público | Comercial/Cotizador | E-01 | — | **B3-1** |
| **F-02** | Propuesta pública (snapshot congelado) | `/propuesta/[proyectoId]` (existe, extiende) | cliente (por link) | Comercial/Cotizador | E-09 | — | **B3-1** |
| **F-03** | Agendar cita (autoservicio) | `/agendar` (existe, extiende) | cliente | Comercial/Cotizador | E-06 | — | **B3-1** |
| **F-04** | Tienda: catálogo | `/tienda` (nuevo, DIFERIDO) | público | Tienda web | E-44 | — | **B3-5** |
| **F-05** | Tienda: ficha de producto | `/tienda/[sku]` (nuevo, DIFERIDO) | público | Tienda web | E-44 | — | **B3-5** |
| **F-06** | Tienda: carrito + checkout + pago | `/tienda/checkout` (nuevo, DIFERIDO) | cliente | Tienda web | E-44 | — | **B3-5** |
| **F-07** | Portal del cliente: mis proyectos / seguimiento | `/cuenta/proyectos` + `[id]` (existe, extiende) | cliente | Control de cronograma + Entrega + Garantía + Marketing | E-60, E-26 (firma), E-36 (solicita), E-55 (captura), E-28 (pago online) | — | **B3-5** |
| **F-08** | Pago del diseño 3D (pasarela) | paso de pago dentro de `/propuesta/[proyectoId]` (nuevo, PANTALLA_AMBIGUA → se recomienda embebido en F-02) | cliente | Comercial → Finanzas (frontera E-08) | E-08 | — | **B3-1** |

---

## Agrupación por familia B3

| Familia | Pantallas | Eventos cubiertos | Conteo |
|---|---|---|---|
| **B3-1** Embudo comercial + cotizador | P-01, P-02, P-03, P-04, P-05 + F-01, F-02, F-03, F-08 | E-01..E-13, E-46, E-48, E-49, E-50, E-51, E-52 (proyección), E-53, E-16 | **9** |
| **B3-2** Control de cronograma + gates | P-06, P-07, P-08, P-09, P-10, P-11, P-12 | E-14, E-15, E-17, E-18, E-33, E-34, E-38, E-39, E-54, E-59, E-60 (crea), E-52 (acordada) + infra de gates E-18/E-21/E-24/E-33 | **7** |
| **B3-3** Compras + taller + calidad + entrega | P-13, P-14, P-15, P-16, P-17, P-18, P-19 | E-19, E-20 (dispara), E-21, E-22, E-44 (enganche→orden), E-23, E-24, E-25, E-26, E-45, E-54 (origen operativo) | **7** |
| **B3-4** Finanzas + compensación | P-20, P-21, P-22, P-23 | E-08 (dinero), E-27, E-28, E-29, E-30, E-31, E-32, E-35, E-43, E-56, E-57, E-58 | **4** |
| **B3-5** Cliente/portal + documentación | P-24, P-25, P-26 + F-04, F-05, F-06, F-07 | E-44 (tienda), E-36, E-37, E-41, E-55 (captura), E-60 (visible), E-61 | **7** |
| **Soporte existente (se conserva)** | P-27, P-28, P-29, P-30, P-31 | — | **5** |
| **DIFERIDO** | P-32, P-33, F-04, F-05, F-06 (construcción) | E-40, E-42, E-47, E-55 (curaduría) | **2 admin + 3 frontstage** |

**Totales core: 26 admin + 8 frontstage = 34 pantallas.** Con soporte: 39. Con diferidos: 41.

---

## Matriz roles × pantallas

| Rol | Pantallas que ve/usa | Nota de guard |
|---|---|---|
| **comercial** | P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08 (solo veredicto E-18), P-09, P-10, P-11, P-13, P-16, P-17 (veredicto E-24), P-18, P-20 (solo registro del hecho), P-21, P-24, P-25, P-27, P-28, P-29, P-31 | Rol más cargado (P4-F5). Verificador único de E-18/E-24 (D3, define:75,78,153). Visibilidad de caja/cronograma interno limitada por H8 |
| **gerente** | Todas las P-01..P-31 (admin) + P-32 (DIFERIDO) | Mapea al `admin` actual (`d3_schema_a1_3_roles.md:99`). Decide E-33 manual (define:79), resuelve gate E-20 (define:87), ve E-43/E-47 (define:117,119) |
| **desarrollador** | P-06, P-07, P-08 (ejecuta), P-09, P-10, P-11, P-13, P-14 (ejecuta E-21), P-15, P-16, P-17 (empuja citación E-23), P-24, P-26, P-27 | Ejecutor de E-17/E-21; responsable de rama negativa E-18 (define:75) |
| **diseñador** | P-04 (diseño 3D), P-22 (su saldo E-58) | Solo E-48 (discover:42); cuenta de cobro en Finanzas (define:120) |
| **carpintero** | P-22 (saldo E-58) | Capa 2: sin pantallas de operación (define:170) |
| **auxiliar** | P-22 (saldo E-58) | Capa 2 (define:170) |
| **instalador** | P-10, P-18, P-19, P-25, P-09 (su ventana de instalación) | E-25/E-26/E-37/E-61 (discover:90,91,127,126) |
| **contador** | P-20 (lectura), P-21 (lectura), P-22 (lectura), P-23 | Solo lectura (mapa:390-391); H9: ¿login propio o vista sin sesión? |
| **cliente** | F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08 | Nunca entra al admin; solo E-60 frontstage (d3_schema_a1_3_roles.md:195). Aislamiento por `clienteId` (`lib/modules/cuenta/queries.ts:53-88`) |
| **sistema/IA** | (no tiene pantalla) | Dispara E-50, E-56, E-59, E-60, E-35, E-40, E-42, E-47; se registra como `rol_usado='sistema'` en auditoría (d3_schema_a1_3_roles.md:64,109) |

---

## Cobertura de eventos por pantalla (61/61)

| Evento | Pantalla(s) | Tipo |
|---|---|---|
| E-01 Lead entra | F-01 (captura) + P-01 (visible) | Híbrido (form + auto) |
| E-02 Se atiende WhatsApp | P-01/P-02 (hora de primera respuesta) | Humano (+ Chatwoot externo) |
| E-50 SLA primera respuesta | P-01/P-02 (visor SLA + escalación) + sistema (temporizador/LLM) | **Sistema + visibilidad** |
| E-03 Califica | P-01/P-02 | Humano |
| E-04 Descarta/redirige | P-01/P-02 | Humano |
| E-05 Presupuesto preliminar | P-04 | Humano |
| E-49 Presupuesto NO viable | P-01/P-04 (marca no_viable + motivo) | Humano |
| E-06 Agenda visita | P-03 (comercial) + F-03 (cliente) | Híbrido (humano/IA) |
| E-07 Visita ocurre | P-03/P-02 (registro estructurado) | Humano |
| E-46 No-show | P-03 (reagenda con límite, V-1) | Sistema (detección) + humano (reagenda) |
| E-48 Diseño 3D producido | P-04 (sección diseño 3D) | Humano (diseñador) |
| E-08 Pago diseño 3D | F-08 (cliente) + P-04 (registro hecho) + P-20 (dinero) | Híbrido — frontera define:120 |
| E-52 Estimación | P-04 (proyecta) + P-09 (acordada) | Híbrido (comercial + sistema) |
| E-09 Cliente recibe propuesta | F-02 (vista pública) | Sistema (publicación) |
| E-10 Ajustes del cliente | P-04 (versión ajustada) | Humano |
| E-11 Cotización formal | P-04 | Humano |
| E-51 Lead → cliente | P-01/P-02 | Sistema (derivado de E-11) |
| E-12 Contrato borrador | P-05 | Humano |
| E-13 Contrato se firma | P-05 (envía) + F-07 (cliente firma) | **Subsistema firma digital** (D8) — wizard, no pantalla propia |
| E-53 Cuestionario de viajes | P-05 (al cerrar) | Humano |
| E-16 Cambio de contrato | P-05 (flow I-027) → dispara E-33 en P-09 | Humano |
| E-14 Cronograma fijado | P-09 (derivado del contrato P-05) | Sistema |
| E-15 Retoma de medidas | P-07 | Humano (comercial + desarrollador) |
| E-17 Desarrollo técnico | P-08 (schema versionado + BOM) | Humano (desarrollador) |
| E-18 Check de schema | **P-08** (veredicto del comercial) | **GATE** |
| E-19 Pedido de compra | P-13 | Humano |
| E-20 Pago a proveedor | P-13 (dispara) + **P-20** (gate de caja D1) | **GATE** (sistema+gerente) |
| E-45 Reposición de herramienta | P-15 (+ OC operativa en P-13) | Humano |
| E-21 Recepción triple | **P-14** (checklist C3 del desarrollador) | **GATE** |
| E-22 Armado en taller (fila) | P-16 (fila de salida por módulo, B2) | Humano (desarrollador) — detalle interno capa 2 |
| E-23 Citación de calidad | **P-17** (push del desarrollador) | **GATE** (señal, no bloquea) |
| E-24 Veredicto pre-despacho | **P-17** (veredicto del comercial) | **GATE** |
| E-54 Reproceso | P-08 (schema), P-14 (origen compra), P-17 (calidad), P-18 (instalación) — recalcula en P-09 | Humano + sistema |
| E-25 Instalación | P-18 | Humano (instalador) |
| E-26 Acta de entrega | P-19 (firma) + F-07 (cliente firma) | Híbrido |
| E-55 Testimonio/reseña | F-07 (captura) + P-33 (curaduría, DIFERIDO) | Humano — curaduría DIFERIDO |
| E-56 Nacimiento de obligación | P-21 (automático por hito) | **Sistema** |
| E-27 Notificación de pago | P-21 (envía) + F-07 (cliente ve) | **Sistema** |
| E-28 Pago del cliente | P-21/P-20 (registro) + F-07 (online) | Híbrido |
| E-29 Cobro con atraso | P-21 (+ aviso automático al gerente, define:133) | Híbrido |
| E-30 Deducción diseño 3D | P-21/P-20 (automático) | **Sistema** |
| E-31 Compensación por rol | P-22 | **Sistema** (regla) + humano (aprueba/paga) |
| E-57 Arriendos | P-20/P-22 | Híbrido |
| E-32 Micro cuenta de cobro | P-22 (autogenerada) | **Sistema** |
| E-58 Cuenta/saldo por socio | P-22 (vista derivada) | **Sistema** (lectura) |
| E-33 Cambio de cronograma con causa | **P-09** (composición causal + decisión manual) | **GATE** |
| E-34 Novedad crítica | P-10 (SLA 5-24h + escalación) | Híbrido |
| E-60 Comunicación frontstage | P-09 (crea, sistema/comercial) + **F-07** (cliente ve) | Híbrido |
| E-35 Cálculo de comisiones | P-22 (cierre de período) | **Sistema** |
| E-59 Check de los 15 días | P-11 (+ badge P-06) | Humano (3 desenlaces) |
| E-43 Lectura de caja | P-20 (gerente) | **Sistema** (lectura) |
| E-36 Garantía se agenda | P-25 (+ F-07 cliente solicita) | Humano |
| E-37 Orden de garantía | P-25 | Humano |
| E-61 Check de completitud | P-25 | Humano (instalador) |
| E-38 Traducción schema→3D | P-08 (acción de integración, precedencia E-18) | **Sistema** (integración, sin pantalla propia) |
| E-39 CVC→corte | P-08 (acción de integración, precedencia E-18) | **Sistema** (integración, sin pantalla propia) |
| E-40 Conversión Google Ads | — (integración, DIFERIDO t-034) | **Sistema** — sin pantalla |
| E-41 Foto/documento por etapa | P-26 (+ P-07 en retoma, D5) | Humano |
| E-42 Medición de embudo | P-01/P-32 (agregado, DIFERIDO t-034) | **Sistema** — lectura |
| E-44 Pedido de tienda → producción | F-04/F-05/F-06 (tienda, DIFERIDO) + P-24 (admin) + P-16 (enganche→orden) | Híbrido — construcción tienda DIFERIDO |
| E-47 KPIs operativos | P-32 (DIFERIDO t-034) | **Sistema** — lectura |

**Resultado: 61/61 eventos con al menos una pantalla o anotación de "sistema/integración sin pantalla propia". 0 `PANTALLA_FALTA` estructural.**

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| H-B2-2-01 | `PANTALLA_AMBIGUA` | E-08 toca 3 pantallas (F-08 cliente, P-04 registro del hecho, P-20 dinero). La frontera lo resuelve ("Comercial solo registra el hecho, Finanzas crea el dinero y el documento") — B3 debe respetarla en el mapeo de datos sin duplicar el movimiento | `diamante2_define_eventos.md:120`; `diamante2_discover_eventos.md:43` |
| H-B2-2-02 | `DECISION_PENDIENTE` | P-13 Compras: ¿la opera el gerente o un rol `compras` propio? E-19/E-20 disparan "compras", pero caja la maneja el gerente (H6 del pase A1-3) — sin resolver, la matriz de permisos de B4-2 queda ambigua para OC y pago | `d3_schema_a1_3_roles.md:107,246`; `diamante2_discover_eventos.md:72-73`; `logica_de_negocio.md:358` |
| H-B2-2-03 | `DECISION_PENDIENTE` | Transparencia por rol (P6-01/H8): qué ve cada rol de caja/cronograma interno/compras. Afecta el acceso a P-09, P-16, P-20 y a la visibilidad del comercial | `diamante2_discover_eventos.md:117`; `logica_de_negocio.md:360` |
| H-B2-2-04 | `DECISION_PENDIENTE` | P-23 dashboard del contador: ¿login propio o vista sin sesión? (H9 del pase A1-3) | `logica_de_negocio.md:390-391`; `d3_schema_a1_3_roles.md:249` |
| H-B2-2-05 | `DECISION_PENDIENTE` | F-06 checkout de tienda: ¿se admiten pedidos anónimos? (H12 del pase A1-3) | `diamante2_discover_eventos.md:147`; `d3_schema_a1_3_roles.md:252` |
| H-B2-2-06 | `PANTALLA_AMBIGUA` | E-38/E-39 (integraciones) sin pantalla propia: acciones dentro de P-08 con precedencia "solo con schema aprobado" — B3-2 las especifica como acciones con estado, no como módulos | `diamante2_define_eventos.md:88`; `diamante2_discover_eventos.md:133-134` |
| H-B2-2-07 | `DIFERIDO` | E-40 (Ads), E-42 (embudo), E-47 (KPIs), E-55 (curaduría), construcción de tienda (F-04/F-05/F-06) y detalle interno del taller → t-034 / capa 2; solo interfaces de frontera (P-32/P-33) | `diamante2_define_eventos.md:174,173`; `diamante2_discover_eventos.md:157` |
| H-B2-2-08 | `PANTALLA_AMBIGUA` | E-50 SLA: temporizador y escalación a LLM son de sistema; la visibilidad del incumplimiento y la escalación al segundo comercial deben vivir en P-01/P-02 | `diamante2_discover_eventos.md:34`; `diamante2_define_eventos.md:132` |
| H-B2-2-09 | `PANTALLA_AMBIGUA` | E-13 firma: subsistema verificado de firma digital (D8) no es pantalla propia sino wizard/modal dentro de P-05 (admin envía) y F-07 (cliente firma) | `diamante2_define_eventos.md:143`; `diamante2_discover_eventos.md:55` |
| H-B2-2-10 | `DECISION_PENDIENTE` | E-06 agendamiento híbrido IA vs humano (tensión "muy app" del mapa punto 2): F-03 y P-03 coexisten sin decisión de balance | `logica_de_negocio.md:132` |
| H-B2-2-11 | `PANTALLA_AMBIGUA` | E-60: se crea en P-09 (sistema/comercial) y se muestra en F-07 — es el ÚNICO canal visible al cliente (I-043); B3 no debe crear un módulo de mensajería propio, es un registro por proyecto | `diamante2_discover_eventos.md:114`; `diamante2_define_eventos.md:38` |
| H-B2-2-12 | `DECISION_PENDIENTE` | P-26 documentación: alojador Drive (VETA_ERP) vs R2 (H-A1-42 del pase A1-1) — afecta el campo de archivo de E-41 | `d3_schema_a1_1_contextos.md:355`; `logica_de_negocio.md:372` |
| H-B2-2-13 | `PANTALLA_FALTA` | Ninguno estructural: 61/61 eventos tienen pantalla o anotación de sistema/integración. Nota: E-56/E-57/E-30/E-31/E-32/E-35 son automáticos y viven en P-21/P-20/P-22 sin acción manual | ver tabla de cobertura |

---

## Notas para el Orquestador

- **Este inventario ES el contrato de B3 (Ola 4).** B3-1→B3-5 deben especificar sus pantallas con el contrato de formato de `diamante3_metodologia.md:110-123`. Las 34 pantallas core (26 admin + 8 frontstage) son la unidad de conteo; las 5 de soporte (P-27..P-31) ya existen y solo se conservan/extienden; las diferidas (P-32/P-33 y construcción de tienda) se diseñan como frontera, no se construyen.
- **Rutas nuevas a crear** (no existen hoy en `app/`): P-02, P-06, P-07, P-08, P-09, P-10, P-11, P-13, P-14, P-15, P-17, P-18, P-19, P-21, P-22, P-23, P-25, P-26, F-04, F-05, F-06, F-08. Rutas que se **extienden** (existen): P-01, P-03, P-04, P-05, P-12, P-16, P-20, P-24, F-01, F-02, F-03, F-07. B4-2 (roles×gates) debe validar los permisos; B4-3 (implementabilidad) debe validar el desglose de P-06 (mapa de gates) y P-08 (integraciones).
- **Decisiones que requieren Supervisor (bloqueadas para B3/B4, registrar en ledger como `esperando_humano`):** H-B2-2-02 (rol compras), H-B2-2-03 (transparencia por rol), H-B2-2-04 (contador), H-B2-2-05 (pedidos anónimos), H-B2-2-10 (agendamiento híbrido), H-B2-2-12 (alojador de docs).
- **Precondición de capa 1 que toca UI:** rol-vs-persona (P-12) y la pasarela de pago (F-08) son precondiciones ("van junto a los gates", `diamante2_define_eventos.md:176`) — B3 no debe diseñar P-01/P-05 sin asumir la designación del verificador y el pago estructurado de E-08.
- **Consistencia con el pase A1-3:** los roles del inventario son los 8 tipados del Define (comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, contador) + cliente externo; "verificador" y "compras" no son roles permanentes (designación/`DECISION_PENDIENTE`), "sistema" es actor técnico (`d3_schema_a1_3_roles.md:98-110`).
