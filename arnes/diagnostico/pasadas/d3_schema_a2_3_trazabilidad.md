# Pase A2-3 — Trazabilidad de eventos (subagente, loop de 3 iteraciones)

**Lente:** trazabilidad de eventos en el schema consolidado. **Rol:** sub-agente A2-3 del Diamante 3 (grafo Schema→UI, `pasadas/diamante3_metodologia.md`).
**Fuente PRIMARIA declarada en la misión:** `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md` (schema consolidado de A2-1).

> ⚠️ **BLOQUEO DE DEPENDENCIA, VERIFICADO MECÁNICAMENTE ANTES DE EMPEZAR:** la fuente PRIMARIA **NO EXISTE**. No hay `d3_schema_a2_1_normalizacion.md` en el repo (glob `**/*a2_*` = 0 coincidencias), no aparece en `git status --porcelain` (ni tracked ni untracked), y el directorio `pasadas/` no la contiene (listado por mtime). El grafo del método declara A2-1 como parte de la **Ola 2** que **"necesita salidas de ola 1"** (`diamante3_metodologia.md:131`); la Ola 1 (A1-1..A1-5, B1-1..B1-3) existe completa, pero **ningún pase A2 (A2-1..A2-5) se ha escrito**. A2-3 fue lanzado en paralelo antes de que A2-1 emitiera su consolidado.

**Consecuencia metodológica (no inventar):** no existe "schema consolidado" contra el cual verificar los 61 eventos. En lugar de detener el pase ("la misión es no parar", `diamante3_metodologia.md:19`), este pase entrega el máximo valor verificable HOY:
1. Matriz de 61 eventos contra **la divergencia A1** (las 5 propuestas A1-1..A1-5 + `lib/db/schema.ts`), que es el material que A2-1 debía normalizar — sirve de **checklist de verificación** para A2-1/A3.
2. Los **puntos de convergencia que A2-1 DEBE resolver** para que cada evento tenga UNA huella estable (contradicciones entre pases = riesgo de pérdida en la normalización).
3. La integración auditoría/lineage (A1-5) con el consolidado candidato, y el riesgo concreto de pérdida.
4. Todos los ✓ de la matriz quedan marcados como **candidatos contra divergencia A1, PENDIENTES de confirmación contra el consolidado real de A2-1**.

**Referencias cortas usadas en la traza:** `inv` = `diamante2_discover_eventos.md` · `def` = `diamante2_define_eventos.md` · `c1` = `d3_schema_a1_1_contextos.md` · `c2` = `d3_schema_a1_2_enforcement.md` · `c3` = `d3_schema_a1_3_roles.md` · `c4` = `d3_schema_a1_4_dinero.md` · `c5` = `d3_schema_a1_5_datos.md` · `sch` = `lib/db/schema.ts` · `met` = `diamante3_metodologia.md`.

---

## Iteración 1 (bruta)

Lectura secuencial de las fuentes de la misión en el orden dado. Hallazgos crudos sin filtro:

1. **A2-1 ausente** (ver bloqueo arriba). La misión pedía "verificar 61 eventos en el consolidado de A2-1" y "¿A2-1 mantuvo la tabla `eventos`?" — ambas preguntas son **irrespondibles contra la fuente declarada** porque el archivo no existe.
2. La mejor fuente existente para "schema consolidado candidato" es la **divergencia A1**:
   - `c1` (contextos): 63 tablas propuestas, tabla resumen declarada **61/61 ✓** (`c1:240-306`).
   - `c2` (enforcement): 5 gates con predicados evaluables sobre columnas (`c2:73-79`) + máquinas de estado (`c2:85-138`).
   - `c3` (roles): `roles`, `usuarios_roles`, `verificaciones`, `registro_actividad` (`c3:121-175`).
   - `c4` (dinero): `parametros_compensacion`, `ordenes_compra`, `items_orden_compra`, `facturas`, `liquidaciones_compensacion`, `comisiones_proyecto`, `registros_horas`, `registros_gate_caja` + ampliaciones (`c4:71-296`).
   - `c5` (datos): tabla `eventos` (auditoría, 15 columnas) + `procedencia` (lineage) (`c5:53-91`).
3. Matriz cruda: los 61 eventos del inventario (`inv:28-148`) tienen al menos una tabla/columna propuesta en A1 — **ninguno quedó sin hogar en la divergencia** (coincide con `c1:28` y `c1:306`).
4. Se detectaron **contradicciones de huella entre pases** (misma columna en dos tablas con dos diseños) y **tres tablas de auditoría rivales** — exactamente el tipo de conflicto que la normalización A2-1 debía colapsar y que este pase documenta.

---

## Iteración 2 (autocrítica)

Crítica del enfoque bruto contra las reglas del método (`met:98-104`) y la misión:

