# Pase A3 — Auditor final del schema (subagente independiente, loop de 3 iteraciones)

**Rol:** A3, auditor final independiente del Diamante 3 (Fase A). NO ejecuté los loops A1 ni A2 — juicio independiente.
**Modo:** `opencode general`, loop interno de 3 iteraciones.
**Objeto de la auditoría:** `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md` (schema consolidado de 65 tablas).
**Mandato crítico (bloqueo de la Ola 2):** A2-2, A2-3, A2-4 y A2-5 se ejecutaron ANTES de que A2-1 existiera (contra la unión A1 como proxy). Este pase **re-verifica esos 4 pases contra el consolidado REAL de A2-1** y recalcula los goals duros de `diamante3_metodologia.md:147` sin confiar en sus veredictos.
**Fuentes:** `d3_schema_a2_1_normalizacion.md` (a2_1) · `d3_schema_a2_2_determinismo.md` (a2_2) · `d3_schema_a2_3_trazabilidad.md` (a2_3) · `d3_schema_a2_4_contrato_vivo.md` (a2_4) · `d3_schema_a2_5_parametros.md` (a2_5) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `lib/db/schema.ts` (sch) · `diamante3_metodologia.md` (met).
**Evidencia mecánica previa (git/fs):** `git status --porcelain` no muestra cambios en `lib/db/schema.ts` ni `lib/modules/*` (solo `arnes/*` y tareas, que son del arnés) → **ningún pase A2 tocó código vivo**. `pasadas/` contiene los 5 A1 + los 5 A2 + A3.

---

## Iteración 1 (bruta)

Barrido crudo, sin filtro, de cada goal duro contra el consolidado REAL:

1. **61 eventos vs 61 filas del consolidado:** recorrí E-01..E-61 uno a uno contra las tablas de las secciones 1-15 de A2-1. Todos tienen tabla.columna de huella. Los 8 GAP que A2-3 marcó contra la divergencia A1 (E-01, E-02, E-03, E-04, E-27, E-49, E-50, E-51) quedan resueltos por las decisiones de A2-1 (CF-01 identidad lead, CF-02 veredictos, E-27 → `obligaciones_pendientes.fecha_notificacion`). Ningún evento sin hogar.
2. **5 gates contra columnas reales de A2-1:** E-18 → `verificaciones` (a2_1:110) + `proyectos.estado/verificador_id/fecha_entrada_desarrollo` (a2_1:126); E-21 → `recepciones_material` (a2_1:171) + `items_orden_compra.recibidoCantidad/sinDefectos/cantidad/catalogoId` (a2_1:170); E-24 → `citaciones_calidad.estado='citada'/citadoEn` (a2_1:186) + `verificaciones` tipo_gate='calidad' (a2_1:187,110); E-33 → `desfases_cronograma.causa/motivo/composicionCausal/decisionManual/justificacionManual/nuevasFechas/aplicado` (a2_1:150) + `cronograma_etapas.linea` (a2_1:149); E-20 → `cuentas_financieras.saldo_actual` (a2_1:207) + `obligaciones_pendientes.tipo/estado/monto_total/monto_pagado` (a2_1:209) + `ordenes_compra.monto_total/anticipo_monto` (a2_1:169, CF-16) + rama negativa en `eventos` (a2_1:111, CF-06). Los 3 GAP_SCHEMA de A2-2 (DET-02/03/09) están resueltos por adición (A2-1-03/04/05, a2_1:305-307).
3. **Contrato vivo:** las 10 contradicciones CC-01..CC-10 de A2-4 se evalúan contra el consolidado real (tabla en §Contrato vivo). Verificado mecánicamente que A2-1 no renombra/borra ninguna de las 10 tablas marcadas CONSERVAR por A2-4.
4. **Campos muertos:** barrido de las columnas del consolidado buscando sin-consumidor. Los R-01..R-10 colapsados y S-01..S-04 conservados (a2_1:264-284) se verifican. Aparecen 3-5 sospechosos propios (ver §0 campos muertos).
5. **Capa 1/2:** DIFERIDOS t-034/capa 2 correctamente marcados (a2_1:228,235,180). Sin contaminación del core.
6. **Conteo del consolidado:** 61 filas de tabla enumeradas + 4 tablas existentes CONSERVAR **sin fila** en el inventario (`proveedores`, `portfolio_publico`, `imagenes_portfolio`, `pedidos_web` — las 2 primeras ni siquiera referenciadas). El conteo 65 = 18 existentes + 47 nuevas es **internamente consistente** (61 filas = 14 existentes + 47 nuevas; 18−14 = 4 omitidas), pero el inventario como entregable **no es 100% auditable** → hallazgo A3-C1.

## Iteración 2 (autocrítica)

Dudo de mis propios hallazgos de la pasada 1, uno por uno:

