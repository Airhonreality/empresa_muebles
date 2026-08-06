# Plan de Convergencia: Integración de Eslabones F2/F3 faltantes en V3

**Título:** Validar decisión por decisión (loop 5 capas) y converger los 2 eslabones faltantes (público + cronograma) al arnés de la V3, antes de cerrar la línea de proceso.

**Fecha de creación:** 2026-08-06

---

## Objetivo

Integrar en el arnés de la V3 (rama `dev`) los dos eslabones de diseño que quedaron fuera de él — la destilación del público (E1: F-02/F-03/F-08) y el cierre F3 de cronograma (E2: P-06..P-12) — validando cada decisión en las 5 capas (invaración → lógica de negocio → fase schema → flag/registro → veredicto) y reportando los conflictos decisionales al Supervisor. **No es un port de texto.** Es una convergencia verificada.

## Zona

**Zona afectada:** `arnes/` (macro) — método y trazabilidad de cierre F2/F3. Las decisiones que toquen schema (E1 vs FLAG-4, E2 schema cronograma) desbordan a la zona de datos en Ola 7, pero aquí solo se valida y registra, no se ejecuta código.

## Tipo y Riesgo

**Tipo de tarea:** `mutacion_arnes`
**Riesgo calculado:** `alto` (decidir divergencias de schema y registrar como mutación del arnés; requiere checkpoint Supervisor)

---

## Archivos Afectados

- `arnes/planes/plan_convergencia_eslabones.md` (este plan)
- `arnes/planes/destilacion_f3_publico.md` (port validado del eslabón E1)
- `arnes/estado.md` (agregar sección F2/F3 integrada en V3)
- `arnes/planes/disenio_f3_cronograma_gates.md` (referencia E2, ya en V3)
- `arnes/diagnostico/OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` (no se modifica, solo se lee para validar E1-1)
- `arnes/trazabilidad/{chequeo_convergencia_e1.md, chequeo_convergencia_e2.md}` (evidencia del loop)

## Criterios de Aceptación

1. Cada decisión listada (E1-1..E1-7, E2-1..E2-7) tiene una fila en el chequeo con veredicto `APROBADA` o `CON_CONFLICTO`.
2. Todo `CON_CONFLICTO` tiene reporte: decisión, capa donde revienta, divergencia exacta y pregunta al Supervisor.
3. El `estado.md` de V3 actualiza a "F2/F3 reconciliado en V3".
4. No hubo copia textual sin validación: los archivos de evidencia son 1:1 con las decisiones.

## Comandos de Verificación

- `git -C <v3> diff --stat` (qué se movió al commitear).
- `npx tsc --noEmit` (0) — si el eslabón toca schema futuro, se valida contra el contrato, no compilándolo aún.
- Revisión manual del chequeo: cada filta con veredicto y referencia.

## Qué NO incluye

- No incluye codificar Ola 7 ni migrar tablas.
- No incluye ejecutar el port físico (convergencia = registro validado, no copia de archivos de texto).
- No incluye tocar `main` ni `legacy-nomeless-backup`.
- La pregunta de categoría lookup (E1-1) se resuelve antes de dar por cerrado el eslabón.

## Preguntas Abiertas (para el Supervisor, durante la ejecución)

- E1-1: ¿`categorias_producto` es lookup (tabla maestra) o VARCHAR libre? FLAG-4 dice VARCHAR. → decide Javier.
- E1-2: ¿`disponibilidad` enum vs derivado de `inventario_disponible`+`visible_en_tienda`?
- E1-E2 F-08: confirmar permanece `pausado hasta F7` (viewer 3D) — no entra a F1 cierre.
- E2-4/5: confirmar `espacios_artefactos` como tabla nueva y `retoma_` SLA en `parametros`.

## Aprobación

- **Revisor:** Javier (Supervisor)
- **Fecha:** 2026-08-06
- **Estado:** `aprobado`

**Observaciones:** El Supervisor aprobó el diamante de validación como metodología oficial y autorizó la ejecución del loop por cada eslabón, reportando conflictos decisionales y no haciendo port ciego de texto.

