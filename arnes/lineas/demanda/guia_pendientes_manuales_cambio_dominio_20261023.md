# Guía de pendientes manuales — cambio de dominio `vetadeoro.co` → `vetadorada.co`

**Fecha:** 2026-10-23 · **Contexto:** `estado_demanda.md` (entrada 2026-10-23) · **Línea:** demanda

El código ya quedó apuntando al dominio nuevo (`SITE_URL`, `metadataBase`, PDF, scripts). Lo de abajo **no se puede hacer por CLI/código** — requiere navegador y tu sesión.

---

## 0. Estado real del seguimiento de Ads (verificado en producción, 2026-10-23)

El código de tracking **no depende del dominio** — no hay que modificarlo para el cambio. Verificado con `curl` sobre `www.vetadorada.co`:

- ✅ **Tag de Google Ads presente en el dominio nuevo:** `googletagmanager.com/gtag/js?id=AW-10970379192` (`components/analytics/GoogleTagAnalytics.tsx`, cargado global en `app/layout.tsx`).
- ✅ **Evento de conversión** al redirigir a WhatsApp: `gtag('event','conversion',{send_to:'AW-10970379192/55ciCNWI4ZQZELjniu8o'})` (`components/veta/asesoria-modal.tsx:77`). Es domain-agnóstico: mientras el tag cargue, cuenta igual.
- ✅ **Atribución:** `useGclidCapture` guarda `gclid`/`wbraid`/`gbraid`/UTMs en `sessionStorage` + cookie first-party de 90 días. En el 301 se preservan los query params, y con el Final URL ya en el dominio nuevo llega directo. Solo se pierde el `gclid` de sesiones iniciadas antes de hoy en el dominio viejo (irrelevante).
- ⚠️ **Hallazgo: GA4 NO está instalado.** No existe ningún tag `G-XXXXXXX` en el código — solo el de Ads (`AW-`) y Microsoft Clarity. Si creías que GA4 medía el sitio, no lo está haciendo. Para el análisis de métricas habrá que instalar el tag de GA4 (o GTM) o quedarse solo con Ads.
- ⚠️ **Clarity está inactivo:** `ClarityAnalytics` retorna `null` sin `NEXT_PUBLIC_CLARITY_PROJECT_ID` (vacío en `.env.example` y no seteado). No está grabando.
- ⚠️ **Enhanced Conversions (offline):** `submitLeadAction` guarda `hashedPhone`/`hashedEmail` (SHA-256) en la tabla `leads`, pero **el envío a Google Ads todavía no está cableado** (requiere credenciales de la API de Ads, `t-110`). El cambio de dominio no lo afecta.

**Conclusión pixel/Ads:** no hay que cambiar nada en el sitio. En Google Ads solo hay que confirmar (no programar) que la conversión "clic a WhatsApp" sigue registrando tras el cambio de Final URL, y recordar que el cambio de dominio puede meter los anuncios a re-revisión unos días.

---

## 1. Google Search Console (lo más importante)

- [ ] **Añadir `vetadorada.co` como propiedad nueva.** Recomendado: propiedad de tipo **Dominio** (verificación por DNS TXT en Vercel) para cubrir `www` y no-`www`, http y https.
- [ ] **Cambio de dirección (Change of Address):** en la propiedad vieja (`vetadeoro.co`) → *Configuración* → *Cambio de dirección* → seleccionar `vetadorada.co`. Esto acelera la transferencia de indexación/autoridad.
- [ ] **Enviar el sitemap** en la propiedad nueva: `https://www.vetadorada.co/sitemap.xml`.
- [ ] **Dejar viva la propiedad vieja** y revisar 2-4 semanas: cobertura (soft 404s, errores de rastreo, cadenas de redirección).
- [ ] Verificar que el sitemap/canonical en producción ya digan `vetadorada.co` (tras el deploy):
  `curl -s https://www.vetadorada.co/robots.txt | grep -i sitemap`

## 2. Analítica (GA4 / Clarity)

