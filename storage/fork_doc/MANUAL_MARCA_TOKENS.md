# Manual de marca y tokens

Estado: `plan_borrador`

Este manual fija la fuente unica de marca del fork y separa con claridad:

- primitivos de marca,
- tokens semanticos,
- tokens de componente,
- y excepciones locales que deben quedarse en la lane dueña.

Objetivo operativo: mantener la marca actual sin cambiar valores visuales, pero eliminar la ambiguedad de donde vive cada decision de estilo.

## Inventario de tokens existentes

| Archivo | Que define | Solapes / contradicciones |
|---|---|---|
| `src/app/globals.css:6-73` | Base del engine: tokens Shadcn/agnostic (`--background`, `--foreground`, `--card`, `--border`, `--input`, `--radius`), aliases `--sat-*`, escalas `--ag-*`, sombras y tipografia fallback. | Se solapa con `storage/styles/tokens.css` en colores base, radios y tipografia. La parte de `--ag-*` ya introduce tokens de componente/funcion. |
| `src/app/globals.css:76-113` | Tema oscuro y tipografia global de aplicacion. | Contradiccion relevante: `.font-outfit`, `.font-heading` y `.font-serif` fuerzan `--sat-font-sans !important`, lo que anula la diferenciacion que intenta introducir `storage/styles/tokens.css` con `--sat-font-heading`. |
| `src/app/globals.css:117-188` | Capas de componentes agnosticos: `.ag-panel`, `.ag-panel-header`, `.ag-panel-content`, `.ag-title`, `.ag-heading`, `.ag-label`, `.ag-caption`, `.ag-control`, `.ag-form-grid`, `.ag-card-grid`. | Comparte proposito con `src/styles/layout_tokens.css` en paneles, bordes y grids. Aqui el lenguaje es mas canonico; en layout_tokens queda una capa paralela que no debe divergir. |
| `src/app/globals.css:236-259` | Scrollbar custom y theme escape hatch `.theme-veta_de_oro`. | La clase `theme-veta_de_oro` duplica color, borde y sombra con literales. Debe convertirse en un paquete de tokens de tema, no quedarse como override literal. |
| `src/styles/layout_tokens.css:11-52` | Tokens y clases de layout/HUD: `--space-unit`, `--layout-padding-base`, `--layout-gap-base`, `--layout-accent`, `--layout-bg-panel`, `--layout-border`, `.hud-panel`, `.matrix-grid`, `.matrix-dot`. | Se solapa con `--sat-*` y con `.ag-panel` en paneles, bordes y radios. Ademas hardcodea radios y tamaños en px/rem en vez de reutilizar `--ag-radius-*` y `--ag-*`. |
| `storage/styles/tokens.css:10-76` | Paleta de marca del fork: `--background`, `--foreground`, `--card`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--radius`, alias `--sat-*`, tipografia del fork y namespace `--veta-*` con capas de espacio y material. | Es la capa mas rica de marca. Solapa con `globals.css` en los tokens base, pero aqui vive la identidad visual real del fork. Debe ser la fuente canónica para la marca del producto. |
| `storage/styles/tokens.css:79-265` | Utilities y superficies `veta`: glass, stone, matte, sheen, heading, media card, contrast, etc. | Aqui esta el mayor volumen de estilos visuales especificos. Parte ya esta tokenizada, pero varios literales siguen vivos dentro de estas superficies y deben centralizarse. |

### Lectura de solapes

- `src/app/globals.css` y `src/styles/layout_tokens.css` son archivos del engine (propiedad seed).
- `storage/styles/tokens.css` es la capa del fork donde vive la marca canonica del proyecto.
- La marca de negocio debe subir y quedarse en `storage/styles/tokens.css`; no se debe empujar identidad de fork al engine.
- Si una regla del engine bloquea de forma real al fork, se documenta como issue de engine y se resuelve por override desde la capa del fork con mayor especificidad, no alterando el engine para meter marca de negocio.
- `globals.css` define el contrato base del engine.
- `storage/styles/tokens.css` debe ganar la marca del fork.
- `layout_tokens.css` debe quedar como capa de layout, no como segunda fuente de marca.
- La clase `.theme-veta_de_oro` en `globals.css` es una excepcion temporal que hoy compite con el canon.

## Estilos ad-hoc detectados

No se encontraron bloques `style jsx global` en la superficie escaneada. Lo que si aparece son estilos inline, literales de color y overrides directos.
Ademas, la auditoria del Orquestador marco un hueco fuera de la superficie que ya se debe considerar en el checklist: `src/components/specialized/finanzas/FinanzasShell.tsx:473` contiene un bloque `<style jsx global>` con ad-hoc de color, sombra y radio.

### Casos fuera de tokens

| Archivo:linea | Hallazgo | Token destino recomendado |
|---|---|---|
| `src/app/globals.css:251-259` | `.theme-veta_de_oro` usa `#8b6f3c`, `white`, `rgba(166, 140, 89, 0.35)`, `rgba(139, 111, 60, 0.2)` y `#a68c59` como valores sueltos. | Familia de tema: `--veta-theme-gold-bg`, `--veta-theme-gold-fg`, `--veta-theme-gold-border`, `--veta-theme-gold-shadow`, `--veta-theme-gold-bg-hover`. |
| `src/components/specialized/Chart.tsx:30-31` | `rgba(255, 184, 0, 0.6)` y `rgba(255, 184, 0, 1)` en el dataset de Chart.js. | Familia chart: `--chart-series-accent` y `--chart-series-accent-border`, idealmente derivadas de `--sat-accent` o `--veta-gold-muted` segun el contexto. |
| `src/components/specialized/DataBrowser.tsx:658-667` | `style={{ tableLayout: 'auto', minWidth: '100%' }}` y anchos inline `36`, `160`, `40` en la tabla. | Familia table: `--data-browser-table-min-width`, `--data-browser-col-checkbox-width`, `--data-browser-col-default-width`, `--data-browser-col-actions-width`. |
| `src/components/specialized/calendar-scheduler/CalendarScheduler.tsx:248` | `style={schedulerTheme}` sobre la raiz del calendario. | Ya esta tokenizado por puente (`--calendar-*` -> `--sat-*`). No requiere migracion de valor; solo mantenerlo como adaptador local. |
| `src/components/specialized/calendar-scheduler/views/TimeGridView.tsx:23,32` | `gridTemplateColumns: \`72px repeat(${days.length}, minmax(0, 1fr))\`` en dos contenedores. | Familia calendario: `--calendar-time-rail-width` y, si se quiere canonizar, `--calendar-grid-template`. |
| `src/components/specialized/calendar-scheduler/views/TimeGridView.tsx:62-68` | Posicionamiento inline por evento (`top`, `height`, `left`, `width`). | Mantenerlo local: es geometria derivada de datos, no marca. Solo el cromado visual del evento debe quedar tokenizado. |
| `src/components/specialized/Viewer3DModal.tsx:36` | `0x8b6914` en el material del cubo 3D. | Familia escena/material: `--veta-material-wood` o `--scene-material-wood`, para no dejar el tono en hexadecimal suelto. |

