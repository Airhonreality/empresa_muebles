# Schema relacional consolidado del Diamante 3 (entregable final de Fase A)

**Rol:** Orquestador (consolida, met:15). **Salida de la Ola 3** (met:132): A3 (auditor final) + este consolidado.
**Objeto:** esquema objetivo de 65 tablas resultante de A1 (divergencia) → A2 (convergencia) → A3 (auditoría final APROBADA), listo para que B3 (Ola 4) diseñe pantallas sobre él y para la migración en 4 fases.
**Fuentes consolidadas:** `d3_schema_a2_1_normalizacion.md` (schema definitivo, 65 tablas) · `d3_schema_a2_2_determinismo.md` (5 gates re-verificados) · `d3_schema_a2_3_trazabilidad.md` (61/61 huella) · `d3_schema_a2_4_contrato_vivo.md` (CC-01..CC-10, plan de migración 4 fases) · `d3_schema_a2_5_parametros.md` (26+6 claves) · `d3_schema_a3_auditor.md` (veredicto APROBADO + 5 correcciones documentales A3-C1..C5) · `diamante2_define_eventos.md` (15 bounded contexts, 61 eventos) · `lib/db/schema.ts` (18 tablas vivas).
**Verificación mecánica:** `git status --porcelain` confirma que ningún pase del Diamante 3 tocó `lib/db/schema.ts` ni `lib/modules/*`. Este entregable es esquema objetivo (documento), no código.

---

## Veredicto de la auditoría A3 (vinculante)

**APROBADO** contra los goals duros de `diamante3_metodologia.md:147`:

| Goal duro | Resultado A3 |
|---|---|
| 61/61 huella evento→tabla→columna | **61 filas, 0 GAP** (los 8 GAP de A2-3 y 3 de A2-2 cerrados por CF-01 y E-27) |
| 5 gates deterministas (E-18/E-21/E-24/E-33/E-20) | **5/5 `DETERMINISMO_OK`**, 0 `DETERMINISMO_ROTO` (recalculados por A3 contra el consolidado real) |
| 0 campos muertos | **0 estructurales**; 10 RUIDO colapsados verificados; 2 sospechosos de bajo nivel → correcciones A3-C3/C4 |
| 0 contradicción contrato vivo | **CC-01..CC-10 resueltas** contra el consolidado real; 10 tablas CONSERVAR intactas |
| Capa 1/2 | **Separación correcta**; sin contaminación del core |
| DECISION_PENDIENTE | 9 acumuladas, **ninguna estructural** |

**Correcciones documentales que este consolidado incorpora (A3-C1..C5):** ver §Correcciones A3 aplicadas.

---

## Schema definitivo (65 tablas)

**Conteo:** 65 tablas = 18 existentes (11 conservadas + 7 ampliadas aditivamente) + 47 nuevas. Organización: sección transversal + 15 bounded contexts del Define + secciones de integraciones/marketing/gobierno (frontera DIFERIDO). Convención: `[nueva]` · `[ampliada]` · `[conservada]`. Columnas snake_case. Fuente completa por tabla: `d3_schema_a2_1_normalizacion.md:97-241` (a2_1 de aquí en adelante).

