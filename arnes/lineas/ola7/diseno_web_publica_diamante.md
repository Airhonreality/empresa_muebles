# Diamante — Rediseño del paradigma visual de la web pública

**Fecha:** 2026-08-10 · **Estado:** planificación (Goal-Input-Output) — **NO EJECUTAR código ni componentes todavía, solo documentar el alcance** · **Origen:** auditoría de Javier, hallazgo D-01 (`backlog_auditoria_pantallas.md`)

Este documento define el **alcance** del diamante, no lo ejecuta. Sirve para que Javier lo revise/ajuste antes de que exista una metodología de pases (loop de iteraciones, tipo Diamante 4) o se lance cualquier sub-agente.

---

## 1. Goal (qué problema resuelve)

El sistema visual D4 (`app/globals.css`, `components/veta/*`) se diseñó para el **dashboard del ERP** — denso, funcional, orientado a operar datos (`Badge`, `Modal`, tablas, formularios). Las pantallas públicas de venta/marca (Portafolio F-03, Colecciones F-02, y las que sigan) se construyeron reutilizando ese mismo lenguaje porque era lo único que existía, produciendo un tono equivocado: carpintería arquitectónica a medida, alto valor, mostrada con la estética de un dashboard de inventario (badges de rating, grid de tarjetas con precio, sidebar de filtros).

El sitio real en producción (vetadeoro.co) ya tiene el tono correcto — editorial, fotografía dominante, tipografía con carácter, una historia por proyecto. **El goal es extraer ese lenguaje a tokens/componentes reutilizables**, no copiar el sitio actual pieza por pieza (que no pasó por ningún proceso de diseño documentado — es el resultado de trabajo previo sin arnés).

## 2. Inputs (qué existe hoy, contra qué se compara)

- **Referencia positiva (Javier, 2026-08-10):** captura de `vetadeoro.co/portafolio` — hero fotográfico dominante, tipografía serif cálida para títulos + sans limpia para cuerpo, metadata como ícono+texto (ubicación, fecha) en vez de badges, grid de fotos secundarias asimétrico (no cards uniformes), nav superior minimalista (3 ítems + contacto), paleta neutra cálida.
- **Estado actual del prototipo:** `app/(publico)/portafolio/page.tsx`, `app/(publico)/portafolio/[slug]/page.tsx`, `app/(publico)/colecciones/page.tsx`, `app/(publico)/colecciones/[id]/page.tsx`, `app/(publico)/propuesta/[proyectoId]/page.tsx` (F-08, mismo problema) — todos construidos reutilizando `Badge`, `Button` de `components/veta/` (sistema D4/ERP).
- **Tokens D4 existentes:** `app/globals.css` (única fuente de tokens hoy — colores, radios, tipografía `Fraunces` ya está declarada para display, revisar si alcanza o si el paradigma editorial necesita tokens propios).
- **Contrato de datos ya construido (no se toca):** `store.portafolio.publicados()`, `store.productosTienda.visibles()`, etc. — este diamante es de **capa visual**, no cambia `lib/data/`.

## 3. Outputs deseados (qué debe producir el diamante, antes de tocar código)

1. **Principios de diseño** del paradigma "editorial/premium" (análogo a los principios que gobernaron D4 para el ERP) — qué lo distingue del lenguaje de dashboard: jerarquía tipográfica, uso de fotografía, densidad de información, tono de copy.
2. **Tokens propios** (si hacen falta más allá de los de `app/globals.css`) — tipografía, espaciados generosos, paleta.
3. **Primitivas de componente nuevas** (ej. un `ProjectHero`, `PhotoGrid` asimétrico, metadata con ícono — reemplazos de `Badge`/card genérica para este contexto), sin romper las primitivas D4 que el ERP sigue necesitando.
4. **Layouts de referencia** para Portafolio (lista + detalle) y Colecciones (lista + detalle) que Iniciador pueda tomar y escribir como `disenio_PXX.md`/`disenio_FXX.md` actualizados.
5. **Alcance de la limpieza de nav público** (hallazgo D-03) — si el "ERP →" y el andamiaje PoC se resuelven acá o en el diamante de nav (a decidir).

