# Chequeo de Convergencia — Eslabón E2 (Cronograma F3: P-06..P-12)

**Fecha:** 2026-08-06
**Loop:** Metodología de 5 capas (invaración → negocio → schema → flag → veredicto)
**Fuente del eslón:** sección "F3 = COMPLETADA" de `estado.md` (en clone-dev; candidato a converger a V3)
**Referencias (V3):** `d3_schema_consolidado.md`, `disenio_f3_cronograma_gates.md` (ya en V3), `plan_ola7_maestro.md`, `log_insights_fase2.md`

---

## Resultado del loop por decisión

| ID | Decisión del eslón | Capa | Evidencia contrap (V3) | Veredicto |
|---|---|---|---|---|
| E2-1 | `cronogramas(id, proyecto_id, base_semanas=7, holgura_max_dias=5, promesa_semanas=7)` | Fase schema | `d3_schema_consolidado:78` define `cronogramas` con **base 4 semanas** (a2_1:148, promesa 7). Eslrón usa `base_semanas=7` → **divergente con schema**. | 🔴 **CON_CONFLICTO** |
| E2-2 | `cronograma_etapas` doble línea (contractual/interna) | Fase schema | `d3_schema_consolidado:79` coincide (`linea ∈ {contractual,interna}`, CF-04, P5-09). | 🟢 APROBADA |
| E2-3 | `desfases_cronograma` +4 campos en `items_variante` | Fase schema | `d3_schema_consolidado:80` define `desfases_cronograma` (causa, composicion_causal, aplicado). Ladate +4 campos en items_variante **no aparece** ahí (viene de C2/C4). | 🟡 REVISAR (origen C2) |
| E2-4 | `proyectos` ampliada (estado 8, verificador_id, fecha_entrada_desarrollo, comercial_vendedor) | Fase schema | `d3_schema_consolidado:56` coincide (`+verificador_id`, `+fecha_entrada_desarrollo`, `+comercial_vendedor_id`, enum 8). | ✅ APROBADA |
| E2-5 | P-07 tabla **`espacios_artefactos`** + mapeo `retoma_*` en parametros | Fase schema | **La tabla `espacios_artefactos` NO existe** en `d3_schema_consolidado` (grep: 0). El márm de `retomas` E-15/E-16 usa `retomas` + schemas_proyecto (a2_1:159-160). | 🔴 **CON_CONFLICTO** (tabla nueva no registrada) |
| E2-6 | Predricados P18/P33 (E-18, E-33) | Flag/gates | `d3_schema_consolidado:214` define P33 match; E-18 P18 coherente con `verificaciones` E-18. | ✅ APROBADA |
| E2-7 | P-08 E-18 modular (E-18.1/18.2/18.3) + hash SHA-256 SKP + fallback verificador→gerente + decouplar F-08 | Lógica/gates | Recomendación de auditoría crítica (no en schema). Decisión de negocio del Supervisor aprobada en sesión. Coherente con I-035 verificador único. | ✅ APROBADA (bajo checkpoint) |

---

## Conflictos a resolver

1. **E2-1 (base_semanas):** eslón `base_semanas=7` vs schema `base 4 semanas + holgura 5 + promesa 7`. Doce source: `logica_de_negocio`:531 confirma base 4. → **Decisión: 4 o 7?** Recomendado: **mantener 4** (schema + lógica de negocio), eslón se alinea.
2. **E2-5 (espacios_artefactos):** tabla nueva sin registrar en schema. → ¿se agrega a schema (tarea Ola 7) o se deriva de retomas/schemas_proyecto ya existentes? Requiere decisión Supervisor.
3. **E2-3 (origen C2/C4):** +4 campos en `items_variante` → convalido contra el diamante de contradicciones C2; si C2 ya resolvió items refeenciales en `items_variante`, confirmar cuentes campos.

**Conclusión:** 4 de 7 aprobadas (E2-2, E2-4, E2-6, E2-7). A resolver: E2-1, E2-3, E2-5.

---

## ✅ Resolución final del Supervisor (2026-08-06)

| ID | Resolución final |
|---|---|
| E2-1 | ✅ ACOGER `base_semanas=4` (mejor schema: d3_schema:78 + logica_negocio:531). Eslón corregido. |
| E2-2 | ✅ APROBADA (doble línea). |
| E2-3 | ✅ ACOGER: `items_variante` +4 campos C2/C4, registrado para Ola 7. |
| E2-4 | ✅ APROBADA (`proyectos` ampliada). |
| E2-5 | ✅ **ACOGER + AGREGAR `espacios_artefactos` al schema** (tabla nueva, decisión Supervisor). Esquema en `nota_migracion_inteligente_campos.md` §3. |
| E2-6 | ✅ APROBADA (P18/P33). |
| E2-7 | ✅ APROBADA (checkpoint). |

**Estado eslabón E2:** 🔵 CONVERGIDO (espacios_artefactos agregado, base_semanas=4, migración documentada).