### 0. Transversal (identidad, roles, auditoría, parámetros) — precondición de capa 1 (define:55-61,176)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `roles` | [nueva] | Guards E-18/E-24; E-31 | 8 roles tipados del Define + `contador`; sin `verificador` (designación) ni `compras` (DP-02) (a2_1:105) |
| `personas` | [nueva] | Identidad de negocio | Destino de todos los FKs de dinero/roles (CF-19) (a2_1:106) |
| `personas_roles` | [nueva] | Una persona varios roles | N:N; reemplaza rol único (N-02, CC-05) (a2_1:107) |
| `asignaciones_proyecto` | [nueva] | Rol por despacho; base designación verificador | Convive con `proyectos.verificador_id` (CF-20; A3 conservó con consumidor) (a2_1:108) |
| `usuarios` | [conservada] + `personaId` | Login/identidad | Puente login↔negocio (CC-08); `rolEmpleado` se depreca en Fase 4 (a2_1:109) |
| `verificaciones` | [nueva] | **E-18/E-24** (veredicto del verificador único, D3) | `tipo_gate ∈ {schema, calidad}` (CF-02, N-04) (a2_1:110) |
| `excepciones_gate` | [nueva] | "Guía + registrador de la realidad" (D1) | E-20 **sin** bypass (ENF-21) (a2_1:111) |
| `eventos` | [nueva] | Auditoría append-only (56 logueados + 4 derivados + 1 diferido) | enum 61, payload de gates, ocurrenciaId (CF-10, R-04) (a2_1:112) |
| `procedencia` | [nueva] | Lineage "al nacer el dato" (D3) | cadena lead→cliente→proyecto y BOM→OC→recepción (a2_1:113) |
| `parametros` | [nueva] | SLA E-50, novedad E-34, 12 días E-29, comisiones E-31/E-35, bruto diseño E-08 | clave única + `grupo` + CHECK exclusión (CF-09, P-03); 26 claves core + 6 marca (a2_5:74-113) (a2_1:114) |
| `parametros_historial` | [nueva] | Versionado/auditoría de parámetros | append-only (P-04/P-10) (a2_1:115) |

### 1. Comercial / Cotizador (15 eventos: E-01..E-07, E-09..E-11, E-46, E-48, E-49, E-50, E-51)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `leads` | [ampliada] | E-01..E-04, E-46, E-49, E-50, E-51 | +`estado` embudo, `canal`, `gclid`, `hora_primer_contacto`, `hora_primera_respuesta`, `sla_*`, `escalacion_sla`, `reagenda_count`, `motivo_no_viable`, `cliente_id` FK (CF-01). **+`destino_redireccion` (A3-C2)** (a2_1:121) |
| `clientes` | [ampliada] | Referente de identidad (E-51) | +`etapa_funnel` → **consumidor fijado: lectura de E-51 al materializar lead→cliente (A3-C3)** (a2_1:122) |
| `conversaciones` | [nueva] | E-02 (hora de primera respuesta) | (a2_1:123) |
| `citas` | [nueva] | E-06, E-07, E-46 | `reagendaConteo` máx 1 (V-1) (a2_1:124) |
| `visitas` | [nueva] | E-07 (registro estructurado) | (a2_1:125) |
| `proyectos` | [ampliada] | E-05; máquina de estados E-09..E-51 | +`verificador_id`, +`fecha_entrada_desarrollo` (DET-02), +`comercial_vendedor_id`; enum estado extendido 1:1 con los 8 legacy + nuevos (A2-1-14) (a2_1:126) |
| `cotizaciones` | [nueva] | E-05/E-09/E-10/E-11 | snapshot congelado (P3-07) (a2_1:127) |
| `diseños3d` | [nueva] | E-48, E-08, E-30 | `precio` default **sembrado desde `parametros.bruto_diseno_3d`, no hardcode (A3-C5)** (a2_1:128) |
| `espacio_variantes` | [conservada] | E-05..E-11 | (a2_1:129) |
| `items_variante` | [conservada] | E-10/E-11 | (a2_1:130) |
| `productos_catalogo` | [conservada] | Catálogo | mezcla insumos/producto = DP-05 (a2_1:131) |

### 2. Contratos (4 eventos: E-12, E-13, E-16, E-53)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `contratos` | [conservada] | E-12 | `valor_total` NO se toca (CC-10) (a2_1:137) |
| `hitos_pago` | [conservada] | E-12; especifica E-56 | (a2_1:138) |
| `firmas_contrato` | [nueva] | E-13 | subsistema de firma digital DIFERIDO (a2_1:139) |
| `disponibilidad_cliente` | [nueva] | E-53 (cuestionario de viajes) | consumidor en cronograma (a2_1:140) |
| `cambios_contrato` | [nueva] | E-16 | flow I-027; dispara E-33 (a2_1:141) |

