# Tareas diferidas intencionalmente — NO bloquean migración ni preview

**Creado:** 2026-08-12 (resolución del bucle de arnes: fases que se "cierran" pero tareas pendientes las reabren).
**Propósito:** ser la fuente única de verdad de todo lo que está *postergado a propósito* y que, por decisión explícita, **NO impide** el corte de F10, la migración de datos reales, ni el preview de Vercel.

**Regla de oro:** una tarea en esta lista no cuenta como "bloqueante" para ningún checkpoint de migración/preview. Si reaparece en un estado como "pendiente bloqueante", es un error de ese estado, no de la tarea.

---

## 1. Tareas de demanda pendientes del Supervisor (no bloquean migración)

Según `arnes/lineas/demanda/plan_demanda.md` §5, el arranque de los bloques A–E espera aprobación del Supervisor. **Ninguna de estas aprobaciones es prerequisito de la migración de datos ERP** (productos, clientes, catálogos) — eso se desbloqueó formalmente en `plan_demanda.md` §6 (2026-08-12).

| # | Tarea | Ref | Por qué no bloquea migración/preview |
|---|-------|-----|--------------------------------------|
| D1 | Eslogan definitivo | t-112 | Decisión de marca, documento. No toca schema ni datos. |
| t-110 | Credenciales de solo lectura Ads/GA4/Search Console | `[SOLO_HUMANO]` | Requiere acceso humano; es para *medición*, no para migrar datos. |
| — | Informe de sector | — | Insume de mercado; no afecta el esquema ni el preview. |
| t-111 | Checkpoint de schema para Bloque A (`leads`) | — | Bloque A es *medición*; diferirlo no impide migrar el resto del esquema ni el preview. |

**Decisión:** el Bloque A (Medición) y toda la línea de demanda (Bloques A–E) se ejecutan a su propio ritmo, **desacoplados de la migración de datos**. La migración no espera a Bloque A.

---

## 2. Decisiones pendientes del Supervisor en el backlog de auditoría

Fuente: `arnes/lineas/ola7/tecnico/backlog_auditoria_pantallas.md` §3.

| # | Decisión | Estado | Por qué no bloquea migración/preview |
|---|----------|--------|--------------------------------------|
| DP-01 | ¿`ROLES_FLUJO_APROBACION` debe incluir rol `compras`? | Limpieza de cero riesgo ya ejecutada (`['admin','finanzas']`); política de fondo abierta | Entrada muerta hoy; no afecta datos ni preview. |
| DP-02 | P-20 portal cliente de garantía (`/cuenta/garantia`) no construido | Diferido (2026-08-10) | Gap de feature, no de datos. El reporte se hace desde ERP interno. No bloquea migración. |
| DP-03 | P-22 doble-checkpoint comisiones + notificación E-27 | Diferido | Feature de liquidación; no afecta esquema migrable ni preview. |
| DP-04 | F-00 Shell global sin `disenio_F00.md` | **Resuelto parcialmente 2026-08-15** — footer 4 columnas (NAP+enlaces+legal) y WhatsApp flotante transversal construidos y documentados en `arnes/lineas/ola7/pantallas/disenio_F00_shell.md`. Sigue diferido: CTA "Agenda tu Asesoría" + modal DC-3 (requieren dominio `leads` en `lib/data/`, no existe hoy) y 4 ítems de nav (F-10/F-11/F-18/F-19 sin página construida). | No bloquea datos ni preview — nada de lo diferido toca `lib/data/`/`lib/auth/` todavía. |
| D-08b | Autogestión de Persona/Proveedor (login interno) | Diseñado, no construido | Reusa sesión de portal cliente ya aprobada. No toca `lib/data/`/`lib/auth/` hoy. |

---

## 3. Lotes de `lib/data/` — ESTADO: COMPLETOS en el working tree

`arnes/estado.md` (línea 29) listaba como "próxima acción permitida" dos lotes que tocan `lib/data/`. **Ambos ya están resueltos en el árbol de trabajo actual** (verificado 2026-08-12):

| Ítem de estado.md | Estado en working tree |
|-------------------|------------------------|
| designar `verificador_id` en P-12 | ✅ `Proyecto.verificadorId` + `actualizarVerificador()` en `lib/data` |
| agregar `padreLinaje` a módulo/espacio | ✅ `Modulo.padreLinaje: string[]` en `lib/data/contracts.ts` |
| métodos `porProyecto()` que faltaban a Caja/Recepción | ✅ `MovimientoFinanciero.porProyecto`, `ObligacionPendiente.porProyecto`, `RecepcionMaterial.porProyecto` existen en `lib/data/contracts.ts` |

**Consecuencia:** el prerequisito de datos para cerrar F10 y migrar está satisfecho. El estado.md debe actualizarse para reflejarlo (ver §4).

---

## 4. Efecto en el corte

