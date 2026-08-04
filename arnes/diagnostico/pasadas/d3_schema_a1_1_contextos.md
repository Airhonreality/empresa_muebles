# Pase A1-1 — Schema por contexto (subagente, loop de 3 iteraciones)

**Lente:** schema por bounded context. **Sub-agente:** A1-1. **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes:** `diamante2_define_eventos.md` (primaria), `diamante2_discover_eventos.md`, `logica_de_negocio.md`, `cierre_diamante.md`, `log_insights_fase2.md`, `lib/db/schema.ts`, `diamante3_metodologia.md`, `lib/modules/`.

---

## Iteración 1 (bruta)

Barrido completo de los 15 bounded contexts del Define (define:31-49). Propuesta cruda: cada evento E-01..E-61 busca un hogar en una tabla con columnas tipadas, estados alineados a las transiciones del inventario (discover:28-147), y las fronteras de los gates como FK inter-contexto (define:98-114). Salida inicial:

- **Comercial:** `clientes` evolutivo (absorbe `leads`), `conversaciones`, `citas`, `visitas`, `cotizaciones`, `diseños3d` + reuso de `proyectos`, `espacio_variantes`, `items_variante`, `productos_catalogo`.
- **Contratos:** reuso `contratos` + `hitos_pago`; nuevas `firmas_contrato`, `disponibilidad_cliente`, `cambios_contrato`.
- **Control de cronograma:** `cronogramas`, `cronograma_etapas` (doble línea I-034), `estimaciones`, `desfases_cronograma`, `novedades_criticas`, `check_15_dias`, `comunicaciones_progreso`.
- **Desarrollo:** `retomas`, `schemas_proyecto` (versionado), `bom_materiales`, `verificaciones_schema`, `reprocesos`.
- **Compras:** `ordenes_compra`, `items_orden_compra`, `pagos_proveedor`, `recepciones_material`, `herramientas`.
- **Taller:** `modulos_armado` (fila de salida B2) + reuso `ordenes_trabajo` (tipo/origen) y `tareas_produccion` (capa 2).
- **Calidad:** `citaciones_calidad`, `veredictos_calidad`.
- **Entrega:** `instalaciones`, `actas_entrega`.
- **Garantía:** `citas_garantia` + reuso `ordenes_trabajo` tipo='garantia' + `check_completitud`.
- **Finanzas:** reuso `movimientos_financieros`, `obligaciones_pendientes`, `cuentas_financieras`; nuevas `compensaciones`, `comisiones`, `micro_cuentas_cobro`, `arriendos`.
- **Documentación:** `documentos_proyecto`.
- **Integraciones:** `modelos_3d`, `pedidos_corte`.
- **Marketing/Demanda (frontera):** `testimonios`, `conversiones_ads`.
- **Gobierno/Medición:** `eventos_negocio` (stream de auditoría), `registro_horas`.
- **Transversal (infraestructura de roles):** `roles`, `personas`, `personas_roles`, `asignaciones_proyecto`.

Cada evento se mapeó a tabla+columna en una tabla mental de 61 filas; ninguno quedó sin hogar en esta pasada.

---

## Iteración 2 (autocrítica)

Qué sobrevive, qué cae y por qué:

1. **Identidad lead→cliente→proyecto (E-51):** sobrevive la decisión de **tabla única evolutiva** (`clientes` absorbe `leads`), porque el Define declara "el mismo registro que cambia de estado, no duplicado" (define:51) y E-51 es "lead: → cliente (mismo registro, no duplicado)" (discover:48). El diseño alternativo `leads.cliente_id` FK **cae**: reproduce el "contacto duplicado" que P3-01 denuncia (discover:48) y viola C1-01. Riesgo aceptado: es una CORRECCION_SCHEMA estructural contra el schema actual de 2 tablas (schema.ts:77-87 y schema.ts:271-281); se marca para decisión en A2.
2. **`transiciones_embudo`** como tabla propia: **cae**, se fusiona en `eventos_negocio` (stream único que sirve a E-42, E-47, E-33-auditoría, E-60). Evita tablas-gemelas con un solo consumidor.
3. **`cuentas_socios`** con `saldo_actual` almacenado: **cae** (anti-campos muertos), reemplazada por vista derivada sobre `compensaciones` + `micro_cuentas_cobro` — misma lección que P3-12 sobre "dos verdades" del saldo de caja (discover:117).
4. **`metricas_kpi`** almacenada: **cae** — KPIs son derivaciones (define:178), solo se persisten las fuentes (`registro_horas`, `eventos_negocio`, tablas de estado).
5. **`verificaciones_schema` vs `veredictos_calidad`** como tablas separadas: sobreviven separadas por claridad de frontera (E-18 es de Desarrollo, E-24 de Calidad; define:98-114), aunque se anota la opción de unificarlas en `veredictos_gate` con `gateTipo` — se deja a A2.
6. **`score_conversion`**: en la pasada 1 lo marqué RUIDO_SCHEMA por I-005 ("cero lecturas/escrituras", log_insights:20); **corrijo en autocrítica**: I-012 le da propósito documentado (score 1-10 para conversiones offline, log_insights:27). Sobrevive con consumidor en E-03/E-42. No es RUIDO.
7. **`cronograma_etapas` con discriminador de línea** (contractual|interna): sobrevive, porque I-034 exige dos líneas (log_insights:48) y E-14 fija la contractual mientras E-33 recalcula la interna (discover:56-57, 113).
8. **`eventos_negocio`**: sobrevive pero con un **guard explícito** — es stream de observabilidad/auditoría escrito EN PARALELO a las tablas de dominio tipadas, NUNCA almacenamiento primario (el legacy murió por `agnostic_records` interpretado en runtime, schema.ts:3-5). Se marca NORMALIZACION para que A2 no lo convierta en un motor schema-driven genérico.
9. **Lo que se escapó en la pasada 1:** la tabla `items_orden_compra` (el checklist C3 de E-21 compara "tipo + cantidades + sin defectos vs lista de compra esperada", define:76 — exige detalle por ítem) y `asignaciones_proyecto` (materializa "rol asignado por despacho" y el verificador único = comercial vendedor, I-035 log_insights:49; define:59). Ambas se agregan.
10. **Capa 2 vs capa 1:** el detalle interno del taller (`tareas_produccion`, manual ISO) se conserva como DIFERIDO (define:173); la fila de salida `modulos_armado` es capa 1 (B2, define:118, 170). Marketing/Demanda, Tienda web y Gobierno modelan solo sus interfaces de frontera (define:174).

---

## Iteración 3 (refinamiento final)

Modelo depurado: **63 tablas** (17 existentes conservadas + 1 absorbida en `clientes` + 46 nuevas propuestas), organizadas en 15 bounded contexts + 1 sección transversal. Se verificó cobertura **61/61 eventos** con columna explícita por evento (sección "Tabla resumen"). Estados por entidad alineados a las transiciones del inventario y a las decisiones D1-D8 (define:153-162). Se eliminaron las tablas redundantes de la iteración 1 (transiciones_embudo, cuentas_socios, metricas_kpi) y se marcó cada divergencia contra el schema existente como hallazgo con traza. Los VACÍOs reales de negocio que no se inventan (retención del diseñador, alojador R2) quedan como `DECISION_PENDIENTE`.

---

## Entregable: tablas por contexto

### Tablas transversales (infraestructura de identidad y roles — precondición de guards)

Base: modelo rol-vs-persona del Define §3 (define:55-61), precondición de capa 1 (C6-05, define:176); `usuarios.rol_empleado` actual solo tiene 4 roles (schema.ts:27-32) y ya es visible que se queda corto (logica:397).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `roles` | id, nombre (text/enum: comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, verificador), descripcion | — | — | Guards E-18/E-24 (define:59); E-31 compensación por rol |
| `personas` | id, nombre, documento, telefono, activo (boolean) | — | activo | Socios del modelo todos-socios (cierre:17) |
| `personas_roles` | id, personaId (FK→personas), rolId (FK→roles), activo (boolean), desde (timestamp) | personaId→personas; rolId→roles | activo/inactivo | Una persona ocupa varios roles (define:57; logica:438); separación ejecutor-verificador (define:61) |
| `asignaciones_proyecto` | id, proyectoId (FK→proyectos), personaId (FK→personas), rolId (FK→roles), activo (boolean) | proyectoId→proyectos; personaId→personas; rolId→roles | activo | Verificador único designado = comercial vendedor (I-035, log_insights:49; D3, define:153); rol de autorización de gates (P4-F3, discover:66) |
| `usuarios` (existente) | — | usuario.clienteId→clientes (schema.ts:70) | tipo empleado/cliente (schema.ts:34) | Login/identidad del que opera (no modela roles de negocio) |

