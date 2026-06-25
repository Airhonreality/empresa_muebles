# Diagrama Conceptual de Interfaces y Zaps (Ergonomía Cognitiva)

Este documento mapea la ubicación física y lógica de los botones que disparan la inteligencia algorítmica (Zaps) dentro del ERP Agnostic.

```mermaid
graph TD
    %% WORKSPACE PRODUCCIÓN
    subgraph Workspace Producción [Workspace Producción - Tablet Taller]
        A[Kanban: Tarjeta de Proyecto]
        
        %% WIDGET CROSS-DOMAIN (Innovación + Human-in-the-Loop)
        A -->|Importa Ítems Comerciales| B(Widget: Armado Órdenes de Compra)
        B -->|Humano Verifica/Ajusta| B2[Lista Pendiente]
        B2 -.->|Acumula >7 Ítems o Envío Manual| Z1[zap_convertir_orden_en_obligacion]
        
        %% WIDGET HORAS
        A -->|Widget Operativo| C(Form: Registrar Horas Hoy)
        C -.->|Botón: 'Registrar'| BD[(Base de Datos: registro_horas)]
    end

    %% ZAP INVISIBLE
    Z1 -.->|Efecto Silencioso| OP[(Crea Deuda en Finanzas)]

    %% WORKSPACE FINANCIERO
    subgraph Workspace Financiero [Workspace Finanzas - PC/Admin]
        D[Panel: Obligaciones Pendientes] --> E[Deuda: Proveedor / Nómina]
        E -->|Modal de Pago| F(Input: Cuenta Origen + Foto Comprobante)
        F -.->|Botón: 'Liquidar Pago'| Z2[zap_registrar_pago_obligacion]

        G[Ledger: Historial de Movimientos] --> H[Fila: Transacción Específica]
        H -.->|Botón Rojo: 'Anular'| Z3[zap_anular_movimiento]
        
        I[Panel: Análisis de Rentabilidad] --> J[Proyecto Finalizado]
        J -.->|Botón: 'Calcular Utilidad 5%'| Z4[zap_liquidar_utilidades_proyecto]
        
        K[Panel: RRHH / Nómina] -.->|Botón Master: 'Correr Quincena'| Z5[zap_generar_nomina_quincenal]
    end
```

### Detalle de Componentes TSX Propuestos:

1. **`WidgetArmadoOrdenCompra.tsx` (En Workspace Producción)**
   - **Ubicación:** Dentro de la vista de detalle de un proyecto en el taller.
   - **Teleología (Axioma de Verificación):** No transfiere la lista comercial ciegamente. Permite a Harold importar los `items_variante` cotizados y verificar/ajustar especificaciones técnicas reales (ej. cambiar tamaño de tornillos, tipo de bisagra) uno por uno hacia una lista oficial.
   - **Ergonomía y Zaps:** Acumula los ítems verificados en un "carrito" (Lista pendiente de compra). Al acumular 7 elementos o forzar el envío, agrupa todo y dispara el `zap_convertir_orden_en_obligacion`, enviando un único bloque limpio al Ledger Financiero.

2. **`ModalLiquidarObligacion.tsx` (En Workspace Finanzas)**
   - **Ubicación:** Al darle clic a una "Cuenta por Pagar" o "Nómina Pendiente".
   - **Campos:** Selector de `cuenta_origen` (Ej. Nequi Javier) y FilePicker nativo para el comprobante.
   - **Acción:** Dispara `zap_registrar_pago_obligacion`.

3. **`BotonAnular.tsx` (En Workspace Finanzas)**
   - **Ubicación:** Al final de cada fila de la tabla del Ledger.
   - **Ergonomía:** Es un ícono discreto (papelera o flecha atrás). Al hacer clic pide confirmación (Doble fricción para evitar errores por fatiga de clic). Dispara `zap_anular_movimiento`.

4. **`PanelCierreProyecto.tsx` (En Workspace Finanzas / Admin)**
   - **Ubicación:** Vista de estadísticas de un proyecto completado.
   - **Acción:** Muestra un resumen de horas (KPIs) y un botón verde principal "Liquidar Utilidades Harold (5%)". Dispara `zap_liquidar_utilidades_proyecto`.

5. **`BotonGenerarNomina.tsx` (En Workspace Finanzas)**
   - **Ubicación:** Dashboard global financiero (Header superior).
   - **Acción:** Un botón maestro que procesa automáticamente las horas de los últimos 15 días y puebla el panel de obligaciones.
