# Orquestación del Fork — Modelo de Trabajo Multiagente

Documento del **Orquestador**. Define cómo se organiza el trabajo de varios agentes
en paralelo sin perder coherencia ni cambios. Complementa el contrato de concurrencia
de [`storage/AGENTS.md`](../AGENTS.md) ("Multiagencia y Ramas").

Regla de oro: el Orquestador **no hace trabajo de lane**. Mantiene el modelo, el
roster, el orden de integración y la matriz de verdad. El trabajo real lo hacen las
lanes.

---

## 1. Modelo de dos ejes

El trabajo se organiza en una matriz de dos ejes ortogonales. No son listas rivales:
se componen.

```
                 EJE HORIZONTAL = etapas Fable 5 (cómo avanza y quién firma)
                 plan_borrador → QA mecánico → plan_aprobado → código → auditoría
EJE VERTICAL   ┌──────────────────────────────────────────────────────────────
= lanes/goals  │  cada lane recorre TODAS las etapas dentro de SU rama + worktree
(qué superficie)│
 encoding-homeo │  ●───────●───────●───────●───────●   (lane-0, desbloqueadora)
 adapters-impl  │  ●───────●───────●───────●───────●
 erp-comercial  │  ●───────●───────●───────●───────●
 erp-lifecycle  │  ●───────●───────●───────●───────●
 erp-finanzas   │  ●───────●───────●───────●───────●
 design-system  │  ●───────●───────●───────●───────●
               │
 ORQUESTADOR ══╧══ transversal: matriz de verdad + orden de integración a `dev`
```

- **Eje vertical (lanes):** dominios/objetivos. Cada lane = 1 rama `goal/*` + 1 worktree.
  Dueño del *qué*.
- **Eje horizontal (etapas):** el pipeline Fable 5 (`src/adapters/current_state.md`).
  Dueño del *cómo avanza y quién aprueba*. El QA y la auditoría son **etapas**, no lanes.
- **Orquestador:** nivel transversal. No toca superficie de negocio.

---

## 2. Tres roles mínimos

No hay un agente permanente por dominio. Hay tres roles que las lanes comparten.

| Rol | Cuántos | Vida | Modelo | Función |
|-----|---------|------|--------|---------|
| **Orquestador** | 1 | persistente | pesado | Matriz de estados, roster, orden de integración, auditoría final. Cruza lanes. No implementa. |
| **Worker de lane** | 1 por goal activo | efímero, en su rama+worktree | pesado (plan) / liviano (código) | Recorre plan→código **solo dentro de su superficie**. Si choca con el contrato, reabre el objetivo; no improvisa diseño. |
| **QA mecánico** | 1 compartido | por etapa | liviano/barato | Gate estructural (DoD ejecutable, compila, choques de verbos CLI, encoding). No razona diseño. |

---

## 3. Definición de Done (DoD) universal de una lane

Un goal que no cerró con commit **no existe**. (Lo sufrimos el 2026-07-04: 7 adapters
vivían solo en el working tree sin commitear, a un `reset` de perderse.)

Toda lane cumple, para cerrar:

1. **Cierra con al menos un commit en su rama `goal/*`.** Git es el libro mayor de la
   homeostasis: si no está commiteado, no está respaldado.
2. **Checkpoints intra-goal frecuentes pero coherentes.** Cada commit = un incremento
   que compila / pasa su DoD parcial. No commits de ruido, sí snapshots seguros. Con
   worktree por agente, los commits frecuentes **no colisionan**.
3. **Verdes antes de cerrar:** `npm run validate:storage` y `npm run validate:encoding`
   pasan. **Prohibido cerrar con `--no-verify`** (si el gate falla, es un hallazgo, no
   un obstáculo a saltar).
4. **Trae su contrato de lane** (sección 5) enganchado al arnés.
5. **Cierra con PUSH de su rama a origin** (regla post-incidente 2026-07-06: un commit
   local sin push no es respaldo — se perdió la historia 07-02→07-06 por no pushear).

