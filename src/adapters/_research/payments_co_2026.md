Reporte Técnico: Arquitectura e Integración de Pasarelas de Pago para E-commerce en Colombia bajo Entornos Serverless (Next.js/Vercel)
La arquitectura de un e-commerce de muebles de alta gama presenta desafíos técnicos y financieros singulares. Desde la perspectiva financiera, el alto valor del ticket promedio (frecuentemente superior a los millones de pesos colombianos) exige plataformas con robustos motores de prevención de fraude, pero con un soporte ágil para evitar el bloqueo de transacciones legítimas. Desde el punto de vista arquitectónico, el despliegue del sitio sobre un stack moderno como Next.js en infraestructuras serverless o Edge (Vercel o Netlify) condiciona fuertemente la elección del proveedor de pagos. En estos entornos, las funciones sin estado (stateless), los tiempos de arranque en frío (cold starts) y la compatibilidad de módulos de Node.js en Edge Runtimes obligan a priorizar pasarelas con APIs REST puras, excelente manejo asíncrono (webhooks) y flujos de tokenización que no comprometan el rendimiento del servidor.

Este reporte examina en profundidad las principales pasarelas del mercado colombiano (Wompi, ePayco, Bold y MercadoPago), delineando sus modelos de integración, procesos de cumplimiento (KYC), estructuras de costos, experiencia del desarrollador (DX) y modelos de confirmación asíncrona, para culminar con una recomendación arquitectónica precisa para la fase nacional y un panorama de escalabilidad internacional.

PARTE 1 — ANÁLISIS EXHAUSTIVO DE PASARELAS NACIONALES (COLOMBIA)
El mercado colombiano requiere obligatoriamente la integración de PSE (Pagos Seguros en Línea) y transferencias desde billeteras digitales locales (Nequi y Daviplata). Dado que la integración directa con las redes de ACH para PSE exige infraestructuras bancarias certificadas, el patrón de diseño estándar para un e-commerce es el uso de pasarelas en modelo "Agregador", las cuales exponen una API unificada para la orquestación de pagos con tarjeta de crédito, débito bancario y efectivo.

1. Wompi (Ecosistema Grupo Bancolombia)
Wompi, respaldada por la infraestructura tecnológica del Grupo Bancolombia, ha iterado su arquitectura para ofrecer soluciones orientadas al desarrollador mediante una API REST directa y componentes de tokenización en el cliente.

Modelo de Integración y Métodos de Pago
La pasarela soporta un modelo híbrido. Para un control total sobre la interfaz de usuario en Next.js, se emplea la API directa (/v1/transactions), la cual requiere la previa tokenización de los instrumentos de pago desde el navegador. Los métodos soportados incluyen tarjetas de crédito y débito (Visa, Mastercard, Amex), cuentas Nequi, el Botón Bancolombia, transferencias vía PSE y corresponsales bancarios para pagos en efectivo. El flujo técnico requiere inyectar un script ligero de Wompi en el cliente ($wompi.initialize) que genera un identificador único de sesión (session_id) utilizado para la huella anti-fraude del dispositivo. Posteriormente, los datos sensibles viajan directamente a los servidores de Wompi, los cuales devuelven un token que el frontend de Next.js envía a sus Server Actions o API Routes para concretar el cargo, garantizando el cumplimiento PCI-DSS al no tocar el servidor del comercio. Además, la normativa local y de la pasarela exige que la petición de transacción incluya tokens de aceptación (acceptance_token y accept_personal_auth), los cuales demuestran que el usuario aceptó los términos legales y de tratamiento de datos personales.   

Proceso de Activación (KYC) y Tiempos Reales
El proceso de vinculación comercial (onboarding) es completamente digital. Para una persona jurídica, Wompi requiere el Registro Único Tributario (RUT), el certificado de existencia y representación legal (Cámara de Comercio) con expedición no mayor a 30 o 90 días, la cédula del representante legal al 150% y una certificación bancaria actualizada. Aunque la documentación oficial promete activaciones rápidas, los reportes en comunidades de desarrolladores indican que, si bien la cuenta en Sandbox es inmediata, la activación en Producción para cuentas que procesan altos volúmenes (como muebles de lujo) desencadena análisis manuales de riesgo que pueden extender el proceso entre 3 y 5 días hábiles, exigiendo frecuentemente soportes adicionales como facturas de proveedores o fotografías del inventario.   

Estructura de Comisiones y Desembolsos
Wompi destaca por una estructura de costos altamente competitiva en su plan Agregador. La tarifa de intermediación reportada se sitúa en 2.65% + $700 COP + IVA por transacción exitosa. Para un e-commerce de alto valor, el modelo de desembolsos es un diferenciador crítico: la plataforma permite recibir desembolsos diarios. Si la cuenta receptora pertenece a Bancolombia o Nequi, los retiros carecen de comisiones adicionales por transferencia interbancaria. Los ingresos netos se calculan deduciendo de la venta las comisiones de la pasarela, el IVA de dicha comisión y las retenciones tributarias de ley aplicables (ReteICA, ReteFuente, ReteIVA), valores que Wompi calcula y retiene de forma automática en cada transacción.   