1. **¿Es GAP estructural que falten 4 tablas CONSERVAR en el inventario?** No. `git status` prueba que esas tablas siguen en `schema.ts` intactas (`proveedores`: sch:164-170; `portfolio_publico`: sch:283-292; `imagenes_portfolio`: sch:294-300; `pedidos_web`: sch:304-313). A2-1 no las borra ni renombra; solo no les dio fila en el consolidado (dos son FK-target: `ordenes_compra.proveedorId` a2_1:169, `herramientas.proveedorId` a2_1:172, `productos_catalogo.proveedorId`; `pedidos_web` es target de `ordenes_trabajo.pedidoWebId` a2_1:178). Es un defecto de **completitud documental del entregable**, no de schema → CORRECCION para el paso de consolidado, no RECHAZADO.
2. **¿E-04 es GAP por no tener `destino_redireccion`?** La huella primaria de E-04 (estado `descartado`/`redirigido`) vive en `leads.estado` (a2_1:121). El atributo "destino" (que A1-1 proponía, c1:77) no está listado explícitamente. `leads.motivo_no_viable` cubre el motivo; el destino queda implícito en el estado. Es observación de detalle de columna, no GAP estructural (el evento tiene hogar). → nota, no bloquea.
3. **¿Los 5 gates son de verdad deterministas o heredé la conclusión de A2-2?** Recalculé los 5 predicados yo mismo contra A2-1 (tabla §5 gates). E-21 tiene una diferencia real: el predicado de A2-2 cita `i.catalogo_esperado_id` (a2_2:71) que **no existe** en el consolidado — el ítem esperado ES la línea de OC (`items_orden_compra.catalogo_id` + `cantidad` esperada, a2_1:170). El predicado se re-expresa como `recibido_cantidad < cantidad OR sin_defectos IS NOT TRUE`, aún SQL-evaluable y booleano. No es `DETERMINISMO_ROTO`, es reformulación con nota (contrato de no-rotura de A2-2:155 se cumple en semántica, no en literal).
4. **¿`clientes.etapa_funnel` es campo muerto?** A2-1 dice "referencia de la evolución del lead; no duplica el embudo" (a2_1:122). Con `leads` conservada y dueña del embudo (CF-01), es un espejo de `leads.estado`. Su consumidor declarado es débil ("referencia"). → sospechoso RUIDO de nivel bajo: exigir consumidor explícito (E-51) o eliminarla. No es bloqueo.
5. **¿`facturas` es campo muerto?** No tiene evento dueño en los 61; la facturación DIAN está DIFERIDO (a2_1:315). Su rol declarado es "registro del hecho facturado en 'Aliado' (externo)" (a2_1:213), disparado por E-28. → debe marcarse DIFERIDO explícito o amarrarse a E-28. No es bloqueo.
6. **¿La contabilidad "56 logueados + 4 derivados + 1 diferido" del `eventos` (a2_1:112) rompe algo?** Los DIFERIDOS son 5 eventos (E-40, E-42, E-44, E-47, E-55; define:174) de los cuales 2 son derivados (E-42, E-47) — la aritmética de A2-1 es laxa pero ningún evento queda sin cobertura. Cosmético.
7. **Autocrítica sobre el conteo 61/61:** reconté el inventario del Discover (discover:28-148) — los 61 IDs E-01..E-61 aparecen exactamente una vez en mi matriz, sin duplicados ni faltantes (coincide con define:49 y a2_3:54).

## Iteración 3 (refinamiento final)

Resultado depurado:

- **0 GAP estructural** en los goals duros. Los hallazgos que quedan son 1 de completitud documental del consolidado (A3-C1) + 4 observaciones de detalle no bloqueantes (A3-C2..C5).
- **5/5 gates `DETERMINISMO_OK`** contra columnas reales de A2-1 (recalculado, no heredado de A2-2).
- **61/61 huella** confirmada; los 8 GAP de A2-3 y los 3 GAP de A2-2 quedan cerrados por el consolidado.
- **0 contradicción contrato vivo:** CC-01..CC-10 verificadas contra A2-1, todas resueltas; nada de código vivo roto (git).
- **0 campos muertos estructurales:** los sospechosos se resuelven como snapshot/derivación o consumidor documentado; 2 de bajo nivel pasan como corrección al consolidado.
- **Capa 1/2 e identidad lead→cliente→proyecto:** correctas.
- **DECISION_PENDIENTE acumuladas:** ninguna estructural.

---

## Verificación goal por goal

### 61/61 huella

Leyenda: ✓ = tabla.columna presente en el consolidado A2-1 (con línea) · GAP = sin huella estructural. Los 4 eventos marcados `derivado` y los `DIFERIDO` siguen la regla de A2-1/a2_3: "se derivan del log, no se loguean a sí mismos" (a2_1:241; c5:26).

