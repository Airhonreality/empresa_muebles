# Diamante — Conectar lista de compra a la orden de compra (D-04)

**Fecha:** 2026-08-10 · **Estado:** resuelto, listo para ejecutar (Etapa 2) · **Origen:** auditoría de Javier, hallazgo D-04 (`backlog_auditoria_pantallas.md`)

## Goal

P-13 (`app/erp/compras/page.tsx`) no muestra ni permite asociar qué se está comprando — crea una OC con solo `montoTotal`, sin ítems. Javier: "la lista de compra es la misma que la de los ítems cotizados, ajustada en el gate de verificación" (vía 1) + necesidad de ítems "a pedido" fuera de catálogo (vía 2, ej. vidrio cortado a medida).

## Resolución (no mutuamente excluyentes, ambas se construyen)

**Vía 1 — derivada del schema aprobado.** Ya implementada en la Etapa 1 de datos: `derivarListaCompraSugerida(schema, bomMateriales)` en `lib/modules/f4/gates.ts` — lee el `BomMaterial[]` del schema en estado `aprobado_compras` (`store.bom.porSchema()`) y sugiere los ítems con `productoId` no nulo. `store.itemsOrdenCompra.crearDesdeSugeridos(ordenCompraId, sugeridos)` los materializa de una vez.

**Vía 2 — ítem a pedido.** `ItemOrdenCompra.productoCatalogoId` ahora es nullable; `especificacion` (texto libre) lo reemplaza cuando el ítem no viene de catálogo. `store.itemsOrdenCompra.crear()` exige exactamente una de las dos (rechaza si vienen ambas o ninguna — ya testeado).

## Qué construye la Etapa 2 (UI, lote "Compras")

En `app/erp/compras/page.tsx` (crear OC) o en una pantalla de detalle de la OC (`app/erp/compras/[ordenCompraId]/page.tsx`, nueva si hace falta):
1. Si la OC tiene `proyectoId`: botón "Sugerir ítems del schema aprobado" → llama `derivarListaCompraSugerida` + `crearDesdeSugeridos`, muestra la lista resultante editable (cantidad ajustable antes de confirmar).
2. Botón "Agregar ítem a pedido" → modal con `especificacion` (textarea) + cantidad, sin selector de catálogo.
3. Tabla de ítems de la OC (`store.itemsOrdenCompra.porOrdenCompra(id)`) visible en la pantalla de creación/detalle — hoy no se ve en ningún lado.

## Archivos que puede tocar el lote

`app/erp/compras/**` únicamente. NO toca `lib/data/` ni `lib/modules/f4/` (ya cerrados en Etapa 1).

## Verificación

`tsc --noEmit`, `eslint .`, `DATA_IMPL=mock next build` — los tests de `derivarListaCompraSugerida`/`crearDesdeSugeridos`/`itemsOrdenCompra.crear` ya están escritos y pasan (Etapa 1).
