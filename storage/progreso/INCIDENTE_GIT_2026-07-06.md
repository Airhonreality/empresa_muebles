# Incidente Git — 2026-07-06

## Qué pasó
Dos agentes en paralelo (ronda WEB-STORE y ronda extracción adapters IA) operaron sobre el
mismo `.git` del repo principal. Un `git worktree remove --force` abortó a mitad por rutas
>260 caracteres (node_modules dentro del worktree, sin `core.longpaths`); el watcher de
GitKraken/GitLens (`.git/gk`) interfirió con el `.git` a medio operar y se perdió
`objects/` completo. Nada se había pusheado desde el 2026-07-02.

## Pérdidas
- Historia local 2026-07-02 → 2026-07-06 (~30 commits): perdida como commits; el CONTENIDO
  resultante sobrevive íntegro (este commit de recuperación lo sella).
- Rama `goal/erp-ai-config-schema` (checkpoint e3ad372): perdida; su contrato permite re-ejecutarla.
- 3 mocks de productos de la lane tienda-ui: nunca llegaron a disco; se reponen post-recuperación.

## SHAs testimoniales (refs sueltas rescatadas, sin objetos)
- dev pre-crash: 7993513 (merge portfolio-publico)
- goal/webstore-portfolio-publico: 5fff5bf | goal/webstore-producto-compositor: 515d520
- goal/adapters-ia-extraccion: 5db4833
- Respaldo completo: ../RESCATE_empresa_muebles_2026-07-06/ (git remanente, storage, src, lane tienda)

## Reglas nuevas (no negociables, se propagan a AGENTS.md/ORQUESTACION.md)
1. Toda lane cierra con commit **y push** de su rama a origin.
2. El Orquestador pushea `dev` tras cada merge de lane.
3. Operaciones estructurales de git (worktree add/remove, checkout de ramas, reset) se
   SERIALIZAN a través de un solo orquestador: el `.git` es superficie compartida aunque
   los archivos no lo sean. Dos rondas paralelas = dos repos clonados, no un .git compartido.
4. `core.longpaths true` obligatorio en Windows; nunca `worktree remove` con node_modules dentro.
5. Clientes git GUI (GitKraken/GitLens) cerrados durante operaciones de agentes.
