# Inbox — Module Index

Producto: bandeja de entrada multicanal, armada importando los adapters `whatsapp`/`meta`/`tiktok`/`gmail` de [`../../adapters/`](../../adapters/INDEX.md).

## Estado

**Fase: investigación completa en `../../adapters/_research/messaging_2026.md`, pendiente elegir el primer provider y escribir su `adapter.ts`.**

## Qué existe

- [README.md](README.md) — qué es este módulo y por qué vive aquí.
- [docs/01_arquitectura_paquete.md](docs/01_arquitectura_paquete.md) — camino de crecimiento acordado (fork → `packages/` del seed → npm eventual).
- [docs/02_contrato_universal_mensajeria.md](docs/02_contrato_universal_mensajeria.md) — razón de ser del contrato compartido.
- [docs/05_orquestacion_automatizacion.md](docs/05_orquestacion_automatizacion.md) — dónde corre esto en producción (webhook reactivo + cron proactivo), dev-time vs run-time, qué LLM usar según costo.
- [`../../adapters/_contracts/messaging-adapter.ts`](../../adapters/_contracts/messaging-adapter.ts) — `MessagingAdapter`, contrato compartido por los 4 providers.
- [`../../adapters/whatsapp/`](../../adapters/whatsapp/INDEX.md), [`meta/`](../../adapters/meta/INDEX.md), [`tiktok/`](../../adapters/tiktok/INDEX.md), [`gmail/`](../../adapters/gmail/INDEX.md) — los 4 adapters, investigados, sin código todavía.
- `ui/` — vacío hasta que exista un provider real.

## Próxima acción concreta

1. Revisar [`../../adapters/_research/messaging_2026.md`](../../adapters/_research/messaging_2026.md) y confirmar si `messaging-adapter.ts` necesita ajustes.
2. Elegir el primer provider (la investigación sugiere orden por complejidad) e implementar su `adapter.ts` en `../../adapters/<id>/`.
3. Cuando haya un provider real, aplicar el patrón de orquestación de [docs/05_orquestacion_automatizacion.md](docs/05_orquestacion_automatizacion.md) para conectar el LLM adapter.

## Fuera de alcance por ahora

- `social-publish` como contrato adicional sobre `meta`/`tiktok` — ver [`../INDEX.md`](../INDEX.md) ("Identificados, no programados").
- Publicación npm / promoción a `packages/` del seed — no hasta 2+ providers reales.
- Componente de UI (`ui/InboxShell.tsx`) — depende de tener al menos un provider real.