### Comercial / Cotizador (15 eventos: E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51)

**Propósito:** embudo de demanda (llegada→atención→calificación→visita→diseño 3D→presupuesto→ajustes→cotización), SLA de primera respuesta y la **materialización de la identidad lead→cliente** (define:33).

**Decisión de diseño E-51 (identidad compartida):** **una sola tabla `clientes` que evoluciona y absorbe `leads`.** Justificación: (a) C1-01 declara "una sola identidad evolutiva lead → cliente → proyecto... el mismo registro que cambia de estado" (define:51); (b) E-51 es "lead: → cliente (mismo registro, no duplicado)" (discover:48); (c) P3-01 denuncia que la conversión manual crea contacto duplicado y bloquea E-42 (discover:48) — la alternativa `leads.cliente_id` FK reproduce ese duplicado; (d) el schema existente ya hace de `clientes` el referente de `proyectos`, `usuarios`, `pedidos_web` y `obligaciones_pendientes` (schema.ts:77-87) — fusionar `leads` en `clientes` no rompe ninguna FK y da identidad única desde el origen; (e) Finanzas usa la identidad como referente del dinero sin poseerla (define:51) — `obligaciones_pendientes.clienteId` ya apunta a `clientes`. El eslabón "proyecto" de la cadena es `proyectos.clienteId` (1 cliente → N proyectos) y `contratos.proyectoId`. Impacto: CORRECCION_SCHEMA/NORMALIZACION sobre `leads` (schema.ts:271-281), a confirmar en A2.

| Tabla | Columnas | Relaciones | Estados (enum) | Eventos que materializa |
|---|---|---|---|---|
| `clientes` (evolutivo, absorbe `leads`) | id, nombre, telefonoWhatsapp, email, **canal** (text: web, ig, tiktok, whatsapp), utm_source, utm_medium, utm_campaign, **gclid** (text), **score_conversion** (integer 1-10), **etapa_funnel** (enum), **hora_primer_contacto** (timestamp), **hora_primera_respuesta** (timestamp), **sla_ventana_min** (integer, default 5), **sla_cumplido** (boolean), **escalacion_sla** (jsonb: 'ia_llm' o 'segundo_comercial' + a_quien), **motivo_descarte** (text), **destino_redireccion** (text), **motivo_no_viabilidad** (text), documento, domicilio, origen (text 'manual' o 'autoregistro'), createdAt, updatedAt | 1—N proyectos (proyectos.clienteId); 1—N conversaciones/citas/visitas; 1—N obligaciones_pendientes.clienteId | **etapa_funnel**: `nuevo → en_contacto → calificado → no_viable o descartado o redirigido → cliente` | E-01 (canal+contacto, discover:32), E-02 (en_contacto + hora primera respuesta, discover:33), E-50 (ventana SLA 5min + escalación, discover:34; define:132), E-03 (calificado/descartado/redirigido + score, discover:35), E-04 (motivo+destino, discover:36), E-49 (no_viable + motivo, discover:38; define:134), E-51 (estado cliente, discover:48) |
| `conversaciones` | id, clienteId (FK→clientes), canal (text), mensajes (jsonb), horaPrimeraRespuesta (timestamp), createdAt | clienteId→clientes | — | E-02 (conversación + hora de primera respuesta, discover:33); input de E-50 |
| `citas` | id, clienteId (FK→clientes), franjaInicio (timestamp), franjaFin (timestamp), tipo (text 'visita'), agendadaPor (text: comercial o ia), **reagendaConteo** (integer, max 1), createdAt | clienteId→clientes | `agendada → realizada`; `agendada → no_show`; `agendada → cancelada`; reagendada | E-06 (agenda con franja, discover:39); E-46 (no_show + reagendaConteo, vuelve lead a calificado; 2.º fallo → descartado, discover:41; define:140); E-07 (visita ocurre, discover:40) |
| `visitas` | id, citaId (FK→citas), proyectoId (FK→proyectos), observaciones (text), medidasTomadas (jsonb), fecha (timestamp), tomadaPor (personaId FK→personas) | citaId→citas; proyectoId→proyectos | — | E-07 (registro estructurado de visita; I-010 log_insights:26). Sin relación de superación con E-15 → NORMALIZACION (P3-09, discover:41) |
| `proyectos` (existente) | id, clienteId (FK→clientes), nombreProyecto, direccionObra, **estado** (enum), tipoProyecto (personalizado o producto_fijo), costosOperativos, imprevistosInstalacion, descuentoComercial, ajusteArbitrario, garantiaAnios (default 2), diasEntregaEstimados, aplicaIva, porcentajeIva, descripcionSemantica, createdAt, updatedAt (schema.ts:91-109) | clienteId→clientes; 1—N espacioVariantes; 1—N contratos; productoOrigen→productosCatalogo | estado_proyecto actual (schema.ts:36-45) **NO cubre** borrador/en_revision/cotizado de E-05/E-09/E-11 → CORRECCION_SCHEMA | E-05 (proyecto borrador con poca info, discover:37) |
| `cotizaciones` | id, proyectoId (FK→proyectos), **version** (integer), estado (enum), snapshotProyecto (jsonb), valorTotal (numeric), publicadaAt (timestamp), ajustesCount (integer), createdAt | proyectoId→proyectos; 1—N versiones | `borrador → en_revision → cotizado`; `anulada` | E-05 (presupuesto preliminar = mismo artefacto, logica:458), E-09 (en_revision + snapshot congelado, P3-07 discover:45), E-10 (versión ajustada, discover:46), E-11 (cotizado + cotización formal, discover:47). Consumida por vista pública /propuesta/:proyectoId (discover:45) |
| `diseños3d` | id, proyectoId (FK→proyectos), creadoPor (personaId), precio (numeric, default 130000), **estado** (enum), descuentoAplicadoEn (timestamp), createdAt | proyectoId→proyectos; el movimiento financiero de E-08 lo referencia | `propuesto → pagado → descontado` | E-48 (artefacto producido, discover:42; I-022 precio, log_insights:37), E-08 (hecho de pago registrado en Comercial; el dinero nace en Finanzas, define:120), E-30 (descuento del anticipo, discover:102; H-10 logica:102) |
| `espacio_variantes` (existente) | id, proyectoId, nombreEspacio, nombreVariante, activa, visiblePdf, orden, jornadasDesarrolloTecnico, jornadasEnsamblajeTaller, jornadasInstalacionObra, colores (jsonb) (schema.ts:111-127) | proyectoId→proyectos; 1—N itemsVariante | activa (schema.ts:117) | Base dimensional del cotizador (E-05..E-11); el schema versionado de E-17 la envuelve (ver Desarrollo) |
| `items_variante` (existente) | id, varianteId, catalogoId, nombrePersonalizado, cantidad, precioUnitario, totalLinea, anulado (schema.ts:152-162) | varianteId→espacioVariantes; catalogoId→productosCatalogo | anulado | Ítems de la cotización (E-10/E-11) |
| `productos_catalogo` (existente) | id, sku, descripcion, tipo, unidadMedida, precioDirecto, precioPublico, stockActual, proveedorId, imagenUrl, modelo3dUrl, categoriaComercial, publicadoWeb, proyectoOrigenId (schema.ts:129-150) | proveedorId→proveedores; proyectoOrigenId→proyectos | publicadoWeb | Catálogo del cotizador y de tienda; **mezcla insumos vs producto_terminado** → DECISION_PENDIENTE (logica:159) |

