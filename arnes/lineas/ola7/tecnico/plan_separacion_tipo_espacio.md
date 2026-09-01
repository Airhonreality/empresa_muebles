# Plan: Portafolio — Flujo de Uso (Wizard), Categoría de Landing vs Tipo de Espacio Orgánico, y Desacople

**Título:** Integra (1) el flow de uso deseado del portafolio (wizard crear espacios → fotos → publicar/eliminar, con entradas libres), (2) la separación "categoría de landing" vs "tipo de espacio orgánico", y (3) las mutaciones de schema que ambos requieren.

**Fecha de creación:** 2026-08-31

**Estado:** PROPUESTO — pendiente de aprobación explícita del Supervisor (checkpoint obligatorio: mutación de schema + cambio de cardinalidad + nueva entidad).

---

## 1. El objetivo que une TODO (relato de uso)

El equipo comercial debe poder construir el portafolio web público sin fricción, y distinguir dos cosas que hoy se confunden:

1. **Publicar una entrada de portafolio** (una galería curada de un espacio de un cliente — con fotos, título, categoría, barrio).
2. **Tipar un espacio** (a qué categoría orgánico-arquitectónica pertenece para modular productos), que **no** debe arrastrar la creación de una landing.

**El relato de uso (flow deseado, del plan inicial de Javier):**

> "Quiero crear una entrada de portafolio. ¿Está asociada a un proyecto? Sí → elijo el proyecto; No → la creo libre. Después creo el espacio (su categoría/tipo), le añado fotos, y juntos SEO auto-registrado se publica. Puedo publicarla, despublicarla y eliminarla. La entrada es independiente del proyecto pero relacionable a él."

A eso se añade la separación decidida: **la lista de tipos de espacio crecerá naturalmente** para tipar la modulación, pero **no por eso debe crear una landing**. Por eso: el selector de landing (7 categorías fijas) y el tipo de espacio (taxonomía orgánica creciente) son **conceptos distintos**.

---

## 2. Estado actual (lo ya implementado, verificado 2026-08-31)

Ya existe y funciona:
- **Eliminar** una entrada de portafolio: botón en `/erp/proyectos/[proyectoId]/portafolio` (con `window.confirm`) y en `/erp/portafolio` (`TarjetaEspacioAdmin` con confirm inline + `store.portafolio.eliminar`). DataStore, server action `eliminarPortafolioAction`, mock-store y drizzle-impl soportan `eliminar`.
- **Nomenclatura automática**: el título se compone en vivo `[Espacio] [Inicial]. — [Barrio]` desde categoría + inicial del cliente + barrio.
- **Categoría personalizada** (escape actual): si un `tipoEspacio` linkeado no está en el catálogo de 7, se persiste como slug libre y NO se muestra en ninguna landing.
- **Publicar / despublicar / destacar / ordenar**: en ambas pantallas (per-proyecto y central P-27).
- **SEO de fotos**: auto-registrado (alt desde título, JSON-LD `CreativeWork`/`ImageObject` con `imagenPortafolioUrl` + `galeriaPortafolioUrl`, `generateMetadata()`).

**Lo que NO está y este plan cubre:**
- **Flow de wizard** por pasos (hoy el formulario es una sola página larga).
- **Entradas de portafolio sin proyecto** (hoy `portafolio.proyecto_id` es NOT NULL — requiere mutación).
- **Taxonomía orgánica real** `catalogo_espacios_arquitectonicos` (diseñada en `OLA_6_SCHEMAS_APROBADOS.md:194-219`, nunca construida).
- **Desacople** de `tipoEspacio` (hoy un solo código es a la vez categoría de landing y tipo de negocio).

---

## 3. Decisiones de negocio (a confirmar) — CHECKPOINT

D1. **`portafolio.proyecto_id` pasa a NULLABLE.** Para entradas libres (independientes pero relacionables). La entrada libre usa `barrio` + `categoriaEspacio` + `inicialCliente` para componer el título (igual que una asociada, solo que sin `proyectoId`).

D2. **`categoriaEspacio` sigue siendo NOT NULL** (toda entrada necesita una categoría) y queda como **categoría de landing / clasificación pública**.

D3. **`espacioVariantes.tipoEspacio` pasa a significar tipo orgánico** (apunta a `catalogo_espacios_arquitectonicos`), NO categoría de landing. El `<select>` del cotizador y el del portafolio cambian de fuente.

