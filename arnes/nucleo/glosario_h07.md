# Glosario único de estados, verbos y términos de negocio — H07

**Estado:** artefacto de documentación · **Resuelve:** hallazgo **H07** (glosario único de estados y verbos de negocio)
**Fuentes:** `arnes/nucleo/logica_de_negocio.md` · `segunda_ronda_preguntas.md` · `cierre_diamante.md` · `diamante2_define_eventos.md` · `diamante2_discover_eventos.md` · `pasadas/d3_ui_b2_1_destilacion_inv.md` (reglas) · `pasadas/d3_ui_b1_1_ux_ergonomia.md` (principios) · `pasadas/d3_schema_consolidado.md` (65 tablas) · `pasadas/d3_ui_b3_1..b3_5.md` (labels por pantalla) · `pasadas/d4_a3_tokens_visuales.md` · `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` · `OLA_6_SCHEMAS_APROBADOS.md` · `lib/db/schema.ts` (columnas vivas)

---

## 0. Cómo consumir este artefacto (para fases F2+)

Todo label de botón, estado, mensaje y columna visible de la UI **se toma literalmente de aquí**.
- **Regla raíz (R02, `d3_ui_b2_1_destilacion_inv.md:72`):** toda etiqueta usa el término de **negocio**; jamás el nombre de tabla ni de columna Drizzle. `lote_minimo` nunca aparece; "Pedido mínimo" sí.
- **Regla raíz (P02, `d3_ui_b1_1_ux_ergonomia.md:58`):** el mismo estado se llama **igual en toda la app** y los verbos son los del negocio. Unifica variantes.
- El **backstage** (ERP) y el **frontstage** (portal cliente) comparten el mismo "concepto de negocio" pero pueden diferir en redacción (R03): el ERP muestra desfases/causas; el cliente solo ve la línea contractual y el cambio **positivo** (E-60) (`b1_1:67`, `define:108`).
- Cuando se escriba código, la fuente de verdad de estados en types se mantiene en `lib/db/schema.ts` (P02); el paso por traducción es el §B y §D de este documento.

**Ubicación de gobernanza (propuesta, no implementación):** módulo tipado `lib/modules/ui/glosario.ts` que exporte constantes tipadas de labels; las fases F2+ **leen este documento ANTES** de escribir cualquier label y regeneran/añaden entradas solo si el negocio cambia (regla del contrato vivo: `logica_de_negocio.md:207`).

---

## A. Glosario de entidades / términos de negocio

Fuente primaria del vocabulario natural: respuestas de Javier (`segunda_ronda_preguntas.md`) y narrativa del negocio (`logica_de_negocio.md`). La columna "Tabla(s) de origen" es el schema objetivo del consolidado (`d3_schema_consolidado.md`) y/o la tabla viva en `schema.ts`.

