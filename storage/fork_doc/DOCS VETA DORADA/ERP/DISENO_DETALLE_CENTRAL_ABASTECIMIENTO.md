# 📐 Diseño de Detalle: Central de Abastecimiento (Procurement Center)

Este documento establece las especificaciones de diseño técnico, ergonomía visual y flujos de datos para el módulo **Central de Abastecimiento** (`src/components/specialized/WidgetArmadoOrdenCompra.tsx`). Eliminamos el selector manual de proyectos (reduciendo entropía y ruido pragmático) y lo transformamos en un motor automático de consolidación de insumos para proyectos en taller.

---

## 🏛️ 1. Principios de Diseño y Ergonomía Cognitiva

1. **Axioma de Consolidación Mínima (Nam P. Suh):**
   * *Problema:* Tener múltiples compras fragmentadas por proyecto causa ineficiencia logística, costos de flete redundantes y desorden en tesorería.
   * *Solución:* Agrupar automáticamente todas las necesidades de insumos del taller bajo una única vista consolidada, organizada por **Proveedor** o **Proyecto**.
2. **Eliminación del Ruido de Selección:**
   * *Implementación:* El taller no busca proyectos en un desplegable general. La Central consulta la API y recopila de manera proactiva todos los proyectos con estado comercial de `'produccion'` (es decir, aquellos con órdenes de trabajo activas en taller en etapas `'pendiente'`, `'en_proceso'` o `'instalacion'`).
3. **Biomecánica de la Compra Taller (Fitts' Law):**
   * *Implementación:* Los inputs de costo real y cantidad cuentan con hitboxes táctiles de **44px** de alto. Se proporciona un botón de un solo clic para "Procesar Compra Consolidada" colocado en la zona inferior derecha (área de confort del pulgar).

---

## 📐 2. Plano de UI Exacto (Diagramación de Bloques ASCII)

La pantalla se divide en un layout asimétrico de dos paneles (7 col / 5 col en escritorio) optimizado para pantallas de escritorio y tablets industriales:

```text
+-----------------------------------------------------------------------------+
2. CENTRAL DE ABASTECIMIENTO (Vista Unificada)                                |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [VISTA: POR PROVEEDOR (Activa)]         [VISTA: POR PROYECTO]               |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | PROVEEDOR: HERRAJES Y ACABADOS S.A.S. (4 items pendientes)            |  |
|  | +-------------------------------------------------------------------+ |  |
|  | | [ ] Item / Descrip.      | Cant. | Proveedor | Costo Sug. | Proy. | |  |
|  | | -------------------------+-------+-----------+------------+-------| |  |
|  | | [x] Bisagra Blum 110     | 24 un | Herrajes  | $12,000    | OT-04 | |  |
|  | | [x] Corredera Push       | 8 un  | Herrajes  | $45,000    | OT-06 | |  |
|  | +-------------------------------------------------------------------+ |  |
|  |                                                [AÑADIR AL CARRITO]    |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | PROVEEDOR: MADERAS DEL NORTE (1 item pendiente)                       |  |
|  | +-------------------------------------------------------------------+ |  |
|  | | [ ] Tablero MDF Roble 18 | 4 pl  | Maderas N.| $180,000   | OT-04 | |  |
|  | +-------------------------------------------------------------------+ |  |
|  |                                                [AÑADIR AL CARRITO]    |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
| CARRITO CONSOLIDADO (Panel Lateral Derecho)                                 |
| +-------------------------------------------------------------------------+ |
| | BISAGRAS BLUM (x24) - Herrajes S.A.S.                         $288,000  | |
| | CORREDERAS PUSH (x8) - Herrajes S.A.S.                        $360,000  | |
| | ----------------------------------------------------------------------- | |
| | TOTAL ESTIMADO COMPRA:                                        $648,000  | |
| | [ BOTON: PROCESAR OBLIGACIONES Y ORDEN DE COMPRA (Ambar, H-12, 48px) ]  | |
| +-------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------+
```

---

## 🗄️ 3. Flujo de Datos e Ingestión de Insumos

El algoritmo de la central opera en el cliente mediante las siguientes consultas relacionales:

1. **Paso 1: Obtener Órdenes de Trabajo Activas**
   * Consulta `ordenes_trabajo` donde `data.estado` sea `'pendiente'`, `'en_proceso'` o `'instalacion'`.
2. **Paso 2: Obtener Proyectos y sus Espacios**
   * Mapea cada orden de trabajo a su respectivo `proyecto_id`.
   * Carga los `espacio_variantes` asociados a esos proyectos.
3. **Paso 3: Extraer Ítems de Variante no Abastecidos**
   * Carga los `items_variante` asociados a los espacios activos.
   * Filtra los registros que cumplan las siguientes tres condiciones:
     1. `data.anulado` no es `true`.
     2. `data.compra_generada` no es `true`.
     3. Tienen un `catalogo_id` válido.
4. **Paso 4: Agrupación en Pantalla**
   * Agrupa los ítems resultantes por `proveedor_id` (resuelto a través de `productos_catalogo`).
   * Permite al jefe de taller seleccionar qué materiales desea consolidar y cargarlos en el **Carrito**.

---

## ⚡ 4. Acciones y Zaps Involucrados

Al presionar el botón **"Procesar Obligaciones y Orden de Compra"**, el sistema realiza los siguientes pasos técnicos:

1. **Llamada de API:** Envía un POST a `/api/engine` llamando al script `zap_generar_orden_compra`.
2. **Payload:**
   ```json
   {
     "items": [
       { "id": "item_variante_id_1", "cantidad": 24, "costo_real": 12000 },
       { "id": "item_variante_id_2", "cantidad": 8, "costo_real": 45000 }
     ]
   }
   ```
3. **Ejecución del Zap:**
   * Agrupa los ítems por proveedor de manera estricta.
   * Para cada proveedor, crea un registro en `compras_materiales` (estado: `'pendiente'`).
   * Crea la cuenta por pagar en `obligaciones_pendientes` (`tipo: 'por_pagar'`) cruzada con el proveedor e identificando los proyectos de origen en su metadata.
   * Actualiza los `items_variante` correspondientes en la base de datos escribiendo `compra_generada: true` y guardando el `costo_real` definido en la compra.
   * Dispara una notificación de éxito al taller.

---

## ⚠️ 5. Vectores de Entropía y Banderas de Control

* **🚩 Duplicidad por clics múltiples:** Mitigado bloqueando el botón de procesamiento en la UI con un spinner activo (`busy` state) y validando a nivel del Zap que los ítems no tengan el flag de `compra_generada` activo en el almacenamiento persistente antes de guardar.
* **🚩 Costos desactualizados:** El taller puede mutar el precio unitario antes de enviar en la columna "Costo Sugerido/Real". Este nuevo valor se guarda de forma persistente para alimentar el histórico de costos reales del proyecto.
* **🚩 Falta de Proveedor en Catálogo:** Resuelto asignando de forma automática a los ítems huérfanos un proveedor genérico `"Compras Directas Taller"` para evitar que se omitan en el consolidado.