1. **(2a) ¿Puedo usar A1 como proxy del consolidado?** La misión exige verificar contra "el schema consolidado de A2-1". Usar A1 como si fuera el consolidado **sería inventar** una verificación que no ocurrió. Corrección: A1 es el **material de entrada** de A2-1; la matriz se rotula como *huella candidata contra divergencia A1, pendiente de confirmación A2-1*, y el bloqueo se declara como hallazgo `GAP_SCHEMA` de proceso (no se silencia).
2. **(2b) ¿Marco GAP las contradicciones o las dejo pasar?** Marcar 61/61 ✓ como hizo `c1:306` sería prematuro: hay eventos con **dos huellas incompatibles** entre pases (identidad lead, E-18/E-24 veredictos, E-14 cronograma...). Para un pase de trazabilidad, huella contradictoria = trazabilidad no garantizada = `GAP_SCHEMA` (no `RUIDO_SCHEMA`, no `NORMALIZACION` simple: es el síntoma de que la normalización no ocurrió). Los 8 eventos del embudo de lead (E-01..E-04, E-49, E-50, E-51) se marcan GAP por la contradicción `c1:73` (fusión `leads`→`clientes`) vs `c2:149-159`/`c5:49` (mantener `leads` + `estado` + `cliente_id` FK).
3. **(2c) ¿Repito hallazgos de A1-5 o los integro?** La misión pide *integrar* la auditoría/lineage (A1-5) con el consolidado, no re-enumerar los hallazgos de A1-5. Corrección: la sección de integración evalúa la pregunta "¿A2-1 mantuvo `eventos`?" → irrespondible (A2-1 ausente), y documenta el **riesgo de pérdida concreto**: `procedencia` existe SOLO en `c5`; si A2-1 consolida desde `c1` (la propuesta más grande) sin mirar `c5`, se pierden `ocurrenciaId`, `eventoReferenciaId`, `payload` de gates y la tabla `procedencia`.
4. **(2d) Lecturas/agregados (E-42, E-43, E-47, E-58):** sigo la decisión de `c5:26,148,163,164` — no se loguean, se derivan. En la matriz son ✓ con nota "derivado/N". Los DIFERIDOS (E-40, E-42, E-44, E-47, E-55) se marcan ✓ de huella de interfaz + nota `DIFERIDO (t-034)`, alineado a `def:173-174`.
5. **(2e) ¿Qué de la misión puedo confirmar sin A2-1?** El lineage clave (cotización→contrato→proyecto; BOM→OC→recepción) sí es verificable en la divergencia y en `sch` (FKs reales). Eso se entrega como confirmación parcial con traza.

**Qué sobrevive:** matriz completa de 61 filas contra divergencia A1 (checklist), los GAP estructurales con propuesta, integración de auditoría con riesgo de pérdida, lineage confirmado parcialmente, DIFERIDOS correctamente marcados, bloqueo declarado al frente. **Qué cae:** cualquier veredicto "61/61 ✓ en el consolidado" — imposible sin A2-1.

---

## Iteración 3 (refinamiento final)

Decisión de diseño del entregable:

- **D1. Estatus de la matriz:** `✓` = huella existente y nombrada en la divergencia A1 (candidata, pendiente de confirmación por A2-1); `GAP` = huella ausente o estructuralmente ambigua entre pases (exige decisión de A2-1). Ningún ✓ es veredicto final.
- **D2. Los GAP de la matriz son 8**, todos con propuesta de columna/tabla, todos resueltos dentro del espacio de la divergencia A1 (ninguno inventa regla de negocio nueva).
- **D3. Conteo final:** 53 ✓ + 8 GAP = **61 filas**, una por evento, sin duplicados ni faltantes (verificado por conteo E-01..E-61, todos presentes exactamente una vez).
- **D4. La sección de integración responde la pregunta de la misión con el estado real:** A2-1 **ni mantuvo ni perdió** la tabla `eventos` porque A2-1 no existe; el veredicto de integración es *recomendación* al Orquestador (adoptar `eventos` de `c5` + `procedencia`, colapsar `eventos_negocio` y `registro_actividad`), marcada `DECISION_PENDIENTE` de A2-1.
- **D5. Lineage clave:** confirmado en la divergencia con traza; marcado para re-verificación final contra A2-1 en A3.
- **D6. DIFERIDOS:** lista cerrada de 6 (5 de t-034 + 1 capa 2), con su fuente `def:173-174` y `c1` por tabla.

---

## Matriz de trazabilidad (61 eventos)

Leyenda de estatus: **✓** = huella candidata existente en la divergencia A1 (pendiente de confirmación A2-1) · **GAP** = huella ausente o ambigua entre pases (propuesta en §GAPs). Orden: el del inventario (`inv:28-148`).