| Término natural (UI) | Sinónimos / variantes usadas | Tabla(s) de origen (schema) | Definición en lenguaje de negocio | Notas / fuente |
|---|---|---|---|---|
| Lead | prospecto, contacto, "chicharroncito chiquito" (coloquial, satírico, NO usar) | `leads` (+`clientes`) | Persona que llegó por web/IG/TikTok/WhatsApp y aún no compra; se atiende, califica y materializa a cliente. | `segunda_ronda:121`; `logica:113-125` |
| Cliente | comprador | `clientes` (+`leads.cliente_id`) | Lead convertido (E-51); identidad que tienen los proyectos y los pagos. | `define:51` (identidad compartida) |
| Visita | cita a domicilio, asesoría en obra | `citas`, `visitas` | Reunión gratis en el sitio cliente–comercial para tomar medidas/contexto del espacio. | `logica:128-133`; `discover:40` |
| Retoma (de medidas) | retoma, segunda visita de medición | `retomas` | Medición y verificación de detalles técnicos post-firma; bisagra Comercial→Desarrollo. | `logica:462`; `discover:63` |
| Propuesta | presupuesto, cotización, `/propuesta/:proyectoId` | `cotizaciones` (+`proyectos`) | Vista pública del proyecto: mismo cotizador evolutivo de preliminar a formal. | `logica:457-458`; `b3_1:258` |
| Diseño 3D | diseño pagado, render 3D | `diseños3d` | Modelo 3D pagado ($130k, facturado DIAN); se descuenta del anticipo al firmar. | `logica:135-137,460`; `cierre:37-38` |
| Contrato | contrato de obra | `contratos`, `firmas_contrato` | Documento que fija valor, hitos, cronograma y garantía; pasa de borrador a firmado. | `logica:478`; `discover:54` |
| Anticipo | adelanto, abono | `obligaciones_pendientes` (deducción) | Pago inicial que el sistema descuenta automáticamente (incluido el diseño 3D). | `logica:460`; `discover:102` (E-30) |
| Hito de pago | etapa de pago | `hitos_pago` | Fracción del valor (porcentaje o fijo) que el cliente paga; nace obligación (E-56). | `discover:54` (E-12), `discover:98` (E-56) |
| Esquema (schema) | `schema`, esquema de proyecto | `schemas_proyecto` | El "definidor" del proyecto: programado, verificable, versionable y auditable. | `cierre:11,24`; `b3_2:169` |
| BOM / Lista de materiales | lista de materiales, BOM, listado de compras | `bom_materiales` | Detalle de materiales que desencadena la compra; linaje desde la cotización. | `logica:466` (E-17); `consolidado:91` |
| Módulo | módulo de mueble, ítem | `modulos`, `items_variante` | Unidad de obra armable (cajón, gabinete, mesón...); granularidad del reproceso. | `logica:466,484`; `define:116` (C2) |
| Componente / Ítem | pieza, items | `items_variante`, `catalogo_componentes` | Pieza o ítem que compone un espacio; en el taller, unidad del reproceso. | `logica:466`; OLA6:149 |
| Cajón | gaveta | (espacio_variantes / items) | Elemento móvil de almacenamiento; término del taller y del cliente. | `logica:450,466`; `b3_1` (término R02) |
| Mesón | encimera, superficie | (espacio_variantes / items / contratos.especificaciones_mesones) | Superficie superior de trabajo; término del taller y del cliente. | `logica:123,466`; `schema.ts:66` |
| Herraje | herraje (bisagras, correderas, tiradores) | `catalogo_herrajes` (OLA6); `productos_catalogo` | Componentes móviles/de cierre de los muebles; catálogo de referencia. | `logica:344-350`; OLA6:19 |
| Espacio | espacio arquitéctonico, ambiente | `espacio_variantes`, `catalogo_espacios_arquitectonicos` | División donde se ubica el mueble (cocina, closet...); capa de la "matrioshka". | `segunda_ronda:16`; OLA6:194 |
| Variante | variante de espacio | `espacio_variantes` | Alternativa de diseño para un espacio (ej. "Inicial"). | `schema.ts:85-109` |
| Cronograma | plan de obra, fechas del proyecto | `cronogramas`, `cronograma_etapas` | Calendario doble (contractual inmutable + interna movible) desde el contrato. | `logica:250` (I-034) |
| Desfase | atraso, corrimiento | `desfases_cronograma` | Cambio de fechas con causa estructurada (interna/externa/cambio de contrato). | `logica:257`; `define:79` |
| Gate / Aprobación | control, checkpoint, check | `verificaciones`, `excepciones_gate` | Punto de control que no deja avanzar sin su guard (check de schema, recepción, calidad, cronograma, caja). | `logica:284-288`; `define:73-79` |
| Novedad crítica | incidente, alarma | `novedades_criticas` | Incidente del cronograma con SLA de respuesta 5–24 h. | `logica:258`; `discover:114` (E-34) |
| Orden de compra | pedido de compra; **NUNCA el acrónimo "OC" en la UI** (ni el Supervisor lo entiende — decisión H07 2026-08-05: desaparece del vocabulario visible, siempre expandido) | `ordenes_compra`, `items_orden_compra` | Pedido a proveedor con 3 mecánicas: anticipo+saldo, único, subcontratación. En el portal del cliente (F-07) no aplica ningún término de compras. | `logica:344-352`; `b3_3:54`; decisión H07 |
| Recepción verificada | recepción, recibo de material | `recepciones_material` | Material recibido tras la triple verificación (pedido, despacho, material). | `logica:59,286`; `define:76` |
| Armado | ensamble, ensamblaje, construcción | `ordenes_trabajo`, `modulos` | Construcción de los módulos en el taller. | `logica:444,484`; `define:41` |
| Verificación de calidad | calidad, control de calidad, citación de calidad | `citaciones_calidad`, `verificaciones` | Revisión pre-despacho por quien NO construyó (verificador único = comercial). | `logica:454,287`; `define:78` |
| Acta de entrega | acta, entrega | `actas_entrega` | Documento digital de entrega firmado; "segundo contrato", momento de verdad mayor. | `logica:476,546`; `discover:91` (E-26) |
| Instalación | puesta en obra | `instalaciones` | Montaje en sitio del cliente; rango de 5 días en la semana programada. | `logica:254,431`; `b3_3:329` |
| Garantía | caso de garantía | `citas_garantia`, `ordenes_trabajo` (tipo=garantía) | Atención hasta 2 años sobre estructura; 8–12 días hábiles. | `logica:484,432`; `discover:125-127` |
| Obligación / Pago | cuota, cobro, deuda del cliente | `obligaciones_pendientes` | Cuenta por cobrar (clientes) o por pagar (proveedores) ligada a un hito. | `logica:170`; `discover:98` (E-56) |
| Liquidación de comisión | comisión, nómina, compensación | `liquidaciones_compensacion`, `comisiones_proyecto` | Pago/compensación por rol atada al cumplimiento del cronograma. | `logica:220-222,269`; `define:32-35` |
| Proyecto | obra | `proyectos` | Trabajo de diseño+fabricación para un cliente; identidad llevada a entrega. | `logica:155`; `define:51` |
| Caja | caja, dinero disponible | `cuentas_financieras`, `movimientos_financieros` | Dinero real disponible; restricción máxima y gate bloqueante de pagos. | `logica:311,358`; `define:114` |
| Fila del taller | cola, avance por módulo | `modulos` | Estado de salida de cada módulo; input del check de 15 días. | `define:118` (B2); `b3_3:221` |
| Check de los 15 días | check 15, log de producción | `check_produccion` | Revisión a ~15 días con 3 desenlaces (adelanto / novedad / extremo). | `logica:251` (I-025) |
| Cuenta de cobro | micro cuenta, cobro del socio | `liquidaciones_compensacion` (E-32) | Documento autogenerado por cada registro transaccional del socio. | `logica:383-384`; `discover:105` (E-32) |
| Reposición (herramienta) | compra operativa | `herramientas`, `ordenes_compra` (origen=operativa) | Compra de herramienta/consumible no atada a proyecto. | `discover:75` (E-45) |

---

## B. Glosario de ESTADOS (máquinas de estado por concepto de negocio)

Convención: **label natural** = el término que se muestra (R02/P02). La columna "código interno" cita el valor de schema donde existe. Cuando una fuente fijó ya el label en pantalla, se indica en fuente.

### B.0 Proyecto (máquina global — unifica legacy + etapas de producción)

