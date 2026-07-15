# Propuesta al seed: acceso público acotado por slug (server-side)

> Documento de solicitud para el mantenedor del seed Agnostic Seed. No es un plan de
> ejecución de este fork — describe un problema genérico del motor y una primitiva de
> solución. Este fork implementa un interim documentado mientras el parche no llega (ver
> `storage/progreso/lanes/goal-cotizador-vista-deluxe.md`, Fase 3, "Nota de seguridad").

## El problema (genérico, no específico de este fork)

El engine ya tiene un patrón establecido para exponer un registro individual vía URL
amigable: un campo `slug` en el schema + una ruta `/algo/:slug` en `page_routes.json` +
un bloque custom que resuelve el slug. Ejemplos actuales: `prefabricados.slug` y
`portfolio_publico`, servidos en `/tienda/:slug`.

Ese patrón funciona bien cuando **toda la tabla** de la entidad es intencionalmente
pública (un catálogo de productos: no importa que el visitante vea todos los productos,
ese es el punto de una tienda). Pero el mismo patrón se rompe cuando la entidad es
**parcialmente pública** — un registro individual se comparte deliberadamente con un
destinatario específico, pero el resto de la tabla NO debería ser visible para ese
destinatario. Ejemplos: una cotización comercial compartida con un cliente, una factura,
un enlace de invitación, un resumen de proyecto.

La razón técnica es que el resolver del engine
(`src/lib/agnostic/resolver.ts`, función `resolveAgnosticRoute`) resuelve el registro
activo **estrictamente por id** (decisión de diseño explícita y documentada en el propio
archivo — "ALWAYS: Identify records strictly by ID, avoiding slug-based search
fallbacks"). Por diseño correcto, no hace fallback a slug. Pero esto empuja a cualquier
componente que necesite resolver por slug a hacerlo **él mismo, del lado del cliente**,
usando el store global de la app (`useAppState()` / `@/context/AppContext`), que ya trae
cargadas las tablas completas de los contextos declarados. Eso significa: para resolver
"¿cuál registro tiene este slug?", el navegador necesita tener la tabla completa
descargada — incluyendo todos los demás registros que NO son el que el visitante debería
ver.

Para catálogo público esto es gratis (se supone que se vea todo). Para una entidad
parcialmente pública, es una fuga de datos por diseño: cualquier persona con un solo link
válido puede abrir las herramientas de red del navegador y ver la tabla completa —
nombres, montos, direcciones, estados internos de TODOS los registros de esa entidad, no
solo el que le corresponde.

## Por qué no se resuelve en el fork

`GET /api/vault?namespace=X` (`src/app/api/vault/route.ts`) es el único gateway de lectura
genérico del motor — lo usan todas las entidades, todos los forks, todos los adapters.
Parcharlo dentro de un fork para un caso de negocio específico viola la separación de capas
del propio harness (`Engine code -> shared by forks`, "Do not change engine files for
business-domain needs") y desalinea al fork de futuras actualizaciones del seed. El
problema tampoco es específico de "cotizaciones" — es un patrón que cualquier fork futuro
con entidades parcialmente públicas va a necesitar (facturas, invitaciones, resúmenes de
proyecto, portales de cliente de un solo uso). Por eso corresponde resolverlo una vez en
el motor, no reimplementarlo por fork.

## Primitiva de solución propuesta

Extender `GET /api/vault` para aceptar un filtro server-side opcional por slug, sin romper
compatibilidad con las llamadas existentes:

```
GET /api/vault?namespace=proyectos&slug=x7k2mQ9f
```

- Si se pasa `slug`, el gateway filtra server-side (`records.filter(r => r.data?.slug ===
  slug)`) y devuelve **solo** ese registro (o vacío), nunca la tabla completa.
- Si no se pasa `slug`, el comportamiento actual no cambia — 100% aditivo, cero riesgo de
  regresión para las rutas ya en producción (incluida `/tienda/:slug`, que puede seguir
  usando el patrón actual o migrar a este mismo mecanismo si conviene).
- Opcional pero recomendable: permitir declarar en `schema_definitions.json` qué campo
  actúa como `publicSlugField` de una entidad, para que el gateway pueda validar/documentar
  cuáles entidades soportan este modo sin necesidad de que cada fork lo redescubra.

## Impacto si se adopta

- Cierra la fuga de datos descrita arriba para cualquier entidad parcialmente pública, en
  cualquier fork, sin tocar el resolver (que sigue resolviendo por id, sin cambios) ni
  romper el patrón de catálogo público existente.
- Este fork (`empresa_muebles_clone`, feature `vista deluxe de cotización`,
  `storage/progreso/lanes/goal-cotizador-vista-deluxe.md`) migraría su interim actual
  (fetch de `proyectos` completo, aceptado temporalmente) a este filtro en cuanto el sync
  del seed lo traiga — queda anotado como tarea de seguimiento en esa lane.