| # | Evento | Dato que nace (inv) | Tabla(s).columna(s) candidata(s) en la divergencia A1 | ✓/GAP | Nota |
|---|---|---|---|---|---|
| 1 | E-01 | lead con canal + contacto | `leads`/`clientes` canal, contacto (`c1:77`); **ambigüedad identidad** (`c1:73` vs `c2:151`) | **GAP** | ver G-1/H02 |
| 2 | E-02 | conversación + hora primera respuesta | `conversaciones` (`c1:78`) vs `leads.primera_respuesta_at` (`c2:153`); ambigüedad identidad | **GAP** | duplicación de ubicación + G-1 |
| 3 | E-50 | SLA 5 min + a quién se escala | `leads`/`clientes` `sla_cumplido`, `sla_escalado_a/at` (`c2:154-156`); `sla_eventos` (`c2:168`) | **GAP** | identidad G-1; ventana 5 min = parámetro (`def:132`); Chatwoot frontera (`c2:49`) |
| 4 | E-03 | puntaje/resultado cualificación | `leads`/`clientes` `score_conversion` + etapa (`c1:77`; `sch:279`) | **GAP** | `score_conversion` revive con consumidor (I-012, `c1:41`); identidad G-1 |
| 5 | E-04 | motivo + destino descarte/redirección | `leads`/`clientes` `motivo_descarte`, `destino_redireccion` (`c1:77`) | **GAP** | identidad G-1 |
| 6 | E-05 | proyecto borrador + cotización preliminar | `proyectos` (`sch:91-109`); `cotizaciones` (`c1:82`) | ✓ | `proyectos.clienteId` existe (`sch:93`); `estado` no cubre borrador (`c1:81` CORRECCION) |
| 7 | E-49 | motivo de no viabilidad del lead | `leads`/`clientes` `motivo_no_viabilidad` (`c1:77`; `c2:159`) | **GAP** | identidad G-1; lead se pierde, solo se registra (`def:134`) |
| 8 | E-06 | cita con fecha/franja | `citas.franjaInicio/fin, tipo` (`c1:79`) | ✓ | |
| 9 | E-07 | registro estructurado de visita | `visitas.medidasTomadas, observaciones` (`c1:80`) | ✓ | H4 instrumentar lo que pasa (`c1:80`) |
| 10 | E-46 | no-show + regla de reagenda | `citas.estado=no_show` (`c1:79`); `leads.reagenda_count` (`c2:158`) | ✓ | duplicación `reagendaConteo` en 2 tablas → NORMALIZACION A2-1 |
| 11 | E-48 | artefacto diseño 3D | `diseños3d` (`c1:83`) | ✓ | precio $130k = parámetro (`c4:89`) |
| 12 | E-08 | movimiento financiero + cuenta de cobro diseñador | `diseños3d.estado=pagado` (`c1:83`); `movimientos_financieros` + `socio_id` (`c4:152`); obligación `origen=diseno_3d` (`c4:175-182`) | ✓ | frontera Comercial/Finanzas (`def:120`); doble nacimiento con E-32 resuelto (`c4:216`) |
| 13 | E-52 | estimación f(valor, módulos) + % crecimiento | `estimaciones` (`c1:136`) | ✓ | frontera: dispara Comercial, fija Control (`c1:136`) |
| 14 | E-09 | vista pública de propuesta (snapshot) | `cotizaciones.estado=en_revision` + `snapshotProyecto` (`c1:82`) | ✓ | snapshot congelado P3-07 (`c1:82`) |
| 15 | E-10 | versión ajustada de cotización | `cotizaciones.version+1, ajustesCount` (`c1:82`) | ✓ | |
| 16 | E-11 | cotización formal | `cotizaciones.estado=cotizado` (`c1:82`) | ✓ | input del embudo E-42; promesa 7 semanas (`def:17`) |
| 17 | E-51 | lead→cliente + vínculo al proyecto | `clientes.etapa_funnel=cliente` (`c1:77`) vs `leads.estado+cliente_id` FK (`c2:157`; `c5:49`) | **GAP** | **identidad G-1**; `proyectos.clienteId` (`sch:93`) + `procedencia(cliente←lead, E-51)` (`c5:120`) |
| 18 | E-12 | contrato + hitos de pago | `contratos.estado=borrador` (`sch:189`); `hitos_pago` (`sch:198-206`) | ✓ | `contratos.proyectoId` FK real (`sch:176`) |
| 19 | E-13 | registro de firma | `firmas_contrato` (`c1:126`); `contratos.estado=firmado` (`sch:189`) | ✓ | subsistema verificador de firma DIFERIDO (`c2:209`) |
| 20 | E-53 | restricciones de viajes/situaciones | `disponibilidad_cliente` (`c1:127`) | ✓ | consumidor en motor de cronograma (E-14/E-33) evita campo muerto (`c1:127`) |
| 21 | E-14 | fechas por etapa (2 líneas) + holgura | `cronogramas` + `cronograma_etapas` (`c1:137-138`) vs `cronograma.tipo_linea` (`c2:78`) | ✓ | doble línea I-034 (`c1:138`); NORMALIZACION nombre/estructura A2-1 (G-6) |
| 22 | E-15 | medidas/notas post-contrato | `retomas.medidas, notas, anomaliaDetectada` (`c1:150`) | ✓ | anomalía → E-16 (`c1:150`) |
| 23 | E-16 | cambio de contrato (adicional/cambio/reproceso) | `cambios_contrato` (`c1:128`) | ✓ | doble destino schema+costo (`c1:128`); dispara E-33 causa cambio_contrato (`def:89`) |
| 24 | E-17 | modelo 3D + BOM + lista de compras (versionado) | `schemas_proyecto.version` (`c1:151`); `bom_materiales.linajeItemId`→items_variante (`c1:152`) | ✓ | **linaje BOM↔cotización P3-05** (`c1:152`) |
| 25 | E-18 | veredicto de schema (gate) | `veredictos` (`c2:75`) / `verificaciones` (`c3:150`) / `verificaciones_schema` (`c1:153`) | ✓ | triple diseño → NORMALIZACION A2-1 (G-4); rama negativa E-54 (`c2:75`) |
| 26 | E-19 | orden de compra (3 mecánicas) | `ordenes_compra` + `items_orden_compra` (`c1:162-163`; `c4:113-137`) | ✓ | guard E-18 de apertura (`c2:75`); E-45 vista conjunta por proveedor |
| 27 | E-20 | movimiento financiero + comprobante + prioridad | `pagos_proveedor` (`c1:164`) vs `movimientos_financieros.orden_compra_id/prioridad_pago` (`c4:153-156`) | ✓ | gate de caja bloqueante D1 (`def:136`); rama negativa `registros_gate_caja` (`c4:286-295`) o fila `eventos` (`c5:150`) → NORMALIZACION (G-8) |
| 28 | E-21 | gate de recepción triple + checklist | `recepciones` + `recepcion_items` (`c2:76`); `items_orden_compra.recibidoCantidad/sinDefectos` (`c1:163`) | ✓ | checklist C3 por ítem (`c2:76`); rama negativa rastreo origen D2 (`def:76`) |
| 29 | E-45 | compra operativa sin proyecto | `ordenes_compra.origen=operativa` (`c1:162`; `c4:119`); `herramientas.estado=necesita_reposicion` (`c1:166`) | ✓ | resuelve P6-04 (`def:40`) |
| 30 | E-22 | órdenes de armado por módulo | `modulos_armado` (`c1:175`) / `modulos_taller` (`c2:123`); `ordenes_trabajo` | ✓ | **detalle DIFERIDO capa 2** (`def:173`); solo fila módulos capa 1 (B2) (`c1:175`); NORMALIZACION nombre (G-5) |
| 31 | E-23 | citación de calidad (push) | `citaciones_calidad` (`c1:184`) | ✓ | señal, no gate (`c2:37`); no bloquea por sí sola (`def:77`) |
| 32 | E-24 | veredicto de calidad pre-despacho | `veredictos_calidad` (`c1:185`) / `verificaciones` (`c3:150`) / `veredictos` (`c2:77`) | ✓ | verificador único = comercial (D3, `def:153`); sin conflicto I-043; NORMALIZACION (G-4) |
| 33 | E-54 | registro de rechazo + reproceso | `reprocesos.origen/modulo/componente/culpable` (`c1:154`) | ✓ | granularidad módulo/componente (C2, `def:116`); rastreo de origen D2 (`def:76`); `eventoReferenciaId`→gate que rechazó (`c5:66,136`); dispara E-33 |
| 34 | E-25 | registro de instalación | `instalaciones` (rango 5 días, `c1:193`) | ✓ | adelantada por check 15 días (`c1:193`); fallida → E-54 |
| 35 | E-26 | acta de entrega firmada + holgura 12 días | `actas_entrega` (`c1:194`); `proyectos.estado=entregado` | ✓ | |
| 36 | E-55 | reseña curada | `testimonios.curado→aprobado→publicado` (`c1:95`) | ✓ | **DIFERIDO t-034** (`def:174`); protocolo I-013 (`c1:95`) |
| 37 | E-56 | obligación de cobro por hito | `obligaciones_pendientes.origen=contrato_hito, hito_id` (`c4:175-177`); `hitos_pago` (`sch:198`) | ✓ | nacimiento automático P3-02 (`def:122`); `procedencia(obligacion←contrato, E-56)` (`c5:141`) |
| 38 | E-27 | notificación de pago (qué/cuándo/cuánto) | `obligaciones_pendientes.fecha_notificacion` (`c1:211`) | **GAP** | entidad `notificacion` del log sin tabla de dominio (`c5:60,141`); ver G-2 |
| 39 | E-28 | movimiento financiero + saldo de obligación | `obligaciones_pendientes.estado=pagado` (`sch:261`; `c4:172`); `movimientos_financieros` (`sch:239`) | ✓ | reconciliación pago parcial P3-02/P3-12 (`c5:142`) |
| 40 | E-29 | recordatorio + holgura 12 días | `obligaciones_pendientes.estado=atrasada` (`c4:172`); `notificadoGerente` (`c1:211`) | ✓ | `fecha_vencimiento` text → NORMALIZACION fecha (`c4:354`); aviso gerente tras 12 días (`def:133`) |
| 41 | E-30 | deducción del diseño 3D del anticipo | `obligaciones_pendientes.deduccion_diseno_3d` (`c4:177`) | ✓ | el sistema, no la memoria (H-10, `c4:184`); precedencia E-08→E-30 (`def:90`); no toca `contratos.valor_total` (`c4:187`) |
| 42 | E-31 | compensación por rol (base) | `compensaciones` (`c1:214`) vs `liquidaciones_compensacion` (`c4:219-230`) | ✓ | nómina compuesta base E-31 + ajuste E-35 (P3-04, `c4:209`); NORMALIZACION (G-7) |
| 43 | E-57 | movimiento del 3er flujo (arriendos) | `arriendos` (`c1:217`); `obligaciones_pendientes.origen=arriendo, periodicidad` (`c4:178`); `movimientos_financieros` | ✓ | prioridad tras materiales (`c4:338`) |
| 44 | E-32 | micro cuenta de cobro autogenerada | `liquidaciones_compensacion.cuenta_cobro_url` (`c4:228`) | ✓ | permiso de firma previo (`c4:216`); doble nacimiento con E-08 resuelto (`def:120`) |
| 45 | E-58 | saldo/cuenta por socio | vista derivada sobre `movimientos_financieros.socio_id` + `liquidaciones_compensacion` (`c1:219`; `c4:152`) | ✓ | **lectura N, no se loguea** (`c5:148`); sin tabla con saldo (P3-12, `c4:33`) |
| 46 | E-59 | log real de producción + 3 desenlaces | `check_15_dias` (`c1:141`) | ✓ | inputs deterministas: `recepciones`, `ordenes_compra.estado`, `modulos_taller` (`c2:204`); umbral novedad `DECISION_PENDIENTE` (`c2:204`) |
| 47 | E-33 | desfase con causa estructurada | `desfases_cronograma` (`c1:139`) / `desfases` (`c4:256,261`) | ✓ | composición causal D4 (`def:139`); tercer origen cambio_contrato (I-027, `def:23`); consumido por E-35 (`c1:139`); NORMALIZACION nombre (G-6) |
| 48 | E-60 | progreso visible frontstage | `comunicaciones_progreso` (`c1:142`) | ✓ | solo emisiones se loguean (`c5:153`); único mecanismo frontstage (`def:108`) |
| 49 | E-34 | novedad crítica con SLA 5-24h | `novedades_criticas` (`c1:140`); `sla_eventos` (`c2:168`) | ✓ | consecuencia resuelta: registro+visibilidad+escalación, sin multa (`def:135`) |
| 50 | E-35 | ajuste de comisión por cumplimiento | `comisiones` (`c1:215`) vs `comisiones_proyecto` (`c4:244-258`) | ✓ | desfase interno reduce, externo re-mide (`c4:237`); comercial por ventas no por producción (I-043, `c4:335`); NORMALIZACION (G-7) |
| 51 | E-43 | lectura de caja (restricción máxima) | `cuentas_financieras.saldo_actual` (`sch:236`; `c4:306`) | ✓ | **lectura N, no se loguea** (`c5:151`); saldo derivado vs almacenado P3-12 (`c2:47`) |
| 52 | E-42 | métricas por salto del embudo | agregado sobre log `eventos` + etapa de lead/cliente (`c1:113`; `c5:163`) | ✓ | **derivado N + DIFERIDO t-034** (`def:174`); no se loguea a sí mismo (`c5:26`) |
| 53 | E-47 | KPIs operativos (4/7 semanas/ventas/bienestar) | agregados: `proyectos`, `cronogramas`, `movimientos_financieros`, `registros_horas` (`c1:116`) | ✓ | **derivado N + DIFERIDO t-034** (`def:174`); horas bienestar V-5 DIFERIDO capa 2 (`c2:210`) |
| 54 | E-36 | cita de garantía (8-12 días hábiles) | `citas_garantia` (`c1:202`) | ✓ | |
| 55 | E-61 | check de completitud de orden de garantía | `ordenes_trabajo.checkCompletitud` + `completitudChecklist` (`c1:174`) | ✓ | evita 2-3 vueltas del instalador (F-11, `c1:202-203`) |
| 56 | E-37 | orden de garantía (tipo distinguible) | `ordenes_trabajo.tipo=garantia, estado=en_garantia` (`c1:174`; `c2:23`) | ✓ | reutiliza patrón `ordenes_trabajo` (`c1:174`) |
| 57 | E-38 | etiquetas de modelo 3D | `modelos_3d.etiquetas` (`c1:235`) | ✓ | precedencia E-18 (`def:88`); Veta Designer/SketchUp (`c1:235`) |
| 58 | E-39 | archivo CVC / pedido de corte | `pedidos_corte.archivoCvc, proveedorCorte` (`c1:236`) | ✓ | SivalTriplex preferido (`c1:236`); precedencia E-18 (`def:88`) |
| 59 | E-40 | señal de conversión offline (gclid/enhanced) | `conversiones_ads` (`c1:94`); `clientes.gclid`/`leads.gclid` | ✓ | **DIFERIDO t-034** (`def:174`); `gclid` perdido en schema actual (`sch:271-281`) |
| 60 | E-41 | documento por etapa + alojador | `documentos_proyecto` (`c1:227`) | ✓ | rol de captura D5: comercial + desarrollador en retoma (`def:138`); alojador R2 DIFERIDO (`c2:212`) |
| 61 | E-44 | enganche pedido→orden de producción | `pedidos_web.engancheProduccion` + `ordenes_trabajo.pedidoWebId/origen` (`c1:104`) | ✓ | **DIFERIDO construcción t-034** (`def:174`); comparte taller H-05 (`def:35`) |

