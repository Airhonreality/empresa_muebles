@#### **1.1. El "Porqué" (Requerimiento Fundamental de Negocio - RFN)**

*   **RFN-1 (Velocidad y Reducción de Fricción):** El proceso manual actual de crear cotizaciones es lento, propenso a errores y requiere múltiples herramientas (Notion, Figma, etc.). Esto retrasa la respuesta al cliente y consume valiosas horas de trabajo que podrían dedicarse a la venta o al diseño. **El propósito fundamental de este flujo es reducir el tiempo de generación de una cotización compleja y con variantes de horas a minutos.**

*   **RFN-2 (Claridad para el Cliente):** Las cotizaciones con múltiples opciones (variantes) son cognitivamente abrumadoras para el cliente si no se presentan de forma clara. Una presentación confusa lleva a la parálisis por análisis y a la pérdida de ventas. **El propósito de este flujo es producir un documento PDF narrativo y ergonómico que guíe al cliente hacia una decisión, en lugar de simplemente presentarle una tabla de datos.**

*   **RFN-3 (Consistencia y Profesionalismo):** La creación manual de documentos introduce inconsistencias en el formato, los cálculos y la presentación de la marca. **El propósito de este flujo es garantizar que cada cotización emitida sea 100% consistente, libre de errores de cálculo y profesionalmente alineada con la identidad de la marca.**

#### **1.2. El "Qué" (Requerimientos Funcionales - FRs)**

Este flujo, orquestado por INDRA (Orbital Core), debe ser capaz de:

*   **FR-1 (Ingesta de Datos):** Leer una `Cotización` específica y todas sus `Líneas de Cotización` asociadas desde la base de datos de Notion.
*   **FR-2 (Agrupación por Variante):** Identificar y agrupar las `Líneas de Cotización` basándose en la propiedad de texto `Variante` (ej. "Base", "Opción Melamina").
*   **FR-3 (Agrupación por Espacio):** Dentro de cada grupo de `Variante`, agrupar las líneas por la propiedad de texto `Espacio` (ej. "Cocina", "Estudio").
*   **FR-4 (Cálculo y Agregación):** Calcular los subtotales para cada `Espacio` dentro de cada `Variante`, y los totales para cada `Variante`.
*   **FR-5 (Presentación Narrativa):** Construir un objeto de datos consolidado que contenga la información necesaria para el PDF ergonómico, incluyendo un "Resumen Ejecutivo" con los totales de cada variante y un desglose detallado.
*   **FR-6 (Generación de Documento):** Cargar una plantilla `HTML` desde Google Drive, fusionarla con los datos agregados, y generar un `Blob` de PDF.
*   **FR-7 (Distribución y Archivo):** Guardar el PDF generado en una carpeta designada de Google Drive y enviarlo por correo electrónico como adjunto al destinatario especificado.

#### **1.3. El "Para Qué" (Filosofía de Diseño y Axiomas)**

Este flujo se diseña siguiendo los principios axiomáticos descubiertos durante la auditoría de INDRA.

*   **Axioma de Desacoplamiento (La Verdad del Papel):** La lógica de negocio vive en los datos, no en el flujo.
    *   **NO** hay `if/else` en el flujo para manejar variantes. El flujo es "tonto": simplemente lee la etiqueta `Variante` que el comercial asigna en Notion.
    *   **NO** hay "recetas mágicas" en el flujo. El flujo lee las `Líneas de Cotización` tal como el comercial las ha construido, ya sea expandiendo un módulo o añadiendo un ítem manual.
    *   **Consecuencia:** El flujo es un **agregador y presentador**, no un motor de configuración. Esto lo hace más simple, más robusto y más fácil de mantener.

*   **Axioma de Resiliencia (Manejo de Datos Incompletos):**
    *   El flujo **NO DEBE** fallar si una propiedad opcional en Notion está vacía.
    *   La responsabilidad de manejar la ausencia de datos recae en la **Plantilla HTML**. Si el placeholder `{{cliente.telefono}}` se resuelve a un string vacío, el PDF simplemente mostrará "Teléfono: " sin nada a continuación. La presentación se degrada, pero el proceso no se rompe.
    *   **Excepción:** El flujo **SÍ DEBE** fallar de forma controlada si falta un dato crítico para una operación (ej. el `to` en el `EmailAdapter`).

*   **Axioma de la Fuente Única de Verdad:**
    *   **Notion es la fuente de verdad** para los datos de la cotización. El flujo no inventa ni modifica precios; los lee.
    *   **El `flowContext.system` es la fuente de verdad** para la estructura del sistema. El flujo confía en los `folderId` que INDRA le proporciona para saber dónde guardar los archivos.

Este manifiesto establece el alma de nuestro primer flujo de negocio. Es rápido, es claro, es consistente, y está construido sobre los cimientos de roca que hemos forjado.

Ahora, procedamos al siguiente punto: visualizar la cotización ideal.