| Evento | Tabla.columna en el consolidado A2-1 | ✓/GAP |
|---|---|---|
| E-01 | `leads.id` + `leads.canal`/`estado='nuevo'` (a2_1:121) | ✓ |
| E-02 | `conversaciones.horaPrimeraRespuesta` (a2_1:123); `leads.hora_primera_respuesta`/`estado='en_contacto'` (a2_1:121) | ✓ |
| E-03 | `leads.estado` (calificado/descartado/redirigido) + `leads.score_conversion` (a2_1:121; S-01 a2_1:281) | ✓ |
| E-04 | `leads.estado` (descartado/redirigido) + `leads.motivo_no_viable` (a2_1:121) — nota: `destino_redireccion` no listado (A3-C2) | ✓ (nota) |
| E-05 | `proyectos.estado='borrador'` (a2_1:126) + `cotizaciones` (a2_1:127) | ✓ |
| E-06 | `citas.franjaInicio/franjaFin/tipo/agendadaPor` (a2_1:124) | ✓ |
| E-07 | `visitas.medidasTomadas/observaciones/tomadaPor` (a2_1:125) | ✓ |
| E-08 | `movimientos_financieros.concepto='diseno_3d'`/`socioId` (a2_1:208) + `diseños3d.estado='pagado'` (a2_1:128) + `obligaciones_pendientes.origen='diseno_3d'` (a2_1:209) | ✓ |
| E-09 | `cotizaciones.estado='en_revision'` + `snapshotProyecto` (a2_1:127) | ✓ |
| E-10 | `cotizaciones.version`/`ajustesCount` (a2_1:127) | ✓ |
| E-11 | `cotizaciones.estado='cotizado'`/`publicadaAt` (a2_1:127) | ✓ |
| E-12 | `contratos.estado='borrador'` (a2_1:137) + `hitos_pago` (a2_1:138) | ✓ |
| E-13 | `firmas_contrato` (a2_1:139); `contratos.estado='firmado'` (a2_1:137) | ✓ |
| E-14 | `cronogramas` (a2_1:148) + `cronograma_etapas.linea` (a2_1:149) | ✓ |
| E-15 | `retomas.medidas/notasRetoma/anomaliaDetectada` (a2_1:159) | ✓ |
| E-16 | `cambios_contrato` (a2_1:141) | ✓ |
| E-17 | `schemas_proyecto.version` (a2_1:160) + `bom_materiales.linajeItemId` (a2_1:161) + `modelos_3d` (a2_1:225) | ✓ |
| E-18 | `verificaciones.tipo_gate='schema'`/`veredicto`/`verificadorId`/`creadoEn` (a2_1:110) + `proyectos.estado/fecha_entrada_desarrollo/verificador_id` (a2_1:126) | ✓ |
| E-19 | `ordenes_compra` (a2_1:169) + `items_orden_compra` (a2_1:170) | ✓ |
| E-20 | `movimientos_financieros.ordenCompraId/prioridadPago/medioPago/comprobanteUrl` (a2_1:208) + `eventos` gate E-20 (a2_1:111; CF-06 a2_1:76) + `cuentas_financieras.saldo_actual` (a2_1:207) + `obligaciones_pendientes` (a2_1:209) | ✓ |
| E-21 | `recepciones_material.checkPedidoBien/checkDespachoBien/checkMaterial/estado/verificadoPorRol` (a2_1:171) + `items_orden_compra.recibidoCantidad/sinDefectos/cantidad/catalogoId` (a2_1:170) | ✓ |
| E-22 | `modulos_armado` (a2_1:179) + `ordenes_trabajo` (a2_1:178); detalle interno `tareas_produccion` DIFERIDO capa 2 (a2_1:180) | ✓ |
| E-23 | `citaciones_calidad.estado='citada'`/`citadoEn` (a2_1:186) | ✓ |
| E-24 | `verificaciones.tipo_gate='calidad'` (a2_1:187,110) + `proyectos.estado='armado'`/`verificador_id` (a2_1:126) | ✓ |
| E-25 | `instalaciones` (a2_1:193) | ✓ |
| E-26 | `actas_entrega` (a2_1:194); `proyectos.estado='entregado'` (a2_1:126) | ✓ |
| E-27 | `obligaciones_pendientes.fecha_notificacion`/`notificado_gerente` (a2_1:209) + `eventos` E-27 (a2_1:112) — GAP G-2 de a2_3 resuelto | ✓ |
| E-28 | `movimientos_financieros` (a2_1:208); `obligaciones_pendientes.estado='pagado'` (a2_1:209) | ✓ |
| E-29 | `obligaciones_pendientes.estado='atrasada'`/`atraso_dias`/`notificado_gerente` + `fecha_vencimiento` date (a2_1:209; CF-18 a2_1:88) | ✓ |
| E-30 | `obligaciones_pendientes.deduccion_diseno_3d` (a2_1:209) | ✓ |
| E-31 | `liquidaciones_compensacion` (a2_1:210) + `registros_horas` (a2_1:212) + `parametros` (`comision_*`, a2_1:114) | ✓ |
| E-32 | `liquidaciones_compensacion.cuenta_cobro_url/fecha_pago` (a2_1:210) | ✓ |
| E-33 | `desfases_cronograma.causa/motivo/composicionCausal/decisionManual/justificacionManual/nuevasFechas/aplicado` (a2_1:150) + `cronograma_etapas.linea='interna'` (a2_1:149) | ✓ |
| E-34 | `novedades_criticas.ventanaSlaHoras/horaEntrada/horaResolucion/estado/cumplioSla/escaladoA` (a2_1:151) | ✓ |
| E-35 | `comisiones_proyecto` (a2_1:211) | ✓ |
| E-36 | `citas_garantia.ventanaDias/estado` (a2_1:200) | ✓ |
| E-37 | `ordenes_trabajo.tipo='garantia'` (a2_1:178) | ✓ |
| E-38 | `modelos_3d.etiquetas/estado/herramienta` (a2_1:225) | ✓ |
| E-39 | `pedidos_corte.archivoCvc/proveedorCorte` (a2_1:226) | ✓ |
| E-40 | `conversiones_ads.gclid/emailHash/telefonoHash` (a2_1:232) + `leads.gclid` (a2_1:121) — DIFERIDO t-034 (a2_1:228) | ✓ |
| E-41 | `documentos_proyecto` (a2_1:219) | ✓ |
| E-42 | **derivado** sobre `eventos` (a2_1:241) — DIFERIDO t-034 | ✓ (derivado) |
| E-43 | **derivado** sobre `cuentas_financieras`/`movimientos_financieros` (a2_1:241,207) | ✓ (derivado) |
| E-44 | `ordenes_trabajo.pedidoWebId`/`origen='pedido_web'` (a2_1:178) + `pedidos_web` (referencia) — DIFERIDO construcción t-034 | ✓ |
| E-45 | `ordenes_compra.origen='operativa'` (a2_1:169) + `herramientas.estado='necesita_reposicion'` (a2_1:172) | ✓ |
| E-46 | `citas.estado='no_show'`/`reagendaConteo` (a2_1:124) | ✓ |
| E-47 | **derivado** sobre `proyectos`/`cronogramas`/`movimientos`/`registros_horas` (a2_1:239,241) — DIFERIDO | ✓ (derivado) |
| E-48 | `diseños3d` (a2_1:128) | ✓ |
| E-49 | `leads.estado='no_viable'`/`motivo_no_viable` (a2_1:121) | ✓ |
| E-50 | `leads.hora_primer_contacto`/`hora_primera_respuesta`/`sla_cumplido`/`sla_ventana_min`/`escalacion_sla` (a2_1:121) + `parametros.sla_primera_respuesta_min` (a2_1:114; a2_5:76) | ✓ |
| E-51 | `leads.cliente_id` FK (a2_1:121) + `procedencia(cliente←lead, E-51)` (a2_1:113) + `proyectos.clienteId` (sch:93) | ✓ |
| E-52 | `estimaciones` (a2_1:147) | ✓ |
| E-53 | `disponibilidad_cliente` (a2_1:140) | ✓ |
| E-54 | `reprocesos.origen/modulo/componente/culpable` (a2_1:163) | ✓ |
| E-55 | `testimonios` (a2_1:233) — DIFERIDO t-034 (a2_1:228) | ✓ |
| E-56 | `obligaciones_pendientes.origen='contrato_hito'`/`hito_id` (a2_1:209,138) | ✓ |
| E-57 | `obligaciones_pendientes.origen='arriendo'`/`periodicidad='mensual'` (a2_1:209) + `movimientos_financieros.concepto='arriendo'` (a2_1:208) | ✓ |
| E-58 | **derivado** sobre `movimientos_financieros.socio_id` + `liquidaciones_compensacion` (a2_1:241) | ✓ (derivado) |
| E-59 | `check_15_dias` (a2_1:152) | ✓ |
| E-60 | `comunicaciones_progreso` (a2_1:153) | ✓ |
| E-61 | `ordenes_trabajo.checkCompletitud`/`completitudChecklist`/`fechaCheckCompletitud` (a2_1:178) | ✓ |

