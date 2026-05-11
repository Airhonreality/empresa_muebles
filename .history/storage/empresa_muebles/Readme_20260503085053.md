## 🛰️ 0. Visión del Ecosistema
*Infraestructura de Operaciones Soberana para Diseño y Manufactura de Mobiliario.*

*   **Propósito (North Star)**: Ser la fuente única de verdad y el motor de operaciones que garantiza que la intención del diseño se materialice sin errores desde la captación hasta la instalación.
*   **Modelo de Negocio**: Diseño personalizado (B2C/B2B), fabricación directa (Carpintería Industrial) e instalación técnica.
*   **Actores Principales**: 
    *   **Diseñador Comercial**: El puente entre el sueño del cliente y la realidad técnica.
    *   **Jefe de Producción**: Orquestador de la fábrica y compras.
    *   **Carpintero / Instalador**: Los ejecutores que consumen información técnica (3D/Planos).
    *   **Marketing & Web**: Los proyectores del éxito (Portafolio).
    *   **Contador**: El auditor de flujos.

---

## 📐 1. Determinantes de Negocio
*Leyes inmutables para eliminar la carga cognitiva y el caos.*

*   **Reglas de Oro**: 
    *   **Dato Único**: Si una medida cambia en el "Espacio", debe actualizarse en la cotización y el despiece automáticamente.
    *   **Trazabilidad Inmutable**: Cada acción (compra, cambio de diseño, pago) genera un Log con responsable y marca de tiempo.
    *   **Modularidad Atómica**: Un proyecto es una suma de espacios, un espacio una suma de módulos, y un módulo una suma de materiales.
*   **Objetivos de Valor**: 
    *   Reducir el tiempo de cotización de horas a minutos.
    *   Eliminar el error humano en la transición Contrato -> Producción.
    *   Visualización 3D ubicua (en el celular del carpintero).

---

## 🧬 2. Inventario de Arquetipos (Clases)
*Las piezas que componen la realidad de "La Empresa".*

| Arquetipo | Propósito | Resonancia (Conexiones) |
| :--- | :--- | :--- |
| **Client** | Identidad del comprador y su historial. | Projects |
| **Project** | Contenedor principal de la intención (Contrato, Fotos, Estado). | Client, Spaces, Quotes |
| **Space** | Sub-entidad (Cocina, Closet). Maneja medidas y fotos de levantamiento. | Project, Modules |
| **Module** | Entidad de diseño prediseñada (Cajón, Gabinete). | Space, Materials |
| **Material/Service** | Catálogo central de costos (Madera, Herraje, Mano de obra). | Modules, Inventory |
| **Quote** | Proyección económica con manejo de variaciones. | Project, Versions |
| **Work_Order** | Instrucción técnica para taller (Planos, Despiece). | Project, Workers |

---

## ⚙️ 3. Dinámica de la Voluntad (Workflows)
*Procesos críticos a automatizar.*

1.  **IGNITE_QUOTE (Cotización Inteligente)**:
    *   **Gatillo**: Selección de módulos y materiales en un Espacio.
    *   **Secuencia**: Calcular costos -> Aplicar margen -> Generar PDF organizado -> Vincular a Proyecto.
2.  **CRYSTALLIZE_CONTRACT**:
    *   **Gatillo**: Aceptación de cotización.
    *   **Secuencia**: Clonar datos de cotización a formato legal -> Generar PDF para firma -> Notificar a Producción.
3.  **PRODUCTION_DETONATION**:
    *   **Gatillo**: Firma de contrato.
    *   **Secuencia**: Generar lista de compra -> Verificar stock -> Asignar tareas a Cronograma -> Enviar planos 3D a operarios.

---

## 🎭 4. Proyección de Realidad (Vistas)
*Cómo habitamos el sistema.*

*   **`/schema`**: Para definir nuevos materiales y módulos.
*   **`/project/:id/viewer`**: El "Command Center" del proyecto (Fotos, 3D, Presupuesto).
*   **`/workshop/mobile`**: Vista simplificada para carpinteros (Solo planos y estados de tarea).
*   **`/portfolio/public`**: Autoproyección de proyectos terminados al sitio web.

---

## 📜 5. Registro de Decisiones (ADR)
*Historial de por qué la materia es como es.*

*   **[Fecha]**: [Decisión y Razón]

---

> **Nota**: Este archivo es el único origen de la verdad para el desarrollo del proyecto. Si no está aquí, no existe en la realidad del sistema.


