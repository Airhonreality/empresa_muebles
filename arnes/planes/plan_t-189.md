# Plan t-188 — Landing pública de restauración y mantenimiento de pisos de madera

## Objetivo
Convertir `/espacios/pisos-de-madera` en una landing de conversión para Google Ads: pública, indexable, con contacto directo al experto en pisos (Jair Daza, +57 3227008706) por llamada o WhatsApp para cuadrar visita.

## Alcance (ejecutado)
1. `lib/contacto.ts` — fuente única de canales de WhatsApp/teléfono (`general` y `pisos`).
2. `lib/analytics/ads-conversion.ts` — `fireAdsConversion(canal)` que dispara el evento de conversión de Google Ads hacia el label del canal (`NEXT_PUBLIC_GTAG_SEND_TO_PISOS` para pisos, fallback a general).
3. `components/veta/contacto-pisos-modal.tsx` — modal especializado de contacto directo: título con el experto, botón "Llamar ahora" (`tel:`) y botón "Escribir por WhatsApp" (mensaje prellenado). Cada acción dispara `fireAdsConversion('pisos')`. Sin formulario ni opción 3D.
4. `components/veta/contacto-pisos-boton.tsx` — botón client que abre el modal.
5. `components/veta/cta-movil-pisos.tsx` — barra CTA fija en móvil (llamar / WhatsApp) con seguimiento de conversión.
6. `app/(publico)/espacios/pisos-de-madera/page.tsx`:
   - `revalidate = 300` (ISR) en vez de `force-dynamic` para velocidad de pauta.
   - `robots: { index: true, follow: true }` (ya no noindex); title/description incluyen "mantenimiento".
   - CTAs usan `ContactoPisosBoton` apuntando al número del experto.
   - Nueva RA de frecuencia de mantenimiento (cada 5-7 años).
   - JSON-LD `Service` + `BreadcrumbList`.
   - `CtaMovilPisos` al pie (móvil).
7. `components/veta/app-shell.tsx` — enlace "Restauración y mantenimiento de pisos" en footer (Servicios & Alianzas).
8. Home: tarjeta de Pisos de Madera ya enlazaba a la página.

## Fuera de alcance (decisión del Supervisor)
- No crear sección `/servicios`.
- No feed "Del taller" / noticias por ahora.
- No nav principal.
- Label de conversión de Google Ads: se crea en la interfaz de Google Ads, no desde el código. Pendiente de entregar el label para `NEXT_PUBLIC_GTAG_SEND_TO_PISOS`.

## Verificación
- `npx tsc --noEmit`: exit 0.
- `npx eslint` (archivos tocados): 0 errores.
- `npx next build`: pendiente (falla localmente sin DATABASE_URL real; en Vercel con DATABASE_URL de producción debe pasar — comportamiento esperado por AGENTS.md).
- QA manual pendiente: navegador real, llamada, WhatsApp, Tag Assistant (conversión pisos), LCP, validar JSON-LD.

## Pendientes del Supervisor
1. Crear en Google Ads la conversión "Contacto Pisos" y entregar el `send_to` label.
2. Checkpoint de arnés para aprobar la ejecución.
