# Plan F5 — Taller + Calidad + Entrega + Garantía (P-16..P-20)

**Plan de referencia (bucle F5):** t-098 (P-16), t-099 (P-17), t-100 (P-18), t-101 (P-19)
**Fuente de diseño:** `arnes/lineas/ola7/archivo/pasadas/d3_ui_b3_3_compras_taller_calidad.md` (B3-3b, aprobado)
**Zona:** datos · **Tipo:** datos_contrato · **Riesgo:** alto
**Estado:** DISEÑO COMPLETO (5 pantallas) — P-16, P-17, P-18, P-19, P-20

---

## 1. Hallazgos recuperados (fuentes del arnés)

| # | Hallazgo | Fuente | Impacto en F5 |
|---|----------|--------|---------------|
| H-B3-3-01 | Rol "compras" tipado o función del gerente → **resuelto: rol tipado** (DP-02) | `b3_3:449` | P-16 consumido por `taller`; P-17 veredicto = comercial vendedor |
| H-B3-3-03 | `tareas_produccion` capa 2 DIFERIDA; P-16 solo fila de salida (`modulos`) | `b3_3:452` | Detalle interno NO en F5 |
| H-B3-3-04 | Alojador de docs E-41 (Drive vs R2, DP-09): roza P-19 `pdf_url` | `b3_3:454` | No bloquea F5; validar en F7 |
| — | Vocabulario H07: **nunca el acrónimo "OC"** | `glosario_h07:48` | Solo copy de texto |
| — | Patrones L1 (M-06): MoneyInput, useDebounce, SmartSearch, Parallel loading, Loading+Suspense | `m06:199-214` | P-16/P-17/P-18/P-19 |
| — | Familia A responsive (tabla densa, 1ª columna sticky) / Familia B | `b3_3:105,323` | Fila del taller (A) / Calidad (B) |
| — | R16 deshabilitado con razón + R18 modal destrucción | `b3_3:79,103` | Guard E-24, E-25, E-54 |
| — | Determinismo E-24 (corrección reapertura): veredicto NO mueve `proyectos.estado` | `b3_3:320` | Guard de P-18 |
| — | R40 datepicker de rango (timezone) | `b3_3:350,373` | P-18, máx 5 días |
| — | R20 panel "Requiere tu decisión" (E-20 bloqueado) | `b3_3:460` | Referencia a F6 |

---

## 2. Alcance por tarea

### t-098 — P-16 Fila del taller (avance por módulo, capa 1)
- **Ruta:** `/app/erp/taller` + `/app/erp/taller/[ordenId]` (existe, extiende)
- **Rol:** desarrollador, gerente, comercial (visibilidad H8)
- **Fila por módulo:** orden | proyecto | módulo | estado | horas estimadas | enganche
- **Estados:** por_armar → en_armado → armado → en_calidad → aprobado → en_instalacion
- **Acciones:** Avanzar módulo (E-22) · Enganchar pedido web (E-44)
- **No:** detalle de tareas (capa 2 DIFERIDO). Input de P-11/E-59 y P-10/E-34 (B3-2).

### t-099 — P-17 Calidad: citación + veredicto (gate E-24)
- **Ruta:** `/app/erp/calidad` (nuevo)
- **Rol:** comercial vendedor (veredicto E-24, único), desarrollador (push E-23), gerente (ve)
- **Citación (E-23 SEÑAL):** `citaciones_calidad.estado→citada` (push, no gate)
- **Veredicto (E-24 GATE):** `verificaciones.tipo_gate='calidad'/,veredicto='aprobado/rechazado'` — verificador único = `proyectos.verificador_id`
- **P24:** `state='armado'` ∧ ∃citación citada ∧ ∃veredicto aprobado del verificador ∧ `creado_en ≥ citado_en`
- **Determinismo:** al aprobar E-24 `proyectos.estado` NO cambia (permanece `armado`); solo E-25 (P-18) lo saca de `armado`. Sin deadlock.
- **Rama negativa:** rechazo → `reprocesos.origen='calidad'` (R18)
- **R16:** veredicto deshabilitado si `verificador_id ≠ rol actual` o sin citación.

### t-100 — P-18 Instalación (rango 5 días)
- **Ruta:** `/app/erp/instalaciones` + `[id]` (nuevo)
- **Rol:** instalador, gerente, comercial. Eventos: E-25, E-54.
- **Rango:** `rango_fecha_inicio/fin` ≤5 días (R40 timezone)
- **Estados:** programada → en_curso → instalada | fallida
- **Guard E-24:** **Iniciar** deshabilitado si `P24` false → al iniciar `proyectos.estado→en_instalacion`; **Marcar instalada** → `instalado`. Fallida → reproceso E-54 (R18).
- **Adelanto:** `instalaciones.adelantada_por→check_produccion` (E-59).

### t-101 — P-19 Acta de entrega digital
- **Ruta:** `/app/erp/instalaciones/[id]/acta` (nuevo)
- **Rol:** instalador, cliente (firma diferida), gerente. Evento: E-26.
- **Wizard:** generar acta (`pdf_url`) → enviar al cliente → firmar → `actas_entrega.estado→firmada` + `proyectos.estado→entregado`
- **Holgura operativa:** `holgura_operativa_dias=12`
- **Guards:** generar si instalada; enviar si generada; firmar (cliente/instalador, manual sin wizard de firma digital).
- **Firma digital DIFERIDA:** `FirmaWizard` compartido con E-13. Sin implementar; el instalador registra manualmente.