- **F10 (prototipo → migración):** desbloqueado una vez se confirme el working tree (tsc/eslint/build limpios y los `porProyecto`/`verificadorId`/`padreLinaje` presentes). No espera a Bloque A ni a DP-01/02/03.
- **Preview de Vercel:** al hacer push a `dev`, Vercel genera la URL de preview. No depende de ninguna tarea diferida aquí.
- **Migración de datos maestros:** productos, clientes, catálogos — desacoplados de F-06/F-07/F-08/F-09 desde `plan_demanda.md` §6.

---

## 5. Qué SÍ queda por hacer antes del corte final (fuera de esta lista)

Solo lo que toque `lib/data/`/`lib/auth/` con riesgo alto, o el merge `dev`→`main` (checkpoint del Supervisor). Ninguna tarea de esta lista cuenta como bloqueante.

---

## 6. Cierre de sesión 2026-08-12 (agente)

Esta lista se creó hoy para cortar el bucle de arnés donde las fases se "cerraban" pero tareas diferidas las reabrían. Resumen de la sesión:

- **Bucle cortado:** las tareas de §1 y §2 (DP-01/02/03, D-08b, pendientes de demanda D1/t-110/t-111) se confirman como **no bloqueantes** para migración ni preview.
- **Lotes `lib/data/` confirmados completos** en el working tree (verificado en `estado.md` / `estado_ola7.md`): `verificador_id` en P-12, `padreLinaje` en módulo/espacio, `porProyecto()` de Caja/Recepción.
- **Correcciones de compilación (tsc) aplicadas en la sesión:** `SHOP_CATEGORIAS` (enum usado como valor), `testimonios` añadido a `DataStore`/`drizzle-impl.ts`, typo `producto`→`p` en `colecciones/page.tsx`, 2 typings de PDF. Resultado: **`tsc --noEmit` exit 0**.
- **Verificación mecánica post-sesión (2026-08-12):** `npx eslint .` → **0 errores** (solo warnings de `<img>`/unused, no bloquean); tests `mock-store.test.ts` (73 OK) + `f4/gates.test.ts` (5 OK) → **OK**; `npx next build` → **exit 0** (47 rutas; las páginas que consultan datos son dinámicas `ƒ` servidas por el mock store en memoria, por eso no necesitan DB en build). El working tree está listo para preview.
- **NO son tareas diferidas** los fixes de tsc anteriores: son correcciones del working tree, no postergaciones.
- **Estado:** nada commiteado. El batch completo (D-01→D-17 + sesión) sigue sin commitear, en cola de revisión en vivo del Supervisor.
- **Próximo paso habilitado:** `next build` → push `dev` → preview Vercel → checkpoint de merge `dev`→`main`. Ninguna tarea de esta lista lo bloquea.

---

## 7. F-17 "Cotiza tu Espacio" — POSTPUESTO POST-LANZAMIENTO (2026-08-19)

| Ítem | Detalle |
|------|---------|
| Pantalla | F-17 Cotiza tu Espacio (`/cotiza-tu-espacio`) — cotizador público orientativo con rangos. |
| Decisión | **No se diseña ni se implementa en el lanzamiento ni en la 2ª actualización post-corte** (2026-08-19, checkpoint del Supervisor al aprobar el Lote C de la sesión de lanzamiento web). |
| Por qué no bloquea el lanzamiento | Es un requerimiento de web final cuya publicación depende de parámetros de costos en el ERP (F0) que aún no están definidos. Sin esos datos cualquier cifra sería inventada (regla anti-invención I-049). |
| Referencias | `plan_diseno_web_publica.md` §0/§1/§2.5 · `plan_seo_2026.md` §3 (JSON-LD `Service` planificado solo cuando se active). |
| Alcance previsto cuando se active | Rangos orientativos por tipo de espacio, garantía (2 años, 8-12 días hábiles), hitos de pago, diseño 3D deducible, CTA dual hacia `/agenda-tu-asesoria` + WhatsApp. No reemplaza F-12 — la complementa. |

## 8. apple-touch-icon.png — PENDIENTE (A-6 parcial)

| Ítem | Detalle |
|------|---------|
| Qué | `app/manifest.ts` declara el icono `/icon.svg` (generado por Next). Falta `apple-touch-icon.png` (180×180) para iOS (Safari no usa SVG en el añadir a pantalla de inicio). |
| Por qué queda pendiente | No hay tooling de rasterizado PNG en el repo (`sharp` no está como utilidad de build). El SVG actual no se puede convertir en la sandbox sin instalar dependencias nuevas. |
| Cómo resolverlo | Convertir `app/icon.svg` → `app/apple-touch-icon.png` (180×180) con cualquier herramienta de rasterizado (incluso online) y declararlo en `app/layout.tsx` como `<link rel="apple-touch-icon">`. |

## 9. Lanzamiento web — solo "Cocinas Integrales" (2026-08-25)

