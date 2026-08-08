# REGISTRO DE ENTIDADES — V3 "Veta Dorada Real"

**Estado:** PROMOVIDO 2026-08-07 (Ciclo H Fase 3). **Contrato vivo del schema.**
**Regla de supremacía:** si este documento difiere de cualquier otra fuente (`schema.ts`, `OLA_6_*`, `d3_schema_consolidado.md`, planes F0-F9), **gana este**. Toda decisión de naming aquí declarada es canónica.

**Fuentes consolidadas:** trazabilidad punto-0 (9 lotes, 48 tablas verificadas), `d3_schema_consolidado.md` (65 tablas), `OLA_6_*`, `schema.ts` (F0/legacy), decisiones D-2026-08-07*.

---

## 0. Precedencia de fuentes (regla declarada)

```
D-2026-08-07* (decisiones nuevas del Supervisor) > FLAG4 / OLA_6 (catálogos) > d3_schema_consolidado (núcleo 65 tablas)
```

---

## 1. Cimientos F0 — Identidad, auditoría, parámetros

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `roles` | Catálogo de roles | 7 roles canónicos (`admin, comercial, desarrollador, compras, taller, finanzas, supervisora_qa`). Los guards evalúan contra el rol, no la persona. | 1—N `personas_roles` |
| `personas` | Identidad de negocio | Persona física (nombre, documento, teléfono). Dueña de todos los FKs de dinero y asignación de roles. Separada de `usuarios` (login). | 1—N `personas_roles`; referenciada por `usuarios.persona_id` |
| `personas_roles` | Asignación persona→rol | Una persona puede tener N roles. Tabla puente con `activo`, `desde`. Sustituye `usuarios.rol_empleado`. | FK→`personas`, FK→`roles` |
| `parametros` | Parámetros del negocio | Valores configurables sin deploy (SLA, comisiones, tarifas, retenciones, transiciones). Un solo valor vigente por clave + CHECK de exclusión. | 1—N `parametros_historial` |
| `parametros_historial` | Historial de parámetros | Append-only. Quién cambió qué, cuándo, valor anterior/nuevo, motivo. | FK→`parametros`; FK→`usuarios` (actorId) |
| `eventos` | Auditoría única del dominio | 61 tipos de evento (E-01..E-61). Append-only. Cada fila = una entidad mutada. Vínculo causal (`eventoReferenciaId`). Contexto de negocio vía FKs (`leadId/clienteId/proyectoId/contratoId`). **Reemplaza `audit_logs` (deprecado).** | FK→`usuarios`; self-FK; FK→`leads/clientes/proyectos/contratos` |
| `procedencia` | Linaje del dato | "Este dato nació de este otro en este evento". UNIQUE(`hijoEntidad`,`hijoId`). Escrita en la misma transacción que la mutación. | — |

**Deprecado:** `audit_logs` → absorbido por `eventos` + `procedencia` (decisión A.4).

---

## 2. Catálogo — Productos, materiales, acabados, taxonomía (FLAG4)

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `categorias` | Taxonomía maestra | Tabla centralizada de categorías. Jerarquía opcional (`padre_id`). Reemplaza las columnas `categoria_comercial`, `segmento_comercial`, `categoria_tienda`. | self-FK; FK desde `productos_catalogo`, `productos_tienda` |
| `productos_catalogo` | Catálogo base | Tabla compartida. Un producto puede ser insumo interno, mueble terminado, herramienta o herraje. **Migrar a FLAG4:** `tipo_catalogo` CHECK + extensiones 1:1. | FK→`proveedores`, FK→`categorias`; 1—1 `productos_tienda` / `materiales_insumos` |
| `productos_tienda` | Producto de tienda | Extensión 1:1 de `productos_catalogo` para productos publicables en web. Precio fijo (`valor_tienda`), inventario, margen, imágenes comerciales. | FK 1:1→`productos_catalogo`; FK→`categorias`; 1—N `pedidos_web` |
| `materiales_insumos` | Material / insumo | Extensión 1:1 para insumos de producción (melamina, bisagras, herrajes). Lote mínimo, SLA estimado, punto reorden, compatibilidad. | FK 1:1→`productos_catalogo`; N—1 `bom_materiales`, `items_orden_compra` |
| `catalogo_acabados` | Vocabulario de acabados | **Nombre canónico** (singular). CLASE compartida por nodo (instancia) y catálogo (clase). Familia, tipo, color, textura, precio diferencial. | 1—N `acabados_muestras`, `catalogo_producto_acabados`, `modulos_acabados` |
| `acabados_muestras` | Muestras visuales de acabado | Imagen web, disponibilidad, compatibilidad con insumo (tablero A + acabado X). | FK→`catalogo_acabados` |
| `catalogo_producto_acabados` | Acabados posibles de un producto | Puente CLASE: qué acabados aplican a este producto de catálogo. `es_default`. | FK→`productos_catalogo`, FK→`catalogo_acabados` |

