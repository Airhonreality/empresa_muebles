# src/modules — Index (Capa 2: macro-módulos)

Cada carpeta es un producto reusable, armado con código a partir de N adapters atómicos (`../adapters/`) + workflow + UI. Ver [`../adapters/INDEX.md`](../adapters/INDEX.md) para la capa de abajo (los adapters en sí), y `inbox/docs/01_arquitectura_paquete.md` para el camino de crecimiento común a los 4 (construir en fork → probar → promover a `packages/` del seed → sync, sin npm todavía).

Convención en prueba: `src/modules/<nombre>/` y `src/adapters/<id>/` todavía no están en la tabla de Ownership Boundaries de `CLAUDE.md` del seed. Se promueve a documentación formal del seed cuando el patrón esté validado con al menos un adapter real funcionando en producción — no antes.

## Módulos activos

| Módulo | Estado | Índice |
|---|---|---|
| `inbox` | Investigación volcada, pendiente elegir primer provider | [inbox/INDEX.md](inbox/INDEX.md) |
| `payments-checkout` | Investigación completa, Wompi recomendado | [payments-checkout/INDEX.md](payments-checkout/INDEX.md) |
| `render-studio` | Capability provista vía HTTP por el proyecto satélite `estudio_multimedia` | [render-studio/INDEX.md](render-studio/INDEX.md) |
| `video-editor` | Capability provista vía HTTP por el proyecto satélite `estudio_multimedia` | [video-editor/INDEX.md](video-editor/INDEX.md) |

## Identificados, no programados todavía

- **`social-publish`** — no es un adapter nuevo, es un segundo contrato (`SocialPublishAdapter`) que los adapters `meta`/`tiktok` (`../adapters/`) implementarían además de `MessagingAdapter`, reusando las mismas credenciales. Se agrega cuando `inbox` tenga esos providers reales.

## Camino de crecimiento (aplica a los 4 módulos de esta carpeta)

1. Construir aquí, en el fork que primero lo necesita, con adapters 100% agnósticos en `../adapters/` y el macro-módulo importándolos.
2. Cuando el contrato esté probado con adapters reales funcionando, promover `../adapters/_contracts/` y la forma de carpeta a `packages/` en el seed (`agnostic system`) — `git mv`, no reescritura.
3. Distribución a otros forks vía `scripts/admin/sync-workspaces.ps1` (git-merge, ya funcionando — no vía npm).
4. npm real solo si algún fork necesita instalación selectiva — decisión con evidencia, no de antemano.