D4. **La taxonomía orgánica** `catalogo_espacios_arquitectonicos` se materializa y **jamás genera una landing**. Crear una categoría orgánica solo tipa; no crea ruta pública.

D5. **El join público** `obtenerGaleriaEspacioAction` deja de heredar el tipo orgánico; filtra por `portafolio.categoriaEspacio` (categoría de landing). Un espacio orgánico solo aparece en una landing si su `categoriaEspacio` coincide con la de esa landing. Formaliza que "los huérfanos son correctos".

D6. **`renders_conceptuales` y `atributos_tecnicos` siguen keying por categoría de landing** (sin cambio).

D7. **El escape "categoría personalizada" actual se sustituye** por la taxonomía orgánica real en la Fase 2 (paso intermedio mantiene el escape).

---

## 4. Fases de implementación

### FASE 0 — Flow de uso (UI + schema mínimo, alta prioridad; el núcleo del pedido)

**4.0a Schema:** mutar `portafolio.proyecto_id` → nullable (D1). Migración.

**4.0b Wizard de creación/edición de entrada de portafolio** (`/erp/proyectos/[proyectoId]/portafolio` y una ruta nueva `/erp/portafolio/nuevo` para entradas libres):

- **Paso 1 — ¿Asociado a un proyecto?** Sí → selector de proyecto + "crear espacios"; No → crear libre (directo al Paso 2 con categoría/barrio/inicial).

  > Se deja abierto, a confirmar con el Supervisor, si "crear espacios" significa crear un espacio cotizado en el proyecto (`espacio_variantes`) o solo tipar la categoría de la entrada de portafolio. Estado actual: los espacios del cotizador y las entradas de portafolio son entidades distintas (`ARCH-012`), la entrada se vincula a una `espacio_variante` opcionalmente.

- **Paso 2 — Crear/tipar el espacio:** categoría de landing (`TIPOS_ESPACIO`) **y/o** tipo orgánico (`catalogosEspaciosArquitectonicos`), con la nomenclatura auto-generada en vivo (`[Espacio] [Inicial]. — [Barrio]`).
- **Paso 3 — Añadir fotos:** `ImagePicker` sube a R2; portada + galería (SEO auto). 
- **Paso 4 — Publicar:** toggle publicar/destacar/orden; al final se puede eliminar.

**4.0c Botón eliminar** (ya implementado en ambas pantallas) — se mantiene y se referencia en el wizard y en la lista.

**Criterio de aceptación Fase 0:**
- Se puede crear una entrada de portafolio **asociada a un proyecto** y **libre (sin proyecto)**.
- El wizard guía por pasos: proyecto sí/no → espacio → fotos → publicar.
- SEO de fotos auto-registrado sin acción manual.
- Publicar/despublicar/destacar/ordenar/eliminar funcionan en ambas rutas.
- `npx tsc --noEmit`=0; `eslint` 0; build OK.

### FASE 1 — Materializar el catálogo orgánico (aditiva)

**4.1a Schema:** tabla `catalogo_espacios_arquitectonicos` (codigo `ESP-*` UNIQUE, nombre, descripcion, unidadBase enum, rangoMin/Max, ejemploTamanio, modulosTipicosJson) — según `OLA_6_SCHEMAS_APROBADOS.md:194-219`. Migración aditiva.

**4.1b DataStore:** `catalogosEspaciosArquitectonicos` (listar/crear/actualizar/eliminar) en contracts + mock + drizzle + fixtures (seed ESP-001 Cocina integral, ESP-002 Closet, ESP-003 Forma especial).

**4.1c UI admin:** pantalla ERP `/erp/catalogos/espacios-arquitectonicos` (nombre tentativo) para CRUD de la taxonomía orgánica. **No despliega landings.**

**Criterio de aceptación Fase 1:** catálogo orgánico existe y es CRUD-eable; seed presente; ninguna landing ni join público fue tocado.

### FASE 2 — Desacoplar `tipoEspacio` (comportamiento)

**4.2a Semántica:** `espacioVariantes.tipoEspacio` → tipo orgánico; `portafolio.categoriaEspacio` → categoría de landing (D3/D5).

**4.2b Cotizador:** `<select>` de tipo (add-space + inline) cambia de `TIPOS_ESPACIO` a `catalogosEspaciosArquitectonicos`.

