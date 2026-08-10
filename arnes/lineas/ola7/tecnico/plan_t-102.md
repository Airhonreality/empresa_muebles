# Plan de Tarea: t-102

**Título:** Plan de implementación de Ficha Técnica del Catálogo (productos_atributos + marcas + campos_tecnicos_definicion) — Fase F10

**Fecha de creación:** 2026-08-09
**Diseño previo:** `arnes/lineas/ola7/archivo/disenio_ficha_catalogo.md`
**Decisión canónica:** `[POC/2026-08-09]` (Mini-Diamante Ficha Técnica)
**Estado:** APROBADO 2026-08-09 (Supervisor, con corrección: sin código en F0-F9)

---

## Objetivo

Este plan documenta el **camino de implementación** de la ficha técnica del catálogo para **F10 (Prototipo con mocks)**, derivado del diseño aprobado en `disenio_ficha_catalogo.md`. Las tablas reales (`marcas`, `productos_atributos`, `campos_tecnicos_definicion`) se implementan en F10, **sin DDL hasta aprobación explícita del Supervisor**. Antes de eso: contratos TypeScript + fixtures mock.

---

## Zona

**Zona afectada:** `datos`

---

## Tipo y Riesgo

**Tipo de tarea:** `Datos / schema / contrato`

**Riesgo calculado:** `alto`

**Frena al humano:** sí (checkpoint requerido en F10 para cada sub-fase: mock → tipos → schema → migración)

---

## Rule: F0–F9 NO escribe código

> **Regla canónica** (AGENTS.md:80-97 + estado_ola7.md:80): "Entre F0 y F9 NO se escribe código." Este plan es diseño pre-código. La fase de código real (F10) se ejecuta **después** de que el Supervisor apruebe explícitamente el plan completo de F10.

---

## Decisiones Previas (Contexto)

1. **t-075#2 (2026-08-05):** Ficha técnica NO es schema rígido (`ficha_tecnica_json`). En su lugar: ficha del proveedor (URL/PDF + imagen) + campos personalizados por ítem guiados por `campos_tecnicos_definicion`.
2. **Mini-Diamante [POC/2026-08-09]:**
   - Agregar filas en REGISTRO para `marcas`, `productos_atributos`, `campos_tecnicos_definicion`.
   - `productos_atributos` (CLASE) y `espacios_artefactos` (INSTANCIA) no son acoplables.
   - Conexión opcional: FK NULLABLE desde `espacios_artefactos` → `productos_catalogo`.
3. **Corrección del Supervisor (2026-08-09):**
   - Este plan NO ejecuta `lib/db/schema.ts`, migraciones, ni seed real.
   - Todo código real ocurre en F10, **tras aprobación explícita**.

---

## Fases de implementación (ejecución exclusiva en F10)

### F10-A — Tipos y contratos (sin DDL)

**Archivos a CREAR:**
- `lib/data/types/ficha_tecnica.ts` — interfaces TypeScript para:
  - `Marca`
  - `ProductoAtributos`
  - `CampoTecnicoDefinicion`
- `lib/data/types/index.ts` — re-export barrel

**Criterios de aceptación:**
- `npx tsc --noEmit` 0 errores.
- `npx eslint .` 0 errores.
- Tipos alineados 1:1 con lo definido en `disenio_ficha_catalogo.md:3`.

### F10-B — Fixtures mock (sin DDL)

**Archivos a CREAR:**
- `lib/data/mocks/ficha_tecnica.ts` — datos mock con:
  - 3+ marcas (Blum, DeWalt, Bosch, con `proveedor_id` a mocks de proveedores existentes)
  - 5+ definiciones de campos técnicos por tipo (electrodoméstico, estufa, tablero, bisagra, corredera)
  - 2+ productos_atributos mock (con `catalogo_id` apuntando a productos mock existentes)

**Criterios de aceptación:**
- `npx tsc --noEmit` 0 errores (tipos mock vs interfaces).
- `npx eslint .` 0 errores.
- Cada fixture tiene datos verificables contra `disenio_ficha_catalogo.md:3.b` (ej: electrodoméstico.voltage = number, tablero.espesor = number).

### F10-C — Schema real (con DDL, post-aprobación explícita)

**Archivos a MODIFICAR (solo en F10, con checkpoint previo):**
- `lib/db/schema.ts` — agregar tablas:
  - `marcas`
  - `productos_atributos`
  - `campos_tecnicos_definicion`
- `drizzle/` — nueva migración (número secuencial)

