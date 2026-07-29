# Arquitectura de navegación y operación del ERP

Estado: diseño consolidado para revisión humana.  
Fecha de consolidación: 2026-07-27.  
Alcance de esta entrega: documentación y arnés de implementación; no modifica código,
schemas, rutas, zaps ni datos operativos.

## 1. Propósito y autoridad

Este documento es el mapa maestro para evolucionar la aplicación interna de Empresa
Muebles. Integra navegación, ciclo comercial, proyecto, producción, abastecimiento y
finanzas bajo un solo modelo mental.

No sustituye los contratos de lane ni autoriza por sí mismo una implementación. Cada
capacidad se ejecutará posteriormente en una rama y entorno aislado, con superficie de
escritura explícita, validaciones y auditoría independiente.

Documentos históricos que aporta y consolida:

- `DOCS VETA DORADA/ERP/MAPA_MODULOS_Y_AUXILIARES_ERP.md`
- `DOCS VETA DORADA/ERP/DISENO_DETALLE_MODULO_PRODUCCION.md`
- `DOCS VETA DORADA/ERP/DISENO_DETALLE_CENTRAL_ABASTECIMIENTO.md`
- `DOCS VETA DORADA/ERP/arquitectura_financiera_axiomatica.md`
- `storage/progreso/MATRIZ_ESTADOS.md`
- `storage/progreso/ORQUESTACION.md`
- `AGNOSTIC_RESEARCHS.md/INS_ergonomía cognitiva para el diseño de experiencia.md`
- `AGNOSTIC_RESEARCHS.md/INS_Arnes agentico.md`

Ante contradicción, prevalecen en este orden:

1. `AGENTS.md` y `storage/AGENTS.md`.
2. Contratos vigentes del engine y del catálogo estructural.
3. Este documento.
4. Documentos históricos de diseño.

## 2. Decisiones organizacionales confirmadas

### 2.1 Responsabilidades

| Área | Responsabilidad | No decide |
|---|---|---|
| Comercial | Califica leads, prepara cotizaciones, hace seguimiento y cierra la oportunidad | Compras, pagos o ejecución de taller |
| Proyectos | Mantiene la continuidad transversal del compromiso con el cliente | Operación bancaria |
| Producción | Define, agrega, elimina y valida los ítems que necesita el proyecto | Desde qué cuenta bancaria se paga |
| Finanzas | Controla liquidez, ejecuta pagos, registra movimientos y concilia | Qué pieza, material o especificación técnica requiere Producción |
| Catálogo | Mantiene productos, servicios, prefabricados, costos de referencia y proveedor preferente | Cantidad final de un proyecto |

La validación de Producción constituye la aprobación operativa del requerimiento.
Finanzas conserva el control de desembolso: puede programar o aplazar un pago por
liquidez, pero no cambia silenciosamente cantidades, piezas o especificaciones.

### 2.2 Ubicación de Compras

Compras se presenta como **Abastecimiento dentro de Producción**, no como un
departamento principal independiente.

Razones:

- Producción es quien conoce el despiece y valida la necesidad.
- La empresa no ha definido un equipo de Compras separado.
- Un nodo principal adicional aumentaría la carga de navegación.
- Finanzas ya posee la vista transversal de obligaciones por pagar.

Abastecimiento puede tener un acceso directo para roles autorizados, pero conserva
su pertenencia conceptual a Producción.

### 2.3 Restricción de datos

La primera implementación debe reutilizar los schemas actuales. No se crean schemas
nuevos por conveniencia de UI.

Si una brecha no puede expresarse correctamente con campos existentes, la lane debe:

1. demostrar la brecha;
2. proponer campos mínimos en un schema existente;
3. publicar el cambio mediante el ciclo de definiciones;
4. ejecutar `npm run agnostic:compile`;
5. validar la invariancia:
   `block.context === schema.data.name === archivo JSON`.

## 3. Modelo mental de la empresa

