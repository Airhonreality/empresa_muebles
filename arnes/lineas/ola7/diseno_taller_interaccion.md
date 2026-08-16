# Diamante — Rediseño de interacción de Taller (D-07)

**Fecha:** 2026-08-10 · **Estado:** resuelto, listo para ejecutar (Etapa 2) · **Origen:** auditoría de Javier, hallazgo D-07 (`backlog_auditoria_pantallas.md`)

## Goal

`app/erp/taller/page.tsx` (P-16) muestra 4 columnas de conteo (`por_armar`/`en_armado`/`armado`/`en_calidad`) sin interacción — las cards no filtran nada, es una tabla plana de módulos sin agrupar por proyecto, y faltan Instalación/Garantía como parte del mismo proceso operativo visible. Javier: repensar como árbol compacto de proyectos con modal de detalle, cards de gate como filtros.

## Resolución

**Estructura nueva:**
1. **Vista general:** lista compacta de proyectos en producción (no módulos sueltos) — cada fila: nombre del proyecto, cliente, conteo de módulos por estado (mini-badges inline, no las cards grandes actuales), y un indicador de si tiene instalación/garantía activa.
2. **Cards de gate como filtro:** las 4 (ahora 6, agregando Instalación/Garantía) cards de conteo arriba de la lista, clickeables — al hacer click, filtran la lista de proyectos a los que tienen ≥1 módulo/instalación/caso en ese estado. Toggle (click de nuevo = quita el filtro).
3. **Modal de detalle:** al seleccionar un proyecto de la lista, abre un modal (`components/veta/modal.tsx`, ya existe) con el detalle completo de módulos de ESE proyecto — la tabla granular que hoy se ve de entrada para todos los proyectos mezclados, pasa a vivir acá, con la acción de avanzar estado que ya existe (`store.modulos.actualizarEstado`).
4. **Columnas nuevas:** Instalación (`store.instalaciones.porProyecto` — cuenta por estado) y Garantía (`store.casosGarantia` — cuenta por estado), agregadas como dos cards más, mismo patrón que las 4 existentes.

## Qué construye la Etapa 2 (UI, lote "Taller")

Reescritura de `app/erp/taller/page.tsx`: cards de gate (6, clickeables como filtro) → lista de proyectos (agregación de módulos/instalación/garantía por proyecto) → modal de detalle por proyecto (tabla de módulos con las acciones ya existentes). Reutiliza `store.modulos`, `store.instalaciones`, `store.casosGarantia` — ningún método nuevo de store necesario, son lecturas ya existentes agregadas de otra forma.

## Archivos que puede tocar el lote

`app/erp/taller/page.tsx` únicamente. No toca `lib/data/`.

## Verificación

`tsc --noEmit`, `eslint .`, `DATA_IMPL=mock next build`. Verificación manual de interacción (cada card filtra, cada fila abre el modal correcto) — no hay lógica de negocio nueva que testear con `assert`.
