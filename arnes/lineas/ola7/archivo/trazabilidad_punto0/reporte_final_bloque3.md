# Reporte Final — Trazabilidad Punto-0 (Bloque 3: Cruce trans-lote y consolidación)

> **Nota (2026-08-07):** este reporte menciona `DESTINO_SCHEMA_AUTORITATIVO.md`. Ese archivo fue renombrado a `REGISTRO_DE_ENTIDADES.md`. Este reporte es registro histórico de la convergencia.

**Fecha:** 2026-08-07 · **48 tablas trazadas en 9 lotes** · **JSON fuente:** `resultados/l0..l8.json`

---

## PARTE A — DECISIONES DE NEGOCIO (requieren tu respuesta)

Estas son las preguntas donde la lógica del negocio define la respuesta. No hay atajo técnico: solo tú (Supervisor) decides.

### A.1 — ESTADO DE PROYECTO: ¿cuál es el set canónico de estados?

**Conflicto (3 sets enfrentados, flag L2):**
- Set A (gates/OLA_6): `cotizacion → desarrollo → compra → armado → instalacion → entrega → garantia`
- Set B (consolidado d3/legacy): 12 valores incluyendo `borrador, activa, produccion, entregado, perdida, cancelada`
- Set C (diseño P-01 Kanban): 8 columnas `activa → cotización → contrato → producción → entregado / perdida / cancelada`

**Consecuencia:** cada pantalla usa un set distinto. Cotizador ve uno, Kanban otro, gates otro. El mecanismo ya está fijado (C3: `parametros.transiciones_proyecto`), pero **falta decidir cuál es el set canónico** que vive en ese parámetro.

**Pregunta para ti:** ¿cuál de los 3 sets (o una fusión que definas) es el vocabulario oficial del proyecto?

---

### A.2 — ORDEN DE COMPRA: ¿7 estados (legacy) o 4 (diseño simplificado)?

**Conflicto (flag L4):**
- Legacy/OLA_6: `solicitada → aprobada → enviada → recibida_parcial → recibida → verificada → cancelada` (7)
- Diseño nuevo (plan_f4): `creada → enviada → recibida → rechazada` (4)

**Consecuencia:** la granularidad del seguimiento de OC define qué puede ver compras en cada paso. Con 7 estados, compras puede distinguir "aprobada" de "enviada"; con 4 no. Pero 7 estados añade complejidad de UI y transiciones.

**Pregunta para ti:** ¿necesitas el detalle fino de 7 estados para la operación real de compras, o alcanza con 4?

---

### A.3 — RECEPCIÓN DE MATERIAL: ¿una sola tabla `recepciones_material` o dos entidades separadas?

**Conflicto (flags L4↔L6, 2 lotes):**
- OLA_6 define `recepciones` (entidad propia de compras)
- Consolidado d3 converge a `recepciones_material` (CF-03)
- L6 (Calidad) necesita `recibido_verificado` como gate — ¿es un campo en recepción o una verificación separada?

**Consecuencia:** si hay una sola tabla, calidad escribe sobre la misma fila que compras (acoplamiento). Si son dos (recepción + verificación de calidad), hay que coordinar el flujo.

**Pregunta para ti:** ¿la verificación de calidad de un material recibido es un paso dentro de la misma recepción, o un proceso aparte con su propia entidad?

---

### A.4 — AUDITORÍA: ¿`eventos`+`procedencia` (canon F0) o `audit_logs` (código vivo)?

**Conflicto (flag L0):**
- El canon F0 (D3, a2_1:79, CF-10, R-04) decidió colapsar la auditoría en `eventos` (append-only, 61 tipos) + `procedencia` (linaje del dato)
- Pero `audit_logs` YA EXISTE en `lib/db/schema.ts` (línea 560) y en OLA_6 como subsistema de logs robusto con 11 campos

**Consecuencia:** mantener ambos es duplicar cada registro de auditoría. Eliminar `audit_logs` rompe código existente. Eliminar `eventos`+`procedencia` rompe el canon F0 y el modelo de trazabilidad que aprobaste.

**Pregunta para ti:** ¿mantenemos `eventos`+`procedencia` como única auditoría (deprecando `audit_logs` del schema.ts), o coexisten con una regla clara de cuándo usar cada uno?

---

### A.5 — SLA DE ENTREGA: ¿un solo concepto en 3 sitios o 3 atributos distintos?

**Conflicto (flags L1↔L4↔L7, 3 lotes):**
- `materiales_insumos.tiempo_entrega_dias` (FLAG4:98) — lead time por insumo
- `proveedores.dias_entrega_default` (plan_f4:85, D-2026-08-07-B) — lead time default del proveedor
- `catalogo_proveedor.sla_dias` (plan_f4:113) — lead time por producto-proveedor (puente)

