# Plan: existe una pantalla nueva `/erp/clientes` (tablero) + `/erp/clientes/[clienteId]` (detalle) accesible desde el nav del ERP, según `disenio_p28_crm_clientes.md`

**ID de tarea**: t-138
**Zona**: `app/erp/clientes/` (nueva) + `components/veta/erp-sidebar.tsx` (nav)
**Tipo**: UI / visual
**Riesgo**: bajo — v1 sin schema nuevo (H-CRM-2/H-CRM-3 quedan fuera, ver Notas)

## Objetivo

Un tablero de clientes (nombre, teléfono, correo, documento, domicilio, contadores de proyectos/obligaciones/pedidos web) con búsqueda y filtro, más una vista de detalle con pestañas Proyectos / Pedidos web / Obligaciones (leyendo por FK, principio POC-01 sin IDs visibles), enlazado desde la sección "Comercial" del sidebar del ERP.

## Alcance v1 (recorte explícito respecto al diseño completo)

El diseño (`disenio_p28_crm_clientes.md`) declara 2 dependencias de schema no resueltas, marcadas "pendiente de checkpoint, no asumida":
- **H-CRM-2**: el badge/filtro de "Etapa" usa `clientes.etapa_funnel`, que NO existe en `lib/db/schema.ts` (existe `clientes.origen` en su lugar). **v1 omite la columna Etapa y el filtro de etapa**; no se inventa la columna.
- **H-CRM-3**: la pestaña "Visitas" depende de `citas`/`visitas`, no materializadas en schema. **v1 omite la pestaña Visitas** (Proyectos / Pedidos web / Obligaciones sí se construyen, son datos existentes).
- **H-CRM-4**: el sidebar no tiene gating por rol hoy (gap preexistente, no de esta tarea) — el ítem de nav se agrega igual que el resto de `ERP_NAV_SECTIONS`, sin inventar un mecanismo de rol nuevo.

Todo lo demás del diseño (§1, §3-§7 salvo lo anotado) se implementa igual.

## Archivos afectados

- `app/erp/clientes/page.tsx`: crear — tablero (Server Component, lee `store.clientes.listar()` + contadores derivados de `store.proyectos`/`store.obligaciones`/`store.pedidosWeb` por `clienteId`).
- `app/erp/clientes/[clienteId]/page.tsx`: crear — detalle con pestañas Proyectos / Pedidos web / Obligaciones.
- `components/veta/erp-sidebar.tsx`: modificar — agrega entrada "Clientes" (`/erp/clientes`) en la sección Comercial, después de `/erp/comercial`, icono `Contact` de `lucide-react`.

## Criterios de aceptación

1. `/erp/clientes` lista todos los clientes del store mock con nombre, teléfono, correo, documento, domicilio y 3 contadores (proyectos/obligaciones pendientes/pedidos web) reales, no hardcoded.
2. Ningún ID interno (`cliente.id`, `proyecto.id`) aparece en el markup visible (principio POC-01).
3. `/erp/clientes/[clienteId]` muestra solo los registros ligados por FK a ese cliente (un cliente no ve datos de otro).
4. "Abrir en Cotizador" desde la pestaña Proyectos navega a `/erp/cotizador/[proyectoId]`.
5. El sidebar del ERP muestra "Clientes" en la sección Comercial y queda resaltado como activo en `/erp/clientes` y en `/erp/clientes/[id]`.
6. `npx tsc --noEmit` = 0 errores nuevos.
7. `npx eslint app/erp/clientes components/veta/erp-sidebar.tsx` = 0 errores nuevos.

## Verificación

- `npx tsc --noEmit`
- `npx eslint app/erp/clientes/ components/veta/erp-sidebar.tsx`
- Inspección de código contra `disenio_p28_crm_clientes.md` §5-§6 (layout, componentes, comportamiento)

## Notas

- Contadores del tablero: el diseño pide que se deriven "server-side" — en este stack mock/drizzle actual la fuente de verdad síncrona es el store (`useDataStore()`/`getDataStore()`), igual que hace P-01 con `espaciosCount`/`totalItems`. No se inventa un endpoint API nuevo tipo `GET /api/erp/clientes` (el proyecto no usa ese patrón de rutas API para lectura, usa Server Components + store — ver P-01/P-27 ya construidos).
- "Nuevo cliente" (creación manual, R4) y `EventosModal` ("Ver historial") quedan **fuera del alcance de v1** si el sub-agente no alcanza a cubrirlos con las mismas garantías que el resto — priorizar tablero + detalle + nav antes que estas dos acciones secundarias.
