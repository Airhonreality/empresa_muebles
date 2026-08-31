# 01 — Auditoría de Schemas vs SEO / Ergonomía / Embudo

Fuente canónica cruzada: `storage/db/schema_definitions.json` (snapshot en `storage/progreso/arbol_de_schemas.md`, generado 2026-07-02). Este documento es diagnóstico — no ejecuta cambios. Los cambios exactos están en `03_CONTRATO_SCHEMAS_ZAPS.md`.

## 1. Prueba social / reseñas reales — falta el schema completo

`Tono de voz de marca.md` §5 exige un componente `VetaTestimonials` con reseñas **curadas manualmente** (no el widget automático de Google Maps, para evitar vandalismo de reputación), cada una con nombre real, barrio y texto. El research de JSON-LD (`INS_Mejores Prácticas...`) exige que `AggregateRating` en el schema `FurnitureStore` **solo** se declare si hay reseñas reales respaldándolo — inventar reseñas es penalización manual de Google.

**Hoy no existe ningún schema para esto.** No hay `testimonios`, `reseñas` ni campo de rating en ningún schema existente.

Gap → crear schema `testimonios` (ver contrato §1).

## 2. `leads` — no soporta el Embudo Híbrido

Campos actuales de `leads` (`storage/db/schema_definitions.json` línea ~1703):

```text
nombre_completo   text
telefono_whatsapp text
email             text
barrio_zona       text
tipo_espacio      select (Cocina, Cava, Dormitorio, Comedor, Consola, Otro)
mensaje           textarea
```

`Embudo y experiencia.md` describe un embudo de 2 pasos que además de tipo de espacio necesita:

- **Estado del proyecto** (`( ) Tengo diseño y medidas` / `( ) Necesito que me visiten y asesoren`) — no existe el campo.
- **GCLID** — el identificador de clic de Google Ads que se captura invisible y se guarda "sin mostrarse jamás al cliente". No existe el campo; sin él no hay forma de cerrar el círculo con Google Ads en el futuro (Fase 4 del roadmap SEO).
- **Score de calidad de conversión (1-10)** — el paso 3 del embudo: "una vez que el equipo comercial cierra una venta... actualizan el estado del lead... el CRM envía un score predefinido". No existe el campo.
- UTM opcionales (`utm_source`, `utm_medium`, `utm_campaign`) — no obligatorio para el embudo pero recomendado por el research SEO para atribución; se incluyen en el contrato como opcionales.

Gap → extender `leads` (ver contrato §2).

## 3. `configuracion_comercial` — no tiene NAP real

Es un schema clave-valor genérico (`llave`, `valor`, `grupo`, `etiqueta`) ya usado por `VetaHeader.tsx` y `VetaFooter.tsx` vía `getConfigVal(key, fallback)`. Hoy solo tiene records de branding/redes/whatsapp (inferido de los fallbacks en el código: `logo_negativo_url`, `brand_label_alternative`, `whatsapp_number`, `whatsapp_link`, `instagram_url`, `tiktok_url`, `nit_legal`, `nombre_empresa`). **No hay ningún record de dirección, ciudad, coordenadas ni horario** — por eso el footer usa el fallback hardcodeado `"Medellín, Colombia"`, que es un dato incorrecto.

El generador de JSON-LD (`06_PLAN_SEO_TECNICO.md`) necesita estos datos como fuente única de verdad (no hardcodeados en el componente ni en el script de JSON-LD), para que NAP sea consistente entre footer, header y `LocalBusiness`.

Gap → crear records nuevos en `configuracion_comercial`, no un schema nuevo (ver contrato §3).

## 4. `productos_catalogo` / `espacio_variantes` — suficientes para `Product`/`Offer`, con una salvedad

`productos_catalogo` ya tiene `precio_directo`, `precio_publico`, `stock_actual`, `imagen_url`, `sku` — cubre `Product` + `Offer` de JSON-LD (`price`, `availability` derivable de `stock_actual > 0`). **No tiene `priceCurrency`** como campo explícito, pero es aceptable fijarlo como constante `"COP"` en el generador de JSON-LD (todo el negocio opera en pesos colombianos) en vez de añadir un campo redundante por registro — no crear campo nuevo aquí, es sobre-ingeniería para un valor que nunca cambia.

Ningún gap de schema en `productos_catalogo`/`espacio_variantes`. Ver `06_PLAN_SEO_TECNICO.md` para el mapeo de campos → JSON-LD.

## 5. `nav_links` / `system_groups` — no afectados

No requieren cambios para este trabajo.

## Resumen de gaps a cerrar en `03_CONTRATO_SCHEMAS_ZAPS.md`

| Schema | Acción | Motivo |
|---|---|---|
| `testimonios` | crear (nuevo) | prueba social real, `AggregateRating` |
| `leads` | extender (4 campos nuevos + 3 opcionales) | Embudo Híbrido, GCLID, scoring |
| `configuracion_comercial` | nuevos records (no nuevo campo) | NAP real para footer/header/JSON-LD |