Documentación y Disponibilidad de SDK
La documentación de la API REST de Wompi es clara y se basa en especificaciones modernas. Sin embargo, carecen de un SDK oficial robusto y tipado para Node.js o TypeScript. Existen iniciativas comunitarias en GitHub (como los paquetes en NPM @pulgueta/wompi o mcp.wompi), pero para aplicaciones críticas en producción, estas dependencias de terceros introducen riesgos de seguridad y mantenimiento. En el ecosistema Next.js, esto se considera una ventaja arquitectónica: la integración se realiza consumiendo directamente la API REST utilizando el cliente HTTP nativo fetch, lo que reduce drásticamente el peso del bundle del servidor y minimiza los tiempos de arranque en frío (cold starts) en entornos serverless como Vercel.   

Modelo de Webhook para Confirmación Asíncrona
Dada la naturaleza asíncrona de pagos como PSE o Nequi (que requieren aprobación externa en aplicaciones bancarias), Wompi implementa un sistema de eventos (webhooks) a través de peticiones HTTP POST. El comercio debe configurar una URL pública en el panel de control para recibir notificaciones sobre cambios de estado (ej. transaction.updated). El servidor en Next.js debe responder obligatoriamente con un código HTTP 2xx para evitar reintentos.
La seguridad del webhook es estricta. Wompi envía una firma asimétrica en la cabecera X-Event-Checksum y dentro del cuerpo JSON en signature.checksum. La verificación criptográfica exige que el desarrollador concatene los valores exactos de los datos definidos en el arreglo signature.properties en el mismo orden recibido, añadir el timestamp del evento, y finalmente concatenar el "Secreto de Eventos" (event secret) provisto en el panel. Este texto plano resultante debe ser hasheado utilizando el algoritmo HMAC-SHA256, y el hash resultante debe ser idéntico al enviado por Wompi.   

Entorno de Pruebas (Sandbox)
Wompi dispone de un entorno de pruebas robusto que opera en paralelo al de producción. Emplean juegos de llaves públicas y privadas distintos, identificables por los prefijos pub_test_ y prv_test_. El entorno permite simular transacciones aprobadas, declinadas o fallidas simplemente variando el número de la tarjeta de prueba o seleccionando bancos específicos en el flujo de PSE. Además, es posible registrar URLs de webhooks exclusivas para este entorno y emitir eventos de prueba desde el dashboard de desarrolladores.   

Problemas y Quejas Frecuentes de Desarrolladores
La comunidad técnica reporta que, si bien la API REST es estable, las integraciones prefabricadas (como plugins para WooCommerce o PrestaShop) están severamente desactualizadas y repletas de bugs. Para un desarrollo a la medida en Next.js esto es irrelevante, pero advierte sobre el enfoque de la empresa. Un punto de fricción técnica común es el algoritmo de verificación de webhooks; dado que el arreglo signature.properties es dinámico y puede variar entre eventos, los desarrolladores que implementan parsers estáticos en Node.js suelen enfrentar errores de validación de firma que descartan pagos exitosos.   

2. ePayco (Ecosistema Davivienda)
ePayco se ha mantenido durante años como una opción sólida en Colombia, favorecida por su profundo enlace con Davivienda y un enfoque granular en la dispersión de fondos, aunque lastrada por infraestructuras heredadas.

Modelo de Integración y Métodos de Pago
La plataforma ofrece una integración directa denominada APIFY para arquitecturas headless. Cubre un amplio abanico transaccional: Tarjetas de crédito/débito, PSE, Nequi, Daviplata, Efecty, Baloto y soluciones de banca internacional como SafetyPay. La integración mediante APIFY requiere una arquitectura de autenticación de dos niveles: primero, el servidor Next.js debe ejecutar una petición de login enviando las credenciales (PUBLIC_KEY y PRIVATE_KEY) codificadas en Base64 bajo el esquema Basic Auth para obtener un JSON Web Token (JWT). Este Bearer Token es el que firma y autoriza las subsiguientes peticiones para la creación de sesiones de pago.   

Proceso de Activación (KYC) y Tiempos Reales
A nivel documental, exige la misma batería de documentos que sus competidores (Cámara de Comercio, RUT, identificación legal y certificación bancaria). Sin embargo, la experiencia de la comunidad señala que el departamento de compliance de ePayco es considerablemente estricto y burocrático. Para comercios de ticket alto, es habitual que retengan transacciones iniciales en cuarentena, solicitando pruebas físicas de la mercancía, facturas de proveedores o comprobantes de envío antes de liberar el dinero, lo que puede dilatar el proceso real de operatividad fluida a más de una semana.   