### Familia Veta: literales repetidos que ya piden token

| Archivo:linea | Hallazgo | Token destino recomendado |
|---|---|---|
| `src/components/specialized/VetaCatalog.tsx:98,119,196,285` | `text-[#0A0A0A]` repetido en CTA y superficies doradas. | `--veta-ink-strong` o `--veta-on-gold`. |
| `src/components/specialized/VetaFooter.tsx:121` | `text-[#0A0A0A]` en CTA principal. | `--veta-ink-strong` o `--veta-on-gold`. |
| `src/components/specialized/VetaHeader.tsx:73,121` | `text-[#0A0A0A]` en CTA del header. | `--veta-ink-strong` o `--veta-on-gold`. |
| `src/components/specialized/VetaHome.tsx:78,162,290` | `text-[#0A0A0A]` en CTA principales. | `--veta-ink-strong` o `--veta-on-gold`. |
| `src/components/specialized/VetaFooter.tsx:53,63,73` | `bg-white/70` en botones circulares de redes/contacto. | `--veta-surface-lifted` o `--veta-glass-light-bg`. |
| `src/components/specialized/VetaAgendar.tsx:20` | `bg-white/70` en la pill superior. | `--veta-surface-lifted` o `--veta-glass-light-bg`. |
| `src/components/specialized/VetaCatalog.tsx:99` | `hover:bg-white/60` en tabs. | `--veta-surface-hover-soft`. |
| `src/components/specialized/VetaHeader.tsx:91` | `bg-[rgba(252,251,249,0.94)]` en el panel mobile. | `--veta-navbar-light-bg`. |
| `src/components/specialized/VetaHome.tsx:119` | `border-white/10` en la barra sticky. | `--veta-glass-light-border` o `--veta-divider-on-dark`. |
| `src/components/specialized/VetaHome.tsx:129` | `text-white/50` y `hover:text-white/85` en tabs activas/inactivas. | `--veta-text-muted-on-dark` y `--veta-text-strong-on-dark`. |
| `src/components/specialized/VetaHome.tsx:134` | `shadow-[0_0_10px_rgba(212,197,161,0.85)]` en underline activa. | `--veta-tab-underline-glow`. |
| `src/components/specialized/VetaHome.tsx:192` | `bg-white/60` en chips de tags. | `--veta-chip-bg-soft`. |
| `src/components/specialized/VetaHome.tsx:234,250` | `bg-white/15` y `bg-white/10` en medallones numericos. | `--veta-surface-overlay-15` y `--veta-surface-overlay-10`. |

