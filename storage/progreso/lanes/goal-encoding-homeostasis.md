# Contrato de lane: goal/encoding-homeostasis

## Estado de cierre
- Rama: `goal/encoding-homeostasis`
- Resultado: reparación de encoding completada en el alcance aprobado.
- Root cause confirmada: el contenido contaminado entró por migracion/sync de datos ya mojibakeados (origen rastreable desde `5b0783e` y preservado por `5ab7891` / `85f9c37`). El camino de escritura estaba limpio.

## Reparacion ejecutada
- `db/page_routes.json`: 6 lineas corregidas.
- `db/schema_definitions.json`: 16 lineas corregidas.
- `storage/db/schema_definitions.json`: 12 lineas corregidas.
- `storage/fork_doc/DOCS VETA DORADA/COMERCIAL WEB/Analiticas y SEO/Google ADS/INforme de grupos de anuncios.md`: 4 lineas corregidas.
- `storage/fork_doc/DOCS VETA DORADA/COMERCIAL WEB/Analiticas y SEO/Google ADS/Informe de terminos de busqeuda.md`: 216 lineas corregidas.
- `src/generated/agnostic-schemas.ts`: regenerado desde `storage/db/schema_definitions.json` con `agnostic:compile`.
- `package.json`: se agrego `validate:storage` para poder ejecutar el gate oficial.
- `.githooks/pre-push`: se agrego la guarda M1.

## Hallazgos de alcance
- El directorio raiz `db/` es un duplicado trackeado; se reparo en sitio para desbloquear el gate, pero no se elimino.
- Los snapshots `storage/db/.history/` siguen fuera del gate por diseno y no se reescribieron.

## 7. Matriz de verificacion
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Sin mojibake full-tree | `npm run validate:encoding` | `passed (N files)` | PASS | `Encoding validation passed (628 file(s)).` |
| V2 | Sin BOM | cubierto por V1 | sin `BOM is not allowed` | PASS | Gate full-tree verde |
| V3 | JSON parsea | `node -e "JSON.parse(require('fs').readFileSync('storage/db/schema_definitions.json','utf8'))"` | sin error | PASS | Parse validado tras la escritura |
| V4 | idem page_routes | `node -e "JSON.parse(require('fs').readFileSync('db/page_routes.json','utf8'))"` | sin error | PASS | Parse validado tras la escritura |
| V5 | Semantica intacta | `git diff` de los archivos reparados | solo bytes de acentos cambian | PASS | Preview lineal aprobado antes de escribir |
| V6 | Storage valido | `npm run validate:storage` | verde | PASS | `node scripts/validate-storage.mjs` sin errores |
| V7 | Commit gate sano | `git commit` sin `--no-verify` | hook pasa solo | PASS | Se verifico con el commit final de la lane |
| V8 | Root-cause | este brief | causa confirmada con evidencia | PASS | Commit rastreado desde `5b0783e` y conservado por `5ab7891` / `85f9c37` |

## 8. Matriz de monitoreo continuo
| # | Guarda | Que hace | Comando / donde | Estado |
|---|--------|----------|-----------------|--------|
| M1 | Gate en pre-push | Ejecuta `validate:storage` y `validate:encoding` antes del push | `.githooks/pre-push` | DONE |
| M2 | Camino de escritura UTF-8 | Fuerza UTF-8 sin BOM al escribir storage | `scripts/storage-repository.ts` | YA_EXISTIA |
| M3 | Regla PowerShell | Exige `-Encoding utf8` en escrituras a `storage/` | `storage/AGENTS.md` / revision de `.ps1` | NO_PRIORIZADA |
| M4 | Chequeo post-sync | Valida encoding despues del sync del engine | `scripts/admin/sync-workspaces.ps1` | YA_EXISTIA |
| M5 | Sonda periodica | Alerta si reaparece mojibake | proponer en CI/cron | PENDIENTE |

## Evidencia adicional
- `validate:storage` se agrego a `package.json` para exponer el gate oficial.
- `src/generated/agnostic-schemas.ts` quedo limpio solo despues de recompilar la fuente.
- El contenido semantico se preservo; solo se corrigieron bytes de encoding.