## 4. Fuera de alcance (explícito)

- No migra datos ni toca `lib/data/`.
- No rediseña el ERP (eso es el otro diamante, `diseno_erp_navegacion_diamante.md`).
- No decide todavía la metodología de ejecución (pases con sub-agentes vs. Claude directo) — eso se define cuando Javier apruebe pasar de planificación a ejecución.

## 5. Pendiente de Javier

- Confirmar si este documento captura bien el alcance, o falta/sobra algo.
- Seguir aportando más pantallas/capturas de referencia mientras continúa la auditoría — cada una se suma a §2 (Inputs) de este documento, no abre un diamante nuevo salvo que sea un dominio distinto.

---

## 6. Resolución (2026-08-10) — tokens y primitivas ya construidos, listos para que Etapa 2 los aplique

**Hallazgo al revisar `app/globals.css`/`components/veta/badge.tsx`:** los tokens base **ya sirven** — `Fraunces` (serif editorial) para display, `Teachers` (sans limpia) para cuerpo, y una paleta cálida neutra (`paper`/`linen`/`stone`/`espresso`/`wood`/`gold`) ya declarada, nada de esto es "frío tipo dashboard". El problema nunca fue el token, fue el **componente**: `Badge` tiene un comentario propio del PoC 3.1 ("Dirección aprobada por el Supervisor: material → ERP, mist → web pública") que **F-02/F-03 ignoraron** — usaron `material` (o el default) en vez de `mist`, y encima usaron `Badge` para mostrar un rating "●4.8" que no debería existir en absoluto (no es un patrón editorial, es puro e-commerce). No hace falta un rediseño de fondo — hace falta dejar de usar los componentes equivocados.

**Principios de diseño (resueltos):**
1. Metadata de contexto (ubicación, fecha, categoría) → `MetaItem` (ícono + texto), **nunca** `Badge`.
2. Si un tag/estado sí amerita `Badge` en contexto público (poco frecuente), usar `variant="mist"`, nunca `material`.
3. Ningún rating/score inventado — Veta de Oro no es un marketplace, no hay "calificación" de un mueble a medida.
4. Imagen como protagonista: hero fotográfico grande antes que texto, texto en medida de lectura angosta (no ancho completo).
5. Grid asimétrico para fotos secundarias, no cards uniformes en fila.

**Primitivas nuevas, ya construidas** (`components/veta/`):
- `meta-item.tsx` — `<MetaItem icon={MapPin}>Cota, Cundinamarca</MetaItem>` (usa `lucide-react`, ya es dependencia del proyecto).
- `photo-grid.tsx` — grid asimétrico (1 foto principal a 2 filas + 2 secundarias apiladas), mismo patrón que la referencia de vetadeoro.co.

**Layouts de referencia** (para que la Etapa 2 los aplique en Portafolio/Colecciones/F-08):
- **Detalle** (Portafolio `[slug]`, Colecciones `[id]`): título `font-display` grande arriba del fold, fila de `MetaItem`s debajo (ubicación/fecha/categoría según la entidad), imagen principal ancha, `PhotoGrid` de fotos secundarias, cuerpo de copy en columna angosta (`max-w-prose` o similar), sin `Badge` de precio como protagonista — el precio referencial es texto simple, no una pill de color.
- **Lista** (Portafolio, Colecciones): grid de tarjetas más espaciado que el actual (menos denso), cada tarjeta con imagen dominante + título + 1-2 `MetaItem`, sin badge de rating, sin sidebar de filtros pesado (un filtro simple por categoría, si acaso).
- **F-08 (propuesta pública):** mismo tratamiento — reemplazar cualquier `Badge` de estado por texto simple o `MetaItem`.