### 3. Control de cronograma (6 eventos: E-14, E-33, E-34, E-52, E-59, E-60)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `estimaciones` | [nueva] | E-52 | disparada en Comercial, fijada en Control (a2_1:147) |
| `cronogramas` | [nueva] | E-14 | promesa 7 semanas; base 4 semanas; holgura máx 5 (a2_1:148) |
| `cronograma_etapas` | [nueva] | E-14; E-33 recalcula `interna` | `linea ∈ {contractual, interna}` (CF-04, N-05); etapas P5-09 (a2_1:149) |
| `desfases_cronograma` | [nueva] | **E-33** | `causa ∈ {interna, externa, cambio_contrato}` + `composicion_causal` jsonb + **`aplicado` boolean (DET-03)** + `decision_manual`/`justificacion_manual` (a2_1:150) |
| `novedades_criticas` | [nueva] | E-34 | SLA 5-24h, sin multa (a2_1:151) |
| `check_15_dias` | [nueva] | E-59 | log real, 3 desenlaces (a2_1:152) |
| `comunicaciones_progreso` | [nueva] | E-60 | único frontstage (a2_1:153) |

### 4. Desarrollo (4 eventos: E-15, E-17, E-18, E-54)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `retomas` | [nueva] | E-15 | anomalía → E-16 (a2_1:159) |
| `schemas_proyecto` | [nueva] | E-17; E-18; E-54 | versionado; activo (a2_1:160) |
| `bom_materiales` | [nueva] | E-17 | linaje → items_variante (P3-05); origen de lista de compras (a2_1:161) |
| `verificaciones` | [nueva] | **E-18** (gate) | ver sección transversal (a2_1:162) |
| `reprocesos` | [nueva] | E-54 | origen {schema/calidad/instalacion}, módulo/componente, culpable (D2/C2) (a2_1:163) |

### 5. Compras (4 eventos: E-19, E-20, E-21, E-45)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `ordenes_compra` | [nueva] | E-19; **E-20** (gate de caja); E-45 | 3 mecánicas; `origen ∈ {proyecto, operativa}`; **estado 7 valores unificado** (CF-13, N-08); `monto_total`/`anticipo_monto` = fuente del monto a pagar (CF-16) (a2_1:169) |
| `items_orden_compra` | [nueva] | E-19; **checklist C3 de E-21** | +`recibido_cantidad`, +`sin_defectos` (DET-09/10, CF-03) (a2_1:170) |
| `recepciones_material` | [nueva] | **E-21** | checks + estado; verificadoPorRol `desarrollador` (a2_1:171) |
| `herramientas` | [nueva] | E-45 | reposición → OC origen='operativa' (a2_1:172) |

### 6. Taller / Armado (1 evento de frontera: E-22) — detalle interno DIFERIDO (capa 2)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `ordenes_trabajo` | [ampliada] | E-22; E-37; E-61; E-44 (enganche) | +`tipo`, +`origen`, +`pedidoWebId`, +`checkCompletitud`, +`completitudChecklist`, +`fechaCheckCompletitud`; estado text→enum aditivo (CC-03) (a2_1:178) |
| `modulos_armado` | [nueva] | E-22 (fila de salida; input E-59/E-34) | B2 (a2_1:179) |
| `tareas_produccion` | [conservada] | DIFERIDO capa 2 | estado NO se tipa (S-03) (a2_1:180) |

### 7. Calidad / Verificación (2 eventos: E-23, E-24)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `citaciones_calidad` | [nueva] | E-23 (push, señal) | estado enum `citada/en_verificacion/verificada` (CF-14) (a2_1:186) |
| `verificaciones` | [nueva] | **E-24** | ver transversal; `tipo_gate='calidad'` (a2_1:187) |

### 8. Entrega / Instalación (2 eventos: E-25, E-26)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `instalaciones` | [nueva] | E-25 | rango 5 días; fallida → E-54; `adelantadaPor → check_15_dias` (a2_1:193) |
| `actas_entrega` | [nueva] | E-26 | firma digital; holgura operativa 12 días (a2_1:194) |

### 9. Garantía (3 eventos: E-36, E-37, E-61)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `citas_garantia` | [nueva] | E-36 | ventana 8-12 días hábiles (a2_1:200) |
| `ordenes_trabajo` (tipo='garantia') | [ampliada] | E-37; E-61 | ver Taller (a2_1:201) |