- ⚠️ **GA4 no está instalado en el sitio** (hallazgo §0). Si el análisis de métricas necesita GA4: crear propiedad + flujo de datos y añadir el tag `G-XXXXXXX` (tarea de código, avísame). Si no, el sitio solo reporta a Google Ads (tag `AW-`) y a Clarity (hoy inactivo).
- [ ] **Clarity:** setear `NEXT_PUBLIC_CLARITY_PROJECT_ID` en Vercel para activar grabaciones de comportamiento.
- [ ] Si ya existe una propiedad GA4 de la etapa anterior, **no** crear una nueva: reusarla y actualizar el *Data Stream* a `https://www.vetadorada.co`.
- [ ] Agregar `vetadeoro.co` y `vetadorada.co` a **exclusiones de referencias no deseadas** (para que el 301 no ensucie la atribución como referido interno).
- [ ] **Tag Assistant:** confirmar en el dominio nuevo que el tag `AW-10970379192` y el evento de conversión disparan (clic a WhatsApp).

## 3. Google Ads

- [ ] Confirmar **Final URL** de los 2 anuncios de cocinas → `https://www.vetadorada.co/espacios/cocinas-integrales-bogota`.
- [ ] Revisar **display URL** (debe mostrarse `vetadorada.co`, no el viejo).
- [ ] Revisar **sitelinks / extensiones / recursos** que puedan seguir apuntando a `vetadeoro.co`.
- [ ] Confirmar que la **conversión** (clic WhatsApp / envío de formulario) sigue registrando tras el cambio de dominio.
- [ ] Vigilar 3-5 días: posibles "destination mismatch" o desaprobaciones por cambio de Final URL.

## 4. Google Business Profile y otros externos

- [ ] **Perfil de Empresa en Google:** actualizar la URL del sitio a `https://www.vetadorada.co`.
- [ ] Actualizar bios/enlaces de **Instagram, TikTok, Facebook**.
- [ ] Actualizar **WhatsApp Business** (enlace/mensaje), firmas de correo y cualquier enlace de pago/propuesta.

## 5. Dominio viejo

- [ ] **Mantener `vetadeoro.co` registrado y con el 301 indefinidamente** — no dejar que expire.
- [ ] Recordar: los hits al dominio viejo sobre rutas legacy hacen **2 saltos** (esperado). Vigilar que no aparezcan como soft 404 en Search Console.

## 6. Marca (código actualizado, quedan 2 decisiones)

- ✅ **Hecho 2026-10-23:** `lib/pdf/cotizacion.ts` ya dice "Veta Dorada" (antes "Veta de Oro") en título, políticas y pie legal; el mensaje de WhatsApp pre-llenado (`app/actions/lead-actions.ts`) ya saluda "Hola Veta Dorada".
- [ ] **Tagline de la propuesta:** `lib/pdf/cotizacion.ts` sigue mostrando el subtítulo legacy **"Estetica y Confort"** (no es el eslogan aprobado "Diseña tu espacio. Habita el bienestar."). Decidir qué tagline va en documentos comerciales.
- [ ] **Correo del contrato:** `app/erp/cotizador/[proyectoId]/contrato/page.tsx:297` usa `Vetadeoro.co@gmail.com` — es una dirección real (y la cuenta Google dueña de Ads/Search Console), **no** un dominio por actualizar. Se deja; solo confirmar si quieres correo corporativo en el dominio nuevo.
- [ ] Emails `@vetadeoro.co` en datos mock/scripts (`lib/data/fixtures.ts`, `scripts/*`, tests): son datos internos de prueba, no referencias del sitio. Se dejaron tal cual (y `fixtures.ts` ya tenía cambios sin commitear ajenos a esto).

## 7. Análisis de métricas pendiente (se hará después)

- [ ] Correr el análisis **cortado hasta 2026-10-23**, en 3 tramos sin mezclar: (1) 27-mar→21-ago (ya hecho), (2) **29-ago→22-oct** (el que falta — valida la subida de leads empírica), (3) desde 2026-10-23 (dominio nuevo).
- [ ] Datos necesarios: export CSV de campañas/anuncios/términos de búsqueda (GSC/Ads) del 29-ago a ayer, GA4 (sesiones/conversiones/canales), y los leads reales de la BD (`leads` con `gclid`/`utm_*`/`etapa`/`score` + `eventos_conversion_offline`) para separar crudos de cualificados y calcular CPA real.
