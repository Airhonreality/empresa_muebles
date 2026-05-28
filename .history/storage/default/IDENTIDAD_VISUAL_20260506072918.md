# 🎨 Manual de Identidad Visual (Tokens & Tailwind)

Este satélite tiene soberanía sobre su propia estética. El diseño no reside en el código del motor, sino en los tokens y utilidades definidos aquí.

## 🎨 Variables de Tema (`tailwind.config.js` mapping)

Para cambiar la apariencia global, se deben inyectar estos valores en el CSS raíz. El motor de Tailwind los consume de la siguiente forma:

- **Fondo Principal (`bg-background`):** Mapeado a `--surface-0`.
- **Color de Acento (`bg-primary` / `text-primary`):** Mapeado a `--accent`. Es el color de la marca (Veta de Oro).
- **Texto Principal (`text-foreground`):** Mapeado a `--text-primary`.
- **Bordes e Inputs (`border-border`):** Mapeados a `--border`.
- **Curvatura (`rounded-lg`):** Mapeado a `--radius`.

## 🧩 Consumo de Estilos en Módulos

Queda prohibido el uso de clases CSS personalizadas si existe una utilidad de Tailwind. Los módulos deben construirse combinando clases atómicas:

```javascript
// Ejemplo de construcción soberana de un componente
const cardClass = "bg-background border border-border p-6 rounded-lg shadow-sm";
const titleClass = "text-foreground font-serif text-2xl mb-4";
const buttonClass = "bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-all";
```

## 📐 Reglas de Oro de Layout
1. **Unidades Relativas:** Prohibido el uso de `px`. Usar la escala de Tailwind (`p-4`, `m-2`, `w-1/2`, `h-screen`).
2. **Distribución:** El estándar de facto es **Flexbox** (`flex`) y **CSS Grid** (`grid`).
3. **Responsividad:** El diseño debe ser mobile-first usando los prefijos de Tailwind (`sm:`, `md:`, `lg:`).

## 📸 Assets
Todos los recursos específicos (logos, texturas) deben vivir en `/assets` del silo.
