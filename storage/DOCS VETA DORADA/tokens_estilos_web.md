# 🎨 HOJA DE TOKENS CSS Y REGLAS ESTILÍSTICAS

Este documento define el sistema de diseño visual (design tokens) y las reglas de estilo de **Veta Dorada**. Su objetivo es garantizar una coherencia estética de ultra-lujo, moderna y responsiva, antes de la implementación técnica del código.

---

## 1. Paleta de Colores (Curada y Armónica)

Para evitar colores genéricos y transmitir la calidez de la madera fina y la exclusividad del metal dorado, utilizaremos una paleta basada en tonos tierra, champaña, oro antiguo y obsidiana profunda.

### A. Paleta Principal (Variables CSS)

| Token CSS | Representación Visual | HSL / Hexadecimal | Propósito Comercial |
| :--- | :--- | :--- | :--- |
| `--color-bg-dark` | Oscuro Obsidiana | `hsl(0, 0%, 4%)` / `#0A0A0A` | Fondo principal del sitio (Branding premium). |
| `--color-bg-light` | Champaña Cálido | `hsl(38, 33%, 97%)` / `#FAF7F2` | Fondos de secciones claras o fichas técnicas. |
| `--color-gold-muted` | Oro Viejo Atemperado | `hsl(43, 36%, 73%)` / `#D4C5A1` | Acentos primarios, bordes finos, y subtítulos. |
| `--color-gold-hover` | Miel Intenso | `hsl(39, 50%, 56%)` / `#C5A059` | Hover de botones y elementos activos. |
| `--color-text-main` | Blanco Hueso | `hsl(0, 0%, 96%)` / `#F5F5F5` | Texto principal de alta legibilidad sobre fondo oscuro. |
| `--color-text-sub` | Kaki Mudo | `hsl(40, 6%, 53%)` / `#8E8A80` | Párrafos secundarios, descripciones técnicas. |
| `--color-border-thin` | Vidrio Champaña | `rgba(212, 197, 161, 0.12)` | Líneas divisorias y contornos de tarjetas. |

---

## 2. Tipografía y Jerarquía Visual

La tipografía debe combinar el rigor técnico con la elegancia artesanal. Sugerimos fuentes cargadas desde Google Fonts.

*   **Fuentes Seleccionadas:**
    *   *Familia para Títulos (Headings):* **Outfit** (Moderna, geométrica, de gran personalidad).
    *   *Familia para Textos (Body):* **Inter** (Limpia, legible, optimizada para pantallas móviles).

### Reglas de Escala Tipográfica (Mobile-First)

```css
/* Escritorio (Desktop >= 1024px) */
h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 3.5rem; /* 56px */
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 2.25rem; /* 36px */
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.35;
}

p.body-large {
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem; /* 18px */
  font-weight: 400;
  line-height: 1.7;
}

p.body-base {
  font-family: 'Inter', sans-serif;
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.6;
}

/* Móvil (Mobile < 1024px) */
@media (max-width: 1023px) {
  h1 { font-size: 2.5rem; } /* 40px */
  h2 { font-size: 1.75rem; } /* 28px */
  h3 { font-size: 1.25rem; } /* 20px */
  p.body-large { font-size: 1rem; }
}
```

---

## 3. Efecto Glassmorphism (Branding de Ultra-Lujo)

El sitio utilizará transparencias controladas en componentes flotantes (como el menú principal de navegación y las tarjetas de producto) para generar un efecto de "cristal flotado" sobre las imágenes de fondo.

```css
.token-glass-navbar {
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border-thin);
}

.token-glass-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-thin);
  border-radius: 12px;
}
```

---

## 4. Micro-animaciones e Interacciones (Efecto "Vivo")

Para elevar la experiencia percibida de la web, todas las interacciones de botones y enlaces deben tener transiciones suaves y controladas, evitando cambios bruscos de estado.

*   **Transition Base:** `all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)` (Curva elegante de desaceleración).
*   **Hover en Enlaces de Menú:**
    *   Línea inferior dorada que se expande desde el centro al pasar el cursor.
*   **Hover en Tarjetas de Catálogo:**
    *   Elevación sutil en el eje Y (`transform: translateY(-4px)`).
    *   El borde de cristal champaña aumenta ligeramente su opacidad.
*   **Hover en Botón de Agendamiento:**
    *   Desplazamiento del color de fondo de `--color-gold-muted` a `--color-gold-hover`.
    *   Sombra dorada difuminada de baja intensidad (`box-shadow: 0 8px 20px rgba(212, 197, 161, 0.2)`).
