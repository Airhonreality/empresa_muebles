# Diamante — Perfil de Persona / Proveedor, vista gerente (D-08a)

**Fecha:** 2026-08-10 · **Estado:** resuelto (mitad gerente), listo para ejecutar (Etapa 2) · **Origen:** auditoría de Javier, hallazgo D-08 (`backlog_auditoria_pantallas.md`)

**D-08b (autogestión — el propio empleado ve/edita su información) queda fuera de este batch**, pendiente de que Javier decida si/cuándo se construye un sistema de login interno (no existe hoy — `store.auth.usuarioActual()` es un usuario mock fijo). No se construye nada de eso acá.

## Goal

No existe ninguna pantalla de detalle por `Persona` ni por `Proveedor` — `app/erp/equipo/page.tsx` es una lista plana. Falta un perfil que muestre todo lo asociado a la entidad, incluyendo saldos pendientes.

## Resolución (mitad gerente — datos ya listos desde Etapa 1)

- `Persona` ahora tiene `fotoUrl`/`email` (antes solo `nombre`/`documento`/`telefono`).
- `store.personas.obtenerPorId(id)` / `store.personas.actualizar(id, data)` — nuevos.
- `store.proveedores.obtenerPorId(id)` — nuevo.
- `store.obligacionesPendientes.porPersona(personaId)` (comisiones) / `porProveedor(proveedorId)` (deuda a proveedor) — nuevos, ya testeados.

## Qué construye la Etapa 2 (UI, lote "Perfil")

Dos rutas nuevas:
1. **`app/erp/equipo/[personaId]/page.tsx`** — datos de contacto (nombre, documento, teléfono, email, foto vía `ImagePicker`, editable con `store.personas.actualizar`), roles activos (`store.personasRoles`, filtrado por `personaId`), saldos pendientes (`store.obligacionesPendientes.porPersona`, listado con estado/monto/fecha).
2. **`app/erp/compras/proveedores/[proveedorId]/page.tsx`** (o ruta equivalente bajo Compras) — datos de contacto/logística del proveedor (existentes en `Proveedor`, sin edición nueva requerida salvo que el lote decida agregarla con el mismo patrón), órdenes de compra asociadas (`store.ordenesCompra.porProveedor`), saldos pendientes (`store.obligacionesPendientes.porProveedor` + `store.cuentasCobroProveedor.porProveedor`).

**Enlaces de entrada:** desde `app/erp/equipo/page.tsx`, cada fila de persona linkea a su perfil (hoy no linkea a nada). Desde donde se muestre un proveedor (P-13 Compras, P-23 Cuentas de cobro), agregar un link al perfil si es sencillo — no obligatorio si el lote decide que es scope creep.

## Archivos que puede tocar el lote

`app/erp/equipo/**`, `app/erp/compras/proveedores/**` (nuevo). Puede editar `app/erp/equipo/page.tsx` para agregar los links de fila. No toca `lib/data/` (ya cerrado en Etapa 1) ni nada de `lib/auth/` (D-08b está fuera de alcance — ningún login nuevo).

## Verificación

`tsc --noEmit`, `eslint .`, `DATA_IMPL=mock next build`. Los métodos de store nuevos ya tienen test de round-trip (Etapa 1, `mock-store.test.ts`).