**Consecuencia:** si son un solo concepto, hay que elegir dónde vive y derivar los otros. Si son 3, hay que definir la regla de resolución (¿cuál gana si difieren?).

**Pregunta para ti:** ¿el tiempo de entrega se define a nivel de proveedor, a nivel de insumo, o a nivel del puente proveedor-producto? Y si hay conflicto entre niveles, ¿cuál tiene prioridad?

---

### A.6 — TAXONOMÍA DE CATÁLOGO: ¿tabla maestra de categorías o columnas sueltas?

**Conflicto (flag L1):**
- `categoria_comercial` en `productos_catalogo` (schema.ts:418)
- `segmento_comercial` en `catalogo_herrajes` (OLA_6_SCHEMAS:54)
- `categoria_tienda` en `productos_tienda` (FLAG4:57)
- No existe tabla `categorias`/`familias` en ninguna fuente

**Consecuencia:** sin tabla maestra, cada producto puede tener categorías inconsistentes entre vista comercial y vista tienda. Con tabla maestra, hay un solo vocabulario controlado.

**Pregunta para ti:** ¿quieres una tabla `categorias` dedicada (control centralizado), o te alcanza con columnas de texto libre en cada tabla?

---

## PARTE B — DECISIONES TÉCNICAS (resueltas axiomáticamente)

Estas no requieren tu intervención. Las resuelvo por diseño axiomático (menor acoplamiento, mayor cohesión, un solo dueño por dato). Si no estás de acuerdo con alguna, la marcamos y la muevo a Parte A.

### B.1 — Catálogo de productos: FLAG4 (especialización) gana sobre schema.ts plano

**Situación:** `schema.ts` tiene `productos_catalogo` plano con `tipo` text + `publicado_web`. FLAG4 (aprobado) define especialización con CHECK `tipo_catalogo` y tablas 1:1 (`productos_tienda`, `materiales_insumos`, `catalogo_herrajes`).

**Decisión axiomática:** **Migrar a FLAG4.** La especialización elimina el anti-patrón de "una bisagra aparece como producto público porque comparte tabla con muebles terminados". El consolidado d3 marcó esto DECISION_PENDIENTE (DP-05); FLAG4 la resolvió.

**Acción:** `schema.ts` debe reflejar `tipo_catalogo` CHECK + extensiones 1:1. El campo `tipo` text y `publicado_web` se deprecan.

---

### B.2 — Naming de acabados: `catalogo_acabados` (singular) es el canon

**Situación:** 3 nombres compiten: `catalogo_acabados` (D-2026-08-07-C + OLA_6 grafos), `catalogos_acabados` (plural, inconsistente), `productos_acabados` (D-08 previo).

**Decisión axiomática:** **`catalogo_acabados`** (singular). Es la decisión más reciente (D-2026-08-07-C, aprobada), coincide con OLA_6_METODOLOGIA_GRAFOS.md, y sigue la convención del resto del schema (`productos_catalogo`, no `productos_catalogos`).

**Acción:** unificar toda referencia a `catalogo_acabados`. El plural `catalogos_acabados` y el nombre D-08 `productos_acabados` se marcan obsoletos.

---

### B.3 — `modulos_armado` → `modulos` (árbol recursivo)

**Situación:** `modulos_armado` (consolidado d3, tabla plana de taller) vs `modulos` (D-2026-08-07-C, árbol jerárquico con `padre_id`).

**Decisión axiomática:** **`modulos` con árbol recursivo.** D-2026-08-07-C es decisión estructural aprobada que resuelve el despacho parcial (gates por nodo, no por proyecto). `modulos_armado` se depreca.

**Acción:** reemplazar `modulos_armado` por `modulos` en el consolidado y en schema.ts cuando se codifique F5.

---

### B.4 — `veredictos_calidad` absorbido en `verificaciones`

**Situación:** OLA_6 define `veredictos_calidad` como tabla separada. El consolidado d3 la absorbió dentro de `verificaciones`. Pero OLA_6 sigue viva con la tabla separada.

**Decisión axiomática:** **Una sola entidad `verificaciones` con campo `veredicto`.** Dos tablas para el mismo concepto (calidad de un ítem) es redundancia que genera inconsistencia. El consolidado d3 ya converge a una tabla.

**Acción:** OLA_6 se actualiza para reflejar que `veredictos_calidad` ya no es tabla independiente. El enum `veredicto` en `verificaciones` toma los valores `aprobado | rechazado | rechazado_total | reproceso_parcial`.

---

### B.5 — `audit_logs` se depreca a favor de `eventos` + `procedencia`