**Conteo: 53 ✓ + 8 GAP (E-01, E-02, E-03, E-04, E-27, E-49, E-50, E-51) = 61 filas, E-01..E-61 presentes exactamente una vez.** Todos los ✓ son candidatos contra la divergencia A1; su confirmación final depende de A2-1 (ausente).

---

## GAPs y correcciones propuestas

| GAP | Evento(s) | Tipo | Descripción | Propuesta (columna/tabla) | Fuente |
|---|---|---|---|---|---|
| G-1 | E-01, E-02, E-03, E-04, E-49, E-50, E-51 | `GAP_SCHEMA` | Identidad lead→cliente sin normalizar: A1-1 propone fusión `leads`→`clientes` (`clientes.etapa_funnel`), A1-2/A1-5 proponen mantener `leads` con `estado` + `cliente_id` FK. La huella de los 8 eventos del embudo es ambigua entre pases | **CORRECCION_SCHEMA:** decisión de A2-1. Si se conserva `leads` (schema actual + mínimo cambio): `leads.estado` (enum E-01..E-51), `leads.cliente_id` FK, `leads.hora_primera_respuesta_at`, `leads.sla_cumplido`, `leads.motivo_no_viable`, `leads.gclid`; si se absorbe en `clientes`: todas esas columnas en `clientes` + migración de `leads` | `c1:73,77`; `c2:149-159`; `c5:49,175`; `sch:271-281` |
| G-2 | E-27 | `GAP_SCHEMA` | Entidad `notificacion` del vocabulario de `eventos` sin tabla de dominio en ninguna propuesta; el dato nace solo como columna `fecha_notificacion` | Escribir E-27 en `eventos` con `entidad='obligacion'` + payload `{hito, monto, fecha}` (`c5:141`), O crear tabla `notificaciones` (id, obligacionId, canal, contenido, enviadoAt) si el ERP debe emitirlas | `c5:60,141`; `c1:211` |
| G-3 | todos | `GAP_SCHEMA` (proceso) | A2-1 (`d3_schema_a2_1_normalizacion.md`) NO EXISTE: sin consolidado no hay verificación final de huella | Orquestador: confirmar si A2-1 corre en paralelo; si no, A2-3 y el resto de A2 deben relanzarse/re-auditarse contra su salida. La matriz de este pase es el checklist | `met:131,146-147`; ausencia verificada por glob/git status |
| G-4 | E-18, E-24 | `NORMALIZACION` (pendiente A2-1) | Tres diseños de la verificación E-18/E-24: `veredictos` (`c2:75`), `verificaciones` (`c3:150`), `verificaciones_schema`/`veredictos_calidad` (`c1:153,185`) | Unificar en una tabla `verificaciones_gate` con `tipo_gate ∈ {schema, calidad}` + `verificadorId` + `veredicto` + `detalle` (opción ya anotada por `c1:40`) | `c1:40,153,185`; `c2:75`; `c3:150-158` |
| G-5 | E-22 | `NORMALIZACION` (pendiente A2-1) | `modulos_armado` (`c1:175`) vs `modulos_taller` (`c2:123`); fila del taller capa 1 con dos nombres | Un nombre único: `modulos_taller` (estados por módulo, `c2:123-127`) — input de E-59/E-34 | `c1:175`; `c2:123`; `def:118` |
| G-6 | E-14, E-33 | `NORMALIZACION` (pendiente A2-1) | `cronogramas`+`cronograma_etapas` (`c1:137-138`) vs `cronograma.tipo_linea` (`c2:78`); misma doble línea I-034 con dos esquemas | Un esquema: `cronogramas` (1 por proyecto) + `cronograma_etapas` con `linea ∈ {contractual, interna}` (más granular que `tipo_linea` en una sola tabla) | `c1:137-138`; `c2:78`; `def:20` |
| G-7 | E-31, E-35 | `NORMALIZACION` (pendiente A2-1) | `compensaciones`/`comisiones` (`c1:214-215`) vs `liquidaciones_compensacion`/`comisiones_proyecto` (`c4:219,244`) | Unificar en el par de `c4` (nómina compuesta base E-31 + ajuste E-35, P3-04) | `c1:214-215`; `c4:219,244`; `def:103` |
| G-8 | E-20, E-23 | `NORMALIZACION` (pendiente A2-1) | `pagos_proveedor` (`c1:164`) vs `movimientos_financieros` ampliado (`c4:152-158`); y rama negativa E-20 en `registros_gate_caja` (`c4:286`) vs fila `eventos` (`c5:150`) | Decidir si el pago a proveedor es tabla propia o movimiento con `orden_compra_id`/`prioridad_pago`; la rama negativa bloqueada debe tener UNA traza auditable (recomendado: `eventos` gate E-20 + `registros_gate_caja` como vista) | `c1:164`; `c4:152-158,286`; `c5:150`; `def:136` |

