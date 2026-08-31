# Sesión 2026-07-02 — Home + SEO + Embudo (Veta Dorada)

Carpeta de sesión **temporal**. Contiene planes ejecutables al detalle para reconstruir el Home público de Veta Dorada, su embudo de conversión y la base técnica de SEO/JSON-LD. Un modelo ejecutor debe seguir estos documentos en orden. Cuando la ejecución termine y se valide contra `07_PROGRESO_Y_CIERRE.md`, esta carpeta completa se elimina y su resumen final se traslada a `storage/progreso/current_state.md`.

No reabrir estas decisiones — ya fueron confirmadas por el dueño del proyecto:

1. **Tema visual:** migrar de dark-lujo (`#0A0A0A` hardcodeado) a **Luz & Biofilia**. La biofilia se sugiere con luz solar/fotografía natural, **nunca** con verde literal en los tokens de marca. El acento dorado y demás colores de marca permanecen agnósticos/configurables vía `storage/styles/tokens.css`, no hardcodeados en componentes.
2. **NAP real:** dirección del taller = `Carrera 72A # 71A-57, Bogotá D.C., Colombia`. La empresa opera **solo en Bogotá** (sectores de investigación: Usaquén, Rosales, Chicó, Chapinero, Quinta Camacho, Teusaquillo, Cedritos, Suba norte). El footer actual dice "Medellín, Colombia" — es un dato incorrecto y debe corregirse.
3. **Alcance de esta carpeta:** solo documentación de planeación. No se tocó `storage/db/*.json` ni `src/` durante la creación de estos planes.

## Orden de ejecución

```text
01_AUDITORIA_SCHEMAS.md         → diagnóstico, sin cambios
02_AUDITORIA_ZAPS.md            → diagnóstico, sin cambios
03_CONTRATO_SCHEMAS_ZAPS.md     → ejecutar (comandos agno exactos)
04_PLAN_HOME_BIOFILIA.md        → ejecutar (tokens + componentes)
05_PLAN_EMBUDO_ARQUITECTURA.md  → ejecutar (modal + captura gclid + whatsapp)
06_PLAN_SEO_TECNICO.md          → ejecutar (JSON-LD + schemaGenerator)
07_PROGRESO_Y_CIERRE.md         → checklist final + cierre de sesión
```

`03` debe ejecutarse antes que `04`/`05`/`06` porque estos dependen de que los schemas/zaps ya existan (el Home lee `testimonios` y `configuracion_comercial`; el embudo escribe en `leads` con los campos nuevos).

## Checklist maestro

- [ ] Schema `testimonios` creado y compilado (`npm run agnostic:compile`)
- [ ] Schema `leads` con `gclid`, `estado_proyecto`, `score_conversion`, `utm_source`, `utm_medium`, `utm_campaign`
- [ ] Records NAP reales en `configuracion_comercial` (grupo `Contacto`/`Legal`)
- [ ] Zap `capturar_lead_embudo` creado y pasa `validate:zaps`
- [ ] Zap `actualizar_score_lead` creado y pasa `validate:zaps`
- [ ] `VetaHeader.tsx`, `VetaFooter.tsx`, `VetaHome.tsx`, `VetaAgendar.tsx` migrados a Luz & Biofilia
- [ ] `VetaTestimonials.tsx` nuevo, registrado en `agnostic.config.ts` si se usa como bloque, o compuesto dentro de `VetaHome.tsx`
- [ ] Footer con NAP real (Bogotá, Carrera 72A # 71A-57)
- [ ] Modal de embudo híbrido (2 pasos) funcionando en `/agendar` y como overlay desde cualquier CTA
- [ ] Captura de `gclid` desde query params, guardado en el lead
- [ ] Redirección a WhatsApp con mensaje prellenado vía `dispatchEvent('open_url', ...)`
- [ ] `src/lib/agnostic/seo/schemaGenerator.ts` creado
- [ ] `layout.tsx` inyecta `Organization` (`@id: #organization`)
- [ ] `page.tsx` del Home inyecta `LocalBusiness`/`FurnitureStore` con NAP real y `areaServed` limitado a Bogotá
- [ ] Sin `FAQPage` como rich-result; preguntas frecuentes en formato Respuesta Atómica visible en el DOM
- [ ] `AggregateRating` solo si hay registros reales en `testimonios`
- [ ] `npx tsx scripts/agno.ts validate --zaps` sin errores
- [ ] `npx tsx scripts/agno.ts docs all` ejecutado al final para refrescar los árboles
- [ ] TypeScript compila sin errores
- [ ] Home probado en navegador (`npm run dev`), golden path y mobile
