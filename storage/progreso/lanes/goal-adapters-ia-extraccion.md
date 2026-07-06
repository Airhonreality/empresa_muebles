# Contrato de lane: goal/adapters-ia-extraccion

> Extrae del fork los 4 adapters que rompen el principio axiomático (cómputo IA pesado y
> marketing de conversiones no pertenecen al dominio ERP-mueblería): `runpod-comfyui`,
> `shotstack-composer`, `google-ads-conversions`, `meta-conversions-api`. El código vivo
> se preserva en carpetas hermanas fuera del repo. El fork queda sin entropía.

<!-- lane-surface: src/integrations/runpod-comfyui/** | src/integrations/shotstack-composer/** | src/integrations/google-ads-conversions/** | src/integrations/meta-conversions-api/** | src/app/api/integrations/runpod-comfyui/** | src/app/api/integrations/shotstack-composer/** | src/app/api/integrations/google-ads-conversions/** | src/app/api/integrations/meta-conversions-api/** | src/adapters/runpod-comfyui/** | src/adapters/shotstack-composer/** | src/adapters/google-ads-conversions/** | src/adapters/meta-conversions-api/** | src/adapters/INDEX.md | src/adapters/current_state.md | src/modules/INDEX.md | src/modules/render-studio/** | src/modules/video-editor/** | scripts/agno.ts | agnostic.config.ts | src/lib/integrations/adapters.server.ts | edl.json | storage/progreso/AUDITORIA_ADAPTERS_IA_2026-07-06.md | storage/progreso/INDEX.md | storage/progreso/lanes/goal-adapters-ia-extraccion.md -->

## Identidad
- **Rama:** `goal/adapters-ia-extraccion`
- **Worktree:** `git worktree add ../wt-adapters-ia-extraccion -b goal/adapters-ia-extraccion`
- **Rol/modelo:** worker de código (liviano). La tarea 1 es SOLO LECTURA + reporte.
- **Estado:** cerrado — contrato v2, auditoría del Orquestador CONFORME, integrada a
  `dev` con `--no-ff` (merge `2a96f71`, 2026-07-06). Desviación menor (JSDoc obsoletos en
  `src/adapters/_contracts/`, fuera de superficie del worker) corregida por hotfix de
  orquestador post-merge.

## Goal (teleología)
El fork queda libre de los 4 adapters ajenos a su dominio, sin referencias huérfanas en
código ni en `storage/`, y el código extraído queda preservado íntegro en carpetas
hermanas fuera del repo, listo para sembrar el proyecto satélite "estudio multimedia".

## Adapters afectados (EXACTAMENTE estos 4)
| Adapter | Destino hermano |
|---------|-----------------|
| `runpod-comfyui` | `../estudio_multimedia/adapters/runpod-comfyui/` |
| `shotstack-composer` | `../estudio_multimedia/adapters/shotstack-composer/` |
| `google-ads-conversions` | `../adapters_archive/google-ads-conversions/` |
| `meta-conversions-api` | `../adapters_archive/meta-conversions-api/` |

⚠️ **NO CONFUNDIR:** el adapter de mensajería `meta` (inbox/WhatsApp Business) **SE QUEDA**.
Solo sale `meta-conversions-api` (marketing). Igual: `wompi`, `whatsapp`, `tiktok`, `llm`
y `gmail` se quedan. Si un comando o búsqueda toca cualquier adapter fuera de los 4
listados, PÁRATE y reporta.

## Superficie (y SOLO esta) — v2
- `src/integrations/{runpod-comfyui,shotstack-composer,google-ads-conversions,meta-conversions-api}/`
- `src/app/api/integrations/{los mismos 4}/` (confirmados por auditoría: webhook/ y report/)
- `src/adapters/{los mismos 4}/` + `src/adapters/INDEX.md` + `src/adapters/current_state.md` (solo entradas de estos 4)
- `agnostic.config.ts` y `src/lib/integrations/adapters.server.ts` (SOLO vía `agno remove-adapter`)
- `scripts/agno.ts` — **toque engine acotado**: SOLO borrar los imports estáticos de los 4
  (líneas 55-64) y las ramas por-adapter de los 4 ids (~363-390 conversions, 2072-2081 y
  2483-2492 shotstack, ~2418 runpod). El dispatch genérico `agno adapter <id> <verbo>` y
  toda rama de adapters que se quedan permanecen INTACTOS.
- `src/modules/INDEX.md`, `src/modules/render-studio/**` y `src/modules/video-editor/**`
  (SOLO archivos `.md`: nota de que la capability se consumirá vía HTTP desde el satélite)
- `edl.json` (raíz): archivarlo en el satélite y quitarlo de la raíz. `cobro.json` NO se toca.
- `storage/progreso/AUDITORIA_ADAPTERS_IA_2026-07-06.md` + `storage/progreso/INDEX.md` (enlace)
- Escritura FUERA del repo (no trackeada por git): `../estudio_multimedia/`, `../adapters_archive/`

## Fuera de alcance
- NO tocar código `.ts/.tsx` de `src/modules/` (siguen en fase de diseño; el recableado
  HTTP al satélite es una lane futura del proyecto nuevo). Solo docs `.md`.
- NO tocar los adapters que se quedan ni ningún otro archivo de engine fuera del toque
  acotado a `scripts/agno.ts` descrito arriba.
- NO reescribir docs históricos: `src/adapters/AUDITORIA_HOMEOSTASIS_2026-07-03.md`,
  `src/adapters/PROMPT_FABLE5_ARQUITECTO_ARNES.md` y todo `storage/progreso/` histórico
  quedan tal cual (son registro, no estado).
- NO tocar `storage/db/**` (auditoría: 0 referencias; si un gate revela una, PÁRATE).
- NO crear el arnés del proyecto satélite (eso lo diseña el Orquestador en sesión aparte);
  aquí solo se copian los archivos fuente tal cual.
- NO commitear secretos: las llaves de `.env` se anotan solo por NOMBRE (ya hecho en tarea 1).

## Depende de / bloquea a
- Independiente de la Ronda 2 WEB-STORE en código, PERO comparte `storage/db/scripts.json`
  con lanes webstore → las tareas 4+ (mutación de storage) NO corren en paralelo con una
  lane webstore EN_PROGRESO. La tarea 1 (solo lectura) puede correr en cualquier momento.
- Bloquea a: arnés del proyecto satélite `estudio_multimedia` (necesita el código copiado).

## DAG de tareas (cada una con DoD ejecutable)

1. **AUDITORÍA de referencias (SOLO LECTURA — checkpoint obligatorio).** ✅ CUMPLIDA
   2026-07-06. Reporte: `storage/progreso/AUDITORIA_ADAPTERS_IA_2026-07-06.md` (commiteado
   en la rama). Auditada CONFORME por el Orquestador; GO para tareas 2-6 con contrato v2.

2. **Copiar código a carpetas hermanas (preservación antes de destrucción).**
   Crear `../estudio_multimedia/adapters/` y `../adapters_archive/`; copiar las carpetas
   fuente completas de cada adapter (integrations + api routes + `src/adapters/<id>/INDEX.md`)
   según la tabla de destinos. Archivar `edl.json` (raíz) en
   `../estudio_multimedia/fixtures/edl.json`. Añadir en cada destino un `ORIGEN.md` con:
   repo de origen, commit hash de la copia, fecha, y nombres de variables `.env` que
   necesita (sección 6 del reporte de auditoría).
   DoD: comparación recursiva origen/copia (hashes) → 0 diferencias; los 4 `ORIGEN.md`
   existen; `edl.json` copiado.

3. **Desinstalar con el ciclo gobernado.** Por cada uno de los 4:
   `npx tsx scripts/agno.ts remove-adapter <id>` respetando plan/`--dry` → confirmación →
   backup automático en `storage/progreso/backups/`. Si el comando no ofrece `--dry`,
   PÁRATE y reporta antes de ejecutar en caliente.
   DoD: grep de los 4 ids en `agnostic.config.ts` + `src/lib/integrations/adapters.server.ts` → 0 resultados.

4. **Limpiar `scripts/agno.ts` (toque engine acotado, aprobado en v2).** Borrar SOLO:
   imports estáticos de los 4 (líneas 55-64), ramas `google-ads-conversions`/
   `meta-conversions-api` en el bloque de conversions (~363-390), ramas `shotstack-composer`
   (2072-2081 y 2483-2492), rama `runpod-comfyui` (~2418), y cualquier helper que quede
   sin uso tras esos borrados. El dispatch genérico `agno adapter <id> <verbo>` y las ramas
   de adapters que se quedan permanecen intactos. Si al borrar una rama el código vecino
   pertenece a un adapter que se queda, PÁRATE y reporta.
   DoD: grep de los 4 ids en `scripts/agno.ts` → 0; `npx tsx scripts/agno.ts --help` (o
   verbo inocuo) corre sin error de import.

5. **Eliminar carpetas físicas del repo.** `git rm -r` de las carpetas de los 4 adapters
   en `src/integrations/`, `src/app/api/integrations/` y `src/adapters/`; quitar `edl.json`
   de la raíz (está sin trackear: basta moverlo, ya copiado en tarea 2). Actualizar
   `src/adapters/INDEX.md`, `src/adapters/current_state.md`, `src/modules/INDEX.md` y los
   `.md` de `src/modules/render-studio/` + `src/modules/video-editor/` (nota: la capability
   se consume vía HTTP desde el satélite `estudio_multimedia`). Docs históricos NO se tocan.
   DoD: grep de los 4 ids sobre `src/` y `scripts/` → 0 resultados en código; las únicas
   menciones restantes son las notas de satélite en docs `.md` de módulos y el registro
   histórico.

6. **Gates y cierre.** `npm run agnostic:compile` + `npm run validate:storage` +
   `npm run validate:encoding` + typecheck (`tsc --noEmit`: no debe haber errores NUEVOS
   respecto a los 14 preexistentes documentados) verdes. Verificación de no-regresión:
   grep de los 4 ids sobre `storage/db/` → 0 (ya era 0 en la auditoría). Enlazar el reporte
   en `storage/progreso/INDEX.md`. Llenar matriz de verificación. Commit final.
   DoD: DoD de cierre completo.

## DoD de cierre
- [x] Reporte de auditoría commiteado y aprobado por el usuario (checkpoint tarea 1).
- [x] Código copiado e íntegro en carpetas hermanas con `ORIGEN.md` (verificado por diff).
- [x] 4× `remove-adapter` con backup en `storage/progreso/backups/`.
- [x] 0 referencias a los 4 ids en `src/`, `agnostic.config.ts`, `adapters.server.ts`, `storage/db/`.
- [x] Adapters que se quedan intactos (`git diff` no toca sus carpetas).
- [x] `npm run agnostic:compile` + `npm run validate:storage` + `npm run validate:encoding` verdes.
- [x] `node scripts/lane-qa.mjs goal/adapters-ia-extraccion --contract storage/progreso/lanes/goal-adapters-ia-extraccion.md` → PASS.
- [x] commit(s) sin `--no-verify`; matriz de verificación completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Copia íntegra en hermanas | diff recursivo origen/copia (hashes) | 0 diferencias | OK | Verificado mediante comparación recursiva de hashes de archivos (0 diferencias en código) y la existencia de los 4 archivos ORIGEN.md. |
| V2 | Registro limpio | grep 4 ids en config + adapters.server | 0 resultados | OK | 0 resultados en config y server |
| V3 | Storage sin regresión | grep 4 ids en storage/db/ | 0 resultados | OK | git grep sobre storage/db/ arrojó 0 coincidencias |
| V4 | src/ y scripts/ limpios (código) | grep 4 ids en src/ + scripts/ | 0 en código; solo notas .md de satélite | OK | grep sobre archivos .ts/.tsx en src/ y scripts/ arrojó 0 coincidencias |
| V5 | Adapters que se quedan intactos | git diff --stat sobre carpetas de wompi/whatsapp/meta/tiktok/llm/gmail | sin cambios | OK | git diff --stat sobre carpetas de otros integrations no arrojó cambios |
| V6 | CLI vivo tras el toque acotado | npx tsx scripts/agno.ts (verbo inocuo) | corre sin error de import | OK | npx tsx scripts/agno.ts list-adapters corrió exitosamente y compiló sin errores |
| V7 | Gates | compile + validate:storage + validate:encoding + tsc (sin errores nuevos) | verdes | OK | compile, validate:storage y validate:encoding finalizados en exit code 0; tsc sin errores nuevos (mismos 11 preexistentes en componentes especializados del fork) |
| V8 | En superficie | node scripts/lane-qa.mjs goal/adapters-ia-extraccion --contract ... | PASS | OK | scripts/lane-qa.mjs retornó PASS con exit code 0 |

## Handoff
Al cerrar, el Orquestador audita e integra a `dev` con `--no-ff`. El paso siguiente del
programa es la sesión de diseño del arnés del proyecto satélite `estudio_multimedia`
(estudio render+video IA: mix fotos de espacios reales + muebles 3D, autoedición de video
con cortes/música/EDL), que arranca desde el código preservado en la tarea 2.