**Naming resuelto:** `catalogo_acabados` (singular, no `catalogos_acabados` ni `productos_acabados`).

---

## 3. Comercial — Leads, clientes, cotizaciones

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `leads` | Captación / embudo | Entrada por cualquier canal. Estado, canal, SLA de primera respuesta, conversaciones. **Conservado** (CF-01: no se fusiona con clientes). | FK→`clientes` (cuando convierte); 1—N `conversaciones`; FK→`procedencia` |
| `clientes` | Cliente | Identidad del cliente. `etapa_funnel` (snapshot del embudo, escrito en E-51). | 1—N `proyectos`, `visitas`, `pedidos_web`, `obligaciones_pendientes` |
| `conversaciones` | Historial de contacto | Canal, mensajes, hora de primera respuesta. | FK→`clientes` / `leads` |
| `citas` | Agenda de visitas | Franja, tipo (`visita`), reagenda (máx 1). | FK→`clientes` |
| `visitas` | Registro de visita | Observaciones, medidas, fotos. | FK→`citas`, FK→`proyectos` |
| `proyectos` | Proyecto / cotización | **Unidad central del negocio.** Estados canónicos: `borrador → en_revision → cotizado → desarrollo → aprobado_compras → armado → verificado → instalado → entregado / perdida / cancelada`. `verificado` y `aprobado_compras` son internos (no visibles al cliente). | FK→`clientes`; FK→`personas` (comercial, verificador); 1—N `espacio_variantes`, `contratos`, `modulos` |
| `cotizaciones` | Snapshot de cotización | Versión congelada del proyecto al momento de cotizar. | FK→`proyectos` |
| `disenos3d` | Diseño 3D | Estado (`propuesto/pagado/descontado`), precio (configurable vía `parametros.bruto_diseno_3d`). | FK→`proyectos` |
| `espacio_variantes` | Espacio del proyecto | Cocina, closet, estudio. Variantes alternativas (una activa). | FK→`proyectos`; 1—N `items_variante`, `modulos` |
| `items_variante` | Ítem de cotización | Línea de producto dentro de la variante. `es_referencial` + `fuente_referencial` + `grupo_referencial` (C2). | FK→`espacio_variantes`, FK→`productos_catalogo` |

---

## 4. Contratos

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `contratos` | Contrato | Código único, valor total (NO se toca — CC-10), plazos, especificaciones compiladas, garantía. Estados: `borrador → firmado`. | FK→`proyectos`; 1—N `hitos_pago`, `cambios_contrato` |
| `hitos_pago` | Plan de pagos | 1:N ligado al contrato. Tipo (`percentage/fixed`), monto, razón, fecha límite. Suma exacta = `valor_total`. | FK→`contratos`; 1—N `obligaciones_pendientes` (E-56) |
| `firmas_contrato` | Firma virtual | **DIFERIDO** (subsistema capa 1). Token, fecha. | FK→`contratos` |
| `disponibilidad_cliente` | Disponibilidad del cliente | Cuestionario de viajes, situaciones externas. Alimenta cronograma. | FK→`contratos`, FK→`proyectos` |
| `cambios_contrato` | Cambios / adicionales | Tipo (`adicional/cambio/reproceso`), impacto medible, costo. Dispara E-33. | FK→`contratos` |

---

