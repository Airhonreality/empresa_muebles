# Diseño de Detalle: Módulo Detalle de Proyecto (Sitio Web Airhon)

**Especificación Técnica de Layouts Adaptativos según Eje Curatorial**  
**Enfoque:** Bifurcación Estética, Independencia de Componentes y Diseño Contextual  
**Versión:** 1.0  
**Fecha:** Junio 2026  

---

## 1. Estructura General e Información Base (Metadatos)

Independientemente del eje al que pertenezca el proyecto, la parte superior del caso de estudio mantiene una estructura de metadatos estandarizada para garantizar la consistencia técnica de la base de datos (`proyectos` schema):

* **Fila de Migas de Pan (Breadcrumbs):** `Proyectos / [Nombre del Eje en UI] / [Nombre del Proyecto]`
* **Cabecera de Título (H1):** `[Nombre del Proyecto]` (e.g., *Raíz Solar* o *Agnostic Indra*).
* **Faja de Metadatos (Diseño en línea elástico):**
  * **Año:** `[ano]` (e.g., *2026*)
  * **Rol desempeñado:** `[rol]` (e.g., *Diseñador Especulativo*)
  * **Aliados / Colaboradores:** Lectura relacional del schema `proyectos_aliados` -> `aliados.nombre` (e.g., *Colectivo Rústico*).
  * **Enlace Externo:** Botón de icono minimalista para acceder al sitio en vivo o repositorio (`url_link`).

---

## 2. Bifurcación Estética de Layouts (Render Adaptativo)

El sistema evalúa el campo `eje.key` de la relación del proyecto y renderiza una plantilla de diseño y componentes especializada. Esto evita usar un diseño único genérico que diluya el valor artístico o la claridad técnica.

```
          ┌────────────────────────┐
          │   Faja de Metadatos    │ (Común)
          └───────────┬────────────┘
                      │
            [Evaluar Eje Key]
                      │
      ┌───────────────┼───────────────┬───────────────┐
      ▼               ▼               ▼               ▼
  [Diseño 1:      [Diseño 2:      [Diseño 3:      [Diseño 4:
  Social]         Artístico]      Servicios]      Código]
  (Organic,       (Glitch,        (Bento, Density,(Terminal Dark,
  Green/Clay)     Mono, Canvas)   Metric Strip)   Code Blocks)
```

### Layout 1: Diseño Social y Prospectivo (Eje 1)
* **Estilo Visual:** Fondo HSL cálido (hueso o arena), tipografías con serifa elegante para encabezados y espaciado elástico amplio (`--spacing-xl`).
* **Componentes Especializados:**
  * **Bloque "Voz de la Comunidad" (Blockquote):** Citas textuales grandes de los participantes del taller participativo.
  * **Bitácora de Campo:** Tarjetas pequeñas que enlazan dinámicamente a las reflexiones del proyecto (del schema `bitacoras` asociado).
  * **Galería de Proceso:** Carrusel de imágenes horizontales de los talleres en territorio.

### Layout 2: Arte Digital y Sonoro (Eje 2)
* **Estilo Visual:** Fondo negro absoluto (`hsl(0, 0%, 0%)`), acentos en violeta y azul neón, tipografías monoespaciadas y rejillas de texto compactas.
* **Componentes Especializados:**
  * **Audio Canvas Player (Espectrograma):** Si el proyecto incluye archivos sonoros, se renderiza un reproductor interactivo en HTML5/Canvas que dibuja las frecuencias de audio en tiempo real al dar play.
  * **Malla de Interrupción Visual:** Animaciones glitch de baja frecuencia sobre imágenes en hover (aberración cromática discreta en CSS/WebGL).

### Layout 3: Optimización y Servicios (Eje 3)
* **Estilo Visual:** Fondo gris industrial limpio, fuentes Sans-serif de alta precisión geométrica.
* **Componentes Especializados:**
  * **Metric Strip (Faja de Indicadores):** Tres tarjetas compactas mostrando mejoras numéricas logradas en la consultoría (e.g., `Tiempo de ciclo: -35%`, `ROI: 12 meses`, `Mermas reducidas: $40M COP`).
  * **Diagrama de Procesos:** Visualización del blueprint operativo "Antes / Después".

### Layout 4: Desarrollo de Software (Eje 4)
* **Estilo Visual:** Interfaz estilo terminal. Fondo oscuro (`hsl(220, 15%, 10%)`), acentos en verde fósforo.
* **Componentes Especializados:**
  * **Visor de Código Interactivo:** Componente con sintaxis resaltada para renderizar fragmentos de código del repositorio (`Agnostic Indra`).
  * **Tabla de Rendimiento Edge:** Métricas de carga del sitio (LCP, CLS, peso del bundle en bytes) expuestas de forma transparente para certificar la calidad técnica de la implementación.

---

## 3. Cuerpo del Contenido (Markdown Parser)

El contenido principal del proyecto se almacena en el campo `descripcion_markdown` del schema `proyectos`. 

* **Regla de Legibilidad:** Se procesa mediante un parseador de Markdown que inyecta automáticamente clases CSS de ergonomía cognitiva:
  * `max-inline-size: 66ch` para todos los párrafos de lectura.
  * `aspect-ratio: 16 / 9` para todos los videos o imágenes integrados en el markdown.
  * `tab-size: 2` para bloques de código para evitar sangrías anchas que provoquen scroll horizontal.
