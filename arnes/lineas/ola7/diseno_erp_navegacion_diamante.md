# Diamante — Rediseño de navegación del ERP + limpieza de nomenclatura

**Fecha:** 2026-08-10 · **Estado:** planificación (Goal-Input-Output) — **NO EJECUTAR código todavía, solo documentar el alcance** · **Origen:** auditoría de Javier, hallazgo D-02/D-03 (`backlog_auditoria_pantallas.md`)

Este documento define el **alcance** del diamante, no lo ejecuta.

---

## 1. Goal (qué problema resuelve)

`ERP_NAV` (`components/veta/erp-shell.tsx`) creció orgánicamente lote tras lote (B1→B2→F5/F6→F4/F7) sin que nadie replanteara el patrón: hoy son **14 ítems en una sola fila horizontal** (Comercial, Cotizador, Gates, Equipo, Finanzas, Caja, Obligaciones, Cuentas de cobro, Taller, Garantía, Catálogo, Compras, Herramientas, Pedidos web), y va a seguir creciendo (P-24/26 ya construidos no están ahí como sub-ítems, Lote C del kanban todavía falta, etc.). Además hay jerga de desarrollo visible al usuario final: badge "PROTOTIPO", footer "· Prototipo B1 · Mock Data", y en el nav público (`AppShell`) descripciones como "Hub PoC"/"PoC D4" y un link directo a `/erp/comercial` (hallazgo D-03, mezcla público/backstage).

**Goal:** un patrón de navegación que escale a 20+ módulos sin volverse ilegible, y una pasada de nomenclatura que deje en la UI solo lenguaje que el usuario final (comercial, gerente, taller, cliente) reconozca — cero referencias a fases de desarrollo, códigos de pantalla (`P-XX`) o nombres de proceso interno del arnés.

## 2. Inputs (qué existe hoy)

- **`components/veta/erp-shell.tsx`** — nav plano, 14 ítems, sin agrupación por dominio (comercial/producción/finanzas/compras están todos al mismo nivel).
- **`components/veta/app-shell.tsx`** — nav público con andamiaje de PoC mezclado con ítems reales (hallazgo D-03) — el link "ERP →" es el caso más grave, pero toda la columna `desc` ("Hub PoC", "PoC D4", "Prototipo B1") **se renderiza literal en pantalla** (`nav-item.tsx:26`, visible desde `sm:` en adelante) — confirmado, no es metadata interna.
- **Agrupación natural que ya existe implícitamente** (por fase/dominio de negocio, ver `plan_ola7_maestro.md`): Comercial (F2), Cronograma/Gates (F3), Compras (F4), Taller/Calidad/Instalación/Entrega/Garantía (F5), Finanzas (F6), Catálogo (P-27) — son ~6 dominios agrupando los 14 ítems actuales.
- **Primitivas D4 disponibles:** `Button`, sin un componente de sidebar/rail todavía (sería primitiva nueva).

## 3. Outputs deseados

1. **Patrón de navegación** — sidebar con íconos vs. otra alternativa (mega-menú agrupado, nav colapsable) — a decidir con criterios de uso real (¿el comercial necesita ver Compras seguido? ¿el taller necesita ver Finanzas?), no solo estética. Posible variante: nav por rol (cada usuario ve solo sus módulos), a validar si el modelo de roles actual (`store.auth.usuarioActual().rol`) ya soporta esa segmentación sin tocar `lib/data/`.
2. **Agrupación de los 14+ ítems actuales** en dominios/secciones coherentes.
3. **Glosario de limpieza de nomenclatura** — tabla explícita de qué string visible hoy se reemplaza por cuál (ej. "Prototipo B1 · Mock Data" → qué, si algo; el badge "PROTOTIPO" → ¿se queda como indicador honesto de que es F10 mock, o se remueve?). Esto lo decide Javier, no es una limpieza automática — puede haber valor en mantener alguna señal de que es un prototipo mientras dure F10.
4. **Resolución de D-03** — qué pasa con el nav público: ¿se elimina el link a ERP directamente, se dejan solo Landing/Colecciones/Portafolio/Mi cuenta, y el acceso al ERP queda fuera del nav público por completo (una URL que el equipo interno conoce, no un link visible)?
5. **Primitiva nueva `Sidebar`/`NavRail`** en `components/veta/` si el patrón elegido la requiere, con tokens D4 (no reinventa el sistema visual, lo extiende).

## 4. Fuera de alcance (explícito)

- No cambia el sistema de roles/permisos (`lib/data/`) — si el nav termina siendo por rol, primero se confirma que el dato ya alcanza.
- No rediseña las pantallas públicas (eso es `diseno_web_publica_diamante.md`) — salvo la resolución puntual de D-03 si Javier decide que va acá.

## 5. Pendiente de Javier

- Confirmar patrón preferido (sidebar vs. otra alternativa) o pedir que se investiguen 2-3 opciones antes de decidir.
- Decidir si el badge "PROTOTIPO"/mención a mock data se mantiene como señal honesta durante F10 o se retira.
- Seguir aportando más hallazgos de nomenclatura mientras continúa la auditoría.

---

## 6. Resolución (2026-08-10)

**Patrón:** sidebar vertical fijo a la izquierda, con ícono + label, agrupado por dominio con encabezados de sección (no un mega-menú, no nav por rol — nav por rol queda fuera de alcance, no se toca `lib/data/` para esto). Colapsable a solo-íconos (con tooltip) en pantallas angostas, expandido por defecto en desktop — mismo `Button` primitivo de D4 para cada ítem, nuevo componente `components/veta/erp-sidebar.tsx` que reemplaza el nav horizontal de `erp-shell.tsx` (no toca `app-shell.tsx`, es exclusivo del ERP).

**Agrupación de los 14 ítems actuales + los que falten:**
| Sección | Ítems |
|---|---|
| — (sin sección, siempre arriba) | Comercial |
| Producción | Cotizador, Gates, Taller, Compras, Herramientas |
| Finanzas | Finanzas (parámetros), Caja, Obligaciones, Cuentas de cobro |
| Catálogo y tienda | Catálogo, Pedidos web |
| Equipo | Equipo, Garantía |

(Agrupación de trabajo — el sub-agente que ejecute puede ajustar 1-2 ítems de sección si encuentra una agrupación más natural, siempre que las 5 secciones y sus objetivos se mantengan.)

**Glosario de limpieza (string visible hoy → string nuevo):**
| Hoy | Nuevo | Razón |
|---|---|---|
| Badge "PROTOTIPO" | Se mantiene tal cual | Señal honesta de que F10 es mock — no es jerga de desarrollo, es información real para quien usa el sistema. |
| Footer "ERP Hermanos García González S.A.S. · Prototipo B1 · Mock Data" | "ERP Hermanos García González S.A.S. · Datos de prueba" | "Prototipo B1" es jerga de fase interna sin significado para el usuario; "Mock Data" es inglés técnico. "Datos de prueba" comunica lo mismo en el idioma del usuario. |

**D-03 (nav público) NO se resuelve en este diamante** — ya está resuelto en `diseno_web_publica_diamante.md` §6, porque el nav público vive en `app-shell.tsx`, fuera del alcance de este documento (que es exclusivamente `erp-shell.tsx`).