Integración: `goal/*` → `dev` con `--no-ff` tras validar; **el Orquestador pushea `dev`
tras cada merge**. `dev` → `main` tras build + árboles verdes. `main` sigue a `origin/main`.
Operaciones estructurales de git (worktree/checkout/reset) SERIALIZADAS por el Orquestador;
rondas paralelas = clones separados (ver `INCIDENTE_GIT_2026-07-06.md`).

---

## 4. Tablero de lanes (estado + trigger de activación)

Este es el **panel de control del Orquestador**. Cada fila es una lane; el Orquestador
solo despacha a un modelo liviano las que están en estado `LISTA` (trigger cumplido).

### Ciclo de vida de una lane (estados Mundo-1)

```
PENDIENTE ──(se escribe su contrato)──▶ LISTA ──(se despacha worker)──▶ EN_PROGRESO
   ▲                                       ▲                                  │
   │                                  (dependencia                    (worker cierra
BLOQUEADA ◀──(trigger no cumplido)     cumplida)                       con commit)
                                                                              ▼
   CERRADA ◀──(auditoría OK + merge --no-ff a dev)──── EN_REVISION ◀──────────┘
```

| Lane (rama) | Estado | Commit de cierre | Superficie |
|-------------|--------|------------------|-----------|
| `goal/encoding-homeostasis` | ✅ **CERRADA** | `16c14eb` | `storage/db`, `.githooks/` |
| `goal/erp-comercial-state` | ✅ **CERRADA** | `ca6f7b4` | schema `proyectos.estado`, kanban → `MATRIZ_ESTADOS.md` |
| `goal/design-system-tokens` | ✅ **CERRADA** | `9e7e596` | `storage/styles/tokens.css` (capa fork) |
| `goal/erp-lifecycle-zaps` | ✅ **CERRADA** | `6ffc63a` | `scripts.json` + kanban → `zap_validar_transicion_estado` |
| `goal/erp-finanzas-ux` | ✅ **CERRADA** | `08ae9d3` | `FinanzasShell.tsx` (KPI strip + colecciones) |
| `goal/adapters-impl` | ✅ **CERRADA** | (orquestador propio) | `src/integrations/*` — 7 adapters, aprobada externamente |
| `goal/erp-ai-config-schema` | 🟡 **CHECKPOINT** | `e3ad372` (WIP) | schema `ai_config` — falta terminar su worker |
| `goal/storage-dedup` | ✅ **CERRADA** | `5515374` → merge `e60bd2c` | `.gitignore` whitelist + `db/` raíz eliminado |

**Ronda 1 (ERP core) COMPLETA:** las 4 lanes ERP + encoding + tokens cerradas e integradas
en `dev`. Pendiente heredado: terminar `ai_config`.

### Ronda 2 — WEB-STORE (abierta 2026-07-05, mandato del usuario: lanzar la web comercial)

Orden SECUENCIAL (todas las lanes escriben `storage/db/**`; no correr dos a la vez salvo
que el Orquestador verifique superficie disjunta). Contratos en `storage/progreso/lanes/`.

| # | Lane (rama) | Estado | Depende de | Superficie resumida |
|---|-------------|--------|------------|---------------------|
| 1 | `goal/webstore-data-mocks` | ✅ **CERRADA** (merge `a9a7627`) | storage-dedup ✅ | doc ESTRATEGIA_DATOS + schema `seed_registros` + mocks lote `webstore_r2` |
| 2 | `goal/webstore-producto-compositor` | ✅ **CERRADA** (merge `afe1b4e`) | 1 | `prefabricados`+campos web, zap recálculo, tab en CatalogoManager |
| 3 | `goal/webstore-portfolio-publico` | ✅ **CERRADA** (pre-incidente; contenido sellado en `f96092b`) | 1 | schemas portfolio, campo `barrio` en proyectos, `/app/erp/portfolio`, `/portafolio` |
| 4 | `goal/webstore-tienda-ui` | ✅ **CERRADA** (merge `e6ba89b`, smoke 4/4: /, /tienda, /tienda/:slug, /portafolio → 200) | 2 ✅, 3 ✅ | `/tienda` + detalle + carrito + nav pública |
| 5 | `goal/webstore-clientes` | 🔵 **EN_PROGRESO — WIP EXTERNO** (rama pusheada; código tareas 1-4 en disco SIN DoD verificado) | 1 ✅ | users rol `cliente`, `/cuenta`, `/api/auth/register` (toque engine acotado) |
| 6 | `goal/webstore-checkout-pagos` | ⚪ BLOQUEADA | 4 ✅, 5 | `pedidos_web`, checkout Wompi sandbox, webhook, ERP pedidos |
| 7 | `goal/webstore-seo-lanzamiento` | ⚪ BLOQUEADA | 4 ✅, 3 ✅ | robots/sitemap/JSON-LD/llms.txt/metadata |