### Marketing / Demanda (3 eventos: E-40, E-42, E-55) — ⚠ DIFERIDO (interfaces de frontera)

**Propósito:** conversión offline→Google Ads, medición de embudo y testimonio curado; palanca de demanda (H1-H8) — la construcción es backlog t-034, se diseñan solo las interfaces (define:34, 174).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `conversiones_ads` | id, clienteId (FK→clientes), proyectoId (FK→proyectos), tipo (text: gclid o enhanced_conversion), gclid (text), emailHash (text), telefonoHash (text), enviado (boolean), enviadoAt (timestamp), createdAt | clienteId→clientes; proyectoId→proyectos | enviado / no enviado | E-40 (señal de conversión; gclid perdido hoy, enhanced conversions con hash, discover:135; I-005 log_insights:20) |
| `testimonios` | id, proyectoId (FK→proyectos), clienteId (FK→clientes), contenido (text), rating (integer), **curado** (boolean), aprobado (boolean), publicado (boolean), createdAt | proyectoId→proyectos; clienteId→clientes | borrador → curado → aprobado → publicado | E-55 (reseña curada post-entrega, discover:92; protocolo I-013 log_insights:28; I-008 la tabla existió en legacy, log_insights:23) |
| `portfolio_publico` / `imagenes_portfolio` (existentes) | schema.ts:283-300 | portfolio.imagenes (schema.ts:294-300) | publicado | Contenido público que consume E-55 (prueba social) |

### Tienda web (1 evento: E-44) — ⚠ construcción DIFERIDO (t-034), se diseña el enganche

**Propósito:** pedido de tienda → enganche al MISMO pipeline de producción; comparte el taller (H-05, discover:147).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `pedidos_web` (existente + delta) | id, clienteId (FK→clientes), itemsSnapshot (jsonb), subtotal, total, direccionEntrega, **estado** (text), **engancheProduccion** (text: null o generado o fallido), **ordenProduccionId** (FK→ordenes_trabajo, nuevo), createdAt (schema.ts:304-313) | clienteId→clientes; ordenProduccionId→ordenes_trabajo | estado pedido (schema.ts:311); enganche null/generado/fallido | E-44 (el pedido dispara orden de producción — hoy no existe el enganche, discover:147; mapa:157,188). Identidad del cliente en tienda resuelta por `clientes` único (P3-11, discover:147) |
| `productos_catalogo` | (ver Comercial) | publicadoWeb (schema.ts:142) | publicadoWeb | Catálogo vendible de la tienda |

### Gobierno / Medición (1 evento: E-47) — ⚠ lectura, no escritura; construcción DIFERIDO

**Propósito:** KPIs operativos (proyecto/semana, ciclo, caja, bienestar). Capa de lectura que consume datos de todos los contextos (define:36, 174).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `eventos_negocio` | id, **entidad** (text), entidadId (uuid), **evento** (text E-XX), estadoDesde (text), estadoHasta (text), actorRol (text), actorPersonaId (FK→personas, nullable), datos (jsonb), proyectoId (FK→proyectos, nullable), createdAt (timestamp) | actorPersonaId→personas; proyectoId→proyectos | — (append-only, stream) | E-42 (medición de embudo por salto, discover:118); E-33 auditoría del desfase (dato auditable, discover:113); E-60 progreso frontstage; E-47 series temporales. **Guard NORMALIZACION:** stream de observabilidad, nunca storage primario (anti-`agnostic_records`, schema.ts:3-5) |
| `registro_horas` | id, personaId (FK→personas), fecha (date), horas (numeric), tipoJornada (text: normal o extra), esSabado (boolean), proyectoId (FK→proyectos, nullable), createdAt | personaId→personas; proyectoId→proyectos | — | E-47 (KPI bienestar: registro automático de horas trabajadas vs ganado, V-5 define:142; discover:119). Hoy no se mide → GAP cubierto |

**KPI (derivados, sin tabla):** ≥1 proyecto/semana (proyectos.created_at, logica:168), ciclo de entrega (cronogramas), salud de caja (movimientos_financieros + obligaciones, logica:170), KPI por subsistema 4/7 semanas/ventas (define:178).

### Contratos (4 eventos: E-12, E-13, E-16, E-53)

**Propósito:** contrato, firma virtual (RED2, precondición capa 1), flow de cambios I-027, cuestionario de viajes (define:37; I-024 log_insights:39).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `contratos` (existente + delta) | id, proyectoId (FK), codigoContrato, fechaContrato, contratanteDomicilio, plazoEjecucionTexto (default '4 a 5'), holguraDias (default 8), garantiaAnios (default 2), objetoItems, especificacionesEstructura/Herrajes/Mesones, condicionesDesmonte, valorTotal, **estado** (enum borrador/firmado), emailAsunto, emailCuerpo (schema.ts:174-194) | proyectoId→proyectos; 1—N hitosPago; 1—N firmas_contrato; 1—N cambios_contrato; 1—N disponibilidad_cliente | `borrador → firmado` (schema.ts:47) | E-12 (contrato borrador + hitos, discover:54); E-13 (firma, ver firmas_contrato) |
| `hitos_pago` (existente) | id, contratoId (FK), orden, tipo (percentage/fixed), montoOPorcentaje, razon, fechaLimite (schema.ts:198-206) | contratoId→contratos; 1—N obligaciones_pendientes (hitoPagoId nuevo) | — | E-12 (hitos de pago, discover:54); **especificación del nacimiento de obligación E-56** (P3-02, discover:98) |
| `firmas_contrato` | id, contratoId (FK→contratos), tipo (text: cliente o empresa), firmanteNombre, documento, metodo (text 'firma_digital'), tokenFirma (text), fechaFirma (timestamp), createdAt | contratoId→contratos | pendiente → firmada | E-13 (registro de firma; subsistema verificado de firma digital, V-6 define:143; RED2 logica:51); mueve contratos.estado a firmado |
| `disponibilidad_cliente` | id, contratoId (FK→contratos), proyectoId (FK→proyectos), tieneViajes (boolean), viajesProgramados (jsonb: fechas), situacionesExternas (text), capturadoEn (timestamp), createdAt | contratoId→contratos; proyectoId→proyectos | — | E-53 (cuestionario de viajes/situaciones, I-024 log_insights:39). **Consumidor en el motor de cronograma** (E-14/E-33) para evitar el campo muerto de I-005 (discover:56) |
| `cambios_contrato` | id, contratoId (FK→contratos), tipo (text: adicional o cambio o reproceso), descripcion, especificacion (jsonb: módulo adicional), impactoMedible (jsonb: afecta compras, insumos homologables), costoCliente (numeric), tiempoPropio (integer jornadas), estado (enum), origen (text: anomalia_retoma o cliente o comercial), createdAt | contratoId→contratos; 1—N (opcional) módulos en Desarrollo | `propuesto → aprobado → aplicado` | E-16 (flow organizado de cambios I-027, discover:64; log_insights:42). **Doble destino:** módulo con tiempo propio → Desarrollo (define:113); costo → Finanzas (define:114). Dispara E-33 causa "cambio de contrato" (define:89) |

### Control de cronograma (6 eventos: E-14, E-33, E-34, E-52, E-59, E-60) ⭐

