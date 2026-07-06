# Contrato de lane: goal/webstore-data-mocks

> Lane-0 de la ronda WEB-STORE. Deja EXPLÍCITA la estrategia de datos local-vs-producción
> y puebla el sitio local con mocks trazables. Todo lo demás de la ronda depende de esto.

<!-- lane-surface: storage/fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md | storage/db/** | src/generated/** | storage/progreso/lanes/goal-webstore-data-mocks.md | storage/progreso/INDEX.md -->

## Identidad
- **Rama:** `goal/webstore-data-mocks`
- **Worktree:** `git worktree add ../wt-webstore-data-mocks -b goal/webstore-data-mocks`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** requiere_ajuste (DAG 1-3 ejecutados y verificados; V4/parte de V6 bloqueados por
  breakage preexistente en `dev`, fuera de la superficie de esta lane — ver "Hallazgos" abajo)

## Goal (teleología)
Que cualquier agente o humano sepa sin ambigüedad: en local SIEMPRE se trabaja con
`LocalStrategy` (JSON en `storage/db/`) poblado con mocks trazables y borrables; en
producción (Netlify) la estrategia la deciden env vars del panel (Neon vía `DATABASE_URL`)
y los mocks NUNCA viajan allá.

## Verdad de terreno (no re-investigar)
- `src/server/getStrategy.ts`: prioridad = `AGNOSTIC_STORAGE_STRATEGY` override →
  `NODE_ENV !== 'production'` siempre `local` → en prod: `GITHUB_REPO` → `DATABASE_URL`
  (postgres/Neon) → supabase → local.
- `netlify.toml` NO define estrategia; vive en el panel de Netlify (env vars).
- Mutaciones de datos SOLO vía `npx tsx scripts/agno.ts create-record <schema> key=value...`
  (nunca editar JSON a mano). IDs con `crypto.randomUUID()` (los genera el engine).
- El Home (`VetaHome.tsx` + `src/lib/veta/portfolio.ts`) lee `espacio_variantes` reales y
  cae a `MOCK_CARDS` hardcodeadas si no hay registros.

## Superficie (y SOLO esta)
- `storage/fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md` (nuevo)
- `storage/db/**` (schema `seed_registros` nuevo + records mock vía agno CLI)
- `src/generated/**` (solo por `npm run agnostic:compile`)
- `storage/progreso/INDEX.md` (1 línea enlazando el doc nuevo)

## Fuera de alcance
- NO tocar `src/server/`, `scripts/agno.ts`, `netlify.toml` ni ningún código de engine.
- NO crear schemas de tienda/portfolio (eso es de las lanes siguientes).
- NO tocar componentes.

## Depende de / bloquea a
- Depende de: `goal/storage-dedup` mergeada a dev (para que `storage/db/` esté trackeado).
- Bloquea a: todas las lanes webstore siguientes (usan su convención de mocks).

## DAG de tareas (cada una con DoD ejecutable)
1. **Schema `seed_registros`** (registro de mocks para limpieza futura). Campos:
   `namespace` (text), `record_id` (text), `lote` (text), `nota` (text).
   Crear vía `agno create-schema` + `add-field`; luego `npm run agnostic:compile`.
   DoD: `node -e "const d=require('./storage/db/schema_definitions.json'); process.exit(d.some(s=>(s.data?.name||s.name)==='seed_registros')?0:1)"`
2. **Doc `ESTRATEGIA_DATOS_LOCAL_VS_PROD.md`.** Secciones obligatorias:
   (a) tabla de resolución de estrategia (copiar la verdad de terreno de arriba);
   (b) regla: en local, mocks se inyectan SOLO con `agno create-record` y CADA mock se
   registra en `seed_registros` con `lote=webstore_r2`;
   (c) procedimiento de limpieza (leer `seed_registros`, borrar por id, borrar el registro);
   (d) regla de frontera: `scripts/push-data.ts`/`deploy_zap.ts` jamás se ejecutan con
   `DATABASE_URL` apuntando a Neon mientras existan lotes mock sin limpiar — checklist
   pre-push incluido en el doc;
   (e) cómo verificar qué estrategia está activa (`getStrategyName()`).
   DoD: el archivo existe, UTF-8 sin BOM, y `npm run validate:encoding` verde.
3. **Poblar mocks del sitio actual** (lote `webstore_r2`), todos registrados en
   `seed_registros`:
   - 2 `clientes` mock (nombres claramente ficticios, p.ej. "Cliente Demo Uno");
   - 2 `proyectos` mock ligados a esos clientes (estado `entregado`);
   - +2 `espacio_variantes` mock ligadas a esos proyectos (con `nombre_espacio`,
     `descripcion` y textos que caigan en categorías distintas del Home: cocina, closet);
   - 2-3 `imagenes_espacio` por variante (URLs Unsplash está bien para mock);
   - 3 `testimonios` mock (`barrio` de zonas reales: Usaquén, Chicó, Rosales) con
     `destacado=true` solo en 1;
   - 2 `leads` mock.
   DoD: `node -e` que cuente ≥2 proyectos mock y ≥3 testimonios en los JSON; y
   `node -e "const d=require('./storage/db/seed_registros.json'); process.exit(d.length>=10?0:1)"`
4. **Smoke visual.** `npm run dev` y GET `http://localhost:3000/` responde 200 y el HTML
   contiene el nombre de una variante mock (curl + grep).
   DoD: comando curl documentado en la matriz con su salida.

## DoD de cierre
- [x] commit(s) en `goal/webstore-data-mocks` sin `--no-verify`
- [x] `npm run validate:storage` y `npm run validate:encoding` verdes
- [ ] `npx tsc --noEmit` verde — **NO se cumple, pero no por esta lane**: hay 30 errores
      preexistentes en `dev` (imports rotos en `agnostic.config.ts` y varios
      `src/components/specialized/*`, p.ej. `EquipoDirectory`, `ConciliacionBancaria`,
      `VetaEmbudoModal`, `VetaTestimonials`). Verificado con `git stash` de todos los cambios
      de esta lane sobre el mismo worktree: el mismo listado de 30 errores aparece en `dev`
      limpio, byte a byte. Esta lane no toca ningún archivo de esa lista (fuera de alcance
      explícito: "NO tocar componentes"), así que no se puede resolver aquí sin violar la
      superficie.
- [x] `node scripts/lane-qa.mjs goal/webstore-data-mocks --contract storage/progreso/lanes/goal-webstore-data-mocks.md` → PASS
- [x] Matriz de verificación completa

## Hallazgos (choque contrato vs realidad del repo)
- **V4 (smoke visual) no puede pasar tal como está escrito el DoD.** `npm run dev` levanta,
  pero `GET /` responde `500`, no `200`. Causa raíz: `agnostic.config.ts` (fuera de la
  superficie de esta lane) importa componentes que no existen en el árbol de `dev`
  (`./src/components/specialized/equipo/EquipoDirectory` y otros — ver log completo abajo).
  Esto es 100% preexistente: confirmado corriendo el mismo `npm run dev` con un `git stash`
  de todos los cambios de esta lane (deja el worktree en `dev` puro) — el mismo módulo falta
  y el Home sigue en 500. No es una regresión introducida por los mocks ni por el schema
  nuevo; es deuda de una lane/merge anterior (posiblemente `goal/erp-finanzas-ux` o el ciclo
  de `equipo_directory`/`catalogo_manager` mencionado en `current_state.md`, cuyos componentes
  nunca llegaron a `dev` pese a estar documentados como "completed milestones").
  Los mocks de datos (clientes/proyectos/espacio_variantes/imagenes_espacio/testimonios/leads)
  quedaron creados y verificados correctamente a nivel de storage (V1-V3 PASS); lo que no se
  pudo verificar es que el HTML del Home los muestre, porque la página no renderiza en
  absoluto en este momento de `dev`, para NINGÚN dato (real o mock).
  **Recomendación para el Orquestador:** abrir un lane-0.5 (o ampliar el alcance de la
  siguiente lane webstore) para restaurar/crear los componentes faltantes en
  `src/components/specialized/` antes de que cualquier lane que dependa de un smoke visual
  del Home pueda cerrar V4 en verde. Esta lane no lo hace porque está fuera de su superficie
  declarada.
- Ningún otro punto del contrato chocó con la realidad del repo: el flujo staged
  (`create-schema` / `add-field` / `create-record` + `commit --force`) funciona tal como lo
  describe `Comandos CLI.md`, aunque con un detalle no documentado ahí: la cola `pending` es
  en memoria por proceso, así que cada tanda de comandos + `commit --force` debe enviarse en
  una sola invocación de `agno.ts` (vía REPL/stdin), no en llamadas separadas.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | schema seed_registros | `node -e "const d=require('./storage/db/schema_definitions.json'); process.exit(d.some(s=>(s.data?.name\|\|s.name)==='seed_registros')?0:1)"` | exit 0 | PASS | exit code 0; schema con 4 campos (`namespace`,`record_id`,`lote`,`nota`) confirmado en `storage/db/schema_definitions.json` |
| V2 | doc estrategia existe | `test -f storage/fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md` | existe | PASS | archivo creado, UTF-8 sin BOM, secciones (a)-(e) presentes |
| V3 | mocks registrados | `node -e` (tarea 3) + `node -e "const d=require('./storage/db/seed_registros.json'); process.exit(d.length>=10?0:1)"` | exit 0 | PASS | proyectos mock (nombre contiene "Demo"): 2; testimonios totales: 3; `seed_registros.json`: 17 registros (2 clientes + 2 proyectos + 2 espacio_variantes + 6 imagenes_espacio + 3 testimonios + 2 leads), todos `lote=webstore_r2` |
| V4 | home 200 con mock | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` | 200 | **FAIL (bloqueado, ver Hallazgos)** | `HTTP_STATUS=500`. Log: `⨯ ./agnostic.config.ts:51:30 Module not found: Can't resolve './src/components/specialized/equipo/EquipoDirectory'`. Confirmado preexistente en `dev` limpio vía `git stash` de los cambios de esta lane. `npm run dev` se detuvo al cerrar (proceso 24624 terminado, puerto 3000 libre) |
| V5 | en superficie | `node scripts/lane-qa.mjs goal/webstore-data-mocks --contract storage/progreso/lanes/goal-webstore-data-mocks.md` | PASS | PASS | `RESULTADO: PASS` — todos los archivos cambiados dentro de la superficie declarada; gates encoding/storage verdes |
| V6 | gates | `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` | verdes | **PARCIAL** | `validate:encoding`: "Encoding validation passed (642 file(s))" — verde. `validate:storage`: sin salida de error — verde. `tsc --noEmit`: 30 errores, todos preexistentes en `dev` (ver Hallazgos), ninguno en archivos tocados por esta lane |

## Handoff
Al cerrar, el Orquestador corre QA mecánico, audita e integra a `dev` con `--no-ff`.

**Nota para el Orquestador:** los datos (DAG 1-3) están completos y verificados; el bloqueo es
exclusivamente el smoke visual (V4) y el gate `tsc` (V6 parcial), ambos por deuda preexistente
fuera de la superficie de esta lane (componentes faltantes referenciados desde
`agnostic.config.ts`). Sugiero integrar el trabajo de datos igualmente (no depende del fix de
componentes) y abrir un ítem de seguimiento separado para restaurar los componentes faltantes.
