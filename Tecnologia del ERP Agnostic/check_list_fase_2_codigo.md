# Matriz de Diseño Axiomático, TGS y Checklist de Fase 2 (Código)

## 1. Cruce Final: Diseño Axiomático de Nam P. Suh y TGS

| Functional Requirement (FR) - Teleología | Design Parameter (DP) - Interfaz | Subsistema (TGS) | Axioma de Independencia (Desacople) | Axioma de Información (Minimalismo) | Zaps y Loops Asociados |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR1:** Transformar materia. | **DP1:** Ficha de Taller (Kanban). | Taller / Producción | El taller no sabe cuánto cuesta la tabla ni qué banco paga. Solo dicta requerimientos técnicos. | Harold solo ve la lista técnica de su proyecto activo. Cero menús contables. | `zap_convertir_orden_en_obligacion` |
| **FR2:** Comprar insumos óptimos. | **DP2:** `WidgetArmadoOrdenCompra.tsx` | Aprovisionamiento | Compras no fabrica, solo recibe FR1 técnico y busca el mejor postor para crear la deuda oficial. | Compras solo ve: Ítems pedidos, Proveedores, Subir Cotización. | `zap_convertir_orden_en_obligacion` |
| **FR3:** Controlar la entropía del dinero (Caja). | **DP3:** `FinanceLedger.tsx` y Modales | Finanzas / Admin | Finanzas no pide madera. Solo aprueba salidas de dinero de sus `cuentas_financieras`. | El contador solo ve obligaciones de pago pre-armadas en un tablero ultra-limpio. | `zap_registrar_pago_obligacion`, `zap_anular_movimiento` |
| **FR4:** Pagar esfuerzo humano. | **DP4:** `WidgetRegistroHoras.tsx` | Equipo General | El empleado no manipula nómina. Solo reporta el insumo de tiempo real invertido por proyecto. | El operario solo ve un botón grande: "Registrar Horas de Hoy". | `zap_generar_nomina_quincenal` |
| **FR5:** Transparencia de utilidades. | **DP5:** `PanelCierreProyecto.tsx` | Directivos / Socios | La liquidación no depende de excel manipulable, depende del cruce determinista en DB (Horas y Materiales). | Botón de un clic: "Liquidar Utilidades 5% Socio". | `zap_liquidar_utilidades_proyecto` |

---

## 2. Checklist Estricto de Artefactos para Codificar (Fase 2)

### A. Zaps Backend (El Cerebro) - Ubicación: `storage/[tenant]/db/scripts.json`
- [ ] **`zap_convertir_orden_en_obligacion`**: Recibe carrito técnico de Aprovisionamiento -> Crea `obligacion_pendiente`.
- [ ] **`zap_registrar_pago_obligacion`**: Valida que exista comprobante (foto) -> Crea movimiento -> Actualiza deuda a "Pagada".
- [ ] **`zap_anular_movimiento`**: Cambia estado a anulado -> Revierte `monto_pagado` en la obligación.
- [ ] **`zap_generar_nomina_quincenal`**: Escanea `registro_horas` (multiplica por `costo_hora`) -> Crea obligaciones de nómina precisas.
- [ ] **`zap_liquidar_utilidades_proyecto`**: Formula: `Ingresos - (Materiales + Costo Laboral Oculto) = Utilidad`. Saca 5% a Harold.

### B. Componentes Front-End (Interfaces TSX) - Ubicación: `src/components/specialized/`
- [ ] **Aprovisionamiento:** `WidgetArmadoOrdenCompra.tsx` (La UI para verificar técnica y disparar compras).
- [ ] **Producción:** `WidgetRegistroHoras.tsx` (Fricción cero para marcar asistencia/horas amarradas al proyecto).
- [ ] **Finanzas:** `FinanceLedger.tsx` (Panel maestro para Finanzas con el historial de cajas y deudas).
- [ ] **Finanzas:** `ModalLiquidarObligacion.tsx` (Exige selector de banco origen y subida nativa de comprobante de pago).
- [ ] **Métricas/Admin:** `PanelCierreProyecto.tsx` (Donde se ven los KPIs finales y se dispara la utilidad).
- [ ] **Navegación Core:** `WorkspaceSwitcher.tsx` (El menú central Matrushka que aísla visualmente los entornos según el rol).

### C. Schemas y Base de Datos (Completados - Fase 1) - Ubicación: `storage/[tenant]/db/`
- [x] Schemas financieros (Cuentas, Obligaciones, Categorías, Movimientos, Comprobantes).
- [x] Schemas de control (Registro_horas, costo_hora en usuarios_equipo, estado de pagos).
- [x] Inyección semilla (Miembros del equipo con salarios calculados, taxonomía de gastos).

### D. Reglas Inquebrantables del Repositorio (Engine Rules)
1. **Blindness Architectural:** No inyectar lógica de negocio en `packages/`.
2. **Registro de Bloques:** Todo componente UI nuevo se registra en `agnostic.config.ts`.
3. **Zaps Nativos:** Los scripts deben vivir como entidades de base de datos (`scripts.json`), ejecutables asíncronamente vía `/api/engine`.
4. **Ergonomía UI:** Uso irrestricto de **Shadcn UI** (Vibrante, dark-mode, minimalista, limpio, sin emojis distractores).
