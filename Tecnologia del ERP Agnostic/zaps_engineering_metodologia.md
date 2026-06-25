# Metodología de Zaps Engineering y Diseño Axiomático

Esta metodología es el núcleo tecnológico del **ERP Agnostic** (Veta Dorada). Surge de la necesidad de abandonar el desarrollo de software acoplado y transicionar hacia una arquitectura de sistemas puros, guiada por el Diseño Axiomático de Nam P. Suh y la Teoría General de Sistemas (TGS).

## 1. El Paradigma del "Zap Engineering"
Un "Zap" no es simplemente un script de backend; es un **diodo de entropía**. Su función no es solo mover datos de la Tabla A a la Tabla B, sino asegurar la homeostasis del sistema: garantizar que las reglas matemáticas y de negocio se cumplan en milisegundos, permitiendo que la interfaz de usuario (UI) se mantenga ágil y minimalista.

El Zap Engineering nos obliga a:
- **No confiar en la UI:** Las matemáticas críticas (ej. liquidar utilidades, sumar deudas) siempre ocurren en el Zap, nunca en el front-end.
- **Rastreabilidad Absoluta:** Un Zap nunca borra un error humano de la base de datos, lo "anula" o lo compensa para mantener la auditoría intacta.
- **Convertir Intuición en Datos:** Eliminar el "costo estático estimado" sustituyéndolo por recolecciones dinámicas (ej. leer horas de trabajo reales de la operación productiva para calcular el costo exacto del proyecto).
- **Axioma de Verificación Humana (Human-in-the-Loop):** Un Zap que completa un ciclo organizacional crítico (ej. convertir una lista comercial en una Orden de Compra real) jamás debe operar ciegamente. La interfaz debe obligar al experto (ej. Jefe de Taller) a auditar, ajustar (tornillos, herrajes reales) y validar el *input* antes de que el Zap automatice el *output*. La calidad de un Zap se mide por su capacidad de cerrar loops sin saltarse el criterio humano experto.

## 2. El Loop de Ingeniería (Proceso de Implementación)
Cualquier nuevo requerimiento, subsistema o idea de negocio debe pasar por esta **Matriz de Proceso Loop** antes de que se escriba una sola línea de código para interfaces:

### Fase A: Destilación del Problema (Inputs)
1. **Recolección Cruda:** Entender la teleología (objetivo final) del negocio. (Ej. *"Quiero darle 5% de comisión a un socio"*).
2. **Análisis de Entropía:** Detectar cómo este problema podría generar caos si se implementa ingenuamente. (Ej. *"Si lo calculamos a ojo, habrá fricción. Si lo metemos en un schema de Nómina estático, acoplamos la arquitectura y matamos la escalabilidad"*).
3. **Mapeo Objetivo:** Definir el output tecnológico. (Ej. *"Lograr una caja de cristal: transparencia absoluta y cálculo determinista cruzado con la producción"*).

### Fase B: Arquitectura de Datos (Schemas y Realidad)
1. **Diseño Axiomático (Schemas):** Traducir el requerimiento a entidades puras. Rechazar arquitecturas aglomeradas (como el *Party Pattern*). Crear entidades departamentales puras (`proveedores`, `clientes`) y enlazarlas por llaves de relación limpias.
2. **Grafo Semántico (`descripcion_semantica`):** Inyectar a cada schema y a cada registro clave una descripción estricta en Markdown sobre su propósito existencial. Esto entrena al LLM y documenta el sistema automáticamente.
3. **Población Semilla Inmediata:** Inyectar los datos reales del negocio (Cuentas bancarias exactas, salarios, costos fijos) en el momento de creación para someter la teoría a la realidad matemática.

### Fase C: Zaps Engineering (Inteligencia Algorítmica)
1. **Definición de Zaps Mínimos:** Diseñar la menor cantidad posible de scripts para orquestar los datos. Lo simple es escalable.
2. **Cierre de Vectores de Fuga:** Identificar qué podría salir mal en la operación in situ. (Ej. *"¿Qué pasa si el taller registra la compra de madera pero no la cuenta por pagar?"*) y crear Zaps neutralizadores invisibles (`zap_convertir_compra_en_obligacion`).
3. **Matemática Ciega:** El Zap siempre recalcula desde el origen. En lugar de hacer una suma rápida `saldo = saldo - abono` (susceptible a *race conditions*), el Zap hace auditoría completa: `saldo = Monto_Total - SUMA(Todos_los_Abonos_Validos)`.