### 10. Finanzas / Compensación (12 eventos: E-08, E-27..E-32, E-35, E-43, E-56, E-57, E-58)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `cuentas_financieras` | [conservada] | E-43 (caja derivada) | `saldo_actual` conservado como materializado reconciliado (S-02, CF-17) (a2_1:207) |
| `movimientos_financieros` | [ampliada] | E-08, **E-20** (pago proveedor), E-28, E-30, E-57, E-58 | +`socioId`, +`ordenCompraId`, +`medioPago`, +`comprobanteUrl`, +`prioridadPago`; `fecha` text→timestamp (CF-18) (a2_1:208) |
| `obligaciones_pendientes` | [ampliada] | E-56, E-27, E-28, E-29, E-30 | +`hitoId`, +`origen` (5 valores), +`deduccionDiseno3d`, +`periodicidad`, +`fechaNotificacion`, +`atrasoDias`, +`notificadoGerente`; estado enum aditivo (+`atrasada`); `fecha_vencimiento` text→date (CF-18) (a2_1:209) |
| `liquidaciones_compensacion` | [nueva] | E-31, E-32, E-58 | (a2_1:210) |
| `comisiones_proyecto` | [nueva] | E-35, E-31 | `desfaseId → desfases_cronograma` auditable (E-33→E-35); 5 tipos de comisión (a2_1:211) |
| `registros_horas` | [nueva] | E-31; E-47 (V-5) | UNIQUE(personaId, fecha) (a2_1:212) |
| `facturas` | [nueva] | Registro del hecho facturado en "Aliado" (externo) | **A3-C4: marcada `DIFERIDO` hasta facturación DIAN; escritura amarrada a E-28 cuando la facturación se active** (a2_1:213) |

### 11. Documentación (1 evento: E-41)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `documentos_proyecto` | [nueva] | E-41 | `alojador ∈ {drive_veta_erp, r2}` — R2 DIFERIDO; taxonomía VETA_ERP (a2_1:219) |

### 12. Integraciones (2 eventos: E-38, E-39)

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `modelos_3d` | [nueva] | E-38 | precedencia E-18; herramienta veta_designer/sketchup_opencutlist (a2_1:225) |
| `pedidos_corte` | [nueva] | E-39 | proveedorCorte sivaltriplex preferido (a2_1:226) |

### 13. Marketing / Demanda (3 eventos: E-40, E-42, E-55) — construcción DIFERIDO (t-034), interfaces de frontera

| Tabla | Estatus | Eventos | Notas de consolidación |
|---|---|---|---|
| `conversiones_ads` | [nueva] | E-40 | gclid/emailHash/telefonoHash; DIFERIDO t-034 (a2_1:232) |
| `testimonios` | [nueva] | E-55 | DIFERIDO t-034 (a2_1:233) |

### 14. Gobierno / Medición (1 evento: E-47) — lectura, sin escritura; construcción DIFERIDO

`registros_horas` como fuente de E-47 (KPI bienestar, V-5) (a2_1:239). E-42/E-43/E-47/E-58 son lecturas derivadas, sin tabla propia (regla c5: "se derivan del log, no se loguean a sí mismos").

### 15. Tablas CONSERVAR existentes incorporadas al inventario (A3-C1)

Las 4 tablas que A2-1 declaraba dentro del conteo 65 pero no enumeraba como fila. **Este consolidado las declara para que el conteo sea auditable línea a línea** (a3:234):

| Tabla | Estatus | Columnas | Relaciones | Eventos |
|---|---|---|---|---|
| `proveedores` | [conservada] | (sch:164-170) | 1—N productosCatalogo/ordenesCompra; herramientas.proveedorId | Dato de OC (E-19); reposición (E-45) |
| `portfolio_publico` | [conservada] | (sch:283-292) | proyectoId→proyectos; 1—N imagenesPortfolio | Publicación pública; consumidor de E-55 (DIFERIDO) |
| `imagenes_portfolio` | [conservada] | (sch:294-300) | portfolioId→portfolioPublico | Galería del portfolio |
| `pedidos_web` | [conservada] | (sch:304-313) | clienteId→clientes; target de ordenes_trabajo.pedidoWebId | E-44 (enganche pedido→producción); checkout t-015 |

---

## Correcciones A3 aplicadas (A3-C1..C5)