## 5. Cronograma y control

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `estimaciones` | Estimación inicial | Valor, cantidad módulos, duración estimada, factor de crecimiento. | FK→`proyectos` |
| `cronogramas` | Cronograma maestro | Fecha de fijación, base (configurable vía `parametros.base_semanas_cronograma`), holgura total (configurable vía `parametros.holgura_maxima_dias`). Doble línea (contractual/interna). | FK→`proyectos`, FK→`estimaciones` |
| `cronograma_etapas` | Etapas del cronograma | Línea (`contractual/interna`), etapa (`aprobacion/compras/ensamblaje/instalacion`), fechas, jornadas. | FK→`cronogramas` |
| `desfases_cronograma` | Desfases | Causa (`interna/externa/cambio_contrato`), motivo, composición causal, nuevas fechas. Disparado por E-33. | FK→`proyectos`, FK→`cronograma_etapas` |
| `novedades_criticas` | Novedades / incidentes | SLA 5-24h, estado (`abierta/en_atencion/resuelta/escalada`). | FK→`proyectos`, FK→`personas` (escaladoA) |
| `check_produccion` | Check de producción por proyecto | Gate de control disparado por el cronograma del proyecto (no calendario fijo). Evalúa: insumos en taller, pagos realizados, fila de producción. 3 desenlaces: `todo_bien` (adelanta E-25), `novedad` (acción correctiva), `extremo` (comisiones reducidas E-35). El umbral de novedad vive en `parametros.umbral_novedad_check`. **Renombrado desde `check_15_dias` por corrección axiomática (2026-08-07).** | FK→`proyectos` |
| `comunicaciones_progreso` | Comunicación al cliente | Progreso / adelanto de instalación. Visible al cliente. | FK→`proyectos` |

---

## 6. Desarrollo y schema

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `retomas` | Toma de medidas post-contrato | Medidas, electrodomésticos, anomalías detectadas. | FK→`proyectos` |
| `schemas_proyecto` | Schema / BOM versionado | Estado (`borrador/en_desarrollo/para_revision/aprobado_compras/rechazado/en_reproceso`). Gate E-18. | FK→`proyectos`; 1—N `bom_materiales`, `verificaciones` |
| `bom_materiales` | Lista de materiales (BOM) | Cantidad, unidad, origen (`cotizacion/desarrollo`), `homologable`, linaje al ítem de cotización. | FK→`schemas_proyecto`, FK→`productos_catalogo`, FK→`items_variante` |
| `verificaciones` | Gate de verificación | Multipropósito: `tipo_gate` (`schema/recepcion/calidad`). Veredicto (`aprobado/rechazado/rechazado_total/reproceso_parcial`). Verificador único. **Absorbe `veredictos_calidad`.** | FK→`proyectos`, FK→`personas` (verificador) |
| `reprocesos` | Reprocesos | Origen (`schema/calidad/instalacion`), culpable, granularidad módulo/componente. | FK→`proyectos` |

---

## 7. Compras y proveedores

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `proveedores` | Proveedor | **Ampliado** (D-2026-08-07-B): teléfono comercial, dirección despacho, ciudad, medio de pago, `dias_entrega_default`, transportadora, tarifa flete. | 1—N `proveedores_contactos`, `ordenes_compra`, `catalogo_proveedor` |
| `proveedores_contactos` | Contactos del proveedor | Múltiples personas de contacto por proveedor. | FK→`proveedores` |
| `catalogo_proveedor` | Puente producto↔proveedor | Qué proveedor vende qué insumo, `sla_dias` específico, precio negociado. | FK→`proveedores`, FK→`materiales_insumos` |
| `ordenes_compra` | Orden de compra | **7 estados:** `solicitada → aprobada → en_pago → pagada → recibida_verificada / rechazada / cancelada`. `mecanica_pago` (`anticipo_saldo/unico/subcontratacion`). `fecha_recepcion_esperada`, `tiempo_entrega_dias`. | FK→`proyectos` (nullable, E-45 operativa), FK→`proveedores`; 1—N `items_orden_compra`, `recepciones_material` |
| `items_orden_compra` | Ítems de la OC | Cantidad esperada, `recibidoCantidad`, `sinDefectos`. Checklist de recepción por ítem. | FK→`ordenes_compra`, FK→`productos_catalogo` |
| `recepciones_material` | Recepción de material | **Nombre canónico.** Triple verificación (`checkPedidoBien/checkDespachoBien/checkMaterial`). Rol que ejecuta registrado en `eventos`. | FK→`ordenes_compra`, FK→`proyectos` |
| `herramientas` | Herramientas de taller | Estado, valor, foto. Reposición → OC operativa (`origen='operativa'`). | FK→`proveedores` |

**Naming resuelto:** `recepciones_material` (no `recepciones` a secas).

---