**4.2c Formulario portafolio:** separa flujo — categoría de landing para clasificación pública; tipo orgánico para tipar. El escape custom se sustituye por la taxonomía real.

**4.2d Join público:** `obtenerGaleriaEspacioAction` filtra por `categoriaEspacio` (D5).

**4.2e Migración de datos:** auditar contra `auditoria_neon.md`; **no migrar as-is**; decidir backfill de `portafolio.categoria_espacio` para registros legacy.

**Criterio de aceptación Fase 2:** separación completa; landings intactas; huérfano solo en `/portafolio`; tsc/eslint/build OK.

---

## 5. Mutaciones de schema resumidas

| # | Cambio | Fase | Riesgo |
|---|--------|------|--------|
| S1 | `portafolio.proyecto_id`: NOT NULL → nullable | 0 | alto (cardinalidad) |
| S2 | Nueva tabla `catalogo_espacios_arquitectonicos` | 1 | medio (aditiva) |
| S3 | Semántica de `espacio_variantes.tipo_espacio` (no cambio de columnas; cambio de significado) | 2 | alto |

> Antes de ejecutar S1/S3: revisar el hallazgo de `drizzle-kit generate` (`[0010,0011] snapshot collision` en `estado.md`) — hay que arreglarlo **antes** de la próxima migración nueva o `generate` seguirá fallando.

---

## 6. Desviaciones del trabajo anterior (pendiente de decisión del Supervisor)

El trabajo ya hecho en el árbol agregó (1) botón eliminar en P-27 y (2) mecanismo "categoría personalizada", dos desviaciones de los diseños aprobados. El Supervisor no ha decidido entre **registrar esas desviaciones** en el arnés o **revertir la categoría personalizada**. Independiente de este plan; la Fase 2 sustituye el escape custom por la taxonomía real de todos modos.

---

## 7. Archivos afectados (alcance estimado)

**Fase 0**
- `lib/db/schema.ts` (S1, nullable) + `drizzle/` (migración)
- `app/erp/proyectos/[proyectoId]/portafolio/page.tsx` (wizard)
- `app/erp/portafolio/nuevo/page.tsx` (nuevo, entradas libres)
- `app/erp/portafolio/page.tsx` (referencias, botones a /nuevo y edición)

**Fase 1**
- `lib/db/schema.ts` (S2) + `drizzle/` (migración)
- `lib/data/contracts.ts`, `mock-store.ts`, `drizzle-impl.ts`, `fixtures.ts`
- nueva pantalla `/erp/catalogos/espacios-arquitectonicos` (+ nav)

**Fase 2**
- `lib/data/actions/public.ts` (`obtenerGaleriaEspacioAction`)
- `app/erp/cotizador/[proyectoId]/page.tsx` (`<select>`)
- `app/erp/proyectos/[proyectoId]/portafolio/page.tsx` (separación / sustituye escape custom)
- migración de datos (auditada)

---

## 8. Criterios de aceptación globales

1. El relato de uso (flow) es posible: crear entrada asociada o libre, tipar espacio, fotos con SEO auto, publicar/despublicar/eliminar, independiente pero relacionable.
2. Existen dos conceptos distintos: categoría de landing (7 fijas) y tipo de espacio orgánico (crece, sin landing).
3. Crear una categoría orgánica **jamás** genera una landing.
4. Un espacio orgánico solo aparece en landing si su `categoriaEspacio` coincide.
5. `npx tsc --noEmit`=0; `npx eslint .`=0 errores nuevos; build OK.
6. Ninguna migración de datos "as-is" sin auditoría previa.
7. Hallazgo de migraciones colisionadas resuelto antes de la próxima migración.
8. Checkpoint del Supervisor aprobado **antes** de Fase 0, de Fase 1 y de Fase 2 (S1, S2, S3).

---

## 9. Tareas del ledger

- **t-146** — Fase 0: flow de uso (Wizard + `proyecto_id` nullable + entrada libre). [propuesta]
- **t-147** — Fase 1: materializar `catalogo_espacios_arquitectonicos` (schema, DataStore, seed, UI admin). [propuesta]
- **t-148** — Fase 2: desacoplar `tipoEspacio` (cotizador, portafolio, join público) + migración auditada. [propuesta]
