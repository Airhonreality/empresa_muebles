# Metodología: Claude Code orquestando agentes OpenCode

Documento técnico sobre los alcances reales de que un modelo como Claude (yo, corriendo como Claude Code) instancie y dirija agentes de `opencode` como "trabajadores" de código, de forma análoga a como uso mi propia herramienta `Agent` para lanzar subagentes de Claude.

## 1. La premisa correcta

Claude Code y `opencode` son, en el fondo, la misma clase de programa: un CLI que envuelve un LLM con tools de filesystem (`read`, `edit`, `glob`, `grep`), ejecución de shell (`bash`), y su propio mecanismo de sub-delegación (`task`/subagentes). Yo tengo acceso a una terminal sin restricciones (`Bash`/`PowerShell`), así que puedo invocar `opencode` como cualquier otro proceso del sistema — exactamente como haría un operador humano, solo que scripteado.

Esto significa que la pregunta "¿puedo usar opencode para escribir código en paralelo?" tiene una respuesta técnica clara: **sí**, con dos matices que hay que respetar:

- No tengo una TTY interactiva real. No puedo "usar" el TUI de opencode (el que se ve al escribir `opencode` a secas) — no puedo navegar menús ni ver redibujados de pantalla. Lo que sí puedo usar es su modo headless: `opencode run`.
- `opencode`, al arrancar en una carpeta, lee `AGENTS.md` en la raíz del repo automáticamente (es la convención estándar que implementa, igual que yo leo `CLAUDE.md`). En este repo ambos archivos son idénticos, así que un worker de opencode lanzado con `--dir` apuntando aquí entiende los límites Engine/Project/Storage sin que yo se los tenga que inyectar a mano en cada prompt.

## 2. Qué es `/agents` y cómo funciona el sistema de agentes de opencode

En el TUI, `/agents` (o el menú "Agents" del command palette) abre un **selector/editor de perfiles de agente** para la sesión activa. No es un simple modelo — cada "agente" en opencode es la combinación de:

1. **Un modo**: `primary` o `subagent`.
   - Los `primary` (`build`, `plan`, `compaction`, `summary`, `title`) son agentes con los que hablás directamente en una sesión — equivalentes a mi hilo principal.
   - Los `subagent` (`explore`, `general`, o cualquiera que crees) sólo son invocables *desde* un agente primary a través de su tool `task` — equivalentes exactos a mi tool `Agent`/subagentes (`Explore`, `general-purpose`, etc.).
2. **Un modelo** (`-m provider/model`), independiente por agente. Podés tener `build` corriendo Gemini Pro y un subagente `explore` corriendo un modelo free.
3. **Un perfil de permisos** — un JSON de reglas `allow` / `ask` / `deny` por tool y patrón (bash, read, edit, glob, grep, webfetch, task, todowrite, websearch, lsp, skill), evaluado por patrón de archivo. Es el equivalente de mi `settings.json` de permisos, pero por-agente en vez de global.

`opencode agent create` es el comando que genera un nuevo perfil (`--path`, `--description`, `--mode`, `--permissions/--tools`, `-m`). Internamente crea un archivo de definición (Markdown con frontmatter, igual que mis `.claude/agents/*.md`) que después aparece listado en `opencode agent list` y seleccionable vía `/agents` en el TUI.

**Conclusión práctica**: si quiero un "worker" de opencode con permisos acotados (por ejemplo, que sólo pueda `read`+`edit` dentro de `src/components/specialized/` y no pueda tocar `storage/db/`), lo defino una vez como agente custom con `opencode agent create`, y después lo invoco por nombre con `--agent <nombre>` en cada `run`.

## 3. Tabla de equivalencias

| Concepto | Claude Code (yo) | opencode |
|---|---|---|
| Agente principal | Este hilo de conversación | Agente `primary` (ej. `build`) |
| Delegar a un worker | Tool `Agent` (`subagent_type: Explore`, etc.) | Tool `task` interna, o yo invocando `opencode run --agent <subagent>` desde afuera |
| Definición de worker | `.claude/agents/*.md` | `opencode agent create` → `.opencode/agent/*.md` |
| Permisos por worker | `settings.json` / permission mode | JSON `allow/ask/deny` por agente |
| Convención de arranque | `CLAUDE.md` | `AGENTS.md` (mismo contenido en este repo) |
| Ejecución sin UI | Nativo (headless por diseño) | `opencode run` (headless) / `opencode serve` (servidor) / `opencode acp` (protocolo) |
| Continuar una sesión | Contexto de esta conversación | `--continue` / `--session <id>` / `--fork` |

## 4. Dos arquitecturas de orquestación

### A. Proceso-por-tarea (simple, ya validado, es el punto de partida recomendado)

Por cada ítem del plan, yo lanzo un proceso `opencode run` desde mi `Bash` tool:

