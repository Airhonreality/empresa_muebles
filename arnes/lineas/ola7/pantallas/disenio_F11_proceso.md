# P-11 — Cómo Trabajamos (Proceso)

**Fecha:** 2026-08-19 · **Estado:** propuesto · **Fase:** F-11 · **Ruta:** `/como-trabajamos` · **Roles:** [Público]

---

## 1. Entidades que consume

*Esta es una página estática (puramente de contenido) dentro de la Línea de Demanda. No lee del backend del ERP.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| N/A | — | — | Contenido literal desde `contenido_F11_proceso.md` |

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| Público | Clic en CTA "Agenda tu Asesoría" | Ruta `/agenda-tu-asesoria` | Navegación local | — |

---

## 3. Vocabulario H07 (labels visibles)

*Los labels y textos provienen enteramente del copy aprobado en `contenido_F11_proceso.md`.*

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Renderizado estático permitido, o `force-dynamic` para homogeneidad en el stack público. | Revisar `page.tsx` | No debe generar fallos en el build |
| R2 | Inyección de SEO JSON-LD `HowTo` o `WebPage`. | Componente de metadata | Etiqueta `<script type="application/ld+json">` en el DOM |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `PageHeader` | Server | `title, subtitle` | N/A | `--color-primary`, `Fraunces` |
| `ProcessTimeline` | Server | `steps: Array<{title, desc, duration}>` | N/A | `--radius-md`, Tipografía Inter |
| `CTABanner` | Server | `href, label` | N/A | Botón Primary (oro/negro) |

**Patrones M-06 L1 usados:** Layouts base del Diamante 4.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | Render estático RSC | — | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores | `eslint app/(publico)/como-trabajamos/` |
| CA-3 | Página responde 200 OK | `curl -I http://localhost:3000/como-trabajamos` |
| CA-4 | Textos idénticos al copy aprobado | Revisión manual vs `contenido_F11_proceso.md` |