| Concepto de negocio | Estado (código interno) | Label natural aprobado para UI | Descripción breve |
|---|---|---|---|
| Proyecto | `borrador` | Borrador | Escrito en el cotizador; presupuesto preliminar, aún sin compromiso. `b3_1:297` |
| Proyecto | `en_revision` | En revisión | Propuesta publicada; el cliente ajusta. `b3_1:297`; `discover:44` |
| Proyecto | `cotizado` | Cotizado | Cotización formal cerrada. `b3_1:297`; `discover:47` |
| Proyecto | `en_contrato` (legacy `en_contrato`) | En contrato | Contrato firmado, retoma pendiente. `schema.ts` legacy 8 |
| Proyecto | `desarrollo` | En desarrollo técnico | Se modela y genera el schema/BOM. `define:75` (E-18); `b3_2:196` |
| Proyecto | `aprobado_compras` | Aprobado para compras | Check de schema aprobado; habilita pedidos (gate E-18). `define:75`; `consolidado:211` |
| Proyecto | `armado` | En armado | Materia ensamblándose en el taller. `b3_3:294` ("permanece en `armado`") |
| Proyecto | `verificado` | **(interno — el cliente ve "En armado")** | Calidad verificada (gate E-24); estado interno tras el veredicto. **Oculto al cliente:** este gate ya está resuelto, el cliente solo ve "En armado" hasta la instalación. `discover:83`; decisión H07 resuelta 2026-08-05 |
| Proyecto | `en_instalacion` | En instalación | Se está instalando en obra (sale de `armado` por E-25). `b3_3:351` |
| Proyecto | `instalado` | Instalado | Instalación terminada. `b3_3:352` |
| Proyecto | `entregado` | Entregado | Acta firmada; proyecto cerrado. `b3_3:419`; `discover:91` |
| Proyecto | `perdida` | Perdido (no viable) | Proyecto no viable; solo registra motivo (E-49). `b3_1:291`; `discover:38` |
| Proyecto | `cancelada` | Cancelado | Cancelado con confirmedación (type-to-confirm). `schema.ts` legacy |
| Proyecto | `enviada`/`pre_produccion`/`produccion` (legacy) | (legacy — se sustituye por los aditivos de arriba en Fase 3) | Valores legacy del enum a migrar 1:1. `consolidado:239`; `schema.ts:5` |

> **Estado de proyecto (resuelto 2026-08-05):** existe el estado interno `verificado` (tras gate E-24, `discover:83`); **el cliente solo ve "En armado"** hasta la instalación — los gates internos (verificado, aprobado_compras) no se muestran como estados del proyecto al cliente. La lista canónica del enum es la de A2-1-14 (8 legacy + borrador/en_revision/cotizado/desarrollo/aprobado_compras/armado/verificado/instalado), aprobada como fuente única. **Nota de lente:** el glosario traduce labels, NO define gates ni sus máquinas de estado — esos viven en el consolidado schema (`d3_schema` E-18/E-24).

### B.1 Lead / embudo (`leads.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Lead | `nuevo` | Nuevo | Entró por un canal; sin atender. columna kanban "Nuevos" `b3_1:69` |
| Lead | `en_contacto` | En contacto | Se atendió por WhatsApp/IG; corre el SLA de primera respuesta (5 min). `b3_1:69,83` |
| Lead | `calificado` | Calificado | Cumple los 3 filtros de cualificación. `b3_1:84` |
| Lead | `descartado` | Descartado | No califica (geografía, tipo de proyecto); registra motivo. `b3_1:85` |
| Lead | `redirigido` | Redirigido | Se deriva (ej. marmolero); se registra destino. `b3_1:86` |
| Lead | `no_viable` | No viable | Presupuesto preliminar no viable (E-49). columna "No viables" `b3_1:69,87` |
| Lead | `cliente` | Cliente | Materializado (E-51); ya es cliente. `b3_1:88` |

### B.2 Cita / visita (`citas.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Cita | `agendada` | Agendada | Franja reservada para la visita. `b3_1:224` |
| Cita | `realizada` | Realizada | Visita ocurrió; se registran medidas. `b3_1:225` |
| Cita | `no_show` | No asistida | Cliente no se presentó; reagenda con límite (máx 1). `b3_1:226`; `define:140` |
| Cita | `cancelada` | Cancelada | Cita cancelada. `b3_1:246` |

### B.3 Contrato (`contratos.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Contrato | `borrador` | Borrador (no compromete entrega) | En edición; no debe parecer compromiso. `b3_1:360`; `define:14` |
| Contrato | `firmado` | Firmado | Firma digital completada; fija cronograma. `logica:478`; `b3_1:365` |
| Contrato | `cancelado` | Cancelado | Anulado (type-to-confirm). `b3_1:354` |

### B.4 Cambio de contrato (`cambios_contrato.estado`, flow I-027)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Cambio | `propuesto` | Propuesto | Cambio solicitado (adicional/cambio/reproceso). `b3_1:341` |
| Cambio | `aprobado` | Aprobado | Aprobado por gerente con impacto medible. `b3_1:352` |
| Cambio | `aplicado` | Aplicado | Ejecutado; dispara E-33 si afecta cronograma. `b3_1:353` |

### B.5 Diseño 3D (`diseños3d.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Diseño 3D | `propuesto` | Propuesto | Ofrecido; botón de pago disponible. `b3_1:286,303` |
| Diseño 3D | `pagado` | Pagado | El cliente pagó ($130k); pendiente descuento del anticipo. `b3_1:287,303` |
| Diseño 3D | `descontado` | Descontado | Ya se descontó del anticipo final (E-30). `b3_1:303` |