---

## Integración de auditoría/lineage

**Respuesta a la pregunta de la misión ("¿A2-1 mantuvo la tabla `eventos`? ¿se perdió?"):** **irrespondible contra la fuente declarada** — A2-1 no existe (A2-3-H01). Lo verificable hoy, en la divergencia A1:

1. **La auditoría vive TRES veces en la divergencia** (riesgo `RUIDO_SCHEMA` si A2-1 no unifica):
   - `eventos_negocio` (append-only, stream observabilidad; `c1:113`) — propuesta de A1-1.
   - `registro_actividad` (usuario_id, rol_usado, accion E-XX; `c3:166-175`) — propuesta de A1-3, que declaró que "A2-3 la refina".
   - `eventos` + `procedencia` (`c5:53-91`) — propuesta de A1-5, la única que cumple el contrato completo (enum de 61, `ocurrenciaId` multi-entidad, `eventoReferenciaId` causal, `payload` de evidencia de gates, FKs de contexto lead/cliente/proyecto/contrato, tabla `procedencia` de lineage).
2. **Riesgo concreto de pérdida en la normalización:** `procedencia` (lineage) existe SOLO en `c5`. Ningún otro pase la propone (`c1`, `c3`, `c4` usan FKs sueltas). Si A2-1 consolida desde `c1` sin mirar `c5`, se pierde la tabla de procedencia y con ella la cadena causal lead→cliente→proyecto y BOM→OC→recepción "escrita al nacer el dato" (`c5:46` D3). A2-1 debe adoptar `procedencia` explícitamente o declarar la alternativa (lineage por FKs solas).
3. **Refinación pendiente que A1-3 delegó a este pase:** `c3:218` dice "el detalle fino de `registro_actividad` es responsabilidad de A2-3". La refinación de este pase: **colapsar `registro_actividad` en `eventos`** (de `c5`), que ya cubre `usuario_id`→`actorId`, `rol_usado`→`actorRol`, `accion`→`tipoEvento`, `entidad/entidad_id`→`entidad/entidadId`, `detalle`→`payload`. `registro_actividad` queda como `RUIDO_SCHEMA` si A2-1 no la fusiona.
4. **Recomendación de integración (para A2-1):** adoptar `eventos` (15 columnas + índices, `c5:53-78`) + `procedencia` (`c5:80-94`) como la auditoría única; `eventos_negocio` y `registro_actividad` se descartan o se reexpresan como vistas sobre `eventos` (los índices `eventos(tipoEvento, createdAt)` y `eventos(actorId, createdAt)` ya sirven a E-42/E-47, `c5:76-78`).
5. **Atomicidad (regla de oro heredada):** evento + mutación en el mismo `tx` vía `registrarEvento(tx, ...)` (`c5:44` D2, `c5:214`) — sin eso el gate no tiene "evidencia de disparo" (`c5:214`; `met:147`). A2-1 debe garantizar que la tabla `eventos` entra con esa regla de acceso.