**Conteo: 61 filas, 61 ✓, 0 GAP.** Confirmación de la re-verificación de A2-3: los 8 GAP de la matriz A1 (E-01, E-02, E-03, E-04, E-27, E-49, E-50, E-51) quedan **cerrados** por CF-01 (a2_1:71) y la resolución de E-27 (a2_1:209). El G-2 de A2-3 (entidad `notificacion`) se resolvió en `obligaciones_pendientes.fecha_notificacion` + fila `eventos`, sin tabla nueva — coherente con la recomendación de A2-3 (a2_3:138).

### 5 gates deterministas

Predicados **recalculados por A3** contra columnas reales del consolidado A2-1 (no heredado de A2-2). `∃` = existe, `∧` = y, `param('clave')` = lookup en `parametros`.

| Gate | Predicado en columnas REALES de A2-1 | ¿Evaluable sin juicio humano al evaluarse? | Veredicto |
|---|---|---|---|
| **E-18** check de schema pre-compras | `P18(p) = p.estado='desarrollo' ∧ ∃v∈verificaciones: v.proyectoId=p.id ∧ v.tipo_gate='schema' ∧ v.veredicto='aprobado' ∧ v.verificadorId=p.verificador_id ∧ v.creadoEn ≥ p.fecha_entrada_desarrollo` — columnas: `proyectos.estado/verificador_id/fecha_entrada_desarrollo` (a2_1:126), `verificaciones.tipo_gate/veredicto/verificador_id/creado_en/proyecto_id` (a2_1:110) | **SÍ** — booleano puro; el juicio del verificador queda pre-registrado como dato (D3, define:153; a2_1:110) | `DETERMINISMO_OK` (GAP DET-02 resuelto por adición, a2_1:305) |
| **E-21** recepción triple verificación | `P21(r) = r.check_pedido_bien ∧ r.check_despacho_bien ∧ NOT EXISTS (items i WHERE i.ordenId=:oc AND (i.recibido_cantidad < i.cantidad OR i.sin_defectos IS NOT TRUE))` — columnas: `recepciones_material.check_pedido_bien/check_despacho_bien/check_material/estado` (a2_1:171), `items_orden_compra.cantidad(esperada)/recibido_cantidad/sin_defectos/catalogo_id` (a2_1:170) | **SÍ** — booleano por ítem; `sin_defectos` nullable ⇒ `IS NOT TRUE` (null = aún no verificado = falla), sin ambigüedad | `DETERMINISMO_OK` con nota: el `i.catalogo_esperado_id` del predicado de A2-2 (a2_2:71) no existe en A2-1 — el esperado ES la línea de OC (`catalogo_id` + `cantidad`); predicado re-expresado, semántica C3 de define:76 intacta |
| **E-24** veredicto pre-despacho | `P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyectoId=p.id ∧ c.estado='citada' ∧ ∃v∈verificaciones: v.proyectoId=p.id ∧ v.tipo_gate='calidad' ∧ v.veredicto='aprobado' ∧ v.verificadorId=p.verificador_id ∧ v.creadoEn ≥ c.citadoEn` — columnas: `proyectos.estado/verificador_id` (a2_1:126), `citaciones_calidad.estado/citado_en` (a2_1:186), `verificaciones` (a2_1:187,110) | **SÍ** — booleano puro; enum unificado `citada` (CF-14, a2_1:84) | `DETERMINISMO_OK` |
| **E-33** cambio de cronograma con causa | `P33(p) = ∃d∈desfases_cronograma: d.proyectoId=p.id ∧ d.aplicado=true ∧ d.causa∈{'interna','externa','cambio_contrato'} ∧ length(d.motivo)>0 ∧ jsonb_array_length(d.composicionCausal)>0` → recálculo SOLO de `cronograma_etapas.linea='interna'`; `contractual` inmutable — columnas: `desfases_cronograma.causa/motivo/composicion_causal/decision_manual/justificacion_manual/nuevas_fechas/aplicado` (a2_1:150), `cronograma_etapas.linea` (a2_1:149) | **SÍ** — el predicado exige existencia (no verdad) de la composición causal; la veracidad del trazado (D4) es `DECISION_PENDIENTE` registrada, no se evalúa (a2_1:313; define:79) | `DETERMINISMO_OK` (GAP DET-03 resuelto por adición, a2_1:306) |
| **E-20** pago a proveedor (gate de caja) | `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF (monto_total − monto_pagado))`; `P20 = caja_disponible ≥ :monto_pago` con `:monto_pago` = `ordenes_compra.monto_total`/`anticipo_monto` según mecánica (CF-16, a2_1:86) — columnas: `cuentas_financieras.saldo_actual` (a2_1:207; sch:236), `obligaciones_pendientes.tipo/estado/monto_total/monto_pagado` (a2_1:209), `ordenes_compra.monto_total/anticipo_monto` (a2_1:169) | **SÍ** — SUM + comparación; juicio de gerente solo en la rama negativa, registrada como fila `eventos` gate E-20 con payload `{dinero_disponible_antes, monto, decision_gerente}` (CF-06, a2_1:76,111) | `DETERMINISMO_OK` (bloqueo completo D1, define:87; caja derivada como fuente única, CF-17 a2_1:87) |

