# 05 — Arquitectura del Embudo Híbrido (Formulario + WhatsApp)

Fuente: `Embudo y experiencia.md`. Precondición: `03_CONTRATO_SCHEMAS_ZAPS.md` ejecutado (`leads.gclid`, `leads.estado_proyecto`, zap `capturar_lead_embudo`).

## 1. Captura de GCLID — client-side, sin backend

Al montar cualquier página pública (mínimo `/` y `/agendar`, idealmente un hook compartido), leer `window.location.search` una sola vez y persistir en `sessionStorage` (no `localStorage` — el GCLID pierde validez entre sesiones y no debe sobrevivir indefinidamente):

```ts
// src/lib/veta/useGclidCapture.ts (nuevo, fork-owned, no es código de engine)
'use client'
import { useEffect } from 'react'

export function useGclidCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gclid = params.get('gclid')
    if (gclid) sessionStorage.setItem('veta_gclid', gclid)
    const utmSource = params.get('utm_source')
    if (utmSource) sessionStorage.setItem('veta_utm_source', utmSource)
    const utmMedium = params.get('utm_medium')
    if (utmMedium) sessionStorage.setItem('veta_utm_medium', utmMedium)
    const utmCampaign = params.get('utm_campaign')
    if (utmCampaign) sessionStorage.setItem('veta_utm_campaign', utmCampaign)
  }, [])
}
```

Invocar `useGclidCapture()` en `VetaHome.tsx` y en cualquier landing futura del silo SEO. **Nunca mostrar el GCLID en la UI** (regla explícita del research: "sin mostrarse jamás al cliente").

## 2. Modal de Micro-Filtro (2 pasos)

Hoy `VetaAgendar.tsx` es una página completa (`/agendar`), no un modal overlay. `Embudo y experiencia.md` pide que **cualquier** botón "Agendar"/"Cotizar" del sitio abra un modal, no que navegue a una página nueva.

**Decisión de diseño recomendada:** extraer el formulario actual de `VetaAgendar.tsx` a un componente compartido `VetaEmbudoModal.tsx` que:
- Se puede abrir como `Dialog` (de `src/components/ui/`, ya disponible según `Interfaces Custom.md`) desde cualquier CTA del Home/Header/Footer.
- La ruta `/agendar` sigue existiendo (no romper el link directo ni el SEO de esa URL) pero renderiza el mismo formulario embebido en la página en vez de duplicar el código — `VetaAgendar.tsx` pasa a ser un wrapper delgado que monta `VetaEmbudoModal` en modo "inline" (`Dialog` vs `div`) usando la misma lógica de estado.

Estructura de los 2 pasos (contenido exacto del research):

```text
Paso 1 — Micro-filtro:
  ¿Qué espacio necesitas?  → radio/checkbox: Cocina, Clóset/Vestier, Centro de TV,
                              Oficina/Estudio, Otro   (mapea a leads.tipo_espacio)
  Estado de tu proyecto:   → radio: "Tengo diseño y medidas (Cotizar a distancia)"
                              / "Necesito que me visiten y asesoren"
                              (mapea a leads.estado_proyecto)

Paso 2 — Datos de contacto:
  Nombre, Teléfono/WhatsApp  (mapea a leads.nombre_completo, leads.telefono_whatsapp)
  [ CONTINUAR A WHATSAPP ]
```

Mantener el patrón ya existente en `VetaAgendar.tsx` de leer campos dinámicamente desde el schema (`schemas.find(s => s.data?.name === 'leads')`) — no hardcodear los labels en el componente si el schema ya los define; el fallback estático solo debe cubrir hidratación inicial, como ya hace el código actual.

## 3. Submit → zap `capturar_lead_embudo`

En el `handleSubmit` del paso 2, en vez de `saveItem('leads', ...)` directo (patrón actual), invocar el zap creado en `03_CONTRATO_SCHEMAS_ZAPS.md` vía `AgnosticAction`/`api` (revisar el patrón real usado por otros formularios que disparan zaps, p. ej. `CotizadorPro.tsx` o `ComercialKanban.tsx`, para replicar la firma correcta de invocación — no asumir una API que no exista):

```ts
await api.runScript('capturar_lead_embudo', {
  ...form,
  gclid: sessionStorage.getItem('veta_gclid') || '',
  utm_source: sessionStorage.getItem('veta_utm_source') || '',
  utm_medium: sessionStorage.getItem('veta_utm_medium') || '',
  utm_campaign: sessionStorage.getItem('veta_utm_campaign') || '',
  whatsapp_destino: getConfigVal('whatsapp_e164', '573001234567') // desde configuracion_comercial
})
```

Si el engine no expone `api.runScript` desde componentes cliente (verificar contra `src/lib/agnostic/hooks/` y cómo otros bloques disparan zaps — posiblemente sea vía `AgnosticAction` como bloque declarativo en `page_routes.json`, no una llamada imperativa desde React), adaptar: la alternativa válida es que el componente haga `saveItem('leads', ...)` directo **y** replique la construcción del mensaje de WhatsApp + `window.open` en el cliente, sin zap. En ese caso, documentar en `07_PROGRESO_Y_CIERRE.md` por qué se optó por el camino directo en vez del zap, para que quede registrado el desvío del contrato original.

Tras el submit exitoso, mostrar el estado de éxito ya implementado en `VetaAgendar.tsx` (líneas 154-185) — ese patrón de UI no necesita cambios, solo la fuente de datos que lo dispara.

## 4. Flujo de scoring (comercial)

`ComercialKanban.tsx` / `ComercialCard.tsx` gestionan `proyectos`/`tareas_operativas`, no `leads` — hoy no hay puente entre un `lead` y un `proyecto` ganado. **No inventar ese puente en este plan** (sería una decisión de modelo de datos mayor, fuera del alcance de "construir el home").

Alcance real para esta fase: crear una vista simple de administración de `leads` con `score_conversion` editable — puede ser tan simple como una tabla `AgnosticTable`/`AgnosticCollection` (bloques reutilizables del engine, según `Interfaces Custom.md`) en una ruta interna nueva, p. ej. `/app/leads`, con `context: leads`, sin componente especializado nuevo si `AgnosticTable` + `AgnosticForm` ya permiten editar `score_conversion` inline. Documentar en `07_PROGRESO_Y_CIERRE.md` si se necesitó un componente specialized o si los bloques genéricos alcanzaron.

## 5. Fuera de alcance (recordatorio)

El envío del `score_conversion` a la API de Google Ads (offline conversion import) no se construye en esta fase — ver `02_AUDITORIA_ZAPS.md` §3.
