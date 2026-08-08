# Fase 2 Ronda 3 — Decisiones respondidas (2026-08-04)

**Rol:** Orquestador (consolida). **Salida:** checkpoint de Fase 0 antes de Ola 7 (Execute).
**Objeto:** documentar las 16 respuestas del Supervisor a las DECISION_PENDIENTE de `d3_ui_consolidado.md` y `d3_schema_consolidado.md`, sistematizarlas, y abrir los mini-diamantes que implican.

---

## Resumen ejecutivo

| Decisión | ID | Respuesta | Mini-diamante abierto |
|----------|----|-----------|----------------------|
| Rol `compras` | DP-02 (UI+Schema) | Rol tipado dedicado, gerente = suma de roles | — |
| Login contador | DP-04 (UI) + DP-03 (Schema) | Cuenta propia, invitación con rol pre-asignado | — |
| Transparencia por rol | H8 (UI) | Permisos sumativos, diseñador aislado, comercial ve sus proyectos + leads entrantes | — |
| Checkout anónimo | H12 (UI) | No anónimo. Cuenta obligatoria. Anónimo solo para agendamiento WP. | — |
| Base comisión | DP-06 (UI+Schema) | **Subtotal sin IVA** | — |
| Alojador docs | DP-09 (UI) | Drive para SKP/SDK mobiliario; R2 para imágenes exportadas (JPG/espacio/módulo) | — |
| Valores numéricos compensación | DP-01 (UI+Schema) | Estimados dados (ver tabla); pendientes confirmación contador | M-03 |
| Catálogo insumos vs producto | DP-05 (Schema) | Metodología de grafos requerida | M-02 |
| Deprecación rolEmpleado | DP-03 (Schema) | Migrar código existente, no levantar de 0 | — |
| Composición causal E-33 | DP-04 (Schema) | Metodología para determinismo con justificación humana | M-01 |
| Espejar parámetros en eventos | DP-07 (Schema) | Logs robustos + sub-sistema KPIs dedicado | M-04 |
| Fuente SLA/holgura | DP-08 (Schema) | Grafo de composición de proyecto + logs como observabilidad | M-04 |
| Marca/legal editable | DP-09 (Schema) | Panel de parametrización general en ERP, editable desde el logo | — |
| Parámetros faltantes | A-01 (complementario) | Valores estimados, pendientes confirmación | M-03 |

**Total decisiones cerradas:** 14 de 16 (DP-01 y DP-06 tienen valores estimados pero requieren confirmación del contador)
**Mini-diamantes abiertos:** M-01 (Causalidad), M-02 (Grafos catálogo), M-03 (Derivación parámetros), M-04 (Logging/KPIs), M-05 (Modularización — ya identificado previamente)

---

## Decisiones detalladas

### D-01: Rol `compras` — rol tipado dedicado

**Decisión:** Sí, rol `compras` tipado en la tabla `roles`. El gerente tiene rol `gerente` + rol `compras` (y otros que asuma: `admin`, `comercial`, etc.). Las personas se asignan roles; al cambiar de cargo, se reasignan roles.

**Justificación:** Escalabilidad. Si una persona deja el cargo de compras, se le quita el rol `compras` y se asigna a quien entre. No hay que reconfigurar permisos a nivel de código. La suma de roles por persona es el modelo de permisos.

**Impacto en implementación:**
- `roles` tabla: fila `compras` con descripción
- `personas_roles`: N:N, una persona puede tener múltiples roles
- `erp-nav.ts`: módulo `compras` visible para roles que incluyan `compras`
- Gate E-20: ejecutor = `gerente` (rol), pero persona con rol `compras` también puede disparar OC
- `require-rol.ts`: soporta array de roles por módulo

**Archivos afectados:** `lib/db/schema.ts`, `lib/auth/require-rol.ts`, `lib/erp-nav.ts`, `middleware.ts`

---

### D-02: Login del contador — cuenta propia