**Resumen: 5/5 `DETERMINISMO_OK` · 0 `DETERMINISMO_ROTO`.** Re-verificación de A2-2 completada: los 3 GAP_SCHEMA (DET-02, DET-03, DET-09) están resueltos en A2-1 por adición de columna (A2-1-03/04/05, a2_1:305-307); las 6 divergencias de naming (DET-04..DET-08, DET-11, DET-13, DET-17) quedaron unificadas (CF-02, CF-12, CF-13, CF-14, CF-15, CF-16). El único `DETERMINISMO_ROTO` que A2-2 detectó estaba fuera de los gates (E-29, por `fecha_vencimiento` text) y **fue corregido por el propio mandato de A2-1** (CF-18, a2_1:88) — ya no es rotura.

### 0 campos muertos

Sospechosos de `RUIDO_SCHEMA` detectados por A3 en el consolidado (barrido independiente de columnas sin consumidor evidente):

| Tabla.columna | Sospecha | Verificación de A3 | Veredicto |
|---|---|---|---|
| `clientes.etapa_funnel` (a2_1:122) | Espejo de `leads.estado` con `leads` conservada (CF-01); consumidor declarado solo "referencia de la evolución" | Con `leads` dueña del embudo, esta columna no alimenta ningún gate/evento concreto; riesgo de campo muerto (lección I-005). Exigir consumidor explícito (p. ej. lectura E-51/E-42) o eliminarla | **Sospecha baja → corrección A3-C3** (no estructural) |
| `facturas` (a2_1:213) | Sin evento dueño en los 61; facturación DIAN es DIFERIDO (a2_1:315) | Su rol es registrar el hecho facturado en el externo "Aliado", disparado por E-28; mientras DIAN está DIFERIDO, la tabla no tiene escritura en capa 1 | **Marcar `DIFERIDO` o amarrarla a E-28 → corrección A3-C4** (no estructural) |
| `asignaciones_proyecto` (a2_1:108) | Solapa con `proyectos.verificador_id` (CF-20, a2_1:90) | Convive como mecanismo general de rol-por-proyecto; consumidor: guards de E-18/E-24 evalúan rol del designado (a2_1:292) | **Conservada con consumidor** — no es ruido |
| `citas.tipo ('visita')` (a2_1:124) | Discriminador constante si `citas_garantia` es tabla separada | Dato clasificador de E-06; inofensivo, no duplica (garantía usa su propia tabla) | **Conservada** — no es ruido |
| `diseños3d.precio (default 130000)` (a2_1:128) | Coexiste con parámetro `bruto_diseno_3d` = 130000 (a2_5:90) | Patrón snapshot: el precio se congela en la fila al crear el diseño (política de efecto A2-5: congelamiento, a2_5:180-182); el default debe sembrarse desde el parámetro, no hardcodearse | **Conservada** con nota de siembra (A3-C5) |
| `leads.sla_ventana_min (default 5)` (a2_1:121) | Coexiste con parámetro `sla_primera_respuesta_min` = 5 (a2_5:76) | Mismo patrón snapshot: ventana aplicada al registro; el parámetro es la política. Consistente con A2-5 §4 | **Conservada** — no es ruido |