```text
Lead
  -> oportunidad calificada
  -> proyecto / cotización
  -> contrato
  -> preparación técnica
  -> producción
  -> instalación
  -> entrega
  -> garantía

Proyecto
  -> espacios
      -> variante activa
          -> ítems
          -> tareas
          -> documentación técnica
  -> requerimientos de abastecimiento
      -> solicitudes por proveedor
      -> obligaciones por pagar
      -> pagos
  -> obligaciones por cobrar
      -> cobros
  -> costo y margen realizados
```

El proyecto es el agregado transversal. Comercial, Producción, Abastecimiento y
Finanzas son vistas especializadas; no son copias del proyecto.

## 4. Mapa completo de navegación

### 4.1 Navegación global

```text
ERP
├─ Inicio
├─ Comercial
├─ Proyectos
├─ Producción
├─ Finanzas
├─ Calendario
├─ Catálogo
└─ Más
   ├─ Portafolio
   ├─ Equipo
   ├─ Proveedores
   ├─ Configuración
   └─ Perfil
```

La navegación global debe ser estable y corta. No enumera cada pantalla ni cada
tabla. Los accesos secundarios aparecen dentro del área correspondiente.

### 4.2 Inicio

```text
Inicio
├─ Trabajo pendiente del usuario
├─ Seguimientos comerciales vencidos
├─ Proyectos con bloqueos
├─ Producción del día
├─ Requerimientos por validar
├─ Pagos próximos
├─ Cobros próximos
└─ Alertas de integridad
```

El inicio no replica cada dashboard. Resume excepciones y siguientes acciones.

### 4.3 Comercial

```text
Comercial
├─ Leads
│  ├─ Nuevos
│  ├─ En contacto
│  ├─ Calificados
│  └─ Descartados
├─ Oportunidades vigentes
│  ├─ Cotización activa
│  ├─ Cotización enviada
│  └─ Cierre / contrato
├─ Seguimientos
├─ Cotizador
└─ Histórico
   ├─ Ganadas
   ├─ Perdidas
   └─ Canceladas
```

Reglas:

- Un lead solo genera proyecto/cotización después de ser calificado.
- `perdida` significa oportunidad cerrada sin venta.
- Una cotización vencida no se marca automáticamente como `perdida`.
- El tablero predeterminado no muestra producción, entregados ni históricos.
- `cancelada` expresa anulación o detención formal, no ausencia de respuesta.

Vistas calculadas recomendadas:

```text
vigentes = estado en [activa, enviada] y vigente_hasta >= hoy
seguimiento = proximo_seguimiento <= hoy y fecha_cierre vacía
vencidas = vigente_hasta < hoy y fecha_cierre vacía
ganadas = estado en [en_contrato, pre_produccion, produccion, entregado]
cerradas = estado en [perdida, cancelada]
```

`vencida` es una vista temporal, no un nuevo estado obligatorio.

### 4.4 Proyectos

```text
Proyectos
├─ Activos
├─ En preproducción
├─ En producción
├─ En instalación
├─ Entregados
└─ Ficha integral
   ├─ Resumen
   ├─ Cliente y contrato
   ├─ Espacios
   ├─ Producción
   ├─ Abastecimiento
   ├─ Finanzas
   └─ Documentación
```

La ficha integral es una proyección contextual. No permite operar el ledger completo
ni administrar el catálogo maestro.

### 4.5 Producción

```text
Producción
├─ Tablero de órdenes
├─ Proyecto / orden activa
│  ├─ Armado
│  │  ├─ espacios
│  │  ├─ planilla de ítems
│  │  ├─ especificaciones
│  │  └─ tareas
│  ├─ Abastecimiento
│  │  ├─ por especificar
│  │  ├─ listo para solicitar
│  │  ├─ solicitado
│  │  ├─ recibido parcial
│  │  ├─ recibido
│  │  └─ con novedad
│  ├─ Instalación
│  └─ Documentación técnica
│     ├─ modelo 3D
│     ├─ planos
│     ├─ despieces
│     └─ registros de obra
└─ Agenda de Producción
```

Armado es la acción primaria. Abastecimiento es soporte operativo. El modelo 3D es
referencia técnica contextual y no compite visualmente con el trabajo principal.