### B.6 Cotización (`cotizaciones.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Cotización | `borrador` | Borrador | En edición (autoguardado). `b3_1:300` |
| Cotización | `en_revision` | En revisión | Publicada; el cliente ajusta (snapshot congelado). `b3_1:289,297` |
| Cotización | `cotizado` | Cotizado | Formalizada. `b3_1:290,297` |

### B.7 Schema de proyecto (`schemas_proyecto.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Schema | `borrador` | Borrador | Versión en edición (versionado). `b3_2:194` |
| Schema | `para_revision` | Para revisión | Listo para veredicto del comercial vendedor. `b3_2:195` |
| Schema | `aprobado` (implícito por veredicto) | Aprobado | Check de schema aprobado (E-18). `b3_2:196` |
| Schema | `en_reproceso` | En reproceso | Rechazado; el desarrollador corrige (E-54). `b3_2:197` |

### B.8 Veredicto de gate (`verificaciones.veredicto`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Veredicto gate | `aprobado` | Aprobado | El verificador único aprobó (schema E-18 / calidad E-24). `b3_2:196`; `b3_3:294` |
| Veredicto gate | `rechazado` | Rechazado | Rechazo; abre reproceso (E-54). `b3_2:197`; `b3_3:295` |
| Tipo gate | `schema` / `calidad` | Schema / Calidad | Qué gate se verificó. `consolidado:40` |

### B.9 Orden de compra (`ordenes_compra.estado`, 7 valores CF-13)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| OC | `solicitada` | Solicitada | Creada. `b3_3:78` |
| OC | `aprobada` | Aprobada | Aprobada (guard E-18 si es de proyecto). `b3_3:79` |
| OC | `en_pago` | En pago | En proceso de pago (gate de caja E-20). `b3_3:80` |
| OC | `pagada` | Pagada | Pagada al proveedor. `b3_4:82` |
| OC | `recibida_verificada` | Recibida verificada | Triple verificación completa (E-21). `b3_3:139`; `define:76` |
| OC | `rechazada` | Rechazada | Cancelada/rechazada. `b3_3:44` |
| OC | `cancelada` | Cancelada | Cancelada (modal R18). `b3_3:81` |

### B.10 Recepción (`recepciones_material.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Recepción | `pendiente` | Pendiente | Aún no se verifica. `b3_3:158` |
| Recepción | `recibido_verificado` | Recibido verificado | Todos los ítems pasan (E-21); control pasa al taller. `b3_3:139,158` |
| Recepción | `recibido_defectuoso` | Recibido con defecto | Se reporta defecto → reproceso (E-54). `b3_3:158` |

### B.11 Citación / calidad

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Citación calidad | `citada` | Citada | El desarrollador empujó la citación (E-23, señal). `b3_3:293` |
| Citación calidad | `en_verificacion` | En verificación | En revisión de la ventana. `consolidado:116` |
| Citación calidad | `verificada` | Verificada | Verificación realizada. `consolidado:116` |

### B.12 Instalación (`instalaciones.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Instalación | `programada` | Programada | Rango de 5 días asignado. `b3_3:341` |
| Instalación | `en_curso` | En curso | En proceso en obra (E-25). `b3_3:351` |
| Instalación | `instalada` | Instalada | Terminada. `b3_3:352` |
| Instalación | `fallida` | Fallida | Falló en sitio → reproceso (E-54). `b3_3:353` |

### B.13 Acta de entrega (`actas_entrega.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Acta | `pendiente` | Pendiente de firma | Generada; falta firma del cliente. `b3_3:400,408` |
| Acta | `firmada` | Firmada | Firma completada; cierra el proyecto (E-26). `b3_3:402,410` |

### B.14 Obligación / cobro (`obligaciones_pendientes.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Obligación | `pendiente` | Pendiente | Por vencer. `b3_4:141` |
| Obligación | `atrasada` | Atrasada | Venció; pasó la holgura de 12 días → aviso al gerente (E-29). `b3_4:150` |
| Obligación | `pagada` | Pagada | Cobrada (E-28). `b3_4:141` |
| Tipo obligación | `por_cobrar` / `por_pagar` | Por cobrar / Por pagar | Cliente paga / proveedor cobra. `define:114`; `consolidado:18` |

### B.15 Desfase / cronograma (`desfases_cronograma.causa`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Causa desfase | `interna` | Causa interna | Origen en producción; las comisiones se reducen. `b3_2:279` |
| Causa desfase | `externa` | Causa externa | Origen externo (cliente/proveedor/dinero); se corren plazos. `b3_2:280` |
| Causa desfase | `cambio_contrato` | Cambio de contrato | Tercer origen del flujo I-027; recalcula cronograma. `b3_2:280`; `define:23` |
| Línea etapa | `contractual` / `interna` | Línea contractual (inmutable) / Línea interna (movible) | Doble línea del cronograma (I-034). `b3_2:277` |

### B.16 Check de los 15 días (`check_produccion.desenlace`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Check 15 | `todo_bien` | Todo listo | Se adelanta la instalación (E-60 positivo). `b3_2:384,394` |
| Check 15 | `novedad` | Novedad | Incidente; se pospone línea interna, comisiones se reducen. `b3_2:385,395` |
| Check 15 | `extremo` | Situación extrema | Máximo estrés; se escala y se negocia con el cliente. `b3_2:386,396` |

### B.17 Novedad crítica (`novedades_criticas.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Novedad | `abierta` | Abierta | Puesta; corre el SLA 5–24 h. `b3_2:331` |
| Novedad | `escalada` | Escalada | Escalada al gerente. `b3_2:332` |
| Novedad | `resuelta` | Resuelta | Resuelta con `cumplio_sla`. `b3_2:333` |