**Modo de operación desde 2026-07-06 (tarde):** por presupuesto de tokens, CERO subagentes.
Los workers corren en entornos externos (modelo liviano) con prompts generados por el
Orquestador Fable 5, que solo supervisa: audita cierres, mergea `--no-ff`, pushea `dev` y
entrega el siguiente prompt. Incidente git del mediodía documentado en
`INCIDENTE_GIT_2026-07-06.md` (recuperado en `f96092b`, reglas nuevas en §3 y AGENTS.md).

Hotfix de homeostasis fuera de lane (hecho por el Orquestador en el tree principal porque
los archivos eran invisibles para cualquier worktree): `.gitignore` ignoraba
`src/components/specialized/*` y 10 bloques del fork vivían solo en disco (CatalogoManager,
EquipoDirectory, VetaTestimonials, VetaEmbudoModal/Form, ConciliacionBancaria, UserProfile,
CalendarScheduler, ProveedoresDirectory, ProductionTransitionDialog). Whitelist total +
trackeo. Era la causa del 500 en `/` reportado por la lane 1.

### Hallazgos abiertos (ronda 2)
- `cobro.json` y `edl.json` sueltos en la raíz (fixtures de prueba wompi/shotstack sin
  commitear): decidir destino (mover a fixtures de sus adapters o borrar).
- 14 errores `tsc --noEmit` preexistentes (deuda de tipos; `ignoreBuildErrors: true` los
  tolera en build). Candidata: lane `goal/ts-debt` post-ronda.
- Respaldos `1ea4612`/`e760e55`/`b9eacf7` (WIP de sesiones previas) siguen SIN auditar.
- Zap `recalcular_precio_prefabricado` verificado estáticamente; falta ejecución real
  vía `/api/engine` en el smoke de cierre de ronda.

Nota de gobernanza: los contratos nacen `plan_aprobado` por mandato directo del usuario
(2026-07-05); la etapa de aprobación humana del pipeline Fable 5 queda cubierta por ese
mandato para esta ronda.

### Ronda paralela — EXTRACCIÓN ADAPTERS IA (mandato del usuario 2026-07-06)

Mandato: el fork no conserva adapters que rompan el principio axiomático. Salen
`runpod-comfyui`, `shotstack-composer`, `google-ads-conversions` y `meta-conversions-api`
hacia carpetas hermanas; el foco futuro es el proyecto satélite `estudio_multimedia`
(estudio render+video IA con arnés propio, a diseñar tras el cierre de esta lane).

| # | Lane (rama) | Estado | Depende de | Superficie resumida |
|---|-------------|--------|------------|---------------------|
| P1 | `goal/adapters-ia-extraccion` | ✅ **CERRADA** — merge `2a96f71` a `dev` (2026-07-06) | superficie disjunta de webstore | 4 adapters extraídos: `src/integrations` + api routes + registro + `scripts/agno.ts` + docs módulos (−4.146 líneas) |

Checkpoint tarea 1 CUMPLIDO (2026-07-06): reporte en
`AUDITORIA_ADAPTERS_IA_2026-07-06.md`, commiteado en la rama. Hallazgos clave de la
auditoría del Orquestador:
- `storage/db/` está LIMPIO (0 refs a los 4) → la tarea 4 original se degrada a
  verificación; desaparece el conflicto con `scripts.json` de webstore → paralelizable.
- Riesgo crítico confirmado en verificación independiente: `scripts/agno.ts` importa
  estáticamente los 4 adapters (líneas 55-64) + bloques por-adapter (~363-390, 2072-2081,
  2418, 2483-2492) → **enmienda v2 del contrato**: `scripts/agno.ts` entra a la
  superficie (toque engine acotado: SOLO borrar ramas de los 4 ids, el dispatch genérico
  `agno adapter <id> <verbo>` se conserva).
