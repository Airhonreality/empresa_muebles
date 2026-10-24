# Guía de pendientes manuales — cambio de dominio `vetadeoro.co` → `vetadorada.co`

**Fecha:** 2026-10-23 · **Contexto:** `estado_demanda.md` (entrada 2026-10-23) · **Línea:** demanda

El código ya quedó apuntando al dominio nuevo (`SITE_URL`, `metadataBase`, PDF, scripts). Lo de abajo **no se puede hacer por CLI/código** — requiere navegador y tu sesión.

---

## 1. Google Search Console (lo más importante)

- [ ] **Añadir `vetadorada.co` como propiedad nueva.** Recomendado: propiedad de tipo **Dominio** (verificación por DNS TXT en Vercel) para cubrir `www` y no-`www`, http y https.
- [ ] **Cambio de dirección (Change of Address):** en la propiedad vieja (`vetadeoro.co`) → *Configuración* → *Cambio de dirección* → seleccionar `vetadorada.co`. Esto acelera la transferencia de indexación/autoridad.
- [ ] **Enviar el sitemap** en la propiedad nueva: `https://www.vetadorada.co/sitemap.xml`.
- [ ] **Dejar viva la propiedad vieja** y revisar 2-4 semanas: cobertura (soft 404s, errores de rastreo, cadenas de redirección).
- [ ] Verificar que el sitemap/canonical en producción ya digan `vetadorada.co` (tras el deploy):
  `curl -s https://www.vetadorada.co/robots.txt | grep -i sitemap`

## 2. Google Analytics 4

- [ ] **NO crear propiedad nueva.** Entrar a la propiedad existente → *Administración* → *Flujos de datos* → editar el flujo web y actualizar la URL a `https://www.vetadorada.co`.
- [ ] Agregar `vetadeoro.co` y `vetadorada.co` a **exclusiones de referencias no deseadas** (para que el 301 no ensucie la atribución como referido interno).
- [ ] **Tag Assistant:** confirmar en el dominio nuevo que siguen disparando las conversiones: clic al botón de WhatsApp y envío del formulario (`submitLeadAction`).

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

## 6. Cosas de marca (a decidir, no bloquean)

- [ ] `lib/pdf/cotizacion.ts` todavía titula **"Veta de Oro / Estetica y Confort"** en la propuesta comercial. Decidir si pasa a "Veta Dorada" para consistencia de marca.
- [ ] Emails `@vetadeoro.co` en UI/scripts (`app/erp/equipo/page.tsx`, scripts de bootstrap/seed): confirmar si el correo corporativo también migra a `@vetadorada.co` o se queda.

## 7. Análisis de métricas pendiente (se hará después)

- [ ] Correr el análisis **cortado hasta 2026-10-23**, en 3 tramos sin mezclar: (1) 27-mar→21-ago (ya hecho), (2) **29-ago→22-oct** (el que falta — valida la subida de leads empírica), (3) desde 2026-10-23 (dominio nuevo).
- [ ] Datos necesarios: export CSV de campañas/anuncios/términos de búsqueda (GSC/Ads) del 29-ago a ayer, GA4 (sesiones/conversiones/canales), y los leads reales de la BD (`leads` con `gclid`/`utm_*`/`etapa`/`score` + `eventos_conversion_offline`) para separar crudos de cualificados y calcular CPA real.
