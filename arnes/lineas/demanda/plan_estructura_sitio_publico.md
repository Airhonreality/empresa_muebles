# Estructura del Sitio Público — Pantallas Numeradas (F-01 ampliado)

**Fecha:** 2026-08-08 · **Estado:** propuesta · **Tipo:** síntesis (no schema, no código) · **Riesgo:** bajo (es un documento; las decisiones que contiene sí son de riesgo alto)

**Regla de sucesión (C3, `diagnostico_de_proceso.md` §6):** este documento **no reemplaza** `plan_f7.md` ni los 4 `disenio_F0X.md` existentes (F-02 Tienda, F-03 Portafolio, F-07 Portal cliente, F-08 Propuesta pública) — esos siguen siendo la fuente de entidades/estados/componentes para el agente Código, sin cambios. Tampoco reemplaza `plan_demanda.md` — sigue siendo la fuente de estrategia de mercado (Bloques A-F, decisiones D1-D5).

**Por qué existe:** `plan_f7.md` trata **F-01 (Landing/Home Público)** como una fila de una línea (`Existente PoC 3`, sin artefacto). Pero `plan_demanda.md` Bloque C exige contenido y estructura concretos en al menos 6 tipos de página que hoy no tienen ningún `disenio_PXX.md`: home, 6 landings SEO, `/proceso`, `/espacios`, `/agendar` (embudo híbrido), testimonios. Este documento cierra ese hueco: convierte la prosa del Bloque C/D en un inventario numerado de pantallas con determinantes, requisitos y decisiones — el mismo tipo de insumo que `PLANTILLA_PANTALLA.md` exige, adaptado a pantallas de mercadeo (que no giran sobre transiciones de estado sino sobre contenido y conversión).

---

## 0. Verificación de partida (hechos, no supuestos)

| Afirmación en el arnés | Realidad verificada | Fuente |
|---|---|---|
| `estado.md`/`plan_f7.md`/`destilacion_f3_publico.md`: "F-01 Landing — ✅ Existente (PoC 3: `/landing`, `/`, `/proceso`, `/espacios`, 6 landings SEO)" | **Falso para V3.** `app/**/page.tsx` en este worktree solo tiene 5 rutas: `/`, `/cotizador`, `/cronograma`, `/landing`, `/badge-mockups` — todas demos de tokens D4 (t-098/t-099), sin `/proceso`, `/espacios` ni landings SEO. Las páginas reales (`/proceso`, `/espacios`, 6 landings, t-028..t-030) se construyeron en la línea `dev` vieja, ahora congelada en `backup/dev-v2-arquitectura-20260804` — descartada explícitamente por la transición a V3 (`estado.md`, "el prototipo v2 se descarta por completo"). | `Glob app/**/page.tsx` (este worktree) vs `estado.md` líneas 343-362 |
| `testimonios` — tabla en el canon | Existe en `REGISTRO_DE_ENTIDADES.md` §10 pero marcada **DIFERIDO** (ligada a E-55) | `REGISTRO_DE_ENTIDADES.md:171` |
| `plan_demanda.md` Bloque C exige testimonios ANTES del corte ("Testimonios: tabla + componente + Jose Talero como primer caso") | **Contradice directamente** el estado DIFERIDO de arriba | `plan_demanda.md:91` vs `REGISTRO_DE_ENTIDADES.md:171` → **Decisión clave DC-1** (§4) |
| `leads` — captura `gclid`, `utm_*`, etapa, fecha primer contacto | No están en el REGISTRO §3 actual; es exactamente lo que pide Bloque A (I-005, I-012) | `REGISTRO_DE_ENTIDADES.md:54` vs `plan_demanda.md:51-58` — ya trazado, solo se cita aquí |
| Numeración "F-03" | **Colisión sin resolver:** `glosario_h07.md:291` y `estado.md` (decisión D-04, 2026-08-04) usan F-03 para "Agendar visita"; `plan_f7.md`/checklist F2 (2026-08-05+) usan F-03 para "Portafolio". Es una verdad paralela exacta al patrón que `diagnostico_de_proceso.md` §3 describe. | No se corrige aquí (alcance de `plan_alineacion.md`) — este documento usa **solo** la numeración vigente (F-03 = Portafolio) y evita reutilizar F-03/04/05/06 para no sumar una tercera verdad |

**Conclusión de partida:** el sitio público de V3 está en blanco. Este documento no describe "lo que hay que arreglar" (eso era cierto del sitio legacy/Wix, insumo de `plan_demanda.md`) sino **lo que hay que construir desde cero**, usando los hallazgos del legacy como requisito de contenido, no como código a heredar (regla del `AGENTS.md`: "no reutilizar código del prototipo v2").

