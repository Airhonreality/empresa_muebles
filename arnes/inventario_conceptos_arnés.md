# Inventario de Conceptos y Dependencias — Arnés Pregunta-Respuesta
## Veta de Oro ERP V3 "Veta Dorada Real"

**Estado**: Generado 2026-09-20 | **Fuente**: arnes/nucleo/ + arnes/lineas/ola7/  
**Alcance**: 87 conceptos clave del flujo Q-A de negocio  
**Estilo**: Técnico, trazable, auditoria de lógica de diseño

---

## Resumen ejecutivo

El arnés estructura un flujo pregunta-respuesta que responde **"¿cómo opera Veta de Oro de punta a punta?"** — desde captación de lead hasta garantía a 2 años. Tres capas de decisión:

1. **Flujo lineal visible al cliente** (Lead → Propuesta → Contrato → Entrega)
2. **Flujo técnico interno** (Desarrollo → Aprobación compras → Compras → Armado → Calidad)
3. **Flujo de control financiero** (Obligaciones → Pagos → Comisiones → Garantía)

Las dependencias radiales: todo depende de la **aprobación de schema (E-18)**, que es el único gate no negociable entre desarrollo y compras.

---

## MATRIZ DE CONCEPTOS

| Concepto (nombre natural) | Dependencias | Ubicación | Tipo | Notas |
|---|---|---|---|---|
| **A. CAPTACIÓN Y CALIFICACIÓN** |
| Lead / Prospecto | — | `leads` (E-01) | Entidad | Entrada por web/IG/TikTok/WhatsApp. Ciclo SLA 5 min respuesta. |
| Calificación de lead | Lead | E-03, `logica_de_negocio:§1` | Decisión | 3 filtros: comunicación clara + geografía (no sur) + tipo (diseño, no reparación). |
| Descarte / Redireccionamiento | Lead calificado | E-04, `glosario:295-296` | Verbo | Irreversible; se registra motivo. Redirigir a marmolero si aplica. |
| Conversión a Cliente | Lead calificado | E-51, `glosario:298` | Verbo | Genera `clientes.etapa_funnel = 'nuevo'` cuando se agenda primera visita. |
| Cliente | Conversión | `clientes` (E-51) | Entidad | Identidad persistente desde su primer proyecto hasta 2 años de garantía. |
| **B. COMERCIAL: VISITA Y PRESUPUESTO** |
| Visita gratis | Cliente | E-06, E-07 | Evento | Toma de medidas + observaciones. Genera `citas.estado='realizada'` y visitas.fotos. |
| Cita / Agenda de visita | Cliente | E-06, `glosario:299` | Entidad | Franja de comercial (máx 1 reagenda). Alimenta `disponibilidad_cliente`. |
| Artefacto del espacio | Visita | E-15, `glosario:30-32` | Entidad | Objeto concreto que condiciona diseño: determinante, bloqueante, electrodoméstico, obra civil. Medido mm + ubicación. |
| Presupuesto preliminar | Lead (sin visita) | `disenos3d`, `glosario:34` | Documento | Cotizador ligero; si es viable, abre visita. Si no, lead marcado no viable (E-49). |
| Diseño 3D pagado | Presupuesto formalizado | E-30, `glosario:35` | Entidad | $130k (bruto, configurable). Facturado DIAN. Se descuenta del anticipo al firmar contrato. |
| Propuesta / Cotización | Visita + Presupuesto | `cotizaciones` (E-13) | Documento | Snapshot congelado. Estados: borrador → en revisión → cotizado. Visible en `/propuesta/:proyectoId`. |
| **C. CONTRATO Y CRONOGRAMA** |
| Contrato | Cotización formalizada | `contratos` (E-14) | Documento | Fija valor (NO se toca — CC-10), plazos, especificaciones, garantía. Estados: borrador → firmado. |
| Firma virtual | Contrato borrador | `firmas_contrato`, E-16 | Evento | DIFERIDO a F6. Mechanic pendiente (sin blockchain). |
| Hito de pago | Contrato firmado | `hitos_pago` (E-12) | Entidad | 1-N por contrato. Tipo: porcentaje o fijo. Suma exacta = valor_total. Dispara obligaciones (E-56). |
| Anticipo | Hito de pago primero | E-56 | Obligación | Cliente paga antes de desarrollo. Descuento: -Diseño3D si aplica (E-30). |
| Disponibilidad del cliente | Contrato firmado | E-24bis (consulta) | Cuestionario | Viajes, situaciones externas. Alimenta cronograma. Pregunta antes de retoma. |
| Retoma de medidas | Contrato firmado | E-15, `glosario:29` | Evento | Segunda visita comercial + desarrollador. Verifica artefactos. Genera reproceso si hay anomalía (I-027). |
| Cambio de contrato | Retoma o desarrollo | I-027, `glosario:127-130` | Flow | Adicional/cambio/reproceso. Requiere impacto medible + costo. Dispara E-33 si afecta cronograma. |
| Cronograma maestro | Contrato firmado | `cronogramas` (E-17) | Documento | Doble línea: contractual (inmutable, cliente ve) + interna (movible, equipo usa). Base 7 semanas. |
| Cronograma doble línea | Cronograma | I-034, `glosario:225` | Patrón | Contractual (promesa) vs. interna (realidad). Desfases solo tocan interna. |
| Etapa de cronograma | Cronograma | `cronograma_etapas` | Entidad | Aprobación → Compras → Ensamblaje → Instalación. Fechas en jornadas. |
| Desfase de cronograma | Cambio/novedad en proyecto | E-33, `glosario:49` | Evento | Causa: interna/externa/cambio_contrato. Impacta comisiones si interna. |
| **D. DESARROLLO Y APROBACIÓN TÉCNICA** |
| Desarrollo técnico | Retoma completada | E-17, `glosario:82` | Fase | Modelado y BOM. Más bloqueante de todo (CC-2): "si desarrollo no está, no se clava tornillo". |
| Esquema / Schema | Desarrollo | `schemas_proyecto` (E-18) | Documento | Programado, verificable, versionable. Estados: borrador → para_revisión → aprobado_compras. |
| BOM / Lista de materiales | Schema | `bom_materiales` (E-17) | Documento | Desglosa materiales con cantidades, unidad, origen (cotización/desarrollo). Linaje a items. |
| Check de schema | Schema completo | E-18, `glosario:50` | Gate | Verificador único: comercial vendedor (D2, D3). Veredicto: aprobado/rechazado/reproceso. |
| Aprobación para compras | Check de schema aprobado | E-18 | Decisión | **Gate no negociable.** Habilita órdenes de compra. Proyecto avanza a estado `aprobado_compras`. |
| Reproceso de schema | Check rechazado | E-54 | Flow | Desarrollador recibe feedback, itera. Nuevo check con nuevo verificador. |
| **E. COMPRAS Y LOGÍSTICA** |
| Proveedor | — | `proveedores`, D-2026-08-07-B | Entidad | Teléfono comercial, dirección, ciudad, medio pago, días entrega, transportadora, tarifa flete. |
| Orden de compra | Schema aprobado | `ordenes_compra` (E-19) | Documento | 7 estados: solicitada → aprobada → en_pago → pagada → recibida_verificada / rechazada / cancelada. |
| Gate de caja | Orden en_pago | E-20, D1, `glosario:62` | Decision | Gerente decide: ¿hay saldo disponible? Si no: bloquea pago, mueve cronograma. **Única variable externa real.** |
| Recepción verificada | Orden pagada | E-21, `glosario:53` | Gate | Triple verificación: pedido (compras), despacho (proveedor), material (receptor). CheckList por ítem. |
| Herramientas | Operativas → Mantenimiento → Reposición | E-45, `glosario:267` | Entidad | Estado operativo. Si `necesita_reposición`: genera OC operativa. |
| **F. PRODUCCIÓN Y ARMADO** |
| Orden de trabajo | Schema aprobado | `ordenes_trabajo` (E-22) | Documento | Tipo: producción / garantía. Entrada al taller. Origen: proyecto / pedido_web / operativa. |
| Módulo (árbol recursivo) | Orden de trabajo | `modulos` (E-23) | Entidad | Unidad de trazabilidad: cajón, gabinete, mesón... Árbol recursivo (padre_id). Gates por nodo. |
| Tarea de taller | Módulo | `tareas_produccion` | Entidad | Operario asignado, descripción, estado. Granularidad de ejecución. |
| Citación de calidad | Armado ~15 días | E-23 (signal) | Evento | Desarrollador ordena verificación de módulos. Abre citaciones_calidad. |
| Check de producción 15 días | Módulos en armado | E-25 (realmente I-025) | Gate | **Rediseño 2026-08-08**: 3 ratios independientes (insumos%, pagos%, producción%) → desenlace derivado. |
| Desenlace check 15 | Min(ratio_insumos, ratio_pagos, ratio_produccion) vs umbrales | `check_produccion`, `glosario:231-235` | Cálculo | Umbral todo_bien: ≥0.95 (v1). Novedad: 0.70-0.95. Extremo: <0.70. Cada uno reduce comisión distinto. |
| Adelanto (línea contractual) | Desenlace todo_bien | E-60 | Evento | Señal positiva: instalación se adelanta. Comisión sin reducción. |
| Novedad | Desenlace novedad (0.70-0.95) | `novedades_criticas`, `glosario:51` | Evento | Incidente con SLA 5–24h. Pospone línea interna, comisión reducida 50%. |
| Situación extrema | Desenlace extremo (<0.70) | `novedades_criticas` | Evento | Escala y negocia con cliente. Comisión reducida 100%. |
| Verificación de calidad | Módulos armados | E-24, `glosario:55` | Gate | Verificador único: comercial vendedor (D3). Veredicto: aprobado / rechazado. |
| Rechazo de calidad | Verificación rechazada | E-54 | Flow | Reproceso de armado + nuevo check de calidad. |
| **G. INSTALACIÓN Y ENTREGA** |
| Instalación | Módulos aprobados + cronograma | E-25, `glosario:57` | Evento | Puesta en obra. Rango 5 días en semana programada. Observaciones + fotos. |
| Acta de entrega | Instalación completada | `actas_entrega` (E-26) | Documento | "Segundo contrato", momento de verdad mayor. Firma digital + fotos. Cierra proyecto. |
| **H. FINANZAS Y COMISIONES** |
| Obligación pendiente | Hito de pago / Comisión | `obligaciones_pendientes` (E-56) | Entidad | **Unificada**: contrato_hito (cliente paga) / proveedor (pagamos) / diseño_3d / nómina / comisión / arriendo. |
| Comisión desarrollador | Cronograma completado (4 semanas) | E-35, `glosario:60` | Obligación | 5% valor proyecto si ≤4 semanas. Reducción: 50% (novedad), 100% (extremo). Base calculada en check_produccion. |
| Comisión carpintero | Cronograma completado (4 semanas) | E-35 | Obligación | 5% valor proyecto. Misma lógica que desarrollador. |
| Descuento diseño 3D | Anticipo (E-30) | E-30 | Automático | Sistema descuenta automáticamente -$130k del anticipo final. Registro en obligaciones (deduccion_diseno_3d). |
| Pago a proveedor | Recepción verificada | E-22 | Obligación | Se ejecuta según mecánica_pago (anticipo_saldo / único / subcontratación). |
| Cobro a cliente | Vencimiento hito | E-28 | Evento | Se marca pagada cuando entra dinero. SLA: si atrasa >12 días: aviso gerente (E-29). |
| Movimiento financiero | Pago / Cobro | `movimientos_financieros` | Entidad | Débito/crédito, monto, descripción, comprobante. Trazable: socio_id, oc_id, obligacion_id. |
| Cuentas financieras | — | `cuentas_financieras` | Entidad | Caja, bancos, proveedores. Saldo = SUM(movimientos). |
| **I. GARANTÍA** |
| Garantía 2 años | Acta de entrega | E-37 | Período | 8–12 días hábiles respuesta. Reutiliza ordenes_trabajo(tipo=garantía). |
| Caso de garantía | Reporte del cliente | `casos_garantia` (E-37) | Entidad | Fotos + descripción. Estados: reportado → diagnosticado → en_reparación → resuelto → cerrado. |
| Orden de garantía | Caso diagnosticado | `ordenes_trabajo` (tipo=garantía) | Documento | Taller ejecuta reparación. Reutiliza módulos para rastrear. |
| **J. REGLAS TRANSVERSALES** |
| Verify único | Gate / Aprobación | D2, D3, `glosario:50` | Patrón | Un solo verificador por gate (comercial vendedor). No se cruzan. |
| Comisión por cronograma | Desenlace check_15 | E-35, `logica:220` | Regla | Base = valor proyecto. % = 5%. Reducción: 50% (novedad) o 100% (extremo). Sin reducción si adelanto. |
| Traza de eventos | Todo cambio de estado | `eventos` (E-01..E-61) | Auditoría | Append-only. 61 tipos de evento. Cada fila = mutación. Contexto via FKs (leadId, clienteId, etc). |
| Linaje de dato | Mutación de entidad | `procedencia` | Meta | "Este dato nació de este otro en este evento". UNIQUE(hijoEntidad, hijoId). Mismo tx que mutación. |
| Parámetros vivos | SLA, comisiones, umbrales | `parametros` (E-10..E-14) | Sistema | Valores configurables sin deploy. Historial append-only en `parametros_historial`. |
| **K. INTEGRACIÓN TIENDA WEB** |
| Pedido web | Cliente selecciona producto | `pedidos_web` (E-57) | Documento | Carrito → checkout. Gap: no dispara producción automáticamente. |
| Producto tienda | Catálogo publicable | `productos_tienda` | Entidad | Extensión 1:1 de `productos_catalogo`. Precio fijo, inventario, imágenes. |
| Pedido web a producción | Pedido web completado | GAP (no implementado) | Flow | Debe disparar orden_trabajo automáticamente. DIFERIDO. |
| **L. GLOSARIO / NOMBRADO CANÓNICO** |
| Naming canónico (UI) | Schema + Negocio | `glosario_h07:§A` | Referencia | Todo label usa término de negocio (nunca nombre técnico de tabla). |
| Estados únicos | Máquinas de estado | `glosario_h07:§B` | Referencia | Mismo estado = mismo label en toda la app. 8 máquinas (Proyecto, Lead, Cita, Contrato, etc). |
| Verbos únicos | Acciones | `glosario_h07:§C` | Referencia | Un verbo = una acción. Ej: "Calificar" (no "Calificar/Score"). |
| **M. ROLES Y RESPONSABILIDADES** |
| Comercial | E-03, E-06, E-07, E-24 (verificador) | `arnes/roles/` | Rol | Califica, agenda, verifica calidad, firma clientes. D2: rastreo de origen. |
| Desarrollador | E-17, E-18 | Rol | Diseña schema, genera BOM, itera reprocesos. |
| Comprador | E-19, E-20, E-21 | Rol | Genera OC, monitorea caja, verifica recepción. |
| Jefe taller | E-22, E-23, E-24 | Rol | Ordena armado, cita calidad, ejecuta reproceso. |
| Gerente | E-20 (gate caja), E-29 (atrasos), E-35 (comisiones) | Rol | Decide saldo disponible, es escalada, autoriza comisiones. |
| Supervisor | Todos los checkpoints | Rol | Humano (Javier). Único que aprueba decisiones estructurales. |
| **N. FASES Y ALCANCE (F0–F10)** |
| F0 — Cimientos | `roles`, `parametros`, `eventos`, `procedencia`, identidad | Fase | SIN UI. Auditoria, roles, parámetros configurables. |
| F1–F7 — Línea técnica aprobada | E-01..E-37 (diseños + planes) | Fase | Cada fase = 5 pantallas aprox. F7 = Sitio público. |
| F8 — Hardening | Validación Zod, reactividad multi-usuario | Fase | Borde de escritura, LISTEN/NOTIFY, TanStack Query. |
| F9 — QA y cierre | Tests runtime, evidencia mecánica | Fase | Nunca "la palabra del ejecutor". |
| F10 — Migración y post-launch | Sincronización legacy → V3, monitor en vivo | Fase | Pendiente de definir en detalle. |
| **O. DECISIONES AXIOMÁTICAS** |
| D1 — Gate de caja único bloqueante | E-20 | Axioma | Única variable externa real. Mueve cronograma. |
| D2 — Verificador único (trazabilidad) | E-18, E-24 | Axioma | Comercial vendedor = verificador. Sin cruce de roles. |
| D3 — Comercial verificador de calidad | E-24, `check_produccion.verificador_id` | Axioma | Quien vendió el proyecto lo verifica. Responsabilidad clara. |
| D4 — Check 15 días = 3 DPs independientes | `check_produccion` rediseño 2026-08-08 | Axioma | No es un juicio manual — se deriva de MIN(ratios) vs umbrales. |
| CC-10 — Valor del contrato NO se toca | `contratos` | Constante | Inmutable desde firma. Cambios: adicionales, cambios, reprocesos (I-027). |
| CC-2 — Desarrollo es bloqueante | `logica:163-169` | Constante | Orden inmutable: diseño+contrato → desarrollo → aprobación → compras → armado. |
| **P. FLUJOS DE INTEGRACIÓN** |
| WhatsApp + AI primer contacto | Lead | Futuro (norte I-022) | Integración | IA responde primeros mensajes, califica, agenda. Humano supervisa. |
| Pasarela de pago (diseño 3D) | Presupuesto → Diseño pagado | Futuro (norte I-024) | Integración | Cliente prepaga online. Sistema aplica descuento automático. |
| Portal cliente | Proyecto visto del cliente | F-07 | UI | Ver propuesta, cronograma (línea contractual), acta, garantía. |
| Reactividad multi-usuario | ERP real-time | M-07b (`tecnico/m07b_`) | Arquitectura | Long-polling + LISTEN/NOTIFY. TanStack Query para cache. |
| Zod validación runtime | Borde de escritura | `tecnico/plan_zod_validacion_runtime.md` | Validación | t-164, 2026-09-18. Pendiente checkpoint. |