| Ítem | Detalle |
|------|---------|
| Decisión | El sitio público se lanza con **una sola landing de espacio indexable y enlazada: Cocinas Integrales** (`/espacios/cocinas-integrales-bogota`). El tab "Espacios" del menú (con su desplegable de 7 categorías) fue reemplazado por el tab directo "Cocinas Integrales"; el footer "Colección de Espacios" quedó reducido a ese único link. |
| Home | La sección "Espacios que creamos" de la Home **conserva las 7 cards como pieza comunicacional**, pero ya NO enlazan (son `<div>`, no `<Link>`): muestran el catálogo de espacios sin dirigir a las landings no publicadas. |
| Landing `/espacios` (hub) | `noindex` + removida del sitemap. Las otras 6 landings (`closets`, `centros`, `estudios`, `cavas`, `consolas`, `pisos-de-madera`) también `noindex` (sin enlazar desde menú/footer; accesibles solo por URL directa). |
| Por qué no bloquea el lanzamiento | Son páginas ya construidas con copy de `contenido_F09_landings.md`; lo que falta es **contenido real por espacio** antes de desbloquearlas e indexarlas. |

### Pendientes de desbloqueo de landings (contenido por espacio)

Cada una de las 6 landings pendientes requiere, antes de quitarse el `noindex` y volver a enlazarse, contenido real propio:

| Espacio (ruta) | Contenido pendiente |
|----------------|---------------------|
| Closets y Vestidores (`/espacios/closets-vestidores-bogota`) | Textos, imágenes y descripciones reales |
| Centros de Entretenimiento (`/espacios/centros-de-entretenimiento`) | Textos, imágenes y descripciones reales |
| Estudios y Home Office (`/espacios/estudios-home-office`) | Textos, imágenes y descripciones reales |
| Cavas y Bares (`/espacios/cavas-y-bares`) | Textos, imágenes y descripciones reales |
| Consolas y Recibidores (`/espacios/consolas-recibidores`) | Textos, imágenes y descripciones reales |
| Pisos de Madera (`/espacios/pisos-de-madera`) | Textos, imágenes y descripciones reales |

Criterio de desbloqueo por espacio: contenido real cargado (textos + galería de imágenes + descripciones) → quitar `robots: { index:false }` en su `metadata` → re-enlazar desde menú/footer y (si aplica) Home.

## 10. ⚠️ PRINCIPIO AXIOMÁTICO VIOLADO: el contrato NO debe recalcular totales — TAREA + NOTA IMPORTANTE (2026-09-14)

| Ítem | Detalle |
|------|---------|
| Qué pasó | En 2026-09-14 se arregló el bug de que el contrato salía con valor menor al de la cotización (`ContratoModal.tsx` no incluía costos operativos/logísticos, imprevistos, descuento, ajuste ni IVA). **El fix fue pasajero:** `ContratoModal` ahora recibe `valorTotalCotizacion={total}` desde `[proyectoId]/page.tsx` (que ya calcula todo) y lo usa directamente. Se eliminó `calcularValorTotal()` del modal y el anti-patrón de `useMemo` con `setForm`. |
| ⚠️ VIOLACIÓN DE DISEÑO AXIOMÁTICO (detectar en la siguiente sesión) | **El contrato NO debe tener fórmulas de suma propias — nunca.** La cotización es la única que sumas y calcula (materiales + MO + costos op. + costos log. + imprevistos − descuento + ajuste + IVA); el contrato debe **absorber el valor final** como un solo dato de entrada. Si cada pantalla recalcula la fórmula, agregar un campo nuevo al cotizador obliga a tocar fórmulas en otras partes = **acoplamiento innecesario**. El arreglo actual (pasar `total` como prop) cumple el principio, pero el mal acoplamiento anterior (fórmula duplicada dentro del modal) es una deuda que hay que auditar en TODO el arnés: revisar si hay otras pantallas duplicando la fórmula de subtotal/total (ej: `new/page.tsx`, `propuesta`, `readonly`) que deberían absorber de una sola fuente. |
| Fix aplicado (contexto) | `app/erp/cotizador/ContratoModal.tsx` — prop nueva `valorTotalCotizacion`, campos del cliente ahora editables in situ (se persisten con `store.clientes.actualizar` al guardar). `app/erp/cotizador/[proyectoId]/page.tsx` — call site pasa `valorTotalCotizacion={total}` en vez de `manoDeObra`. |
| Tarea para la siguiente sesión | **Auditar y erradicar el mal acoplamiento:** (1) inventariar TODAS las fórmulas de subtotal/total duplicadas del cotizador (buscar `calcularValorTotal`, `materialesTotal`, `subtotal`, `costosOperativos` + `costosLogisticos` fuera de `[proyectoId]/page.tsx`); (2) consolidar la fórmula en UNA sola fuente (client-side en el cotizador), y que todos los consumidores (contrato, propuesta, readonly) absorban el valor final como entrada; (3) decidir con el Supervisor si esa fuente única vive en `lib/` (módulo) o como selector del store. |
| Riesgo | Medio-alto en diseño, inmediato en los bugs de totales ya vistos. Afecta dinero contractual. |
