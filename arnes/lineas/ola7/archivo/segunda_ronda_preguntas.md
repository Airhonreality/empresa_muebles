# Segunda ronda de preguntas a Javier — banco de preguntas y respuestas

**Qué es este archivo:** insumo de la entrevista de la ronda 2 del mapeo sistémico. Contiene los huecos de información que quedaron abiertos tras auditar `logica_de_negocio.md` (cruce de la rama del agente con la rama del Supervisor, 2026-08-03), ahora con las respuestas de Javier registradas en línea. Las respuestas alimentan la Parte I del mapa — ninguna pregunta toca schema ni UI todavía.

**Qué NO es este archivo:** no es el mapa. `logica_de_negocio.md` no se toca hasta que estas respuestas se integren en una pasada de edición del mapa.

**Estado:** 21 preguntas — **todas respondidas** (Q2 y Q7 se resolvieron en la ronda 2). Sección de flags y pendientes al final. El cierre del diamante vive en `cierre_diamante.md`.

---

## Bloque 1 — Aprobación de compras

> Contexto: el mapa dice que la aprobación es "la única causa válida de que exista una compra" pero nunca detalla cómo la cumple el rol, en qué momentos ni qué determinantes son críticos.

**1. Cuando el desarrollador termina la lista de materiales, ¿qué revisa exactamente el comercial para aprobar?**
→ Sí. Revisa sobre el modelado que el desarrollador hizo que TODOS los requerimientos de diseño se cumplieron: cantidad de cajones, atributos específicos de cada mueble, tipos de apertura, colores de iluminación, colores de tableros melamínicos, fachadas y estructura, medidas generales de los espacios, tipos de mesón y acabados puntuales (mates, brillante, pintura poro abierto, poro lleno). El cotizador funge como constructor de proyectos y se divide como una matrioshka: **capa proyecto → espacio → módulos/items**. Cada espacio tiene un schema detallado sobre: requerimientos del cliente; elementos existentes (neveras, electrodomésticos, fichas técnicas de voltaje, aperturas, o artefactos dependientes como impresoras, computadores) con sus medidas y detalles de instalación o requerimiento sobre el módulo; descripciones del espacio físico; fotos de levantamiento de planos y fotos del espacio. En general cada capa de la matrioshka tiene su detalle.

**2. ¿Qué hace que una aprobación sea rechazada? ¿Y qué pasa después — quién corrige y qué?**
→ Se responde en la respuesta 1: la aprobación se basa en el **check de schema** contra el modelado del desarrollador — si no se cumplen todos los requerimientos de diseño (cantidad de cajones, atributos, aperturas, colores, acabados, medidas, tipos de mesón), se rechaza. El loop de corrección queda en manos del desarrollador (y el sistema no pasa al siguiente estado hasta que el check pasa). → RESUELTA en ronda 2.

**3. ¿La aprobación la da una sola persona o requieren que estén de acuerdo el comercial y el desarrollador?**
→ Actualmente se requiere que estén diseñador y desarrollador en una reunión. Una vez asentado el hábito, se puede hacer por simple **check de schema**, dejando los cambios en el mismo sistema. Eso eliminaría la dependencia de una reunión.

**4. Cuando la misma persona es la que vendió y la que desarrolló, ¿se salta el paso o igual se revisa?**
→ Independiente del rol que tenga la persona, el proceso se respeta. Si es la misma persona, se tiene que reunir con ella misma para hacer la validación sobre el schema, para que el sistema pase al siguiente estado.

## Bloque 2 — Capa de flujo de trabajo unificado y visibilidad

> Contexto: Javier quiere trabajar gerencialmente con tiempo libre — eso exige saber qué está pasando en toda la empresa sin preguntar, y que todos (empleados y aliados) registren en qué momento del flujo están y cuánto duran en cada fase.

**5. Hoy, ¿cómo sabés en qué está cada proyecto sin preguntar? ¿Existe una lista o panel donde todos marcan su avance?**
→ "Yo soy comercial, conozco el proyecto desde que entra hasta que termina porque dirijo cada momento." Hace los pagos de compras, a veces se salta sus propios protocolos. **Una vez las compras están en taller, pierde el control**: se estima una fecha de entrega pero le toca llamar al desarrollador cada día a ver en qué estado está, o recibir novedades por WhatsApp, o ir al taller. No sabe si los protocolos de buenas prácticas se cumplieron. → Flag: falta agregar **manual de buenas prácticas (ISO)** a cada etapa, principalmente a los maquinados en producción: uso de plantillas, uso de discos para acanalado y no de fresas, uso de árbol para bisagras, uso de la herramienta adecuada. Eso sería una segunda capa de aplicación de sistema de tareas y procesos, PERO con que se aplique la primera capa de control entre subsistemas, es el desbloqueante para pasar a la segunda capa.

