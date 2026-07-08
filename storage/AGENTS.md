# Fork Agent Harness

This file belongs to the fork layer. Update it in each project fork.

## Project Identity

Name: "Agnostic Seed"

Purpose: base seed for schema-driven project forks.

Business domain: none in the seed. Real domain meaning must be added by each fork.

## Encoding Contract

- Use UTF-8 without BOM for persisted text.
- Prefer explicit UTF-8 read and write calls in fork scripts.
- Validate encoding before propagating shared registry files across forks.

# Fork Documentation
    - storage\fork_doc\MANIFEST GOAL.MD - Contiene la semilla del proyecto que se debe seguir cómo goal base. 
    - Modelo de diseño de detalle de modulos de fork: (pendiente por incluir)

# Arboles de arqutiectura:
    Se generan autoamticamente con CLI en storage/docs/ y muestran el estado actual real de los schemas, zaps y rutas del fork.
    - Arbol de schemas
    - Arbol de zaps
    - Arbol de rutas
Son snapshots regenerables (no se editan a mano). Siempre se usa esta infromacion para diagnosicar y tomar decisiones de diseño.

## Versionado y Sincronización del Fork

- **Versionado SemVer**: Se maneja independientemente del motor base en el `package.json` del fork. El incremento de versión se realiza manualmente con `npm version [patch|minor|major]` o mediante tags de Git.
- **Sincronización del Motor (Engine)**: Para importar actualizaciones del repositorio semilla (Agnostic Seed) sin sobrescribir las dependencias locales, se ejecuta:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/admin/sync-workspaces.ps1
  ```
  O de forma manual:
  ```bash
  git fetch upstream
  git merge upstream/main --no-ff -m "chore: sync engine"
  ```
- **RITUAL POST-SYNC OBLIGATORIO (M4):** todo sync del engine/seed puede reintroducir
  mojibake de contenido ya contaminado en upstream (así entró la del 2026-07-04). Tras
  cada merge de sync, **antes de dar por bueno el commit**, ejecutar:
  ```bash
  npm run validate:encoding && npm run validate:storage
  ```
  Si falla, reparar el encoding en el mismo merge; nunca propagar mojibake a `dev`.
- **Árboles de Arquitectura**: Se compilan dinámicamente con la fecha y hora de ejecución en `storage/progreso/` ejecutando:
  ```bash
  npx tsx scripts/agno.ts docs all
  ```

## Multiagencia y Ramas (Contrato de Concurrencia)

Varios agentes trabajan el fork en paralelo, cada uno con un goal teleológico
distinto (p.ej. pipeline de adapters, docs hexagonales del ERP, sync del engine).
Para que ninguna estancia pise el trabajo de otra y no se pierdan cambios, este
contrato es **no negociable**:

- **Un goal = una rama.** Nombrado: `goal/<dominio>-<objetivo-corto>`
  (ej. `goal/adapters-impl`, `goal/erp-hexagonal-docs`, `chore/sync-engine`).
  `dev` es el punto de integración, no el escritorio de trabajo de nadie.
- **Aislamiento por worktree cuando hay concurrencia real.** Dos agentes activos
  al mismo tiempo NO comparten el mismo working tree. Cada estancia concurrente usa
  su propio `git worktree add ../wt-<goal> goal/<...>`. Un solo working tree
  compartido = las ediciones sin commit de un agente quedan a merced del
  `reset`/`checkout` de otro.
- **Commit temprano y por goal.** Prohibido dejar trabajo grande y cruzado de
  varios agentes sin commit en `dev`. Antes de ceder el turno, cada agente comitea
  SU superficie en SU rama. Los cambios sin rastrear no están respaldados: solo
  viven en disco.
- **Operaciones destructivas vetadas sobre working tree compartido:**
  `git reset --hard`, `git checkout -- .`, `git clean -fd`, `git stash drop`.
  Si necesitas descartar, primero `git stash push -m` con etiqueta, nunca drop.
- **Integración:** ramas `goal/*` → `dev` con `--no-ff`; `dev` → `main` solo tras
  validar homeostasis (encoding + árboles + build). `main` sigue a `origin/main`.
- **Ramas de cuarentena** (ej. `implementacion-gpt-incorrecta-por-tocar-el-src`)
  no se mergean; existen como evidencia. No borrar sin instrucción humana.
- **Antes de cualquier commit:** `npm run validate:encoding` debe pasar
  (UTF-8 sin BOM). Un commit no introduce mojibake.

### Reglas post-incidente 2026-07-06 (pérdida de `.git/objects` — ver
`storage/progreso/INCIDENTE_GIT_2026-07-06.md`)

- **Toda lane cierra con commit Y PUSH de su rama a origin.** Un commit local sin push
  vive en el mismo disco que puede corromperse: no es respaldo.
- **El Orquestador pushea `dev` tras cada merge de lane.**
- **Operaciones estructurales de git se SERIALIZAN** (worktree add/remove, checkout de
  ramas, reset): el `.git` es superficie compartida aunque los archivos no lo sean. Dos
  rondas paralelas de agentes = dos CLONES del repo, nunca un `.git` compartido.
- **`git config core.longpaths true` obligatorio en Windows.** Nunca `git worktree remove`
  con `node_modules` dentro del worktree (borrar node_modules primero).
- **Clientes git GUI (GitKraken/GitLens) cerrados** mientras agentes operan el repo.

### Regla post-incidente 2026-07-08 (escrituras parciales en `/api/vault` destruyen registros)

`PostgresStrategy.write` (`src/server/strategies/PostgresStrategy.ts`) **solo hace merge de
campos si el payload incluye `_meta` con timestamps LWW**. Una escritura `POST /api/vault`
con `{"action":"WRITE","record":{"id":..., "data":{"un_solo_campo": valor}}}` sin `_meta`
**reemplaza el registro completo** — no lo parchea. El 2026-07-07/08 esto destruyó 4 registros
de producción reales (2 `proyectos`, 1 `espacio_variantes`, y de nuevo 1 `proyectos` en un
segundo incidente) porque agentes livianos asumieron merge automático al "solo cambiar un campo".

- **Antes de CUALQUIER `WRITE` a un registro que ya existe:** primero `GET` ese registro,
  toma su `data` completo, mézclalo en memoria con los campos nuevos/cambiados, y manda el
  objeto COMPLETO resultante. Nunca mandes un `data` parcial confiando en que el motor
  complete el resto.
- Esto aplica a TODO namespace (`proyectos`, `espacio_variantes`, `scripts`, cualquiera),
  no solo a los que causaron el incidente.
- Antes de escribir sobre datos de producción reales, toma snapshot (`GET` de los
  namespaces afectados) y COMMITÉALO Y PUSHÉALO antes de escribir — ver
  `storage/progreso/lanes/goal-neon-cotizaciones-recovery.md` para el patrón completo.

### Mapa de ramas vigente

| Rama | Rol |
|------|-----|
| `main` | Canónica, sigue `origin/main`. |
| `dev` | Integración de goals del fork (adelantada sobre `origin/dev`). |
| `main-app` | Variante de app. |
| `implementacion-gpt-incorrecta-por-tocar-el-src` | Cuarentena, no mergear. |
| `upstream/feature/*`, `upstream/main` | Fuentes de sync del engine (solo lectura). |
