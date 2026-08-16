# F-00 — Shell Global público (Header + Footer + WhatsApp flotante)

**Fecha:** 2026-08-15 · **Estado:** ejecutado (parcial) 2026-08-15 · **Fase:** F7 · **Ruta:** transversal (`components/veta/app-shell.tsx`, todas las páginas de `app/(publico)/`) · **Roles:** público

**Ejecutado:** footer de 4 columnas (marca+eslogan, NAP, enlaces, legal+copyright) y botón de WhatsApp flotante transversal, en `components/veta/app-shell.tsx` + `components/veta/whatsapp-float.tsx` (nuevo). Copy tomado literal de `arnes/lineas/demanda/contenido/contenido_F00_shell.md` §3.2/§3.4 (aprobado por el Supervisor 2026-08-09) — sin fabricar texto nuevo. Cierra el gap **DP-04** (`arnes/TAREAS_DIFERIDAS.md`).

**No ejecutado en esta pasada (ver §5):** CTA "Agenda tu Asesoría" en el header, modal transversal DC-3, y los 4 ítems de nav que dependen de páginas que todavía no existen (Espacios F-10, Cómo Trabajamos F-11, Conócenos F-18, Para Arquitectos F-19).

---

## 1. Entidades que consume

*Sin entidades de `lib/data/` — el shell es contenido estático (copy aprobado), no datos del store.*

---

## 2. Estados que transiciona

*No aplica — sin estados transicionales. El único estado de UI es el tooltip del botón de WhatsApp (visible/oculto, client-side, no persiste).*

---

## 3. Vocabulario H07 (labels visibles)

| Label natural | Fuente |
|---|---|
| "Colecciones" / "Portafolio" / "Bitácora" / "Mi cuenta" (nav + footer) | `contenido_F00_shell.md` §3.1 (subconjunto — ver §5) |
| "Inicio" (solo footer) | `contenido_F00_shell.md` §3.1 |
| "Contáctanos" | `contenido_F00_shell.md` §3.4, Col 2 |
| "Cra. 72a #71A 57, Bogotá" / "+57 302 5922101" / "Lun–Sáb 08:00–18:00" | `contenido_F00_shell.md` §3.4 (NAP I-019) |
| "Enlaces" | `contenido_F00_shell.md` §3.4, Col 3 |
| "Veta Dorada es una marca comercial registrada. Facturación, contratos, recaudos y garantías operados por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9." | `contenido_F00_shell.md` §3.4, Col 4 |
| "© 2024–2026 Veta Dorada. Todos los derechos reservados." | `contenido_F00_shell.md` §3.4 |
| "¿Hablamos por WhatsApp?" (tooltip) | `contenido_F00_shell.md` §3.2 |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Ningún `<Link>`/`<a>` del shell apunta a una ruta que no exista | Manual: contra `app/(publico)/**/page.tsx` | Mismo criterio ya documentado en `app/(publico)/page.tsx:15` |
| R2 | Sin `<button>` (o componente que renderice `<button>`) anidado dentro de `<a>` | `NavItem`/`LinkButton` para nav; `WhatsappFloat` es un solo `<a>` | Mismo defecto que D-02/D-03 (`backlog_auditoria_pantallas.md`), verificado al no envolver `Button` en `Link` |
| R3 | NAP y razón social/NIT del footer coinciden exactamente con `contenido_F00_shell.md` §3.4 | Manual: diff de copy | — |
| R4 | Botón de WhatsApp visible en toda página bajo `app/(publico)/layout.tsx` | Montado en `AppShell` (no en páginas individuales) | Manual: navegar 2-3 rutas públicas y confirmar presencia |

---

## 5. Fuera de alcance de esta ejecución (y por qué)

| Pieza del spec (`contenido_F00_shell.md`) | Por qué no se construyó |
|---|---|
| Nav ampliado a 8 ítems + CTA "Agenda tu Asesoría" (§3.1) | 4 de los 8 destinos (F-10/F-11/F-18/F-19) no tienen página construida todavía; el CTA apunta a F-12, tampoco construida. Agregar el link hoy violaría R1. |
| Modal transversal DC-3, 2 pasos (§3.3) | Requiere persistir un lead — no existe dominio `leads`/`prospectos` en `lib/data/contracts.ts`. Tocar `lib/data/` es zona de riesgo alto (`AGENTS.md`) y necesita su propio plan/checkpoint, no es un fix visual. |
| Columna 2 — email de contacto | `contenido_F00_shell.md` lo marca "Pendiente verificación" — no se inventa. |

**Próxima acción permitida (si Javier la aprueba):** un diamante/plan separado para (a) las páginas F-10/F-11/F-18/F-19/F-12 y (b) el dominio `leads` + modal DC-3. Ninguna de las dos bloquea lo ya ejecutado acá.

---

## 6. Verificación de integridad (pre-entrega)

- [x] Todo el copy visible sale de `contenido_F00_shell.md`, sin texto inventado.
- [x] `tsc --noEmit` limpio.
- [x] `eslint .` limpio sobre los archivos tocados.
- [x] Sin `<Link>`/`<a>` a rutas inexistentes (R1).
- [x] Sin `<button>` anidado en `<a>` (R2).
- [ ] Pendiente: revisión visual manual (`npm run dev`) en `/`, `/colecciones`, `/portafolio`, `/bitacora`, `/cuenta` — no ejecutable en este entorno sin sesión interactiva de navegador.
