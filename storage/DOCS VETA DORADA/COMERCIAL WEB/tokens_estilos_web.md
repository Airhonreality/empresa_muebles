# 🌿 HOJA DE TOKENS CSS Y REGLAS ESTILÍSTICAS (Luz & Biofilia)

Este documento define el sistema de diseño visual (design tokens) y las reglas de estilo de **Veta Dorada**. Basado en los requerimientos de la marca, nos alejamos del "Dark Mode" para abrazar una estética luminosa, natural, pacífica y de altísima exclusividad arquitectónica.

---

## 1. Paleta de Colores (Diseño Biofílico y Lumínico)

El objetivo es maximizar la sensación de luz natural, amplitud espacial y conexión con la madera pura. El color negro se reserva exclusivamente para generar un "contraste de lujo" en detalles muy específicos.

### A. Paleta Principal (Variables CSS)

| Token CSS | Representación Visual | Hexadecimal / HSL | Propósito Comercial |
| :--- | :--- | :--- | :--- |
| `--color-bg-light` | **Luz Solar (Fondo Principal)** | `#FCFBF9` / `hsl(40, 30%, 98%)` | El lienzo de toda la web. Transmite limpieza, amplitud y resalta los renders fotorrealistas. |
| `--color-bg-alt` | **Lino Natural (Fondo Secundario)** | `#F3EFE9` / `hsl(38, 26%, 93%)` | Para destacar suavemente secciones o tarjetas sin romper la estética de luz. |
| `--color-wood-raw`| **Madera Natural (Acento Suave)** | `#D7C4A5` / `hsl(37, 39%, 75%)` | Detalles finos, bordes de elementos y separadores sutiles (remplaza al dorado "barato"). |
| `--color-text-main` | **Carbón Suave (Texto Principal)** | `#2B2B2B` / `hsl(0, 0%, 17%)` | Texto general. Evitamos el negro puro (#000) para no cansar la vista, manteniendo elegancia. |
| `--color-text-sub` | **Piedra Gris (Texto Secundario)**| `#7A7873` / `hsl(43, 4%, 46%)` | Para subtítulos, descripciones técnicas o notas al pie. |
| `--color-contrast-luxury`| **Negro Absoluto (Premium)** | `#0A0A0A` / `hsl(0, 0%, 4%)` | El toque de ultra-lujo. Solo se usa para Botones Primarios, Tipografía de gran tamaño en encabezados Hero, y la Colección High-End. |

---

## 2. Tipografía y Jerarquía Visual

La tipografía debe combinar precisión técnica con accesibilidad y lujo sobrio.

*   **Fuentes Seleccionadas:**
    *   *Familia para Títulos (Headings):* **Outfit** (Geométrica, limpia, transmite arquitectura y estructura).
    *   *Familia para Textos (Body):* **Inter** o **Roboto** (Legibilidad perfecta para párrafos y descripciones técnicas).

### Reglas de Escala Tipográfica (Mobile-First)

```css
/* Escritorio (Desktop >= 1024px) */
h1 {
  font-family: 'Outfit', sans-serif;
  color: var(--color-contrast-luxury);
  font-size: 3.5rem; /* 56px */
  font-weight: 300; /* Peso ligero para dar aire y elegancia */
  line-height: 1.15;
  letter-spacing: -0.03em; /* Letras ligeramente juntas (Tight tracking) = Premium */
}

h2 {
  font-family: 'Outfit', sans-serif;
  color: var(--color-text-main);
  font-size: 2.25rem; /* 36px */
  font-weight: 400;
  line-height: 1.25;
}

p.body-large {
  font-family: 'Inter', sans-serif;
  color: var(--color-text-sub);
  font-size: 1.125rem; /* 18px */
  font-weight: 300;
  line-height: 1.7; /* Mucho interlineado para "respirar" */
}
```

---

## 3. UI y Componentes Visuales

### Sin bordes rígidos (Flujo Natural)
Se eliminan por completo los "bordes duros" o contenedores que interrumpan la visual del cliente. Queremos que las fotos de los proyectos fluyan de borde a borde en la pantalla.

### Botón de Conversión Primaria (El Contraste)
El botón que llama al embudo de WhatsApp debe destacar inmediatamente.

```css
.btn-primary {
  background-color: var(--color-contrast-luxury); /* Negro Premium */
  color: var(--color-bg-light); /* Texto Blanco/Luz */
  padding: 16px 32px;
  border-radius: 4px; /* Ligeramente curvo, no circular (transmite precisión) */
  font-family: 'Outfit', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: var(--color-text-main);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(10, 10, 10, 0.15);
}
```

### Efecto Glassmorphism (Ligero)
Si hay menús flotantes sobre imágenes (como el Navbar), usarán un cristal esmerilado blanco, no oscuro.

```css
.token-glass-navbar {
  background: rgba(252, 251, 249, 0.85); /* Luz translúcida */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(215, 196, 165, 0.2); /* Borde madera muy suave */
}
```

---

## 4. Sensación Háptica y Micro-animaciones

Las animaciones deben ser lentas y pacíficas. Nada de rebotes bruscos que se sientan "infantiles" o "baratos".
*   **Aparición de textos:** Fade in suave de abajo hacia arriba (`duration: 0.8s, ease: cubic-bezier(0.22, 1, 0.36, 1)`).
*   **Hover en Renders:** Al pasar el cursor sobre la foto de una cocina, esta hace un ligerísimo "Zoom-in" (escala 1.03) muy lento para invitar a la contemplación de los detalles.