**6. ¿Cada persona debería poder marcar "empecé / terminé / quedé bloqueado" en su tarea, y que eso se vea para todos? ¿O preferís que solo ciertos roles vean todo?**
→ No: el log lo registra el sistema, no es necesario que cada persona anuncie si empezó una tarea. Existen tareas que se inician y se terminan, y el sistema las registra y filtra. El empleado no dice "empecé": sube la orden de compra, marca un domicilio recibido cuando afirma que lo recibió. No anuncia "terminé": envía el proyecto a la siguiente etapa, simple. Los carpinteros y auxiliares **no deberían usar pantallas para esto todavía** — eso es segunda capa. Por ahora con que el desarrollador marque que compras hizo bien el pedido, que el proveedor hizo bien su despacho, y que las cosas ya están en el taller verificadas en cantidades y funcionando, basta para que el proyecto pase a un estado de control total del subsistema de desarrollo-taller. Comercial solo tiene que esperar citación a revisión de calidad (o a quien corresponda hacer la calidad).

**7. Los eventos de calendario (visitas, entregas, garantías, reuniones): ¿cuáles se planean con anticipación, cuáles nacen el mismo día cuando pasa algo, y cuáles se agendan para evitar choques?**
→ Respondida en la ronda 2 (Q7):
- **Visitas:** se agendan entre cliente y comercial, basado en franjas libres de ambos.
- **Producción:** se agenda semanalmente para desarrollar los momentos clave del flow de proyectos; **mínimo 1 reunión semanal de aprobación** hasta que el sistema lo asuma.
- **Garantías:** 8-12 días hábiles (ya está en el contrato).
- **Novedad crítica:** 5-24 horas.
- **Cronograma desde el contrato:** una vez el cronograma se establece desde el contrato, se agendan las fechas de cada etapa: compras, aprobación, 1 semana de ensamblaje, 1 semana de instalación. Al cliente se le da un **rango de fecha de instalación de 5 días** en la semana X.
- **Presupuesto de holgura:** todas las fases pueden retrasarse un par de días, sumando **máximo 5 entre todas**. El dinero disponible es el máximo condicionante que puede causar la entropía total.
- **Regla de inmutabilidad:** las tareas internas se deberían imprimir una sola vez y **no modificarse espontáneamente**. Solo las tareas externas al sistema pueden afectar las internas, y eso mueve el cronograma automáticamente.
- **Por qué importa:** de este control dependen las nóminas de los empleados — si el cronograma se mueve por causa interna, los aliados pierden estímulos; si el cronograma registra cambio por factor externo, los empleados se miden también moviendo esos plazos. → RESUELTA en ronda 2.

**8. Cuando se agenda un evento de un aliado externo (diseñador, instalador), ¿tiene que verse en el mismo calendario que los empleados?**
→ (No entendió la pregunta, pero respondió el fondo.) No hay calendario público compartido: cada empleado solo debe ver **lo que tiene que hacer y cómo hacerlo bien**; no necesita ir a mirar un calendario a ver si cuadra tiempos. Está situado en su línea temporal y ve lo relevante para despejar sus tareas en el mismo sistema, como una **asistencia en la acción**, no como un trabajo extra de reportaje. El log es automático porque es la acción misma. Si la tarea requiere administrar tareas de otros empleados, quizás se requiera un calendario común — pero solo porque la tarea lo requiere (ej. el desarrollador necesitaría uno para carpinteros e instaladores; el admin uno para flujos generales; y así sucesivamente).

## Bloque 3 — Integraciones con herramientas de producción

> Contexto: nunca se mapeó qué produce cada herramienta externa (modelado 3D, render, servicio de corte "Cloud") ni cómo llega su artefacto al siguiente paso. Reabre el punto 7 diferido del cuestionario.

