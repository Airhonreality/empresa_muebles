# Prompt de deep research — pegar tal cual en un LLM con busqueda web

> Instrucciones de uso: copia todo el bloque de codigo de abajo (desde "ROL Y OBJETIVO" hasta el final) y pegalo en una ventana de chat de un LLM con capacidad de busqueda web (ej. uno especializado en investigacion con acceso a internet). Cuando tengas la respuesta, vuelca los resultados en `../../adapters/_research/messaging_2026.md` y retoma el trabajo desde `INDEX.md`.

> Nota: esta investigacion ya se corrio — los resultados estan en [`../../adapters/_research/messaging_2026.md`](../../adapters/_research/messaging_2026.md). Este prompt queda como referencia por si se necesita ampliar o repetir la investigacion.

```text
ROL Y OBJETIVO

Eres un investigador tecnico. Estoy diseñando un modulo de bandeja de entrada
unificada que va a integrar cuatro proveedores de mensajeria/comunicacion:
WhatsApp, Meta (Messenger + Instagram), TikTok y Gmail. Necesito informacion
tecnica actualizada y verificada — no supongas nada desde tu entrenamiento sin
confirmarlo con busqueda web, porque los nombres de producto, los modelos de
auth y las politicas de estos proveedores cambian con frecuencia.

Para CADA uno de los cuatro proveedores, busca en la documentacion oficial
vigente Y en foros de desarrolladores (comunidad oficial del proveedor,
Stack Overflow, Reddit, GitHub issues de SDKs relevantes) y responde:

1. PRODUCTO/API VIGENTE
   - Cual es el nombre oficial actual del producto/API que hay que usar
     (los nombres cambian — ej. confirma si "WhatsApp Business API" sigue
     siendo el nombre correcto o si ahora se llama distinto).
   - Para "Gmail": aclara si lo relevante para una bandeja de mensajes es la
     Gmail API (correo, hilos de email) o si existe/sigue vigente algun
     producto de mensajeria conversacional de Google (ej. Business Messages)
     que encaje mejor con un caso de uso tipo chat — confirma el estado actual
     de cada opcion, incluyendo si alguna fue descontinuada.

2. AUTENTICACION
   - Modelo de auth (OAuth2, API key, token de larga duracion, etc.).
   - Vida util del token y proceso de refresh.
   - Que exige el proveedor para poder operar en produccion (revision de app,
     verificacion de negocio, numero de telefono verificado, etc.) y tiempos
     tipicos reportados por desarrolladores (no solo lo que dice el marketing
     oficial).

3. RECEPCION DE MENSAJES (INBOUND)
   - Modelo de webhook: como se suscribe una app para recibir eventos.
   - Payload de ejemplo de un mensaje entrante (estructura real, no generica).
   - Si existe handshake de verificacion (ej. challenge/response) al registrar
     el webhook, como funciona exactamente.

4. ENVIO DE MENSAJES (OUTBOUND)
   - Endpoint y forma del payload para enviar texto, media, y mensajes con
     plantilla/interactivos si el proveedor los exige.
   - Si existe una ventana de tiempo limitada para responder a un contacto sin
     usar plantilla pre-aprobada (como la ventana de 24h de WhatsApp),
     confirma si sigue vigente y cuanto dura hoy.

5. LIMITES Y COSTOS
   - Rate limits relevantes para una bandeja multicanal (mensajes/segundo,
     mensajes/dia, limites por conversacion).
   - Modelo de costos si aplica (por conversacion, por mensaje, gratuito hasta
     cierto volumen, etc.).

6. SDK Y HERRAMIENTAS
   - SDK oficial en Node.js/TypeScript, si existe. Si no, confirma si hay que
     ir directo a REST.
   - Entorno de pruebas/sandbox disponible para desarrollar sin credenciales
     de produccion aprobadas.

7. PROBLEMAS REPORTADOS POR LA COMUNIDAD (ULTIMOS 6-12 MESES)
   - Busca especificamente en foros/issues: cambios recientes que rompieron
     integraciones existentes, deprecaciones anunciadas, quejas frecuentes
     sobre el proceso de aprobacion, o comportamientos no documentados que
     los desarrolladores tuvieron que descubrir por prueba y error.

CONTRATO BORRADOR A VALIDAR

Tengo este contrato TypeScript borrador que intenta normalizar los cuatro
proveedores bajo una forma comun:

  interface NormalizedContact { channel; externalId; displayName?; handle?; }
  interface NormalizedMessage { id; externalId?; threadId; channel; direction;
    type; body?; mediaUrl?; sentAt; status?; raw?; }
  interface NormalizedThread { id; channel; contact; lastMessageAt?; unreadCount?; }
  interface OutboundMessagePayload { type; body?; mediaUrl?; templateRef?; templateParams?; }
  interface MessagingAdapter {
    listThreads(params?): Promise<{items, nextCursor?}>;
    listMessages(threadId, params?): Promise<{items, nextCursor?}>;
    sendMessage(threadId, payload): Promise<NormalizedMessage>;
    handleWebhook?(payload, headers): Promise<NormalizedMessage[]>;
    verifyWebhook?(query): string | null;
  }

Para cada proveedor, evalua si esta forma es suficiente para representar sus
datos reales. Senala explicitamente cualquier campo o concepto del proveedor
que NO tenga donde encajar en este contrato (ej. estados de entrega
especificos, tipos de adjunto no cubiertos, metadata obligatoria que el
contrato no contempla).

FORMATO DE SALIDA ESPERADO

1. Una seccion por proveedor (WhatsApp, Meta, TikTok, Gmail) respondiendo los
   7 puntos de arriba, citando fuentes (URLs) cuando sea posible.
2. Una tabla comparativa final con: complejidad de implementacion (baja/media/
   alta), orden recomendado de construccion (cual construir primero y por
   que), y si hay riesgo de que la API cambie/se deprecie pronto.
3. La lista de ajustes que el contrato borrador necesitaria, si los hay.
```
