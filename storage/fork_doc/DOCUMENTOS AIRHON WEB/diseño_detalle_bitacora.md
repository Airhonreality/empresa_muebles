# Diseño de Detalle: Módulo Bitácora (Sitio Web Airhon)

**Especificación Técnica de UI, Secciones, Comportamiento Responsivo y Textos**  
**Enfoque:** Divulgación Progresiva, Ergonomía de Lectura y Alto Contraste  
**Versión:** 1.0  
**Fecha:** Junio 2026  

---

## 1. Estructura General y Cabecera de Sección

El módulo de Bitácora funciona como el diario de campo y archivo reflexivo de Airhon. Su estructura prioriza la legibilidad tipográfica y la facilidad de escaneo rápido de temas.

* **Título de la Sección (H1):** `Bitácora`
* **Sub-headline (H2):** `Reflexiones de campo, notas de investigación y registro técnico.`
  * *Especificación CSS:* `--font-h2` fluido (`clamp(1.5rem, calc(1.2rem + 1.5vw), 2.5rem)`), color gris neutro, ancho acotado a `50ch`.
* **Filtros por Categoría (Selector de Pestañas):**
  * Un control de botones planos alineados a la izquierda para escritorio, y deslizables horizontalmente en móvil (sin scroll vertical ni saltos).
  * **Opciones del Filtro:**
    * `Ver todo` (Activo por defecto)
    * `Diseño Social`
    * `Arte Digital`
    * `Software Libre`

---

## 2. Vista de Lista (Grid de Entradas)

Las entradas se ordenan cronológicamente (de la más reciente a la más antigua), consumiendo los datos del schema `bitacoras`.

* **Estructura de Maquetación (CSS Grid):**
  * Flujo elástico autogestionado mediante una única regla sin consultas de medios:
    ```css
    .bitacora-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
      gap: var(--spacing-md);
    }
    ```
* **Elementos Visuales de la Tarjeta de Entrada:**
  1. **Imagen de Cabecera:** Relación de aspecto fija `aspect-ratio: 16 / 9` para evitar problemas de CLS (*Cumulative Layout Shift*). Carga diferida activa (`loading="lazy"`).
  2. **Fecha:** Texto en caja alta de tamaño reducido (`0.85rem`), color gris claro. Formato: `DD de Mes, AAAA` (ej. *28 de Junio, 2026*).
  3. **Categoría (Badge):** Pequeño indicador de color según la categoría asignada.
  4. **Título de la Entrada (H3):** Tipografía semi-bold de alto contraste.
  5. **Extracto (Resumen):** Texto explicativo acotado a un máximo de 2 líneas físicas mediante CSS:
    ```css
    .entrada-extracto {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    ```
  6. **Enlace de Lectura (CTA):** Enlace de texto plano `Leer bitácora ->`. En dispositivos táctiles, el área de contacto interactiva completa se expande a toda la tarjeta (`48px` mínimos de zona activa indirecta).

---

## 3. Comportamiento en Detalle (Lectura Inmersiva)

Para evitar la pérdida de contexto nemotécnico y la fatiga visual que produce el desplazamiento completo de páginas en smartphones, la lectura del artículo detallado aplica el principio de **divulgación progresiva**:

### 3.1. Móviles y Tabletas: Hoja Inferior Deslizable (*Bottom Sheet Drawer*)
* Al presionar una entrada, un panel elástico se desliza verticalmente desde la base del dispositivo hasta ocupar el $90\%$ de la pantalla.
* **Control Físico:** Se incluye una barra horizontal visual (*grabber*) en el borde superior del modal para indicar que el usuario puede cerrar el artículo simplemente deslizando el panel hacia abajo.
* **Cierre Rápido:** Botón en esquina superior derecha en forma de `X` con área táctil activa de $48 \times 48\text{ px}$.

### 3.2. Escritorio: Vista Integrada en Dos Columnas
* La pantalla se divide en un diseño asimétrico: la barra lateral izquierda permanece fija con la lista de artículos relacionados, y la columna derecha (el 65% de la pantalla) se hidrata con el artículo seleccionado mediante una transición de opacidad elástica de $150\text{ ms}$.

---

## 4. Tipografía y Anatomía de Lectura

El cuerpo del artículo se renderiza interpretando código Markdown nativo del campo `contenido` en el schema `bitacoras`. Aplica estrictamente las directrices de ergonomía cognitiva:

* **Contenedor del Texto:**
  * `max-inline-size: 66ch;` (Garantiza que el ojo no se pierda al saltar de una línea a la siguiente).
  * `margin: 0 auto;` (Contenido perfectamente centrado).
* **Parámetros Tipográficos:**
  * **Cuerpo de Texto:** Tamaño `1.125rem` (`18px`) con un espaciado de línea elástico de `1.6`. Contraste de color mínimo de `4.5:1` sobre el fondo de la pantalla.
  * **Interlineado de Párrafos:** Espacio inferior equivalente a `1.5rem` (`margin-bottom`) para separar claramente los bloques semánticos y permitir escaneo visual tipo *Layer-Cake*.
  * **Títulos Internos (H3 / H4):** Peso Bold (`700`), espaciado superior generoso para separar subtemas de forma visual clara.
  * **Citas Destacadas (Blockquotes):** Línea vertical izquierda de acento de $4\text{ px}$ de grosor con el color del Eje curatorial correspondiente. Texto en itálica ligeramente ampliado.

---

## 5. Datos Fijos de Ejemplo para Sembrado (Seed Data)

Ejemplos literales alineados con tus proyectos de la vida real para inicializar la visualización de la Bitácora en el sistema:

### Entrada de Ejemplo 1 (Diseño Social)
* **Título:** `Diseño participativo en Tenjo: Co-creando Raíz Solar`
* **Fecha:** `2026-06-25`
* **Extracto:** `Registros de campo sobre los talleres comunitarios de soberanía alimentaria y la implementación de sistemas solares de ciclo cerrado en Cundinamarca.`
* **Contenido (Markdown):**  
  `### El Proceso en el Territorio...`  
  `El diseño no se impone; se facilita de forma horizontal. Durante tres semanas trabajamos junto a diez familias de Tenjo en el prototipado de los secadores solares comunitarios. La co-creación no solo produce herramientas funcionales, sino que fortalece la soberanía alimentaria local mediante el intercambio intergeneracional de saberes botánicos.`

### Entrada de Ejemplo 2 (Arte Digital)
* **Título:** `La Estética del Error: Glitch Art y Hacking de Hardware`
* **Fecha:** `2026-05-12`
* **Extracto:** `Reflexión crítica sobre el uso de la corrupción de datos y el error técnico programado como herramientas de resistencia visual frente a la perfección sintética de la IA.`
* **Contenido (Markdown):**  
  `### Interrumpiendo la Máquina...`  
  `Frente al bombardeo constante de imágenes generativas perfectas y sin alma, el error digital (el glitch) emerge como un acto de resistencia visual. Al forzar el desbordamiento de búfer y corromper intencionalmente los datos binarios en hardware modificado, recordamos los límites de la máquina y devolvemos la fricción humana al píxel.`