Estructura de Comisiones y Desembolsos
En su modelo agregador estándar, ePayco establece una tarifa de 2.99% + $900 COP + IVA. Para comercios que operan cuentas de depósito en Davivienda o Daviplata, la comisión se reduce ligeramente a 2.68% + $900 COP + IVA. El mayor detractor financiero reportado por los comerciantes radica en el esquema de retiros: la pasarela permite únicamente tres transferencias o desembolsos gratuitos al mes. A partir del cuarto retiro hacia cuentas nacionales (que no sean Davivienda), el sistema impone un costo fijo de $6.500 COP + IVA por cada transferencia ACH, independientemente del monto.   

Documentación y Disponibilidad de SDK
La plataforma provee múltiples SDKs, incluyendo epayco-sdk-node disponible en NPM. No obstante, el análisis de sus repositorios en GitHub revela que la librería para Node.js es una implementación anticuada basada en promesas puras y callbacks, carente de tipado estricto nativo en TypeScript. Adicionalmente, el SDK impone un peso adicional en dependencias de validación que no aprovechan las capacidades nativas de la plataforma Vercel. Muchos desarrolladores optan por ignorar el SDK y consumir APIFY directamente vía REST.   

Modelo de Webhook para Confirmación Asíncrona
ePayco maneja un modelo de confirmación servidor a servidor mediante una "URL de Confirmación". La plataforma emite una solicitud POST o GET al servidor. La validación de autenticidad se fundamenta en la cabecera o parámetro x_signature. El desarrollador debe construir una firma utilizando el algoritmo SHA256 sobre una cadena de texto que intercala un separador estricto (el carácter ^) entre los valores de p_cust_id_cliente, p_key, x_ref_payco, x_transaction_id, x_amount y x_currency_code. Esta arquitectura de validación es frágil en lenguajes débilmente tipados como JavaScript puro, ya que cualquier alteración en los decimales del campo monto (x_amount) invalida el hash resultante. El servidor debe retornar un código HTTP 200 en menos de 30 segundos.   

Entorno de Pruebas (Sandbox)
Ofrece capacidades de prueba limitadas en comparación a competidores más modernos. La habilitación del modo de pruebas se ejerce inyectando un parámetro booleano (test: true o x_test_request: "TRUE") en el payload de las peticiones REST.   

Problemas y Quejas Frecuentes de Desarrolladores
Las revisiones de la comunidad en los últimos 6 a 12 meses destacan consistentemente un comportamiento hiper-restrictivo en su motor antifraude. Se reportan bloqueos constantes de tarjetas internacionales legítimas y demoras significativas en la resolución de pagos debido a los protocolos internos del agregador que contactan manualmente a los pagadores. El soporte técnico para la resolución de anomalías a nivel de código es percibido como lento.   

3. Bold
Bold ha evolucionado rápidamente desde su dominio en terminales de punto de venta (datáfonos) hacia el ecosistema digital, ofreciendo una API REST que prioriza la experiencia del desarrollador moderno.

Modelo de Integración y Métodos de Pago
La integración digital se ejecuta a través de su "API de Pagos en Línea". Esta API permite el procesamiento de tarjetas de crédito y débito, PSE, Nequi, Botón Bancolombia y su solución de códigos QR (QR Bre-B). A diferencia de flujos más abstractos, la API de Bold exige la manipulación explícita de "Intenciones de Pago" (Payment Intents) y "Concreciones" (Payment Attempts). En el caso de tarjetas, la API integra flujos de seguridad avanzados, exigiendo que el desarrollador recopile una huella digital extensa del dispositivo del usuario final (device_fingerprint), la cual engloba datos como resolución de pantalla, zona horaria y capacidades de Java del navegador, elementos ineludibles para la correcta instanciación de los protocolos 3D Secure (3DS) exigidos por las redes procesadoras.   

Proceso de Activación (KYC) y Tiempos Reales
A nivel burocrático, la solicitud se canaliza a través de canales digitales fluidos, exigiendo RUT, Cámara de Comercio y cédula. La fricción de ingreso es sustancialmente menor que la de ePayco, y la comunidad de desarrolladores reporta que la habilitación de credenciales productivas se procesa de manera expedita, frecuentemente en cuestión de horas o en un máximo de 2 días hábiles.   

Estructura de Comisiones y Desembolsos
La estructura tarifaria para pagos en línea con tarjetas nacionales, PSE y billeteras se sitúa en 2.89% + $900 COP (o 2.99% dependiendo de la modalidad de integración). Los pagos con tarjetas internacionales acarrean un sobrecosto del 1%. Financieramente, Bold se distingue por su integración vertical: si el comercio utiliza la "Cuenta Bold" (su solución nativa de depósito), los fondos provenientes de las ventas digitales se liquidan al instante e incluyen transferencias gratuitas a otros bancos.   

