# Plan Maestro — Ola 7 (Execute)

**Supervisor:** Javier
**Fecha:** 2026-08-04
**Status:** PROPUESTO — pendiente aprobación del Supervisor
**Alcance:** contrato maestro de ejecución. No es rediseño: codifica exactamente lo que Ola 6 especificó (65 tablas, 34 pantallas, 5 gates).

---

## 1. Fases de implementación (F0-F9)

Regla de oro: ninguna fase rompe un módulo que ya corre. Cada fase cierra con verificación mecánica (§5).

| Fase | Nombre | Schema (migración) | Pantallas / Gates | Tareas | Salida verificable |
|---|---|---|---|---|---|
| **F0** | Cimientos — identidad y auditoría | `roles`, `personas`, `personas_roles`, `parametros`, `parametros_historial`, `eventos`, `audit_logs`, `procedencia` (F0+F2) | — (rol tipado `erp-nav.ts`; precondición de todo guard) | t-074, t-076 (base) | `db:migrate`+`db:seed` limpios en dev-local; `eventos` append-only OK |
| **F1** | Catálogos + embudo ampliado | catálogos FLAG-4 (herrajes, insumos, procesos, componentes, espacios); `leads`/`clientes`/`proyectos` ampliadas (F1) | — | t-075, t-077 (seed real) | 65 tablas creadas; seed real cargado |
| **F2** | Comercial + cotizador | `cotizaciones`, `diseños3d`, `citas`, `visitas`, `conversaciones` | B3-1: P-01..P-05 + F-01/F-02/F-03/F-08 | t-078 (P-04), t-079 (P-01) | Matemática en servidor (R05) testeada; embudo kanban con datos reales |
| **F3** | Cronograma + gates E-18/E-33 | `cronogramas`, `cronograma_etapas`, `desfases_cronograma`, `check_15_dias`, `novedades_criticas`, `schemas_proyecto`, `bom_materiales`, `retomas`, `reprocesos` (F2) | B3-2: P-06..P-12, **E-18**, **E-33** | t-080 (E-33), t-081 (P-09), t-082 (logs+alertas) | Test de gate E-18/E-33 contra datos reales; recálculo solo `linea='interna'` |
| **F4** | Compras + gates E-20/E-21 | `ordenes_compra`, `items_orden_compra`, `recepciones_material`, `herramientas` (F2) | B3-3a: **P-13 (E-20 dispara)**, **P-14 (E-21)**, P-15 | t-083 (E-20), t-084 (E-21), t-085 (P-13) | P21 triple verificación OK; caja bloqueante en servidor |
| **F5** | Taller + Calidad + Entrega | `modulos_armado`, `citaciones_calidad`, `instalaciones`, `actas_entrega`, `citas_garantia` (F2) | B3-3b: P-16, **P-17 (E-24)**, P-18, P-19 | — (heredadas de F4) | Gate E-24 E2E; rango 5 días |
| **F6** | Finanzas + Compensación | `liquidaciones_compensacion`, `comisiones_proyecto`, `registros_horas` (F2) | B3-4: **P-20 (E-20)**, P-21, P-22, P-23 | t-086 (P-22), t-087 (config nómina) | Dualidad tiempo/módulo funcional; caja derivada con `SUM` real |
| **F7** | Cliente/docs + frontstage | `documentos_proyecto` (F2) | B3-5: P-24, P-25, P-26, F-07 | — | Aislamiento `clienteId` (R26) |
| **F8** | Migración rompiente | enums aditivos + backfill (`proyectos.estado`, `ordenes_trabajo.estado`, `obligaciones_pendientes.estado`, `fecha`→timestamp) (F3); deprecación `rolEmpleado`→`personas_roles` (F4) | — (toca datos existentes, ÚLTIMO) | — | Backfill 1:1 8 valores legacy; `session.ts`/`erp-nav.ts` en `personas_roles`; tests re-corridos |
| **F9** | QA + corte | — | Todos los gates | t-088 (E2E gates), t-089 (trazabilidad `audit_logs`), t-090 (checkpoint) | 5/5 gates E2E; 61/61 eventos trazables; checkpoint aprobado |

---

## 2. Encadenamiento de gates (orden, bloqueos, paralelizaciones)

**Dependencias duras (no se puede saltar):**

```
E-18 (schema aprobado, F3/P-08) ─→ E-20/E-21 (compras, F4/P-13/P-14) ─→ E-24 (calidad, F5/P-17) ─→ instalación (F5/P-18)
                                    └─ E-20 es gate de caja: bloquea OC/pago si no hay caja
```

- **E-18 antes de E-20/E-21:** P-13 tiene `guard E-18` — no se crea OC sin schema aprobado.
- **E-21 antes de pasar control al taller:** la recepción con `recibido_verificado` desbloquea la fila del taller (P-16).
- **E-24 antes de instalación:** P-18 tiene `guard E-24`.
- **E-33 (desfase cronograma):** transversal sobre el tiempo, NO bloquea el flujo lineal. Se implementa en F3 pero su recálculo solo toca `cronograma_etapas.linea='interna'`. Impacta comisiones (E-33→E-35), o sea que F6 depende de que E-33 esté bien (lectura de `desfaseId` en `comisiones_proyecto`).
- **E-20 (caja):** predicado en servidor (nunca cliente). Se evalúa en F4 (al crear OC/pago) y se muestra en F6 (P-20). La tabla `cuentas_financieras` ya existe (conservada) — el predicado puede construirse en F4 aunque la UI de caja llegue en F6.