**RUIDO colapsado/evitado correctamente por A2-1 (verificado, no heredado):** R-01 `pagos_proveedor`, R-02 `registros_gate_caja`, R-03 `veredictos_calidad`/`verificaciones_schema`, R-04 `eventos_negocio`/`registro_actividad`, R-05 `parametros_compensacion`, R-06 `transiciones_embudo`/`cuentas_socios`/`metricas_kpi`, R-07 `arriendos` tabla, R-08 `checklist` jsonb en recepciones, R-09 `contextoNegocio` jsonb, R-10 loguear lecturas (a2_1:264-275). **NO-RUIDO confirmados:** S-01 `score_conversion` (consumidor E-03/E-42), S-02 `saldo_actual` (acciones.ts:96-101), S-03 `tareas_produccion.estado` sin tipar, S-04 `contratos.valor_total` intacto (a2_1:279-284).

**Veredicto: 0 campos muertos estructurales.** Los 2 sospechosos de bajo nivel (etapa_funnel, facturas) pasan como correcciones documentales al paso de consolidado, no como defecto de schema.

### Contrato vivo

Re-evaluación de las CC-01..CC-10 de A2-4 contra el **consolidado REAL** (A2-4 las evaluó contra la unión A1):

| Contradicción (A2-4) | Resolución en el consolidado A2-1 | ¿Rota algo existente? | Veredicto |
|---|---|---|---|
| CC-01 `leads` absorción vs FK | **CF-01 conserva `leads`** con `estado`+`cliente_id` FK + `procedencia` (a2_1:71,290). `api/leads/route.ts:23` y `agendar/page.tsx:26-31` intactos (a2_4:76) | No | **Resuelta** |
| CC-02 enum `proyectos.estado` incompleto | **A2-1-14:** enum extendido con mapeo 1:1 COMPLETO de los 8 valores legacy, incl. `entregado/perdida/cancelada` (a2_1:316,126) | No (estado leído como string opaco, a2_4:31) | **Resuelta** |
| CC-03 `ordenes_trabajo.estado` text→enum | Enum **aditivo incl. 'pendiente'** (a2_1:178); `tareas_produccion.estado` NO se tipa (a2_1:180, S-03) | No | **Resuelta** |
| CC-04 `obligaciones_pendientes.estado` | Enum **aditivo +`atrasada`**; los 3 valores de `estado.ts:15-21` sobreviven (a2_1:209; CF-12 a2_1:82) | No | **Resuelta** |
| CC-05 deprecación `usuarios.rolEmpleado` | `rolEmpleado` se **conserva temporalmente**; deprecación en release coordinada (a2_1:109, N-02 a2_1:252) | No (coexistencia) | **Resuelta** |
| CC-06 tablas gemelas | Las 9 familias convergidas en UNA (CF-02..CF-11, a2_1:72-82) | No | **Resuelta** |
| CC-07 designación del verificador | **CF-20:** `proyectos.verificador_id → personas`; `asignaciones_proyecto` convive (a2_1:90,108) | No | **Resuelta** |
| CC-08 dual-identidad personas/usuarios | **CF-19:** `personas` = negocio, `usuarios.persona_id` puente; FKs de negocio → `personas` (a2_1:89,253) | No | **Resuelta** |
| CC-09 fechas text→timestamp/date | **CF-18:** `movimientos_financieros.fecha` → timestamp, `obligaciones_pendientes.fecha_vencimiento` → date, con actualización de `acciones.ts:78` en la misma release (a2_1:88,256) | No (cambio documentado con backfill, a2_4:119) | **Resuelta** |
| CC-10 `contratos.valor_total` | **No se toca** — CC-10 explícito (a2_1:137); deducción vive en `obligaciones_pendientes.deduccion_diseno_3d` (a2_1:209) | No | **Resuelta** |

**Verificación mecánica extra:** ninguna de las 10 tablas marcadas CONSERVAR por A2-4 (espacio_variantes, productos_catalogo, items_variante, proveedores, contratos, hitos_pago, cuentas_financieras, portfolio_publico, imagenes_portfolio, tareas_produccion) fue renombrada ni borrada (git confirma `lib/` intacto; A2-1 conserva o referencia las 10). **0 contradicción con el contrato vivo.**

### Capa 1/2

