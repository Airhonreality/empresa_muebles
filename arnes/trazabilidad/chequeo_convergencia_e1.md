# Chequeo de Convergencia — Eslabón E1 (Público: F-02/F-03/F-08)

**Fecha:** 2026-08-06
**Loop:** 5 capas (invaración → lógica de negocio → fase schema → flag/registro → veredicto)
**Fuente del eslabón:** `arnes/planes/destilacion_f3_publico.md` (en clone-dev / port candidato)
**Referencias contraste (V3):** `d3_schema_consolidado.md`, `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md`, `estado.md` (F2), `t-007`, `inventario_legacy.md`

---

## Resultado del loop por decisión

| ID | Decisión del eslabón | Capa que valida | Evidencia contraste | Veredicto |
|---|---|---|---|---|
| E1-1 | Schema `productos_tienda` + tabla lookup **`categorias_producto`** | Fase schema + flag | FLAG-4 define `productos_tienda.categoria_tienda` como **VARCHAR(100)**, SIN tabla lookup. `d3_schema_consolidado` solo conserva `productos_catalogo`. | 🔴 **CON_CONFLICTO** |
| E1-2 | `disponibilidad` enum + `precio_publico` en tienda | Fase schema + flag | FLAG-4 usa `inventario_disponible` + `visible_en_tienda` + `valor_tienda`. No existe `disponibilidad` enum ni `precio_publico` compartido. | 🔴 **CON_CONFLICTO** |
| E1-3 | Server projection forzada (sin id/costo/stock) | Lógica de negocio | `t-007` ya exige proyección pública; `plan_arquitectura:155` ISR. Coherente. | 🟢 APROBADA |
| E1-4 | Zona fija `'Bogotá'` + orden destacado→`orden` | Lógica de negocio | I-049/I-021: geografía la decide el portafolio real (no fija); `portfolio_publico` tiene `barrio` (inventario_legacy:55). Fijar `'Bogotá'` **entra en conflicto** con el modelo de barrio del defido legacy. | 🟡 **REVISAR** |
| E1-5 | Schema `portafolio_proyectos` + `portafolio_imagenes` | Fase schema | El arnés V3 conserva `portfolio_publico` / `imagenes_portfolio` (t-007, t-026, contrato a2_4). Los nombres del eslón NO están en schema. | 🔴 **CON_CONFLICTO** (naming/vida) |
| E1-6 | Snapshot inmutable + MO derivada C1 + civil ref + F-08→F7 | Lógica + schema | F-08 pausado en F7: `estado.md` V3 confirma "F-08 NO EN F2 / sub-diamante F7". Coherente. | 🟢 APROBADA |
| E1-7 | C1/C4: `precio_publico` vs `precio_directo` vs `valor_tienda` | Flag/registro | El eslón habla de `precio_publico`/`precio_directo` que **FLAG-4 no usa** (usa `valor_unitario`/`valor_tienda`). | 🔴 **CON_CONFLICTO** (naming) |

---

## Conflictos a resolver con el Supervisor

1. **E1-1/E1-7 (naming y estructura de tienda):**
   - Eslón propone `productos_tienda` + `categorias_producto` (lookup) + `precio_publico`/`precio_directo`/`disponibilidad`.
   - FLAG-4 (aprobado en V3) define `productos_tienda.categoria_tienda` VARCHAR, `valor_tienda`, `inventario_disponible`, `visible_en_tienda`, y base `productos_catalogo` con `valor_unitario`.
   - → **Decisión:** ¿se mantiene el modelo FLAG-4 y el eslón se ajusta, o el eslón corrige FLAG-4? Recomendación: **mantener FLAG-4** (aprobado, axiomático 1:1), renombrar/alinear el eslón.

2. **E1-4 (zona):** eslón fija `'Bogotá'`; el modelo tiene `barrio` (I-049: geografía = portafolio real). → ¿fijar Bogotá o exponer `barrio`/`localidad`?

3. **E1-5 (naming portafolio):** eslón `portafolio_proyectos/_imagenes` vs arnés `portfolio_publico/imagenes_portfolio`. → ¿renombrar tablas al estándar del arnés (portfolio_*)?

**Conclusión parcial:** 3 de 7 decisiones sin conflictos (E1-3, E1-6) se aprueban; 3 en conflicto de naming/estructura (E1-1, E1-2, E1-7) y 1 en revisión (E1-4). El eslón NO se porta tal cual.

---

## ✅ Resolución final del Supervisor (2026-08-06) — adoptar el MEJOR schema

**Decisión:** se adopta **FLAG-4 como mejor diseño de schema destino** (especialización 1:1) y se deja **nota de migración inteligente campo viejo→nuevo** (`nota_migracion_inteligente_campos.md`). No es renombrar el eslón ni romper contrato: es migrar el contrato plano actual hacia el mejor modelo.

| ID | Resolución final |
|---|---|
| E1-1 | ✅ **ACOGER FLAG-4**: `categoria_tienda` VARCHAR (sin lookup `categorias_producto`). Nota migración: `categoria_comercial→categoria_tienda`. |
| E1-2 | ✅ **ACOGER FLAG-4**: `inventario_disponible`+`visible_en_tienda`; `disponibilidad` = derivado runtime. Nota: `stock_actual→inventario_disponible`, `publicado_web→visible_en_tienda`. |
| E1-3 | ✅ APROBADA. |
| E1-4 | ✅ ACOGER **barrio** (no fija Bogotá); I-049. |
| E1-5 | ✅ ACOGER arnés: `portfolio_publico`/`imagenes_portfolio` (sin precios, t-007). |
| E1-6 | ✅ APROBADA (F-08→F7). |
| E1-7 | ✅ ACOGER FLAG-4 naming destino + **nota de migración** (`precio_directo→valor_unitario`, `precio_publico→valor_tienda`). No rompe contrato; migra. |

**Estado eslabón E1:** 🔵 CONVERGIDO (migración inteligente documentada, adopción de mejor schema FLAG-4).