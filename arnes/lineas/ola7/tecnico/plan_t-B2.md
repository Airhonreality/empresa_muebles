# Plan de Tarea: t-B2

**Título:** B2 — Cronograma + Gates (P-06..P-12, Fase F3) con rediseño de kanban a estados canónicos

**Fecha de creación:** 2026-08-09
**Diseño previo:** `arnes/lineas/ola7/pantallas/disenio_f3_cronograma_gates.md` (propuesta F3)
**Contrato de Definición de Hecho:** `arnes/lineas/ola7/tecnico/checklist_progreso_pantallas.md` (13 puntos)
**Estado:** APROBADO 2026-08-09 (Supervisor — B2 completo, decisiones registradas abajo)

---

## Decisiones del Supervisor (2026-08-09)

1. **Máquina de estados → canónica (aditiva):** `Proyecto.estado` se amplía con el corredor canónico `desarrollo, aprobado_compras, armado, verificado, en_instalacion, instalado` (fuentes: `REGISTRO_DE_ENTIDADES.md:70`, `glosario_h07.md:91/93`). Los legacy (`enviada/pre_produccion/produccion`) se conservan para no romper el kanban B1 actual; los fixtures F3 se siembran solo con estados canónicos.
2. **Kanban P-01 rediseñado a fases canónicas** (columna "En instalación" separada, ver Lote C) — solo los estados que el comercial opera/ve.
3. **Rutas híbridas:** hub por proyecto `/erp/proyectos/[proyectoId]` (P-06) + subrutas `/retoma`, `/desarrollo`, `/cronograma`; P-10/P-11 en el hub; `/erp/gates` = vista general del gerente; `/erp/equipo` = P-12. La fuente de verdad del cronograma es única por proyecto (`cronogramas` FK→`proyectos`); el "cronograma general" y "por rol" son vistas derivadas, no tablas.
4. **Agenda interna independiente → APLAZADA** y anotada como gap (no hay acoplamiento: el cronograma F3 es solo de producción del proyecto; NO modela reuniones/tareas internas tipo "reunión compras+contador el día X").
5. **Ejecución:** B2-0 (capa de datos) serializada primero; luego Lotes A/B/C en paralelo con sub-agentes (`explore`/`general`), intercalando modelos según `arnes/MODELOS.md`.

---

## Zona

**Zona afectada:** `datos` (B2-0) + pantallas ERP F3 (Lotes A/B/C)

**Tipo de tarea:** `Datos / UI prototipo (mock)`

**Riesgo calculado:** `medio-alto`

**Frena al humano:** sí (checkpoint de quiebre de checklist tras cierre de B2, y antes de mergear a `main`)

---

## Rule: prototipo con mocks, sin DDL

F10 es prototipo con `DATA_IMPL=mock`. No se ejecuta migración ni DDL. Los contratos amplían `lib/data/contracts.ts`; `lib/data/drizzle-impl.ts` queda como stub no-op.

---

## Fases de implementación

### B2-0 — Capa de datos (serializada, corre sola primero)

**Archivos a MODIFICAR:**
- `lib/data/contracts.ts` — ampliar `Proyecto` (`verificadorId`, `fechaEntradaDesarrollo`, `comercialVendedorId`, estados canónicos) + nuevos dominios definidos abajo.
- `lib/data/mock-store.ts` — dominios + mutadores que llaman `notify()` antes de retornar.
- `lib/data/fixtures.ts` — fixtures F3.
- `lib/data/drizzle-impl.ts` — stubs no-op de los nuevos dominios.
- `lib/data/index.ts` — re-export de tipos.
- `lib/data/mock-store.test.ts` — round-trip por dominio nuevo + casos de gates.

**Archivos a CREAR:**
- `lib/modules/f3/gates.ts` — funciones puras `P18()`, `P33()`, `derivarDesenlace()`.
- `lib/modules/f3/gates.test.ts` — casos unitarios de gates.

**Nuevos dominios (contratos):** `Cronograma`, `CronogramaEtapa` (línea `contractual|interna`), `DesfaseCronograma`, `NovedadCritica`, `CheckProduccion`, `SchemaProyecto`, `BomMaterial`, `Verificacion`, `Retoma`, `ComunicacionProgreso`, `CambioContrato`, `Persona`, `PersonaRol`, `Modulo`, `Estimacion`.

