# P-26 — Documentación del proyecto (fotos/docs por etapa, gate E-41)

**Fecha:** 2026-08-10 · **Estado:** propuesta · **Fase:** F7 · **Ruta:** `/app/erp/proyectos/[proyectoId]/documentos` · **Roles:** desarrollador, taller, gerente

**Contexto de apertura:** bloqueada desde `d3_ui_b3_5_cliente_documentacion.md` (2026-08-03, hallazgo `H-B3-5-04 DECISION_PENDIENTE`) esperando la decisión de alojador de documentos. **Resuelta por el Supervisor el 2026-08-10:**

> Cloudflare R2 para todas las imágenes del sistema (mismo bucket que catálogo/portafolio). Google Drive se mantiene **sin integración API** — los diseñadores usan Google Drive Desktop (cliente de sincronización local) exclusivamente para el flujo SketchUp/SDK (texturas, módulos 3D, archivos de diseño pesados). El sistema no sube ni descarga nada de Drive; solo guarda una referencia (enlace) a la carpeta/archivo ya sincronizado localmente. Eso es responsabilidad del flujo de trabajo del diseñador, no del ERP.

Esta decisión simplifica la pantalla respecto al diseño original: no hay dos flujos de upload, hay uno (R2, imágenes) y un campo de texto (enlace de Drive, sin validación de contenido).

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `documentos_proyecto` | — **[nueva, nunca promovida a REGISTRO_DE_ENTIDADES — se promueve al abrir código]** | id, proyecto_id, etapa, alojador (`r2` \| `drive_veta_erp`), url, nombre, created_at | Documentos/fotos por etapa del proyecto |
| `proyectos` | §3 | id, nombre_proyecto, estado | Header de la pantalla |

**Paso de datos previo:**
- `lib/data/contracts.ts`/`mock-store.ts`/`fixtures.ts`/`drizzle-impl.ts`: materializar `DocumentoProyecto` (nunca existió, ni en mock ni en `lib/db/schema.ts`) + dominio `documentosProyecto` (porProyecto, crear, eliminar), round-trip test.
- `arnes/nucleo/REGISTRO_DE_ENTIDADES.md`: promover `documentos_proyecto` de los archivos de pases históricos (§11 pasa a §7 o nueva sección) — esta pantalla es la que finalmente la materializa, cerrando una entidad que quedó huérfana desde el Diamante 3.

---

## 2. Estados que transiciona

Sin máquina de estados — `documentos_proyecto` es un log de adjuntos, no tiene ciclo de vida propio más allá de existir/eliminado.

| Acción del usuario | Efecto | Gate / evento |
|---|---|---|
| Subir imagen (R2) | Crea `documentos_proyecto(alojador='r2', url=<R2 real>)` | E-41 |
| Pegar enlace de Drive | Crea `documentos_proyecto(alojador='drive_veta_erp', url=<link pegado, sin validar>)` | E-41 |
| Eliminar documento | Borra el registro (no borra el archivo físico en R2/Drive — fuera de alcance del ERP) | — |

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Documento del proyecto" | — | `documentos_proyecto` |
| "Imagen (R2)" | `alojador='r2'` | `documentos_proyecto.alojador` |
| "Enlace de Drive" | `alojador='drive_veta_erp'` | `documentos_proyecto.alojador` |
| "Etapa" | `etapa` | `documentos_proyecto.etapa` — mismo vocabulario de macro-fase que P-01 (`pre_venta`/`cotizacion`/`produccion`/`instalacion`/`post_venta`) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | `alojador='r2'` exige subir un archivo real vía `ImagePicker` (mismo componente que P-27/P-15) | Cliente | — |
| R2 | `alojador='drive_veta_erp'` exige solo una URL no vacía — el sistema **no valida** que apunte realmente a Drive ni que el archivo exista (fuera de su control, por decisión explícita) | Cliente (solo "no vacío") | Test: URL vacía → rechaza; URL de cualquier dominio → acepta |
| R3 | Todo documento queda asociado a una `etapa` (macro-fase) para poder filtrar la vista por fase del proyecto | Cliente | — |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `GaleriaDocumentos` | Client | Grid agrupado por etapa, thumbnail para R2, ícono de enlace para Drive |
| `SubirDocumentoModal` | Client (`Modal`) | Tab "Imagen" (`ImagePicker`) / Tab "Enlace de Drive" (input URL simple) + selector de etapa |
| `BadgeAlojador` | Client | Distingue visualmente R2 vs Drive (ícono, no solo texto) |

**Patrones M-06 L1:** `ImagePicker` (reutilizado tal cual, ya sube a R2 mock), sin componente nuevo para el enlace de Drive (es un `<input type="url">` simple, mismo patrón que `adjuntarFactura` en P-23).

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | Mount | `store.documentosProyecto.porProyecto(proyectoId)` | — | — |
| 2 | Subir imagen | Submit tab "Imagen" | `store.documentosProyecto.crear({proyectoId, etapa, alojador: 'r2', url})` | — | E-41 |
| 3 | Pegar enlace Drive | Submit tab "Enlace de Drive" | `store.documentosProyecto.crear({proyectoId, etapa, alojador: 'drive_veta_erp', url})` | — | E-41 |
| 4 | Eliminar | Click "Eliminar" + confirmación | `store.documentosProyecto.eliminar(id)` | — | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en `app/erp/proyectos/[proyectoId]/documentos/` | `eslint` |
| CA-3 | Round-trip test de `documentosProyecto` en `mock-store.test.ts` | `npx tsx lib/data/mock-store.test.ts` |
| CA-4 | Documento con `alojador='drive_veta_erp'` nunca dispara un intento de subida a R2 | Test: mock de `ImagePicker`/upload no se invoca en esa rama |
| CA-5 | Enlace desde el hub del proyecto (`/erp/proyectos/[proyectoId]`) — mismo patrón de tarjeta que Calidad/Instalación/Entrega agregadas en la consolidación POC-18 | Verificación de navegabilidad manual |

---

## 8. Verificación de integridad (pre-entrega)

- [x] Decisión de alojador (H-B3-5-04) resuelta explícitamente por el Supervisor 2026-08-10 — ya no es `DECISION_PENDIENTE`
- [x] Todo label en §3 es nuevo pero coherente con el vocabulario ya aprobado (macro-fase de P-01)
- [ ] Pendiente al abrir código: materializar `documentos_proyecto` en `REGISTRO_DE_ENTIDADES.md` (nunca estuvo, solo en archivo histórico) — el Iniciador que ejecute el paso de datos debe agregarla a §7 u otra sección apropiada, no solo a `lib/data/`
