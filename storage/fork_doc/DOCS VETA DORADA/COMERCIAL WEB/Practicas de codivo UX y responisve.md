
## 1. Concepto Estético y Tokens Aplicados

La interfaz se rediseña para transmitir amplitud, calma y conexión natural, abandonando el tema oscuro original para adoptar una dominancia lumínica.

### A. Paleta de Colores en Código (Tokens)
*   **Fondo Principal (Luz Solar):** `--color-bg-light` (`#FCFBF9` / HSL `hsl(40, 30%, 98%)`)
*   **Fondo Alterno (Lino Natural):** `--color-bg-alt` (`#F3EFE9` / HSL `hsl(38, 26%, 93%)`)
*   **Acento Madera Noble:** `--color-wood-raw` (`#D7C4A5` / HSL `hsl(37, 39%, 75%)`)
*   **Texto Principal (Carbón Suave):** `--color-text-main` (`#2B2B2B` / HSL `hsl(0, 0%, 17%)`)
*   **Texto Secundario (Piedra):** `--color-text-sub` (`#7A7873` / HSL `hsl(43, 4%, 46%)`)
*   **Acento de Lujo (Negro Premium):** `--color-contrast-luxury` (`#0A0A0A` / HSL `hsl(0, 0%, 4%)`)

### B. Tipografía de Precisión
*   **Títulos:** `Futura BT` (Visualmente geométrica, limpia y contemporánea, representando estructura).
*   **Cuerpo de Texto:** `Futura BT` con fallback a `Century Gothic` / `Avenir Next` (Legibilidad fluida y consistencia global del fork).

---

## 2. Maquetación Responsiva y Rendimiento CSS
*Basado en `INS_Pantallas responsive y CSS.md`*

### A. Tipografía y Espaciado Fluido
Para evitar saltos visuales bruscos entre resoluciones y mantener la consistencia estética:
*   **Fórmula Fluid H1 (Futura BT):** 
    $$\text{font-size: clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)}$$
    *(Escala progresivamente de 32px en pantallas móviles de 320px a 56px en pantallas de escritorio de 1200px)*
*   **Espaciados de Relleno (Padding/Margin):**
    *   `--spacing-md`: `clamp(1.25rem, calc(0.909rem + 1.7vw), 2rem)` (20px $\rightarrow$ 32px)
    *   `--spacing-lg`: `clamp(2rem, calc(1.09rem + 4.55vw), 4rem)` (32px $\rightarrow$ 64px)

### B. Estructura de Rejillas y Flujo
*   **Garantía de Reflow (WCAG 2.2):** Se prohíbe el uso de anchos rígidos en píxeles. Los contenedores usan `max-width: 1200px` and `width: 100%`.
*   **Rejillas Auto-ajustables (Grid sin Media Queries):**
    ```css
    .veta-grid-auto {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: var(--spacing-md);
    }
    ```
    *(La función `min(100%, 320px)` asegura que el contenedor nunca desborde lateralmente en dispositivos extremadamente angostos)*

### C. Optimización de Rendimiento de Carga (Core Web Vitals)
*   **Mitigación de CLS (Cumulative Layout Shift):** Todos los renders e imágenes del portafolio del Home deben definir una relación de aspecto explícita mediante la propiedad CSS:
    ```css
    .render-container {
      aspect-ratio: 16 / 9;
      width: 100%;
      height: auto;
    }
    ```
*   **Optimización del LCP (Largest Contentful Paint):** La imagen principal del Hero del Home se cargará mediante formato de última generación (AVIF o WebP) e incorporará el atributo prioritario:
    ```html
    <img src="/assets/hero-light-biophilic.webp" fetchpriority="high" alt="Cocina de alta gama Veta Dorada" />
    ```

---

## 3. Ergonomía Cognitiva y Arquitectura de Lectura
*Basado en `INS_ergonomía cognitiva para el diseño de experiencia.md`*

### A. Mitigación del Patrón en F (Escaneo Visual Ineficiente)
Para evitar que el usuario ignore el 70% del contenido de la página, implementaremos el **Patrón Layer-Cake (Pastel en Capas)**:
1.  Uso sistemático de subtítulos descriptivos jerarquizados.
2.  Marcado de palabras técnicas clave en negrita suave (`font-semibold`).
3.  Uso de listas no ordenadas con iconos discretos de madera natural para romper la fatiga ocular.

### B. Respuesta Atómica para Búsqueda Generativa (SEO 2026-2027)
Incorporamos un bloque de texto que responde a la definición de la marca en un formato estructurado de **46 palabras**, óptimo para la indexación y lectura rápida del cerebro (memoria de trabajo):

> *"Veta Dorada es un estudio de carpintería arquitectónica ubicado en Bogotá. Especializados en el diseño, modelado 3D y fabricación directa de cocinas integrales, vestidores y mobiliario residencial de alta gama, garantizan precisión milimétrica y herrajes de estándar global para optimizar el bienestar y valor de su hogar."*

### C. Geometría de Interacción (Zonas del Pulgar y WCAG Target Sizes)
*   **Mobile Thumb Zone:** En pantallas móviles, los botones primarios de acción (como el CTA para agendar asesoría) se ubican simétricamente en el eje central y en la zona inferior cómoda de la pantalla, evitando la esquina superior donde la precisión táctil decae al 61%.
*   **Tamaño del Objetivo de Toque:** De acuerdo con las pautas de accesibilidad y usabilidad móvil, todos los botones o enlaces interactivos en pantallas táctiles tendrán un tamaño mínimo de `48px x 48px` (o área interactiva expandida mediante rellenos) con una separación de seguridad entre botones contiguos de mínimo `8px` para evitar el error de pulsación accidental.
*   **Media Queries de Interacción:** Los efectos de transición al pasar el cursor (hover) se encapsulan condicionalmente para no entorpecer la interacción en pantallas táctiles:
    ```css
    @media not all and (hover: none) {
      .veta-btn:hover {
        transform: translateY(-2px);
        background-color: var(--color-contrast-luxury);
      }
    }
    ```

---