- `edl.json` (raíz) = fixture shotstack → se archiva en el satélite. `cobro.json` =
  fixture wompi → se queda (cierra parcialmente el hallazgo abierto de ronda 2).
- Docs de módulos en diseño (`render-studio`, `video-editor`) entran a superficie solo
  para notas de migración al satélite; docs históricos de `src/adapters/` NO se reescriben.
El adapter de mensajería `meta` NO sale (solo `meta-conversions-api`).

Cierre (2026-07-06): auditoría del Orquestador CONFORME (matriz V1-V8 PASS en el contrato;
diff dentro de superficie; copias íntegras con `ORIGEN.md` en `../estudio_multimedia/` y
`../adapters_archive/`). Desviación menor corregida por hotfix de orquestador post-merge:
4 comentarios JSDoc obsoletos en `src/adapters/_contracts/{render,video-composer}-adapter.ts`
(fuera de la superficie del worker) ahora apuntan al satélite. Merge `--no-ff` → `2a96f71`.
**Siguiente etapa del programa:** sesión pesada de diseño del arnés del proyecto satélite
`estudio_multimedia` (estudio render+video IA), partiendo del código preservado.

### Reglas del tablero
- El Orquestador **solo despacha lanes en `LISTA`**. Una `BLOQUEADA` no se toca hasta que su trigger se cumple.
- **Dos `LISTA` sin superficie compartida** pueden correr en paralelo (worktrees separados).
- Al cerrar una lane, el Orquestador reevalúa triggers: los `BLOQUEADA` cuyo trigger se cumplió pasan a `LISTA`.
- **QA mecánico obligatorio antes de auditar (paso 2 Fable-5):** correr
  `node scripts/lane-qa.mjs <rama> --contract <contrato>` — caza scope creep (archivos fuera
  de la superficie declarada) y verifica gates, sin juicio humano. Cada contrato declara su
  superficie con la marca `<!-- lane-surface: glob | glob -->`. Esto automatiza el
  `git show --stat` manual que atrapó el toque al engine `agno.ts` y otras fugas.

**Por qué encoding fue lane-0 (histórico):** la regla "todo goal cierra con commit"
depende del commit gate; estaba roto para *todos* por mojibake pre-existente. La lane de
encoding fue auto-desbloqueante (al reparar, el gate pasó a verde). Cerrada e integrada
en `dev` (`16c14eb`).

### Hallazgos estructurales registrados (para lanes futuras)
- **`db/` en la raíz duplica `storage/db/`** (contrato de storage: raíz única `storage/db/`). → `goal/storage-dedup`.
- **`storage/db/` NO está en la lista blanca del `.gitignore`** (`storage/*` + whitelist en líneas 47–55): los JSON de datos quedan *trackeados pero ignorados* — estado frágil, probablemente introducido por el sync del seed (`85f9c37`). → arreglar en `goal/storage-dedup` (añadir `!storage/db/` + `!storage/db/**`).
- **M4 (chequeo post-sync) debe volverse ritual obligatorio** en `AGENTS.md §Versionado`: la mojibake entró por sync, no por escritura.

---

## 5. Plantilla de contrato de lane

Cada agente-worker abre y cierra su propia ventana de trabajo con este contrato. Se
guarda en `storage/progreso/lanes/goal-<nombre>.md`.