| Diferido | Marcación en el consolidado | Contaminación del core |
|---|---|---|
| Marketing/Demanda/Tienda/Gobierno (t-034) | Sección 14 ⚠ `construcción DIFERIDO (t-034)` + sección 15 `lectura, sin escritura; DIFERIDO` (a2_1:228,235) | **No** — `conversiones_ads`/`testimonios` aisladas (a2_1:232-233); E-42/E-47 solo lecturas derivadas (a2_1:241) |
| E-44 tienda | Huella de interfaz en `ordenes_trabajo.pedidoWebId/origen` (a2_1:178); construcción DIFERIDO t-034 (define:174) | **No** — columna nullable aditiva |
| E-22 detalle interno del taller (capa 2) | `tareas_produccion` conservada sin rediseño + encabezado de sección "DIFERIDO (capa 2)" (a2_1:174,180) | **No** — `modulos_armado` (fila de salida, B2) sí es capa 1 (a2_1:179) |
| E-13 firma digital subsistema | `firmas_contrato` con huella sí (a2_1:139); subsistema verificador DIFERIDO (a2_1:315) | **No** |
| E-41 alojador R2 | `documentos_proyecto.alojador` con opción `r2 — R2 DIFERIDO` (a2_1:219) | **No** |
| Facturación DIAN | DIFERIDO (a2_1:315) | **No** |

**Veredicto: capa 1/2 correctamente separada.** Ningún diferido contaminó el schema core. Nota menor: E-44 no lleva la etiqueta `DIFERIDO` explícita en su fila de tabla (solo implícita), y la aritmética "56 logueados + 4 derivados + 1 diferido" de la fila `eventos` (a2_1:112) es laxa frente a los 5 DIFERIDOS reales — cosmético.

### Identidad lead → cliente → proyecto

Resuelta correctamente por CF-01/N-01 (a2_1:71,251,290) y verificada por A3 contra el Define:
- `leads` se **conserva** como tabla con `estado` de embudo completo + `cliente_id` FK → `clientes` (a2_1:121). El "mismo registro que cambia de estado" (define:51) se materializa con la FK que se fija en E-51, no con absorción (que rompería `api/leads/route.ts:23`).
- `procedencia(cliente ← lead, E-51)` registra el lineage al nacer el dato (a2_1:113).
- `proyectos.clienteId` cierra la cadena hacia el proyecto (sch:93; a2_1:122).
- Sin duplicado de contacto (P3-01): la FK es vínculo, no copia.

**Veredicto: identidad resuelta, coherente con la decisión D3/I-035 y con el contrato vivo.**

---

## DECISION_PENDIENTE finales para el Supervisor

Acumulación verificada de A1 + A2 (todas con traza; **ninguna es bloqueo estructural**):

| # | DECISION_PENDIENTE | Fuente | ¿Bloqueo estructural? |
|---|---|---|---|
| DP-01 | Valores numéricos sin fuente (retención/IVA diseñador, comisión de cierre, módulo instalado, tarifa hora, quincena, umbral check15, base del 5%) → `parametros` con valor vacío | a2_1:310; a2_5:87-101; define:128,145 | **No** (motor funcional con los 16 RESUELTOS, a2_5:229) |
| DP-02 | ¿"compras" es rol tipado o función del gerente? (E-19/E-20 disparan "compras"; caja la maneja el gerente) | a2_1:311; discover:72-73,117 | **No** (resoluble en implementación de guards) |
| DP-03 | Deprecación de `usuarios.rolEmpleado` → `personas_roles`: requiere release coordinada (6+ archivos de auth/nav/equipo) | a2_1:312; a2_4:80 (CC-05); lib/auth/session.ts:9 | **No** (schema coexiste; solo código cambia en release) |
| DP-04 | Veracidad de la composición causal de E-33 (D4): el predicado exige existencia, no verdad; `decision_manual`/`justificacion_manual` registran la desviación | a2_1:313; a2_2:144 (DET-14); define:79,139,155 | **No** (resuelto como determinismo de existencia) |
| DP-05 | Catálogo: mezcla insumos vs producto terminado en `productos_catalogo` — distinguir a nivel de validación | a2_1:314; c1:356 | **No** |
| DP-06 | `base_comision_tamano` (¿valor_total o subtotal con IVA?) — H17 de A1-4 | a2_5:198 (P-07) | **No** (parametro vacío) |
| DP-07 | ¿Espejar cambios de parámetro en `eventos`? Enum de 61 cerrado (define:49) — `parametros_historial` es autocontenido | a2_5:202 (P-11) | **No** |
| DP-08 | Fuente de `sla_novedad_critica` (5/24h) y `holgura_cronograma_max_dias` (5): provienen del mapa, no del Define §6 — validar | a2_5:203 (P-12) | **No** |
| DP-09 | Inclusión del bloque marca/legal (NAP/NIT/razón social) en `parametros` vs config de sitio público (consumidor DIFERIDO) | a2_5:200 (P-09); log:34,54 | **No** |

**Verificado: 0 DECISION_PENDIENTE estructural.** Ninguna bloquea el modelado de capa 1. Las 3 decisiones "fuertes" que A2-4 heredó (CC-01 leads, CC-05 rolEmpleado, CC-08 puente personas/usuarios) **ya fueron resueltas por A2-1** (CF-01, N-02, CF-19) y no necesitan escalar.

---

## VEREDICTO FINAL: APROBADO

El schema consolidado de A2-1 cumple los goals duros de `diamante3_metodologia.md:147`, verificados por A3 de forma independiente contra el consolidado real y el Define:

