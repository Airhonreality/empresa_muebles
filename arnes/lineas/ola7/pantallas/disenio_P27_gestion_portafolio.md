# P-27 — Gestión central de portafolio (ERP)

**Fecha:** 2026-08-15 · **Estado:** aprobado (checkpoint Supervisor 2026-08-15) · **Fase:** F7 · **Ruta:** `/app/erp/portafolio` · **Roles:** comercial, admin

**Contexto de apertura:** cierra el hallazgo "Obstáculo 2" de la Auditoría 2026-08-15 (ver `arnes/tareas/t-133.json`, `t-134.json`, relacionados). Hoy la única forma de gestionar una entrada de portafolio es entrando a un proyecto específico del ERP (`app/erp/proyectos/[proyectoId]/portafolio/page.tsx`, que ya existe y funciona completo: crear, editar, subir fotos, publicar/despublicar, destacar, ordenar). No hay una vista que liste **todas** las entradas de portafolio de todos los proyectos en un solo lugar. `disenio_F03_portafolio_proyectos.md` cubre solo las rutas públicas (`Roles: publico`) — este documento es su contraparte de administración, nunca diseñada hasta ahora.

**Alcance deliberadamente acotado:** esta pantalla es de **gestión** (listar, publicar/despublicar, destacar, reordenar, enlazar a edición), no de **autoría**. Crear o editar el contenido (título, fotos, descripción) de una entrada sigue ocurriendo en la pantalla por-proyecto ya existente — no se duplica ese formulario. Tampoco permite crear una entrada de portafolio sin proyecto asociado: `portafolio.proyecto_id` sigue `NOT NULL` (esa es una decisión de producto distinta, pendiente de checkpoint del Supervisor, fuera de alcance de este documento).