```markdown
# Contrato de lane: goal/<nombre>

## Identidad
- Rama: goal/<nombre>
- Worktree: ../wt-<nombre>  (git worktree add ../wt-<nombre> goal/<nombre>)
- Rol/modelo: worker <plan|código> — <modelo>
- Estado: plan_borrador | plan_aprobado | en_progreso | requiere_ajuste | cerrado

## Goal (teleología)
<una frase: qué capability queda funcionando al cerrar>

## Superficie (y SOLO esta)
<paths exactos que el agente puede tocar>
<!-- lane-surface: glob/uno/** | glob/dos/archivo.json -->
(La marca de arriba es leída por `scripts/lane-qa.mjs` para el QA mecánico. Debe listar,
separados por `|`, los globs que la lane puede tocar. El QA falla si el diff toca algo fuera.)

## Fuera de alcance
<lo que NO toca — otras lanes>

## Depende de / bloquea a
<lanes o artefactos previos>

## DAG de tareas (cada una con DoD ejecutable, no prosa)
1. <tarea> — DoD: <comando real que verifica>
...

## DoD de cierre
- [ ] commit(s) en goal/<nombre>
- [ ] npm run validate:storage  → verde
- [ ] npm run validate:encoding → verde
- [ ] <verificación específica de la capability>

## Matriz de verificación
| Check | Comando | Esperado | Resultado | Evidencia |
|-------|---------|----------|-----------|-----------|
```

---

## 6. Monitoreo continuo de homeostasis

Lección del 2026-07-04: la mojibake **ya se había reparado antes y regresó**. Eso
significa que hay un *camino de reintroducción* abierto. Reparar sin cerrar ese camino
garantiza la recurrencia. El monitoreo continuo es parte del modelo, no un extra:

- **Gate no evadible en CI.** El hook local se puede saltar con `--no-verify`; una
  validación en CI/pre-push que corra `validate:encoding` full-tree no.
- **Camino de escritura UTF-8 explícito.** Todo write a `storage/` (agno CLI,
  scripts, agentes) escribe UTF-8 sin BOM. En Windows/PowerShell, `Set-Content`/
  `Out-File` **sin** `-Encoding utf8` reintroduce bytes Latin-1/UTF-16 → prohibido para
  archivos de `storage/`.
- **Chequeo post-sync.** Tras cada `sync engine`/`recibe actualizacion del seed`, correr
  `validate:encoding` antes de commitear el merge.
- **Auditoría de `--no-verify`.** Cualquier commit con `--no-verify` se registra y se
  justifica (los respaldos del 2026-07-04 están documentados en sus mensajes de commit).

---

## 7. Bucle maestro (cómo se auto-perpetúa)

El sistema es un ciclo, no una lista de tareas de un solo uso. Siempre gira igual:

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. ORQUESTADOR (pesado)                                             │
│     Deja el arnés: tablero de lanes (estado + trigger) + contratos.  │
│                          │                                           │
│                          ▼                                           │
│  2. WORKERS (livianos, uno por lane LISTA, en su worktree)          │
│     Ejecutan su contrato tarea por tarea. Cierran con commit.       │
│                          │                                           │
│                          ▼                                           │
│  3. AUDITOR (pesado, sesión nueva, MODO AUDITORIA)                  │
│     Revisa objetivamente el resultado de cada lane contra su         │
│     contrato. Veredicto por lane: CONFORME / DESVIACION.            │
│                          │                                           │
│                          ▼                                           │
│  4. RE-PLANEACIÓN (Orquestador)                                     │
│     Cierra pipelines viejas (lanes CERRADAS), reevalúa triggers,    │
│     abre lanes nuevas para la siguiente etapa. ──────┐              │
│                                                       │              │
└───────────────────────────────────────────────────────┘             │
            ▲                                                          │
            └──────────────────── vuelve a 1 ──────────────────────────┘
```

- **Pesado vs liviano:** el juicio (planear, auditar, re-planear) usa modelo pesado;
  la ejecución mecánica usa modelo liviano. El diseño ya vive en el contrato, así que
  el liviano no re-razona: ejecuta y verifica su DoD.
- **El auditor es una sesión APARTE.** No es el mismo worker que escribió el código
  (evita que se apruebe a sí mismo). Corresponde a la etapa 5 del pipeline Fable 5.
- **Handoff entre sesiones:** este archivo + los contratos en `lanes/` + el estado en
  git SON el arnés. Una sesión nueva (worker o auditor) arranca leyéndolos, sin
  contexto previo.

---

## Referencias

- Contrato de concurrencia y mapa de ramas: [`storage/AGENTS.md`](../AGENTS.md)
- Pipeline Fable 5 (etapas): `src/adapters/current_state.md`
- Lane-0 encoding (plan + matriz): [`lanes/goal-encoding-homeostasis.md`](lanes/goal-encoding-homeostasis.md)