**Criterios de aceptación (checklist §3/§5/§6):**
- Todo mutador llama `notify()` antes de retornar (§1.3).
- Round-trip test por dominio nuevo (§2.5).
- I-034: `aplicarDesfase()` recalcula SOLO línea `interna`; `contractual` inmutable.
- P18/P33/derivarDesenlace como funciones puras con test (R9: ratios [0.60]=extremo, [0.80]=novedad).

### B2-1 — Pantallas (2 lotes en paralelo + 1 lotes de kanban, §4)

| Lote | Pantallas | Ruta | Archivos (no compartidos entre lotes) |
|------|-----------|------|----------------------------------------|
| **A (operativo)** | P-09 (cronograma doble + editor desfase E-33 + comunicación adelanto), P-10 (novedades + SLA), P-11 (check producción + desenlace) | `/erp/proyectos/[proyectoId]/cronograma` + sección en hub | `app/erp/proyectos/[proyectoId]/cronograma/` + componentes |
| **B (desarrollo+equipo+hub)** | P-06 (mapa gates hub), P-07 (retoma), P-08 (schema + veredicto E-18), P-12 (equipo), `/erp/gates` (ver gerente) | `/erp/proyectos/[proyectoId]`, `/retoma`, `/desarrollo`, `/erp/equipo`, `/erp/gates` | `app/erp/proyectos/`, `app/erp/equipo/`, `app/erp/gates/` |
| **C (kanban)** | P-01 rediseñado: estados canónicos, "En instalación" separada, solo gates comerciales | `/erp/comercial` | `app/erp/comercial/` |

**Archivo compartido (lo maneja UN solo lote):** `components/veta/erp-shell.tsx` (ERP_NAV + footer genérico) + `app/erp/layout/`. Se asigna a Lote B.

**Criterios de aceptación (checklist):**
- `useDataStore()` en pantallas, nunca `getDataStore()` (§1.1).
- `useMemo` con dep `store.getVersion()` (§1.4).
- Gate E-18 guard D3 (R6): botón "Aprobar schema" solo si `verificador_id === usuarioActual.id`.
- Cierre de lote (§2.6): output crudo de `npx tsc --noEmit`, `npx eslint .`, `DATA_IMPL=mock npx next build`, `npx tsx lib/data/mock-store.test.ts`.

### B2-2 — Cierre

- Hallazgos → `registro_hallazgos_poc4.md` (POC-16+).
- Actualizar `estado_ola7.md` + `estado.md`.
- Anotar gap: agenda interna independiente (decisión 4).

---

## Verificación

| Comando | Qué cubre |
|---------|-----------|
| `npx tsc --noEmit` | Tipos en todo el árbol |
| `npx eslint .` | Estilo |
| `DATA_IMPL=mock npx next build` | Build de prototipo (errores no-conexión = bugs) |
| `npx tsx lib/data/mock-store.test.ts` | Round-trips F3 |
| `npx tsx lib/modules/f3/gates.test.ts` | P18/P33/derivarDesenlace |

---

## Qué NO incluye

- NO incluye DDL ni migraciones (F10 es mock).
- NO incluye agenda interna/reuniones (aplazada como gap).
- NO incluye pantallas de F5 (calidad P-17, instalación P-18/P-19, extensión de F5) — solo los badges/deep-links de P-06 hacia ellas.
- NO incluye `lib/db/schema.ts` (schema real queda para la migración final F10-E).

---

## Referencias

- Diseño F3: `arnes/lineas/ola7/pantallas/disenio_f3_cronograma_gates.md`
- Checklist: `arnes/lineas/ola7/tecnico/checklist_progreso_pantallas.md`
- REGISTRO: `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§3, §5, §6)
- Glosario: `arnes/nucleo/glosario_h07.md` (§B.0)
- Check de producción (mini diamante): `arnes/nucleo/mini_diamante_check_produccion.md`
- Reactividad (M-07): `arnes/lineas/ola7/tecnico/m07_capa_reactividad.md`