**Resolución del hallazgo D-03 (nav público):** se resuelve **acá**, no en el diamante de Nav ERP — el nav público (`app-shell.tsx`) es parte de la misma superficie visual que este diamante ya toca. Ver `diseno_erp_navegacion_diamante.md` §1 para la lista exacta de qué sale del nav público.

---

## 7. Addendum — Ampliación de estilemas Nav Bar (Ronda 2, 2026-08-10)

**Contexto de actualización:** el Nav Bar público definido en D4 (`components/veta/app-shell.tsx`) necesita **refinamiento de sombras, elevación visual y efectos de hover** para mantener coherencia con el paradigma editorial que este diamante especifica (§6 resuelto). Hoy el nav es funcional pero funciona (minimalista), sin la **presencia visual de confianza** que un elemento recurrente (navegación principal) requiere en una marca de carpintería arquitectónica premium.

**Restricción:** Este addendum **documenta tokens y propuestas; NO edita código.** El agente Código recibe estos requisitos para instalar en `app/globals.css` y `components/veta/nav-item.tsx`.

### 7.1 — Doble Diamante: Diverger + Converger (Ligero — base ejecutada ya existe)

**Insight:** El D4 original (`diamante4_metodologia.md`) diseñó el nav como "3 ítems + contacto" con tokens neutrales. Hoy, ese nav se renderea sin **profundidad visual** que comunique "esto es premium, no e-commerce". Comparación:

| Aspecto | D4 Original | Propuesta Ronda 2 |
|---|---|---|
| Sombra | Ninguna (flat) | Sombra suave elevada `--shadow-nav-elevated` |
| Hover state | Color texto change | Color + sombra intensificada + border-bottom gold |
| Separador visual | Línea gris pálida | Gradiente sutil oro-a-transparente bajo nav |
| Transiciones | Instantáneas | 200ms ease-out (suave premium) |
| Contexto | Dashboard ERP (denso) | Editorial web (espaciado generoso) |

**Decisión (Converger):** ampliar tokens D4 sin romper la paleta existente — agregar 2-3 tokens de sombra y transición que refinan elegancia sin cambiar identidad visual.

### 7.2 — Tokens CSS nuevos / extendidos

**Tokens a instalar en `app/globals.css` bajo `@theme`:**

| Token ID | Nombre | Valor propuesto | Uso | Justificación |
|---|---|---|---|---|
| SH-NAV-1 | `--shadow-nav-elevated` | `0 4px 12px rgba(43, 43, 43, 0.06)` | Sombra suave bajo el nav, comunica elevación | Madera + luz: sombra cálida, no azulada; bajo contraste (0.06 = sutil) |
| SH-NAV-2 | `--shadow-nav-hover` | `0 8px 20px rgba(43, 43, 43, 0.12)` | Sombra intensificada al hover de nav-item | Refuerza interactividad premium sin jarring |
| TRN-1 | `--transition-nav-smooth` | `all 200ms cubic-bezier(0.4, 0, 0.2, 1)` | Transición suave de todos los cambios en nav | Easing `material-standard`: entrada lenta, salida rápida (premium feel) |
| BD-NAV-1 | `--border-nav-underline-gradient` | `linear-gradient(90deg, #8B6914 0%, transparent 100%)` | Gradiente oro-a-transparente para border-bottom en hover | Comunica identidad dorada de Veta sin ser literal |

**Tokens semánticos a reasingnar/extender:**

