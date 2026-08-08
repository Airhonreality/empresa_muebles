# PLANTILLA DE DISEÑO DE PANTALLA

**Aplica a fases tipo PANTALLA (F2–F7).** **Contrato vivo.** Todo diseño de pantalla P-XX sigue esta estructura. Secciones 1–7 son obligatorias. El objetivo: un agente Código recibe este archivo y no necesita leer ninguna otra fuente para implementar.

---

## P-XX — [Nombre de la pantalla en lenguaje de negocio]

**Fecha:** YYYY-MM-DD · **Estado:** [propuesta / aprobado] · **Fase:** FX · **Ruta:** `/app/erp/...` · **Roles:** [rol1, rol2]

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, direccion_obra, tipo_proyecto, costosOperativos, comercial_id | Header: nombre, estado, tipo, dirección, costos |
| `clientes` | §3 Comercial | id, nombre, documento, telefono | HybridClientSelector |
| ... | | | |

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `borrador` | "Enviar cotización" | `cotizado` | E-09 | — |
| `cotizado` | "Generar contrato" | `en_revision` | E-12 | ∃ items_variante con cantidad > 0 |
| ... | | | | |

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Lead" | `activa` | `proyectos.estado` |
| "Propuesta" | `enviada` | `proyectos.estado` |
| "Orden de compra" | — | `ordenes_compra` (nunca "OC") |
| ... | | |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Suma de hitos = valor_total ±0.01 | Servidor, al guardar | Test: hitos [40,35,25] con valor_total=100 → OK |
| R2 | No se crea OC sin schema aprobado (E-18) | Guard en POST /api/erp/ordenes-compra | Test: POST sin E-18 → 422 |
| R3 | ... | | |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `HeaderProyecto` | Server + Client | `proyecto: Proyecto, editable: boolean` | `proyectos` | `--color-primary`, `Fraunces` |
| `EspacioCard` | Client | `espacio: EspacioVariante, onUpdate` | `espacio_variantes` | 11 CollapseStrips, `--radius-md` |
| `ItemRow` | Client | `item: ItemVariante, catalogo: ProductoCatalogo[]` | `items_variante` | MoneyInput, SmartSearch, badge "Referencial" |
| ... | | | | |

**Patrones M-06 L1 usados:** [useSmartSearch, useDebounce, MoneyInput, Suspense, ...]

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `Promise.all([proyectos, clientes, parametros])` | — | — |
| 2 | Cambiar estado | Drag-drop / menú "Cambiar estado →" | `PATCH /api/erp/proyectos/:id {estado}` | `eventos` registra E-09 | E-09 |
| 3 | Auto-save | `useEffect` + debounce 2s | `PUT /api/erp/proyectos/:id` | `eventos` registra mutación | — |
| 4 | ... | | | | |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/cotizador/` |
| CA-3 | 5 gates documentados con predicado SQL | `grep -c "P18\|P20\|P21\|P24\|P33"` ≥ 5 |
| CA-4 | Todos los labels usan H07 (no hay strings sueltos) | `grep -r "'[A-Z]" app/erp/cotizador/` = 0 resultados |
| CA-5 | Componente X renderiza campos A,B,C del REGISTRO_DE_ENTIDADES tabla Y | `grep "campoA\|campoB\|campoC" components/...` ≥ 3 |
| CA-6 | Test de regla R1: hitos suman exacto | `npx tsx __tests__/cotizador/hitos.test.ts` → PASS |
| ... | | | |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md`
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)