**Propósito:** contexto central — el pegamento del sistema (define:38). Fija el cronograma (E-14), registra desfases con causa (E-33), gestiona novedades críticas con SLA (E-34), estimación (E-52, disparada en Comercial), check de los 15 días (E-59) y comunicación frontstage (E-60).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `estimaciones` | id, proyectoId (FK→proyectos), valor (numeric), cantidadModulos (integer), duracionEstimadaJornadas (numeric), factorCrecimientoPct (numeric), estado (enum), acordadaEntre (jsonb: roles desarrollo+gerencia), createdAt | proyectoId→proyectos; 1—N cronogramas | `borrador → acordada` | E-52 (estimación f(valor, cantidad de ítems/módulos) + % de crecimiento, discover:44; P8 F-10). Frontera: disparada en Comercial, fijada en Control (define:109). Cronograma acordado por factores de tamaño, base 4 semanas (C1, I-053 log_insights:67; define:178) |
| `cronogramas` | id, proyectoId (FK→proyectos), fechaFijacion (timestamp), estado (enum), baseSemanas (integer, default 4), holguraTotalDias (integer, máx 5), estimacionId (FK→estimaciones, nullable), createdAt | proyectoId→proyectos; estimacionId→estimaciones; 1—N cronograma_etapas | `fijado → recalculado → cerrado` | E-14 (fijación del cronograma con fechas por etapa y holgura ≤5 días, discover:57; cierre:87). Ancla la promesa de 7 semanas (I-024) |
| `cronograma_etapas` | id, cronogramaId (FK→cronogramas), **linea** (text: contractual o interna), **etapa** (enum: aprobacion, compras, ensamblaje, instalacion), fechaInicio (date), fechaFin (date), jornadas (numeric), orden (integer), estado (enum) | cronogramaId→cronogramas; proyectoId (indirecto vía cronogramas) | etapa: `pendiente → en_curso → cumplida` o `desfasada` | E-14 (etapas en orden corregido P5-09: aprobación → compras → ensamblaje → instalación, define:83); **doble línea I-034** (contractual inmutable + interna movible, log_insights:48); E-33 recalcula la línea interna |
| `desfases_cronograma` | id, proyectoId (FK→proyectos), cronogramaEtapaId (FK→cronograma_etapas), **causa** (text: interna o externa o cambio_contrato), motivo (text), **composicionCausal** (jsonb: dependencias lógicas que trazan el origen, D4), decisionManual (boolean), justificacionManual (text), nuevasFechas (jsonb), createdAt | proyectoId→proyectos; cronogramaEtapaId→cronograma_etapas | — (auditable, append) | E-33 (cambio con causa estructurada — tercer origen "cambio de contrato" I-027, define:79; discover:113). Consumido por E-35 (comisiones) |
| `novedades_criticas` | id, proyectoId (FK→proyectos), descripcion (text), fase (text), ventanaSlaHoras (numeric, default 5-24), horaEntrada (timestamp), horaResolucion (timestamp), estado (enum), cumplioSla (boolean), escaladoA (personaId FK→personas, nullable), createdAt | proyectoId→proyectos; escaladoA→personas | `abierta → en_atencion → resuelta` o `escalada` | E-34 (evento con SLA 5-24h, hora de entrada y resolución, discover:115). Consecuencia resuelta: registro + visibilidad gerente + escalación, sin multa (define:135, 159; I-054) |
| `check_15_dias` | id, proyectoId (FK→proyectos), fechaCheck (timestamp), insumosEnTaller (boolean), compradosOPagados (boolean), proyectosEnFila (integer), desenlace (text: todo_bien o novedad o extremo), decision (text: insinuar_instalacion o posponer_interno o negociar_cliente), comisionesReducidas (boolean), createdAt | proyectoId→proyectos; lectura de la fila del taller (modulos_armado) y de compras | — (log, una por proyecto) | E-59 (check de los 15 días con log real de producción y 3 desenlaces, I-025 log_insights:40; discover:112). Alimenta E-25 (adelanto), E-35 (comisiones), E-60 |
| `comunicaciones_progreso` | id, proyectoId (FK→proyectos), tipo (text: progreso o adelanto_instalacion), contenido (text), **visibleAlCliente** (boolean), canal (text: app_cliente o whatsapp), creadoPor (text: sistema o comercial), createdAt | proyectoId→proyectos | — | E-60 (único mecanismo frontstage: unifica P5-01/P5-02/P5-10, define:38; discover:114). Solo muestra progreso y el adelanto positivo (I-043) |

### Desarrollo (4 eventos: E-15, E-17, E-18, E-54)

**Propósito:** retoma de medidas, desarrollo técnico (schema versionable), gate de schema E-18 y reproceso (define:39). El schema de proyecto ES el definidor (mitad simbiótica de la tesis, cierre:24; discover:65).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `retomas` | id, proyectoId (FK→proyectos), fecha (timestamp), realizadaPor (jsonb: roles comercial+desarrollador), medidas (jsonb), notasRetoma (text), electrodomesticos (jsonb), obstaculos (text), **anomaliaDetectada** (boolean), createdAt | proyectoId→proyectos; 1—N (opcional) cambios_contrato (origen 'anomalia_retoma') | realizada (una por proyecto) | E-15 (retoma de medidas post-contrato, discover:63; logica:462). Captura de documentación estructurada (D5: desarrollador define en retoma, log_insights:67; logica:376). Anomalía → dispara E-16 |
| `schemas_proyecto` | id, proyectoId (FK→proyectos), **version** (integer), estado (enum), autorRol (text), schemaDatos (jsonb: piezas, herrajes, colores, escenas), aprobadoPorRol (text, nullable), aprobadoEn (timestamp, nullable), activo (boolean), creadoEn (timestamp) | proyectoId→proyectos; 1—N bom_materiales; 1—N verificaciones_schema; 1—N modelos_3d (Integraciones) | `borrador → en_desarrollo → para_revision → aprobado_compras` o `rechazado → en_reproceso` | E-17 (desarrollo técnico: modelo 3D, BOM, órdenes, lista de compras, discover:65); **versionado exigido por la tesis** (P2-8/P6-07, discover:65); E-18 (transición a aprobado_compras); E-54 (rechazado/en_reproceso) |
| `bom_materiales` | id, schemaId (FK→schemas_proyecto), catalogoId (FK→productos_catalogo, nullable), nombreMaterial (text), cantidad (numeric), unidadMedida (text), origen (text: cotizacion o desarrollo), homologable (boolean), linajeItemId (FK→items_variante, nullable) | schemaId→schemas_proyecto; catalogoId→productos_catalogo; linajeItemId→items_variante | — | E-17 (lista de materiales detallada; **linaje del material cotización→BOM→lista→OC→recepción, P3-05** discover:65). Origen de la lista de compras (E-19) |
| `verificaciones_schema` | id, schemaId (FK→schemas_proyecto), proyectoId (FK→proyectos), **verificadorRol** (text, default 'comercial'), veredicto (text: aprobado o rechazado), motivo (text), fecha (timestamp) | schemaId→schemas_proyecto; proyectoId→proyectos | aprobado / rechazado | E-18 (check de schema pre-compras; veredicto del verificador único = comercial vendedor, D3 define:153; I-035 log_insights:49; discover:66). Guard de apertura de pedidos (define:103) |
| `reprocesos` | id, proyectoId (FK→proyectos), origen (text: schema o calidad o instalacion), modulo (text), componente (text), culpable (text: proveedor o desarrollador o comercial), estado (enum), recalculaCronograma (boolean), createdAt | proyectoId→proyectos; recalculaCronograma=true → crea desfase E-33 | `abierto → en_reproceso → resuelto → cerrado` | E-54 (reproceso por schema/calidad rechazado o instalación fallida, discover:84; P8 F-9). Granularidad módulo/componente; el módulo frena el proyecto entero (C2, define:116). Rastreo de origen: el culpable asume (D2, define:156; log_insights:67) |

### Compras (4 eventos: E-19, E-20, E-21, E-45)