| Token existente | Ampliación propuesta | Cambio |
|---|---|---|
| `--color-brand` | Usar también en nav-item hover border-bottom | Ya existe (#8B6914) |
| `--color-text-primary` | Nav item texto default | Ya existe (#2B2B2B), no cambiar |
| `--spacing-4` | Padding interno nav-item | Ya existe (1rem), OK |

### 7.3 — Cambios en componente Nav (`components/veta/nav-item.tsx`)

**Props/Estructura (NO editar, solo documentar para Código):**

```tsx
// Comportamiento esperado después de instalar tokens:
<NavItem
  label="Portafolio"
  href="/portafolio"
  isActive={pathname === '/portafolio'}
  // Nuevo: style aplicado automáticamente via CSS variables
  // className="nav-item" // CSS maneja sombra + hover via variables
/>

// CSS esperado (refactoriza actual):
.nav-item {
  /* Existente */
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  
  /* Nuevo */
  position: relative;
  transition: var(--transition-nav-smooth);
  border-bottom: 2px solid transparent;
}

.nav-item:hover {
  /* Nuevo */
  box-shadow: var(--shadow-nav-hover);
  border-bottom-color: var(--color-brand);
  border-bottom-image: url('data:image/svg+xml,...') /* o usar gradiente CSS nativo */;
}

.nav-item[data-active="true"] {
  /* Existente: active state */
  color: var(--color-brand);
  /* Nuevo: keep elevation */
  box-shadow: var(--shadow-nav-elevated);
}
```

### 7.4 — Cambios en contenedor Nav (`components/veta/app-shell.tsx`)

**Propuesta: Nav container recibe sombra base elevada permanente:**

```tsx
<nav className="nav-container">
  {/* Nuevo: sombra permanente comunica elevación */}
  {/* Existente: flex, gap, responsive */}
</nav>

// CSS:
.nav-container {
  /* Existente */
  display: flex;
  gap: var(--spacing-5);
  background-color: var(--color-bg-raised);
  
  /* Nuevo */
  box-shadow: var(--shadow-nav-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
  /* Gradiente decorativo bajo nav (opcional, A/B test con Supervisor) */
  /* background-image: linear-gradient(to right, transparent, var(--color-gold-100), transparent); */
}
```

### 7.5 — Comportamiento interactivo esperado

| # | Estado | Transición | Duración | Visual result |
|---|---|---|---|---|
| 1 | Default (no hover, no active) | — | — | Texto gris, sombra suave base |
| 2 | Hover on nav-item | opacity/color/shadow simultáneo | 200ms ease-out | Texto dorado, sombra intensificada, border-bottom gold gradiente |
| 3 | Active (ruta actual) | color + shadow | (instant en page load) | Texto dorado, sombra base permanente |
| 4 | Salir de hover | Reverso suave | 200ms ease-out | Vuelve a default/active visual |

### 7.6 — Verificación de integridad (pre-entrega para agente Código)

**Checklist antes de implementar:**

- [ ] Confirmar con Supervisor: ¿se agrega sombra permanente al nav-container, o solo en hover?
- [ ] A/B test opcional: ¿gradiente decorativo oro bajo nav, o solo border-bottom en items?
- [ ] Validar contraste: `--shadow-nav-hover` (0.12 alpha) no reduce legibilidad de nav en fondo blanco.
- [ ] Instalar tokens en `app/globals.css` bajo `@theme { ... }`.
- [ ] Refactorizar `nav-item.tsx` para usar `--transition-nav-smooth`.
- [ ] Test: Playwright — hover nav-item → visual shadow + border-bottom visible, transición suave ≤200ms.
- [ ] Test: keyboard nav — tab a nav-item → :focus-visible recibe mismos estilos que :hover (accessibility).
- [ ] No rompe responsive: nav-item spacing en mobile permanece compacto, sombra visible en todos los breakpoints.

### 7.7 — Referencias de diseño (externas, inspiración)

- **Norm Architects (normarchitects.com):** nav minimalista con elevación suave, hover dorado.
- **Architectural Digest (web):** nav con border-bottom animado en active state.
- **Kinfolk (magazine site):** transiciones suaves 200-300ms, uso generoso de espaciado en nav.

---

**Conclusión del addendum:** los tokens propuestos refuerzan la **presencia visual premium** del nav sin cambiar su identidad funcional. No requieren nuevos componentes — solo extensión de tokens D4 existentes y refinamiento de CSS. Agente Código recibe este documento + los tokens + las reglas de CSS esperadas para instalar.