---

## Ejecución del Loop — Eslabón E1 (Público)

> Detalle por decisión (E1-1..E1-7) consignado en `arnes/trazabilidad/chequeo_convergencia_e1.md`.

### Resumen de ejecución (a completar)

| ID | Decisión | Capa falla | Veredicto | Referencia |
|---|---|---|---|---|
| E1-1 | schema `productos_tienda` + `categorias_producto` lookup | schema (vs FLAG-4) | 🔴 CON_CONFLICTO | FLAG-4: categoria_tienda VARCHAR, sin lookup |
| E1-2 | `disponibilidad` enum + `precio_publico` | schema (vs FLAG-4) | 🔴 CON_CONFLICTO | FLAG-4: inventario_disponible + valor_tienda |
| E1-3 | server projection (no id/costo/stock) | negocio | 🟢 APROBADA | t-007 / plan_arquitectura:155 |
| E1-4 | zona fija Bogotá + orden destacado→orden | negocio | 🟡 REVISAR | I-049: geografía = portafolio real, hay barrio |
| E1-5 | `portafolio_proyectos` + `portafolio_imagenes` | schema | 🔴 CON_CONFLICTO | arnés conserva portfolio_publico/imagenes_portfolio |
| E1-6 | `snapshot` inmutable + MO derivada C1 + civil ref + F-08→F7 | negocio | 🟢 APROBADA | estado.md: F-08 NO EN F2 / F7 |
| E1-7 | C1/C4 precio_publico vs precio_directo vs valor_tienda | flag | 🔴 CON_CONFLICTO | FLAG-4: valor_unitario/valor_tienda |

## Ejecución del Loop — Eslabón E2 (Cronograma F3)

| EA | Decisión | Capa | Veredicto | Referencia |
|---|---|---|---|---|
| E2-1 | `cronogramas` base_semanas=7 | schema | 🔴 CON_CONFLICTO | d3_schema:78 base=4 semanas; logica_negocio:531 |
| E2-2 | `cronograma_etapas` doble línea | schema | 🟢 APROBADA | d3_schema:79, CF-04/P5-09 |
| E2-3 | `desfases_cronograma` +4 en `items_variante` | schema | 🟡 REVISAR | origen C2/C4 sin registrar en d3_schema |
| E2-4 | `proyectos` ampliada (estado 8, verificador, fecha) | schema | 🟢 APROBADA | d3_schema:56 coincide |
| E2-5 | `espacios_artefactos` + `retoma_` en parametros | schema | 🔴 CON_CONFLICTO | tabla no existe en d3_schema; retomas use `retomas`+`schemas_proyecto` |
| E2-6 | P18/P33 gates | flag | 🟢 APROBADA | d3_schema:214, E-18/E-33 |
| E2-7 | E-18 modular + SHA-256 SKP + fallback→gerente + F-08 decoupled | negocio | 🟢 APROBADA (checkpoint) | auditoría sesión; I-035 verificador único |

## ✅ Resolución final (2026-08-06)

**Metodología:** adoptar el **mejor diseño de schema** (FLAG-4 para catálogo; `base=4` para cronograma) y dejar **nota de migración inteligente** campo viejo→nuevo (`arnes/trazabilidad/nota_migracion_inteligente_campos.md`).

**E1:** converge adoptando FLAG-4 (categoria_tienda VARCHAR, visible_en_tienda, valor_tienda) + portafolio `portfolio_publico`/`imagenes_portfolio` (sin precios) + barrio. Veredictos en `chequeo_convergencia_e1.md`.

**E2:** converge con `base_semanas=4`, `items_variante`+4 campos, **`espacios_artefactos` agregado al schema** (código aplicado en `lib/db/schema.ts`, tsc 0 / eslint 0). Veredictos en `chequeo_convergencia_e2.md`.

**Estado:** 🔵 AMBOS ESLABONES CONVERGIDOS. Próximo: unicear obra/commit en `dev`.
