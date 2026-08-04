# Diseño de pantallas consolidado del Diamante 3 (entregable final de Fase B)

**Rol:** Orquestador (consolida, met:15). **Salida de la Ola 6** (met:135): B5 (auditor final) + este consolidado.
**Objeto:** diseño de alto detalle de las **34 pantallas core** (26 admin + 8 frontstage) resultante de B1 (investigación) → B2 (destilación) → B3 (divergencia de pantallas) → B4 (auditoría de 4 lentes) → B5 (auditoría final APROBADA), listo para que el desarrollador codifique cada pantalla sin releer otra fuente (met:123).
**Fuentes consolidadas:** `d3_ui_b1_1_ux_ergonomia.md` (28 principios) · `d3_ui_b1_2_responsive_design.md` (3 breakpoints) · `d3_ui_b1_3_inv_clasificacion.md` (Familia A/B) · `d3_ui_b2_1_destilacion_inv.md` (40 reglas R01-R40) · `d3_ui_b2_2_pantallas_requeridas.md` (34 pantallas, matriz roles×pantallas, 61/61 cobertura) · `d3_ui_b3_1..b3_5` (34 especificaciones × 8 secciones) · `d3_ui_b4_1..b4_4` (auditorías APROBADAS) · `d3_ui_b5_auditor.md` (veredicto APROBADO) · `d3_schema_consolidado.md` (65 tablas, predicados de gates §6).
**Verificación mecánica:** `git status --porcelain` confirma que ningún pase del Diamante 3 tocó código vivo (`app/`, `lib/`). Este entregable es diseño (documento), no código.

---

## Veredicto de la auditoría B5 (vinculante)

**APROBADO** contra los goals duros de `diamante3_metodologia.md:152`:

| Goal duro | Resultado B5 |
|---|---|
| 100% de pantallas con detalle según contrato | **34/34 core** (26 admin + 8 frontstage), 8 secciones por pantalla; 5 soporte conservadas (P-27..P-31) |
| 100% de gates con UI | **5/5 `DETERMINISMO_OK`** (E-18/E-21/E-24/E-33/E-20), 0 `DETERMINISMO_ROTO` |
| roles × gates | **5/5** con dueño de rol único consistente; matriz roles×pantallas coherente |
| 0 ambigüedad | **6 PANTALLA_AMBIGUA resueltas** en B3; tienda = frontera DIFERIDO documentada |
| UX destilado | **28 principios + 40 reglas + Familia A/B + 3 breakpoints + a11y** cubiertos |

---

## Inventario de pantallas (34 core)

### Familia B3-1 — Embudo comercial + cotizador (9)

| ID | Pantalla | Ruta | Eventos | Gate | Fuente |
|---|---|---|---|---|---|
| P-01 | Embudo comercial (kanban) | `/app/erp/comercial` (extiende) | E-01..E-04, E-49..E-51 | — | b3_1 |
| P-02 | Ficha de lead/cliente | `/app/erp/comercial/[clienteId]` (nuevo) | E-02..E-04, E-07, E-46, E-49..E-51 | — | b3_1 |
| P-03 | Agenda/calendario | `/app/erp/calendario` (extiende) | E-06, E-07, E-46 | — | b3_1 |
| P-04 | Cotizador (+ diseño 3D + estimación) | `/app/erp/cotizador` (extiende) | E-05, E-09..E-11, E-48, E-52, E-08 | — | b3_1 |
| P-05 | Contratos + firma + cambios + viajes | `/app/erp/contratos` (extiende) | E-12, E-13, E-16, E-53 | — | b3_1 |
| F-01 | Landing + lead | `/` | E-01 | — | b3_1 |
| F-02 | Propuesta pública | `/propuesta/[proyectoId]` (extiende) | E-09 | — | b3_1 |
| F-03 | Agendar cita | `/agendar` (extiende) | E-06 | — | b3_1 |
| F-08 | Pago diseño 3D (embebido en F-02) | paso en `/propuesta/[proyectoId]` | E-08 | — | b3_1 |

### Familia B3-2 — Control de cronograma + gates (7)

| ID | Pantalla | Ruta | Eventos | Gate | Fuente |
|---|---|---|---|---|---|
| P-06 | Proyectos + mapa de gates (sumidero) | `/app/erp/proyectos` (nuevo) | E-14, E-05, E-51, E-59, E-34 | 5 gates + E-23 señal (estado + deep link) | b3_2 |
| P-07 | Retoma de medidas | `/app/erp/proyectos/[id]/retoma` (nuevo) | E-15, E-41, E-16 | — | b3_2 |
| P-08 | Desarrollo/schema (BOM + E-18 + integraciones) | `/app/erp/proyectos/[id]/desarrollo` (nuevo) | E-17, E-18, E-54, E-38, E-39 | **E-18** | b3_2 |
| P-09 | Cronograma doble | `/app/erp/cronograma` (nuevo) | E-14, E-33, E-52, E-59, E-60 | **E-33** | b3_2 |
| P-10 | Novedades críticas (SLA 5-24h) | `/app/erp/cronograma/novedades` (nuevo) | E-34 | — | b3_2 |
| P-11 | Check 15 días (3 desenlaces) | `/app/erp/proyectos/[id]/check-15-dias` (nuevo) | E-59 | — | b3_2 |
| P-12 | Equipo / verificador | `/app/erp/equipo` (extiende) | designa E-18/E-24 | infra | b3_2 |

