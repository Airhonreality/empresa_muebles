# Contrato de lane: goal/webstore-checkout-pagos

> Cierre del ciclo de venta: schema `pedidos_web`, checkout conectado a Wompi (adapter ya
> Verde), webhook que actualiza el estado del pedido, "Mis pedidos" en el portal cliente y
> vista de pedidos en el ERP.

<!-- lane-surface: storage/db/** | src/components/specialized/tienda/** | src/components/specialized/cuenta/** | src/app/api/integrations/wompi/** | src/integrations/wompi/** | agnostic.config.ts | src/generated/** | storage/progreso/lanes/goal-webstore-checkout-pagos.md -->

## Identidad
- **Rama:** `goal/webstore-checkout-pagos`
- **Worktree:** `git worktree add ../wt-webstore-checkout -b goal/webstore-checkout-pagos`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-05, ronda web-store)

## Goal (teleología)
Un visitante convierte su carrito en un pedido, paga con Wompi (sandbox en local), el
webhook confirma el pago y el pedido cambia de estado; el cliente lo ve en `/cuenta` y el
equipo en el ERP.

## Verdad de terreno (no re-investigar)
- Adapter Wompi COMPLETO en `src/integrations/wompi/` (manifest `kind: 'payment'`, env
  `WOMPI_PUBLIC_KEY/PRIVATE_KEY/EVENTS_SECRET/ENV`, hosts sandbox y producción). Webhook
  existente: `src/app/api/integrations/wompi/webhook/route.ts` (+ test). En local se
  trabaja SIEMPRE en sandbox (`WOMPI_ENV`), coherente con
  `ESTRATEGIA_DATOS_LOCAL_VS_PROD.md`.
- Regla de adapters (CLAUDE.md): la lógica de red vive bajo `src/app/api/`, NUNCA en zaps
  (sandbox sin fetch). El checkout de Wompi requiere firma de integridad server-side
  (private key) → endpoint nuevo bajo `src/app/api/integrations/wompi/`.
- Carrito: `CartContext`/`CartDrawer` en `src/components/specialized/tienda/` con ancla
  `data-checkout-slot` (lane tienda-ui). Portal cliente: `VetaCuenta.tsx` con ancla
  `data-pedidos-slot` (lane clientes).
- Escritura de datos runtime vía `/api/vault` (gateway) o server-side vía la estrategia;
  el webhook debe escribir server-side (no pasa por UI).
- Hay un fixture de prueba `cobro.json` en la raíz del repo (payload PSE sandbox) — es
  material de referencia, NO lo commitees donde no va.
- Mocks: lote `webstore_r2` en `seed_registros`.

## Superficie (y SOLO esta)
- `storage/db/**` (schema `pedidos_web`, ruta ERP pedidos, zap de consulta, mocks)
- `src/components/specialized/tienda/**` (Checkout)
- `src/components/specialized/cuenta/**` (sección Mis pedidos en el slot)
- `src/app/api/integrations/wompi/**` (endpoint checkout + extender webhook)
- `src/integrations/wompi/**` (solo si el adapter necesita un helper de firma)
- `agnostic.config.ts`, `src/generated/**`

## Fuera de alcance
- NO tocar otros adapters ni `adapters.server.ts`.
- NO inventar pasarelas adicionales.

## Depende de / bloquea a
- Depende de: `goal/webstore-tienda-ui` (carrito) y `goal/webstore-clientes` (cuenta).
- Bloquea a: `goal/webstore-seo-lanzamiento` (no funcionalmente, solo orden de ronda).

## DAG de tareas (cada una con DoD ejecutable)
1. **Schema `pedidos_web`** vía agno: `numero` (text, p.ej. PED-0001 secuencial),
   `user_id` (text), `cliente_id` (relation a clientes, opcional), `nombre` (text),
   `email` (text), `telefono` (text), `direccion_entrega` (text), `barrio` (text),
   `items_snapshot` (textarea JSON: [{tipo, ref_id, nombre, cantidad, precio_unitario}]),
   `subtotal` (number), `total` (number), `estado` (select: iniciado, pendiente_pago,
   pagado, en_preparacion, enviado, entregado, cancelado — snake_case),
   `wompi_reference` (text), `wompi_transaction_id` (text), `metodo_pago` (text),
   `notas` (textarea). `npm run agnostic:compile`.
   DoD: node -e verificando el schema; tsc verde.
2. **Endpoint `POST /api/integrations/wompi/checkout`**: recibe el carrito + datos del
   comprador; valida precios CONTRA storage (nunca confiar en los del cliente); crea el
   pedido (`estado: pendiente_pago`, `wompi_reference` = `crypto.randomUUID()`); genera la
   firma de integridad y responde los parámetros del Web Checkout de Wompi (public key,
   reference, amount_in_cents, currency COP, signature, redirect-url `/cuenta`).
   DoD: curl con carrito mock → 200 con signature no vacía y pedido creado en
   `pedidos_web.json`; curl con precio adulterado → total recalculado server-side (probar
   y documentar).
3. **Extender el webhook** existente: al evento `transaction.updated` con status
   `APPROVED`/`DECLINED`/`ERROR`, ubicar el pedido por `wompi_reference` y actualizar
   `estado` (pagado / cancelado) + `wompi_transaction_id` + `metodo_pago`. Mantener la
   verificación de firma de eventos ya existente; no romper sus tests
   (`webhook/route.test.ts` o equivalente).
   DoD: test del webhook verde (`npx vitest run` sobre la carpeta wompi o el runner que
   use el repo) + simulación curl de evento firmado actualiza el pedido mock.
4. **Checkout UI** (`src/components/specialized/tienda/CheckoutForm.tsx`) montado en el
   `data-checkout-slot`: form (nombre, email, teléfono, dirección, barrio), si hay sesión
   cliente pre-llena y liga `cliente_id`; llama a la tarea 2 y redirige al Web Checkout de
   Wompi (sandbox). Estado vacío/errores amables.
   DoD: tsc verde; flujo manual documentado hasta la redirección sandbox.
5. **"Mis pedidos" en `/cuenta`** (slot `data-pedidos-slot`): zap `consultar_pedidos_cliente`
   `{cliente_id|email}` → lista con `numero`, fecha, `estado` (etiquetas amables), total,
   items resumidos. Sin datos sensibles de otros clientes.
   DoD: curl `/api/engine` devuelve solo pedidos del cliente mock.
6. **Vista ERP de pedidos**: ruta `/app/erp/pedidos` en `page_routes.json` usando bloque
   genérico de colección del engine sobre `pedidos_web` (sin componente custom si el
   engine lo rinde); si el genérico no alcanza, componente mínimo en
   `src/components/specialized/tienda/PedidosAdmin.tsx`.
   DoD: curl `/app/erp/pedidos` → 200 con el pedido mock.
7. **Mocks**: 2 pedidos (`pagado` y `pendiente_pago`) ligados al cliente mock con cuenta,
   lote `webstore_r2` en `seed_registros`.
   DoD: node -e contando 2 pedidos mock.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-checkout-pagos` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] tests existentes del webhook wompi verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-checkout-pagos --contract storage/progreso/lanes/goal-webstore-checkout-pagos.md` → PASS
- [ ] Matriz completa

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | schema pedidos_web | node -e (tarea 1) | exit 0 | | |
| V2 | checkout valida precios | curl adulterado (tarea 2) | recalcula server-side | | |
| V3 | webhook actualiza pedido | test + curl firmado | estado pagado | | |
| V4 | mis pedidos filtrado | curl /api/engine | solo del cliente | | |
| V5 | ERP pedidos | curl /app/erp/pedidos | 200 | | |
| V6 | en superficie | lane-qa.mjs | PASS | | |
| V7 | gates | validate + tsc + tests wompi | verdes | | |

## Handoff
Al cerrar, el Orquestador corre QA mecánico, audita (foco: validación server-side de
precios y verificación de firma) e integra a `dev` con `--no-ff`.