**Paso de datos previo:** ninguno. Los tres métodos que esta pantalla necesita ya existen y ya se usan en producción por la pantalla por-proyecto: `store.portafolio.listar()`, `store.portafolio.publicar(id)` / `.despublicar(id)`, `store.portafolio.actualizar(id, { destacado, orden })`.

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md` §10).*

| Entidad | § REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `portafolio` | §10 | id, proyecto_id, titulo, categoria_espacio, imagen_portafolio_url, galeria_portafolio_url, publicado, destacado, orden, slug | Listado central — a diferencia de `/portafolio` (público), lista **todas** las entradas sin filtrar por `publicado` |
| `proyectos` | §3 Comercial | id, nombre_proyecto | Nombre del proyecto asociado a cada entrada + link a `/erp/proyectos/[proyectoId]/portafolio` para editar contenido |

---

## 2. Estados que transiciona

*No hay máquina de estados formal (ningún gate/E-XX) — `publicado` y `destacado` son toggles booleanos reversibles, igual que ya funcionan en la pantalla por-proyecto existente. Se documentan acá como transición porque cambian visibilidad pública, no por ser un gate del proyecto.*

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `publicado=false` | Click "Publicar" | `publicado=true` | — (sin E-XX, mismo patrón ya vigente en `app/erp/proyectos/[proyectoId]/portafolio/page.tsx`) | — |
| `publicado=true` | Click "Despublicar" | `publicado=false` | — | — |
| `destacado=false` | Click "Destacar" | `destacado=true` | — | — |
| `destacado=true` | Click "Quitar destacado" | `destacado=false` | — | — |

---

## 3. Vocabulario H07

*Reutiliza las labels ya citadas en `disenio_F03_portafolio_proyectos.md` §3 para el nombre de la entidad y las categorías; agrega solo las labels de acción propias de esta pantalla (sin código H07 asignado, mismo patrón que `disenio_P24_pedidos_web.md` §3 usa para "Enganchar a producción").*

| Label | Código | Entidad |
|---|---|---|
| "Portafolio" | — | — |
| "Cocinas" / "Closets" / "Estudios" / ... | `cocina` / `closet` / `estudio_home_office` / ... | `portafolio.categoria_espacio` |
| "Publicado" / "Sin publicar" | `publicado` (bool) | `portafolio.publicado` |
| "Destacado" | `destacado` (bool) | `portafolio.destacado` |
| "Publicar" / "Despublicar" | — | Acción sobre `portafolio.publicado` |
| "Destacar" / "Quitar destacado" | — | Acción sobre `portafolio.destacado` |
| "Orden de aparición" | — | `portafolio.orden` |
| "Editar contenido" | — | Link a `/erp/proyectos/[proyectoId]/portafolio` |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | La pantalla lista TODAS las entradas de `portafolio` (publicadas y no) — a diferencia de `/portafolio` público, que filtra `WHERE publicado=true` (R1 de `disenio_F03...md`) | Client: sin filtro de `publicado` en `store.portafolio.listar()` | Test: con 1 entrada publicada + 1 sin publicar en fixtures, la tabla muestra 2 filas |
| R2 | El orden de la grilla pública es `destacado DESC, orden ASC` (regla ya vigente, R4 de `disenio_F03...md`) — el campo `orden` que esta pantalla edita es exactamente el que consume esa regla, sin transformación | Servidor (ya implementado) | Verificado por lectura de código en `app/(publico)/portafolio/page.tsx` (`store.portafolio.publicados()`) |
| R3 | Esta pantalla no crea entradas nuevas ni edita título/fotos/descripción — solo gestiona visibilidad y orden. Crear/editar contenido redirige a `/erp/proyectos/[proyectoId]/portafolio` | UI: sin formulario de creación en esta pantalla | Inspección directa: `app/erp/portafolio/page.tsx` no importa `ImagePicker` ni tiene `<form>` de creación |
| R4 | `proyecto_id` sigue `NOT NULL` — no se agrega ninguna vía para publicar un proyecto histórico sin registro ERP desde esta pantalla (fuera de alcance, ver nota de apertura) | — | `grep proyectoId.*notNull` en `lib/db/schema.ts` sin cambios |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `TablaGestionPortafolio` | Client | `entradas: Portafolio[], proyectos: Proyecto[]` | `portafolio`, `proyectos` | `--radius-md`, `Inter` |
| `FilaPortafolioAdmin` | Client | `entrada: Portafolio, nombreProyecto: string, onTogglePublicar, onToggleDestacado, onChangeOrden` | `portafolio` | Thumbnail `object-cover`, `Badge` de categoría |
| `FiltroPortafolioAdmin` | Client | `categoria: string \| null, soloPublicados: boolean \| null` | — | Reutiliza patrón de filtro ya usado en `TablaPedidosWeb` (P-24) |

**Patrones M-06 L1 usados:** `useDataStore()` (M-07, nunca `getDataStore()` directo en `app/`), `Badge`.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `store.portafolio.listar()` + `store.proyectos.listar()` (para resolver `nombreProyecto` por `proyectoId`) | — | — |
| 2 | Publicar / despublicar | Click en fila | `store.portafolio.publicar(id)` / `.despublicar(id)` | Re-render vía M-07 (`useDataStore()` + `notify()`, ya implementado en el store) | — |
| 3 | Destacar / quitar destacado | Click en fila | `store.portafolio.actualizar(id, { destacado: !entrada.destacado })` | Re-render vía M-07 | — |
| 4 | Cambiar orden | Input numérico + blur/enter | `store.portafolio.actualizar(id, { orden: nuevoValor })` | Re-render vía M-07; afecta el orden en `/portafolio` público | — |
| 5 | Editar contenido | Click "Editar contenido" | `router.push('/erp/proyectos/' + proyectoId + '/portafolio')` | — | — |
| 6 | Filtrar por categoría/estado | Cambiar filtro | Filtro client-side sobre el array ya cargado (sin refetch) | — | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores nuevos en `app/erp/portafolio/` | `eslint app/erp/portafolio/` |
| CA-3 | La tabla muestra entradas publicadas y sin publicar (no filtra como la pública) | Fixture con 1 publicada + 1 sin publicar → 2 filas visibles |
| CA-4 | Publicar/despublicar/destacar actualiza el store y se refleja sin recargar (M-07) | Manual: click, verificar cambio de badge sin refresh |
| CA-5 | `/erp/portafolio` alcanzable desde `ERP_NAV` | Nav-owner del lote agrega el ítem |
| CA-6 | Ningún control de esta pantalla permite crear una entrada sin `proyectoId` (R4) | Inspección: sin `<form>` de creación, sin llamada a `store.portafolio.crear()` en este archivo |

---

## 8. Verificación de integridad (pre-entrega)

- [x] `portafolio`/`proyectos` citadas en `REGISTRO_DE_ENTIDADES.md` §10/§3
- [x] No requiere estados nuevos en el REGISTRO — reutiliza `publicado`/`destacado` ya existentes
- [x] Vocabulario reutiliza `disenio_F03_portafolio_proyectos.md` §3 donde aplica; labels de acción nuevas siguen el mismo patrón sin-código de `disenio_P24_pedidos_web.md` §3
- [x] Toda regla en §4 tiene verificación mecánica
- [x] Componentes usan M-07 (`useDataStore()`) — mismo patrón que el resto del ERP
- [x] Checkpoint del Supervisor: aprobado 2026-08-15, sin cambios al alcance propuesto