---

## Lineage clave confirmado en la divergencia

**Cadena 1 — cotización → contrato → proyecto** (`c5:177-186`; FKs reales de `sch`):
`E-05` nace `proyectos`+`cotizaciones` (cotizaciones.proyectoId) → `E-11` `cotizaciones.estado=cotizado` → `E-12` nace `contratos` (contratos.proyectoId, `sch:176`) + `hitos_pago` → `E-51` identidad lead→cliente (`proyectos.clienteId`, `sch:93`) → `E-56` nace `obligaciones_pendientes` por hito (obligaciones.hito_id, `c4:176`). **La cadena se resuelve por FKs existentes + propuestas; el registro causal solo en `procedencia` (c5).**

**Cadena 2 — BOM → OC → recepción** (`c5:187-191`; `c1:152,162-165`; `c2:76`; `c4:152-158`):
`E-17` nace `bom_materiales.linajeItemId` → `items_variante` (linaje del material P3-05, `c1:152`) → `E-19` nace `ordenes_compra` (schemaId → schemas_proyecto) + `items_orden_compra` → `E-20` `movimientos_financieros.orden_compra_id` → `E-21` `recepciones` (ordenCompraId) + `recepcion_items` cuyo checklist C3 compara `cantidad_recibida`, `sin_defectos`, `catalogo_id` contra `items_orden_compra` (`c2:76`). **Confirmada en la divergencia con traza; re-verificación final contra A2-1 pendiente.**

