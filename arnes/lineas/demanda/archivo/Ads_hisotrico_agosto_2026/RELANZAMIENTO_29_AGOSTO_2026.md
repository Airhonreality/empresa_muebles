# 📋 RELANZAMIENTO DE CAMPAÑA — GOOGLE ADS + SITIO V3
## Fecha: 29 de Agosto de 2026
**Línea de trabajo:** Demanda / Ads
**Estado:** 🟢 Ciclo de pago reanudado, corriendo sobre el sitio V3 en producción
**Fuente:** dato directo del Supervisor (Javier), reportado en conversación — no verificado todavía contra la interfaz de Google Ads

---

## 1. Qué cambió hoy

- **El sitio V3 se lanzó hoy** (corte de producción del sitio público ya documentado en `arnes/estado.md`, entrada 2026-08-28 — el relanzamiento de Ads del día siguiente corre ya sobre ese sitio nuevo, no sobre el legacy Wix ni sobre una preview).
- **Se reanudó el ciclo de pago de Google Ads**, previamente ajustado el 21 de agosto (ver `REPORTE_EJECUCION_Y_OPTIMIZACION_21_AGOSTO_2026.md` — ese reporte dejó el presupuesto en $15.000 COP/día y CPA objetivo $11.719 COP a nivel de campaña / $15.000 COP en el grupo Cocinas). Los números de hoy son distintos a los del 21 de agosto — no está confirmado todavía si es una recalibración deliberada o un valor que Google ajustó solo; queda como pregunta abierta para el siguiente análisis.

## 2. Configuración reportada hoy

| Parámetro | Valor reportado |
|---|---|
| Presupuesto diario | $1.122 COP |
| CPA objetivo | $7.200 COP |
| Grupo de anuncios activo | Cocinas |
| Destino del anuncio | Dirección directa a la web de cocinas (landing de cocinas del sitio V3) |

**Pendiente de verificar (no asumir):** que el "Final URL" configurado en la interfaz de Google Ads apunte efectivamente a `https://www.vetadeoro.co/espacios/cocinas-integrales-bogota` (ruta real en V3) y no a la ruta legacy `vetadeoro.co/cocinas`, que en el sitio V3 devuelve 404 (verificado por curl el 2026-08-29 antes de este relanzamiento). Ver §3 de este documento y el hallazgo de redirects en `arnes/estado.md`.

## 3. Regla para el próximo análisis de Ads

**El próximo análisis de rendimiento de Ads debe partir de la fecha de hoy (2026-08-29) como punto de corte**, no mezclarse con la data histórica previa (27 marzo – 21 agosto, ya consolidada en `DIAGNOSTICO_AGOSTO_2026.md` y este mismo folder). Motivo: hoy cambiaron simultáneamente (a) el sitio de destino (Wix → V3) y (b) los parámetros de puja/presupuesto — cualquier lectura de CPA/conversión que mezcle antes/después de hoy va a confundir el efecto del cambio de sitio con el efecto del cambio de puja.

## 4. Relacionado — gap técnico detectado el mismo día

En el mismo intercambio se detectó que no existe mapa de redirecciones 301 del sitio Wix legacy hacia las rutas nuevas de V3 (`next.config.ts` sin bloque `redirects()`, y `plan_seo_2026.md` §1 punto 7 lo tenía pendiente desde antes del corte, sin ejecutar). Con el ciclo de Ads reanudado hoy mismo, esto es urgente: si el Final URL de la campaña (o cualquier backlink/bookmark de los 3 años de Wix) sigue apuntando a `/cocinas`, el tráfico pagado aterriza en un 404. Acción en curso: agregar el redirect `/cocinas → /espacios/cocinas-integrales-bogota` en `next.config.ts` (ver commit correspondiente). El Supervisor confirma tener acceso al Wix antiguo para completar el resto del mapa de URLs — pendiente el listado completo.

---
*Documento consolidado en `arnes/lineas/demanda/archivo/Ads_hisotrico_agosto_2026/RELANZAMIENTO_29_AGOSTO_2026.md`.*