### B.18 Fila del taller / módulo (`modulos.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Módulo | `por_armar` | Por armar | En cola del taller. `b3_3:234` |
| Módulo | `en_armado` | En armado | Ensamblándose. `b3_3:234` |
| Módulo | `armado` | Armado | Ensamblado. `b3_3:234` |
| Módulo | `en_calidad` | En calidad | En espera de verificación. `b3_3:234` |
| Módulo | `aprobado` | Aprobado | Verificado por calidad. `b3_3:234` |
| Módulo | `en_instal` | En instalación | Ya salió a instalar. `b3_3:234` |

### B.19 Herramienta (`herramientas.estado` / `estado_operativo`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Herramienta | `operativa` | Operativa | En uso normal. OLA6:144 |
| Herramienta | `mantenimiento` / `mantenimiento_programado` | Mantenimiento | Programada para mantenimiento/calibración. OLA6:144 |
| Herramienta | `reparacion` | En reparación | En arreglo. OLA6:144 |
| Herramienta | `fuera_servicio` | Fuera de servicio | Retirada. OLA6:144 |
| Herramienta | `necesita_reposicion` | Necesita reposición | Dispara OC operativa (E-45). `b3_3:196` |

### B.20 Orden de trabajo (`ordenes_trabajo.tipo` / `origen`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Tipo orden | `produccion` | Producción | Orden de taller. `b3_5:134` |
| Tipo orden | `garantia` | Garantía | Orden de garantía (E-37). `b3_5:137` |
| Origen orden | `proyecto` / `pedido_web` / `operativa` | Proyecto / Pedido web / Operativa | De dónde salió la orden. `b3_3:259`; `b3_5:90` |

### B.21 Caso de garantía (`casos_garantia.estado`)

| Concepto de negocio | Estado (código interno) | Label natural aprobado | Descripción breve |
|---|---|---|---|
| Garantía | `reportado` | Reportado | Cliente reportó el caso (fotos + descripción). `disenio_P20_garantia.md` |
| Garantía | `diagnosticado` | Diagnosticado | Desarrollador visitó y diagnosticó la causa. `disenio_P20_garantia.md` |
| Garantía | `en_reparacion` | En reparación | Orden de garantía o reproceso en curso. `disenio_P20_garantia.md` |
| Garantía | `resuelto` | Resuelto | Reparación completada, solución documentada. `disenio_P20_garantia.md` |
| Garantía | `cerrado` | Cerrado | Caso cerrado. `disenio_P20_garantia.md` |

---

## C. Glosario de VERBOS / acciones

Regla (P02): un solo verbo por acción; el mismo verbo no significa dos cosas. Columna "pantalla(s)/gate" indica dónde se usa.