**Decisión:** El contador tiene cuenta propia en `usuarios` con rol `contador`. El gerente (rol `gerente` con permiso de RRHH) crea la invitación con rol pre-asignado; el contador completa sus datos personales y crea su password.

**Flujo de onboarding:**
1. Gerente (RRHH) accede a `/app/erp/equipo` → "Invitar empleado"
2. Selecciona rol `contador` → sistema genera link de invitación
3. Link enviado por email → contador accede a `/registro?token=...`
4. Contador completa datos personales (nombre, email, teléfono) y crea password
5. Cuenta activada, redirige a `/cuenta`

**Impacto en implementación:**
- `usuarios` tabla: columna `invitadoPor` (FK a `usuarios`), `tokenInvitacion`, `invitacionExpira`
- `/registro` route: acepta `token` query param, valida, pre-llena rol
- `requireEmpleado`: el contador puede acceder a `/app/erp/finanzas/contador` (P-23)
- Sin sesión de "vista sin login" — todo pasa por auth real

---

### D-03: Transparencia por rol (H8)

**Decisión:** Modelo de permisos sumativos por rol asignado a la persona.

| Persona | Roles asignados | Qué ve |
|---------|----------------|--------|
| Gerente | `gerente` + `comercial` + `compras` + `finanzas` + `taller` + `calidad` | Todo. Suma de todos los permisos. Trazabilidad completa a todos los proyectos. |
| Comercial (genérico) | `comercial` | Sus proyectos + leads entrantes (para responder <5 min) + puede apoyar conversaciones de otros comerciales (ver lista de leads "abiertos" sin dueño o con tiempo de espera) |
| Comercial (diseñador asignado) | `comercial` + `disenador` | Solo sus proyectos/clientes. Aislamiento clave: una vez un diseñador atiende un cliente, hace visita y diseño, solo este diseñador tiene contacto con ese cliente. |
| Diseñador | `disenador` | Solo sus proyectos/clientes asignados |
| Contador | `contador` | Solo finanzas (P-20, P-21, P-22, P-23) |
| Taller | `taller` | Solo taller (P-16, P-18, P-19) |

**Principio:** Los permisos son **suma de roles** asignados a una persona. No hay permisos negativos (ocultar lo que otro rol ve). El aislamiento del diseñador se logra con un rol `disenador` dedicado que solo ve sus proyectos.

**Impacto en implementación:**
- Nuevo rol `disenador` en tabla `roles`
- `erp-nav.ts`: módulos filtrados por roles sumativos
- P-09, P-16, P-20: el comercial genérico ve sus proyectos; el gerente ve todos
- P-08 (desarrollo): verificador único puede ser comercial o gerente (según D-04 del Define)

**Auditoría:** Este modelo es auditable — cada permiso se traza a un rol, cada rol a una persona. Se puede verificar en cualquier momento qué ve cada usuario.

---

### D-04: Checkout anónimo (H12)

**Decisión:** No anónimo. Cuenta obligatoria para checkout.

**Justificación:**
- Confianza en la empresa: un pedido sin cuenta no tiene trazabilidad
- Reclamos: sin `clienteId` no hay a quién asignar el reclamo
- Seguimiento de despacho: sin cuenta no hay dirección de envío verificada
- Todas las tiendas virtuales funcionan con cuenta — no hay precedente de despacho sin cuenta

**Excepción:** Agendamiento de proyecto personalizado (F-03 `/agendar`) puede ser anónimo — llega por WhatsApp, contacto persona a persona, es distinto al checkout de tienda.

**Impacto en implementación:**
- F-06 checkout: requiere `requireCliente`, redirige a `/login` si no autenticado
- F-03 agendar: puede ser público, sin auth (como hoy t-012)
- `pedidos_web`: siempre con `clienteId` de la sesión

---

### D-05: `base_comision_tamano` — subtotal sin IVA

**Decisión:** La comisión "por tamaño" (5%) se calcula sobre el **subtotal sin IVA** del proyecto/contrato.

