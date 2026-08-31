# 02 — Auditoría de Zaps vs Embudo Híbrido

Fuente canónica cruzada: `storage/db/scripts.json` (snapshot en `storage/progreso/arbol_de_zaps.md`, generado 2026-07-02). 24 zaps existentes, todos orientados a producción/finanzas/contratos (`zap_activar_produccion`, `zap_registrar_pago`, `generar_contrato`, etc.). **Ninguno toca `leads` ni el canal WhatsApp.**

## 1. Captura del lead + redirección WhatsApp — no existe

`Embudo y experiencia.md` describe el "Paso 2" del embudo: al enviar el modal de micro-filtro, el sistema debe (a) guardar el lead en Agnostic DB **incluyendo el GCLID capturado en segundo plano, sin mostrarlo al cliente**, y (b) redirigir en primer plano a WhatsApp con un mensaje prellenado interpolado (`"Hola Veta Dorada, soy [Nombre]. Necesito un [Espacio]. Actualmente [Estado del proyecto]."`).

Hoy `VetaAgendar.tsx` (línea 80) solo hace `saveItem('leads', { id, data: form })` — sin GCLID, sin redirección, sin zap.

Gap → nuevo zap `capturar_lead_embudo`. Namespace: `leads`. Dispatch: `open_url`.

**Nota de arquitectura:** este zap se puede invocar vía `AgnosticAction` desde el componente, o el componente puede hacer `saveItem` directo y disparar `dispatchEvent('open_url', ...)` él mismo sin pasar por un zap — ambos son válidos según `Interfaces Custom.md` ("Si un botón debe ejecutar lógica de negocio **portable**, usa un zap"). Se recomienda el zap porque la construcción del mensaje de WhatsApp (interpolación de nombre/espacio/estado) es lógica de negocio que debe ser portable entre forks y auditable — no debe vivir hardcodeada dentro del componente React. Detalle de implementación en `05_PLAN_EMBUDO_ARQUITECTURA.md`.

## 2. Actualización de score de conversión — no existe

Paso 3 del embudo: "una vez que el equipo comercial cierra una venta en el mundo físico, actualizan el estado del lead en el CRM interno... el CRM envía un score predefinido (Ej. venta de repisa = 1 punto; venta de Cocina Premium = 10 puntos)".

Gap → nuevo zap `actualizar_score_lead`. Namespace: `leads`. Sin dispatch (solo `saveItem`).

## 3. Envío del score a Google Ads (offline conversion import) — explícitamente fuera de alcance de zaps

El research SEO (`INVS_SEO_empresas mobiliario.md` §"Paso 3: Importación de Conversiones Offline") requiere que el CRM "le avise a Google Ads devolviéndole el GCLID e informándole que ese usuario compró", enviando el score en vez del precio real.

Esto requiere una llamada HTTP saliente a la API de Google Ads (autenticación OAuth, endpoint REST). `Comandos CLI.md` es explícito: el sandbox de zaps tiene **timeout de 5 segundos y sin `fetch`, `fs`, `process` ni binarios nativos** — es técnicamente imposible implementar esta integración como zap.

**Decisión de alcance:** esta integración queda fuera de "construir el home". El propio research SEO la ubica en su "Fase 4 / Q4" del roadmap (`INS_Mejores Prácticas de JSON-LD...` §10), después de que el home, el silo de contenido y la captura de leads ya estén en producción. Cuando se aborde, necesitará un endpoint fork-owned (posible excepción a la regla de `src/app/api/` como capa de motor — debe decidirse explícitamente con el dueño del proyecto en su momento, no asumirse aquí) o un job externo (cron/Cloud Function) que lea `leads.gclid` + `leads.score_conversion` y llame la API de Google Ads. No generar código para esto ahora.

## Resumen de gaps a cerrar en `03_CONTRATO_SCHEMAS_ZAPS.md`

| Zap | Acción | Namespace | Dispatch |
|---|---|---|---|
| `capturar_lead_embudo` | crear | `leads` | `open_url` |
| `actualizar_score_lead` | crear | `leads` | ninguno |
| (envío a Google Ads API) | **no crear** — fuera de alcance, documentado como Fase 4/Q4 | — | — |