"repsuesta literal del usuario NO BORRAR":{Dale comenzamos entonces el norte estar el alma de este proyecto es ser la fuente de operaciones o la infraestructura de operaciones de la empresa de mobiliario y diseño de interior personalizado no importa el nombre de la empresa de hecho mantengamos lo agnóstico y en el anonimato llamémoslo la empresa bien lo que hace la empresa es captar clientes compradores que quieran o necesiten amoblar su hogar oficinas etcétera etcétera contamos con un punto de fábrica donde trabajamos la carpintería de manera profesional y directa ya sabes lo que tener una fábrica implica inventario de almacén operarios compras facturas procesos de producción etcétera así mismo contamos con diseñadores industriales especializados que visitan a los clientes hacen levantamiento de espacios toman toda la información del proyecto y con base en esa información fotografías planos requerimientos de clientes hacen diseños en 3D generalmente en sketchup o en rino y generan propuestas de diseño esto involucra la cotización por lo cual un catálogo centralizado tanto de productos materiales como de servicios así como de módulos prediseñados desde un cajón hasta una cocina completa que se constituiría de sus módulos más pequeños entre otros costos se le presenta al cliente este es todo el trabajo comercial se diseña y se hace una venta obviamente se genera un contrato legal con todas las especificaciones y detalles del proyecto que pasa producción donde se ramifica en compras de material despiece del proyecto prácticamente hay que volver a diseñar todo el modelo en 3D a detalle compras cruce con inventario en almacén asignación de planos de armado a carpinteros asignación de planos de instalación a grupos de instalación coordinación de transporte de material de proveedor al taller coordinación de proveedores coordinación de pagos coordinación de envíos de proyecto al sitio de instalación instalación manejo de comunicaciones con el cliente informarle el estado del proyecto hacerle cobros registrar pagos tanto de salidas como de entradas hacer entregas exitosas hacer claramente una muy buena fotografía y registro de los productos entregados almacenarlo republicarlo en sitio web que sería parte de esta infraestructura un sitio web público donde se muestran las fotografías de los proyectos a cada cliente se le puede hacer una carta con un registro de todo si si a la entidad cliente está asociado todo pues sería mucho más fácil simplemente al final asociarle también las fotografías del proyecto y en la página simplemente habría que invocar los modelados 3D que se hicieron las fotografías una descripción y todo sería auto proyectado también para redes sociales ahora en cuanto al organigrama de la empresa pues básicamente consiste de diseñadores comerciales jefes de producción carpinteros e instaladores y marketing y comunicaciones web por así decirlo y un contador... Más o menos a si resumido es la empresa

0 uno de los dolores de cabeza por los que he decidido emprender la programación es el hecho de demorarse mucho haciendo cotizaciones puesto que las cotizaciones de un espacio un proyecto en general se asigna a un cliente pero este proyecto puede tener múltiples subespacios para cotizar dentro de esos espacios pueden haber su módulos y el cliente a veces quiere variaciones de un espacio cambiando un material o cambiando un atributo del proyecto y el dolor más grande no tener un sistema de cotización robusto que permita manejar estas entidades y así mismo proyectar un PDF final con todas las tablas organizadas y los valores ya definidos en un punto específico del PDF porque tarda mucho tiempo haciéndose el cálculo y además transcribiendo eso a un PDF presentable causa mucho tiempo luego la generación del contrato también hay que hacerlo manualmente comenzar a pasar los datos de la cotización al contrato para poder generar ese documento y que sea firmado enviarlo por correo todo este tipo de cosas otro gran dolor es no tener un lugar centralizado con todas las definiciones del proyecto donde se vean claramente fotos del espacio medidas del espacio detalle de los módulos diseñados adjunta la cotización adjuntos incluso en un formato especial los modelados 3D cada espacio para que el carpintero en su celular pueda abrirlo girarlos verlos arriba verlos abajo etcétera el hecho de que la información esté dispersa en muchos sitios y no haya una claridad hace que las cargas cognitivas de todo el equipo se aumenten llega las 7 de la mañana y es un estrés porque todo el tiempo están saliendo compras que no se agrupan correctamente hay retrocesos porque los muebles a veces no se diseñan bien o siguiendo los requerimientos que el cliente dijo en algún momento pero quizás no fueron registrados o no fueron transmitidos correctamente al carpintero que armó el proyecto y lo que involucra retrocesos de instalación etcétera tampoco hay un seguimiento de todas las acciones que pasan en la empresa me parece que se abre un registro de logs sería muy bueno que registre cada acción que pasa en qué momento pasa quién la hace haría que también hubiera un registro desde los cronogramas haría que realmente se comenzaran a implementar cronogramas porque eso hasta ahora no existe no existe un calendario no existen tareas asignadas a cada persona así que todo es un caos
}