**Actualización 2026-08-08:** los hallazgos de este §0 (F-01 falso "existente", DC-2 colisión F-03) ya fueron corregidos en el arnés — ver `plan_alineacion.md` §8 (hallazgos G1-G3). El texto de esta sección se conserva como diagnóstico original (no se reescribe la historia); las referencias vivas ya citan el estado corregido.

---

## 1. Mapa completo de pantallas públicas

Namespace `F-XX` (frontstage). Se conservan F-02/03/07/08 tal cual están diseñadas. Los números **F-09 a F-13 son nuevos, asignados en este documento** — no colisionan con nada existente (F-04/05/06 quedan reservados/diferidos para checkout de tienda, fuera del alcance de Bloque C).

| # | Pantalla | Ruta | Estado real | Determinante (plan_demanda) | Artefacto técnico |
|---|---|---|---|---|---|
| **F-00** | Shell global (header, footer, WhatsApp flotante) | transversal a todas | Por diseñar | H6 NAP, H8 desfase canal (Bloque C, I-011/I-019/I-039) | Ninguno aún — §2.0 |
| **F-01** | Home / Landing principal | `/` | Por diseñar (stub en `plan_f7.md`) | Bloque C (embudo híbrido, WhatsApp, tokens D4) | Ninguno aún — §2.1 |
| **F-02** | Tienda Web | `/colecciones`, `/colecciones/[slug]` | Diseñado (propuesta) | Indirecto — no es foco de Bloque C | `disenio_F02_tienda_web.md` |
| **F-03** | Portafolio de Proyectos | `/portafolio`, `/portafolio/[slug]` | Diseñado (propuesta) | **Bloque D** (motor de contenido/SEO/prueba social) | `disenio_F03_portafolio_proyectos.md` |
| F-04/05/06 | Checkout tienda (reservado) | — | Diferido, fuera de alcance | No aplica a la línea de demanda | — |
| **F-07** | Portal del Cliente | `/cuenta/proyectos...` | Diseñado (propuesta) | No es sitio de captación — frontstage post-venta | `disenio_F07_portal_cliente.md` |
| **F-08** | Propuesta Pública | `/propuesta/{slug}` | Diseñado (propuesta), pausado hasta viewer 3D | No es foco de Bloque C | `disenio_F08_propuesta_publica.md` |
| **F-09** | Landings SEO por categoría (×6) | `/espacios/[categoria]` | Por diseñar | **Bloque C** — recuperar, no producir | Ninguno aún — §2.2 |
| **F-10** | Índice de Espacios | `/espacios` | Por diseñar | Bloque C (navegación hacia F-09) | Ninguno aún — §2.3 |
| **F-11** | Proceso | `/proceso` | Por diseñar | Bloque C (confianza, arquetipo Creador Experto) | Ninguno aún — §2.4 |
| **F-12** | Agendar (embudo híbrido) | `/agendar` | Por diseñar | **Bloque A + C** (I-042, I-011 — bloqueante del corte) | Ninguno aún — §2.5 |
| **F-13** | Testimonios | sección transversal + `/testimonios` opcional | Por diseñar, **bloqueado por DC-1** | Bloque C (H7, prueba social) | Ninguno aún — §2.6 |

**Cómo leer el embudo sobre este mapa** (Descubrimiento → Interés → Decisión → Acción, `plan_demanda.md` Bloque E):
`F-09/F-10` (descubrimiento, SEO) → `F-01/F-11` (interés) → `F-03/F-13` (decisión, prueba social) → `F-12` (acción, agenda) → `F-08` (post-lead, propuesta) → `F-07` (post-venta).

---

## 2. Detalle por pantalla nueva (F-00, F-01, F-09..F-13)

Formato adaptado de `PLANTILLA_PANTALLA.md` (estas pantallas no transicionan estados de negocio; el eje es contenido + conversión, no schema).

