# P-20 — Garantía (Reporte Cliente + Gestión ERP)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F5 · **Rutas:** `/cuenta/garantia` (cliente) + `/app/erp/garantia` (ERP) · **Roles:** cliente, desarrollador, comercial, gerente

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`).*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `casos_garantia` | §8 Producción | id, proyecto_id, modulo_id, descripcion, fotos, estado, dentro_garantia_contractual, fecha_reporte, diagnostico, solucion_aplicada | Entidad central del caso |
| `proyectos` | §3 Comercial | id, nombre_proyecto, estado, cliente_id, direccion_obra | Contexto del proyecto entregado |
| `modulos` | §8 Producción | id, nombre_modulo, tipo_modulo, estado, padre_id | Árbol del proyecto: cliente selecciona módulo específico |
| `clientes` | §3 Comercial | id, nombre | Reportado por |
| `ordenes_trabajo` | §8 Producción | id, tipo ('garantia'), proyecto_id, estado | Orden de reparación |
| `citas_garantia` | §8 Producción | id, caso_id, fecha, diagnosticado_por, resultado | Visita de diagnóstico |
| `reprocesos` | §6 Desarrollo | id, proyecto_id, origen ('garantia'), modulo, estado | Reproceso de taller por falla |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — | Cliente reporta | `reportado` | — | ∃ proyecto entregado (E-26), cliente autenticado |
| `reportado` | Desarrollador agenda visita | — (crea `citas_garantia`) | — | — |
| `reportado` | Desarrollador diagnostica | `diagnosticado` | — | `diagnostico` no vacío |
| `diagnosticado` | Crear orden de garantía | `en_reparacion` | — | Crea `ordenes_trabajo(tipo='garantia')` |
| `diagnosticado` | Disparar reproceso (falla de taller) | `en_reparacion` | E-54 | `dentro_garantia_contractual=true` |
| `en_reparacion` | Reparación completada | `resuelto` | — | `solucion_aplicada` no vacía |
| `resuelto` | Cerrar caso | `cerrado` | — | — |

---

## 3. Vocabulario H07 (labels visibles)

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Reportar garantía" | — | `casos_garantia` (creación) |
| "Reportado" | `reportado` | `casos_garantia.estado` |
| "Diagnosticado" | `diagnosticado` | `casos_garantia.estado` |
| "En reparación" | `en_reparacion` | `casos_garantia.estado` |
| "Resuelto" | `resuelto` | `casos_garantia.estado` |
| "Cerrado" | `cerrado` | `casos_garantia.estado` |
| "Dentro de garantía" | — | `casos_garantia.dentro_garantia_contractual` |
| "Visita de garantía" | — | `citas_garantia` |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Solo proyectos en estado `entregado` pueden recibir reportes de garantía | Servidor: `proyectos.estado='entregado'` | Test: POST con proyecto en `armado` → 422 |
| R2 | `dentro_garantia_contractual` = `fecha_reporte ≤ proyectos.fecha_entrega + 2 años` | Servidor, automático al crear | Test: proyecto entregado hace 3 años → false |
| R3 | Si el cliente selecciona un módulo, `modulo_id` se registra; si no, es un caso general del proyecto | — | — |
| R4 | Fotos: máx 5, máx 10MB c/u, JPG/PNG | Cliente + servidor | Test: 6 fotos → error |
| R5 | El cliente solo ve sus propios casos | `WHERE cliente_id = session.clienteId` | Test: cliente B no ve casos de cliente A |
| R6 | Al crear orden de garantía, `ordenes_trabajo.tipo='garantia'` | Servidor | Test: tipo = 'garantia' |

---

## 5. Componentes UI

### 5a — Vista Cliente (`/cuenta/garantia`)

| Componente | Tipo | Props | Entidad asociada |
|---|---|---|---|
| `GarantiaListaCliente` | Server + Client | `casos: CasoGarantia[]` | `casos_garantia` |
| `GarantiaCard` | Client | `caso, proyecto` | `casos_garantia`, `proyectos` |
| `ReportarGarantiaModal` | Client (Radix Dialog) | `proyectos[], onSuccess` | `proyectos`, `modulos` |
| `ArbolProyectoSelector` | Client | `modulos: ModuloTree[], onSelect` | `modulos` (árbol recursivo) |
| `FotoUpload` | Client | `onChange: (files: File[]) => void` | — |
| `GarantiaDetalleCliente` | Server + Client | `caso, proyecto, modulos` | `casos_garantia`, `proyectos`, `modulos` |

### 5b — Vista ERP (`/app/erp/garantia`)

| Componente | Tipo | Props | Entidad asociada |
|---|---|---|---|
| `GarantiaKanban` | Client | columnas por estado | `casos_garantia` |
| `GarantiaCard` | Client | `caso, proyecto, cliente` | `casos_garantia`, `proyectos`, `clientes` |
| `DiagnosticoModal` | Client (Radix Dialog) | `caso, onDiagnosticar` | `casos_garantia` |
| `CrearOrdenGarantiaBtn` | Client | `caso, onCreate` | `casos_garantia`, `ordenes_trabajo` |
| `AgendarVisitaBtn` | Client | `caso, onAgendar` | `casos_garantia`, `citas_garantia` |
| `ResolverCasoModal` | Client | `caso, onResolver` | `casos_garantia` |

**Patrones M-06 L1 usados:** Radix Dialog, Suspense, Promise.all, Toast, Badge `material`, MoneyInput (no — sin precios), SmartSearch (para buscar cliente/proyecto en ERP)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cliente abre portal | `/cuenta/garantia` mount | `GET /api/cuenta/garantia?clienteId=X` | — | — |
| 2 | Cliente reporta | Submit `ReportarGarantiaModal` | `POST /api/cuenta/garantia` | `casos_garantia.estado='reportado'`, calcula `dentro_garantia_contractual`, notifica al ERP | E-36 (gate: ¿dentro de garantía?) |
| 3 | Cliente sube fotos | Drop/select archivos | Upload a R2, guarda URLs en `fotos` | — | — |
| 4 | Desarrollador agenda visita | Click "Agendar visita" | `POST /api/erp/citas-garantia` | Crea `citas_garantia` | — |
| 5 | Desarrollador diagnostica | Submit `DiagnosticoModal` | `PATCH /api/erp/garantia/:id` | `diagnostico` + `estado='diagnosticado'` | — |
| 6 | Crear orden de garantía | Click "Crear orden" | `POST /api/erp/ordenes-trabajo` | `ordenes_trabajo(tipo='garantia')` + `estado='en_reparacion'` | E-37 |
| 7 | Disparar reproceso | Click "Reproceso" | `POST /api/erp/reprocesos` | `reprocesos(origen='garantia')` | E-54 |
| 8 | Resolver caso | Submit `ResolverCasoModal` | `PATCH /api/erp/garantia/:id` | `solucion_aplicada` + `estado='resuelto'` | — |
| 9 | Cerrar caso | Click "Cerrar" | `PATCH /api/erp/garantia/:id` | `estado='cerrado'` | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | R1: POST con proyecto no entregado → 422 | Test: `npx tsx __tests__/garantia/reporte.test.ts` |
| CA-3 | R2: garantía contractual = true si ≤2 años, false si >2 años | Test calcula fecha |
| CA-4 | R5: cliente B no ve casos de cliente A | Test: GET con sesión B → array no incluye caso de A |
| CA-5 | R6: orden creada con tipo='garantia' | Test: GET /api/erp/ordenes-trabajo/:id → tipo='garantia' |
| CA-6 | Árbol del proyecto renderiza módulos recursivos (`padre_id`) | Playwright: verifica que un módulo con hijos muestra sub-nodos |
| CA-7 | `modulo_id` nullable: crear caso sin módulo → OK | Test: POST sin modulo_id → 201 |
| CA-8 | Kanban ERP muestra columnas por estado | Playwright: 6 columnas (reportado..cerrado) |
| CA-9 | Cliente ve historial de sus casos + estado actual | Playwright: lista muestra casos del cliente con badge de estado |
| CA-10 | Fotos: máx 5, cada una JPG/PNG ≤10MB | Test unitario del validador |