**Propósito:** pedido, pago con gate de caja (D1 bloqueante), recepción triple y reposición de herramientas (E-45, define:40).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `ordenes_compra` | id, proyectoId (FK→proyectos, nullable), schemaId (FK→schemas_proyecto, nullable), proveedorId (FK→proveedores), origen (text: proyecto o operativa), **mecanicaPago** (text: anticipo_saldo o unico o subcontratacion), estado (enum), createdAt | proyectoId→proyectos; schemaId→schemas_proyecto; proveedorId→proveedores; 1—N items_orden_compra; 1—N pagos_proveedor | `borrador → emitida → pagada → recibida_verificada` o `rechazada` | E-19 (pedido de compra, discover:72); **soporta ≥3 mecánicas de pago** (logica:352); E-45 (compra operativa sin proyecto, vista conjunta por proveedor, discover:75); guard E-18 para OC de proyecto (define:103) |
| `items_orden_compra` | id, ordenCompraId (FK→ordenes_compra), catalogoId (FK→productos_catalogo, nullable), nombreItem (text), cantidad (numeric), precioUnitario (numeric), recibidoCantidad (numeric, default 0), sinDefectos (boolean, nullable) | ordenCompraId→ordenes_compra; catalogoId→productos_catalogo | pendiente / recibido / defectuoso | E-19 (lista de ítems); input del checklist C3 de E-21 (tipo + cantidades + sin defectos, define:76; log_insights:67) |
| `pagos_proveedor` | id, ordenCompraId (FK→ordenes_compra), monto (numeric), **prioridad** (text: materiales o arriendos o nominas), comprobanteUrl (text), fecha (timestamp), estado (enum) | ordenCompraId→ordenes_compra; movimiento financiero asociado (movimientos_financieros) | registrado / confirmado | E-20 (pago a proveedor con prioridad materiales→arriendos→nóminas, discover:73; política "no acumular deuda", cierre:22). **Gate de caja bloqueante: no ocurre sin dinero real (E-43)** (D1, define:136, 154) |
| `recepciones_material` | id, ordenCompraId (FK→ordenes_compra), proyectoId (FK→proyectos), checkPedidoBien (boolean), checkDespachoBien (boolean), checkMaterial (boolean), checklist (jsonb: por ítem tipo/cantidad/sin_defectos), estado (enum), fecha (timestamp), verificadoPorRol (text 'desarrollador') | ordenCompraId→ordenes_compra; proyectoId→proyectos | `pendiente → recibido_verificado` o `recibido_defectuoso` | E-21 (triple verificación de recepción; el proyecto pasa a control total del desarrollo-taller, discover:74; logica:286). Rama defectuosa → E-54 con rastreo de origen (D2) |
| `herramientas` | id, nombre, tipo, valor (numeric), fotoUrl (text), estado (enum), proveedorId (FK→proveedores), notas (text) | proveedorId→proveedores | `operativa → mantenimiento` o `dañada` o `necesita_reposicion` | E-45 (reposición de herramienta/consumible; esquema del diseño Taller/Herramientas, logica:581-593). La reposición crea ordenes_compra origen='operativa' ligada al proveedor (discover:75) |

### Taller / Armado (1 evento de frontera: E-22) — detalle interno DIFERIDO (capa 2)

**Propósito:** solo la **fila de salida** del taller (avance por módulo) es capa 1 (decisión B2, define:118, 170) — es input de E-59/E-34. Sin pantallas de carpinteros (define:170, 173).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `ordenes_trabajo` (existente + delta) | id, proyectoId (FK→proyectos), codigoOrden, **estado** (text→enum), fechaEntrega, notas, **tipo** (text: produccion o garantia), **origen** (text: proyecto o pedido_web), **pedidoWebId** (FK→pedidos_web, nuevo), **checkCompletitud** (boolean), **completitudChecklist** (jsonb), fechaCheckCompletitud (timestamp) (schema.ts:210-218) | proyectoId→proyectos; pedidoWebId→pedidos_web | produccion: `pendiente → en_armado → armado → en_instalacion`; garantia: `→ en_garantia` (schema.ts:214 texto libre → CORRECCION_SCHEMA) | E-22 (órdenes de armado por módulo, discover:81); E-37 (orden de garantía reutiliza el patrón con tipo, discover:127; logica:484); E-61 (check de completitud antes de salir, discover:126; P8 F-11); E-44 (enganche pedido→orden) |
| `modulos_armado` | id, proyectoId (FK→proyectos), ordenTrabajoId (FK→ordenes_trabajo), modulo (text), estado (enum), horasEstimadas (numeric, nullable), updatedAt (timestamp) | proyectoId→proyectos; ordenTrabajoId→ordenes_trabajo | `por_armar → en_armado → armado → en_calidad → aprobado → en_instalacion` | E-22 (fila de salida por módulo); **leída por E-59 (check 15 días) y E-34 (novedad crítica)** (B2, define:118) |
| `tareas_produccion` (existente) | schema.ts:220-227 | ordenId→ordenes_trabajo; operarioId→usuarios | texto (schema.ts:224) | **DIFERIDO capa 2** (detalle interno, define:173). Se conserva por compatibilidad, no se diseña |

### Calidad / Verificación (2 eventos: E-23, E-24)

**Propósito:** citación de calidad (push, no la agenda Comercial) y veredicto pre-despacho por el verificador único (define:42; I-035).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `citaciones_calidad` | id, proyectoId (FK→proyectos), modulosIds (jsonb), citadoEn (timestamp), ventanaProgramada (timestamp), estado (enum) | proyectoId→proyectos; módulos referenciados desde modulos_armado | `citada → en_verificacion → verificada` | E-23 (citación empujada desde el subsistema desarrollo-taller; Comercial no agenda, discover:82; define:105) |
| `veredictos_calidad` | id, citacionId (FK→citaciones_calidad), proyectoId (FK→proyectos), **verificadorRol** (text 'comercial'), veredicto (text: aprobado o rechazado), motivo (text), fecha (timestamp) | citacionId→citaciones_calidad; proyectoId→proyectos | aprobado / rechazado | E-24 (veredicto pre-despacho; sin veredicto no hay instalación, discover:83; define:106). Sin conflicto de interés: comisión comercial por ventas (I-043). Rechazo → E-54 |

### Entrega / Instalación (2 eventos: E-25, E-26)

**Propósito:** instalación con rango de 5 días y acta de entrega digital (momento de verdad máximo, define:43; logica:546).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `instalaciones` | id, proyectoId (FK→proyectos), rangoFechaInicio (date), rangoFechaFin (date), fechaReal (date, nullable), instaladorRol (text), estado (enum), adelantadaPor (FK→check_15_dias, nullable) | proyectoId→proyectos; adelantadaPor→check_15_dias | `programada → en_curso → instalada` o `fallida` | E-25 (instalación dentro del rango de 5 días, discover:90; Q7). El desenlace feliz del check de 15 días la adelanta (I-025). Fallida → E-54 |
| `actas_entrega` | id, proyectoId (FK→proyectos), instalacionId (FK→instalaciones), firmadoPor (text: cliente o empresa), fechaFirma (timestamp), **holguraOperativaDias** (integer, default 12), estado (enum), pdfUrl (text) | proyectoId→proyectos; instalacionId→instalaciones | `pendiente → firmada` | E-26 (acta de entrega digital; hoy 100% informal → 100% digital, discover:91; logica:476). Holgura operativa de 12 días visible (logica:480). proyecto → entregado |

### Garantía (3 eventos: E-36, E-37, E-61)

**Propósito:** agenda de garantía (8-12 días hábiles), orden de garantía y check de completitud que evita las 2-3 vueltas del instalador (F-11, define:44; discover:126).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `citas_garantia` | id, proyectoId (FK→proyectos), clienteId (FK→clientes), problemaReportado (text), fechaAgendada (timestamp), ventanaDias (integer: 8-12 hábiles), estado (enum), createdAt | proyectoId→proyectos; clienteId→clientes | `agendada → confirmada → atendida` o `cancelada` | E-36 (garantía se agenda; ventana 8-12 días hábiles contractual, discover:125; Q7) |
| `ordenes_trabajo` (tipo='garantia') | ver Taller; estado en_garantia; **checkCompletitud** + completitudChecklist | — | `en_garantia → atendida → cerrada` | E-37 (orden de garantía que reutiliza el patrón de ordenes_trabajo, discover:127; logica:484); E-61 (check de completitud del instalador antes de salir, discover:126; P8 F-11) |

### Finanzas / Compensación (12 eventos: E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58)