---

## Eventos DIFERIDOS (capa 2 / t-034) correctamente marcados

| Evento | Marcación | Fuente |
|---|---|---|
| E-40 conversión offline | `DIFERIDO` t-034 (interfaces de frontera; `gclid` ausente en `sch:271-281`) | `def:174`; `c1:94` |
| E-42 medición de embudo | `DIFERIDO` t-034 + `N` (derivado, no se loguea) | `def:174`; `c5:163` |
| E-44 enganche tienda→producción | `DIFERIDO` construcción t-034 (huella de interfaz diseñada: `pedidos_web.engancheProduccion`) | `def:174`; `c1:104` |
| E-47 KPIs operativos | `DIFERIDO` t-034 + `N` (derivado) | `def:174`; `c5:164` |
| E-55 testimonio | `DIFERIDO` t-034 (huella: `testimonios`) | `def:174`; `c1:95` |
| E-22 detalle interno del taller | `DIFERIDO` capa 2 (solo fila de módulos es capa 1, B2) | `def:173`; `c1:45,175` |
| E-13 subsistema verificador de firma | `DIFERIDO` (construcción; huella sí: `firmas_contrato`) | `def:143`; `c2:209` |
| E-41 alojador R2 | `DIFERIDO` (elección Drive vs R2; huella sí: `documentos_proyecto.alojador`) | `c2:212`; `c1:227` |
| E-47 horas bienestar (V-5) | `DIFERIDO` capa 2 (módulo RRHH) | `c2:210`; `def:142` |

**Coherencia A1-5 vs A1-1:** A1-5 marca E-42/E-47 como `N` (derivados) y E-40 como `D` (`c5:148-164`); A1-1 los marca `DIFERIDO` (construcción t-034) (`c1:88,98,107`). **No hay contradicción**: son dos dimensiones distintas (derivado/no-logueado + construcción diferida). La marcación combinada es correcta.

---

## Hallazgos