## Jerarquia propuesta

### 1. Primitivos

Son valores basicos, sin semantica de componente.

- Colores base del engine: `--background`, `--foreground`, `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--radius`.
- Paleta de fork: `--veta-bg-*`, `--veta-text-*`, `--veta-gold-*`, `--veta-border-thin`, `--veta-glass-light-*`, `--veta-blur-*`, `--veta-saturate`, `--veta-space-*`.

### 2. Semanticos

Son aliases de uso transversal que dicen para que sirve el valor.

- `--sat-*` para el contrato visual base del shell.
- `--ag-*` para la ergonomia agnostica del engine.
- `--layout-*` para coordenadas y contenedores de HUD.
- `--calendar-*` para el calendario y su puente con `--sat-*`.

### 3. Componente

Son tokens de superficie o modulo. Deben ser estables dentro del componente, pero no necesariamente globales al fork.

- `--veta-surface-*`
- `--veta-chip-*`
- `--veta-theme-*`
- `--data-browser-*`
- `--chart-*`
- `--calendar-*` cuando la semantica ya no sea suficiente
- `--scene-*` o `--material-*` para 3D / canvas

## Regla de override

### Puede vivir local

- Geometria derivada de datos: `top`, `height`, `left`, `width`, `gridTemplateColumns` cuando depende del numero de columnas o del layout dinamico.
- Adaptadores de terceros: Chart.js, Three.js, calendarios y tablas externas, siempre que los valores visuales salgan de tokens y no de literales repetidos.
- Una excepcion de modulo que no se reutiliza fuera de una sola superficie y no toca color, tipografia, radio, sombra o espaciado de marca.

### Debe subir a tokens

- Cualquier color literal, hex, rgba, hsla, named color o variante Tailwind con color hardcoded.
- Tipografia, radios, sombras, borders, blur, saturacion y espaciados que ya aparecen en mas de un archivo.
- Cualquier valor con `!important` que intenta ganar una guerra de cascada; eso es una señal de que falta un token canonico.
- Cualquier override que mezcle identidad de marca con comportamiento de componente.

### Criterio de escalamiento

Si un valor visual:

1. se repite,
2. expresa marca,
3. o se necesita en otra lane,

entonces deja de ser local y sube a token.

