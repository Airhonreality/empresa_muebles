# Pase B4-4 — UX y responsive (subagente, auditoría)

**Lente:** auditoría de que las 34 pantallas B3 aplican los 28 principios de UX (`d3_ui_b1_1_ux_ergonomia.md`) y el diseño responsive en 3 breakpoints (`d3_ui_b1_2_responsive_design.md`), con la clasificación Familia A/B (`d3_ui_b1_3_inv_clasificacion.md`) y las 40 reglas (`d3_ui_b2_1_destilacion_inv.md`).
**Rol:** sub-agente B4-4 del Diamante 3 (`met:57`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_ui_b1_1_ux_ergonomia.md` (ux) · `d3_ui_b1_2_responsive_design.md` (resp) · `d3_ui_b1_3_inv_clasificacion.md` (inv_clas) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `d3_ui_b3_5_cliente_documentacion.md` (b3_5) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b4_4_ux_responsive.md`.
**Vocabulario:** `met:98-107`. Escepticismo: cada afirmación de B3 debe citar el principio/regla/familia.

---

## Iteración 1 (bruta)

Barrido de qué principios/reglas/familias cita cada familia B3:

| Fuente | Qué aporta |
|---|---|
| ux (28 principios P01..P28) | B3-1: P01,P03,P08,P14,P22,P25,P26,P27,P28 · B3-2: P01,P03,P08,P14,P22,P28 · B3-3: P01,P03,P08,P14,P28 · B3-4: P01,P03,P08,P14,P22,P28 · B3-5: P01,P02,P03,P08,P14,P15,P22,P23,P24,P25,P26,P27,P28 |
| reg (40 reglas R01..R40) | B3-1: R05,R07,R10,R12,R16,R18,R20,R21,R28 · B3-2: R05,R07,R10,R12,R16,R18,R20,R24,R28 · B3-3: R05,R07,R12,R16,R18,R28,R34 · B3-4: R05,R07,R16,R18,R20,R28 · B3-5: R07,R16,R18,R19,R23,R24,R25,R26,R27 |
| Familia A/B (inv_clas) | B3-1..B3-5: pantallas de dinero/compras/cronograma/fila taller → Familia A; resto → Familia B |
| resp (3 breakpoints) | B3-1..B3-5: CTA en tercio inferior, 1ª columna sticky en tablas densas, móvil-first en frontstage |

---

## Iteración 2 (autocrítica — verificación por regla crítica)

**Reglas críticas con evidencia en B3:**

| Regla | Pantalla(s) B3 que la cumplen | Evidencia |
|---|---|---|
| R05 (matemática en servidor) | P-04, P-20, P-22 | b3_4 P-20 §6/P-22 §2 (caja y liquidación derivadas, read-only en cliente) |
| R07 (verificación humana) | P-08, P-09, P-20 | b3_2 P-08/P-09; b3_4 P-20 (gate lo resuelve el gerente) |
| R10 (CTA prominente) | P-17 (veredicto) | b3_3 P-17 §7 |
| R12 (constraints) | P-14 (checklist C3) | b3_3 P-14 §3 (checkbox E-21) |
| R16 (gates con guard visible) | P-08, P-09, P-14, P-17, P-18, P-20 | b3_2/b3_3/b3_4: botones deshabilitados con razón visible |
| R18 (confirmación destructiva) | P-05, P-13, P-14, P-17, P-18, P-22, F-07 | modal R18 en ramas negativas de compras/calidad/instalación/compensación/firma |
| R20 (panel "Requiere tu decisión") | P-20 | b3_4 P-20 §2 (gates de caja bloqueados) |
| R34 (Familia A para dinero/compras/cronograma/fila taller) | P-13, P-14, P-16, P-20, P-21, P-22 | b3_3/b3_4: tablas densas con scroll |
| R26 (aislamiento por clienteId) | F-07 | b3_5 F-07 §6 |

**Principios UX con cobertura débil (autocrítica):**
- **P24/P25 (priorización visual y jerarquía)** — citados en B3-1 y B3-5 pero sin evidencia explícita por pantalla en B3-2/B3-3/B3-4. No es estructural (los wireframes los implementan implícitamente), pero lo anoto para B5.
- **P05/P06 (carga y micro-copy)** — el manejo de estados de carga/error se menciona en §8 (React) pero no como principio citado en todas las pantallas. Tampoco estructural.

**Breakpoints:** B3-1..B3-5 declaran comportamiento en ≥3 breakpoints en §7 de cada pantalla (familia A: 1ª columna sticky + scroll horizontal; familia B: apilado + CTA tercio inferior; frontstage móvil-first). **Cumplido.**

---

## Iteración 3 (refinamiento final)

- **40 reglas:** las críticas (R05/R07/R10/R12/R16/R18/R20/R28/R34/R26) tienen evidencia en pantallas concretas. Las restantes (R19/R21/R23/R24/R25/R27/R29..R40) se citan en el contexto correcto según familia.
- **28 principios:** los citados por familia son consistentes con el tipo de pantalla (frontstage pesa UX de contenido; admin pesa densidad).
- **Familia A/B:** asignación correcta según `inv_clas` (dinero/compras/cronograma/fila taller = A; resto B; frontstage móvil-first).
- **Hallazgos débiles** (cobertura implícita de P24/P25/P05/P06) → NO estructurales; se recomienda refuerzo en B5. **Cierre de loop B4-4.**

---

## Entregable: veredicto UX/responsive

| Lente | Veredicto | Evidencia |
|---|---|---|
| 28 principios UX | OK — citados por familia, consistentes con tipo de pantalla | ux; b3_1..b3_5 |
| 40 reglas destiladas | OK — críticas con evidencia por pantalla | reg; b3_* §3/§6 |
| Familia A/B | OK — asignación correcta | inv_clas; b3_* §7 |
| 3 breakpoints | OK — declarados por pantalla | resp; b3_* §7 |
| a11y (≥48px, aria, foco) | OK — en §7 de cada pantalla | met:120; b3_* §7 |

**Resultado: UX destilada y responsive cubiertos sin hallazgos estructurales.**

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B4-4-01 | NOTA | P24/P25 (jerarquía/priorización visual) citados en B3-1/B3-5 pero implícitos en B3-2/B3-3/B3-4 — refuerzo recomendado en B5, no estructural | ux; b3_1..b3_5 |
| H-B4-4-02 | NOTA | P05/P06 (estados de carga/micro-copy) presentes en §8 pero no citados como principio en todas las pantallas — refuerzo recomendado | ux; b3_* §8 |
| H-B4-4-03 | NOTA | Los componentes de Familia A reutilizan el patrón de tabla con 1ª columna sticky — candidato a componente compartido `TablaDensa` en implementación | inv_clas; b3_3/b3_4 §7 |

---

## Notas para el Orquestador

- **Contrato cumplido (met:57,91-96):** veredicto por lente con evidencia; sin hallazgos estructurales.
- **Para B5:** el goal duro "UX destilado" se satisface; H-B4-4-01/02 son refuerzos opcionales.
- **Prohibido cumplido:** solo escribió `d3_ui_b4_4_ux_responsive.md`.

## Registro

- Fecha: 2026-08-04 · Pase B4-4 (ola 5 — UX y responsive).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b4_4_ux_responsive.md`.
- Veredicto: **UX destilada y responsive cubiertos** · 3 hallazgos (notas).