| Acción de negocio | Verbo / label único para UI | Pantalla(s) / gate | Condición (guard/rama) |
|---|---|---|---|
| Calificar el lead | Calificar | P-01/P-02 (E-03) | requiere score 1–10; estado `en_contacto` |
| Descartar el lead | Descartar | P-01/P-02 (E-04) | irreversilbe con motivo (R18) |
| Redirigir el lead | Redirigir | P-01/P-02 (E-04) | requiere destino |
| Marcar presupuesto no viable | Marcar no viable | P-01/P-04 (E-49) | solo registra motivo, no bloquea |
| Convertir lead en cliente | Crear cliente | P-01/P-02 (E-51) | requiere estado `calificado` |
| Agendar visita | Agendar | P-03/F-12 (E-06) | franja libre + cliente |
| Registrar visita realizada | Marcar realizada | P-03/P-02 (E-07) | estado `agendada` |
| Marcar inasistencia | Marcar no asistida | P-03/P-02 (E-46) | límite V-1: si falla 2 veces → descarta |
| Reagendar cita | Reagendar | P-03/P-02 (E-46) | máximo 1 reagenda |
| Confirmar cita (cliente) | Confirmar cita | F-12 (E-06) | datos + franja |
| Pedir diseño 3D | Pedir diseño 3D | P-04 (E-48) | no duplicar si ya `propuesto` |
| Pagar diseño 3D | Pagar diseño 3D | F-02 (E-08) | si `propuesto`; dinero nace en Finanzas |
| Proyectar estimación | Proyectar estimación | P-04 (E-52) | estimación → cronograma |
| Publicar propuesta | Publicar propuesta | P-04 (E-09) | requiere ≥1 espacio |
| Formalizar cotización | Formalizar cotización | P-04 (E-11) | requiere `en_revision` |
| Crear borrador de contrato | Crear borrador | P-05 (E-12) | valor_total + hitos |
| Enviar para firma | Enviar para firma | P-05 (E-13) | estado `borrador` |
| Firmar el contrato (cliente) | Firmar | F-07/P-05 (E-13) | wizard firma digital |
| Completar cuestionario de viajes | Completar cuestionario de viajes | P-05 (E-53) | post-firma, no bloquea |
| Crear cambio de contrato | Crear cambio | P-05 (E-16) | adicional/cambio/reproceso |
| Aprobar cambio de contrato | Aprobar cambio | P-05 (E-16) | rol gerente; impacto medible |
| Aplicar cambio de contrato | Aplicar cambio | P-05 (E-16) | requiere `aprobado`; dispara E-33 |
| Anular contrato | Anular contrato | P-05 | type-to-confirm (D1) |
| Cerrar retoma | Cerrar retoma | P-07 (E-15) | medidas mínimas |
| Marcar anomalía en retoma | Marcar anomalía | P-07 (E-16) | dispara cambio de contrato |
| Subir schema | Subir schema | P-08 (E-17) | version +1 |
| Marcar schema para revisión | Marcar para revisión | P-08 (E-17) | si hay schema |
| **Aprobar schema** | Aprobar schema | P-08 (gate **E-18**) | verificador único = comercial vendedor |
| Rechazar schema | Rechazar schema | P-08 (E-18) | detalle requerido → reproceso |
| Generar modelo 3D | Generar modelo 3D | P-08 (E-38) | solo con schema aprobado (E-18) |
| Enviar a corte | Enviar a corte | P-08 (E-39) | requiere modelo generado |
| **Reprocesar módulo** | Reprocesar módulo | P-08/P-14/P-17/P-18 (E-54) | modal R18; recalcula cronograma/comisiones |
| Crear OC | Crear orden de compra | P-13 (E-19) | items + proveedor |
| Aprobar OC | Aprobar OC | P-13 (E-19) | si proyecto, requiere E-18 |
| Registrar pago OC | Registrar pago | P-13→P-20 (E-20) | gate de caja P20 bloqueante (gerente) |
| Cancelar OC | Cancelar OC | P-13 | modal R18 |
| Registrar OC operativa (reposición) | Registrar OC operativa | P-13 (E-45) | herramientas a reponer |
| **Confirmar recepción** | **Confirmar recepción** | P-14 (gate **E-21**) | checklist C3 completo (P21); predicado interno `recibido_verificado` no cambia |
| Reportar defecto de material | Reportar defecto | P-14 (E-54) | culpable requerido (D2) |
| Marcar reposición de herramienta | Marcar reposición | P-15 (E-45) | dispara OC operativa |
| Avanzar módulo en fila | Avanzar módulo | P-16 (E-22) | si `estado≠aprobado` |
| Enganchar pedido web | Enganchar pedido | P-16/P-24 (E-44) | pedido pendiente |
| Citar calidad | Citar calidad | P-17 (E-23, señal) | módulos en citación |
| **Registrar veredicto** de calidad | **Registrar veredicto** | P-17 (gate **E-24**) | verificador único (comercial) |
| Iniciar instalación | Iniciar | P-18 (E-25) | requiere P24 (calidad) + rango |
| Marcar instalada | Marcar instalada | P-18 (E-25) | si `en_curso` |
| Reportar instalación fallida | Reportar fallida | P-18 (E-54) | motivo + módulo |
| Generar acta de entrega | Generar acta | P-19 (E-26) | instalación terminada |
| Enviar acta para firma | Enviar para firma | P-19 (E-26) | si generada |
| Registrar firma de acta | Registrar firma | P-19/F-07 (E-26) | cierra proyecto |
| **Aplicar desfase** | Aplicar desfase | P-09 (gate **E-33**) | causa+composición+motivo (P33) |
| Decisión manual de desfase | Decisión manual | P-09 (E-33/D4) | solo gerente; justificación |
| Crear comunicación de adelanto | Crear comunicación | P-09 (E-60) | solo si check 15 feliz |
| Registrar novedad crítica | Registrar novedad | P-10 (E-34) | descripción + fase |
| Escalar novedad | Escalar | P-10 (E-34) | estado `abierta` |
| Marcar novedad resuelta | Marcar resuelta | P-10 (E-34) | — |
| Confirmar check de 15 días | Confirmar check | P-11 (E-59) | requiere desenlace |
| Resolver gate de caja | Resolver gate | P-20 (E-20) | gerente; navega a cronograma (E-33) |
| Registrar cobro | Cobrar | P-21 (E-28) | monto ≤ pendiente |
| Notificar pago al cliente | Notificar | P-21 (E-27) | sistema (auto) |
| Registrar arriendo | Registrar arriendo | P-20 (E-57) | gerente |
| Aprobar liquidación | Aprobar liquidación | P-22 (E-31) | cálculo cerrado |
| Cerrar período de comisiones | Cerrar período | P-22 (E-35) | si no cerrado |
| Registrar pago a socio | Registrar pago | P-22 (E-31/E-57) | monto |
| Agendar garantía | Agendar garantía | P-25 (E-36) | dentro de ventana 8–12 |
| Crear orden de garantía | Crear orden | P-25 (E-37) | requiere agenda |
| Marcar completitud de garantía | Marcar completitud | P-25 (E-61) | todos los checks |
| Solicitar garantía (cliente) | Solicitar garantía | F-07 (E-36) | dentro de ventana |
| Dejar reseña (cliente) | Dejar reseña | F-07 (E-55) | texto + rating |
| Subir documento/foto | Subir archivo | P-26 (E-41) | tipo + etapa |
| Designar verificador | Designar verificador | P-12 (D3/I-035) | persona con rol comercial |
| Cambiar rol de persona | Asignar rol | P-12 | rol tipado |
| Acusar doble verificación (pago+desbloqueo) | — | R07 (`b2_1:77`) | verificación humana antes de automatizar |

---

## D. Mapa campo-de-schema → nombre natural

Son los campos "duros" que hoy confundirían a un usuario final (R02: un usuario NO debe ver el campo técnico). Se listan los de catálogo/negocio más sensibles + claves transversales.

### D.1 Catálogo / productos (código vivo `productos_catalogo` + objetivos OLA6)

