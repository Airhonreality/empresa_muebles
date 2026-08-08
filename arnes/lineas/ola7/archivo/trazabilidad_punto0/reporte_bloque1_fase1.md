# Reporte Bloque 1 — Fase 1: Auditoría de dispersión del schema (subagente)

> **Nota (2026-08-07):** la recomendación de este reporte menciona `DESTINO_SCHEMA_AUTORITATIVO.md`. Ese archivo fue creado y posteriormente renombrado a `REGISTRO_DE_ENTIDADES.md`. Este reporte es registro histórico (§2.C ARNES_AGENTICO).

**Estado:** CERRADO, entregado 2026-08-07 (completado). Entrada a la Fase 2.
**Subagente:** ses_022fb871dffem4UExYlPPCMnSE (explore). Reproducible leyendo los archivos citados.

---

## Veredicto: FRAGMENTADO (sin destino único)

El registro de schemas NO vive en un solo documento. Está disperso en 12+ archivos sin jerarquía explícita.

## Canones paralelos detectados (3)

1. **Núcleo transaccional (65 tablas)** — `arnes/diagnostico/pasadas/d3_schema_consolidado.md` y `a2_1`.
2. **Catálogos de Ola 6** — `OLA_6_SCHEMAS_APROBADOS.md`, `OLA_6_FLAG4_*`, `OLA_6_METODOLOGIA_GRAFOS.md`.
3. **Decisiones nuevas (D-2026-08-07*)** — `planes/plan_f4.md`, `plan_f5.md`, `disenio_modulo_espacio.md`, `plan_t-075.md`.

Sin nodo acordado entre ellos → el destino autoritativo es incierto.

## Verificabilidad

- Solo el subconjunto **F0 / legacy (~27 tablas)** se puede verificar contra `lib/db/schema.ts`.
- Las **47 tablas diseñadas** no existen en código (esperado: F0–F9 aún no codifica) → verificables solo contra las fuentes de diseño (`.md`).
- Contraste: el conteo "18 vivas" declarado en `d3_schema_consolidado.md` no coincide con las **27 reales** en dev-local.

## Inconsistencias de naming reales (con cita en el reporte original)

| Conflicto | Fuentes enfrentadas |
|---|---|
| `recepciones` vs `recepciones_material` | OLA_6 vs consolidado |
| `proyectos.estado` — 3 sets distintos | gates vs consolidado vs diseño |
| `ordenes_compra.estado` — 7 vs 4 | fuentes OLA_6 divergentes |
| `veredictos_calidad` vs `verificaciones.tipo_gate` | módulo calidad |
| acabados: `catalogo_acabados` / `catalogos_acabados` / `producto_acabados` | OLA_6_grafos vs consolidado vs módulo |
| `modulos_armado` vs `modulos` | taller vs módulo jerárquico (D-2026-08-07-C) |
| SLA: `materiales_insumos.tiempo_entrega_dias` / `proveedores.dias_entrega_default` / `catalogo_proveedor.sla_dias` | 3 sitios |
| `audit_logs` (código) vs `eventos+procedencia` (canon) | código vs canon |
| OLA_6_SCHEMAS_APROBADOS vs FLAG4 — ambas "aprobado" | categorías de canon sin resolver |

## Recomendación (a validar en Fase 2)

Crear **`arnes/diagnostico/DESTINO_SCHEMA_AUTORITATIVO.md`**:
- Tabla compacta por tabla: `schema | nombre natural | razón de existir / función en el sistema | relaciones`.
- Regla declarada: **"si este documento difiere de cualquier otra fuente, gana este"**.
- Checklist de alto nivel humano (65+ tablas en una vista).
- Converger las 4 familias de conflictos anteriores bajo una sola denominación.

## Método/contrato para la siguiente fase

- Seguir `arnes/diagnostico/trazabilidad_punto0/proceso_trazabilidad.md` §3b (el subagente **decide los lotes** y la **ruta**, no se impone nº).
- Cada lote se traza bajo R1-R4 (§2) en Bloque 2.
- La base del canon la dan los planes D-2026-08-07* (DESTINO autoritativo) + proceso de trazabilidad + Ciclo H explicado en `planes/plan_hygiene_herlic_h.md`.