**Propósito:** obligaciones, cobros, deducción del diseño 3D, compensación por rol, comisiones, caja, arriendos, cuenta por socio (define:45). La obligación nace acá (E-56, P3-02); el dinero del cliente cruza Contratos↔Finanzas (define:122).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `obligaciones_pendientes` (existente + delta) | id, descripcion, tipo (text por_cobrar/por_pagar), montoTotal, montoPagado, fechaVencimiento, **estado** (text→enum), clienteId, proveedorId, proyectoId, contratoId, **hitoPagoId** (FK→hitos_pago, nuevo), **fechaNotificacion** (timestamp), **atrasoDias** (integer), **notificadoGerente** (boolean) (schema.ts:254-267) | clienteId→clientes; proveedorId→proveedores; proyectoId→proyectos; contratoId→contratos; hitoPagoId→hitos_pago | `pendiente → parcial → pagado` o `en_atraso` (derivación de montoPagado, lib/modules/finanzas/estado.ts:15) | E-56 (nacimiento automático por hito del contrato firmado, discover:98; P3-02), E-27 (notificación de pago, discover:99), E-28 (pago/cobro → pagado, discover:100), E-29 (atraso + aviso automático al gerente tras 12 días, discover:101; define:133) |
| `movimientos_financieros` (existente + delta) | id, fecha, descripcion, tipo (ingreso/egreso), monto, estado (asentado), cuentaOrigenId, cuentaDestinoId, obligacionId, proyectoId, contratoId, **concepto** (text: diseno_3d, anticipo, hito_cliente, pago_proveedor, arriendo, nomina, comision), **diseno3dId** (FK→diseños3d, nuevo), **prioridad** (text: materiales/arriendos/nominas, para egresos) (schema.ts:239-252) | cuentaOrigenId/cuentaDestinoId→cuentasFinancieras; obligacionId→obligaciones_pendientes; proyectoId→proyectos; contratoId→contratos; diseno3dId→diseños3d | asentado | E-08 (pago del diseño 3D: Comercial registra el hecho, Finanzas crea el dinero, define:120), E-20 (pago a proveedor), E-28 (pago del cliente), E-30 (deducción del diseño 3D del anticipo — el sistema lo hace, no la memoria, discover:102; H-10), E-57 (pago de arriendos, tercer flujo, discover:104) |
| `cuentas_financieras` (existente) | id, nombre, tipo, saldoInicial, saldoActual (schema.ts:231-237) | 1—N movimientos (origen/destino) | — | E-43 (lectura de caja y restricción de dinero, discover:117). **Decisión P3-12:** saldo derivado de movimientos (recalcular, no dos verdades); saldo_actual como conveniencia recalculada (discover:117) |
| `compensaciones` | id, personaId (FK→personas), rolId (FK→roles), proyectoId (FK→proyectos, nullable), tipo (text: diseno_3d, desarrollo, carpinteria, auxiliar, comision), monto (numeric), estado (enum), periodo (text), createdAt | personaId→personas; rolId→roles; proyectoId→proyectos | `calculada → aprobada → pagada` | E-31 (compensación por rol: diseñador $130k+comisión, desarrollador quincena+5%, carpintero 5% por tamaño + módulo instalado, auxiliar horas+comisión, discover:103; cierre:30-35). **Nómina como dato compuesto (E-31 base + E-35 ajuste, P3-04)** |
| `comisiones` | id, proyectoId (FK→proyectos), personaId (FK→personas), rolId (FK→roles), tipoComision (text: dev_5pct, carpintero_5pct, modulo_instalado, comercial_venta), montoBase (numeric), ajuste (numeric), cumplioCronograma (boolean), causa (text: interna/externa/cambio_contrato, nullable), periodo (text), estado (enum) | proyectoId→proyectos; personaId→personas; rolId→roles | calculada / liquidada | E-35 (cálculo según cumplimiento: cumple → recibe; causa interna → reduce; causa externa → se mide contra nuevos plazos, discover:116; cierre:89). Disparado por E-59 (comisiones se reducen) y E-33 (desfases). Comercial NO acoplado a producción (I-043); solo desarrollador 5% (I-043, define:22) |
| `micro_cuentas_cobro` | id, personaId (FK→personas), compensacionId (FK→compensaciones), **permisoFirma** (boolean, previo), numero (text), estado (enum), pdfUrl (text), createdAt | personaId→personas; compensacionId→compensaciones | `generada → firmada → presentada` | E-32 (micro cuenta de cobro autogenerada por registro transaccional con permiso de uso de firma previo, discover:105; logica:383). Doble nacimiento con E-08 resuelto: E-08 crea el dinero, E-32 crea el documento (P3-03) |
| `arriendos` | id, arrendador (text), valorMensual (numeric), periodo (text), estado (enum) | —; los pagos como movimientos_financieros concepto='arriendo' | vigente / finalizado | E-57 (pago de arriendos / flujos operativos, tercer flujo de la política de pagos, discover:104; P2-1) |

**E-58 (lectura de cuenta/saldo por socio):** vista derivada sobre `compensaciones` + `micro_cuentas_cobro` (análoga a E-43 para caja, discover:106; P2-7). Sin tabla almacenada (autocrítica 3). La cuenta del diseñador la lleva el sistema, no la persona (cierre:32; "el sistema debe llevarla", logica:219).

### Documentación (1 evento: E-41)

**Propósito:** foto/documento por etapa con alojador; sin rol de captura catch-all (D5: comercial define todo el proyecto; desarrollador define en retoma, log_insights:67; logica:376).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `documentos_proyecto` | id, proyectoId (FK→proyectos), etapa (text/enum: embudo, cotizacion, contrato, retoma, desarrollo, compras, taller, calidad, entrega, garantia), tipo (text: foto o documento o pdf), archivoUrl (text), **alojador** (text: drive_veta_erp o r2), subidoPorRol (text: comercial o desarrollador), createdAt | proyectoId→proyectos | — | E-41 (registro de documentación por etapa, discover:141). Reproduce la taxonomía de carpetas de VETA_ERP (I-001, log_insights:16). Alojador R2 DIFERIDO (discover:157; logica:372) |

### Integraciones (producción) (2 eventos: E-38, E-39)

**Propósito:** traducción schema→modelo 3D (Veta Designer) y CVC→servicio de corte (Corte Cloud, SivalTriplex preferido). Precedencia: solo con schema aprobado (E-18) (define:47, 88; P5-13).

| Tabla | Columnas | Relaciones | Estados | Eventos que materializa |
|---|---|---|---|---|
| `modelos_3d` | id, schemaId (FK→schemas_proyecto), proyectoId (FK→proyectos), etiquetas (jsonb: piezas melamínicas, herrajes, colores, escenas), estado (enum), herramienta (text: veta_designer o sketchup_opencutlist), createdAt | schemaId→schemas_proyecto; proyectoId→proyectos | `pendiente → generado → enviado` | E-38 (traducción del schema a etiquetas del modelo 3D, discover:133; I-003 log_insights:18). Guard: schema aprobado E-18 (precedencia, no guard duro, define:88) |
| `pedidos_corte` | id, modelo3dId (FK→modelos_3d), archivoCvc (text), proveedorCorte (text: sivaltriplex preferido), estado (enum), createdAt | modelo3dId→modelos_3d | `generado → enviado → confirmado` | E-39 (CVC → servicio de corte; hoy copia/pega manual si no es SivalTriplex, discover:134; I-002 log_insights:17) |

---

## Tabla resumen: cobertura de eventos (61)