| ID | Corrección | Aplicación en el consolidado |
|---|---|---|
| **A3-C1** | Inventario incompleto (65 declaradas, 61 filas) | **§15 añadida**: filas para `proveedores`, `portfolio_publico`, `imagenes_portfolio`, `pedidos_web`. Conteo ahora auditable: 18 existentes (14 con fila + 4 de §15) + 47 nuevas = 65 |
| **A3-C2** | `leads.destino_redireccion` para E-04 | **Columna añadida** a `leads` (§1): captura el destino del estado `redirigido` (discover:36); `motivo_no_viable` sigue cubriendo el motivo |
| **A3-C3** | `clientes.etapa_funnel` sin consumidor | **Consumidor fijado**: se escribe como snapshot en E-51 (lead→cliente) para alimentar el embudo histórico (E-42, DIFERIDO); si no se implementa, se elimina en la migración. Revierte el riesgo de campo muerto (lección I-005) |
| **A3-C4** | `facturas` sin evento dueño | **Marcada `DIFERIDO`**: su escritura se amarra a E-28 únicamente cuando la facturación DIAN (a2_1:315) se active; mientras tanto es tabla sin escritura en capa 1 |
| **A3-C5** | `diseños3d.precio` hardcode 130000 | **Default desde parámetro**: la siembra del `precio` lee `parametros.bruto_diseno_3d` al crear la fila (política de efecto A2-5: congelamiento en el momento de creación, sin hardcode) |

---

## Lecturas derivadas (sin tabla propia)

| Evento | Derivación | Fuente |
|---|---|---|
| E-42 | Embudo, sobre `eventos` | a2_1:241 |
| E-43 | Caja, sobre `cuentas_financieras`/`movimientos_financieros` | a2_1:241 |
| E-47 | KPIs, sobre `proyectos`/`cronogramas`/`movimientos`/`registros_horas` | a2_1:241 |
| E-58 | Saldo por socio, sobre `movimientos_financieros.socio_id` + `liquidaciones_compensacion` | a2_1:241 |

---

## Predicados deterministas de los 5 gates (contrato para B3 y para implementación)

Recalculados por A3 contra columnas reales (a3:123-133). `∃` = existe, `∧` = y, `param('clave')` = lookup en `parametros`.

| Gate | Predicado | Dónde se ejecuta en UI (B2-2) |
|---|---|---|
| **E-18** | `P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='schema' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ p.fecha_entrada_desarrollo` | P-08 (desarrollo) → desbloquea OC (P-13) |
| **E-21** | `P21(r) = r.check_pedido_bien ∧ r.check_despacho_bien ∧ NOT EXISTS (items i WHERE i.ordenId=:oc AND (i.recibido_cantidad < i.cantidad OR i.sin_defectos IS NOT TRUE))` | P-14 (recepción) → pasa control al taller (P-16) |
| **E-24** | `P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyecto_id=p.id ∧ c.estado='citada' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='calidad' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ c.citado_en` | P-17 (calidad) → desbloquea instalación (P-18) |
| **E-33** | `P33(p) = ∃d∈desfases_cronograma: d.proyecto_id=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicion_causal)>0` → recálculo SOLO de `cronograma_etapas.linea='interna'` | P-09 (cronograma) |
| **E-20** | `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF (monto_total − monto_pagado))`; `P20 = caja_disponible ≥ :monto_pago` (bloqueante; rama negativa = fila `eventos` gate con payload, decisión del gerente) | P-13/P-20 (compras/caja) |

Nota E-21: el `catalogo_esperado_id` del predicado de A2-2 (a2_2:71) no existe en el consolidado — el esperado ES la línea de OC (`catalogo_id` + `cantidad`); predicado re-expresado sin cambio de semántica (a3:128).

---

## Parámetros configurables (inventario resumido — detalle en a2_5:74-113)