Documentación y Disponibilidad de SDK
La documentación de la API es un referente en la región, adoptando los estándares OpenAPI y esquematizando a la perfección estructuras y respuestas HTTP. No obstante, Bold no proporciona actualmente SDKs o librerías oficiales para Node.js o TypeScript en el espectro de pagos en línea. La documentación clasifica expresamente la API de pagos en línea como una versión en estado "BETA". Las peticiones se autentican inyectando una llave de identidad en las cabeceras HTTP bajo la clave x-api-key (ej. Authorization: x-api-key <llave>).   

Modelo de Webhook para Confirmación Asíncrona
Las notificaciones asíncronas de Bold operan entregando un cuerpo JSON a una URL previamente registrada. La garantía de seguridad e integridad se materializa en la firma inyectada en las cabeceras bajo llaves documentadas como x-bold-signature o equivalentes basadas en HMAC-SHA256. La infraestructura impone que el sistema receptor responda con un estado HTTP 200 en un periodo de ventana muy agresivo (un máximo de 2 segundos) antes de considerar la entrega como fallida, un escenario donde la latencia de las Serverless Functions de Vercel (si se acoplan a bases de datos relacionales lentas) podría presentar inconvenientes de timeout.   

Entorno de Pruebas (Sandbox)
El entorno de pruebas de Bold es de vanguardia. Utilizando llaves de pruebas separadas y un prefijo de entorno particular (integrations.api.bold.co), permite emular el complejo motor de fraude enviando montos de dinero específicos que simulan transacciones aprobadas por 3DS (monto 555001), rechazadas por 3DS (monto 555002), retenidas por motores de riesgo (555040) o sometidas a retos de autenticación donde la API instruye un redireccionamiento del navegador (monto 555020).   

Problemas y Quejas Frecuentes de Desarrolladores
La principal objeción a nivel de arquitectura empresarial es la naturaleza "BETA" de su API de pagos en línea. Los equipos técnicos reportan reticencia a enlazar plataformas transaccionales críticas a endpoints que podrían sufrir rupturas de compatibilidad (breaking changes) o caídas temporales de servicio como consecuencia de iteraciones activas por parte del proveedor.   

4. MercadoPago (Colombia)
MercadoPago posee la infraestructura de procesamiento de pagos más extensa de América Latina, con una sólida penetración en el mercado de compradores colombianos.

Modelo de Integración y Métodos de Pago
Ofrece una arquitectura técnica multicapa que abarca desde redirecciones alojadas (Checkout Pro) hasta integraciones nativas mediante Checkout API e incrustación de interfaces mediante Checkout Bricks para frameworks basados en React. La integración captura transacciones de tarjetas, PSE, Efecty y la utilización de dinero en cuenta del propio ecosistema MercadoPago. El flujo headless gestiona la captura de la tarjeta en el cliente generando un token seguro de un solo uso que luego viaja al backend Next.js.   

Proceso de Activación (KYC) y Tiempos Reales
MercadoPago posee el proceso de alta más eficiente y automatizado del continente; la activación es inmediata. El proceso se ampara en modelos de riesgo algorítmico, solicitando documentación escalar únicamente cuando el volumen transaccional o los montos de la cuenta exceden perfiles predefinidos de control.   

Estructura de Comisiones y Desembolsos
En Colombia, la pasarela adolece de la estructura de comisiones más onerosa entre los grandes proveedores. Si el comercio requiere liquidez inmediata en su cuenta, la comisión asciende a 3.29% + $800 COP + IVA. Para igualar las tarifas de sus competidores, el comerciante debe optar por esquemas de retención voluntaria; si acepta que el dinero permanezca congelado por 14 días tras la autorización de la venta, la tarifa decrece a 2.79% + $800 COP + IVA.   

Documentación y Disponibilidad de SDK
La plataforma brilla en la experiencia técnica (DX). La librería oficial de Node.js (mercadopago) se encuentra en su versión V2, reescrita íntegramente en TypeScript, lo cual provee interfaces estrictas, autocompletado en los IDEs modernos y total integración con el App Router de Next.js. El instanciamiento se maneja de forma limpia y orientada a objetos (new MercadoPagoConfig({ accessToken: '...' })).   

Modelo de Webhook para Confirmación Asíncrona
Los webhooks de MercadoPago despachan cuerpos JSON y adjuntan una firma criptográfica de autenticidad en la cabecera HTTP denominada x-signature. La verificación de seguridad es imperativa pero la complejidad matemática se disipa gracias al uso del SDK oficial, el cual expone un validador nativo (WebhookSignatureValidator.validate()) que procesa la firma HMAC, el identificador x-request-id, y el data.id extraído del evento frente al secreto del webhook, abortando el proceso si detecta anomalías de falsificación.   