---

## ANÁLISIS DE DEPENDENCIAS CRÍTICAS

### Camino crítico (ruta principal sin atajos):

```
Lead → Calificación → Visita → Presupuesto → Propuesta → 
Contrato → Retoma → Desarrollo (BLOQUEANTE) → 
Check Schema (E-18, GATE NO NEGOCIABLE) → 
Compras → Recepción → Armado → 
Check 15 días (E-25, impacta comisiones) → 
Calidad (E-24) → Instalación → Acta (E-26) → 
Garantía 2 años
```

### Ejes de control:

1. **Verificador único (D2, D3)**: Comercial vendedor es único en E-18 (schema) y E-24 (calidad). Responsabilidad clara.
2. **Gate de caja (E-20)**: Único variable externo. Detiene todo si no hay saldo.
3. **Check de 15 días (E-25)**: Impacta comisiones (reducción 50%/100%) y cronograma (posposición línea interna).
4. **Obligación unificada**: Todo lo que se paga/cobra es una obligación (cliente, proveedor, diseñador, empleado).

### Puntos de riesgo (red flags del flujo):

| Riesgo | Ubicación | Mitigación |
|---|---|---|
| Pago diseño 3D no descontado | E-30 (`anticipo`) | Sistema **automático**, no manual. Obligación registra `deduccion_diseno_3d`. |
| Firma virtual inexistente | E-16, `firmas_contrato` | DIFERIDO a F6. Hoy: manual/informal. |
| Acta de entrega informal | E-26, `actas_entrega` | 100% digital requerido. Hoy: 0% implementado. |
| Pedido web no dispara producción | GAP, `pedidos_web` | Flow diferido. OC operativa manual. |
| Comisión depende de memoria | E-35 (`check_produccion`) | Rediseño 2026-08-08: **derivada automáticamente** de ratios. |
| Almacenamiento duplicado (CLASE vs INSTANCIA) | `productos_atributos` vs `espacios_artefactos` | Regla: ficha técnica del catálogo NO se duplica en instancia. FK NULLABLE solo si no se repite. |