**Paralelizaciones permitidas:**
- F0/F1 (schema puro, FKs nullables) corren en paralelo con las pantallas existentes — no rompen nada.
- F2 y F3 comparten `proyectos` ampliada: secuenciales dentro del módulo, pero F2 (embudo) puede arrancar antes que F3 (cronograma).
- F6 (finanzas) arranca en paralelo con F4/F5: las tablas de caja existen; la compensación (P-22) depende de E-33 (F3) y de movimientos, no del flujo de taller.
- F7 (docs/cliente) es independiente: paralelizable con F4-F6.
- F8 siempre al final. F9 cierra.

---

## 3. Mini-diamantes M-01..M-06 (no bloquean, pero fijan semántica antes de congelar schema)

| ID | Tema | Capa | Impacta | Cuándo debe estar resuelto |
|---|---|---|---|---|
| M-01 | Causalidad (E-33 determinismo): protocolo de auditoría de desfases + justificación humana | Negocio | F3 (t-080, guard E-33) | Antes de cerrar t-080: reabrir el guard después es caro |
| M-02 | Grafos catálogo: semántica insumo→producto→herraje | Negocio | F1 (t-075), F2 (P-04 cotizador) | Antes de cerrar t-075: reabrir catálogos después toca seed + cotizador |
| M-03 | Derivación de parámetros (factores que afectan comisiones) | Negocio | F6 (P-22, gates E-31/E-35) | Antes de cerrar t-086 |
| M-04 | Logging/KPIs: diseño de `eventos` como observabilidad | Negocio | F3 (t-082), F6 (P-23) | Antes de cerrar t-082 |
| M-05 | Modularización: inventario de procesos elementales del taller | Negocio | F5 (P-16 fila taller, P-18 instalación) | Antes de cerrar F5 |
| M-06 | Capa técnica transversal de infraestructura de interfaz | Técnico | Transversal a F0-F9 (L1: patrones de infraestructura) | Se aplica al final de F9 como prerequisito de cruce entre todas las fases; no bloquea F2-F10 |

**Regla:** si un mini-diamante no está cerrado cuando se congela su fase, se implementa con la decisión más conservadora ya diseñada (las columnas/tablas existen en el consolidado) y el refinamiento entra como parámetro o dato, nunca como cambio de schema.

**M-06 estructura:**
- **L1 (capa técnica):** patrones de infraestructura transversal (autosave, debounce, smart search, parallel loading, COP formatter, MoneyInput, Suspense, design tokens, primitives). Completado 2026-08-05. No bloquea ninguna fase.
- **L2 (contradicciones legacy):** retirado de M-06 y movido a un diamante exclusivo que resuelve las 4 contradicciones de lógica de negocio/pantallas que bloquean F2.
- **L3 (diseño P-04 cotizador):** depende de que el diamante exclusivo de contradicciones cierre.
- **L4 (diseño P-05 contrato):** depende de L1 (patrones técnicos) pero no de L2/L3.
- **Intersección:** M-06 se cruza con todas las fases F0-F9 solo al final de F9 como prerequisito de cruce, antes de la fase de código.

---

## 4. Cuidados y condiciones

- **A-01 (contador) — no bloquea F0-F7, OBLIGATORIO antes de F8:** `neto_diseno_3d_pct`, `iva_diseno_3d_pct`, `recargo_hora_extra_pct`, `umbral_novedad_check15`. Los valores v1 estimados ya viven como parámetros; la confirmación cambia números, no schema. Si no está resuelto al llegar a F8, F8 espera.
- **Decisiones cerradas no se re-discuten** (regla de OLA_7_ENTRADA). Cambio → escalar al Supervisor, nunca reabrir Ola 6.
- **Nunca tocar `main`/`legacy-agnostic-backup`; ninguna escritura contra producción.** Todo contra `dev-local`.
- **Frontera DIFERIDO (no se construye en Ola 7):** tienda F-04/F-05/F-06, KPIs P-32, testimonios P-33, facturación DIAN, `tareas_produccion` capa 2, firma digital.
- **Mini-diamantes y decisiones del Supervisor se registran en el ledger antes de que cada fase abra.**

---

## 5. Verificación obligatoria por fase

| Tipo | Verificación | Comando |
|---|---|---|
| Schema/datos | Validación de contrato + round-trip | `npm run db:migrate` + `db:seed` |
| Lógica | Tests unitarios por módulo | `npx tsx <archivo>.test.ts` |
| Gates | Predicado SQL evaluado en servidor | Test de gate contra dev-local |
| Integración | Flujo E2E aislado | Test E2E en dev-local |
| Auditoría | Trazabilidad en `audit_logs` | Query devuelve cadena completa |
| Global | Tipos + lint + build | `npx tsc --noEmit` · `npx eslint .` · `npx next build` |

Sin verificación mecánica, ninguna tarea se cierra. Separación ejecutor-verificador (QA independiente) en cada fase.

---

## 6. Checklist de aprobación del Supervisor

- [ ] Aprobar el encadenamiento de gates (§2), especialmente: E-18 antes de E-20/E-21; E-20 predicado en F4 aunque la UI llegue en F6.
- [ ] Aprobar el orden y las paralelizaciones (§2): F6 arranca en paralelo con F4/F5; F8 al final.
- [ ] Confirmar regla de mini-diamantes (§3): resueltos antes de congelar su fase; si no, decisión conservadora + parámetro.
- [ ] Tomar nota: A-01 debe estar resuelto antes de F8.
- [ ] Firmar la apertura de Ola 7 (t-074 puede empezar).

---

**Registro:** 2026-08-04 · Contrato maestro Ola 7 propuesto. A la aprobación, el Iniciador escribe `plan_t-074.md` (F0) con base en este maestro.
