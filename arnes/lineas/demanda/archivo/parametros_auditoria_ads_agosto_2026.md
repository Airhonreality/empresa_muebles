# Marco de Auditoría Analítica: Campañas Google Ads (Agosto 2026)

Este documento establece los parámetros técnicos y analíticos con los que evaluaremos el dataset extraído de Google Ads (Periodo: 27 de Marzo 2026 - Presente). El objetivo de esta auditoría es diagnosticar la caída reciente de conversiones, la falta de leads en tickets altos (Cocinas) y evaluar el desempeño general frente al benchmark establecido en Marzo de 2026.

---

## 1. Análisis de Ruptura Algorítmica (El "Apagón" de Agosto)
*El aviso de Google indica que el 17 de agosto hubo un cambio en el comportamiento de las campañas con objetivo de puja (CPA/ROAS) que están limitadas por el presupuesto.*

*   **Métrica a evaluar:** Caída abrupta de impresiones, volumen de clics y gasto diario a partir de la semana del 17 de agosto.
*   **Hipótesis Profesional:** Dado que en marzo fijamos un presupuesto de $8.500 COP diarios con un CPA de $6.500 COP, la campaña siempre ha operado bajo el estado "Limitada por el presupuesto". El cambio de algoritmo del 17 de agosto probablemente desestabilizó el aprendizaje de la campaña, causando que Google dejara de mostrar los anuncios al no poder garantizar el CPA bajo un presupuesto tan constreñido.
*   **Acción de Auditoría:** Aislar el rendimiento de los últimos 15 días en el *Informe de Campañas* para confirmar la correlación exacta entre la fecha del update de Google y la caída del tráfico a cero.

## 2. Auditoría de Distribución de Inversión (Canibalización de Tickets)
*El usuario reporta cierre de closets y muebles pequeños, pero ausencia total de cocinas.*

*   **Métrica a evaluar:** Gasto (Coste) y CTR segmentado por Grupo de Anuncios y Palabras Clave.
*   **Hipótesis Profesional:** Los términos relacionados con muebles pequeños y closets tienen un CPC (Costo Por Clic) más bajo o mayor volumen de búsqueda barata. El algoritmo de "Maximizar Conversiones" está optando por la ruta más fácil, agotando los limitados $8.500 COP diarios en tickets bajos antes de que el grupo de "Amoblamiento Integral / Cocinas" pueda entrar a subastas de ticket alto.
*   **Acción de Auditoría:** Comparar el porcentaje de inversión consumido por las palabras clave de cocinas versus el resto, en el *Informe de Palabras clave de búsqueda*.

## 3. Evaluación de Calidad de Tráfico (Índice de "Gasolina Sucia")
*En marzo se implementó la Concordancia de Frase y una lista masiva de negativas para evitar tráfico de "bricolaje" o "reparaciones".*

*   **Métrica a evaluar:** Ratio de intencionalidad comercial en el *Informe de Términos de Búsqueda*.
*   **Hipótesis Profesional:** A pesar de los controles de marzo, Google puede haber introducido variaciones semánticas irrelevantes o el tráfico que entra sigue buscando "precio barato" en lugar de "fabricación a medida", lo que explica el rate de cierre bajo.
*   **Acción de Auditoría:** Ejecutar una limpieza exhaustiva del reporte de términos reales que activaron los anuncios. Extraeremos una nueva cohorte de palabras clave negativas para blindar la futura campaña.

## 4. Revisión de Objetivos de Adquisición (Benchmark de CPA)
*En marzo, la campaña tenía un costo histórico de ~$14.400 COP por conversión y se fijó un tCPA (CPA Objetivo) agresivo de $6.500 COP.*

*   **Métrica a evaluar:** CPA Real (Coste / Conv.) promedio de los últimos 5 meses.
*   **Hipótesis Profesional:** Forzar al algoritmo a un CPA irrealmente bajo pudo haber ahogado el alcance o traído conversiones de muy baja calidad (usuarios impulsivos que hacen clic en el botón de WhatsApp pero rebotan al momento de la calificación).
*   **Acción de Auditoría:** Verificar si el CPA real logrado se acercó a la meta de los $6.500 COP y evaluar si el objetivo de puja actual requiere recalibración para competir por el público Premium.

## 5. Integridad del Sistema de Seguimiento (Tracking)
*Como se documentó en `estado_demanda.md`, hubo una pérdida del identificador GCLID y problemas en el embudo durante la transición técnica.*

*   **Métrica a evaluar:** Discrepancia entre las conversiones reportadas por Google Ads vs. Los contactos reales y calificados que llegaron al WhatsApp de ventas.
*   **Hipótesis Profesional:** Google Ads está registrando "micro-conversiones" (clics en botones) que no se traducen en leads reales porque el embudo híbrido de cualificación (el Modal V3) está frenando correctamente a los curiosos, pero Ads sigue optimizando para el clic superficial.
*   **Acción de Auditoría:** Preparar las bases para implementar un rastreo de eventos más maduro en la V3 que le enseñe a Google a pujar solo por los usuarios que completan el formulario de filtrado, no solo los que hacen clic en "Contactar".