### 4.6 Finanzas

```text
Finanzas
├─ Resumen
│  ├─ liquidez
│  ├─ por pagar
│  ├─ por cobrar
│  └─ flujo próximo
├─ Cuentas por pagar
├─ Cuentas por cobrar
├─ Movimientos
├─ Cuentas bancarias
├─ Conciliación
├─ Comprobantes
└─ Rentabilidad por proyecto
```

Finanzas recibe obligaciones aprobadas desde los procesos, pero el movimiento de
dinero solo existe cuando Finanzas registra un cobro, pago o transferencia.

### 4.7 Calendario, Catálogo y auxiliares

```text
Calendario
├─ Comercial
├─ Producción
├─ Instalaciones
└─ Seguimientos

Catálogo
├─ Materiales
├─ Herrajes
├─ Servicios
├─ Prefabricados
└─ Modelos reutilizables

Más
├─ Portafolio
├─ Equipo
├─ Proveedores
├─ Configuración
└─ Perfil
```

El catálogo ya creado se conserva como maestro. `Proveedores` puede abrirse desde
Catálogo y desde Abastecimiento, pero existe una sola fuente de datos.

## 5. Navegación por contexto

La navegación tiene dos niveles independientes:

1. **Global:** cambia de área.
2. **Contextual:** cambia de vista dentro del proyecto, orden o área activa.

Ejemplo:

```text
[Producción] / Proyecto Gómez / Cocina / OT-2026-018

Estado: en_proceso
Entrega: 2026-08-12
Responsable: Taller
Bloqueo: faltan herrajes

[Armado] [Abastecimiento] [Instalación] [Documentación]
```

La barra contextual conserva:

- proyecto;
- espacio;
- orden;
- estado;
- responsable;
- fecha objetivo;
- bloqueo principal;
- siguiente acción.

## 6. Espacio como unidad mínima y modelo 3D

### 6.1 Jerarquía

```text
Proyecto
├─ modelo 3D maestro
├─ espacio A
│  ├─ variante activa
│  ├─ ítems
│  ├─ tareas
│  └─ artefactos técnicos
└─ espacio B
   └─ ...
```

El modelado se produce una vez para el proyecto, pero debe poder aislarse por espacio.
No se duplican archivos inicialmente.

### 6.2 Formato

GLB/glTF es el formato canónico recomendado porque preserva jerarquía, materiales,
nodos y metadatos. OBJ puede importarse, pero no debe ser el formato maestro.

Herramientas abiertas recomendadas:

- Three.js `GLTFLoader` para visualización.
- `@gltf-transform/core` para inspección, optimización o exportación futura.

Cada nodo o grupo del archivo maestro se relaciona con un registro de
`espacio_variantes`. La UI permite:

- ver el proyecto completo;
- aislar un espacio;
- ocultar los demás;
- centrar la cámara;
- consultar ítems, planos y tareas;
- exportar posteriormente un espacio si el proceso lo exige.

### 6.3 Contrato de artefactos

`productos_catalogo.modelo_3d` conserva modelos reutilizables de catálogo.
No almacena el modelo personalizado de un proyecto.

`registros_tecnicos` es el candidato existente para modelos, planos, despieces y
diagramas del proyecto o espacio. Antes de ampliarlo debe corregirse la desalineación
actual:

| Schema vivo | Uso incorrecto detectado en UI |
|---|---|
| `responsable` | `registrado_por` |
| `archivos_multimedia` | `urls_multimedia` |
| `notas` | `notas_descriptivas` |

La lane técnica debe decidir campos mínimos para alcance, tipo, archivo, versión y
aprobación sin crear un schema paralelo.

## 7. Flujo de abastecimiento del proyecto

### 7.1 Flujo objetivo

```text
Cotización aprobada
  -> espacios y variantes activas
  -> Producción revisa ítems
  -> agrega, elimina o especifica
  -> valida requerimiento
  -> sistema agrupa por proveedor
  -> se emite solicitud / orden
  -> Finanzas programa anticipo o pago
  -> proveedor entrega parcial o total
  -> Producción registra recepción y novedades
  -> Finanzas liquida saldo y concilia
  -> costo real se atribuye al proyecto
```

