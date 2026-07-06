# Contrato universal de mensajeria

## Razon de ser

Cuatro proveedores (WhatsApp, Meta Messenger/Instagram, TikTok, Gmail) con modelos de auth, webhook y payload completamente distintos deben converger en una sola bandeja de entrada. La unica forma de que el componente de UI (`ui/`) no tenga que conocer las particularidades de cada proveedor es que cada `../../adapters/<id>/adapter.ts` implemente el mismo contrato — ver `../../adapters/_contracts/messaging-adapter.ts`.

## Forma actual (borrador)

- `NormalizedContact` — quien es el interlocutor, sin importar el canal.
- `NormalizedThread` — una conversacion, agrupa mensajes por contacto+canal.
- `NormalizedMessage` — un mensaje individual, con `raw` como escape hatch para no perder informacion del proveedor que todavia no se normalizo.
- `OutboundMessagePayload` — lo minimo para enviar: texto, media, o referencia a plantilla (varios proveedores exigen plantillas pre-aprobadas para iniciar conversacion, ej. WhatsApp).
- `MessagingAdapter` — `listThreads`, `listMessages`, `sendMessage` obligatorios; `handleWebhook`/`verifyWebhook` opcionales porque no todo canal usa el mismo modelo de suscripcion.

Este contrato es deliberadamente minimo. **No se expande especulativamente** — cada campo nuevo debe justificarse con un caso real de un proveedor concreto, idealmente confirmado por `../../adapters/_research/messaging_2026.md` despues de la investigacion externa (`docs/03_prompt_deep_research.md`).

## Relacion con `AdapterManifest` del seed

El seed (`agnostic system`) ya tiene un subsistema de adapters instalables: `AdapterManifest` (`packages/core/src/adapter.ts`), con `kind: 'messaging'` ya anticipado como una de las categorias validas, mas un resolver de colisiones y comandos CLI (`agno install/list-adapters/remove-adapter`) que registran adapters en `agnostic.config.ts` y en `src/lib/integrations/adapters.server.ts`.

Este fork **todavia no sincronizo** esa parte del seed (el working tree esta ocupado con otro trabajo en curso). Cuando se sincronice:

- Cada `../../adapters/<id>/` deberia ganar un `manifest.ts` exportando un `AdapterManifest` con `kind: 'messaging'`, siguiendo la misma convencion que ya usa `src/integrations/notion/manifest.ts` en el seed.
- El `permissions.network` de cada manifest de mensajeria sera casi con certeza `'outbound-api'` con `runsOutsideSandbox: true` — mensajeria real necesita webhooks entrantes y llamadas salientes, lo cual el sandbox de zaps no permite (`src/app/api/engine/route.ts` no tiene `fetch`/`fs`/`process`).
- El registro (`agno install <id>`) seguiria viviendo en el seed; lo que cambia es que `<id>` apuntaria a `src/adapters/<id>/` en vez de `src/integrations/<id>/` — o se decide en ese momento si conviene mover los adapters a `src/integrations/` para reusar el mecanismo de instalacion tal cual esta, sin modificarlo. Esa decision se toma cuando haya al menos un adapter real funcionando, no antes.

## Que falta antes de escribir el primer provider

Ver `docs/03_prompt_deep_research.md` — sin la investigacion de las APIs reales, cualquier ajuste al contrato aqui seria especulacion.