| Evento | Tabla(s) | Columna | ✓/GAP |
|---|---|---|---|
| E-01 | clientes | canal, datos de contacto | ✓ |
| E-02 | clientes, conversaciones | etapa_funnel=en_contacto; horaPrimeraRespuesta | ✓ |
| E-03 | clientes | etapa_funnel=calificado/descartado/redirigido; score_conversion | ✓ |
| E-04 | clientes | motivo_descarte, destino_redireccion | ✓ |
| E-05 | proyectos, cotizaciones | proyecto borrador; cotizacion borrador | ✓ |
| E-06 | citas | franjaInicio/fin, tipo visita | ✓ |
| E-07 | citas, visitas | estado=realizada; visitas (medidas/contexto) | ✓ |
| E-08 | diseños3d, movimientos_financieros | estado=pagado; concepto='diseno_3d' | ✓ |
| E-09 | cotizaciones | estado=en_revision; snapshotProyecto | ✓ |
| E-10 | cotizaciones | version +1, ajustesCount | ✓ |
| E-11 | cotizaciones | estado=cotizado | ✓ |
| E-12 | contratos, hitos_pago | estado=borrador; hitos | ✓ |
| E-13 | contratos, firmas_contrato | estado=firmado; registro de firma | ✓ |
| E-14 | cronogramas, cronograma_etapas | línea contractual; etapas corregidas P5-09 | ✓ |
| E-15 | retomas | medidas, notas, anomaliaDetectada | ✓ |
| E-16 | cambios_contrato | tipo adicional/cambio/reproceso; impactoMedible; costoCliente | ✓ |
| E-17 | schemas_proyecto, bom_materiales | versión; BOM con linaje | ✓ |
| E-18 | schemas_proyecto, verificaciones_schema | estado=aprobado_compras; veredicto | ✓ |
| E-19 | ordenes_compra, items_orden_compra | mecánica de pago; ítems | ✓ |
| E-20 | pagos_proveedor, movimientos_financieros | prioridad; gate de caja (E-43) | ✓ |
| E-21 | recepciones_material | checkPedidoBien/checkDespachoBien/checkMaterial; checklist | ✓ |
| E-22 | ordenes_trabajo, modulos_armado | orden por módulo; fila de avance | ✓ |
| E-23 | citaciones_calidad | push de ventana de verificación | ✓ |
| E-24 | veredictos_calidad | veredicto verificador único | ✓ |
| E-25 | instalaciones | rango 5 días; estado instalada/fallida | ✓ |
| E-26 | actas_entrega, proyectos | firma acta; estado=entregado | ✓ |
| E-27 | obligaciones_pendientes | fechaNotificacion | ✓ |
| E-28 | obligaciones_pendientes, movimientos_financieros | estado=pagado; cobro | ✓ |
| E-29 | obligaciones_pendientes | estado=en_atraso; notificadoGerente | ✓ |
| E-30 | diseños3d, movimientos_financieros | estado=descontado; ajuste de anticipo | ✓ |
| E-31 | compensaciones | compensación por rol | ✓ |
| E-32 | micro_cuentas_cobro | cuenta autogenerada con permisoFirma | ✓ |
| E-33 | desfases_cronograma, eventos_negocio | causa + composiciónCausal; auditoría | ✓ |
| E-34 | novedades_criticas | ventanaSlaHoras; horaEntrada/Resolucion; escaladoA | ✓ |
| E-35 | comisiones, compensaciones | ajuste por causa (E-33/E-59) | ✓ |
| E-36 | citas_garantia | ventana 8-12 días | ✓ |
| E-37 | ordenes_trabajo | tipo=garantia; estado=en_garantia | ✓ |
| E-38 | modelos_3d | etiquetas de traducción; guard E-18 | ✓ |
| E-39 | pedidos_corte | archivoCvc; proveedorCorte | ✓ |
| E-40 | conversiones_ads | señal de conversión (hash/gclid) | ✓ (DIFERIDO) |
| E-41 | documentos_proyecto | documento por etapa + alojador | ✓ |
| E-42 | eventos_negocio, clientes | salto del embudo por etapa | ✓ (DIFERIDO) |
| E-43 | cuentas_financieras, movimientos_financieros | caja derivada (P3-12) | ✓ |
| E-44 | pedidos_web, ordenes_trabajo | engancheProduccion; origen=pedido_web | ✓ (DIFERIDO construcción) |
| E-45 | herramientas, ordenes_compra | estado necesita_reposicion; OC operativa | ✓ |
| E-46 | citas, clientes | estado=no_show; reagendaConteo; descartado | ✓ |
| E-47 | registro_horas, eventos_negocio | horas automáticas; KPI derivados | ✓ (DIFERIDO) |
| E-48 | diseños3d | artefacto 3D (precio 130k) | ✓ |
| E-49 | clientes | etapa_funnel=no_viable; motivo_no_viabilidad | ✓ |
| E-50 | clientes, conversaciones | sla_ventana_min=5; sla_cumplido; escalacion_sla | ✓ |
| E-51 | clientes | etapa_funnel=cliente (identidad única) | ✓ |
| E-52 | estimaciones | duración f(valor, módulos); acordada | ✓ |
| E-53 | disponibilidad_cliente | viajes/situaciones; consumido por cronograma | ✓ |
| E-54 | reprocesos | origen/módulo/componente; culpable (D2); recalcula (E-33) | ✓ |
| E-55 | testimonios | curado → aprobado → publicado | ✓ (DIFERIDO) |
| E-56 | obligaciones_pendientes | nacimiento automático por hitoPagoId | ✓ |
| E-57 | arriendos, movimientos_financieros | tercer flujo de pago | ✓ |
| E-58 | vista derivada (compensaciones + micro_cuentas_cobro) | saldo por socio | ✓ |
| E-59 | check_15_dias | log real; 3 desenlaces | ✓ |
| E-60 | comunicaciones_progreso | progreso visible frontstage | ✓ |
| E-61 | ordenes_trabajo | checkCompletitud + completitudChecklist | ✓ |

