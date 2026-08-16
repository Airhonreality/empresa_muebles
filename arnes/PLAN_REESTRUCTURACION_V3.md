Plan de Reestructuración Arquitectónica V3 - Organización Profesional Next.js 15 + Drizzle
📋 Índice
 1. Objetivo (#objetivo)
 2. Filosofía del Plan (#filosofia)
 3. Estructura de Carpetas Final (#estructura-de-carpetas-final)
 4. Migración de Archivos (Step-by-Step) (#migración-de-archivos-step-by-step)
 5. API Routes y Server Actions Organizadas (#api-routes-y-server-actions)
 6. Verificación y Build (#verificacion-y-build)
 7. Actualización del Arnés (Post-Plan) (#actualizacion-del-arnes-post-plan)
🎯 Objetivo
Reestructurar el proyecto V3 "Veta Dorada Real" para seguir estándares profesionales de Next.js 15 + Drizzle ORM, organizando rutas y carpetas sin modificar contenido de negocio (pantallas, gates, schemas permanecen intactos). El objetivo es una arquitectura limpia, profesional y eficiente, heredando ningún patrón del viejo sistema Agnostic Seed.
📝 Filosofía del Plan
- SIN REFACTORIZACIÓN DE NEGOCIO: Todo el contenido existente (páginas ERP, componentes, gates, schemas, lógica de negocio) permanece exactamente igual. No se reescribe ningún archivo de `app/erp/`, `app/(publico)/`, `lib/`, `components/`, ni `drizzle/`.
- ORGANIZACIÓN DE RUTAS SOLO: El plan solo reorganiza dónde se ubican los archivos - Server Actions mueven a `app/actions/`, API Routes se crean en `app/api/` conectando a servicios existentes.
- TALENDI V4 YA VIENE OTIMIZADO: No es necesario quitar tokens D4 - Tailwind CSS v4 gestiona automáticamente los tokens usados. El archivo `globals.css` con tokens esenciales se mantiene.
- SIN COMPATIBILIDAD CON AGNOSTIC SEED: Esta reestructuración rompe totalmente con patrones del viejo repositorio. Es una nueva arquitectura profesional desde la perspectiva de la organización, no una migración gradual.
📁 Estructura de Carpetas Final
empresa_muebles_clone_v3/
├── app/                    # Next.js 15 App Router
│   ├── (public)/           # Rutas públicas (landing, auth) - SIN CAMBIOS - contenido intacto
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── cotizador/page.tsx
│   │   ├── propuesta/[proyectoId]/page.tsx
│   │   ├── portafolio/[slug]/page.tsx
│   │   ├── colecciones/[id]/page.tsx
│   │   ├── cronograma/page.tsx
│   │   ├── landing/page.tsx
│   │   └── cuenta/
│   │       ├── page.tsx
│   │       ├── login/page.tsx
│   │       ├── login/actions.ts   ← (migrado a app/actions/public/login/)
│   │       ├── garantia/page.tsx
│   │       └── garantia/garantia-historial-cliente.tsx
│   │       └── proyectos/[proyectoId]/page.tsx
│   │       └── proyectos/[proyectoId]/proyecto-detalle-cliente.tsx
│   ├── erp/                # Páginas ERP (Client/Server Components) - SIN CAMBIOS - contenido intacto
│   │   ├── layout.tsx
│   │   ├── catalogo/page.tsx
│   │   ├── comercial/page.tsx
│   │   ├── equipo/[personaId]/page.tsx
│   │   ├── equipo/page.tsx
│   │   ├── finanzas/page.tsx
│   │   ├── finanzas/caja/page.tsx
│   │   ├── finanzas/obligaciones/page.tsx
│   │   ├── finanzas/parametros/[page]/page.tsx
│   │   ├── gates/page.tsx
│   │   ├── garantia/page.tsx
│   │   ├── herramientas/page.tsx
│   │   ├── cotizador/
│   │   │   ├── [proyectoId]/page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── ContratoModal.tsx
│   │   │   └── actions.ts   ← (migrado a app/actions/erp/cotizador/actions.ts)
│   │   ├── catalogo/page.tsx
│   │   ├── compras/page.tsx
│   │   ├── compras/[ordenCompraId]/page.tsx
│   │   ├── compras/proveedores/[proveedorId]/page.tsx
│   │   ├── pedidos-web/page.tsx
│   │   ├── proyectos/
│   │   │   ├── [proyectoId]/page.tsx
│   │   │   ├── calidad/page.tsx
│   │   │   ├── retoma/page.tsx
│   │   │   ├── desarrollo/page.tsx
│   │   │   ├── instalacion/page.tsx
│   │   │   ├── entrega/page.tsx
│   │   │   └── portafolio/page.tsx
│   │   └── portafolio/page.tsx
│   ├── api/                # ← NUEVA: API Routes organizadas por dominio
│   │   ├── erp/
│   │   │   ├── cotizador/
│   │   │   │   └── pdf/route.ts   ← POST generar PDF cotización (consumir lib/pdf/generator)
│   │   │   └── proyectos/
│   │   │       └── [id]/route.ts   ← GET/POST/PATCH proyectos (consumir lib/services/proyectos)
│   │   │
│   │   └── contratos/
│   │       └── route.ts   ← POST crear contrato (usar schema existente)
│   │
│   └── actions/            # ← NUEVA: Server Actions organizadas por dominio
│       ├── erp/
│       │   ├── cotizador/
│       │   │   └── actions.ts   ← Server Actions del cotizador (migrado desde app/erp/cotizador/actions*.ts, contenido idéntico)
│       │   └── proyectos/
│       │       └── actions.ts   ← Server Actions de proyectos (migrado si existía en app/erp/)
│       ├── pdf/
│       │   └── cotizacion.ts   ← Server Action generar PDF (migrado desde app/actions/pdf/cotizacion.ts, contenido idéntico)
│       └── public/
│           └── login/
│               └── actions.ts   ← Server Action login (migrado desde app/(publico)/cuenta/login/actions.ts, contenido idéntico)
│
├── lib/                    # ← SIN CAMBIOS - ya está profesional (Drizzle ORM, módulos, auth)
│   ├── db/                 # Schema Drizzle, client, relations - SIN CAMBIOS
│   ├── modules/            # Lógica de negocio por fase (F3-F7) - SIN CAMBIOS
│   ├── auth/               # Sesión iron-session, actions - SIN CAMBIOS
│   ├── pdf/                # Generador PDF - SIN CAMBIOS
│   ├── data/               # Types contracts, store, fixtures - SIN CAMBIOS
│   └── utils/              # Utilidades formatters, validators - SIN CAMBIOS
│
├── components/             # ← SIN CAMBIOS - componentes veta ya profesionales
│   └── veta/               # 23 componentes UI (button, badge, modal, etc.) - SIN CAMBIOS
│
├── drizzle/                # ← SIN CAMBIOS - configuración Drizzle Kit
│   ├── .mjs                # Config Next
│   └── config.ts
│
└── package.json            # ← SIN CAMBIOS - Next 15, Drizzle v0.36, dependencias profesionales
📤 Migración de Archivos (Step-by-Step)
Fase 1: Mover Server Actions a `app/actions/` (1 día)
- Mover `app/actions/pdf/cotizacion.ts` → `app/actions/pdf/cotizacion.ts` (mismo contenido, nueva ubicación dentro de carpeta actions/)
- Mover `app/erp/cotizador/actions*.ts` → `app/actions/erp/cotizador/actions.ts` (mismo contenido idéntico)
- Mover `app/(publico)/cuenta/login/actions.ts` → `app/actions/public/login/actions.ts` (mismo contenido idéntico)
- Verificar después de cada movimiento: `npx tsc --noEmit` debe pasar (types OK)
- El contenido de los archivos NO cambia, solo su path de importación

Fase 2: Crear estructura `app/api/` vacía y agregar routes mínimas (1/2 día)
- Crear directorios: `app/api/erp/cotizador/pdf/`, `app/api/erp/proyectos/`, `app/api/erp/contratos/`
- Agregar `route.ts` en cada uno con lógica mínima de conexión a services existentes:
  * `app/api/erp/cotizador/pdf/route.ts` → POST generar PDF usando `generarPDFCotizacion` from `@/lib/pdf/generator`
  * `app/api/erp/proyectos/route.ts` → GET/POST usar `createProyecto` from `@/lib/services/proyectos`
  * `app/api/erp/contratos/route.ts` → POST crear contrato usando schema existente
- Estos archivos tienen contenido nuevo pero es lógica de conexión mínima, NO contiene negocio complejo (ese sigue en services/)

Fase 3: Actualizar imports en componentes ERP y Público (1 día)
- Actualizar `import { ... } from '@/app/erp/...'` → `import { ... } from '@/app/actions/...'` en todos los componentes .tsx que consuman Server Actions migradas
- **CRITICO**: Solo cambian los paths de importación. El contenido de cada componente .tsx se mantiene intacto.
- Verificar: `npx tsc --noEmit` y `npm run build` deben pasar sin errores
- Hacer `git diff` para confirmar que el contenido de los .tsx no cambió, solo sus imports

Fase 4: Verificación Final y Build (1 día)
- `npx tsc --noEmit` = 0 errores
- `npm run build` = éxito rotundo
- Probar API Routes recién creadas con `curl -X POST`
- Probar Server Actions en navegador - mutaciones ejecutarse sin errores
- Checklist:
  * Sin imports rotos en todo el árbol app/
  * Build de producción funciona
  * Tests unitarios (gates, mock-store) siguen pasando

🛠 API Routes y Server Actions Organizadas
Endpoint | Método | Descripción | Origen / Destino
---------|--------|-------------|-------------------
/api/erp/cotizador/pdf | POST | Generar PDF cotización | `app/api/erp/cotizador/pdf/route.ts` (NUEVO, lógica mínima)
/api/erp/proyectos | GET/POST | Listar/crear proyectos | `app/api/erp/proyectos/route.ts` (NUEVO, lógica mínima)
/api/erp/proyectos/[id] | GET/PATCH | Obtener/actualizar proyecto | `app/api/erp/proyectos/[id]/route.ts` (NUEVO, lógica mínima)
/api/erp/contratos | POST | Crear contrato | `app/api/erp/contratos/route.ts` (NUEVO, lógica mínima)
/app/actions/erp/cotizador/actions | N/A | Server Actions cotizador | `app/actions/erp/cotizador/actions.ts` (MIGRADO, contenido idéntico)
/app/actions/pdf/cotizacion | N/A | Server Action generar PDF | `app/actions/pdf/cotizacion.ts` (MIGRADO, contenido idéntico)
/app/actions/public/login/actions | N/A | Server Action login portal | `app/actions/public/login/actions.ts` (MIGRADO, contenido idéntico)

📋 Checklist de Verificación (Post-Plan)
TypeScript
- `npx tsc --noEmit` = 0 errores en todo el árbol
- Sin imports rotos de ` '@/app/erp/` ni ` '@/app/(publico)'` a ` '@/app/actions/` ni ` '@/app/api'`

Build & Runtime
- `npm run build` = éxito completo
- `npm run dev` = corre sin errores de consola
- API routes responden correctamente (POST/GET)
- Server Actions ejecutan mutaciones en navegador

Funcionalidad (CONTENIDO INTACTO)
- Todas las pantallas ERP (`app/erp/*`) se renderizan con su contenido original
- Todas las páginas público (`app/(publico)/*`) se renderizan con su contenido original
- Todos los gates (E-18, E-20, E-21, E-24, E-33) siguen funcionando con su lógica original
- Schemas Drizzle en `lib/db/schema.ts` sin modificaciones
- Lógica de negocio en `lib/modules/` sin modificaciones
- PDF generation funciona con datos reales (mismo servicio `lib/pdf/generator`)

Performance
- `next/build` tiempo razonable (< 2 min)
- Tamaño de bundle optimizado (Tailwind v4 already tree-shaking tokens)
- Imágenes optimizadas con next/image (sin cambios en componentes)

Estructura
- No hay archivos `app/erp/cotizador/api/` (eliminados, movidos a `app/actions/erp/cotizador/`)
- Todas las API routes están en `app/api/erp/`
- Server Actions organizadas en `app/actions/erp/`, `app/actions/pdf/`, `app/actions/public/`
- Drizzle schema conservado en `lib/db/schema.ts`
- Tipos conservados en `lib/data/contracts.ts` (sin crear `lib/types/` separado - ya está resuelto)
- Componentes en `components/veta/` sin reorganizar (ya son profesionales)

🔄 Actualización del Arnés (Post-Plan)
**Momento:** Una vez finalizada la reestructuración y verificada la Fase 4 (build + tests pasando).

**Pasos para actualizar `arnes/`:**

1. **`arnes/estado.md`**:
   - Actualizar el estado de la línea técnica de "F10 — Prototipo con mocks (ABIERTA)" a **"F8 — Hardening/Reestructuración completada (CERRADA)"**.
   - Agregar nota: *"Reestructuración V3 completada: organización de rutas Next.js 15 + Drizzle. Sin modificaciones de contenido de negocio. Migración incremental con verificación mecánica en cada fase."*
   - Confirmar que `DATABASE_URL` sigue apuntando a `dev-local` en worktree `empresa_muebles_clone_v3`.

2. **`AGENTS.md`** (línea 42 y tabla de comandos):
   - **Línea 42**: Añadir salvedad después de *"código nuevo desde cero"*:
     > *"Excepción: código existente en `empresa_muebles_clone_v3` que cumple funcionalidades aprobadas y pasa verificación mecánica (`tsc --noEmit`, `eslint .`, tests) puede reestructurarse y moverse a nuevas rutas (`app/actions/`, `app/api/`). No es código del prototipo v2 (Agnostic Seed), es implementación V3 real con arquitectura profesional."*
   - **Tabla de comandos**: Actualizar versión de Next.js de "^14" a "^15" y confirmar comandos:
     - `npx tsc --noEmit` - cubre todo el árbol ✓
     - `npx eslint .` - configurado ✓
     - `npm run build` - verificación parcial ✓ (ahora incluye nuevas routes/api)

3. **`arnes/lineas/ola7/plan_ola7_maestro.md`**:
   - Verificar que la sección de F8 (Hardening) refleja que la reestructuración se completó exitosamente.
   - Si existen referencias a estructura `app/api/` o `app/actions/` no existentes, agregarlas como parte del estado actual.

4. **Documentar en `arnes/`**:
   - Crear `PLAN_REESTRUCTURACION_V3_EJECUTADA.md` (o agregar al `backlog_auditoria_pantallas.md`) que documente:
     - Qué se movió de dónde a dónde (sin cambiar contenido).
     - Qué API Routes nuevas se crearon y a qué services conectan.
     - Estado final: build pasando, tests pasando, contenido de negocio intacto.

**Regla crítica para futuras sesiones:**
- El arnés **siempre debe reflejar el estado real verificado** (build passing, tests passing).
- Si el plan de reestructuración cambia rutas/carpetas, la documentación del arnés se actualiza **después**, no antes.
- Nunca actualizar `arnes/` basado en suposiciones - solo basado en evidencia mecánica (`tsc`, `eslint`, `npm run build`).

✅ Checklist Final Pre-Merge a `dev`
- [ ] `npx tsc --noEmit` = 0 errores
- [ ] `npm run build` = éxito
- [ ] Todos los tests (`gates.test.ts`, `mock-store.test.ts`) pasan
- [ ] API Routes nuevos probados manualmente
- [ ] Server Actions nuevos probados en navegador
- [ ] `git diff` confirma: contenido de `app/erp/`, `app/(publico)/`, `lib/`, `components/` sin modificar (solo moves de archivos y nuevos route.ts mínimos)
- [ ] Arnés (`arnes/`) listo para actualizarse según sección "Actualización del Arnés (Post-Plan)"

**Advertencia:** Este plan requiere ejecución incremental con verificación en cada fase. Si saltar una fase de verificación, pueden accumularse errores que sean difíciles de corregir después. Cada cambio debe ser mínimo y comprobable.

(End of file)