### Familia B3-3 — Compras + taller + calidad + entrega (7)

| ID | Pantalla | Ruta | Eventos | Gate | Fuente |
|---|---|---|---|---|---|
| P-13 | Compras (3 mecánicas) | `/app/erp/compras` (nuevo) | E-19, E-20 (dispara), E-45 | guard E-18 | b3_3 |
| P-14 | Recepción (triple verificación) | `/app/erp/compras/[ocId]/recepcion` (nuevo) | E-21, E-54 | **E-21** | b3_3 |
| P-15 | Herramientas/reposición | `/app/erp/compras/herramientas` (nuevo) | E-45 | — | b3_3 |
| P-16 | Fila del taller (capa 1) | `/app/erp/taller` (extiende) | E-22, E-44 | — | b3_3 |
| P-17 | Calidad: citación + veredicto | `/app/erp/calidad` (nuevo) | E-23, E-24, E-54 | **E-24** (E-23 señal) | b3_3 |
| P-18 | Instalación (rango 5 días) | `/app/erp/instalaciones` (nuevo) | E-25, E-54 | guard E-24 | b3_3 |
| P-19 | Acta de entrega digital | `/app/erp/instalaciones/[id]/acta` (nuevo) | E-26 | — | b3_3 |

### Familia B3-4 — Finanzas + compensación (4)

| ID | Pantalla | Ruta | Eventos | Gate | Fuente |
|---|---|---|---|---|---|
| P-20 | Caja (caja real derivada) | `/app/erp/finanzas` (extiende) | E-20, E-43, E-08, E-28, E-57 | **E-20** | b3_4 |
| P-21 | Obligaciones y cobros | `/app/erp/finanzas/obligaciones` (nuevo) | E-56, E-27, E-28, E-29, E-30 | — | b3_4 |
| P-22 | Compensación y comisiones | `/app/erp/finanzas/compensacion` (nuevo) | E-31, E-32, E-35, E-57, E-58 | — | b3_4 |
| P-23 | Dashboard contador | `/app/erp/finanzas/contador` (nuevo) | E-28 (estado cobros) | — | b3_4 |

### Familia B3-5 — Cliente/portal + documentación (7)

| ID | Pantalla | Ruta | Eventos | Gate | Fuente |
|---|---|---|---|---|---|
| P-24 | Pedidos web (admin) | `/app/erp/pedidos` (extiende) | E-44 | — | b3_5 |
| P-25 | Garantía (3 secciones) | `/app/erp/garantia` (nuevo) | E-36, E-37, E-61 | — | b3_5 |
| P-26 | Documentación por etapa | `/app/erp/proyectos/[id]/documentacion` (nuevo) | E-41 | — | b3_5 |
| F-04 | Tienda: catálogo | `/tienda` (frontera DIFERIDO) | E-44 | — | b3_5 |
| F-05 | Tienda: ficha | `/tienda/[sku]` (frontera DIFERIDO) | E-44 | — | b3_5 |
| F-06 | Tienda: checkout | `/tienda/checkout` (frontera DIFERIDO) | E-44 | — | b3_5 |
| F-07 | Portal del cliente | `/cuenta/proyectos` (extiende) | E-60, E-26, E-36, E-28, E-55 | — | b3_5 |

**Soporte conservado (no rediseñado):** P-27 Catálogo · P-28 Proveedores · P-29 Portfolio · P-30 Perfil · P-31 Prefabricados.
**DIFERIDO (t-034):** P-32 KPIs · P-33 Testimonios · F-04/F-05/F-06 construcción de tienda.

---

## Gates (5) — predicados y pantalla