**9. ¿Con qué software se hace el modelo 3D y el render que se le cobra al cliente? ¿El archivo pasa directo a la lista de corte o se redibuja?**
→ SketchUp + OpenCutList. Existe un prototipo de **"Veta Designer"** en la carpeta `devs` para organizar los componentes del proyecto: clasificar piezas melamínicas (fachadas, laterales, zócalos), listar herrajes por módulo, colores y acabados, etiquetas y escenas para render. Es básicamente la traducción del schema de proyecto a una capa que etiqueta los objetos en el modelo 3D. Se busca un mejor software de diseño que permita modularización y diseño de espacios por control CLI basado en módulos y predefiniciones dinámicas para arquitectura.

**10. La lista de corte para el servicio "Cloud" de melamina: ¿se exporta de algún programa o se arma a mano? ¿En qué formato?**
→ OpenCutList de SketchUp.

**11. ¿Hay algún punto donde hoy se copia y pega información entre programas porque no hay conexión? ¿Cuáles?**
→ Sí: OpenCutList → CVC → (copia y pega) → Corte Cloud, si el proveedor es SivalTriplex. Si no es SivalTriplex, toca mandar formato Excel, o peor, ajustarse al formato del proveedor; implica verificación humana y mayor seguimiento. Por eso se prefiere SivalTriplex: asegura la calidad.

## Bloque 4 — Documentación y costos fijos

> Contexto: el mapa cubre la facturación saliente (contador en Aliado) pero no la documentación que entra (cuentas de cobro de proveedores) ni los costos fijos (arriendo), ni la documentación gráfica de las etapas intermedias del proyecto.

**12. Cada proveedor subcontratado (vidrio, mesones, cojines, marmolero): ¿cómo cobra? ¿Te pasa una cuenta de cobro o factura? ¿Dónde la guardás hoy?**
→ La mayoría de proveedores pasan factura electrónica. Javier debe hacer las **cuentas de cobro** de su arrendatario o sus transportistas (aunque con Yango es factura). Debido al modelo de contratación por micro servicios, se deben manejar **micro cuentas de cobro o micro contratos** — no sabe cómo hacerlo aún, pero si es obligatorio tener la cuenta firmada por el proveedor del servicio, podría pedirse un permiso de uso de firma y autogenerarlas con cada registro transaccional.

**13. El arriendo del taller y los costos fijos del mes: ¿se registran en algún lado hoy o se pagan de memoria?**
→ Las salidas se registran ocasionalmente en docs Excel esparcidos. Se necesita **control de compras prioritariamente**, para mantener la confianza del equipo de socios. → Flag: menciona "equipo de socios" — dato nuevo no mapeado todavía.

**14. Las fotos y documentos de cada etapa de un proyecto (retoma de medidas, armado, entrega): ¿dónde viven hoy? ¿Quién las toma?**
→ Viven en el Antiguo ERP en R2 Cloud (esa es la idea: que se tomen desde la misma app), pero a veces no se suben y están en el celular. **Google Drive es el principal alojador**: contiene la carpeta VETA_ERP con proyectos, propuestas y SDK mobiliario — ahí se mueve todo el flow de un proyecto. La carpeta proyecto tiene una subestructura en `G:\Mi unidad\VETA_ERP` → **FLAG: se puede revisar y diagnosticar esta ruta (verificado: existe).**

## Bloque 5 — Modelo de compensación por rol

> Contexto: el mapa tiene la narrativa del pago por rol (diseñador, desarrollador, auxiliar) pero no el diseño del modelo: cuenta y saldo por rol, momentos de pago, reglas de comisión, y quién se clasifica como "aliado" vs. "empleado".

**15. Al diseñador se le paga el $100k del diseño 3D directo, más comisión si el proyecto cierra: ¿en qué momento exacto se le paga cada una? ¿Cómo lleva la cuenta hoy?**
→ **$130k de diseño + comisión** (confirmado en ronda 2). Aclara: "yo soy diseñador, así que no llevo cuenta conmigo mismo, pero necesito hacerlo." → **CONTRADICCIÓN RESUELTA en ronda 2:** el valor correcto es **$130k**, y debe comenzar a facturarse en DIAN — por eso se le sube el precio. Hay que **calcular y estimar cuánto le queda al destinatario del pago post-impuestos** y ahí sí vender el servicio de "diseñador libre". Incluso se pueden crear **capacitaciones especializadas para el diseño y venta de proyectos**.

**16. Al desarrollador se le paga aparte el desarrollo y la mano de obra de taller: ¿en qué momentos se le paga?**
→ Se le paga **por quincena, por hitos terminados**. Se le paga desarrollo aparte, mano de obra aparte, y **comisión 5% por cumplimiento de cronograma**. Si se desfasa, se debe restar de alguna forma. "Necesita verlo y hacerlo así."

