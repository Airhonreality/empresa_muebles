# Refactor: Seed Mínimo + Catálogo de Módulos Compuestos

Orquestador: Fable 5 (este documento es el plan de control).
Ejecutores: modelos livianos, un Work Package (WP) por sesión, usando los prompts `PROMPT_WP*.md` de esta carpeta.

## Decisiones cerradas (2026-07-06)

1. Se eliminan TODOS los bloques UI built-in (`form`, `table`, `collection`, `action`, `navbar`, `tabs`, `columns`, `frame`, `nav`, `embed`, `field`, `markdown`, `faq`, `text`, `hero`, `divider`, `spacer`, `image`, `project_selector`). El registry nace vacío; los bloques solo entran vía `agnostic.config.ts`.
2. No hay pack legacy. Solo sobreviven módulos compuestos hiperespecializados en un catálogo instalable:
   - `calendar-scheduler` (ya existe, se muda al catálogo)
   - `data-table` (nuevo: súper tabla de gestión con filtros, orden, paginación y CRUD inline)
3. Catálogo en `packages/modules/<id>/` con manifest. `agno install-module <id>` COPIA a `src/components/specialized/<id>/` y registra en `agnostic.config.ts` (copy-on-install: el fork es dueño de su copia, el sync del engine nunca la toca).
4. `empresa_muebles_clone`: opción B — su única ruta con built-ins (`/app/prefabricados`: collection+form ×2) se migra al módulo `data-table`. Su `src/app/app/layout.tsx` importa `AppNavbarDynamic`: ese componente se copia a su carpeta specialized.
5. `nomon_clone`: 0 built-ins en rutas. Solo sync + validación.

## Hechos auditados (no re-verificar, ya confirmados)

- Los bloques solo se conectan al engine en `src/lib/agnostic/init.ts` (registro). `AgnosticRenderer` usa `registry.get(type)` y no conoce bloques.
- Admin y designer NO importan bloques (el `AgnosticFormEmbed` de `AgnosticDesigner.tsx` es una función local).
- Rutas del seed: solo usan `calendar_scheduler`.
- `SystemHealth.tsx`, `ProjectSelector.tsx`, `AgnosticBelt.tsx` = código muerto.
- Tipo desconocido en rutas hoy = `console.warn` + render null (fallo silencioso). Por eso WP-0 va primero.

## Secuencia y compuertas (gates)

```text
WP-0  validate:routes (red de seguridad CLI)          [seed]
WP-1  subsistema de módulos: manifest + install/list/remove  [seed]
WP-2  calendar-scheduler -> catálogo                  [seed]   (tras WP-1)
WP-3  módulo data-table (súper tabla)                 [seed]   (tras WP-1; paralelo a WP-2)
WP-4  purga de bloques built-in + init.ts mínimo      [seed]   (tras WP-2 y WP-3)
WP-5  empresa_muebles: opción B + sync engine         [fork]   (tras WP-4)
WP-6  nomon sync + actualización de docs del seed     [fork+seed] (tras WP-4)
```

GATE tras cada WP (lo verifica el orquestador antes de autorizar el siguiente):
1. `npx tsx --tsconfig tsconfig.json --eval ""` no aplica; el chequeo es `npx tsc --noEmit` limpio.
2. `npx tsx scripts/agno.ts validate:routes` en verde (desde WP-0 en adelante).
3. Existe `REPORTE_WP<n>.md` en esta carpeta con el formato exigido por el prompt.
4. Ningún archivo de `storage/db/` modificado sin ciclo plan → dry → confirm → backup.

## Protocolo para el ejecutor (todas las sesiones)

- Ejecutas UN solo WP. No avances al siguiente aunque termines rápido.
- Si un criterio de aceptación falla y no puedes arreglarlo en 2 intentos: documenta el fallo en el reporte y DETENTE. El orquestador decide.
- No toques `storage/progreso/`, `storage/fork_doc/` (salvo escribir tu reporte) ni archivos fuera del alcance listado en tu prompt.
- Invariantes del repo (CLAUDE.md manda): snake_case en tipos de bloque y datos; `crypto.randomUUID()`; nunca `ACTIVE_TENANT` ni selección de tenant; mutaciones de `storage/` o `agnostic.config.ts` vía CLI gobernada.

## Estado

| WP | Estado | Reporte | Gate |
|----|--------|---------|------|
| 0 | ✅ completado | REPORTE_WP0.md | ✅ verificado por orquestador 2026-07-06 (validate:routes exit 0; test negativo reproducido independiente exit 1; storage/db intacto; script sin escrituras). Respuestas a dudas: invariante = interpretación correcta (existencia de archivo basta; validar contenido es terreno de compile); rutas V3 `kind` = fuera de alcance, backlog; error tsc preexistente = WIP del usuario en layout.tsx, ver nota abajo. |
| 1 | 🟢 autorizado | — | — |
| 2 | pendiente | — | — |
| 3 | pendiente | — | — |
| 4 | pendiente | — | — |
| 5 | pendiente | — | — |
| 6 | pendiente | — | — |

El orquestador actualiza esta tabla al verificar cada gate.

## Notas del orquestador

- 2026-07-06 (gate WP-0): `npx tsc --noEmit` tiene UN error preexistente ajeno al refactor: `src/app/layout.tsx:34` importa `@/lib/veta/seo/schemaGenerator`, que NO existe en el seed. "veta" es vocabulario del fork empresa_muebles → parece código de fork filtrado al seed en un WIP sin commitear (junto con cambios en `AgnosticShell.tsx` y `AuthContext.tsx`). DECISIÓN PENDIENTE DEL USUARIO: revertir o completar ese WIP. Mientras exista, el criterio "tsc limpio" de los gates se interpreta como "sin errores NUEVOS respecto a este único preexistente".
