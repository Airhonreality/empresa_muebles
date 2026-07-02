# 🗺️ Cruce de Acciones UI, Esquemas y Zaps del ERP (Trazabilidad Técnica)

Este documento mapea cada elemento interactivo (botones de acción, checkboxes, triggers) de los tableros Comercial y Producción contra los esquemas de datos JSON mutados y los scripts de servidor (Zaps) que se ejecutan a través de `/api/engine`.

---

## 🏛️ 1. Módulo Comercial (CRM Ventas)

### Acción UI A: Crear / Editar Cotización
* **Ubicación:** Botón principal en la vista de cotizaciones o botón "Ver Cotización" de la card.
* **Componente:** `CotizadorPro.tsx`
* **Esquemas Mutados:**
  - `proyectos`: Crea o edita el proyecto principal en estado `'activa'` (Lead).
  - `espacio_variantes` & `items_variante`: Crea la estructura de espacios e insumos cotizados para el proyecto.
* **Zap Requerido:** N/A (Escritura directa a la base a través de la API `/api/vault`).

### Acción UI B: Generar Contrato Borrador
* **Ubicación:** Botón principal "Generar Contrato" expuesto en etapa `'enviada'` si el proyecto no tiene contrato.
* **Componente:** `ComercialCard.tsx` (Trigger Fitts' Law)
* **Zap Requerido:** `generar_contrato`
  * *Comportamiento:* Lee el proyecto y los espacios, calcula los totales, y escribe un nuevo registro en `contratos` con un código autogenerado y el estado `'pendiente'`.
* **Esquemas Mutados:**
  - `contratos`: Inserta el registro de contrato asociado al proyecto.

### Acción UI C: Registrar Abono / Anticipo Financiero
* **Ubicación:** Panel inline `AbonoPanel` que se despliega desde el botón del signo de dólar.
* **Componente:** `ComercialCard.tsx`
* **Esquemas Mutados:**
  - `abonos_contrato`: Inserta el registro del abono con el estado `verificado: false`.
* **Zap Requerido:** `registrar_abono_y_activar`
  * *Comportamiento:* Registra el abono, vincula la transacción y, si es el primer anticipo (50%), puede cambiar el estado del contrato a `'firmado'`.

### Acción UI D: Activar Producción (Paso Comercial a Taller)
* **Ubicación:** Botón principal "Activar Producción" expuesto en etapa `'en_contrato'` o `'pre_produccion'`.
* **Componente:** `ComercialCard.tsx` (Trigger Fitts' Law)
* **Zap Requerido:** `zap_activar_produccion`
  * *Comportamiento:* 
    1. Cambia el estado del proyecto a `'produccion'`.
    2. Crea el registro en `ordenes_trabajo` con estado `'pendiente'` y código de OT único.
    3. Genera automáticamente las obligaciones financieras de pago fraccionado (`obligaciones_pendientes` tipo `'por_pagar'`).
    4. Crea las tareas básicas de taller en `tareas_produccion` vinculadas a la nueva orden.
* **Esquemas Mutados:**
  - `proyectos`: `data.estado` cambia a `'produccion'`.
  - `ordenes_trabajo`: Inserta la orden de trabajo.
  - `tareas_produccion`: Inserta el plan de tareas pendientes de taller.
  - `obligaciones_pendientes`: Inserta las cuentas por cobrar / pagar iniciales.

---

## 🏛️ 2. Módulo de Producción (Control de Taller)

### Acción UI E: Completar Tarea de Armado In-Situ
* **Ubicación:** Checkbox de tarea (48px de hitbox táctil) expuesto en la columna central de la fila de proyecto.
* **Componente:** `ProductionCard.tsx`
* **Esquemas Mutados:**
  - `tareas_produccion`: Cambia `data.estado` a `'completada'`.
* **Zap Requerido:** N/A (Actualización optimista e inmediata mediante `/api/vault` con acción `WRITE`).

### Acción UI F: Cambiar Estado de Orden (Kanban Transition)
* **Ubicación:** Botón principal contextual (ej: "Iniciar Fabricación", "Iniciar Instalación") o menú desplegable de fase.
* **Componente:** `ProductionCard.tsx` (Trigger Fitts' Law)
* **Esquemas Mutados:**
  - `ordenes_trabajo`: Cambia `data.estado` a `'en_proceso'`, `'instalacion'`, o `'entregada'`.
* **Zap Requerido:** N/A (Actualización directa vía `/api/vault`).

### Acción UI G: Validar Insumos / Anular Materiales (Módulo Sheets)
* **Ubicación:** Casilla de anulación o inputs de texto de especificaciones en la cuadrícula "Sheets".
* **Componente:** `ProjectDetails.tsx` (Pestaña 1 - Planillas de Insumos)
* **Esquemas Mutados:**
  - `items_variante`: Modifica `data.anulado` a `true` o añade notas en `data.notas_compra`.
* **Zap Requerido:** N/A (Persistencia mediante `/api/vault` con acción `WRITE`).

### Acción UI H: Agregar Ítem Manual de Fabricación
* **Ubicación:** Fila inferior "+ Agregar Insumo Manual..." en el grid de la Ficha.
* **Componente:** `ProjectDetails.tsx`
* **Esquemas Mutados:**
  - `items_variante`: Inserta un nuevo registro asociado al espacio variante activo del proyecto con el flag `manual: true`.
* **Zap Requerido:** N/A (Llamada `WRITE` directa).

### Acción UI I: Generar Orden de Compra de Materiales
* **Ubicación:** Botón de acción principal en la pestaña 1 de la Ficha o botón consolidador en el carrito de la Central.
* **Componente:** `ProjectDetails.tsx` o `WidgetArmadoOrdenCompra.tsx`
* **Zap Requerido:** `zap_generar_orden_compra`
  * *Comportamiento:* 
    1. Agrupa los insumos seleccionados que tengan un proveedor válido y que no hayan sido comprados previamente (`compra_generada` no es `true`).
    2. Inserta una orden en `compras_materiales` para cada proveedor.
    3. Inserta una cuenta por pagar en `obligaciones_pendientes` (`tipo: 'por_pagar'`).
    4. Escribe `compra_generada: true` en los `items_variante` para bloquear compras redundantes.
* **Esquemas Mutados:**
  - `compras_materiales`: Inserta los registros de compra.
  - `obligaciones_pendientes`: Inserta las cuentas por pagar al proveedor.
  - `items_variante`: Actualiza `compra_generada: true`.

---

## 🏛️ 3. Módulo de Finanzas (Central de Tesorería)

### Acción UI J: Conciliar Pago / Pago de Compra
* **Ubicación:** Botón de conciliación en el registro de obligaciones o subida de soporte.
* **Componente:** `ObligacionesPanel.tsx`
* **Zap Requerido:** `zap_conciliar_movimiento`
  * *Comportamiento:* Actualiza el estado de la cuenta por pagar/cobrar en `obligaciones_pendientes` a `'pagado'`, crea el registro contable y notifica la liquidación.
* **Esquemas Mutados:**
  - `obligaciones_pendientes`: `data.estado` cambia a `'pagado'`.
