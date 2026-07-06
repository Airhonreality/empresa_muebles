# 📖 DISEÑO DE DETALLE: MÓDULO HOME (VETA DORADA)

Este documento detalla la especificación técnica, de contenido y de estilos para la reconstrucción del Home (`VetaHome.tsx`) de **Veta Dorada**. Esta propuesta integra la hoja de estilos de **Luz & Biofilia**, resuelve los hallazgos de la auditoría de rutas y fundamenta las decisiones de diseño mediante los marcos de **Ergonomía Cognitiva** y **Maquetación Responsiva / CSS**.

---


```

## 3. Mapa de Páginas y Estructura de Contenido

### A. Página de Inicio (`/`)
El Home es la carta de presentación de la marca y el inicio del embudo.
1.  **Presentación de Marca (Hero):**
    *   *Mensaje Central:* "Carpintería arquitectónica de alta precisión."
    *   *Subtítulo:* "Diseñamos, fabricamos e instalamos espacios integrales pensados para tu bienestar. Tecnología 3D, materiales premium y calidad de fábrica, sin intermediarios."
    *   *Visual:* Imagen fotorrealista muy iluminada (luz solar entrando por ventanales), mostrando una cocina o estudio con toques biofílicos (vegetación).
    *   *CTA Principal:* "Agendar Asesoría" (Abre el embudo de conversión).
2.  **Validación Técnica y Calidad:**
    *   Explicación de la tecnología 3D para lograr precisión milimétrica.
    *   Ventaja de ser punto de fábrica (control total del proceso y eliminación de sobrecostos).
    *   Uso de materiales nobles y herrajes de clase mundial.
3.  **Portafolio Aspiracional:**
    *   Galería curada de "El arte de la unión fina", mostrando detalles de acabados.


#### Sección 2: Validación Técnica (Por qué Veta Dorada)
*   **Propósito:** Demostrar autoridad técnica y mitigar las dudas del cliente.
*   **Maquetación:** Rejilla fluida de tres columnas (`.veta-grid-auto`).
*   **Puntos de Validación (Layer-Cake):**
    1.  **Disminuye la incertidumbre:** *"Visualice cada detalle de su proyecto antes de cortar la primera pieza. Modelamos en 3D y definimos presupuestos transparentes y detallados, "*
    2.  **Punto de Fábrica Directo:** *"Sin intermediarios ni sobrecostos. Fabricamos en nuestra planta de Bogotá garantizando el control total de la calidad y plazos de entrega."*
    3.  **Asosoria con diseñadores de interiores:** *" "*

#### Sección 3: Acceso a Portafolios (Espacios a Medida)
*   **Propósito:** Mantener la ruta `/espacios-a-medida` para la galería física y conceptual de mobiliario sin generar redundancias en la base de datos de rutas.
*   **Visual:** Render o fotografía de alta calidad en formato `aspect-ratio: 16 / 9` con efecto zoom sutil de hover (`scale-103` duración `0.8s`).
*   **Acciones:** Botón secundario para visitar la galería completa de espacios y colecciones.



## 5. Estructura del Footer (Pie de Página)

*   **Columna 1: Veta Dorada Studio**
    *   *Slogan:* "Habita en el bienestar."
    *   Enlaces a Redes Sociales oficiales.
*   **Columna 2: Navegación Principal**
    *   *Espacios a Medida*, *Colecciones de Catálogo*, e *Iniciar Sesión*.
*   **Columna 3: Contacto**
    *   Dirección de fábrica/showroom en Bogotá.
*   **Bloque Inferior: Desacoplamiento Legal**
    > *"Veta Dorada es una marca comercial registrada. Todos los procesos de facturación, contratos legales, recaudos y garantías son operados y representados legalmente por la sociedad HERMANOS GARCIA GONZALEZ SAS, con NIT 901421357-9."*