| ID | Tipo | Descripción | Fuente (archivo:línea) |
|---|---|---|---|
| A2-3-H01 | `GAP_SCHEMA` (proceso) | A2-1 (`d3_schema_a2_1_normalizacion.md`, fuente primaria del pase) **NO EXISTE** en el repo ni en `git status`. La Ola 2 "necesita salidas de ola 1" y se lanzó sin ellas. Sin consolidado no hay verificación final; la matriz de este pase es checklist | `met:131,146-147`; ausencia verificada por glob `**/*a2_*` y `git status --porcelain` |
| A2-3-H02 | `GAP_SCHEMA` | Identidad lead→cliente ambigua: fusión `leads`→`clientes` (`c1:73,77`) vs mantener `leads`+`estado`+`cliente_id` FK (`c2:149-159`, `c5:49,175`). 8 eventos del embudo (E-01..E-04, E-49, E-50, E-51) sin huella estable | `c1:73,77`; `c2:149-159`; `c5:49,175`; `sch:271-281` |
| A2-3-H03 | `RUIDO_SCHEMA` (riesgo) | Tres tablas de auditoría en la divergencia sin unificar (`eventos_negocio` c1, `registro_actividad` c3, `eventos`+`procedencia` c5). A2-1 debe colapsarlas; `registro_actividad` queda RUIDO si no se fusiona en `eventos` | `c1:113`; `c3:166-175,218`; `c5:53-91` |
| A2-3-H04 | `GAP_SCHEMA` (riesgo de pérdida) | `procedencia` (lineage) existe SOLO en `c5`; ningún otro pase la propone. Si A2-1 consolida desde `c1`, se pierde la cadena causal escrita al nacer el dato (D3 `c5:46`) | `c5:80-94,46`; ausencia en `c1/c3/c4` |
| A2-3-H05 | `NORMALIZACION` (pendiente A2-1) | Pares de diseño duplicados para la misma huella: veredictos E-18/E-24 (3 diseños), modulos_armado/taller, cronogramas vs cronograma.tipo_linea, compensaciones/liquidaciones, comisiones/comisiones_proyecto, pagos_proveedor/movimientos, conversaciones.hora vs leads.primera_respuesta, citas.reagendaConteo vs leads.reagenda_count, parametros/parametros_compensacion | `c1:40,153,175,137,214,215`; `c2:78,123`; `c3:150`; `c4:219,244,152-158` |
| A2-3-H06 | `GAP_SCHEMA` | Entidad `notificacion` (E-27) sin tabla de dominio; el dato nace solo en `obligaciones_pendientes.fecha_notificacion`. Propuesta: `eventos.entidad='obligacion'` + payload, o tabla `notificaciones` | `c5:60,141`; `c1:211` |
| A2-3-H07 | `DIFERIDO` | 6 eventos de capa 2/t-034 correctamente marcados (E-40, E-42, E-44, E-47, E-55, E-22 detalle); + subsistema de firma y alojador R2 como DIFERIDOS de construcción con huella sí. Marcación combinada N+DIFERIDO coherente entre `c1` y `c5` | `def:173-174`; `c1:88,98,107,175`; `c5:148-164`; `c2:209-212` |
| A2-3-H08 | `GAP_SCHEMA` (proceso) | FKs propuestos por `c4` quedan huérfanos sin la convergencia: `movimientos_financieros.socio_id`→`personas`, `comisiones_proyecto.desfase_id`→`desfases`, `liquidaciones_compensacion.persona_id`→`personas` (`personas`/`desfases` existen solo como propuestas A1-3/A1-2/A1-1) | `c4:152,221,256,261`; `c3:64-66`; `c1:139` |
| A2-3-H09 | `CORRECCION_SCHEMA` (confirmado) | Lineage clave SÍ trazado en la divergencia: cotización→contrato→proyecto (E-05/E-11/E-12/E-51/E-56) y BOM→OC→recepción (E-17/E-19/E-20/E-21), vía FKs reales de `sch` + `procedencia` (c5). Re-verificación final pendiente contra A2-1 | `c5:177-198`; `c1:152,162-165`; `c2:76`; `c4:152-158`; `sch:93,176` |
| A2-3-H10 | `DECISION_PENDIENTE` | La huella final de los 8 eventos de lead (H02) depende de la decisión de identidad que corresponde a A2-1 (migración estructural sobre `sch:271-281`); este pase no puede cerrarla | `c1:73`; `c2:149`; `c5:175` |
| A2-3-H11 | `DECISION_PENDIENTE` | El veredicto de integración de auditoría (adoptar `eventos`+`procedencia`, colapsar `eventos_negocio`/`registro_actividad`) es recomendación; la decisión de consolidación es de A2-1 | `c5:53-91`; `c1:113`; `c3:166-175` |
| A2-3-H12 | `GAP_SCHEMA` | `gclid` ausente en `sch:271-281` (leads) y sin equivalente en `clientes` (`sch:77-87`): E-40 conversión offline requiere `clientes.gclid`/`conversiones_ads.gclid` (`c1:94`); construcción DIFERIDO t-034 | `sch:271-281,77-87`; `c1:94`; `inv:135` |

---

## Notas para el Orquestador

1. **Bloqueo de dependencia (acción #1):** A2-3 se lanzó sin la salida de A2-1. Verificar si A2-1 está ejecutándose en paralelo (su archivo debería aterrizar en `pasadas/`); **si A2-1 ya emitió su consolidado, A2-3 debe re-ejecutarse o re-auditar la matriz contra él** — este pase no puede dar el veredicto "61/61 huella en el consolidado" sin esa fuente. Si A2-1 sigue ausente, **no debe abrirse A2-5/A3** hasta resolverlo (`met:131-132`).
2. **La matriz de este pase es el checklist, no la verificación final:** 53 ✓ (candidatos contra divergencia A1) + 8 GAP (E-01, E-02, E-03, E-04, E-27, E-49, E-50, E-51) = 61. Los GAP no son eventos sin hogar (ninguno lo está en A1); son huellas **ambiguas o sin tabla de dominio** que A2-1 debe colapsar.
3. **Preguntas que este pase deja para A2-1 (decisión de normalización, no de negocio):** identidad lead (G-1, H02), veredictos E-18/E-24 (G-4), fila del taller (G-5), cronograma (G-6), compensación/comisiones (G-7), pago a proveedor + rama negativa E-20 (G-8), y los FKs huérfanos `personas`/`desfases` (H08).
4. **Recomendación de integración de auditoría:** adoptar `eventos`+`procedencia` de A1-5 (única propuesta que cumple el contrato de 61 + gates con evidencia + lineage), colapsar `eventos_negocio` y `registro_actividad` (`H03`). Esto también desbloquea el sustrato de E-42/E-47 sin tablas de KPI (`c5:247`).
5. **Para A3 (auditor final):** los goals duros de `met:147` (61/61 huella, 5 gates deterministas, 0 campos muertos) **no son auditables todavía** — dependen del consolidado A2-1. La matriz de este pase y los hallazgos H01-H12 son el insumo de esa auditoría.
6. **Prohibido cumplido:** ningún archivo fuera de `d3_schema_a2_3_trazabilidad.md` fue modificado; las únicas lecturas fueron las fuentes de la misión + `lib/db/schema.ts` para consistencia.

---

## Registro

- Fecha: 2026-08-04
- Pase: A2-3 (ola 2, lanzado en paralelo con A2-1..A2-5 — **A2-1 ausente al momento de ejecución**)
- Archivo de salida (único escrito): `arnes/diagnostico/pasadas/d3_schema_a2_3_trazabilidad.md`
- Loop de 3 iteraciones completado: 1 bruta → 2 autocrítica (2a-2e) → 3 refinamiento (D1-D6).
- Conteo: **61 filas** = 53 ✓ + 8 GAP (E-01, E-02, E-03, E-04, E-27, E-49, E-50, E-51). Todos los ✓ pendientes de confirmación contra el consolidado A2-1.