---

## MATRIZ DE TRAZABILIDAD: CONCEPTO → ARCHIVO → LÍNEA

| Concepto | Archivo | Sección | Versión |
|---|---|---|---|
| Flujo completo negocio | `logica_de_negocio.md` | Diagramas (§29-88) | 2026-08-08 |
| Schema canónico | `REGISTRO_DE_ENTIDADES.md` | Todo (§1-12) | Promovido 2026-08-07 |
| Glosario UI / Naming | `glosario_h07.md` | §A-C | 2026-08-05 |
| Roles y contratos | `arnes/roles/*.md` | Completo | Vigente |
| Zonas y dueños | `AGENTS.md` | §"Zonas y dueños" | Vigente |
| Modelos (intercalación) | `MODELOS.md` | §0-5 | Promovido 2026-08-07 |
| Estados y verbos | `glosario_h07.md` | §B, §C | 2026-08-05 |
| Check 15 días rediseñado | `tecnico/mini_diamante_check_produccion.md` | Axioma 1 | 2026-08-08 |
| Comisiones | `logica_de_negocio.md` | §"Métricas" (§186-193) | 2026-08-08 |
| Gates y eventos | `diamante2_define_eventos.md` (archivo) | E-01..E-61 | Trazabilidad punto-0 |
| Pantallas F2–F7 | `lineas/ola7/pantallas/disenio_*.md` | Completo | Fase 1-7 |