**17. A los auxiliares (por día o al contrato): ¿cómo se decide y cuándo se paga?**
→ Operativo en taller: se paga **tiempo** (x horas + horas extras) + **comisión por módulo instalado** si se cumple el cronograma. El cronograma es la base de la confianza. **El proyecto debe cumplir 2 ciclos básicos: (1) ciclo de desarrollo y compras, (2) ciclo de ensamblaje e instalación.** Cada ciclo dura ~15 días en un proyecto promedio; si el proyecto crece, se puede estimar un porcentaje de crecimiento en los tiempos. El tamaño de un proyecto se puede medir por valor y cantidad de items/módulos asociados. → **Capacidad real hoy:** gente en producción 2.5 (desarrollador + carpintero + auxiliar ocasional) → **1.25 proyectos por semana**, disponiendo del sábado libre. Comercial 2 personas → **1.25 proyectos al mes**, no por falta de capacidad de diseño sino por **falta de leads cualificados**. Un diseñador tiene capacidad de atender **3 visitas, diseños y presupuestos entregados por semana**, y disponer de tiempo.

**18. ¿Hay un límite claro de quién es "empleado" y quién es "aliado"? ¿O es la misma persona según el día?**
→ **Todos son socios** (confirmado en ronda 2): los aliados a veces responden a comisiones, entonces son socios — ej. desarrollo 5%, carpintero % por tamaño, y los dueños. No hay línea dura empleado/aliado; la distinción operativa es "socio con comisión" vs. "socio dueño".

## Bloque 6 — Rutinas y capacidad instalada

> Contexto: sin rutinas declaradas no se puede calcular cuánto puede producir realmente la empresa. La capa estratégica (dónde conduce el mercado, qué oportunidades hay) va en una sesión aparte (arnés §2.D) — este bloque es solo lo operativo.

**19. ¿Qué rutinas existen hoy? (¿Planificás la semana? ¿Se asigna el trabajo en el taller cada mañana? ¿Revisás caja cada mes?)**
→ Las rutinas que se están creando ahora:
1. **Retoma de medidas.**
2. **Reunirse post-desarrollo con comercial a aprobar proyecto.**
3. **Comprar** — hacer un solo proceso distribuido de a los proveedores y terceros, y dejar pago a todos apenas se dispone del dinero. Política: **no acumular deuda** — apenas se cierra un proyecto se debe disponer del estimativo de costos fuera de la caja, así el gerente sabe con cuánto dinero dispone realmente, invirtiendo las entradas inmediatamente que entran a la empresa, pagando por prioridad materiales, arriendos y nóminas.
4. **Recibir material exitoso.**
→ "Con esas 4 rutinas claves cumplidas con calidad se asegura el resto de la calidad del proyecto por default. Lo demás es capa 2."

**20. ¿Cuántos proyectos creés que el taller puede terminar en un mes con la gente actual? ¿Y cuántos diseños 3D por semana?**
→ Respondida dentro de la Q17: producción 1.25 proyectos/semana (2.5 personas, sábado libre); comercial 1.25 proyectos/mes limitado por leads; diseñador 3 visitas/diseños/presupuestos por semana.

**21. ¿Cuánto tiempo tarda en promedio un proyecto, de firma a entrega, hoy?**
→ **Hoy tarda 6.5 semanas. Ideal: 4 semanas.** (Coherente con los 2 ciclos de ~15 días: 30 días ≈ 4 semanas.)

---

## Flags detectados en las respuestas (para destilar)