## 8. Producción — Módulo jerárquico

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `modulos` | Módulo (unidad de trazabilidad) | **Árbol recursivo** (`padre_id` self-FK). Ciclo de vida completo: diseño → compras → armado → verificación → despacho → instalación → garantía. Gates por nodo (no por proyecto). **Reemplaza `modulos_armado`.** | FK→`proyectos`, FK→`espacio_variantes`; 1—N `modulos_artefactos`, `modulos_acabados`; self-FK |
| `modulos_artefactos` | Assets de producción por nodo | Imagen, plano de armado, modelo 3D. `fuente` (`heredado_catalogo/dedicado_proyecto`). | FK→`modulos` |
| `modulos_acabados` | Acabados elegidos por nodo | Puente INSTANCIA: qué acabado del vocabulario se aplica a este módulo concreto. | FK→`modulos`, FK→`catalogo_acabados` |
| `ordenes_trabajo` | Orden de trabajo | Tipo (`produccion/garantia`), check de completitud. | FK→`proyectos`, FK→`pedidos_web`; 1—N `tareas_produccion` |
| `tareas_produccion` | Tarea de taller | Operario, descripción, estado. | FK→`ordenes_trabajo`, FK→`usuarios` (operario) |
| `citaciones_calidad` | Citación a verificación | `modulos_ids` (jsonb, subconjunto de nodos — despacho parcial). | FK→`proyectos` |
| `instalaciones` | Registro de instalación | Fecha, observaciones, fotos. Gate E-25. | FK→`proyectos` |
| `actas_entrega` | Acta de entrega | Firma, fotos, observaciones. Cierre E-26. | FK→`proyectos` |
| `casos_garantia` | Caso de garantía | Reporte del cliente (fotos, descripción, árbol del proyecto). `modulo_id` nullable (FK al módulo específico). Estados: `reportado → diagnosticado → en_reparacion → resuelto → cerrado`. `dentro_garantia_contractual` (boolean). | FK→`proyectos`, FK→`modulos` (nullable), FK→`clientes`; dispara `citas_garantia`, `ordenes_trabajo(tipo='garantia')`, `reprocesos` |
| `citas_garantia` | Visita de diagnóstico | Agenda de visita técnica al cliente para evaluar el caso. | FK→`casos_garantia`, FK→`proyectos` |

**Naming resuelto:** `modulos` (árbol recursivo) reemplaza `modulos_armado` (tabla plana legacy).

---

## 9. Finanzas

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `cuentas_financieras` | Cuentas | Caja, bancos, proveedores. Saldo calculado (SUM de movimientos). | 1—N `movimientos_financieros` |
| `movimientos_financieros` | Movimientos | Débito/crédito, monto, descripción. Transaccional atómico (actualiza saldo en mismo tx). Trazabilidad: `socio_id` (a quién se pagó), `orden_compra_id` (E-20), `obligacion_id` (qué deuda se está pagando), `medio_pago`, `comprobante_url`, `prioridad_pago`. | FK→`cuentas_financieras`, FK→`obligaciones_pendientes`, FK→`personas` (socio_id), FK→`ordenes_compra`, FK→`proyectos`, FK→`contratos` |
| `obligaciones_pendientes` | Todas las deudas del negocio | **UNIFICADA.** Un solo tipo de entidad para todo lo que se debe pagar o cobrar. `origen`: `contrato_hito` (cobro a cliente), `proveedor` (pago a proveedor), `diseno_3d` (pago al diseñador), `nomina` (salario/compensación a empleado), `comision` (comisión a socio), `arriendo` (pago de arriendo). Columnas de cálculo de comisión (`base_calculo`, `porcentaje`, `tipo_comision`, `cantidad_modulos`, `desfase_id`) son nullable — solo se llenan para `origen='comision'`. `hito_id` traza el origen en el contrato. `deduccion_diseno_3d` para E-30. `periodicidad` para arriendos. **Absorbe `comisiones`, `liquidaciones_compensacion` y `comisiones_proyecto`.** | FK→`contratos`, FK→`hitos_pago`, FK→`proyectos`, FK→`clientes`, FK→`proveedores`, FK→`personas` (beneficiario de comisión/nómina), FK→`desfases_cronograma` (causa de ajuste E-33→E-35) |
| `registros_horas` | Registro de horas | Una persona, un registro por día. Horas normales + extras. Alimenta compensación por horas (E-31) y KPI de bienestar (E-47). | FK→`personas` |
| `registros_gate_caja` | Traza del gate E-20 | Rama negativa del gate de caja: cuando un pago se bloquea por caja insuficiente, queda registrado aquí. Monto solicitado, saldo disponible, decisión del gerente, resolución. | FK→`ordenes_compra` |
| `facturas` | Facturas emitidas | Registro del hecho facturado (externo "Aliado"). Número, fecha, valor, estado, URL del documento. | FK→`contratos` |
| `parametros_compensacion` | Parámetros de compensación | % comisión desarrollador (5%), carpintero (5%), bruto diseño 3D ($130k), retención diseñador, IVA, etc. Valores que el negocio ajusta sin deploy. | — |
| `cuentas_cobro_proveedor` | Cuentas de cobro | **DIFERIDO a F6.** Registro de factura/recibo del proveedor. | FK→`proveedores`, FK→`ordenes_compra` |

