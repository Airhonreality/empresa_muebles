# Hallazgo 2026-10-15 — la cascada manual de `eliminarEspacioAction` no cubría los acabados

**Estado:** resuelto en código (commit `e7961a1`, desplegado a producción 2026-10-15T14:03Z).
**Línea:** `auditoria_cascadas` (abierta por este hallazgo).
**Severidad observada:** alta — un flujo de negocio real quedó bloqueado en producción (no se podía retirar un espacio del cotizador) con error 500 y mensaje genérico.

## 1. Síntoma reportado (Supervisor)

> «Estoy tratando de eliminar un espacio… de después de enviar el contrato aún dice que quiere retirar un espacio del contrato, aún no lo ha firmado, así que tengo que ir al cotizador, eliminar un espacio y luego volver a generar el contrato, pero al eliminar el espacio en cuestión me sale un mensaje de error diciendo que no se puede eliminar.»

Evidencia cruda del navegador en producción (`vetadeoro.co/erp/cotizador/d64597f7-…`):
- `POST /erp/cotizador/d64597f7-… 500 (Internal Server Error)`
- `An error occurred in the Server Components render…` + React error `#418`.

## 2. Causa raíz

`lib/data/actions/core.ts` → `eliminarEspacioAction(id)`. La acción borra en una transacción, en este orden:
1. `espacios_artefactos`
2. `items_variante`
3. `espacio_variantes` (la fila padre)

Pero **no borraba `espacio_variante_acabados`**, tabla puente creada en **t-172** (los acabados de un espacio cotizado). Su FK `espacio_variante_acabados.espacio_variante_id → espacio_variantes.id` es `NO ACTION`: al llegar al `DELETE` de la fila padre con hijos existentes, Postgres rechaza el borrado y la acción muere.

Evidencia en la base real (`ep-muddy-cherry`, verificada por SELECT 2026-10-15):
- El espacio «Baños» del proyecto `d64597f7-…` tenía **1 fila** en `espacio_variante_acabados`.
- En toda la base, **3 espacios** tienen acabados registrados (de 179) — por eso el bug es intermitente: solo revienta en los espacios que ya tienen acabados.

## 3. Arreglo aplicado

Se agregó el borrado de `espacio_variante_acabados` a la cascada transaccional, antes de ítems y variante (commit `e7961a1`, un archivo, +7 líneas). `tsc --noEmit` limpio, `eslint` sin errores nuevos.

## 4. Por qué es un hallazgo de arquitectura, no un typo

El mismo patrón dejó **al menos otro hueco latente** en el mismo archivo:

- `eliminarProyectoAction` (`core.ts:128-133`) también encadena a mano `items_variante` → `espacios_artefactos` → `espacio_variantes` **sin** `espacio_variante_acabados`. Borrar un proyecto con acabados fallaría igual.
- `eliminarEspacioAction` **tampoco** cubre `grupos_item` ni `portafolio`, ambos con FK `NO ACTION` hacia `espacio_variantes`. Hoy hay **0 filas** en esas tablas apuntando a espacios, así que el fallo está latente, no reproducido.

Esto no es un caso aislado: es la consecuencia estructural de un modelo en el que **casi ninguna relación se borra en cascada en la base** (ver `plan_auditoria_cascadas.md`, §2). Cada tabla nueva obliga a recordar todos los `eliminar*` que la tocan, sin red de seguridad — y t-172 olvidó actualizarlos.

## 5. Aprendizaje

> Cuando una migración introduce una tabla hija nueva, el cambio **no está terminado** hasta que se revisan todas las acciones `eliminar*` del padre. Hoy eso depende de la memoria del ejecutor. La segunda auditoría existe para convertir esa memoria en una regla verificable.