| Gate | Predicado (`sch_c:211-215`) | Pantalla | Ejecutor | Veredicto |
|---|---|---|---|---|
| E-18 | `P18(p) = estado='desarrollo' ∧ verificaciones tipo_gate='schema' aprobado ∧ verificador_id=p.verificador_id ∧ creado_en ≥ fecha_entrada_desarrollo` | P-08 | comercial (verif. único) | `DETERMINISMO_OK` |
| E-21 | `P21(r) = check_pedido_bien ∧ check_despacho_bien ∧ ¬∃item(recibido_cantidad<cantidad ∨ sin_defectos≠TRUE)` | P-14 | desarrollador | `DETERMINISMO_OK` |
| E-24 | `P24(p) = estado='armado' ∧ citación citada ∧ verificaciones tipo_gate='calidad' aprobado ∧ verificador_id=p.verificador_id ∧ creado_en ≥ citado_en` | P-17 | comercial (verif. único) | `DETERMINISMO_OK` |
| E-33 | `P33(p) = ∃desfase aplicado ∧ causa∈{interna,externa,cambio_contrato} ∧ motivo>0 ∧ composicion_causal>0` → recálculo SOLO `linea='interna'` | P-09 | gerente/comercial | `DETERMINISMO_OK` |
| E-20 | `caja_disponible = Σ saldo_actual − Σ por_pagar(pendiente,atrasada)(monto_total−monto_pagado) ≥ monto_pago` (bloqueante) | P-20 (+P-13 dispara) | gerente | `DETERMINISMO_OK` |

---

## Reglas transversales aplicadas (muestra de las 40 — reg:R01-R40)

| Regla | Aplicada en |
|---|---|
| R05 matemática en servidor | P-04, P-20, P-22 |
| R07 verificación humana | P-08, P-09, P-20 |
| R10 CTA prominente | P-17 |
| R12 constraints | P-14 (checklist C3) |
| R16 gates con guard visible | P-08, P-09, P-14, P-17, P-18, P-20 |
| R18 confirmación destructiva | P-05, P-13, P-14, P-17, P-18, P-22, F-07 |
| R20 panel "Requiere tu decisión" | P-20 |
| R26 aislamiento `clienteId` | F-07 |
| R34 Familia A | P-13, P-14, P-16, P-20, P-21, P-22 |

---

## DECISION_PENDIENTE — RESUELTO (2026-08-04)

| ID | Decisión | Respuesta | Bloquea | Fuente |
|---|---|---|---|---|
| DP-02 | Rol `compras` tipado vs función del gerente (P-13) | **Rol tipado dedicado**, gerente = suma de roles | No | b4_2:H-B4-2-01 |
| DP-04 | Login del contador: ¿propio o vista sin sesión? (P-23) | **Cuenta propia**, invitación con rol pre-asignado | No | b4_2:H-B4-2-02 |
| DP (H8) | Transparencia por rol: qué ve el comercial de caja/cronograma | **Permisos sumativos**, diseñador aislado, comercial ve sus proyectos + leads entrantes | No | b4_2:H-B4-2-03 |
| DP (H12) | Pedidos anónimos en checkout de tienda (F-06) | **No anónimo**, cuenta obligatoria para checkout | No | b4_2:H-B4-2-04 |
| DP-06 | `base_comision_tamano` (valor_total vs subtotal IVA) | **Subtotal sin IVA** | No | b3_4:H-B3-4-02 |
| DP-09 | Alojador de docs (Drive vs R2) | **Drive para SKP/SDK; R2 para imágenes exportadas** | No | b3_5:H-B3-5-04 |
| DP-01 | Valores numéricos de compensación sin fuente | **Estimados dados como v1** (comisión 5%, tarifa 15k/6.5k, reducción 0.5%/día, etc.); pendiente confirmación contador para retención e IVA diseño | No | sch_c:251 |

**Total UI:** 7 decisiones resueltas (6 cerradas + 1 con valores estimados pendientes de confirmación contable). Ninguna bloquea el corte.

---

## Notas para el Orquestador (Ola 7)

1. **Checkpoint humano:** Fase 0 completada. 14/16 decisiones cerradas. 2 pendientes de confirmación contable (A-01). 5 mini-diamantes abiertos (M-01 a M-05, no bloquean). Documentación en `fase2_ronda3_decisiones_respondidas.md`.
2. **Próximo trabajo de código:** Ola 7 (Execute) — codificar cada pantalla sobre el consolidado (el schema se migra con el plan de 4 fases; los gates se evalúan en servidor con atomicidad `eventos`+mutación).
3. **Fronteras DIFERIDO que NO se construyen ahora:** tienda (F-04/F-05/F-06), KPIs (P-32), testimonios (P-33), facturación DIAN (`facturas`), detalle interno del taller (`tareas_produccion`), subsistema de firma digital (wizard, no módulo).
4. **Patrón de implementación exigido (b4_3):** atomicidad `eventos`+mutación en tx, evaluación de gates en servidor, caja derivada en servidor (nunca cliente), componentes 'use client' separados de Server Components.

## Registro

- Fecha: 2026-08-04 · Ola 6 (auditor final B5 + consolidado UI).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_consolidado.md`.
- Conteo: **34 pantallas core** · **5/5 gates con UI deterministas** · veredicto B5 **APROBADO**.
- DECISION_PENDIENTE: **7 decisiones resueltas** (2026-08-04). 6 cerradas + 1 con valores estimados pendientes de confirmación contable. Ninguna bloquea el corte.
- Fase 0 completada. Ola 7 (Execute) lista para iniciar.