### 7.2 Estados conceptuales

```text
borrador
validado_produccion
pendiente_pago
pagado_parcial
solicitado
recibido_parcial
recibido
con_novedad
cancelado
```

Esta taxonomía es conceptual. La lane de datos debe cruzarla con los campos actuales
antes de cambiar definiciones.

### 7.3 Anticipos

El flujo debe admitir:

- pago total anticipado;
- anticipo y saldo contra entrega;
- pago contra entrega;
- pagos parciales extraordinarios.

Finanzas controla los movimientos. Producción controla la recepción.

### 7.4 Regla financiera

Una necesidad técnica no es todavía un pago:

```text
requerimiento != obligación != movimiento
```

- Requerimiento: qué se necesita.
- Obligación: compromiso monetario aprobado.
- Movimiento: dinero efectivamente desembolsado.

### 7.5 Brechas actuales

El flujo actual de `zap_generar_orden_compra`:

- agrupa ítems por proveedor;
- crea un resumen en `compras_materiales`;
- crea inmediatamente una `obligaciones_pendientes`;
- marca `items_variante.compra_generada`.

Brechas:

- no persiste relación precisa entre compra y líneas;
- no hay aprobación explícita;
- no hay recepción parcial;
- no hay novedad o devolución;
- el costo puede provenir de una referencia desactualizada;
- la obligación nace antes de distinguir solicitud, anticipo y saldo.

La solución debe evolucionar el flujo existente, no superponer otro subsistema.

## 8. Flujo financiero

### 8.1 Venta

```text
Contrato aceptado
  -> plan de cobros
  -> obligación por cobrar
  -> cobro
  -> movimiento de ingreso
  -> abono de contrato
  -> conciliación
```

### 8.2 Compra

```text
Requerimiento validado
  -> compromiso con proveedor
  -> obligación por pagar
  -> pago
  -> movimiento de egreso
  -> actualización de cuenta
  -> conciliación
```

### 8.3 Proyecto

La proyección financiera de un proyecto muestra:

- valor contratado;
- cobrado;
- pendiente por cobrar;
- compras comprometidas;
- compras pagadas;
- mano de obra;
- otros costos;
- costo real;
- margen estimado;
- margen realizado.

### 8.4 Acoplamiento que debe eliminarse

`zap_activar_produccion` actualmente puede crear o firmar contrato, generar cobros,
cambiar el estado del proyecto y crear la orden de trabajo.

Debe evolucionar hacia transiciones separadas:

```text
aceptar contrato
  -> formaliza contrato y plan de cobros

confirmar condición de inicio
  -> habilita preproducción

liberar a producción
  -> crea orden y tareas
```

Ninguna acción de Producción debe fabricar una aceptación legal inexistente.

## 9. Correspondencia con la implementación actual

| Capacidad | Ruta/componente actual | Decisión |
|---|---|---|
| Comercial | `/app/erp/comercial`, `ComercialKanban` | Evolucionar filtros y ciclo; conservar |
| Cotizador | `/app/erp/cotizador`, `CotizadorPro` | Conservar |
| Proyectos | No tiene entrada integral propia | Componer vista transversal |
| Producción | `/app/erp/taller`, `ProductionKanban` | Entrada canónica; evolucionar |
| Ficha operativa | `ProjectDetails` y `FichaProduccion` | Elegir una canónica y eliminar redundancia |
| Abastecimiento | `WidgetArmadoOrdenCompra` | Evolucionar; no duplicar |
| Radar y semáforo | `RadarPedidosTaller`, `SemaforoSuministrosBadge` | Consumir una proyección común |
| Proveedores | `/app/erp/proveedores`, `ProveedoresDirectory` | Conservar como maestro |
| Catálogo | `/app/erp/catalogo`, `CatalogoManager` | Conservar; catálogo ya creado |
| Finanzas | `/app/erp/finanzas`, `FinanzasShell` | Conservar y mejorar trazabilidad |
| Calendario | `/app/erp/calendar`, `CalendarScheduler` | Conservar |
| Portafolio | `/app/erp/portfolio`, `PortfolioManager` | Mover a navegación secundaria |
| Equipo | `/app/erp/equipo`, `EquipoDirectory` | Mover a navegación secundaria |
| Perfil | `/app/erp/perfil`, `UserProfile` | Mover a navegación secundaria |