Entorno de Pruebas (Sandbox)
Disponen del modelo de sandbox más fiel a las operaciones del mundo real en toda la región. Exigen la creación mediante la API de cuentas de usuarios ficticias (separando lógicamente roles de compradores y vendedores de prueba) para aislar transacciones en credenciales marcadas con el prefijo APP_USR_. Emiten una suite de tarjetas plásticas documentadas para testear aprobaciones de diferentes franquicias y escenarios de declinación.   

Problemas y Quejas Frecuentes de Desarrolladores
Pese a su hegemonía tecnológica, MercadoPago recibe críticas demoledoras a nivel operativo en lo que atañe a las suspensiones de cuenta. Foros como Reddit o comunidades locales documentan un patrón persistente y alarmante en los últimos meses: cuentas de vendedores son suspendidas y sus fondos retenidos automáticamente y sin advertencia por sistemas de Inteligencia Artificial anti-fraude que detectan "comportamientos irregulares" (especialmente en transacciones atípicas de gran envergadura económica). Los usuarios reportan que, al presentarse estas contingencias, la asistencia técnica se reduce a bots y respuestas genéricas ("macros"), dejando flujos de caja atrapados en compliance por semanas o meses, un riesgo inasumible para un comercio de muebles de alta gama.   

TABLA COMPARATIVA FINANCIERA (COLOMBIA)
Pasarela	Comisión Base (Tarjeta/PSE)	Fijo por Tx	Dispersión / Retiros a Banco	Complejidad Anti-Fraude ePay/KYC
Wompi	2.65% + IVA	$700 COP	Gratis a Bancolombia / Nequi	Moderada (Manual en Onboarding)
ePayco	2.99% + IVA	$900 COP	$6,500 COP después del 3er retiro	Alta / Restrictiva en operaciones
Bold	2.89% + IVA	$900 COP	Gratis a Cuenta Bold	Baja / Ágil
MercadoPago	3.29% + IVA (Inmediato)	$800 COP	Sujeto a plazos (hasta 14 días para bajar al 2.79%)	Riesgo de suspensión algorítmica
RECOMENDACIÓN ÚNICA (COLOMBIA)
Considerando rigurosamente el criterio de "integración más simple + mayor compatibilidad" con una arquitectura de Next.js en Vercel, y sopesando los riesgos asociados a operaciones de alto ticket (muebles de alta gama), la pasarela recomendada para iniciar operaciones es Wompi.

Justificación Técnica y Operativa:

Eficiencia en Entornos Serverless (Vercel): La ausencia de un pesado SDK oficial en Node.js de Wompi representa, paradójicamente, una ventaja estructural en despliegues Edge/Serverless. Las API Routes o Server Actions de Next.js pueden emplear la API nativa de JavaScript (fetch) para comunicarse con los endpoints REST (JSON) de Wompi. Esto evita incrementar el tamaño del binario (bundle size), elimina riesgos de incompatibilidad de librerías en motores V8 incrustados y minimiza notablemente el cold start (arranque en frío) de las funciones.

Seguridad Nativa y Arquitectura de Tokenización: El modelo de Wompi provee un script ligero para el cliente que externaliza el trabajo criptográfico y de recolección de datos sensibles (tarjetas de crédito, huellas de dispositivo). El token seguro navega hacia el backend de Next.js, logrando un flujo sin interfaces impuestas (100% headless).   

Estabilidad del Flujo de Caja y Riesgo de Fraude: Para un modelo de muebles de lujo, donde un pedido puede superar los 15 millones de pesos, MercadoPago incurre en un grave riesgo de suspensión algorítmica y congelamiento de fondos, y ePayco bloquea con demasiada frecuencia pagos legítimos. Wompi, respaldado por el motor fiduciario de Bancolombia, provee un entorno transaccional tolerante a grandes montos, liquidez rápida a cuentas de la misma red (evitando las severas tasas de transferencia de ePayco de $6.500 COP), y a diferencia de Bold, su API REST está consolidada y fuera de un estado Beta.   

PARTE 2 — PANORAMA INTERNACIONAL (Alto Nivel)
Ante un proyecto de escalabilidad global futura (fuera de Colombia), el diseño de la arquitectura deberá abstraerse mediante un adaptador. Las plataformas de pago globales se perfilan de la siguiente manera:

Proveedor Internacional	Cobertura Geográfica Fuerte	Modelo de Integración General	Facilidad de Adaptación al Contrato TypeScript
Stripe	Estados Unidos, Canadá, Europa, Australia. En América Latina: México y Brasil.	API REST pura; SDKs para TypeScript soberbios y componentes React ultraligeros (Stripe Elements). Orientación absoluta a infraestructuras Serverless.	Altísima. El flujo semántico de los PaymentIntents de Stripe es el estándar de la industria. Su ciclo de vida asíncrono mapea de forma idéntica y natural a los conceptos del borrador de contrato.
dLocal	Emerging Markets: Penetración masiva en toda América Latina (Chile, Argentina, Perú), África y Asia (APAC).	API unificada Headless para canalizar métodos de pago alternativos locales (OXXO en MX, Boleto o PIX en Brasil, PagoEfectivo en Perú).	Alta. dLocal fue diseñada específicamente para integradores B2B. Los endpoints de cargos y reembolsos seguirían estrictamente la interfaz planteada en la aplicación, requiriendo muy poca reescritura.
MercadoPago	Hemisferio Sur y Centro: Argentina, Brasil, Chile, México, Perú, Uruguay.	Checkout Bricks (React) y Checkout API encriptada en el cliente con resolución en el backend.	Alta. Si el servidor Next.js ya está estructurado, expandir el uso de MercadoPago por el resto de América Latina requiere mínimas alteraciones lógicas de código; la adaptación principal radica en tipos de documentos legales y divisas.
PayPal	Global/Universal (Presente en prácticamente cualquier mercado regulado).	Redirección basada en flujos OAuth y Smart Payment Buttons montados en el cliente. Interfaz REST para Órdenes y Capturas.	Media. PayPal maneja un paradigma distinto: primero se "crea una orden" asíncrona, el usuario aprueba en la ventana de PayPal, y luego el servidor debe "capturar" esa orden. Este proceso de dos pasos distorsiona ligeramente las firmas simplificadas de un método único charge().
PARTE 3 — AJUSTES AL CONTRATO BORRADOR PARA LA PASARELA RECOMENDADA (WOMPI)
La implementación de patrones de diseño, como un adaptador (Interface), asegura la escalabilidad del sistema, permitiendo intercambiar el procesador de pagos (Stripe, dLocal) en el futuro.

Análisis del Borrador Proveído:

TypeScript
interface ChargeRequest { amount; currency; method?; reference; customer; redirectUrl?; metadata?; }
interface ChargeResult { id; externalId?; status; amount; currency; checkoutUrl?; raw?; }
interface RefundRequest { chargeId; amount?; reason?; }
interface PaymentAdapter {
  charge(request): Promise<ChargeResult>;
  getStatus(chargeId): Promise<ChargeResult>;
  refund?(request): Promise<ChargeResult>;
  handleWebhook?(payload, headers): Promise<ChargeResult[]>;
  verifyWebhook?(payload, headers): boolean;
}
El borrador presentado captura la semántica básica de una transacción sincrónica ideal. No obstante, al evaluar la pasarela seleccionada (Wompi) y las condiciones particulares del mercado colombiano (y latinoamericano), el borrador revela carencias técnicas sustanciales que imposibilitarían la integración en Next.js.

Conceptos Incompatibles o Faltantes
Tokens Legales y Anti-fraude Obligatorios: Wompi exige que toda transacción con tarjeta integre tokens criptográficos generados previamente desde el navegador. Particularmente requiere un token de sesión del dispositivo (session_id), un token de aceptación de términos legales (acceptance_token) y un token de autorización para tratamiento de datos personales (accept_personal_auth). Ninguno de estos campos encaja en el actual ChargeRequest.   

Sistema de Cuotas (Installments): En América Latina, las compras de alto valor (como mobiliario) exigen la especificación de cuotas diferidas en las tarjetas de crédito. El borrador omite este entero mandatorio.

Flujos de Información Asimétricos (PSE y Nequi): El concepto method? como un string estático es insuficiente. Si el método es PSE, se exige adicionalmente un código de banco (bankCode) y el tipo de documento del cliente para acoplarse con la red de ACH.   

Validación Criptográfica de Webhooks: El método verifyWebhook(payload, headers) en Next.js App Router (o API Routes) demanda acceso al cuerpo de la petición HTTP original en forma de texto plano (Raw Text Buffer) antes de que sea procesado por el bloque JSON.parse(). Esto es crucial para generar el HMAC-SHA256 exacto exigido por Wompi. La firma propuesta asume objetos parseados que invalidarán matemáticamente el hash.   

Estados Asíncronos (Push Notifications): Si el usuario escoge pagar mediante Nequi, la API no retorna inmediatamente "Aprobado" o "Declinado", sino un estado transicional ("PENDING") esperando que el comprador autorice el cobro en la pantalla de su teléfono móvil en un margen de varios minutos. El contrato ChargeResult carece de un indicador de acciones requeridas (Next Actions).   