- **16 RESUELTOS core:** `sla_primera_respuesta_min=5` · `sla_novedad_critica_min_horas=5` · `sla_novedad_critica_max_horas=24` · `holgura_cobro_dias=12` · `garantia_ventana_dias_min=8` · `garantia_ventana_dias_max=12` · `promesa_semanas=7` · `rango_instalacion_dias=5` · `holgura_cronograma_max_dias=5` · `kpi_cumplimiento_semanas=4` · `reagenda_max=1` · `comision_desarrollador_pct=5` · `comision_carpintero_pct=5` · `bruto_diseno_3d=130000` · `iva_default_pct=19` · `llm_disponible=true`.
- **10 DECISION_PENDIENTE (valor vacío, no bloquean):** `umbral_novedad_check15`, `base_comision_tamano`, `comision_cierre_pct`, `comision_modulo_instalado`, `tarifa_hora_auxiliar`, `recargo_hora_extra_pct`, `quincena_desarrollador`, `reduccion_comision_causa_interna_pct`, `retencion_disenador_pct`, `iva_diseno_3d_pct`.
- **6 marca/legal (RESUELTOS):** `empresa_marca`, `empresa_razon_social`, `empresa_nit`, `empresa_direccion`, `empresa_telefono`, `empresa_horario_apertura`.

Política de efecto (A2-5 §4): lectura viva del parámetro al calcular → resultado congelado en la fila de negocio → sin recálculo histórico → transición programada por `vigente_desde`.

---

## Plan de migración (4 fases, a2_4:87-123) — regla de oro: ninguna fase rompe un módulo que ya corre

**Fase 0 — Identidad (tablas nuevas sin FKs):** `roles`, `personas`, `personas_roles` + backfill desde `usuarios.rolEmpleado`; `rolEmpleado` se conserva como fuente temporal (CC-05).

**Fase 1 — Ampliaciones aditivas (nullables, no rompen):** `proyectos` (+verificador_id, +fecha_entrada_desarrollo) · `obligaciones_pendientes` (+hito_id, +origen, +deduccion_diseno_3d, +periodicidad, +fecha_notificacion, +atraso_dias, +notificado_gerente) · `leads` (+embudo completo, +destino_redireccion A3-C2) · `clientes` (+etapa_funnel con consumidor A3-C3) · `movimientos_financieros` (+socioId, +medioPago, +comprobanteUrl, +prioridadPago, +referencia; ordenCompraId en Fase 2) · `ordenes_trabajo` (+tipo, +origen, +checkCompletitud, +completitudChecklist, +fechaCheckCompletitud) · `pedidos_web` (+engancheProduccion, +ordenProduccionId).

**Fase 2 — Tablas nuevas ordenadas por FK (ninguna FK apunta a tabla no creada):** Comercial → Contratos → Control → Desarrollo → Compras (+ `movimientos_financieros.ordenCompraId`) → Taller/Calidad → Entrega/Garantía → Finanzas → Documentación/Integraciones → Marketing (DIFERIDO) → Auditoría.

**Fase 3 — Cambios de tipo/enum con backfill (ÚLTIMOS, tocan datos existentes):** `proyectos.estado` enum aditivo + backfill 1:1 de los 8 valores legacy · `ordenes_trabajo.estado` text→enum aditivo · `obligaciones_pendientes.estado` text→enum aditivo (+atrasada) + extender `estado.ts` · `movimientos_financieros.fecha`/`obligaciones_pendientes.fecha_vencimiento` text→timestamp/date + actualizar `acciones.ts:78`.

**Fase 4 — Deprecación de `usuarios.rolEmpleado`** (solo tras auth en `personas_roles`; release coordinada con session.ts/require-session.ts/destino.ts/erp-nav.ts/equipo — CC-05/A2-4-08) + seed actualizado + tests re-corridos.

Detalle por tabla en `d3_schema_a2_4_contrato_vivo.md:87-123`.

---

## DECISION_PENDIENTE — RESUELTO (2026-08-04)