**Cobertura: 61/61 eventos materializados en tablas/columnas. 0 GAP_SCHEMA en la propuesta** (los GAP existentes se registran como hallazgos contra el schema vigente).

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| H-A1-01 | CORRECCION_SCHEMA | Identidad única evolutiva: `leads` se absorbe en `clientes` (etapa_funnel). La alternativa FK duplica contacto (P3-01). Confirmar migración en A2 | define:51; discover:48; schema.ts:77-87, 271-281 |
| H-A1-02 | GAP_SCHEMA | `leads` sin etapa, sin gclid, sin hora de primera respuesta, sin FK a proyectos — el embudo es inmedible | log_insights:20 (I-005); schema.ts:271-281 |
| H-A1-03 | CORRECCION_SCHEMA | `estado_proyecto` (schema.ts:36-45) no cubre `borrador/en_revision/cotizado` de E-05/E-09/E-11; se propone estado en `cotizaciones` | schema.ts:36-45; discover:37, 45, 47 |
| H-A1-04 | GAP_SCHEMA | Sin modelo de snapshot/versión de cotización (P3-07) ni de publicación pública | discover:45; logica:417 |
| H-A1-05 | GAP_SCHEMA | Sin modelo de agenda/visita (E-06/E-07/E-46): citas, franjas libres, no-show con reagenda con límite | discover:39-41; logica:414 |
| H-A1-06 | GAP_SCHEMA | Sin modelo del diseño 3D (E-48) ni del pago estructurado (E-08) | discover:42-43; logica:460 |
| H-A1-07 | GAP_SCHEMA | Sin estimación de duración (E-52); la función del mapa no tenía disparador | discover:44; logica:254 |
| H-A1-08 | GAP_SCHEMA | Sin mecanismo de firma virtual (E-13); `contratos.estado` borrador/firmado sin paso que lo mueva | logica:478; schema.ts:47 |
| H-A1-09 | GAP_SCHEMA | Sin cuestionario de viajes (E-53) ni consumidor tipado en el motor de cronograma (riesgo campo muerto I-005) | log_insights:39; discover:56 |
| H-A1-10 | GAP_SCHEMA | Sin modelo de cambios de contrato (E-16, flow I-027 con adicional/cambio/reproceso y doble destino) | log_insights:42; discover:64; define:113-114 |
| H-A1-11 | GAP_SCHEMA | Sin cronograma (E-14) ni doble línea contractual/interna (I-034) | log_insights:48; discover:57 |
| H-A1-12 | CORRECCION_SCHEMA | Orden de etapas del cronograma corregido por P5-09: aprobación (E-18) → compras → ensamblaje → instalación | define:83 |
| H-A1-13 | GAP_SCHEMA | Sin check de los 15 días (E-59) con log real de producción y 3 desenlaces | log_insights:40; discover:112 |
| H-A1-14 | GAP_SCHEMA | Sin novedad crítica con SLA (E-34) ni registro de hora entrada/resolución/escalación | discover:115; define:135 |
| H-A1-15 | GAP_SCHEMA | Sin desfase con causa auditable (E-33) ni tercer origen "cambio de contrato" | discover:113; define:79 |
| H-A1-16 | GAP_SCHEMA | Sin comunicación frontstage (E-60), el único mecanismo visible al cliente | discover:114; define:38 |
| H-A1-17 | GAP_SCHEMA | Sin retoma de medidas (E-15); captura duplicada con E-07 sin relación de superación (P3-09) | discover:63; logica:462 |
| H-A1-18 | GAP_SCHEMA | Sin versionado del schema de proyecto (tesis: programado, verificable, versionable, auditable; P2-8/P6-07) | discover:65; cierre:24 |
| H-A1-19 | GAP_SCHEMA | Sin BOM detallada ni linaje del material cotización→BOM→lista→OC→recepción (P3-05) | discover:65 |
| H-A1-20 | GAP_SCHEMA | Sin veredicto del gate E-18 (check de schema) con rol de autorización | discover:66; define:103 |
| H-A1-21 | GAP_SCHEMA | Sin reproceso con rastreo de origen (E-54, D2) ni granularidad módulo/componente (C2) | discover:84; define:116, 156 |
| H-A1-22 | GAP_SCHEMA | Sin orden de compra ni pagos a proveedor (E-19/E-20); 3 mecánicas de pago sin modelo | discover:72-73; logica:352 |
| H-A1-23 | GAP_SCHEMA | Sin recepción triple (E-21) con checklist de la lista de compra esperada (C3) | discover:74; define:76 |
| H-A1-24 | GAP_SCHEMA | Sin reposición de herramientas (E-45) ni tabla `herramientas` | discover:75; logica:581-593 |
| H-A1-25 | GAP_SCHEMA | Fila del taller (avance por módulo) sin tabla; es input bloqueante de E-59/E-34 (B2) | define:118, 170 |
| H-A1-26 | CORRECCION_SCHEMA | `ordenes_trabajo.estado` es texto libre; falta `tipo` producción/garantía y enganche pedido_web | schema.ts:210-218; discover:127 |
| H-A1-27 | GAP_SCHEMA | Sin citación/veredicto de calidad (E-23/E-24) ni separación verificador | discover:82-83; define:106 |
| H-A1-28 | GAP_SCHEMA | Sin instalación con rango de 5 días (E-25) ni acta de entrega digital (E-26) | discover:90-91; logica:476 |
| H-A1-29 | GAP_SCHEMA | Sin garantía (E-36/E-37/E-61): agenda 8-12 días, orden con tipo, check de completitud | discover:125-127; logica:484 |
| H-A1-30 | GAP_SCHEMA | Sin nacimiento de la obligación por hito (E-56, P3-02); `obligaciones_pendientes` sin FK a `hitos_pago` | discover:98; schema.ts:254-267 |
| H-A1-31 | GAP_SCHEMA | Sin compensación por rol, comisiones ni micro cuentas de cobro (E-31/E-35/E-32) | discover:103-105; cierre:30-35 |
| H-A1-32 | GAP_SCHEMA | Sin cuenta/saldo por socio (E-58); hoy el diseñador "no lleva cuenta consigo mismo" | discover:106; logica:219 |
| H-A1-33 | RUIDO_SCHEMA | `saldo_actual` almacenado vs derivado de movimientos (P3-12 "dos verdades"): decidir derivación única en A2 | discover:117; schema.ts:235-236 |
| H-A1-34 | GAP_SCHEMA | Sin documentación por etapa (E-41); la taxonomía de VETA_ERP existe como evidencia | discover:141; log_insights:16 |
| H-A1-35 | GAP_SCHEMA | Sin integraciones de producción (E-38/E-39): traducción a 3D y CVC→corte | discover:133-134; log_insights:17-18 |
| H-A1-36 | GAP_SCHEMA | Sin conversión a Google Ads (E-40) ni testimonios (E-55); la tabla `testimonios` existió en legacy | discover:135, 92; log_insights:23 |
| H-A1-37 | GAP_SCHEMA | Sin enganche pedido_web→producción (E-44); el pedido no dispara nada hoy | discover:147; logica:157 |
| H-A1-38 | GAP_SCHEMA | Sin registro de horas (E-47, KPI bienestar); el registro debe ser automático (V-5) | discover:119; define:142 |
| H-A1-39 | NORMALIZACION | `usuarios.rol_empleado` con 4 roles vs roles tipados del Define §3; se necesita rol-vs-persona (precondición capa 1) | schema.ts:27-32; define:55-61, 176 |
| H-A1-40 | NORMALIZACION | Captura duplicada visita (E-07) vs retoma (E-15) sin relación de superación (P3-09) | discover:41, 63 |
| H-A1-41 | DECISION_PENDIENTE | Valor real del neto del diseñador (retención ± IVA) pendiente de validación con el contador; modelar como parámetro | define:128, 145; log_insights:69 |
| H-A1-42 | DECISION_PENDIENTE | Alojador de documentación: Drive (VETA_ERP) hoy vs Cloudflare R2 (diferido) | discover:141, 157; logica:372 |
| H-A1-43 | DECISION_PENDIENTE | Catálogo: mezcla de insumos y producto_terminado en `productos_catalogo`; distinguir por tipo a nivel de validación | logica:159 |
| H-A1-44 | NORMALIZACION | `eventos_negocio` como stream de observabilidad con guard anti-`agnostic_records`: las tablas de dominio son la fuente de verdad | schema.ts:3-5; cierre:18 |
| H-A1-45 | DIFERIDO | Detalle interno del taller (tareas por módulo, manual ISO, pantallas de carpinteros) → capa 2 | define:173 |
| H-A1-46 | DIFERIDO | Marketing/Demanda, Tienda web y Gobierno/Medición: solo interfaces de frontera; construcción en t-034 | define:174 |
| H-A1-47 | DIFERIDO | `score_conversion` NO es RUIDO: consumidor documentado como score 1-10 de conversiones offline (I-012) | log_insights:27; schema.ts:279 |

---

## Notas para el Orquestador

1. **Decisión estructural de este pase: fusión `leads` → `clientes`** (identidad única evolutiva E-51, H-A1-01). Es la interpretación literal de C1-01/define:51 y de E-51/discover:48. A2 debe confirmarla (impacta migración de datos y las queries existentes en `lib/modules/publico`, `lib/modules/cuenta`, `lib/modules/comercial`). La alternativa FK queda documentada como rechazada por duplicación (P3-01).
2. **`eventos_negocio`** se propone como stream transversal (H-A1-44). A2 decide si se mantiene o si E-42/E-47 se derivan solo de tablas de estado; mi recomendación es mantenerlo con el guard anti-`agnostic_records` porque E-33 (auditabilidad), E-42 (embudo histórico) y E-47 (series) lo necesitan.
3. **E-52 (estimación) vive en Control de cronograma** (conteo del Define, define:49) aunque se dispara en Comercial (define:109). Modelado como `estimaciones` bajo Control; la frontera se respeta.
4. **A2 puede unificar `verificaciones_schema` y `veredictos_calidad`** en `veredictos_gate` (gateTipo e18_schema/e24_calidad). Este pase los dejó separados por claridad de frontera de contextos (define:98-114).
5. **E-58 y los KPIs son derivados, sin tabla** (autocrítica 3). No crear `cuentas_socios` ni `metricas_kpi` almacenadas (lección P3-12).
6. **Patrón de acceso existente respetado:** estados derivados por recálculo transaccional (suma de movimientos antes de derivar estado, `lib/modules/finanzas/estado.ts:5-13`) — las columnas de estado propuestas siguen ese patrón (obligaciones, diseños3d, pedidos_web).
7. **Capa 1 vs capa 2:** todo lo propuesto salvo lo marcado DIFERIDO es capa 1. El Taller modela solo su fila de salida (`modulos_armado`, B2); Marketing/Tienda/Gobierno modelan interfaces de frontera.
8. **Conteo del entregable: 63 tablas** (17 existentes conservadas + 1 absorbida en `clientes` + 46 nuevas propuestas) organizadas en 15 bounded contexts + 1 sección transversal. **Cobertura: 61/61 eventos**, 0 GAP_SCHEMA en la propuesta (los gaps se registran contra el schema vigente).

