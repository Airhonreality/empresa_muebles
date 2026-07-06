# Modulo: Bandeja de entrada multicanal

Bandeja unificada para WhatsApp, Meta (Messenger + Instagram), TikTok y Gmail, bajo un contrato de mensajeria unico.

## Por que vive en `src/modules/` y no en `storage/`

`storage/` es solo datos y documentacion por contrato del engine (ver `CLAUDE.md` del seed, "Storage Contract") — no aloja codigo. Este modulo necesita codigo real (contrato TypeScript, adapters, componente de UI) junto a su documentacion de diseno, asi que vive en `src/`, agrupado en una sola carpeta autocontenida. Ver `docs/01_arquitectura_paquete.md` para el razonamiento completo, incluyendo por que esta convencion (`src/modules/<nombre>/`) todavia no esta en la tabla de Ownership Boundaries del seed.

## Como retomar el trabajo

Empieza siempre por `INDEX.md` en esta misma carpeta — es el harness del modulo, tiene el estado actual y la proxima accion concreta.