**Archivos a VERIFICAR (sin modificar):**
- `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (ya actualizado)
- `arnes/nucleo/glosario_h07.md` (ya actualizado)
- `arnes/nucleo/logica_de_negocio.md` (ya actualizado)

**Criterios de aceptación:**
- `npx tsc --noEmit` 0 errores.
- `npx eslint .` 0 errores.
- `npm run db:migrate` limpio en `dev-local` (con DATABASE_URL de dev-local).
- Tablas `marcas`, `productos_atributos`, `campos_tecnicos_definicion` existen en BD tras migración.

### F10-D — Seed básico (con DDL, post-migración)

**Criterios de aceptación:**
- Seed inserta ≥3 marcas, ≥5 definiciones de campos, ≥2 productos_atributos.
- Round-trip: insertar, leer y actualizar un `productos_atributos` con `campos_personalizados_json` sin pérdida.
- Integridad referencial: FKs a `productos_catalogo` y `marcas` válidas, sin FK huérfanos.

---

## Esquema objetivo (documentado, no ejecutado en F0-F9)

### `marcas`
| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | uuid PK | defaultRandom |
| `nombre` | varchar | UNIQUE, NOT NULL |
| `proveedor_id` | uuid FK→proveedores | NOT NULL |
| `categoria` | varchar | nullable |

### `productos_atributos`
| Campo | Tipo | Constraints |
|-------|------|-------------|
| `catalogo_id` | uuid PK FK→productos_catalogo | UNIQUE, NOT NULL (1:1) |
| `marca_id` | uuid FK→marcas | nullable |
| `modelo_fabricante` | varchar | nullable |
| `ancho_mm` | integer | nullable, CHECK > 0 |
| `alto_mm` | integer | nullable, CHECK > 0 |
| `profundo_mm` | integer | nullable, CHECK > 0 |
| `peso_g` | integer | nullable, CHECK > 0 |
| `material` | varchar | nullable |
| `ficha_proveedor_url` | varchar(1024) | nullable |
| `ficha_proveedor_imagen_url` | varchar(1024) | nullable |
| `campos_personalizados_json` | jsonb | nullable (ej: `{"voltage": 220}`) |
| `unidad_compra` | varchar(20) | nullable |

### `campos_tecnicos_definicion`
| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | uuid PK | defaultRandom |
| `tipo_item` | varchar | NOT NULL |
| `campo_clave` | varchar | NOT NULL |
| `etiqueta` | varchar | NOT NULL |
| `tipo_dato` | enum | `number` / `text` / `enum` / `boolean` |
| `opciones_json` | jsonb | nullable (opciones si tipo_dato='enum') |
| `requerido` | boolean | NOT NULL, DEFAULT false |
| `unidad` | varchar | nullable |

---

## Verificación (por fase F10)

| Comando | Fase | Criterios que verifica |
|---------|------|------------------------|
| `npx tsc --noEmit` | F10-A, F10-B, F10-C | Tipos válidos, schema compila |
| `npx eslint .` | F10-A, F10-B, F10-C | Estilo consistente |
| `npm run db:migrate` | F10-C (solo) | Migración ejecutable |
| `npm run db:seed` | F10-D (solo) | Seed de datos |
| `grep "marcas\|productos_atributos\|campos_tecnicos_definicion" arnes/nucleo/REGISTRO_DE_ENTIDADES.md` | Pre-flight | Alineación REGISTRO (ya OK) |

---

## Qué NO Incluye Este Plan

- **NO incluye:** UI de administración de fichas técnicas (parte de F2/P-04).
- **NO incluye:** Lógica de negocio compleja (ej: validación de compatibilidad entre materiales y acabados).
- **NO incluye:** Migración de datos legacy (fase de backfill, plan separado).
- **NO incluye:** Integración con BOM, Compras, o 3D (planes separados).
- **NO incluye:** Modificación de `espacios_artefactos` (ya existe, solo alineado en REGISTRO).
- **NO ejecuta código en F0-F9.** Todo el desarrollo real es en F10.

---

## Preguntas Abiertas

No hay preguntas abiertas.
- Diseño cerrado: `disenio_ficha_catalogo.md`
- REGISTRO alineado: `REGISTRO_DE_ENTIDADES.md` §2
- Glosario alineado: `glosario_h07.md` §A (Ficha técnica, Artefacto de espacio, Determinante de diseño)
- Lógica alineada: `logica_de_negocio.md` (reflexión CLASE vs INSTANCIA)

---

## Aprobación del Plan

- **Revisor:** Javier (Supervisor)
- **Fecha de aprobación:** 2026-08-09
- **Estado:** APROBADO (con corrección: sin código en F0-F9; ejecución real en F10)

**Observaciones del revisor:**
> El diseño del mini-diamante aprueba 20/20. El plan de ejecución se ajustó para cumplir con la regla F0-F9 (solo diseño, sin código). Todo código real (schema, migraciones, seed) queda para F10, tras aprobación explícita del Supervisor.

---

## Referencias

- Diseño: `arnes/lineas/ola7/archivo/disenio_ficha_catalogo.md`
- Hallazgo: `arnes/lineas/ola7/archivo/hallazgo_ficha_tecnica_no_materializada.md`
- REGISTRO: `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§2 Catálogo)
- Glosario: `arnes/nucleo/glosario_h07.md` (nuevos términos)
- Lógica: `arnes/nucleo/logica_de_negocio.md` (reflexión CLASE vs INSTANCIA)
- Decisión t-075: `arnes/lineas/ola7/tecnico/plan_t-075.md`