| # | Pendiente | Respuesta | Bloquea | Fuente |
|---|---|---|---|---|
| DP-01 | Valores numéricos sin fuente → parámetros con valor vacío | **Estimados como v1** (comisión cierre 5%, módulo 5%, tarifa 15k/6.5k COP/h, reducción 0.5%/día, etc.). Pendiente confirmación contador para retención e IVA diseño. | No | a2_1:310; a2_5:87-101 |
| DP-02 | ¿"compras" es rol tipado o función del gerente? | **Rol tipado dedicado**, gerente = suma de roles | No | a2_1:311 |
| DP-03 | Deprecación `usuarios.rolEmpleado` → `personas_roles` | **Migrar código existente**, no levantar de 0. Transición coordinada Fase 4. | No | a2_1:312; a2_4:80 |
| DP-04 | Veracidad de la composición causal de E-33 (D4) | **Metodología de justificación humana natural**. Verificador valida/rechaza composición causal con justificación textual. Mini-diamante M-01. | No | a2_1:313; a2_2:144 |
| DP-05 | Catálogo: insumos vs producto terminado | **Metodología de grafos** para composición de entidades. Catálogo herrajes como catálogo dual (compra + presentación). Mini-diamante M-02. | No | a2_1:314 |
| DP-06 | `base_comision_tamano` (¿valor_total o subtotal con IVA?) | **Subtotal sin IVA** | No | a2_5:198 |
| DP-07 | ¿Espejar cambios de parámetro en `eventos`? | **Logs robustos como sub-sistema de observabilidad**. Cada cambio de parámetro → evento en `eventos`. KPIs derivan del log. Mini-diamante M-04. | No | a2_5:202 |
| DP-08 | Fuente de `sla_novedad_critica` y `holgura_cronograma_max_dias` | **Derivar del grafo de composición de proyecto**. SLA y holgura son consecuencia de módulos activos, dependencias, cantidad de espacios. Mini-diamante M-03. | No | a2_5:203 |
| DP-09 | Bloque marca/legal (NAP/NIT/razón social) en `parametros` vs config de sitio público | **Editable en ERP desde el logo**. Panel de parametrización general con 6 claves de marca en `parametros`. | No | a2_5:200 |

**Total schema:** 9 decisiones resueltas (8 cerradas + 1 con valores estimados pendientes de confirmación contable). Ninguna bloquea el corte.

---

## Notas para el Orquestador (Ola 4 → Ola 7)

1. **Este consolidado ES el contrato de B3.** B3-1..B3-5 (`d3_ui_b3_*.md`, met:49-53) diseñan las 34 pantallas core de `d3_ui_b2_2_pantallas_requeridas.md` (26 admin + 8 frontstage) usando las tablas/columnas de este documento como mapeo de datos (contrato de formato met:110-123, punto 5).
2. **Los 5 predicados de gates de §6 son la referencia de los mapeos de E-18/E-21/E-24/E-33/E-20** en cada pantalla operativa (P-08/P-14/P-17/P-09/P-13-P-20).
3. **Consistencia de nombres:** los nombres snake_case de tablas/columnas de este documento son los que B3 debe citar en el mapeo de datos (y los que la migración creará en Drizzle). No se reintroducen los nombres de los A1 descartados.
4. **Capa 1/2 y DIFERIDO respetados:** `tareas_produccion` (capa 2), Marketing/Tienda/Gobierno (t-034), firma digital subsistema, alojador R2, facturación DIAN (y `facturas`, A3-C4) se diseñan como frontera, no se construyen.
5. **Prohibido cumplido por este pase:** solo escribió `arnes/diagnostico/pasadas/d3_schema_consolidado.md`. No modificó `lib/db/schema.ts`, `lib/modules/*` ni ningún otro archivo (verificado por `git status --porcelain`).
6. **Fase 0 completada (2026-08-04):** todas las DECISION_PENDIENTE resueltas. Documentación en `fase2_ronda3_decisiones_respondidas.md`. Ola 7 (Execute) lista para iniciar.

---

## Registro

- Fecha: 2026-08-04 · Ola 3 del Diamante 3 (Orquestador: consolidación tras auditoría A3 APROBADA).
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_consolidado.md`.
- Conteo final: **65 tablas** (18 existentes: 11 conservadas + 7 ampliadas, ahora las 18 con fila tras A3-C1; 47 nuevas) · **61/61 eventos** · **5/5 gates `DETERMINISMO_OK`** · **0 campos muertos estructurales** · **0 contradicción contrato vivo** · **9 DECISION_PENDIENTE resueltas** (ninguna estructural) · **5 correcciones A3 aplicadas (C1..C5)**.
- **Estado: APROBADO — la Ola 4 (B3-1..B3-5) queda desbloqueada.**
- Fase 0 completada (2026-08-04). Todas las DECISION_PENDIENTE resueltas. Ola 7 (Execute) lista para iniciar.
