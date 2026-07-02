# Panel de Administración Financiera y KPIs: Diseño Axiomático 2026-2027

## 1. Contexto de Investigación (Tesis Doctorales 2026-2027)
La administración financiera contemporánea ha evolucionado hacia un modelo de **Gestión Estratégica del Desempeño** y **Arquitectura Empresarial Basada en Grafos de Conocimiento (Knowledge Graphs)**. Las investigaciones de frontera en 2026-2027 resaltan:
- **Gestión Predictiva y de Liquidez:** Modelado de flujos de caja futuros basándose en cuentas por cobrar/pagar.
- **Grafos Semánticos para Integridad de Datos:** Uso de modelos semánticos integrados (como el concepto de *Digital Twin Enterprise*) para asegurar que agentes humanos y de IA comprendan la ontología de cada entidad.
- **Homeostasis Financiera:** Entidades puras y transversales donde la lógica de negocio (arriendos, nómina, proveedores) es independiente de la UI y los scripts.

## 2. Destilación de la Arquitectura Actual (Core Organizacional)
Mediante el uso de herramientas CLI, se destila el ciclo iterativo real de la empresa:
- **Ventas (Diseño, Contrato y Anticipo):** `leads` → `proyectos` → `contratos` (Precios fijos pero con variaciones/anexos documentados; la calculadora es flexible pero el registro es inmutable y cristalino) → `abonos_contrato`.
- **Desarrollo (Accionado por Ventas):** Generación de planos de armado y especificaciones de compras.
- **Compras (Accionado por Desarrollo):** Comunicación con `proveedores` → `compras_materiales` → Pagos. **Agnosticismo puro:** No nos enredamos con tipos de compras (maquinados, totales, parciales); simplemente es una obligación de salida de dinero y un registro transaccional.
- **Producción (Accionado por Compras):** Recepción y transformación de los insumos (`ordenes_trabajo` → `tareas_produccion`).
- **Cierre:** Instalaciones y recolección de pagos finales de los `clientes`.

## 3. Integración Semántica (El Mapa Axiomático)
Atendiendo a las tendencias de Arquitectura Empresarial 2026, **cada schema debe tener un campo semántico obligatorio**. Esto creará un grafo de conocimiento interno para que cualquier agente de IA o nuevo desarrollador entienda la función del schema sin ambigüedades.

**Campo transversal requerido:**
- `descripcion_semantica` (markdown): Describe el propósito existencial del schema, sus reglas de negocio y cómo se relaciona en el ecosistema.

*Nota Estratégica:* Debemos hacer un barrido por todos los schemas legacy (`contratos`, `proveedores`, `proyectos`, etc.) para inyectar este campo.

## 4. Arquitectura Propuesta (Diseño Axiomático de Nam P. Suh)
Para generar una arquitectura desacoplada y agnóstica (homeostática respecto a UI/Scripts), los requerimientos funcionales (FRs) se mapean a parámetros de diseño (DPs) independientes.

- **FR1:** Controlar dónde reside el dinero físico y digital.
  - **DP1: `cuentas_financieras`**
- **FR2:** Clasificar la naturaleza del flujo monetario (Ingresos vs Costos) de manera independiente.
  - **DP2: `categorias_financieras`** 
- **FR3:** Registrar todo evento de entrada, salida o traslado de dinero como verdad absoluta.
  - **DP3: `movimientos_financieros`** (Ledger centralizado).
- **FR4:** Administrar deudas, anexos de contrato y cuentas por cobrar sin acoplar la UI al tipo de material.
  - **DP4: `obligaciones_pendientes`** (Cuentas por pagar/cobrar desacopladas del pago real).
- **FR5:** Mantener trazabilidad documental.
  - **DP5: `comprobantes_financieros`**

### Modelado Agno (Nuevos Schemas Faltantes)

#### A. Cuentas Financieras (`cuentas_financieras`)
- `descripcion_semantica` (markdown)
- `nombre` (text)
- `tipo` (select) - banco, efectivo, pasarela, billetera_digital.
- `saldo_inicial` (number)
- `estado` (select) - activa, inactiva.

**Datos Iniciales a Poblar:**
1. *Bancolombia negocios* (Empresarial main).
2. *Bancolombias personales* (Javier - Alternativa a la empresarial; transferencias con llave, pagos oficiales y caja menor).
3. *Nu Victor*.
4. *Nu Javier* (Reservas).
5. *Nequi Javier*.
6. *Nequi Victor* (Caja menor).

#### B. Categorías Financieras (`categorias_financieras`)
- `descripcion_semantica` (markdown)
- `nombre` (text)
- `tipo_flujo` (select) - ingreso, egreso.
- `subtipo` (select) - capex, opex, costos_directos.