### 2.0 — F-00 Shell global

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| H6 (NAP incompleto a propósito, bloquea SEO local), H8 (cero enlaces a WhatsApp pese a que el flujo real es WhatsApp), I-019/I-039 (footer dice "Medellín", debe decir NAP real) | Footer con identidad legal completa (Veta Dorada / HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9, Cra. 72a #71A 57, 302 5922101); botón WhatsApp flotante (`https://wa.me/57…`) visible en **todas** las pantallas públicas, no solo F-12; header con nav D4 (AppShell ya construido en PoC 3, reutilizar); `jsonld.ts` con NAP completo | — |
| **Criterio de hecho (C2):** un usuario en cualquier pantalla pública puede abrir WhatsApp en un clic, y el footer muestra NIT/dirección/teléfono reales — no "documento con footer aprobado", sino el footer renderizado con esos datos. | | |

### 2.1 — F-01 Home / Landing principal

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| Bloque C completo: WhatsApp antes del merge (I-011, 🚨 bloqueante), embudo híbrido (I-042), tokens Luz & Biofilia (I-037/I-038), tema "no verde literal" | Hero con CTA dual (agendar + WhatsApp); sección de prueba social (cita F-13, bloqueada por DC-1); entrada a F-09/F-10; sección de proceso resumido (link a F-11); tokens D4 (`--font-sans` Inter, `--font-display` Fraunces, badges `mist`) | **D1** (eslogan, bloquea el header/hero) · **D2** (audiencia, bloquea el copy) |
| **Criterio de hecho:** la home renderiza con los tokens D4, tiene CTA de WhatsApp funcional, y el Lighthouse/analítica (Bloque A) registra el primer evento real de esa página — no "home aprobada en Figma". | | |

### 2.2 — F-09 Landings SEO por categoría (×6)

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| I-016/I-027 (imágenes rotas de las 6 landings — **recuperar, no producir**); geografía "la decide el portafolio real, no una apuesta a priori" (plan_demanda §1) | 6 rutas: `cavas-y-bares`, `centros-de-entretenimiento`, `closets-vestidores-bogota`, `cocinas-integrales-bogota`, `consolas-recibidores`, `estudios-home-office` (mismos slugs que el legacy — contenido a recuperar del inventario, no inventar); 1 componente compartido + 6 configs de contenido (patrón ya usado en la oleada de paridad v2, pero reconstruido en V3, no copiado); imágenes reales sin roturas; sin páginas locales artificiales (regla cerrada: "se gana Chicó habiendo hecho una cocina en Chicó") | **D5** (¿solo Bogotá? condiciona qué área de servicio declarar en cada landing) |
| **Criterio de hecho:** las 6 rutas responden 200, cada una con al menos 1 imagen real (no rota) y sin geografía inventada. | | |

### 2.3 — F-10 Índice de Espacios

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| Navegación hacia F-09; complementa el catálogo de F-02 sin duplicarlo (F-10 es editorial/categorías, F-02 es producto/precio) | Grid de 6 categorías → enlaza a F-09; sin precios (esa es función de F-02) | — |
| **Criterio de hecho:** cada tarjeta de categoría navega a su landing F-09 correspondiente. | | |

### 2.4 — F-11 Proceso

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| Arquetipo "el Creador Experto" (directo, elegante, sin jerga); antigüedad correcta (2014 en dato estructurado, 1995 en relato); H4 (la visita comercial ya ocurre y no deja dato — F-11 es donde se explica ese paso al cliente) | 4 pasos del proceso real (visita/diseño → cotización → producción → entrega), con antigüedad correcta y sin inventar certificaciones no verificadas | **D3** (precio del diseño 3D, si se menciona aquí como parte del proceso) |
| **Criterio de hecho:** la página no contradice las decisiones cerradas (antigüedad, identidad legal) — verificable por lectura, `grep "1995"` no debe aparecer como fecha de fundación estructurada. | | |

### 2.5 — F-12 Agendar (embudo híbrido)

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| **I-011 (🚨 bloqueante del corte):** WhatsApp conectado antes del merge — es el evento que entrena la puja de Ads; **I-042:** portar el embudo híbrido (modal de 2 pasos + redirección); Bloque A: captura de `gclid`/`utm_*` en el submit | Modal de 2 pasos (calificación rápida → datos de contacto) que además ofrece salida directa a WhatsApp; el submit debe persistir `gclid`/UTMs (depende de que Bloque A haya ampliado `leads` — checkpoint de schema ya identificado, no se repite aquí); conecta con `leads.canal` | Ninguna nueva — ejecuta I-011/I-042 tal cual están decididos |
| **Criterio de hecho:** un lead real entra con su `gclid` guardado (mismo criterio de cierre que Bloque A) — coincide, esta pantalla es donde ese criterio se observa. | | |

### 2.6 — F-13 Testimonios

| Determinantes | Requisitos | Decisión abierta |
|---|---|---|
| **H7:** la prueba social se perdió en la migración (existía `testimonios` en el legacy, no en el sitio); Bloque C: "Testimonios: tabla + componente + Jose Talero como primer caso" (I-008, I-050) | Sección embebida en F-01/F-03 (no necesita ruta propia) + tabla `testimonios` (ya existe en el canon §10, solo cambia su estado) + 1 testimonio real semilla (Jose Talero) | **DC-1** — ver §4, es la decisión que bloquea esta pantalla completa |
| **Criterio de hecho:** el testimonio de Jose Talero se renderiza en producción, no "tabla testimonios migrada". | | |

---

## 3. Pantallas ya diseñadas — qué les falta desde la óptica de demanda

`disenio_F02_tienda_web.md`, `disenio_F03_portafolio_proyectos.md`, `disenio_F08_propuesta_publica.md` fueron escritas desde la óptica de schema/componentes (correctas para eso). Ninguna menciona explícitamente WhatsApp, NAP ni el embudo híbrido — porque F-00 (este documento) no existía cuando se escribieron. No se editan esos archivos aquí (evita reabrir documentos ya aprobados sin checkpoint); se registra como adenda pendiente:

| Pantalla | Qué le falta (adenda para cuando se reabra con checkpoint) |
|---|---|
| F-02 Tienda Web | Botón WhatsApp/consulta en `ProductoDetalle` (hoy solo tiene "compartir") |
| F-03 Portafolio | Es el motor del Bloque D — cita `precio_referencial` (ya cubierto) pero no cita testimonio embebido por proyecto (depende de DC-1) |
| F-08 Propuesta pública | Sin cambios — no es una pantalla de captación, es post-venta |

---

## 4. Decisiones clave (consolidado D1-D5 + nuevas de este documento)

| ID | Decisión | Bloquea | Origen |
|---|---|---|---|
| D1 | Eslogan | F-01 (hero) | `plan_demanda.md` D1 |
| D2 | Audiencia (familias / estratos premium / arquitectos) | F-01, F-09, F-11 (tono/copy) | `plan_demanda.md` D2 |
| D3 | Precio del diseño 3D y alcance | F-11 (si se menciona en el proceso) | `plan_demanda.md` D3 |
| D5 | ¿Solo Bogotá o servicio remoto (Cajicá)? | F-09 (áreas de servicio por landing), F-10 | `plan_demanda.md` D5 |
| **DC-1** | `testimonios` está **DIFERIDO** en el REGISTRO (E-55) pero Bloque C lo pide **antes del corte**. ¿Se adelanta la tabla (cambio de estado en el canon, sin tocar schema — la tabla ya está especificada) o Bloque C lanza sin prueba social estructurada? | F-13 completa, sección de F-01/F-03 | Hallazgo de este documento (§0) |
| **DC-2** | ~~Numeración F-03 colisiona (Agendar vs. Portafolio)~~ **RESUELTO 2026-08-08.** Se asignó F-12 a "Agendar" (ya reflejado en la tabla §1 de este documento); corregido en `glosario_h07.md` (2 filas) y `estado.md` (D-04). Ver `plan_alineacion.md` §8 (hallazgo G3). | — cerrado | Hallazgo de este documento (§0), resuelto en la sesión de limpieza del mismo día |
| **DC-3** | El embudo híbrido (modal + WhatsApp) de F-12 — ¿vive solo en `/agendar` o el mismo componente se dispara desde CTAs de F-01/F-09/F-03? Recomendación: componente transversal (F-00), no una pantalla aislada. | F-00, F-12 | Hallazgo de este documento (§1) |

**Ninguna de estas decisiones la toma este documento** — quedan explícitas y bloqueantes, igual que D1-D5 en `plan_demanda.md`.

---

## 5. Orden de construcción recomendado (WIP=1, `diagnostico_de_proceso.md` C1)

Un bloque a la vez, siguiendo `plan_demanda.md` §3, mapeado a pantallas:

1. **Bloque A** (medición) — sin pantallas propias; condiciona el submit de F-12 (`gclid`).
2. **Bloque B** (Google Business Profile) — corre en paralelo, sin pantallas del sitio.
3. **Bloque C** (el corte) — construye, en este orden: **F-00 → F-12 → F-01 → F-09 → F-13** (si DC-1 se resuelve a favor de adelantar) **→ F-10 → F-11**. WhatsApp (F-00/F-12) primero porque I-011 es literalmente el ítem bloqueante declarado.
4. **Bloque D** (Sistema de Proyectos) — **F-03** con contenido real (1 proyecto → 1 página → resto de activos), condicionado a D2/D5.

**No se abre F-09..F-13 en paralelo entre sí** — mismo criterio que el resto del arnés: un bloque cierra antes de que abra el siguiente.

---

## 6. Qué NO hace este documento

- No decide D1-D5 ni DC-1/DC-2/DC-3 — eso es del Supervisor.
- No es el `disenio_PXX.md` que el agente Código necesita — cuando el bucle F7 llegue a F-01/F-09/F-10/F-11/F-12/F-13, el Iniciador escribe esos documentos completos (con §1 Entidades, §2 Estados, etc.) usando `PLANTILLA_PANTALLA.md`, tomando este documento como determinantes de entrada — igual que `disenio_F02_tienda_web.md` cita el REGISTRO.
- No toca `AGENTS.md`, `estado.md` ni `INDEX.md` — el único cambio de indexación que este documento pide es una línea nueva en `INDEX.md` §4 (ver abajo), no una reescritura.
- **Criterio de "hecho" de este documento mismo (C2):** no es "documento aprobado" — es que cada fila de la tabla §1 tenga su `disenio_FXX.md` propio y, más abajo en la cadena, la pantalla renderizando en `dev-local`. Hasta entonces, este documento es un mapa, no un cierre.