### Fase D: Ergonomía Cognitiva (Interfaces Eficientes)
1. **Workspaces Aislados (Matrushka):** La UI nunca muestra todo el ecosistema. Encapsula dominios (Finanzas vs. Producción) amarrados al Rol del usuario, reduciendo la entropía navegacional y llevando la carga cognitiva a casi cero.
2. **Optimistic UI y Fricción Cero:** Construir componentes sin ruido visual (Shadcn UI), integrar el hardware de forma nativa (apertura directa de la cámara para comprobantes) y actualizar la pantalla sin recargar, mientras el Zap procesa en el fondo.
3. **Derivación de KPIs Operativos:** La interfaz final no es un simple gestor de registros, es un panel táctico. (Ej. *Horas Estimadas (Costo Teórico) vs. Horas Reales (Costo Dinámico) = Fuga de Tiempo y Rentabilidad Neta*).

## 3. Resultado Práctico (Caso: Módulo Financiero Veta Dorada)
Al aplicar esta metodología en bloque, se transformó un requerimiento contable en un **Motor de Inteligencia Operativa**:
- **Axiomas Aplicados:** Base de datos dividida en 6 schemas modulares interconectados (Cuentas, Obligaciones, Movimientos, Registro de Horas).
- **Zaps Desarrollados:** Creado el algoritmo `zap_liquidar_utilidades_proyecto` que extrae ingresos reales, costos de insumos, y costo exacto por minuto laborado para arrojar matemáticamente el 5% de un socio, eliminando toda discusión humana.
- **Interfaces Concluidas:** Roles limitados y un panel Master-Detail ultra rápido que separa definitivamente el "hacer muebles" de "gestionar liquidez".

## 4. Matriz de Loops de Verificación (El Ecosistema Vivo)
El sistema no es un almacén estático de datos, es un motor de flujos (Loops) donde cada dominio pasa la estafeta al siguiente, siempre requiriendo un filtro humano.

### Loop 1: El Flujo de Compras y Aprovisionamiento (Producción ➔ Compras ➔ Taller)
- **Input (Producción):** Harold revisa el diseño, consolida la lista técnica estricta (tornillos, herrajes) y la envía. No negocia, no cotiza.
- **Intervención Humana (Departamento de Aprovisionamiento):** Recibe la lista técnica, busca al proveedor predilecto, gestiona el pedido vía WhatsApp, recibe la cotización final y transfiere/solicita el pago a Finanzas. Coordina la orden de recogida (flete o proveedor).
- **Acción/Zap:** Al pagar y confirmar, el Zap cambia la orden a "En Tránsito".
- **Verificación Final Humana (Taller):** Llegan los insumos. Harold/Taller verifica estado y cantidades físicas. Si hay fallas (NOK), el loop se devuelve a compras. Si todo es correcto (OK), el Zap marca los materiales como "En Stock", liberando la producción.

### Loop 2: El Flujo de Ingresos (Comercial ➔ Finanzas ➔ Producción)
- **Input (Comercial):** El vendedor cierra un trato y el ERP genera una obligación `por_cobrar` del 50% de anticipo.
- **Verificación Humana (Finanzas):** El Contador revisa físicamente el extracto bancario para comprobar que los fondos del cliente realmente entraron.
- **Acción/Zap:** El Contador liquida el cobro subiendo el pantallazo. El Zap aumenta el saldo de la caja de la empresa.
- **Output (Siguiente Subsistema):** Automáticamente, la tarjeta del proyecto se desbloquea y avanza en el Kanban de Producción, avisándole a Harold que ya tiene luz verde (y fondos) para arrancar planos.

### Loop 3: El Flujo de Nómina (Operaciones ➔ Finanzas ➔ Equipo)
- **Input (Operaciones):** El equipo de taller llena religiosamente su `registro_horas` atado a cada proyecto.
- **Verificación Humana (Finanzas):** Al final de la quincena, el Contador corre la pre-liquidación. No paga a ciegas: revisa que no haya horas anómalas o descuenta anticipos de sueldo que tenga en su cabeza/registros.
- **Acción/Zap:** Tras ajustar la obligación, transfiere, sube comprobantes y liquida.
- **Output (Siguiente Subsistema):** Costeo exacto inyectado en el historial del Proyecto, permitiendo liquidar utilidades reales al final del ciclo.
