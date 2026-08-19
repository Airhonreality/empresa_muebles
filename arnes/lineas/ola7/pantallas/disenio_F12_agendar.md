# P-12 — Agenda tu Asesoría

**Fecha:** 2026-08-19 · **Estado:** propuesto · **Fase:** F-12 · **Ruta:** `/agenda-tu-asesoria` · **Roles:** [Público]

---

## 1. Entidades que consume

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `parametros` | §6 Finanzas | `clave`, `valorNumeric` | Consultar tarifa `precio_asesoria_3d` |

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| Público | Clic en "Agendar (WhatsApp)" | Flujo externo (WhatsApp) | Conversión Marketing | UTMs y parámetros de GTM emitidos |

---

## 3. Vocabulario H07 (labels visibles)

*Cita textos exactos de `contenido_F12_agendar.md`.*

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Precio del 3D no puede estar hardcodeado | Leer de DB (`obtenerPrecioAsesoria3dAction()`) | Inspección de código: no debe existir "130000" en `page.tsx` |
| R2 | Fallback de precio si el parámetro es null | Mostrar "Pendiente de tarifa" | Validar retorno de Action `null` |
| R3 | Incluye anidación de F-16 (Cobertura) | Componente `CoberturaSection` | Visible en pantalla |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `PricingTier` | Server | `title, price, features, isFeatured` | N/A | Cards con hover, `--color-accent` |
| `WhatsAppModal` | Client | `tier, gclidHandler` | N/A | Modal D4 |
| `CoberturaSection` | Server | N/A | N/A | Grid map (Bogotá/Sabana Norte) |

**Patrones M-06 L1 usados:** `force-dynamic` en layout/page.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `obtenerPrecioAsesoria3dAction()` | — | — |
| 2 | Clic Agendar | Botón CTA | Emite GTM event / abre WApp | Captura de Lead | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | Uso estricto de Server Actions seguras | `grep "obtenerPrecioAsesoria3dAction" app/...` |
| CA-3 | Muestra precio dinámico o fallback | Renderizado manual en preview |