Los requisitos de negocio no modifican archivos del engine. La solución vive en:

- `storage/`;
- `src/components/specialized/`;
- `agnostic.config.ts`;
- puntos de extensión explícitamente autorizados.

## 10. Diseño axiomático

| Requisito funcional | Parámetro de diseño |
|---|---|
| Encontrar un área | Navegación global estable |
| Conservar orientación | Barra contextual |
| Controlar el compromiso completo | Ficha integral del proyecto |
| Ejecutar fabricación | Vista de Armado |
| Definir necesidades | Abastecimiento de Producción |
| Controlar desembolsos | Finanzas |
| Mantener referencias | Catálogo |
| Segmentar el diseño | Espacios relacionados con nodos GLB |
| Consultar contexto financiero | Proyección por proyecto |
| Operar dinero real | Ledger financiero |

### 10.1 Axioma de independencia

- Comercial no activa pagos.
- Producción no altera cuentas bancarias.
- Finanzas no cambia despieces.
- Catálogo no sustituye cantidades del proyecto.
- La ficha del proyecto no replica interfaces operativas completas.
- Navegación, permisos y rutas no se resuelven mediante menús duplicados por rol.

### 10.2 Axioma de información

- Se reduce la navegación global a áreas estables.
- Las vistas históricas no contaminan el trabajo cotidiano.
- Compras no se convierte en departamento artificial.
- Un modelo 3D maestro evita archivos duplicados.
- Un componente canónico sustituye vistas redundantes.
- Los indicadores muestran excepciones y trabajo pendiente, no decoración.

## 11. Ergonomía cognitiva

Principios obligatorios:

- ubicación y contexto siempre visibles;
- nombres estables y comprensibles;
- revelado progresivo;
- objetivos táctiles mínimos de 44–48 px;
- no depender de color como único indicador;
- acción primaria única por pantalla;
- retorno explícito al proyecto y espacio previos;
- confirmación para transiciones legales, financieras o destructivas;
- adaptación reversible;
- tablero predeterminado limitado al trabajo vigente.

Métricas recomendadas:

- tiempo para localizar un proyecto;
- pasos para volver al punto de trabajo;
- cotizaciones visibles frente a históricas;
- requerimientos sin proveedor;
- compras sin líneas trazables;
- pagos sin obligación;
- tareas sin responsable;
- archivos técnicos sin espacio o versión.

## 12. Navegación por rol

| Rol | Áreas predeterminadas |
|---|---|
| Comercial | Inicio, Comercial, Proyectos, Calendario, Catálogo |
| Producción | Inicio, Proyectos, Producción, Calendario, Catálogo |
| Finanzas | Inicio, Proyectos, Finanzas, Calendario |
| Admin de negocio | Todas las áreas |
| Cliente | Portal de proyectos; fuera del ERP interno |

Los permisos se expresan por capacidades. El rol solo aporta un conjunto inicial; no
se mantienen copias completas y divergentes del menú.

## 13. Programa de implementación

Orden recomendado:

```text
Lane 0: contrato de navegación y capacidades
  -> Lane 1: pipeline comercial
      -> Lane 2: shell de proyecto y producción
          -> Lane 3: abastecimiento
              -> Lane 4: integración financiera
                  -> Lane 5: artefactos técnicos y 3D
                      -> Lane 6: QA integral
```

### Lane 0 — Navegación y capacidades

- Catálogo único de módulos.
- Jerarquía global y contextual.
- Permisos por capacidad.
- Sin tocar engine por necesidades de producto.

### Lane 1 — Comercial

- Separación lead/cotización.
- Vistas vigentes, seguimiento, vencidas e histórico.
- Fechas y motivos de cierre mínimos.