### Tablas absorbidas / deprecadas en esta sección

| Schema anterior | Destino | Razón |
|----------------|---------|-------|
| `comisiones` | `obligaciones_pendientes` (`origen='comision'`) | Una obligación es una obligación — no importa si es cobro, pago o comisión |
| `liquidaciones_compensacion` | `obligaciones_pendientes` (`origen='nomina'`) | La nómina es un tipo de obligación, no una entidad separada |
| `comisiones_proyecto` | `obligaciones_pendientes` (columnas de cálculo nullable) | Metadatos de comisión como columnas opcionales en la obligación unificada |

---

## 10. Sitio público y tienda

| Schema | Nombre natural | Función en el sistema | Relaciones |
|--------|---------------|----------------------|------------|
| `pedidos_web` | Pedido de tienda | Carrito → checkout. `clienteId` siempre de sesión. Precio releído fresco del catálogo (no del cliente). Gap: no dispara producción automáticamente. | FK→`clientes`, FK→`productos_tienda`; 1—N `item_pedido` |
| `item_pedido` | Ítem del pedido | Cantidad, precio unitario (servidor, no cliente). | FK→`pedidos_web`, FK→`productos_tienda` |
| `colecciones` | Colecciones públicas | Agrupación de productos para vitrina web. | 1—N `productos_tienda` |
| `portafolio` | Casos de obra | Proyectos reales publicados, imágenes, sin precios. | FK→`proyectos` |
| `testimonios` | Reseñas / testimonios | **DIFERIDO** (E-55). Calificación, texto, cliente. | FK→`clientes`, FK→`proyectos` |

---

## 11. Tablas deprecadas o absorbidas

| Schema anterior | Destino | Razón |
|----------------|---------|-------|
| `audit_logs` | `eventos` + `procedencia` | Una sola fuente de verdad de auditoría (A.4) |
| `modulos_armado` | `modulos` (árbol recursivo) | D-2026-08-07-C: el módulo es unidad de trazabilidad, no fila de taller |
| `veredictos_calidad` | `verificaciones` | Absorbido en tabla multipropósito (consolidado d3) |
| `productos_acabados` | `catalogo_acabados` | Naming canónico unificado (D-2026-08-07-C) |
| `catalogos_acabados` | `catalogo_acabados` | Singular consistente con resto del schema |
| `recepciones` | `recepciones_material` | CF-03: naming explícito |
| `producciones` | No existe | Sin origen en ninguna fuente (L5, R1) |
| `comisiones` | `obligaciones_pendientes` (`origen='comision'`) | Unificación F6: toda deuda es una obligación |
| `liquidaciones_compensacion` | `obligaciones_pendientes` (`origen='nomina'`) | Unificación F6: nómina = tipo de obligación |
| `comisiones_proyecto` | `obligaciones_pendientes` (columnas de cálculo) | Unificación F6: metadatos como columnas opcionales |

---

## 12. Reglas de integridad (axiomas)

1. **Un solo dueño por dato:** cada campo tiene exactamente una tabla donde nace. No hay duplicación de verdad entre tablas.
2. **FKs de identidad apuntan a `personas`, no a `usuarios`:** `usuarios` es login; `personas` es identidad de negocio (CF-19).
3. **Clase ↔ instancia:** el catálogo define lo posible; el nodo elige. No se duplica ficha técnica en el módulo.
4. **Append-only en auditoría:** `eventos`, `parametros_historial` y `procedencia` nunca reciben UPDATE/DELETE de aplicación.
5. **Gates por nodo, no por proyecto:** despacho parcial es natural — cada `modulo.id` tiene su propio ciclo de gates (E-18, E-21, E-24, E-25, E-36).
6. **SLA por OC:** el tiempo de entrega real se fija en la `orden_compra` al negociar. Las estimaciones (`materiales_insumos.tiempo_entrega_dias`, `proveedores.dias_entrega_default`) son defaults que la OC puede sobrescribir.