---

## RECOMENDACIONES DE AUDITORÍA

1. **Sincronía**: Verificar que `REGISTRO_DE_ENTIDADES.md` §9-10 (finanzas) coincida con `lib/db/schema.ts` (`obligaciones_pendientes`). Fuente canónica **gana este documento**.

2. **Fases bloqueadas**: 
   - F10 (migración) no puede iniciar sin F8 (hardening) y F9 (QA) cerrados.
   - No existen tareas de F6 (finanzas) hasta que se apruebe el flujo de firma virtual (E-16).

3. **Riesgo documentación desactualizada**: Las 7 filas de `ui-slots` en INDEX.md (línea 65-67) son falsas — línea nunca existió. Decisión axiomática de 2026-09-10 la cancela por sobre-ingeniería.

4. **Decisiones vigentes** (no negociables):
   - Zustand solo para estado local de UI (2026-09-05).
   - TanStack Query para cache + mutation optimista en ERP (2026-09-05, ejecutado).
   - Long-polling + LISTEN/NOTIFY para reactividad multi-usuario (m07b, 2026-09-18).

---

**Generado por**: Exploración de arnés (context windows múltiples)  
**Control de calidad**: Cruzado con 5 archivos canónicos  
**Próximo paso**: Validación con Supervisor antes de cualquier código que toque schema/gates/roles  