**Justificación:** La comisión es sobre el valor del trabajo realizado, no sobre el impuesto que se recauda. IVA es dinero del gobierno, no del negocio.

**Impacto en implementación:**
- Parámetro `base_comision_tamano` = `'subtotal_sin_iva'`
- `lib/modules/finanzas/compensacion.ts`: cálculo usa `subtotal` (sin IVA) como base
- P-22 (Compensación): muestra base de cálculo al usuario para transparencia
- Gate E-35: valida que `comision <= base_comision_tamano * pct`

---

### D-06: Alojador de documentos

**Decisión:** Modelo híbrido:
- **Google Drive:** SKP (SketchUp), SDK mobiliario, archivos fuente de diseño
- **Cloudflare R2:** Imágenes exportadas (JPG por espacio/módulo), PDFs generados por el sistema, actas de entrega
- **Excel de herrajes:** Eliminado. Absorbido por pantalla del sistema con gate + catálogo de productos

**Flujo de archivos:**
1. Desarrollador pasa SKP a layout → exporta como JPGs separados por espacio/módulo
2. JPGs se suben a R2 (bucket del proyecto) → el sistema los muestra en la pantalla de definición de proyecto por espacios
3. SKP original se guarda en Drive (carpeta VETA_ERP) → solo para referencia del desarrollador
4. Órdenes de armado (que corresponden a planos) → absorbidas por el sistema en la pantalla de definición de proyecto
5. Lista de herrajes en Excel → reemplazada por la pantalla de compras con gate + catálogo de productos

**Impacto en implementación:**
- `documentos_proyecto.alojador` enum: `drive_veta_erp` | `r2`
- Upload a R2 para imágenes exportadas
- Integración Drive API para SKP (solo lectura, no edición en el sistema)
- Pantalla de definición de proyecto por espacios con upload de imágenes JPG
- Eliminación del flujo Excel de herrajes → migración a UI del sistema

---

### D-07: Valores numéricos de compensación (estimados)

**Decisión:** Valores estimados como punto de partida v1. Se parametrizan en el ERP desde el logo (panel de administración) para ajustes futuros sin código.

| Parámetro | Valor estimado | Unidad | Notas |
|-----------|---------------|--------|-------|
| `comision_cierre_pct` | 5 | % | Sobre valor total del proyecto |
| `comision_modulo_instalado_pct` | 5 | % | Sobre valor del módulo |
| `tarifa_hora_carpintero` | 15000 | COP/hora | Tarifa hora hombre |
| `tarifa_hora_auxiliar` | 6500 | COP/hora | Ayudante |
| `quincena_calculo` | `horas_trabajadas` | método | Quincena se calcula sobre horas trabajadas |
| `comision_reduccion_retraso_pct` | 0.5 | % por día | Se descuenta por cada día de retraso sobre el cronograma estipulado |
| `comision_reduccion_max_pct` | 5 | % máximo | Tope de reducción por retraso (50 días = 0% comisión) |
| `comision_retraso_contrato_pct` | 0.5 | % por día | Después del tiempo extra del contrato (ej. 7 semanas), se descuenta 0.5% hasta 5% |
| `retencion_disenador_pct` | [pendiente] | % | Validar con contador |
| `iva_diseno_3d_pct` | [pendiente] | % | Validar con contador |

**Falta:** `umbral_novedad_check15` — qué desfase dispara el check de 15 días. Valor estimado: ≥3 días de desfase.

**Modelo híbrido (trabajo futuro):** Hoy se paga por tiempo (horas hombre). El sistema debe estar preparado para definir módulos y sub-módulos tan precisos que se pueda costear un "contrato por servicio" (ej. armado de cajón, postura de bisagra, instalación de fachada). El carpintero recibe el detalle del proyecto, observa el diseño, observa sub-módulos, lee la oferta comercial, toma el proyecto → se le paga solo lo que ensambla + comisión de cumplimiento.

