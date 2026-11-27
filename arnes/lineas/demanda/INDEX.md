# 🧭 Mini-Arnés: Línea de Demanda (Marketing y Adquisición)

Este es el índice principal del subsistema de **Demanda**: captación, conversión, pauta digital (Google Ads), SEO y arquitectura de conversión del sitio web público de Veta de Oro.

Cualquier agente o humano que trabaje en esta línea debe usar este archivo como mapa central.

---

## 📌 1. Núcleo (no mover)

*   `estado_demanda.md` — Dashboard vigente y reglas de negocio.
*   `plan_demanda.md` — Hoja de ruta Fases A-F.
*   `GOOGLE_ADS_API_USO.md` — Instrucciones de SDK y credenciales (Infisical).

## 🔗 1.b Cuentas de Google Ads (registro)

| Rol | ID de cuenta | Nombre | Relevancia para este proyecto |
|-----|-------------|--------|-------------------------------|
| MCC / Administrador (Agency) | `8554149890` | Airhon Agency | Cuenta padre, no se opera directamente |
| Campaña principal (main) | `9399973984` | Veta Carp | Campaña activa de cocinas/amoblamiento de la web de la empresa. Los análisis de **marzo 2026** y **agosto 2026** corresponden a esta cuenta. |
| Campaña activa (nueva) | `9759491517` | Pisos Madera | Campaña de búsqueda para pisos de madera en Bogotá. **Aún no ha arrancado** (0 impresiones, 0 clics, estado ENABLED pero sin gasto). Campaña ID `24429621538` creada y PAUSED/ENABLED sin entrega. |
| Cuenta hija sin relevancia | `6104728129` | Amparo correcciones | No forma parte de este proyecto, solo es cuenta hija del MCC. |


---

## 📊 2. Análisis de campañas Google Ads (activo)

*   `01_analisis_campanas/` — Cada análisis en su propia subcarpeta con reportes (.md) y CSV juntos. Ver `01_analisis_campanas/INDEX.md`.
*   `03_campana_pisos_madera/` — Diseño de la campaña activa "Pisos de Madera" (Búsqueda, Bogotá).

---

## 🌐 3. Contenido y diseño del sitio público

*   `02_contenido_publico/` — Copy de páginas (F-00 a F-19), plantilla, planes de diseño, estructura y SEO.

---

## 🔬 4. Medición y atribución

*   `04_medicion_atribucion/` — Plan de arquitectura de medición y investigaciones P1-P5 (GCLID, Enhanced Conversions, modelo de datos ERP).

---

## 📦 5. Archivo (histórico congelado)

Todo lo que ya no requiere acción activa. Sin checkpoint del Supervisor no se toca ni se borra.

*   `archivo/auditoria_seo_20260815.md`, `archivo/checklist_seo_20260816.md` — Auditorías pre-lanzamiento.
*   `archivo/matriz_decision_precio_estimado.md` — Decisión de precio estimado (cerrada).
*   `archivo/guia_cambio_dominio_20261023.md` — Migración vetadeoro.co → vetadorada.co (ya ejecutada).
*   `archivo/destilacion_docs_veta.md`, `archivo/marco_estrategia_mercado.md`, `archivo/flags_testimonios_seo.md`, `archivo/LEEME.md`, `archivo/parametros_auditoria_ads_agosto_2026.md`, `archivo/REGISTRO_CAMBIO_TESTIMONIOS_ACTIVA.md` — Material de contexto previo.

---

> ⚠️ **Regla de oro de esta línea:** ninguna campaña de pago se reactiva, y ningún cambio de algoritmo de puja se aplica sin antes validar los datos empíricos contra las premisas de este arnés. La intuición se queda en la puerta; aquí mandan los CSVs y los diagnósticos.
