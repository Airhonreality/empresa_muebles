# Contrato de lane: goal/storage-dedup

> Limpia dos deudas de configuración de storage: el `db/` raíz duplicado (muerto) y el
> `.gitignore` que ignora `storage/db/`. Tarea mecánica y verificable. Sin juicio de diseño.

<!-- lane-surface: .gitignore | db/** | storage/db/** | storage/progreso/lanes/goal-storage-dedup.md -->

## Identidad
- **Rama:** `goal/storage-dedup`
- **Worktree:** `git worktree add ../wt-storage-dedup -b goal/storage-dedup`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** cerrado

## Goal (teleología)
Que `storage/db/` sea la ÚNICA raíz de datos y quede correctamente trackeada: eliminar el
`db/` raíz duplicado y cerrar la trampa del `.gitignore` que ignora `storage/db/` (donde un
archivo nuevo se perdería en silencio).

## Superficie (y SOLO esta)
- `.gitignore`
- `db/` (raíz, para eliminarlo)
- `storage/db/` (solo si aparecen archivos que estaban ignorados y hay que trackearlos)

## Fuera de alcance
- NO tocar código, schema, componentes, ni otros directorios de `storage/`.
- NO modificar el CONTENIDO de los JSON de `storage/db/` (solo trackeo).

## DAG de tareas (cada una con DoD ejecutable)
1. **Cerrar la trampa del `.gitignore`.** El bloque `storage/*` (líneas ~47-55) ignora todo
   `storage/` salvo un whitelist que NO incluye `storage/db/`. Añade al whitelist:
   ```
   !storage/db/
   !storage/db/**
   ```
   DoD: `git check-ignore storage/db/schema_definitions.json` no devuelve nada (ya no se ignora);
   `git status` muestra si aparecieron archivos de datos que estaban ignorados → si son datos
   legítimos, agrégalos (`git add`); si dudas de alguno, PÁRATE y reporta.
2. **Confirmar que el `db/` raíz está muerto ANTES de borrarlo.** Corre:
   `grep -rInE "process.cwd\(\).{0,20}'db'|['\"]\./db/|join\([^,]*, 'db'\)" src scripts packages`
   y verifica que NADA lo referencie (todo debe usar `storage/db`). DoD: 0 referencias al `db/`
   raíz. **Si encuentras UNA sola referencia, PÁRATE y reporta — no borres.**
3. **Eliminar el duplicado muerto.** Con la verificación en verde: `git rm -r db/`.
   DoD: `db/` ya no existe; el árbol sigue compilando/validando.

## DoD de cierre
- [x] `.gitignore` ya no ignora `storage/db/` (verificado con `git check-ignore`).
- [x] `db/` raíz eliminado (tras confirmar 0 referencias).
- [x] `npm run validate:storage` + `npm run validate:encoding` verdes.
- [x] `node scripts/lane-qa.mjs goal/storage-dedup --contract storage/progreso/lanes/goal-storage-dedup.md` → PASS.
- [x] commit(s) sin `--no-verify`; matriz de verificación completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | storage/db ya no ignorado | `git check-ignore storage/db/schema_definitions.json` | sin salida | PASS | Salida vacía (exit code 1) |
| V2 | db/ raíz sin referencias | grep de tarea 2 | 0 referencias | PASS | 0 referencias en src/scripts/packages |
| V3 | db/ raíz eliminado | `ls db 2>/dev/null` | no existe | PASS | Test-Path devuelve False (no existe) |
| V4 | En superficie | `node scripts/lane-qa.mjs ...` | PASS | PASS | Ejecución retorna PASS |
| V5 | Gates | validate:storage + validate:encoding | verdes | PASS | Ambos comandos exitosos (exit code 0) |

## Handoff
Al cerrar, el Orquestador corre el QA mecánico, audita e integra a `dev` con `--no-ff`.