**Impacto en implementación:**
- `parametros` tabla: 10 claves con valores estimados
- `parametros_historial`: versionado de cada cambio
- Panel de administración en ERP (desde el logo) para editar parámetros
- UI de P-22 (Compensación) muestra la base de cálculo y los valores configurados

---

### D-08: Catálogo — insumos vs producto terminado (metodología de grafos)

**Decisión:** Se requiere una metodología de grafos para componer entidades simples relacionadas. No es una decisión binaria (insumo vs producto) sino una composición de grafos.

**Entidades del grafo:**
1. **Tabla de costos proveedores** → relacionada con productos, colores, acabados
2. **Catálogo de productos y servicios** → catálogo principal
3. **Catálogo de herrajes** → sirve para comprar Y para presentar al cliente (selección de herrajes, material comunicativo)
4. **Productos → colores → acabados** → relaciones de composición
5. **Insumos → productos terminados** → relaciones de ensamblaje

**Metodología:** Subdivisión relacional con grafos de composición. Entidades simples relacionadas, no tablas planas. El grafo permite derivar:
- Costo de un producto = suma de costos de insumos + mano de obra
- Precio de venta = costo + margen + diseño 3D
- Selección de herrajes para un producto = subgrafo de opciones

**Mini-diamante M-02** se abre para desarrollar esta metodología.

**Impacto en implementación:**
- `productos_catalogo` necesita columna `tipo ∈ {insumo, producto_terminado}` (Fase 1, ampliación aditiva)
- Nuevas tablas: `catalogo_herrajes`, `productos_colores`, `productos_acabados`, `insumos_producto` (relación N:N)
- El grafo se implementa como relaciones FK en Drizzle

---

### D-09: Deprecación `usuarios.rolEmpleado` — migrar código, no levantar de 0

**Decisión:** Migrar el código existente al nuevo schema, no levantar el sistema de 0. Migración de datos a los nuevos schemas.

**Justificación:** El código actual funciona. Se mantiene y se migra. La deprecación de `rolEmpleado` → `personas_roles` es una transición coordinada (Fase 4 del plan de migración), no un reinicio.

**Impacto en implementación:**
- Fase 4 del plan de migración (ya definido en `d3_schema_consolidado.md`)
- `usuarios.rolEmpleado` se conserva como fuente temporal durante la transición
- `personas_roles` se llena con backfill desde `usuarios.rolEmpleado`
- Una vez que todo el código usa `personas_roles`, `rolEmpleado` se depreca

---

### D-10: Determinismo de composición causal E-33 — metodología

**Decisión:** Se necesita una metodología para desarrollar el determinismo de la composición causal con justificación humana natural.

**Problema:** El predicado E-33 exige `jsonb_array_length(composicion_causal) > 0` (existe), pero no valida que el contenido sea verdadero. El sistema registra lo que el usuario declara, no audita la realidad.

**Metodología propuesta:** Protocolo de auditoría automática de desfases que:
1. Registra la composición causal declarada por el usuario
2. Permite al verificador (gerente o comercial designado) validar o rechazar la composición
3. Si rechaza → requiere justificación textual obligatoria
4. Si acepta → se marca como `verificada` y se ejecuta el recálculo de `cronograma_etapas.linea='interna'`
5. Todo queda en `eventos` como trazabilidad completa

**Mini-diamante M-01** se abre para desarrollar este protocolo.

**Impacto en implementación:**
- `desfases_cronograma` necesita columna `verificadoPor` (FK a `personas`) + `verificadoEn` (timestamp) + `justificacion_rechazo` (text)
- Gate E-33 se ejecuta en servidor: verifica `composicion_causal` tiene al menos 1 elemento con `causa` válida + `motivo` no vacío + `composicion_causal` tiene longitud > 0
- La validación de veracidad es un paso humano (verificador), no automática

---

### D-11: Grafos de composición de proyecto — metodología doctoral

**Decisión:** Se requiere una metodología de grafos para la composición de entidades del proyecto.