### Lane 2 — Proyectos y Producción

- Entrada canónica de Proyectos.
- `ProjectDetails` o equivalente como ficha canónica.
- Consolidación de vistas redundantes.
- Plantillas de tareas al liberar producción.

### Lane 3 — Abastecimiento

- Validación de ítems por Producción.
- Agrupación por proveedor.
- Trazabilidad de líneas.
- Anticipos, recepción parcial y novedades.

### Lane 4 — Finanzas

- Obligaciones nacen del evento correcto.
- Pagos y cobros separados de obligaciones.
- Proyección financiera por proyecto.
- Conciliación y comprobantes.

### Lane 5 — Documentación técnica y 3D

- Corregir contrato de `registros_tecnicos`.
- Modelo GLB maestro por proyecto.
- Relación lógica con espacios.
- Visor real; eliminar el cubo demostrativo.

### Lane 6 — QA integral

- Rutas y permisos.
- Ciclos de estado.
- Escrituras completas.
- Encoding y storage.
- Build y pruebas funcionales.
- QA visual desktop, tablet y móvil.

## 14. Arnés agéntico

| Rol | Modelo recomendado | Función |
|---|---|---|
| Orquestador | Modelo principal | Conserva matriz, dependencias y decisiones |
| Worker de inventario | `gpt-5.4-mini` | Cruza rutas, schemas, zaps y componentes |
| Worker de lane | `gpt-5.4-mini` cuando el contrato sea mecánico | Ejecuta solo su superficie |
| QA mecánico | Modelo liviano | Gates, diff, rutas, encoding y tipos |
| Auditor | Modelo principal en sesión separada | Contrasta contrato, evidencia y resultado |
| Humano responsable | Usuario | Aprueba diseño, mutaciones estructurales y producción |

Reglas:

- una lane, una rama y un entorno aislado;
- operaciones de git estructurales serializadas;
- ningún worker escribe datos reales de producción;
- snapshots antes de migraciones;
- escrituras completas, nunca payload parcial;
- una lane no se audita a sí misma;
- toda lane cierra con commit, push y evidencia;
- las definiciones se publican como revisión coherente.

## 15. Definition of Done del programa

- [ ] Navegación global contiene como máximo las áreas acordadas.
- [ ] Comercial muestra por defecto oportunidades vigentes.
- [ ] Leads no calificados no contaminan cotizaciones.
- [ ] Existe ficha integral de proyecto sin duplicar subsistemas.
- [ ] Producción valida requerimientos antes de Finanzas.
- [ ] Cada compra conserva trazabilidad de sus ítems.
- [ ] Se soportan anticipos, parciales y recepción.
- [ ] Finanzas no altera especificaciones técnicas.
- [ ] El costo real puede consultarse por proyecto.
- [ ] Modelo 3D maestro puede aislarse por espacio.
- [ ] No queda visor 3D ficticio.
- [ ] Componentes redundantes se eliminan o consolidan.
- [ ] No se modifican archivos de engine por necesidades de negocio.
- [ ] `validate:encoding`, `validate:storage`, compilación y build están verdes.
- [ ] Auditor independiente emite CONFORME.
- [ ] Promoción a producción recibe gate humano explícito.

## 16. Obstáculos conocidos

1. `page_routes`, `schema_definitions` y `scripts` tienen ciclo de publicación por
   revisión; no deben editarse y desplegarse como tres archivos independientes.
2. El working tree puede contener lanes de la web pública en progreso; las futuras
   lanes ERP deben aislarse.
3. `ProjectDetails`, `FichaProduccion` y otras vistas se solapan.
4. `RegistrosTecnicosFeed` no coincide con el schema vivo.
5. El visor 3D actual muestra geometría demostrativa.
6. `zap_activar_produccion` mezcla contrato, cobros, estado y orden.
7. El abastecimiento actual crea deuda antes de modelar aprobación y recepción.
8. Hay enlaces históricos de documentación que apuntan a rutas antiguas.
9. La escritura parcial de registros ha causado pérdida real de datos; todas las
   lanes deben verificar el objeto completo antes de persistir.

