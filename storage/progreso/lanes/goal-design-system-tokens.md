# Contrato de lane: goal/design-system-tokens

> Contrato para delegar. Define el manual de marca mínimo y la jerarquía de tokens, para
> que la marca propague a web pública + ERP sin estilos inline ad-hoc. Corre en PARALELO
> con `erp-comercial-state` (no comparten archivos). Dos fases con aprobación en medio.

## Identidad
- **Rama:** `goal/design-system-tokens`
- **Worktree:** `git worktree add ../wt-design-tokens -b goal/design-system-tokens`
- **Rol/modelo:** Fase 1 = worker de PLAN (juicio de diseño). Fase 2 = worker de código (liviano).
- **Estado:** plan_borrador

## Goal (teleología)
Una sola **fuente de verdad de marca** (colores, tipografía, espaciados, radios) en tokens,
con reglas claras de **qué puede vivir local y qué debe subir a tokens**. Hoy conviven
contratos globales de tokens con estilos locales ad-hoc (p.ej. un bloque `style jsx global`
propio dentro de FinanzasShell) → la marca no está unificada.

## Superficie (y SOLO esta)
- **Fase 1 (solo lectura + doc):** leer `src/app/globals.css`, `src/styles/layout_tokens.css`,
  `storage/styles/tokens.css`, y escanear `src/components/specialized/**` en busca de estilos
  locales/inline. Producir `storage/fork_doc/MANUAL_MARCA_TOKENS.md`.
- **Fase 2 (código, tras aprobación):** SOLO los archivos centrales de tokens
  (`globals.css`, `layout_tokens.css`, `storage/styles/tokens.css`).

## Fuera de alcance (CRÍTICO para no chocar con otras lanes)
- **NO** editar componentes que otra lane esté tocando (p.ej. `ComercialKanban.tsx`,
  `ComercialCard.tsx` los tiene `erp-comercial-state`; `FinanzasShell.tsx` lo tiene
  `erp-finanzas-ux`). Si un componente tiene estilos ad-hoc, **anótalo en un checklist de
  migración**, NO lo migres aquí: cada lane dueña migrará sus propios estilos a tus tokens.
- **NO** rediseñar la UI ni cambiar valores visuales sin que se note (preservar la marca actual).

## FASE 1 — Manual de marca (NO tocar código)

### DAG
1. **Inventariar los tokens existentes** en los 3 archivos css. DoD: tabla de qué define cada
   uno y dónde se solapan/contradicen. Con archivo:línea.
2. **Inventariar estilos ad-hoc** en `specialized/**` (bloques `style jsx`, inline, hex
   hardcodeados). DoD: lista con archivo:línea y qué token debería reemplazarlos.
3. **Proponer la jerarquía de tokens + política.** DoD: `MANUAL_MARCA_TOKENS.md` con:
   - Jerarquía en capas (primitivos → semánticos → de componente).
   - Regla de override: qué puede vivir local y qué DEBE subir a tokens.
   - Política para módulos "luxury"/especiales (cómo extienden sin romper el canon).
   - Checklist de migración (qué estilo ad-hoc, en qué archivo, a qué token) — para las lanes dueñas.
4. **Marcar `Estado: plan_borrador` y PARARSE.** Devolver para aprobación.

### Cierre de Fase 1
- [ ] `MANUAL_MARCA_TOKENS.md` creado (jerarquía + reglas de override + política luxury + checklist).
- [ ] Cero cambios de código (solo el doc nuevo).
- [ ] commit en `goal/design-system-tokens`; `validate:encoding` + `validate:storage` verdes.
- [ ] **Esperar `APROBAR TOKENS` antes de Fase 2.**

## FASE 2 — Consolidar tokens centrales (SOLO tras `APROBAR TOKENS`)

### DAG
1. Consolidar los 3 archivos css en la jerarquía aprobada (una sola fuente de verdad; sin
   duplicados ni contradicciones). Preservar los valores visuales actuales.
2. Dejar el checklist de migración de componentes listo (no ejecutarlo aquí).

### DoD de cierre
- [ ] Tokens centrales sin duplicados/contradicciones; jerarquía de capas aplicada.
- [ ] La marca se ve igual (sin regresiones visuales evidentes).
- [ ] `validate:encoding` + `validate:storage` verdes; commit(s) sin `--no-verify`.
- [ ] Matriz de verificación abajo, completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | Fuente única | revisión de los 3 css | sin tokens duplicados/contradictorios | | |
| V2 | Sin regresión visual | comparar antes/después | valores de marca preservados | | |
| V3 | Checklist de migración | `MANUAL_MARCA_TOKENS.md` | cada estilo ad-hoc mapeado a un token | | |
| V4 | No pisó otras lanes | `git diff --name-only` | solo archivos de la superficie | | |
| V5 | Gates | `validate:encoding` + `validate:storage` | verdes | | |

## Handoff
Fase 1 → Orquestador revisa el manual y decide `APROBAR TOKENS`. Al cerrar Fase 2, las
lanes dueñas (finanzas-ux, etc.) migran sus estilos ad-hoc a los tokens usando el checklist.
