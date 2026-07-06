# Contrato de lane: goal/erp-finanzas-ux

> Rediseña FinanzasShell separando resumen (KPI) de detalle (colecciones) y migra su bloque
> `style jsx global` a los tokens del fork. Depende de la matriz y de los tokens (ambos ya
> integrados). Corre en paralelo con `erp-lifecycle-zaps` (no comparten archivos). Dos fases.

## Identidad
- **Rama:** `goal/erp-finanzas-ux`
- **Worktree:** `git worktree add ../wt-finanzas -b goal/erp-finanzas-ux`
- **Rol/modelo:** Fase 1 = worker de PLAN (juicio de UX). Fase 2 = worker de código.
- **Estado:** plan_borrador

## Goal (teleología)
Hoy las 3 cards superiores de finanzas son KPI y a la vez mini-listas, mezclando resumen con
detalle. Al cerrar: una **franja de KPI arriba** (solo resumen) + **colecciones de cards
abajo** (el detalle), y el bloque de estilos ad-hoc migrado a tokens de marca.

## Superficie (y SOLO esta)
- `src/components/specialized/finanzas/FinanzasShell.tsx`

## Fuera de alcance
- NO tocar scripts.json/zaps (es de `erp-lifecycle-zaps`), ni schema, ni los archivos de tokens
  del engine/fork (solo CONSUMES tokens existentes, no los editas).
- NO cambiar la lógica financiera; esto es reorganización de UI + tokenización.

## Insumos
- Los tokens de marca ya viven en `storage/styles/tokens.css` (capa fork, ya integrada).
- El checklist de migración del bloque `style jsx global` de FinanzasShell está en
  `storage/fork_doc/MANUAL_MARCA_TOKENS.md` (familias `--finanzas-shell-*`). Úsalo como guía;
  extrae los literales reales del bloque al migrar.

## FASE 1 — Contrato de información (NO reescribir la UI todavía)
### DAG
1. Inventaria qué muestran hoy las 3 cards superiores: qué es KPI (resumen) y qué es detalle
   (mini-lista). Con línea.
2. Propón la nueva estructura: `KPI strip` (solo métricas) + `colecciones` (las listas de
   detalle). DoD: doc corto `storage/progreso/lanes/finanzas-ux-plan.md` con el contrato de
   información (qué va arriba, qué abajo, jerarquía), SIN maqueta final.
3. Lista los literales del `style jsx global` (FinanzasShell.tsx:473) y su token destino
   (del checklist del manual).
4. Marca `Estado: plan_borrador` y párate. Espera `APROBAR FINANZAS`.

## FASE 2 — Implementar (SOLO tras `APROBAR FINANZAS`)
### DAG
1. Reorganiza FinanzasShell: franja KPI arriba (solo resumen) + colecciones de cards abajo.
2. Migra el bloque `style jsx global` a los tokens `--finanzas-shell-*` (o los que defina el
   manual); elimina literales hardcodeados de ese bloque.
3. Preserva la funcionalidad y los datos actuales (solo cambia layout + de dónde salen los estilos).

## DoD de cierre
- [ ] KPI separado de colecciones (resumen arriba, detalle abajo).
- [ ] Bloque `style jsx global` migrado a tokens; sin literales de color/sombra/radio ad-hoc.
- [ ] Sin regresión funcional (los mismos datos y acciones).
- [ ] `npm run validate:storage` + `npm run validate:encoding` verdes; commit(s) sin `--no-verify`.
- [ ] Matriz de verificación completa.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | KPI vs detalle | revisión del layout | franja KPI arriba, colecciones abajo | | |
| V2 | Sin ad-hoc | grep de hex/rgba/style jsx en FinanzasShell | 0 literales de marca; usa tokens | | |
| V3 | Sin regresión | probar la vista de finanzas | mismos datos/acciones | | |
| V4 | En superficie | `git show --stat` | solo FinanzasShell.tsx (+ plan doc) | | |
| V5 | Gates | validate:storage + validate:encoding | verdes | | |

## Handoff
Fase 1 → Orquestador aprueba (`APROBAR FINANZAS`). Al cerrar Fase 2, el Orquestador audita
(archivos fuera de superficie incluidos) e integra a `dev` con `--no-ff`.