#### C. Obligaciones Pendientes (`obligaciones_pendientes`)
*Registro puro de deberes (arriendos, anexos de contratos, anticipos, nómina). Cristalino y preciso.*
- `descripcion_semantica` (markdown)
- `descripcion` (text)
- `tipo` (select) - por_pagar, por_cobrar.
- `monto_total` (number)
- `fecha_vencimiento` (date)
- `estado` (select) - pendiente, parcial, pagado, anulado.
- *Relaciones (Opcionales por contexto):* `proveedor_id`, `usuario_id`, `contrato_id`, `cliente_id`.

#### D. Comprobantes / Soportes (`comprobantes_financieros`)
- `descripcion_semantica` (markdown)
- `numero_referencia` (text)
- `tipo` (select) - factura_electronica, cuenta_cobro, recibo_caja, comprobante_bancario.
- `archivo_soporte` (text) - URL.

#### E. Movimientos Financieros (`movimientos_financieros`)
*El Ledger Inmutable. Entradas y salidas de dinero axiomáticas.*
- `descripcion_semantica` (markdown)
- `fecha` (date)
- `tipo` (select) - ingreso, egreso, transferencia.
- `monto` (number)
- `cuenta_origen_id` (relation → cuentas_financieras)
- `cuenta_destino_id` (relation → cuentas_financieras) - *(Solo transferencias)*
- `categoria_id` (relation → categorias_financieras)
- `obligacion_id` (relation → obligaciones_pendientes) - *(Si aplica a una deuda/anexo)*
- `comprobante_id` (relation → comprobantes_financieros)

## 5. Crítica Arquitectónica: El Paradigma del "Libro de Agentes" vs. Subsistemas Departamentales

Has planteado una disyuntiva clásica en la arquitectura de software empresarial: **¿Deberíamos unificar a todas las personas y organizaciones (empleados, clientes, proveedores, contratistas) en un único schema maestro de `agentes` (lo que en bases de datos tradicionales se llama el *Party Pattern* u *Objeto Tercero*)?**

Vamos a ser brutalmente honestos y a diseccionar esto usando los principios fundacionales del **Diseño Axiomático de Nam P. Suh**.

### El Espejismo de la Unificación (El Anti-Patrón Acoplado)

A simple vista, crear un schema único llamado `agentes` parece una excelente idea porque reduce el número de tablas. Desde la teoría de grafos, tener un solo "Nodo" de persona centraliza las conexiones. 

Sin embargo, viola flagrantemente el **Axioma de la Independencia (Axiom 1: Maintain the independence of the functional requirements)**. 

Si fusionamos un Cliente, un Empleado y un Proveedor en un solo schema `agentes`, nos enfrentaremos a lo siguiente:
- **Sobrecarga de Campos (Spaghetti Data):** El schema empezará a llenarse de campos que solo aplican al 30% de los registros. El Empleado necesita `rol_sistema` y `tarifa_hora`. El Proveedor necesita `nit`, `categoria_insumos` y `dias_credito`. El Cliente necesita `direccion_envio`, `canal_adquisicion` y `presupuesto_estimado`.
- **Violación del Axioma de la Información (Axiom 2: Minimize the information content):** Al tener docenas de campos irrelevantes para cada tipo de agente, la entropía del sistema (el contenido de información innecesario) se dispara. Los scripts (Zaps) tendrían que llenarse de sentencias `if (agente.tipo === 'proveedor')` para evitar errores, lo cual destruye la homeostasis del código. Una UI que intente renderizar este *schema* se volverá un monstruo inmanejable de campos condicionales.

### La Solución Axiomática: Múltiples Schemas con Identidad Agnóstica

En un motor modular y ciego como **Agno**, la *verdadera agnosticidad* no significa meter todo en la misma bolsa, sino **aislar dominios puros** que se comunican a través de llaves de relación limpias.

1. **Mantener la Pureza Departamental:** Un `proveedor` pertenece al dominio de Compras/Producción. Un `cliente` pertenece al dominio del CRM/Ventas. Un `usuario_equipo` pertenece al dominio de RRHH/Operaciones. Cada uno tiene su propio *schema*, con los campos estrictamente necesarios para su requerimiento funcional (entropía cero).
2. **El Enlace Financiero (Resolución del Conflicto):**
   ¿Cómo hacemos que el *Ledger* (`movimientos_financieros`) sepa a quién le estamos pagando sin crear un enredo?
   La propuesta más pura y homeostática es **crear campos de relación mutuamente excluyentes y opcionales** dentro del movimiento financiero:
   - `proveedor_id` (relation → proveedores)
   - `cliente_id` (relation → clientes)
   - `usuario_id` (relation → usuarios_equipo)
   
   Al momento de registrar un pago (mediante UI o Zap), el sistema solo llena el campo que corresponda. La base de datos se mantiene pura.