- **61/61 huella** — 61 filas, 0 GAP (los 8 GAP de A2-3 y los 3 de A2-2 cerrados por el consolidado).
- **5 gates deterministas** — 5/5 `DETERMINISMO_OK`, 0 `DETERMINISMO_ROTO` (recalculados por A3; el único ROTO histórico, E-29 por fechas `text`, quedó corregido por CF-18).
- **0 campos muertos** estructurales (10 RUIDO colapsados verificados; 2 sospechosos de bajo nivel pasan como corrección documental).
- **0 contradicción contrato vivo** — CC-01..CC-10 resueltas contra el consolidado real; 10 tablas CONSERVAR intactas; `lib/` sin cambios (git).
- **Capa 1/2** correctamente separada; sin contaminación del core.
- **Identidad lead→cliente→proyecto** resuelta (CF-01).
- **0 DECISION_PENDIENTE estructurales** para el Supervisor.

**0 GAP_SCHEMA estructurales encontrados.** No hay lista de correcciones de rechazo.

Correcciones documentales que el **paso de consolidado** (`d3_schema_consolidado.md`, met:39) debe incorporar (no bloquean el APROBADO del schema, pero completan el entregable):

| ID | Corrección | Detalle | Fuente |
|---|---|---|---|
| A3-C1 | **Inventario incompleto del consolidado** | A2-1 declara 65 tablas pero enumera 61 filas: faltan filas para `proveedores`, `portfolio_publico`, `imagenes_portfolio`, `pedidos_web` (las 2 últimas ni referenciadas). Añadir las 4 filas CONSERVAR/AMPLIAR para que el conteo 65 sea auditable línea a línea | a2_1:97-241; sch:164-170,283-300,304-313 |
| A3-C2 | `leads.destino_redireccion` para E-04 | El estado `redirigido` se captura, pero el atributo "destino" de E-04 (discover:36) no tiene columna listada. Añadirla o documentar que el motivo lo absorbe | a2_1:121; discover:36 |
| A3-C3 | `clientes.etapa_funnel` sin consumidor explícito | Con `leads` conservada (CF-01), exigir consumidor (E-51/E-42) o eliminarla; de lo contrario revive la lección I-005 | a2_1:122 |
| A3-C4 | `facturas` sin evento dueño | Marcar `DIFERIDO` (facturación DIAN) o amarrar su escritura a E-28 | a2_1:213,315 |
| A3-C5 | `diseños3d.precio` hardcode 130000 | El default debe sembrarse desde `parametros.bruto_diseno_3d` (snapshot, no copia independiente) | a2_1:128; a2_5:90 |

## Notas para el Orquestador

1. **Re-verificación de los 4 pases A2 cumplida (mandato de la Ola 2):** A2-2 (DET-01..DET-17), A2-3 (G-1..G-8, H01..H12), A2-4 (CC-01..CC-10, A2-4-P01) y A2-5 (P-01..P-14) corrieron contra la unión A1 como proxy porque A2-1 no existía. **A3 recalculó sus veredictos contra `d3_schema_a2_1_normalizacion.md` y todos se sostienen**, salvo los matices documentados (predicado E-21 re-expresado sin `catalogo_esperado_id`; contabilidad 56/4/1 del `eventos`). Puede cerrarse el goal A2 "1 schema relacional convergido, 0 correcciones estructurales pendientes" (met:146).
2. **Veredicto de los pases hermanos confirmado:** A2-2 "5/5 DETERMINISMO_OK" ✓; A2-3 "61 filas, 0 sin hogar" ✓ (los 8 GAP quedaron resueltos por CF-01 y la resolución de E-27); A2-4 "CC-01..CC-10" ✓; A2-5 "1 tabla `parametros` + `parametros_historial`" ✓ (a2_1:114-115).
3. **Deuda que NO es de este pase:** la atomicidad evento+mutación en el mismo `tx` (regla A1-5:214) y el payload de evidencia de los gates se verifican en la implementación de `lib/modules/*`, no en el schema (a2_1:325; a2_2:157). A2-4 especifica el plan de migración en 4 fases (a2_4:87-123) para el paso de consolidado.
4. **Correcciones A3-C1..C5** deben entrar en `d3_schema_consolidado.md` para que el entregable final sea auditado sin notas. Ninguna requiere reabrir A2-1 (loop focalizado no necesario).
5. **Prohibido cumplido:** este pase solo escribió `arnes/diagnostico/pasadas/d3_schema_a3_auditor.md`. No modificó `lib/db/schema.ts`, `lib/modules/*`, `arnes/*` ni ningún otro archivo (verificado por `git status --porcelain`).

---

## Registro

- Fecha: 2026-08-04 · Pase A3 (ola 3, auditor final independiente del schema).
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a3_auditor.md`.
- Loop de 3 iteraciones completado: 1 bruta → 2 autocrítica (7 dudas resueltas) → 3 refinamiento.
- Conteo final: **61/61 huella (0 GAP) · 5/5 gates `DETERMINISMO_OK` · 0 campos muertos estructurales · 0 contradicción contrato vivo · capa 1/2 correcta · 0 DECISION_PENDIENTE estructurales · 5 correcciones documentales (A3-C1..C5) no bloqueantes.**
- **VEREDICTO FINAL: APROBADO.**