| Campo (schema / tabla) | Tabla | Nombre natural para UI | Ejemplo de label/formato |
|---|---|---|---|
| `lote_minimo` | `materiales_insumos` (OLA6) | Pedido mínimo | "Pedido mínimo: 10 pliegos" |
| `lote_multiplo` | `materiales_insumos` (OLA6) | Presentación por caja / múltiplo | "Se ordena en múltiplos de 10" |
| `precio_directo` / `precio_directo_cop` | `productos_catalogo` · `catalogo_herrajes` | Costo de compra | "Costo de compra: $12.500" |
| `precio_publico` / `precio_publico_cop` | `productos_catalogo` · `catalogo_herrajes` | Precio de cotización | "Precio de cotización: $38.500" |
| `valor_tienda` | `productos_tienda` (OLA6) | Precio de venta (tienda) | "Precio de venta: $385.000" |
| `stock_actual` | `productos_catalogo` | Existencias | "Existencias: 24" |
| `punto_reorden_unidades` | `materiales_insumos`/`productos_tienda` | Punto de nuevo pedido | "Reponer al llegar a 50" |
| `unidad_medida` | `productos_catalogo` | Unidad | "metro / pieza / kg" |
| `tipo_catalogo` | `productos_catalogo` | Tipo de catálogo | "Producto / Insumo / Herramienta" (distingue los 3 universos; **no** es el flag `publicado_web`) |
| `publicado_web` | `productos_catalogo` | Visible en tienda | "Publicado en tienda" (solo productos terminados) |
| `requiere_instalacion` | `productos_tienda` (apor.) | Requiere instalación | "Requiere instalación: Sí" |
| `proyecto_origen_id` | `productos_catalogo` | Proyecto de origen | "Origen: Proyecto #12" |
| `sku` | `productos_catalogo` | Referencia (código) | "Ref: CHI-EU-18-2050" |
| `categoria_comercial` | `productos_catalogo` | Categoría | "Categoría: Cocinas" |
| `descripcion`/`descripcion_breve` | `productos_catalogo` | Descripción | — |
| `tiempo_entrega_dias` | `materiales_insumos` | Tiempo de entrega | "Entrega en 14 días" |
| `estado_operativo` / `estado` | `herramientas_maquinaria`/`herramientas` | Estado de la herramienta | "Operativa / En reparación" (§B.19) |

### D.2 Comercial / embudo

| Campo (schema) | Tabla | Nombre natural | Ejemplo |
|---|---|---|---|
| `estado` | `leads` | Etapa del lead | "En contacto" (§B.1) |
| `score_conversion` | `leads` | Score de conversión | "Score: 8/10" |
| `canal` | `leads` | Canal de origen | "web / Instagram / WhatsApp" |
| `destino_redireccion` | `leads` | Destino de redirección | "marmolero" |
| `motivo_no_viable` | `leads` | Motivo | "Motivo de no viabilidad" |
| `hora_primera_respuesta` | `leads` | Primera respuesta | "Respondido a las 10:03" |
| `reagendaConteo` / `reagenda_count` | `citas`/`leads` | Reagendas | "Reagenda: 1 de 1" |
| `medidas_tomadas` | `visitas` | Medidas tomadas | registro de medidas |
| `etapa_funnel` | `clientes` | Etapa en el embudo | "Cliente" (snapshot E-51) |

### D.3 Proyecto / producción

| Campo (schema) | Tabla | Nombre natural | Ejemplo |
|---|---|---|---|
| `nombre_proyecto` | `proyectos` | Nombre del proyecto | — |
| `estado` | `proyectos` | Estado del proyecto | §B.0 |
| `verificador_id` | `proyectos` | Verificador | "Comercial: {nombre}" |
| `fecha_entrada_desarrollo` | `proyectos` | Inicio de desarrollo | fecha |
| `jornadas_desarrollo_tecnico` / `_ensamblaje_taller` / `_instalacion_obra` | `espacio_variantes` | Jornadas de desarrollo / ensamble / instalación | "2 jornadas" |
| `dir_obra` / `direccion_obra` | `proyectos` | Dirección de obra | — |
| `costos_operativos` | `proyectos` | Costos operativos | cálculo servidor (R05) |
| `imprevistos_instalacion` | `proyectos` | Imprevistos de instalación | — |
| `descuento_comercial` | `proyectos` | Descuento comercial | — |
| `aplicaIva` / `porcentaje_iva` | `proyectos` | Aplica IVA / % IVA | — |

### D.4 Contrato / finanzas

| Campo (schema) | Tabla | Nombre natural | Ejemplo |
|---|---|---|---|
| `codigo_contrato` | `contratos` | N° de contrato | "CT-2026-001" |
| `valor_total` | `contratos` | Valor total | no editable (CC-10) |
| `plazo_ejecucion_texto` | `contratos` | Plazo de ejecución | "4 a 5 semanas" |
| `holgura_dias` | `contratos` | Días de holgura | "8" |
| `garantia_anios` | `contratos`/`proyectos` | Garantía | "2 años" |
| `tipo` | `hitos_pago` | Tipo de hito | "Porcentaje / Fijo" |
| `monto_o_porcentaje` | `hitos_pago` | Monto / % | "30%" |
| `razon` | `hitos_pago` | Motivo del hito | "Anticipo" |
| `monto_total` / `monto_pagado` | `obligaciones_pendientes` | Total / Pagado | "Total: $2M · Pagado: $600k" |
| `saldo_actual` | `cuentas_financieras` | Saldo de la cuenta | materializado reconciliado |
| `caja_disponible` (derivada E-20) | — | Caja disponible | cálculo servidor (R05) |
| `origen` | `obligaciones_pendientes` | Origen de la obligación | hito / arriendo / adicional… |

### D.5 Cronograma / control

| Campo (schema) | Tabla | Nombre natural | Ejemplo |
|---|---|---|---|
| `linea` | `cronograma_etapas` | Línea contractual / interna | §B.15 |
| `base_semanas` | `cronogramas` | Plazo base | "4 semanas" |
| `promesa_semanas` | `parametros` | Promesa contractual | "7 semanas" |
| `desfase.causa` | `desfases_cronograma` | Causa del desfase | §B.15 |
| `ventana_sla_horas` | `novedades_criticas` | Ventana de respuesta | "5–24 h" |
| `desenlace` | `check_produccion` | Resultado del check | §B.16 |
| `duracion_estimada_jornadas` | `estimaciones` | Duración estimada | "4 jornadas" |