**Grafo de composición:**
```
Proyecto
├── Espacios
│   ├── Módulos (cajón, estructura, fachada, iluminación...)
│   │   ├── Sub-módulos (armado de cajón, postura de bisagra, postura de manija...)
│   │   └── Costos estimados (tiempo estimado × tarifa hora)
│   └── Herrajes seleccionados (del catálogo de herrajes)
├── Materiales (del BOM)
│   ├── Insumos (tableros, herrajes, acabados, colores)
│   └── Costos unitarios (de tabla de costos proveedores)
└── Servicios
    ├── Diseño 3D ($130k + facturación DIAN)
    └── Instalación (rango 5 días)
```

**Metodología:** Composición relacional con grafos. Entidades simples (producto, color, acabado, herraje, insumo) relacionadas en un grafo que permite:
- Costear un proyecto desde sus componentes más finos
- Derivar parámetros automáticamente (ej. si un proyecto tiene 3 módulos de cocina grande → costo base = 3 × 200k)
- Trazar el origen de cada costo hasta su insumo raíz

**Mini-diamante M-02** cubre esto.

**Impacto en implementación:**
- El cotizador mejora al tener un grafo de composición preciso
- Los módulos/sub-módulos permiten costear por servicio (no solo por tiempo)
- El sistema puede ofrecer al carpintero un desglose de "lo que debe ensamblar" con costos

---

### D-12: Espejar cambios de parámetros en `eventos` — logs robustos

**Decisión:** Los logs robustos son el mecanismo que permite que los gates de influencias externas funcionen, entre otros gates. El log es el sistema de trazabilidad completo y debe ser un sub-sistema dedicado en generación de KPIs.

**Justificación:** Sin logs robustos, no hay forma de auditar por qué un gate se activó o no, por qué un parámetro cambió, quién lo cambió, y qué impacto tuvo en el cronograma/comisiones. El `eventos` table ya existe como log append-only; ahora se formaliza como sub-sistema de observabilidad.

**Metodología:**
1. Cada cambio de parámetro → evento en `eventos` con tipo `PARAMETRO_CAMBIADO`
2. Cada evaluación de gate → evento en `eventos` con tipo `GATE_EVALUADO` (payload con resultado)
3. Cada acción de usuario en pantalla → evento en `eventos` con tipo `ACCION_USUARIO`
4. Sub-sistema de KPIs deriva métricas del log de `eventos` (no de tablas separadas)
5. M-04 (Logging/KPIs) desarrolla este sub-sistema

**Impacto en implementación:**
- `eventos` table: tipos expandidos (`PARAMETRO_CAMBIADO`, `GATE_EVALUADO`, `ACCION_USUARIO`)
- `eventos.payload`: JSONB con datos del evento
- Panel de KPIs en P-23 (Dashboard contador) alimentado desde `eventos`
- M-04 desarrolla el sub-sistema

---

### D-13: Fuente de SLA/holgura — profundizar en grafo de composición

**Decisión:** Los parámetros `sla_novedad_critica` y `holgura_cronograma_max_dias` no deben ser valores sueltos. Se deben derivar del grafo de composición de proyecto.

**Justificación:** Un SLA de 5-24h para novedades críticas y una holgura de 5 días para cronograma no son números arbitrarios. Son consecuencia de:
- Cuántos módulos tiene el proyecto
- Cuántos sub-módulos por módulo
- Cuántos proveedores involucra
- Cuántas dependencias entre espacios

**Metodología:** El grafo de composición del proyecto (D-11) permite derivar automáticamente:
- SLA de novedad = f(número de módulos activos, dependencias entre espacios)
- Holgura máxima = f(tiempo estimado de armado por módulo, cantidad de módulos)

Esto se desarrolla en M-03 (Derivación de parámetros) y M-04 (Logging/KPIs).

---

### D-14: Parámetros de marca/legal — editable en ERP desde el logo

**Decisión:** Los 6 datos legales/marca (NAP/NIT/razón social, dirección, teléfono, horario) se parametrizan en el ERP desde el logo en adelante. Se crea un panel de parametrización general robusto.