1. **Contradicción de precio — RESUELTA:** diseño 3D = **$130k**, no $100k. Y el servicio debe **facturarse en DIAN** (por eso sube el precio): hay que calcular el neto post-impuestos del destinatario. Idea emergente: capacitaciones especializadas para el diseño y venta de proyectos.
2. **"Todos son socios"** (Q18): no hay línea dura empleado/aliado — aliados responden a comisiones (desarrollo 5%, carpintero % por tamaño), dueños son socios estructurales. El "equipo de socios" (Q13) se integra a este modelo. **La confianza de socios motiva el control de compras** — la compensación es el pegamento del modelo.
3. **Dos capas de sistema, explícitas:** Capa 1 = control entre subsistemas (gates, estado del proyecto, verificación de despacho/recepción en taller). Capa 2 = tareas/procesos en taller + manual de buenas prácticas ISO + pantallas para carpinteros/auxiliares. **La capa 1 es el desbloqueante; la capa 2 NO se construye todavía.**
4. **Modelo de visibilidad: "asistencia en la acción", no reportaje.** El log es automático porque es la acción misma (subir orden, marcar domicilio recibido, enviar a siguiente etapa). Nada de "marcar empecé/terminé" manual.
5. **Calendario por rol, no público.** Cada quien ve su línea temporal; calendario común solo si la tarea lo requiere (desarrollador para carpinteros/instaladores; admin para flujos generales).
6. **Aprobación pre-compras = check de schema a futuro, no reunión.** Hoy reunión diseñador+desarrollador; el sistema debe permitir la validación por schema y dejar cambios en el sistema.
7. **Integraciones reales:** SketchUp + OpenCutList → CVC → Corte Cloud (SivalTriplex preferido). Prototipo "Veta Designer" en carpeta `devs` = traducción del schema de proyecto a etiquetas en el modelo 3D. Gap de copia/pega cuando no es SivalTriplex.
8. **Micro cuentas de cobro / micro contratos** (Q12): modelo nuevo, solución propuesta = permiso de uso de firma + autogeneración con cada registro transaccional.
9. **Capacidad instalada real:** producción 1.25 proy/semana (2.5 personas, sábado libre), comercial 1.25 proy/mes (limitado por leads, no por diseño), diseñador 3 visitas+diseños+presupuestos/semana.
10. **2 ciclos de 15 días** = modelo temporal del proyecto; hoy 6.5 semanas, ideal 4 semanas. Tamaño de proyecto medible por valor y cantidad de items/módulos.
11. **Compensación por rol concreta:** diseñador $130k+comisión; desarrollador quincena por hitos + desarrollo aparte + mano de obra + comisión 5% cronograma (desfase resta); auxiliar horas+extras+comisión por módulo instalado si cumple cronograma.
12. **Rutas externas para diagnóstico:** `G:\Mi unidad\VETA_ERP` (Drive, alojador principal de documentación gráfica del proyecto) — verificada accesible. Antiguo ERP R2 como idea de origen de la toma de fotos en app.
13. **Nuevo — cronograma inmutable como columna vertebral (Q7):** el cronograma se fija desde el contrato; las tareas internas se imprimen una vez y no se modifican espontáneamente; solo eventos externos mueven el cronograma automáticamente. Holgura total: máx 5 días entre todas las fases. De este control dependen las nóminas — si el cronograma se mueve por causa interna los aliados pierden estímulos; si se mueve por factor externo, los empleados se miden moviendo esos plazos.
14. **Nuevo — política financiera "no acumular deuda":** apenas se cierra un proyecto se dispone del estimativo de costos fuera de la caja; pagar por prioridad materiales, arriendos, nóminas; el dinero disponible es el condicionante máximo (puede causar "entropía total").
15. **Nuevo — tipología de eventos de calendario (Q7):** visitas (cliente+comercial, franjas libres de ambos), producción (agendamiento semanal, mín. 1 reunión de aprobación hasta que el sistema la asuma), garantías (8-12 días hábiles, contractual), novedad crítica (5-24 horas).

## Pendientes

- ~~Preguntas sin responder: Q2 y Q7~~ → **Ambas RESUELTAS en ronda 2** (Q2 se responde con Q1; Q7 completa con tipología + cronograma inmutable).
- ~~Confirmar valor del diseño 3D~~ → **RESUELTO: $130k + facturación DIAN.**
- **Calcular neto post-impuestos del diseñador** (nuevo pendiente de negocio).
- **Integrar estas respuestas en `logica_de_negocio.md`** (Parte I) en la próxima pasada de edición.
- **Diagnosticar `G:\Mi unidad\VETA_ERP`** (estructura real de carpetas del flow de proyecto) — tarea nueva propuesta.
- Sesión estratégica (§2.D, abanico de ≥5 metodologías) registrada aparte, NO en este banco.
- **Diseñar el modelo de micro cuentas de cobro / micro contratos con permiso de firma** (Q12, solución propuesta a validar).

## Notas de registro

- Fecha: 2026-08-03
- Fuente: cruce de auditoría del mapa (`logica_de_negocio.md`) — rama del agente × rama del Supervisor; respuestas de la ronda 2 de Javier registradas en línea.
