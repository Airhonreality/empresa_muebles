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
