# WP-0 — Comando `agno validate:routes`

Copia todo este archivo como prompt inicial de la sesión.

---

ROL: Ejecutas el Work Package WP-0 del plan `storage/fork_doc/REFACTOR_MODULOS/00_LINEA_DE_TRABAJO.md`. Solo este WP. Lee primero `CLAUDE.md` del root.

OBJETIVO: Añadir el comando `validate:routes` a `scripts/agno.ts`. Es de SOLO LECTURA (no muta nada, no requiere ciclo plan/dry).

CONTEXTO OBLIGATORIO (leer antes de escribir código):
- `scripts/agno.ts` — cómo se registran comandos existentes; imita `validate:zaps`.
- Primitivas requeridas: `scripts/cli-reporter.ts` y `scripts/storage-repository.ts` (patrón obligatorio para comandos nuevos).
- `src/lib/agnostic/init.ts` — de dónde salen los tipos registrados hoy.

COMPORTAMIENTO DEL COMANDO:
1. Carga `storage/db/page_routes.json`. Recorre recursivamente cada bloque (claves anidadas: `blocks`, `children`, `items`, `columns`, `tabs`) y recoge todo `type`.
2. Construye el conjunto de tipos resolubles: tipos registrados en `src/lib/agnostic/init.ts` (mientras existan) + claves de `blocks` en `agnostic.config.ts`. No importes React ni componentes: parsea estáticamente (regex/AST simple sobre los dos archivos) — el CLI corre en Node sin DOM.
3. Reporta por ruta: tipos OK y tipos NO RESOLUBLES. Exit code 1 si hay al menos uno no resoluble, 0 si todo verde.
4. Bonus obligatorio: valida también el invariante `block.context === schema.data.name === nombre de archivo` contra `storage/db/schema_definitions.json` cuando el bloque declare `context`; repórtalo como warning (no afecta exit code).

PROHIBIDO:
- Modificar cualquier archivo que no sea `scripts/agno.ts` (o un nuevo `scripts/agno-validate-routes.ts` importado desde él).
- Escribir en `storage/`.
- Añadir dependencias npm.

CRITERIOS DE ACEPTACIÓN (ejecuta y pega salida en el reporte):
1. `npx tsc --noEmit` limpio.
2. `npx tsx scripts/agno.ts validate:routes` → verde en este repo (solo usa `calendar_scheduler`).
3. Prueba negativa: edita temporalmente EN MEMORIA no — haz esto: copia `storage/db/page_routes.json` a un tmp, inyecta un bloque `{"type":"tipo_inexistente"}`, apunta el comando al tmp vía flag `--file <path>` (impleméntalo) y verifica exit code 1. El archivo real no se toca.

REPORTE: crea `storage/fork_doc/REFACTOR_MODULOS/REPORTE_WP0.md` con: archivos tocados, salida de los 3 criterios, decisiones tomadas, dudas para el orquestador. Luego DETENTE.