---

## E. Reglas de uso (gobernanza del glosario)

1. **Quién lo mantiene:** el Supervisor (Javier) es el único que aprueba cambios de vocabulario que toquen contrato vivo; el Orquestador actualiza este documento. Modificarlo es mutación de `arnes/` (requiere checkpoint del Supervisor, `AGENTS.md`).
2. **Dónde vive en código (propuesta, NO implementación):** módulo tipado `lib/modules/ui/glosario.ts` exportando constantes tipadas (por ejemplo `LABELS_PROYECTO_ESTADO`, `VERBOS`) derivadas del §B/§C; los types de estado se mantienen en `lib/db/schema.ts` (P02, `b1_1:58`). El paso de traducción del valor de schema al label vive en este módulo, no esparcido en componentes.
3. **Consumo obligatorio:** toda fase F2+ que escriba un label **lee este documento primero** y toma el término de la columna "Label natural aprobado". No se inventa un término. **El acrónimo OC nunca aparece en la UI** (decisión H07).
4. **Regla de unicidad:** un mismo concepto de negocio tiene UN label (nunca dos) y el mismo verbo no significa dos acciones distintas (P02). Si un pasaje nuevo necesita un término, se añade aquí con traza a su fuente antes de usarlo en pantalla.
5. **Frontstage vs. backstage (R03):** el portal del cliente (`F-07`) usa los mismos conceptos pero redacta para el cliente: **nunca** causa interna, desfase, gate, comisión visible; solo estado del proyecto, progreso y el cambio positivo (E-60) (`b1_1:67`).
6. **Traza:** cada entrada cita su archivo de origen (columna fuentes). Este documento no inventa términos que no estén en el corpus.
7. **Nombres de tabla y columna prohibidos en UI:** salvo en documentos técnicos/código, jamás se muestran `lote_minimo`, `precio_directo`, `proyecto_origen_id`, ni relaciones entre tablas (R02, `b2_1:72`).

---

## F. Términos en conflicto que requieren decisión del Supervisor

1. **Estado de proyecto en E-24 (calidad):** B3-3 fija que el proyecto **permanece en `armado`** tras aprobar veredicto y solo E-25 lo saca a `en_instalacion` (`b3_3:294,320`), mientras `diamante2_discover` E-24 escribe `armado → verificado` (`discover:83`). **Decidido 2026-08-05:** existe el estado interno `verificado`; el cliente solo ve "En armado". Los gates internos no se muestran al cliente.
2. **Verbo de E-21 (recepción):** unificado a **"Confirmar recepción"** (verbo/label único de botón en P-14; decisión H07, 2026-08-05). El predicado interno `recibido_verificado` no cambia.
3. **Esquema de catálogo canónico:** FLAG-4 (`productos_catalogo` + especializaciones) es la evolución aprobada de Ola 6; `OLA_6_SCHEMAS_APROBADOS.md` (catalogo_herrajes/…) queda como predecesor histórico. **Decidido 2026-08-05.**
4. **Plural vs. singular en kanban de leads:** B3-1 usa encabezados plurales ("Nuevos/En contacto/Calificados/No viables", `b3_1:69`) mientras el estado es singular (`nuevo`, `en_contacto`...). **Decisión del Orquestador (H07, 2026-08-05):** el estado interno es **singular** (valor de schema/enum); la columna kanban lleva **plural** como encabezado de bucket. Es la convención que ya usa B3-1 (`b3_1:95`). Fijado.
5. **"OC" (orden de compra) en portal del cliente:** es jerga interna que ni siquiera el Supervisor reconoce como término visible. **Decisión H07 (2026-08-05):** desaparece del vocabulario visible de la UI. En el ERP (backstage) el label es **"Orden de compra"** (nunca el acrónimo). En el portal del cliente (F-07) no aplica ningún término de compras internas; el cliente ve solo el estado del proyecto ("En armado", "Instalado", etc.).
6. **Enum de proyecto "extendido" (A2-1-14):** aprobado como fuente canónica. La lista exacta (8 legacy + borrador/en_revision/cotizado/desarrollo/aprobado_compras/armado/verificado/instalado) se consolida en Fase 3 (backfill 1:1). **Decisión H07 (2026-08-05).**

---

## G. Dependencias pendientes detectadas

- **Glosario no bloqueado pero dependiente de:** resolución de las 6 decisiones de §F antes de congelar labels definitivos.
- **Migración de estados (Fase 3):** el backfill 1:1 de `proyectos.estado`/`ordenes_trabajo.estado`/`obligaciones_pendientes.estado` (text→enum, `consolidado:239`) debe ejecutarse de la mano de este glosario para que el label interno y el natural no divergan.
- **Registro en el índice del arnés:** este artefacto debería inscribirse en la navegación (p. ej. `arnes/INDEX.md` y/o el plano de gobernanza) — **no se modificó ningún archivo existente** por contrato de esta tarea (solo se creó este archivo); el registro queda como acción para el Orquestador.
- **Contrato vivo:** si Javier cambia vocabulario (p. ej. re-nombra "retoma", "esquema", "socios"), este documento se actualiza junto con `logica_de_negocio.md` (regla de contrato vivo, `logica:207`).
- **Frontstage (F-07):** los términos de avance al cliente (E-60) necesitan validación de redacción con copy, pero la semántica ya está fijada aquí.