3. **El "Grafo Semántico" como Puente Unificador:**
   Aquí es donde entra la sugerencia de la **Tesis de Grafos 2026**. El nuevo campo obligatorio `descripcion_semantica` que hemos agregado a todos los schemas permitirá que cualquier agente LLM entienda que tanto `proveedores` como `clientes` son "Entidades Físicas o Jurídicas" capaces de recibir o enviar dinero. 
   
   La unificación **no ocurre en la base de datos (que debe permanecer departamentalizada y normalizada)**, sino que **ocurre en la capa de conocimiento (IA) y en la capa de presentación (UI)**. Cuando quieras ver "a quién le debo dinero", la UI simplemente consultará `obligaciones_pendientes` e inferirá el nombre buscando en las tres relaciones, proyectando una sola lista coherente para el usuario humano, sin haber corrompido el almacenamiento subyacente.

**Decisión Final:** No crearemos un schema universal de `agentes`. Mantendremos los schemas actuales (`clientes`, `proveedores`, `usuarios_equipo`) y los enlazaremos al *Ledger* financiero de forma independiente. Esto garantiza que la lógica de negocio fluya de forma natural (homeostasis) y que el sistema pueda escalar sin colapsar por su propio peso.

---
## FASE 2: Planeación UX, Ergonomía Cognitiva y Navegabilidad

La implementación del sistema financiero se despliega en un entorno de operaciones físicas (taller, instalaciones, obra) a través de dispositivos heterogéneos (móviles, tablets, laptops). Nos basamos en investigaciones doctorales de 2026 sobre **Ergonomía Cognitiva** y **Minimalismo de la Información**.

### 1. Entropía Navegacional y el Principio de la Matrushka (OS Style)
He analizado el árbol actual mediante los comandos CLI (`list-navs`) y detecté entropía en la forma en que los menús (`nav_erp_main`, `nav_admin`) apilan enlaces. Además, **es fundamental no mezclar la lógica de la Web Comercial (que tiene su propio menú y home de ventas) con el área del ERP que estamos trabajando.**

**Solución Axiomática (Selector de Workspaces):**
Para respetar el *Axioma de la Independencia*, la navegabilidad del ERP debe emular la estructura de los *Espacios de Trabajo (Workspaces)* de un Sistema Operativo (OS), aplicando el principio de la *Matrushka Navegacional* (un mapa jerárquico de contexto que envuelve al usuario). 
- El menú contextual será minimalista y estándar, representando un árbol esquemático tabulado.
- Estará acompañado siempre del **contexto de identidad**: Usuario activo, Fecha y Hora actual (estilo OS).
- **Integración de Workspaces Actuales:** 
  - *Workspace Operaciones (ERP):* Producción, Proyectos, Catálogo.
  - *Workspace Financiero (ERP):* Cuentas, Ledger, Obligaciones, Comprobantes.
  Al cambiar de workspace, el menú muta jerárquicamente hacia adentro de la "matrushka", eliminando el ruido visual de los departamentos irrelevantes.

### 2. Minimalismo de la Información (Shadcn UI)
La UI se diseña con ausencia de ruido visual, usando tokens de Shadcn UI (sin emojis, tipografía estricta, colores sobrios). Los operarios verán *formularios orientados a tareas* ágiles (ej. "Abonar a Contrato"), enfocados exclusivamente en la acción a realizar para reducir la carga cognitiva.

### 3. Agilidad en Inputs y Soportes (Sin Fricción)
- **Selector de Archivos Inteligente:** El componente de carga nativo de Agno ya es inteligente y ágil: permite navegar por el sistema local del celular y al mismo tiempo tomar la foto sin ser mutuamente excluyente. Utilizaremos esta capacidad para adjuntar los `comprobantes_financieros` de forma natural, sin acoplar artificialmente el sistema a la cámara.
- **Fechas y Tiempos Axiomáticos:** Evitaremos la "magia" de conversores de texto en vuelo que generan entropía técnica. Aplicando lógica de sistemas básica, todo registro incluye un *time zap* interno (timestamp de la DB) invisible para el usuario que asegura la inmutabilidad del sistema (Fase 1). Sin embargo, para brindar agilidad, la UI presentará un campo predefinido con la fecha actual que es **100% modificable** por el usuario (útil para actualizaciones de datos o registros tardíos de comprobantes). Este balance entre rigidez sistémica y flexibilidad humana es lo que nos distancia de los ERPs anticuados.

