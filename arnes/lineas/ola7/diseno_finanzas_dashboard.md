# Diamante — Dashboard de KPIs en el hub de Finanzas (D-06)

**Fecha:** 2026-08-10 · **Estado:** resuelto, listo para ejecutar (Etapa 2) · **Origen:** auditoría de Javier, hallazgo D-06 (`backlog_auditoria_pantallas.md`)

## Goal

`app/erp/finanzas/page.tsx` tiene 2 tarjetas: "Parámetros de Costos" (funcional) y "Reportes Financieros" (deshabilitado, "Próximamente"). Javier: mostrar KPIs básicos — resumen de lo que ya calculan Obligaciones/Caja/Cuentas de cobro — con desplegables de detalle, en vez del placeholder.

## Resolución

Diamante puramente de agregación/presentación — **cero lógica de negocio nueva**, todo dato ya existe y ya se calcula en otras pantallas:
- `store.cuentasFinancieras.disponible()` — saldo disponible (ya usado en Caja).
- `store.obligacionesPendientes.listar()` — total pendiente por cobrar/pagar, agrupable por `origen`/`estado`.
- `store.cuentasCobroProveedor.listar()` — cuentas de cobro por estado.
- `store.ordenesCompra.listar()` — total en `en_pago`/`aprobada`.

## Qué construye la Etapa 2 (UI, lote "Finanzas")

Reemplazar la tarjeta "Reportes Financieros" (o agregar una sección nueva) en `app/erp/finanzas/page.tsx` con 3-4 `StatCard` (primitiva D4 ya existente en `components/veta/stat-card.tsx`, revisar su API antes de reinventar):
1. Saldo disponible (Caja).
2. Total obligaciones pendientes (agrupado por `pendiente`/`parcial`), con desplegable que lista las obligaciones (mismo dato que ya muestra la pantalla Obligaciones, resumido acá).
3. Cuentas de cobro pendientes de pago a proveedores.
4. Órdenes de compra en curso (`en_pago` + `aprobada`), monto total.

Cada KPI con un `<details>`/acordeón simple que expande la lista de detalle — no una tabla completa (para eso ya existen Obligaciones/Caja/Cuentas de cobro, este dashboard es un resumen con atajo, no una pantalla nueva de datos).

## Archivos que puede tocar el lote

`app/erp/finanzas/page.tsx` únicamente. Lectura de `lib/data/` sin escritura — no toca `lib/data/` ni ningún otro archivo.

## Verificación

`tsc --noEmit`, `eslint .`, `DATA_IMPL=mock next build`. Sin test nuevo requerido (no hay lógica nueva que testear, solo agregación de lectura ya cubierta por los tests existentes de cada dominio).
