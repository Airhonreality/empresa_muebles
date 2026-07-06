# Arquitectura del paquete — camino de crecimiento

## Decision

El modulo de bandeja de entrada multicanal nace en este fork (`empresa_muebles_clone`), no en el seed (`agnostic system`). Es una necesidad de negocio real de Vetadorada (`storage/fork_doc/MANIFEST GOAL.MD`, bajo "Ventas: ... redes de comunicacion"), no una capacidad generica que el seed deba dictar de antemano.

## Por que no un servicio externo

Se descarto explicitamente construir esto como un servicio separado (fuera de agnostic, expuesto como API propia) que centralizara mensajeria para multiples forks. El `CLAUDE.md` del seed prohibe reintroducir `ACTIVE_TENANT` y "runtime tenant/silo selection" — un servicio de mensajeria compartido entre forks es estructuralmente eso: multi-tenancy con aislamiento de datos entre negocios distintos, exactamente el patron que el proyecto ya decidio, con evidencia previa, que no quiere repetir. Fundar ese servicio es fundar un segundo producto (hosting propio, aislamiento entre forks, seguridad de credenciales ajenas), una decision mucho mayor que construir un modulo de fork.

## Por que no npm todavia

Publicar un paquete npm (`@agnostic/messaging` o similar) exige tener el contrato probado. Hoy el contrato (`../../adapters/_contracts/messaging-adapter.ts`) es un borrador sin ningun provider real implementado. Empaquetar y versionar publicamente antes de construir 2+ providers reales (WhatsApp, Meta, TikTok o Gmail) arriesga fijar una abstraccion equivocada y despues tener que hacer breaking changes coordinados sobre un paquete ya publicado. Ademas, cada modulo complejo (mensajeria, pagos, etc.) probablemente necesita webhooks configurados por dominio del fork — la instalacion sigue requiriendo configuracion especifica por fork incluso si el codigo es compartido.

## Camino de tres pasos

1. **Ahora — construir aqui, shaped como paquete.** Los adapters (`../../adapters/whatsapp/`, etc.) son 100% agnosticos, sin imports que crucen hacia codigo especifico de muebles (`CotizadorPro`, `ComercialKanban`, etc.). El macro modulo (`src/modules/inbox/`) los ensambla en un producto. Esto es disciplina de diseno, no trabajo extra — el dia que se promueva, es mover carpeta, no reescribir.

2. **Cuando el contrato este probado con 2+ providers reales.** Recien ahi se sabe con evidencia (no suposicion) que es realmente compartido entre proveedores (el contrato, la normalizacion de threads/mensajes) vs que es especifico de cada API (auth, forma de payload, limites). En ese punto se promueve `src/adapters/_contracts/messaging-adapter.ts` (y la forma de carpeta de adapter) a `packages/messaging/` en el seed (`agnostic system`), mismo patron que ya existe ahi para `packages/core`. Es un `git mv` + ajustar paths de import, no una reescritura.

3. **Distribucion a otros forks — via el sync que ya existe, no npm.** Una vez en `packages/messaging/` del seed, cualquier fork lo recibe automaticamente corriendo `scripts/admin/sync-workspaces.ps1` (el mismo mecanismo git-merge que ya sincroniza el engine hoy — confirmado vivo, usado hoy mismo contra este fork; `scripts/sync-forks.ts` es el que esta deprecado, no este). npm real solo se vuelve necesario si algun dia un fork quiere instalar *selectivamente* (solo WhatsApp, sin TikTok) — decision que se toma con evidencia real de uso, no ahora.

## Convencion nueva: `src/adapters/<id>/` + `src/modules/<nombre>/`

Dos carpetas nuevas que hoy no estan documentadas en la tabla de Ownership Boundaries del `CLAUDE.md` del seed (que solo conoce `src/components/specialized/` y, desde el subsistema de adapters, `src/integrations/`): `src/adapters/` para microservicios atomicos y agnosticos (una capability = un contrato compartido en `_contracts/`, uno o mas adapters concretos la implementan), y `src/modules/` para los productos que los ensamblan. Es intencional: se prueba aqui primero. Si funciona bien para mensajeria, se documenta formalmente en el seed y se replica para el proximo modulo complejo (ej. pagos, render, video). No se promueve la convencion sin haberla validado con adapters reales funcionando.