### 4. Pensamiento Sistémico en Automatizaciones (Zaps Mínimos)
No inyectaremos magia de UI ni "Zaps de milisegundos" que solo crean entropía técnica; el objetivo es que la aplicación quede bien implementada, estable y robusta.
- La gran mayoría de interacciones se mantendrán como **registros simples en la base de datos**.
- Solo analizaremos y desplegaremos **Zaps mínimos compuestos** para accionar las automatizaciones estrictamente necesarias (ej. cuando se asienta un movimiento de pago, un Zap simple actualiza el saldo de la deuda). Lo simple es escalable.

### 5. El Ledger Financiero como Interfaz Crítica
El *Ledger* (`movimientos_financieros`) será un punto de interacción crítica, diseñado para disminuir la carga cognitiva en el registro ágil de pagos *in situ*.
- Se comportará como una interfaz ágil (Master-Detail).
- Permitirá **procesamiento en bloque (Batch Processing)** para registros o actualizaciones de datos masivas (ej. aprobar pagos múltiples a contratistas), optimizando radicalmente el tiempo del administrador financiero.

### 6. Delimitación del Módulo Financiero y Árbol de Navegación

**Frontera del Módulo:**
El módulo financiero es estrictamente un **Workspace (Entorno de Trabajo)** aislado dentro del dominio `/app` del ERP.
- **Inicia:** En la selección del contexto "Finanzas" desde el menú global (Contexto OS / Identidad).
- **Termina:** En el momento en que el usuario cambia su contexto a "Operaciones" o cierra sesión. No existe "sangrado" funcional (ej. es imposible editar planos de producción desde Finanzas ni mezclarlo con la web comercial).

**Comparativa del Árbol de Rutas (Antes vs. Después)**

**Árbol Actual (Entrópico y Plano):**
```text
/ (Web Comercial - Dominio Público)
├── /espacios-a-medida
├── /colecciones
└── /agendar

/app (ERP Mixto - Todos ven todo mezclado)
├── /app/proyectos
├── /app/proyectos/:id
├── /app/catalog
├── /app/prefabricados
├── /app/ficha/:id
└── /app/usuarios
```
*Problema actual:* Navbars como `nav_erp_main` y `nav_admin` comparten y aglomeran estas rutas sin un envoltorio jerárquico puro.

**Árbol Post-Implementación (Matrushka Axiomática):**
Se crea una jerarquía estricta donde la raíz del ERP (`/app`) aloja el *Switcher* de contextos, separando radicalmente los dominios.

```text
/ (Web Comercial - Intacta e Independiente)
├── /espacios-a-medida
├── /colecciones
└── /agendar

/app (Sistema Operativo ERP - Raíz de Identidad)
│
├── /app/operaciones (Workspace Operativo - Agrupa el ERP actual)
│   ├── /app/operaciones/proyectos
│   ├── /app/operaciones/proyectos/:id
│   ├── /app/operaciones/catalogo
│   ├── /app/operaciones/produccion
│   └── /app/operaciones/equipo
│
└── /app/finanzas (NUEVO Workspace Financiero - Aislado)
    ├── /app/finanzas/ledger       (Master-Detail: Movimientos y Dashboard)
    ├── /app/finanzas/obligaciones (Cuentas por Pagar / Cuentas por Cobrar)
    ├── /app/finanzas/cuentas      (Administración de Bancos y Cajas)
    └── /app/finanzas/comprobantes (Archivo y Registro de Soportes)
```

**Distribución del Artefacto UX (Menú Contextual)**
Al entrar a `/app/finanzas`, la interfaz se distribuye aplicando el minimalismo estructurado:

1. **Header OS (Contexto de Identidad Constante):** 
   Muestra un bloque superior inmutable: `[Avatar] Javier | Miércoles 24 Jun, 15:00 | ▾ Workspace: Finanzas`
2. **Nav Árbol (Menú Minimalista Específico):**
   La navegación lateral o colapsable solo contendrá los nodos de su "matrushka":
   - 📊 **Ledger (Flujo de Caja)** → *Apunta a `movimientos_financieros`*
   - ⚖️ **Obligaciones (Deudas)** → *Apunta a `obligaciones_pendientes`*
   - 🏦 **Cuentas (Bolsillos)** → *Apunta a `cuentas_financieras`*
   - 🧾 **Soportes (Facturas)** → *Apunta a `comprobantes_financieros`*

Esta delimitación asegura que cuando el administrador está operando en Finanzas, la entropía sobre información de "catálogos" o "ensamblajes" es cero, garantizando velocidad de ejecución y claridad cognitiva.