Modificación Arquitectónica Propuesta en TypeScript
Para subsanar las omisiones normativas y criptográficas, se propone refactorizar la estructura implementando uniones discriminadas y un manejo tipado preciso adaptado para Vercel:

TypeScript
// Tipos específicos requeridos para compliance regulatorio en Colombia/Wompi
export interface CustomerData {
  email: string;
  fullName: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PP'; // Exigido por reguladores
  documentNumber: string;
  phoneNumber: string;
}

// Discriminación de métodos para inyectar datos específicos por instrumento
export type PaymentMethodInput = 
  | { type: 'CARD'; token: string; installments: number; }
  | { type: 'PSE'; bankCode: string; userType: 'NATURAL' | 'LEGAL'; }
  | { type: 'NEQUI'; phoneNumber: string; }
  | { type: 'CASH'; }; // Baloto/Efecty/Corresponsal

export interface ChargeRequest { 
  amountInCents: number; // Modificado: Motores financieros evitan el punto flotante (ej. $10.000 = 1000000)
  currency: string; 
  reference: string; // ID único interno de la base de datos
  customer: CustomerData;
  method: PaymentMethodInput;
  
  // Parámetros regulatorios y criptográficos exigidos por Wompi
  legalTokens: {
    acceptanceToken: string;
    acceptPersonalAuth: string;
  };
  fraudSessionId: string; // Generado asíncronamente en el cliente

  redirectUrl?: string; 
  metadata?: Record<string, string>; 
}

export interface ChargeResult { 
  id: string; // ID interno de la orden
  externalId?: string; // ID alfanumérico devuelto por Wompi
  status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING';
  amountInCents: number; 
  currency: string; 
  checkoutUrl?: string; // Opcional, usado en redirecciones de PSE
  
  // Nuevo: Determina si el frontend debe iniciar un "polling" o mostrar instrucciones
  nextAction?: {
    type: 'AWAITING_PUSH_NOTIFICATION' | 'REDIRECT_TO_BANK' | 'CASH_PAYMENT_INSTRUCTIONS';
    instructions?: string;
  };
  rawResponse?: any; 
}

export interface WebhookVerificationParams {
  rawBodyText: string; // Requerido para construir el HMAC idéntico
  headers: Headers | Record<string, string>;
}

export interface PaymentAdapter {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  getStatus(externalId: string): Promise<ChargeResult>;
  // Adaptado para leer el texto en bruto de la petición Serverless
  verifyWebhook(params: WebhookVerificationParams): boolean;
  handleWebhook(payload: any): Promise<ChargeResult[]>;
}
La adopción de esta interfaz enriquecida facilitará a futuro el acoplamiento casi directo con las interfaces internacionales de Stripe o dLocal, ya que absorbe de antemano la granularidad exigida por los motores anti-fraude y los marcos normativos globales.

This is for informational purposes only. For medical advice or diagnosis, consult a professional.


docs.wompi.co
Fuentes de pago & Tokenización - Wompi Docs
Se abre en una ventana nueva

wompi.com
Desarrolladores - Wompi
Se abre en una ventana nueva

wompi.com
Planes y Tarifas - Wompi
Se abre en una ventana nueva

docs.wompi.co
Wompi JS - Librería JavaScript
Se abre en una ventana nueva

docs.wompi.co
Wompi JS library reference
Se abre en una ventana nueva

visa-em.com
Información Adquirentes - Visa Colombia Support Services SA
Se abre en una ventana nueva

treli.co
Comparación pasarelas de pago – Treli
Se abre en una ventana nueva

wompi.com
v3-2025 reglamento de comercios wompi
Se abre en una ventana nueva

andres-dev.com
Wompi Bancolombia en WooCommerce: guía completa 2026 - Andrés Dev
Se abre en una ventana nueva

jumpseller.cl
Usando Wompi con Jumpseller
Se abre en una ventana nueva

wompi.sv
Tarifas - Wompi
Se abre en una ventana nueva

github.com
The official TypeScript SDK for Model Context Protocol servers and clients - GitHub
Se abre en una ventana nueva

github.com
Node.js SDK for the SumUp API. - GitHub
Se abre en una ventana nueva

github.com
mcp.wompi/package.json at main · tulkyorg/mcp.wompi · GitHub
Se abre en una ventana nueva

npmjs.com
keywords:pagos-bancolombia - npm search
Se abre en una ventana nueva

docs.wompi.co
Events | Wompi Docs
Se abre en una ventana nueva

docs.wompi.co
Events | Wompi Docs
Se abre en una ventana nueva

docs.wompi.co
Widget & Checkout Web - Wompi Docs
Se abre en una ventana nueva

developers.bold.co
Prueba tu integración simulando una venta - Documentación Bold
Se abre en una ventana nueva

es.wordpress.org
Wompi Portal de Pagos – Plugin WordPress
Se abre en una ventana nueva

