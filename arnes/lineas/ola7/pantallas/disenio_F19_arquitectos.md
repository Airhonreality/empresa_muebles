# P-19 — Para Arquitectos (B2B)

**Fecha:** 2026-08-19 · **Estado:** propuesto · **Fase:** F-19 · **Ruta:** `/para-arquitectos` · **Roles:** [Público]

---

## 1. Entidades que consume

*Página estática B2B.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| N/A | — | — | Contenido literal desde `contenido_F19_arquitectos.md` |

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| Público (B2B) | Clic en CTA B2B | WhatsApp B2B | Conversión B2B | Mensaje pre-llenado "Soy arquitecto..." |

---

## 3. Vocabulario H07 (labels visibles)
*Copy y encabezados extraídos desde `contenido_F19_arquitectos.md`.*

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Diferenciación del CTA normal | WhatsApp apunta con texto B2B | Código de `page.tsx` |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `B2BHero` | Server | `title, subtitle` | N/A | Dark theme invertido (`--color-text-inverse`) |
| `FeatureList` | Server | `features: string[]` | N/A | Listas con check icon |

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
