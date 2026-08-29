# 🧭 Mini-Arnés: Línea de Demanda (Marketing y Adquisición)

Este es el índice principal del subsistema de **Demanda**, responsable de la adquisición de clientes, pauta digital (Google Ads), SEO, cualificación de leads (Embudo) y la arquitectura de conversión del sitio web público de Veta de Oro.

Cualquier agente (o humano) que trabaje en tareas de marketing, conversiones o análisis de pauta, **debe usar este archivo como su mapa central** para no perder el contexto.

---

## 📌 1. Documentos Centrales (El Núcleo)
Estos documentos dictan las reglas del juego actuales y el camino a seguir:
*   📄 **`estado_demanda.md`**: Diagnóstico actual. Documenta los dolores operativos (ej. pérdida del GCLID, "gasolina sucia") y las reglas de negocio innegociables del embudo de ventas.
*   📄 **`plan_demanda.md`**: Hoja de ruta estratégica (Fases A-F) para construir, reactivar y automatizar la captación de leads dentro de la infraestructura V3.

## 📊 2. Análisis y Pauta Digital (Google Ads)
Donde vive la ciencia de datos aplicada al presupuesto de marketing:
*   📄 **`archivo/Ads_hisotrico_agosto_2026/RELANZAMIENTO_29_AGOSTO_2026.md`**: **[ACTIVO — MÁS RECIENTE]** El sitio V3 se lanzó a producción el 2026-08-28 y el 2026-08-29 se reanudó el ciclo de pago de Ads sobre el sitio nuevo ($1.122 COP/día, CPA objetivo $7.200 COP, grupo "Cocinas", dirección directa a la landing de cocinas). **El próximo análisis de Ads debe partir de esta fecha como punto de corte** — no mezclar con la data pre-relanzamiento. Documenta también el gap de redirects 301 del Wix legacy detectado el mismo día.
*   📄 **`archivo/parametros_auditoria_ads_agosto_2026.md`**: El marco analítico creado para diagnosticar el "apagón" de agosto y medir el rendimiento reciente (incluye la corrección sobre la limitación de presupuesto del 17 de agosto). Histórico previo al relanzamiento del 29 de agosto.
*   📁 **`archivo/ads_historico_marzo_2026/`**: Histórico fundamental. Contiene el último benchmark exitoso previo a los problemas técnicos de la V3.
*   📁 **`archivo/Ads_hisotrico_agosto_2026/`**: Contiene los CSVs descargados (27 mar - 21 ago), el diagnóstico integral (`DIAGNOSTICO_AGOSTO_2026.md`), la lista de negativas (`LISTA_PALABRAS_NEGATIVAS_ROBUSTA_AGOSTO_2026.txt`), el reporte de ejecución táctica (`REPORTE_EJECUCION_Y_OPTIMIZACION_21_AGOSTO_2026.md`) y ahora el reporte de relanzamiento del 29 de agosto.
*   📄 **`archivo/PLAN_ARQUITECTURA_MEDICION_Y_ATRIBUCION_V3.md`**: **[ACTIVO - DIAMANTE 1]** Plan Maestro de Medición, Atribución (GCLID/GBRAID/WBRAID, Enhanced Conversions), Clarity y Resiliencia en WhatsApp.
*   📁 **Investigaciones del Diamante 1:** `INVESTIGACION_P1_GCLID_NEXTJS.md`, `INVESTIGACION_P2_ENHANCED_CONVERSIONS.md`, `INVESTIGACION_P3_ANALITICA_COMPORTAMIENTO.md`, `INVESTIGACION_P4_RESILIENCIA_WHATSAPP.md`, `INVESTIGACION_P5_MODELO_DATOS_ERP.md`.

## 🌐 3. Tráfico Orgánico y Sitio Público
Los cimientos de la conversión y el SEO:
*   📄 **`plan_seo_2026.md`**: Estrategia de posicionamiento orgánico.
*   📄 **`plan_estructura_sitio_publico.md`** y **`plan_diseno_web_publica.md`**: Las directrices de arquitectura de información y UX/UI para transformar el sitio en una máquina de conversión.
*   📄 **`auditoria_prelanzamiento_seo_20260815.md`** y **`checklist_pendientes_seo_20260816.md`**: Auditorías tácticas previas a los cortes a producción.

## 💡 4. Oferta y Contenido
*   📄 **`matriz_decision_precio_estimado.md`**: Lógica paramétrica para calificar usuarios a través de la transparencia de precios sin espantar a los clientes Premium.
*   📁 **`contenido/`**: Repositorio de lineamientos de *copywriting* y voz de marca.

---

> ⚠️ **REGLA DE ORO DE ESTA LÍNEA:**
> Ninguna campaña de pago se reactiva, y ningún cambio de algoritmo de puja se aplica sin antes validar los datos empíricos contra las premisas de este arnés. La intuición se queda en la puerta; aquí mandan los CSVs y los diagnósticos.