docs.epayco.com
Documentos ePayco
Se abre en una ventana nueva

docs.epayco.com
API - Documentos ePayco
Se abre en una ventana nueva

andres-dev.com
Mejores pasarelas de pago para WooCommerce Colombia 2026 - Andrés Dev
Se abre en una ventana nueva

docs.epayco.com
Implementación - Documentos ePayco
Se abre en una ventana nueva

getapp.com.co
ePayco: precios, funciones y opiniones | GetApp Colombia 2026
Se abre en una ventana nueva

capterra.com
ePayco Software Pricing, Alternatives & More 2026 | Capterra
Se abre en una ventana nueva

enviame.io
Las 10 mejores pasarelas de pago en Colombia [2025] - Enviame
Se abre en una ventana nueva

placecommerce.com
Mejores pasarelas de pago en Colombia para tu tienda virtual - Placecommerce
Se abre en una ventana nueva

medium.com
Pasarelas de pago, ¿Cuál elegir? - Komercia - Medium
Se abre en una ventana nueva

jumpseller.cl
Integración con ePayco para tu Tienda Virtual - Jumpseller
Se abre en una ventana nueva

github.com
ePayco by Davivienda - GitHub
Se abre en una ventana nueva

npmjs.com
epayco-sdk-node - NPM
Se abre en una ventana nueva

docs.epayco.com
Web - SDK - Documentos ePayco
Se abre en una ventana nueva

github.com
epayco/resources - GitHub
Se abre en una ventana nueva

github.com
epayco repositories - GitHub
Se abre en una ventana nueva

docs.epayco.com
Páginas de Respuesta y Confirmación - Documentos ePayco
Se abre en una ventana nueva

docs.epayco.com
URL de confirmación - Documentos ePayco
Se abre en una ventana nueva

developers.bold.co
Proceso de Integración - Documentación Bold
Se abre en una ventana nueva

bold.co
Recibe pagos con Bold y obtén una Cuenta Empresarial gratis.
Se abre en una ventana nueva

bold.co
Pasarela de Pagos Online en Colombia - Bold
Se abre en una ventana nueva

bold.co
Tarifas de vender con datáfono Bold
Se abre en una ventana nueva

bold.co
Bre-B: Recibe y envía dinero gratis a otros bancos más fácil y al instante con tu llave Bold.
Se abre en una ventana nueva

bold.co
¿Cuánto le estás pagando realmente a tu banca empresarial? - Bold
Se abre en una ventana nueva

developers.bold.co
Esquema De Datos - Documentación Bold
Se abre en una ventana nueva

developers.bold.co
Integration Sandbox - Documentación Bold
Se abre en una ventana nueva

developers.bold.co
API Link de pagos
Se abre en una ventana nueva

developers.bold.co
Recibe eventos de Bold a través de webhook
Se abre en una ventana nueva

developers.boldsign.com
Validate and verify webhook events - API Documentation - BoldSign
Se abre en una ventana nueva

developer.boldcommerce.com
Build Public Integrations | Bold Commerce Developer Docs
Se abre en una ventana nueva

apps.odoo.com
Bold Payment Links | Odoo Apps Store
Se abre en una ventana nueva

mercadopago.com.co
Checkout API (vía Payments) - Documentación - Mercado Pago Developers
Se abre en una ventana nueva

mercadopago.com.co
Primeros pasos - Documentación - Mercado Pago Developers
Se abre en una ventana nueva

mercadopago.com.co
Cobra con el checkout de Mercado Pago en tu sitio web
Se abre en una ventana nueva

mercadopago.com.co
Suscripciones - Documentación - Mercado Pago Developers
Se abre en una ventana nueva

mercadopago.com.co
Integrar medios de pago - Documentación - Mercado Pago Developers
Se abre en una ventana nueva

mercadopago.com.co
Recibe pagos recurrentes con una suscripción - Mercado Pago
Se abre en una ventana nueva

mercadopago.com.co
Webhooks - Documentación - Mercado Pago Developers
Se abre en una ventana nueva

reddit.com
Me bloquearon la cuenta de MercadoPago / MercadoLibre. Necesito ayuda - Reddit
Se abre en una ventana nueva

reddit.com
Me suspendieron la cuenta de Mercado Libre de forma permanente, ¿hay forma de recuperarla? : r/DerechoGenial - Reddit
Se abre en una ventana nueva

cronista.com
Atención usuarios | Mercado Pago suspenderá todas las cuentas que hagan estas compras: cuáles son los productos prohibidos - El Cronista
Se abre en una ventana nueva

reddit.com
El sistema de reputación de Mercado Libre es un chiste capitalista : r/vzla - Reddit
Se abre en una ventana nueva

docs.wompi.co
Transactions - Wompi Docs
Se abre en una ventana nueva