```bash
opencode run \
  --dir "<worktree-de-la-tarea>" \
  --agent <nombre-del-agente-worker> \
  -m opencode/<modelo-free-o-gemini> \
  --format json \
  "<prompt específico de la tarea, con criterios de aceptación>"
```

- Stateless: cada invocación es independiente, fácil de razonar y de auditar.
- Paralelizable de verdad: puedo lanzar varios `Bash` con `run_in_background: true` al mismo tiempo, cada uno apuntando a su propio `git worktree`, y recojo los resultados cuando terminan.
- `--format json` me da eventos estructurados en vez de texto formateado para TUI, más fácil de parsear.

### B. Mediada por servidor (más potente, con estado persistente)

`opencode serve` levanta un servidor HTTP headless; `opencode acp` levanta un servidor sobre **Agent Client Protocol** (el protocolo que Zed diseñó específicamente para que un cliente externo —editor u otro agente— dirija a un agente de código manteniendo sesión, streaming de eventos y turnos). Con esto podría:

- Mantener una sesión larga por tarea sin repetir todo el contexto en cada prompt.
- Adjuntar (`opencode attach <url>`) o correr el servidor en otra máquina/puerto y dirigirlo remotamente.

Para el volumen que estás describiendo (tareas discretas, revisión por diff), la arquitectura A es suficiente y más fácil de auditar. B vale la pena si en algún momento necesitamos conversaciones largas multi-turno con un mismo worker.

## 5. Modelos disponibles sin costo adicional

Vía el proveedor "zen" propio de opencode (gratis, calidad no verificada — son codenames de modelos en prueba):

```
opencode/big-pickle
opencode/deepseek-v4-flash-free
opencode/laguna-s-2.1-free
opencode/ling-3.0-flash-free
opencode/mimo-v2.5-free
opencode/nemotron-3-ultra-free
opencode/north-mini-code-free
```

Vía tu `GEMINI_API_KEY` (cuota de Google, sujeta a tu plan): toda la familia `google/gemini-*`.

Recomendación: usar los `*-free` de opencode para tareas chicas, acotadas y de bajo blast-radius (un componente, un test, boilerplate). Para algo que toque el contrato de `storage/` o límites Engine/Project, usar Gemini Pro o similar, y auditar con más cuidado.

## 6. Reglas de seguridad no negociables para este repo

1. **Un `git worktree`/branch por tarea.** Ningún worker de opencode escribe directo sobre `main` ni sobre tu working tree activo.
2. **Nunca `--auto`** (auto-aprueba permisos) en tareas que toquen `storage/db/`, `agnostic.config.ts`, o cualquier archivo bajo `packages/` / `src/lib/agnostic/` / `src/app/api/` — son zona Engine según `CLAUDE.md`.
3. **Yo audito cada diff antes de mergear**, contra los `Forbidden Patterns` y el invariante `block.context === schema.data.name === data_file_name_without_json` de `CLAUDE.md`.
4. **Mutaciones de `storage/` pasan por `agno`**, nunca por edición directa de JSON hecha por un worker de opencode — si una tarea requiere tocar storage, el prompt del worker debe indicarle usar los comandos `agno` correspondientes, respetando el ciclo `plan` → `--dry` → confirmación.
5. **Prompts explícitos con criterios de aceptación**, no vagos — un worker sin supervisión humana en el loop rinde mejor cuanto más acotada y verificable es la tarea.

## 7. Flujo de trabajo end-to-end

1. Yo genero el plan de implementación (alcance, archivos afectados, orden de dependencias).
2. Lo trocealizo en tareas independientes o con dependencias claras.
3. Por cada tarea: creo un `git worktree` dedicado, redacto un prompt dedicado (contexto mínimo necesario + criterios de aceptación + referencia a qué partes de `AGENTS.md`/`CLAUDE.md` aplican), y elijo el modelo/agente según el riesgo de la tarea.
4. Lanzo los `opencode run` (en paralelo vía `Bash run_in_background` cuando son independientes, secuencial cuando hay dependencia).
5. Por cada resultado: reviso `git diff`/`git status` en ese worktree, valido contra las reglas del harness, corro lint/typecheck/tests si aplica.
6. Si pasa auditoría: mergeo a la rama de trabajo. Si no: o lo corrijo yo directamente, o relanzo el worker con un prompt corregido señalando el problema específico.
7. Reporto al usuario un resumen de qué se aceptó, qué se corrigió y qué se descartó.

## 8. Limitaciones honestas

- Los modelos `*-free` son codenames sin garantía de calidad ni de estabilidad de disponibilidad — tratar como experimentales.
- Sin `--continue`/`--session`, cada `opencode run` no tiene memoria de invocaciones anteriores.
- El paralelismo real depende de correr varios `Bash` en background — dentro de una sola llamada son secuenciales.
- Rate limits/cuota de la capa gratuita de Gemini o del proveedor zen no están garantizados ni documentados aquí; si una tarea falla por cuota, hay que degradar a otro modelo o secuenciar.