**Justificación:** Estos datos cambian raramente pero cuando cambian (cambio de NIT, nueva dirección, nuevo horario) deben poder actualizarse sin código ni deploy. Un loop de parametrización general permite:
- Editar desde la UI del ERP
- Versionado en `parametros_historial`
- Uso en `lib/seo/jsonld.ts` (sitio público) y en cualquier pantalla que necesite los datos de marca

**Impacto en implementación:**
- `parametros` tabla: 6 claves de marca (`empresa_marca`, `empresa_razon_social`, `empresa_nit`, `empresa_direccion`, `empresa_telefono`, `empresa_horario_apertura`)
- Panel de administración en `/app/erp/configuracion` (nueva ruta)
- `lib/seo/jsonld.ts` lee de `parametros` en tiempo real (no hardcodeado)

---

### D-15: Parámetros que controlan esos valores (no entendido)

**Aclaración:** Los parámetros de marca/legal controlan:
- Datos de facturación (NIT, razón social, dirección) → aparecen en contratos, facturas, actas
- Datos de contacto (teléfono, horario) → aparecen en sitio público, JSON-LD, propuestas
- Marca/logo → aparece en PDF generados, emails, portal del cliente

**Control:** Se editan en el panel de parametrización general del ERP. Se versionan en `parametros_historial`. Se usan en tiempo real por cualquier pantalla o API que los necesite.

---

## Mini-diamantes abiertos

| ID | Nombre | Sesión sugerida | Prepara | Bloquea |
|----|--------|-----------------|---------|---------|
| M-01 | Causalidad (E-33 determinismo) | Orquestador + Supervisor, 2h | Protocolo de auditoría de desfases | P-09 (cronograma doble) |
| M-02 | Grafos catálogo | Orquestador, 1h | Esbozo de modelo relacional insumo→producto→herraje | P-04 (cotizador), P-13 (compras) |
| M-03 | Derivación parámetros | Supervisor + Orquestador, 1h | Tabla de factores que afectan comisiones | P-22 (compensación), gates E-31/E-35 |
| M-04 | Logging/KPIs | Orquestador, 2h | Diseño de `eventos` como observabilidad | P-23 (dashboard contador), gates E-18/E-21/E-24/E-33/E-20 |
| M-05 | Modularización | Supervisor + equipo producción, 3h | Inventario de procesos elementales del taller | P-16 (fila taller), P-18 (instalación) |

**Timing recomendado:**
- M-01 antes de implementar P-09 (cronograma doble)
- M-04 antes de t-034 (KPIs)
- M-02 y M-03 pueden correr en paralelo con Ola 7 (Execute)
- M-05 requiere input del equipo de producción

---

## Parámetros faltantes (A-01)

| Parámetro | Valor estimado | ¿Requiere confirmación? |
|-----------|---------------|------------------------|
| `umbral_novedad_check15_dias` | ≥3 días de desfase | Sí |
| `recargo_hora_extra_pct` | Revisar Ministerio Trabajo Colombia 2026 | Sí |
| `neto_diseno_3d_pct` | ($130k − retención − IVA) → validar contador | Sí |
| `iva_diseno_3d_pct` | Tasa IVA diseño (puede ser especial) → validar contador | Sí |
| Marca (6 campos) | Pendientes de confirmación del Supervisor | Sí |

---

## Registro

- Fecha: 2026-08-04
- Fuente: Respuestas del Supervisor a las 16 DECISION_PENDIENTE de `d3_ui_consolidado.md` y `d3_schema_consolidado.md`
- Archivo de salida: `arnes/diagnostico/pasadas/fase2_ronda3_decisiones_respondidas.md`
- 14 de 16 decisiones cerradas (DP-01 y DP-06 tienen valores estimados pendientes de confirmación contable)
- 5 mini-diamantes abiertos (M-01 a M-05)
- Próximo paso: Supervisor confirma checkpoint → Ola 7 (Execute) comienza