---
## 7. Resolución de Ambigüedades y Setup Inicial (Zaps, Taxonomía y Seguridad)

Para cerrar herméticamente el plan y proceder a la ejecución, definimos la estructura operativa final basada en las certezas acordadas.

### A. Migración Histórica (Greenfield)
El sistema se encuentra en fase beta y no existen registros financieros previos que migrar. Los proyectos actuales pasarán a producción, pero el flujo financiero iniciará desde cero. Esto nos permite avanzar agresivamente con una implementación *Greenfield* pura.

### B. Zaps Mínimos (Estructura Teleológica)
Para evitar la entropía y asegurar la precisión matemática frente a los reajustes de la vida real, se definen estrictamente dos Zaps (scripts) fundamentales:

1. **`zap_registrar_pago`**:
   - *Propósito:* Asentar salidas o entradas de dinero asociadas a una obligación (deuda o cobro).
   - *Lógica Matemática:* No confía ciegamente en un contador aislado. Al ejecutarse, suma todos los movimientos previos atados a esa `obligacion_id` y calcula el nuevo saldo real (`monto_pagado`). 
   - *Flexibilidad de Campo:* Permite registrar pagos parciales y asienta el registro inmutable en el Ledger.
2. **`zap_anular_movimiento`**:
   - *Propósito:* Permitir reajustes humanos por errores en campo.
   - *Lógica Matemática:* Modifica el `estado` del movimiento a "anulado" (no lo borra para mantener auditoría) y vuelve a disparar la sumatoria matemática sobre la obligación para reversar el saldo.

### C. Taxonomía Base de Categorías y Obligaciones Recurrentes
Las bases de datos se poblarán inicialmente con la siguiente estructura proporcionada:

**Costos Fijos (OPEX Base):**
- *Arriendo Carpintería:* $1.200.000 / mes
- *Nómina Directivos (Pago Quincenal):* Victor ($2.500.000), Javier ($2.000.000), Harold ($2.500.000).
- *Contabilidad (Pago Quincenal):* Sebastián Moreno ($400.000).
- *Oficiales de Taller (Pago Quincenal):* Daniel Jaraba ($80.000 / día, aprox. 25 días trabajados).

**Costos Variables (Asociados a Producción):**
- Proveedores de transporte.
- Materiales e insumos.
- Partes prefabricadas.
- Ayudantes ocasionales.

### D. Matrices de Seguridad y Permisos (RBAC)
La delimitación de acceso a los distintos *Workspaces* y áreas de la aplicación se regirá estrictamente por los roles del schema `usuarios_equipo`:

1. **Producción (Jefes de taller y Operarios):** Acceso restringido al Canvas de producción y fichas de proyecto.
2. **Comercial:** Acceso exclusivo a proyectos en estado de cotizaciones.
3. **Finanzas:** Acceso al *Workspace Financiero* (Ledger, Facturación, Cuentas, Comprobantes).
4. **Admin (Administrador de Negocio):** Visibilidad total, incluyendo Finanzas y Operaciones (Nota: Separado de los privilegios de *System Admin/Dev*).

### E. Kaizen Sistémico: Reparto de Utilidades y Transparencia de Socios
Dado que Harold es socio con un 5% de participación, su rol asciende a Administrador Financiero (Visibilidad total de la salud económica). Para garantizar el principio de "Caja de Cristal" (transparencia absoluta), se integra un Zap enfocado en el cálculo determinista del rendimiento.

**Zap Avanzado: `zap_liquidar_utilidades_proyecto`**
- *Propósito:* Eliminar la especulación financiera al finalizar un contrato, automatizando el pago de participaciones basado en datos puros.
- *Lógica Matemática de Extracción:* 
  1. Recopila todos los `movimientos_financieros` de *ingreso* atados al `contrato_id` (Anticipos, Saldos).
  2. Recopila el costo exacto de los *egresos directos* (Compras de materiales y fletes de ese proyecto).
  3. Escanea el schema `registro_horas`, extrae todas las horas reales invertidas en ese proyecto por todo el equipo y las multiplica por sus respectivos `costo_hora`. 
  4. Ejecuta: `Utilidad Neta = Ingresos - (Materiales + Costo Laboral Exacto)`.
  5. Genera automáticamente una `obligacion_pendiente` (Comisión/Dividendo) por el 5% de esa utilidad neta a favor del `usuario_id` de Harold.
- *Impacto Homeostático:* Convierte la confianza humana en certeza algorítmica. Nadie tiene que discutir si un proyecto fue rentable o no; el sistema cruza las horas operativas reales y los egresos para disparar la recompensa.