**Vinculado a A.4 (decisión de negocio).** Si apruebas A.4 a favor del canon F0, la acción técnica es:

**Decisión axiomática (condicionada a A.4):** **Deprecar `audit_logs`.** El canon F0 (`eventos` append-only + `procedencia`) cubre toda la auditoría con un solo mecanismo. `audit_logs` es redundante. Si necesitas mantener `audit_logs` por compatibilidad con código existente, se marcará como `[deprecado]` y se descontinuará en F4.

---

### B.6 — `valor_tienda` vs `precio_publico`: separación confirmada

**Situación:** C4 (diamante exclusivo) ya decidió: `precio_publico` en `productos_catalogo` es el PVP sugerido (default en cotizador, editable). `valor_tienda` en `productos_tienda` es el precio web fijo (independiente, no se toca desde el ERP).

**Decisión axiomática:** **Sin cambios.** La decisión C4 es correcta y no genera conflicto. Se documenta para que ningún diseño futuro los mezcle.

---

### B.7 — Items referenciales (C2): migrar 3 campos a `schema.ts`

**Situación:** C2 definió 3 campos sobre `items_variante` (`es_referencial`, `fuente_referencial`, `grupo_referencial`). Están en `estado.md:204` y en `disenio_p04_cotizador.md`, pero NO en `lib/db/schema.ts`.

**Decisión axiomática:** **Migración aditiva.** Son 3 columnas nullable sobre tabla existente. Sin nuevas entidades. La migración es trivial (ALTER TABLE ADD COLUMN) y no rompe nada.

**Acción:** añadir a `schema.ts` y generar migración.

---

### B.8 — `clientes.etapa_funnel`: migrar a `schema.ts`

**Situación:** Aprobado en consolidado d3 (A3-C3) con consumidor fijado (E-51), pero ausente de `schema.ts`.

**Decisión axiomática:** **Migrar.** Campo con dueño claro (el evento E-51 lo escribe) y consumidor (E-42 embudo). No es un campo muerto.

---

### B.9 — `producciones` no existe en ninguna fuente → no se crea

**Situación:** L5 reportó `producciones` como tabla sin origen en ninguna fuente (0 resultados en grep de todas las fuentes).

**Decisión axiomática:** **No crear.** Si aparece en un diseño futuro, debe tener dueño explícito (evento) y trazabilidad al punto 0. Por ahora, el flujo de producción se modela con `tareas_produccion` sobre `modulos`.

---

### B.10 — `procedencia`: añadir UNIQUE(hijo_entidad, hijo_id)

**Situación:** El canon a1_5:92 declara `UNIQUE(hijo_entidad, hijo_id)` en `procedencia` pero `schema.ts:547-556` no lo materializa.

**Decisión axiomática:** **Añadir la constraint.** Es la garantía de que cada dato tiene exactamente un origen. Sin ella, un mismo registro puede tener dos padres (linaje corrupto).

---

## PARTE C — RESUMEN PARA DECISIÓN RÁPIDA

| # | Decisión | ¿Quién decide? | Impacto si no se decide |
|---|---|---|---|
| A.1 | Set canónico de estados de proyecto | **Tú** | Cada pantalla usa un set distinto → Kanban, cotizador y gates desincronizados |
| A.2 | Estados de OC: ¿7 o 4? | **Tú** | Compras no sabe qué granularidad tendrá su panel |
| A.3 | ¿Una recepción o recepción + verificación separadas? | **Tú** | Calidad y compras comparten fila sin dueño claro |
| A.4 | ¿`eventos`+`procedencia` como única auditoría? | **Tú** | Dos sistemas de log duplicando cada registro |
| A.5 | SLA: ¿dónde vive el tiempo de entrega canónico? | **Tú** | 3 campos compitiendo, cotizador no sabe cuál usar |
| A.6 | ¿Tabla maestra de categorías? | **Tú** | Productos con categorías inconsistentes entre ERP y tienda |
| B.1–B.10 | Decisiones técnicas | **Resuelto aquí** | N/A — ejecutar al codificar |

---

## PARTE D — CONVERGENCIA DE LOS 3 CANONES → DESTINO

Con tus respuestas a A.1–A.6 + las decisiones B.1–B.10, el `DESTINO_SCHEMA_AUTORITATIVO.md` se redacta en la Fase 3 del Ciclo H (plan_hygiene_ciclo_h.md). La regla de precedencia queda:

```
D-2026-08-07* (decisiones nuevas) > FLAG4/OLA_6 (catálogos) > d3_schema_consolidado (núcleo 65 tablas)
```

Y la cláusula de supremacía: **"si este documento difiere de cualquier otra fuente, gana este"** — declarada en el propio DESTINO y en `INDEX.md`.