## Politica para modulos luxury / especiales

Los modulos luxury pueden tener personalidad propia, pero no una constitucion distinta.

- Deben vivir dentro del namespace del fork, por ejemplo `--veta-*`.
- Deben derivar de los semanticos canonicos en vez de reescribirlos.
- Pueden crear superficies exclusivas como glass, stone, matte o sheen, pero esas superficies deben nacer de tokens, no de literales dispersos.
- Si una decision de lujo se reutiliza en otra pantalla, se promueve a token semantico o de componente.
- Si un lujo necesita un contraste distinto, la solucion es una nueva capa de tokens, no un override inline.

## Checklist de migracion

Este checklist no ejecuta migracion en esta fase. Solo deja el mapa para las lanes dueñas.

| # | Estilo ad-hoc | Archivo:linea | Token destino |
|---|---|---|---|
| 1 | Tema dorado literal en `.theme-veta_de_oro` | `src/app/globals.css:251-259` | `--veta-theme-gold-*` |
| 2 | Dataset Chart.js con amber literal | `src/components/specialized/Chart.tsx:30-31` | `--chart-series-accent*` |
| 3 | Tabla con widths inline | `src/components/specialized/DataBrowser.tsx:658-667` | `--data-browser-table-*` |
| 4 | Puente de calendario ya tokenizado | `src/components/specialized/calendar-scheduler/CalendarScheduler.tsx:248` | Ninguno: conservar como adaptador |
| 5 | Rail de tiempo fijo del calendario | `src/components/specialized/calendar-scheduler/views/TimeGridView.tsx:23,32` | `--calendar-time-rail-width` |
| 6 | Posicionamiento por evento | `src/components/specialized/calendar-scheduler/views/TimeGridView.tsx:62-68` | Ninguno: geometria dinamica local |
| 7 | Material 3D con color literal | `src/components/specialized/Viewer3DModal.tsx:36` | `--scene-material-wood` |
| 8 | CTA / copy sobre negro puro | `src/components/specialized/VetaCatalog.tsx:98,119,196,285` | `--veta-ink-strong` |
| 9 | CTA / copy sobre negro puro | `src/components/specialized/VetaFooter.tsx:121` | `--veta-ink-strong` |
| 10 | CTA / copy sobre negro puro | `src/components/specialized/VetaHeader.tsx:73,121` | `--veta-ink-strong` |
| 11 | CTA / copy sobre negro puro | `src/components/specialized/VetaHome.tsx:78,162,290` | `--veta-ink-strong` |
| 12 | Superficies blancas semitransparentes | `src/components/specialized/VetaFooter.tsx:53,63,73; VetaAgendar.tsx:20` | `--veta-glass-light-bg` |
| 13 | Hover blanco suave | `src/components/specialized/VetaCatalog.tsx:99` | `--veta-surface-hover-soft` |
| 14 | Panel mobile blanco opaco | `src/components/specialized/VetaHeader.tsx:91` | `--veta-navbar-light-bg` |
| 15 | Bordes / sombras de tab activo | `src/components/specialized/VetaHome.tsx:119,134` | `--veta-divider-on-dark`, `--veta-tab-underline-glow` |
| 16 | Chips y medallones translucidos | `src/components/specialized/VetaHome.tsx:192,234,250` | `--veta-chip-bg-soft`, `--veta-surface-overlay-15`, `--veta-surface-overlay-10` |
| 17 | Bloque `style jsx global` de FinanzasShell con color/sombra/radio literales | `src/components/specialized/finanzas/FinanzasShell.tsx:473` | `--finanzas-shell-surface-*`, `--finanzas-shell-shadow-*`, `--finanzas-shell-radius-*` |

## Criterio de cierre de fase

- Solo este archivo nuevo debe cambiar en Fase 1.
- No se migra ningun componente de otra lane.
- El canon visual se preserva tal cual.
- La siguiente fase solo puede arrancar si el Orquestador aprueba este manual con `APROBAR TOKENS`.