### t-102 — P-20 Garantía (reporte cliente + gestión ERP) — NUEVO
- **Diseño:** `disenio_P20_garantia.md`
- **Rutas:** `/cuenta/garantia` (cliente) + `/app/erp/garantia` (ERP)
- **Rol:** cliente (reporta), desarrollador (diagnostica, repara), comercial (ve)
- **Tabla nueva:** `casos_garantia` (añadida a REGISTRO DE ENTIDADES §8)
- **Estados:** reportado → diagnosticado → en_reparacion → resuelto → cerrado
- **Cliente:** selecciona proyecto entregado → elige módulo del árbol (opcional) → sube fotos + descripción → reporta
- **ERP:** Kanban por estado, diagnóstico, creación de orden de garantía / reproceso
- **Garantía contractual:** automático (`fecha_reporte ≤ fecha_entrega + 2 años`)
- **Entidades relacionadas:** `citas_garantia`, `ordenes_trabajo(tipo='garantia')`, `reprocesos`

---

## 3. Usabilidad (heredadas de F4 + propias de F5)

1. **Vocabulario H07** en toda la UI (estados legibles, no acrónimos).
2. **Patrones L1:** Loading + `<Suspense>` en cada carga; `Promise.all` en loads paralelos; SmartSearch donde haya lookup.
3. **Familia A** para la fila del taller y tabla P-16 (scroll + sticky); **Familia B** para calidad.
4. **R16:** botones deshabilitados con razón visible ("Falta citación del desarrollador", "Veredicto no aprobado (E-24)", "Instalación no instalada").
5. **R18:** modal de confirmación en rechazo de veredicto (E-24), instalación fallida (E-54), y acciones destructivas.
6. **Veredicto prominente (R10)** en calidad; foco visible y modal con focus trap.
7. **R40:** datepicker de rango con manejo de timezone para instalación (≤5 días).
8. **Badge dirección `material`** (default ERP del D4) en estados de módulo, calidad, instalación y acta.
9. **Toast** de éxito/error por acción (avance módulo, citación, veredicto, inicio/instalada/fallida, generar/enviar/firmar acta).
10. **Panel "Requiere tu decisión" (R20):** lista E-20 bloqueados → enlace a F6 (frontera, no se construye aquí).

---

## 4. Máquinas de estado de los gates (F5)

- **E-24 (P-17) gate REAL que se ejecuta aquí.** Predicado `P24` en servidor (nunca cliente). `proyectos.estado` permanece `armado` tras aprobar (determinismo de reapertura, auditoría independente).
- **E-21 heredado de F4 (P-14):** el control pasa al taller (P-16) con `ordenes_trabajo` estado `recibido_verificado` — F5 recibe esa frontera.
- **E-25 (P-18)** desbloquea con guard E-24 → `en_instalacion`; **E-26 (P-19)** cierra proyecto → `entregado`.
- Sin gat in F5 específico más allá de E-24 ejecutado aquí; E-23 es señal.

---

## 5. Verificación mecánica (solo al codificar fuera de F0-F9)

- `npx tsc --noEmit` · `npx eslint .` · `npm run db:migrate` contra dev-local · test de gate E-24 (P24 determinista: aprobar no mueve estado) · test guards E-25/E-26 · round-trip `citaciones_calidad`/`verificaciones`/`instalaciones`/`actas_entrega`.

---

## 5.b — DECISIÓN ESTRUCTURAL que afecta este plan (no bloquea el diseño, sí el schema)

**D-2026-08-07-C (aprobada por el Supervisor):** el "módulo de taller" no es una fila de armado — es la **unidad de trazabilidad del proyecto entero**, que nace en el cotizador. Modelo = árbol jerárquico recursivo de módulos por espacio. Ver `arnes/lineas/ola7/pantallas/disenio_modulo_espacio.md`.

Consecuencias directas para F5:
- `citaciones_calidad.modulos_ids` (jsonb) → puede referir un **subconjunto** de nodos (despacho parcial natural).
- `verificaciones`, `instalaciones`, `actas_entrega` se evalúan **por módulo/nodo**, no por proyecto.
- `proyectos.estado` único no representa despacho parcial → el estado vive en el nodo.
- [x] ⚠️ Salvedad pendiente del Supervisor: relación módulo ↔ catálogo (ver `disenio_modulo_espacio.md` §5) — **RESUELTA 2026-08-07. Principio clase↔instancia aprobado. El nodo modulos NO duplica el detalle comercial del catálogo. Se quita la condición.**

Este plan de `plan_f5.md` queda **sin condiciones pendientes**. El diseño de pantallas P-16..P-19 procede.

## 7. Regla estrategia V3

F5 produce **diseño + plan aprobado**, no código. Se codificará al salir de la banda F0-F9 junto a F4.

## 8. Registro del bucle F5

- Fuente: `d3_ui_b3_3_compras_taller_calidad.md` (P-16..P-19, gates E-24 ejecutado, E-20/E-21 en F4/F6).
- Dependencias: entrada desde F4 (E-21 → taller), salida hacia F6 (cadena E-24 → E-25 → E-26) y hacia F7 (`pdf_url`, R2).
- **Decisión D-2026-08-07-C** (módulo jerárquico por espacio) incorporada — condición de schema, no de pantalla.
- **No hay código.** Siguiente: checkpoint del Supervisor sobre este plan + cierre de la salvedad catálogo.

## Referencias

- Fuente de diseño: `d3_ui_b3_3_compras_taller_calidad.md`
- Vocabulario: `glosario_h07.md`
- Patrones L1: `m06_capa_tecnica_transversal.md`
- Estrategia: `estado.md` (§ Estrategia general V3); cierre de bucle F4: `plan_f4.md`