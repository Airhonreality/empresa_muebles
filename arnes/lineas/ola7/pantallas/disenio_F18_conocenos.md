# P-18 — Conócenos

**Fecha:** 2026-08-19 · **Estado:** propuesto · **Fase:** F-18 · **Ruta:** `/conocenos` · **Roles:** [Público]

---

## 1. Entidades que consume

*Página estática basada en la D-matriz aprobada.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| N/A | — | — | Contenido literal desde `contenido_F18_conocenos.md` |

---

## 2. Estados que transiciona
N/A

---

## 3. Vocabulario H07 (labels visibles)
*Copy y encabezados extraídos desde `contenido_F18_conocenos.md`.*

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Uso estricto de imágenes existentes | `/public/images/home/` | No incluir rutas ficticias de imágenes |
| R2 | Inyección SEO JSON-LD `AboutPage` | Componente Metadata | `<script type="application/ld+json">` con schema org |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `StorySection` | Server | `title, content` | N/A | Tipografía Fraunces, `--color-bg-base` |
| `ProfileCard` | Server | `name, role, description` | N/A | Cards minimalistas, `--radius-md` |

**Patrones M-06 L1 usados:** Layouts base del Diamante 4.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect |
|---|---|---|---|---|
| 1 | Cargar pantalla | RSC mount | Render estático | — |

---

## 7. Criterios de aceptación
- `npx tsc --noEmit` = 0 errores
- `npx eslint` = 0 errores
