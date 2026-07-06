# Prompt de deep research — pegar tal cual en un LLM con busqueda web

> Instrucciones de uso: copia todo el bloque de codigo de abajo y pegalo en una ventana de chat de un LLM con capacidad de busqueda web. Cuando tengas la respuesta, vuelca los resultados en `../../../adapters/_research/payments_co_2026.md` y retoma el trabajo desde `INDEX.md`.

> Nota: esta investigacion ya se corrio — los resultados estan en [`../../../adapters/_research/payments_co_2026.md`](../../../adapters/_research/payments_co_2026.md), con recomendación (Wompi). Este prompt queda como referencia.

```text
ROL Y OBJETIVO

Eres un investigador tecnico. Estoy integrando pasarelas de pago para un
ecommerce de muebles de alta gama que vende principalmente en Colombia, con
planes de expandirse internacionalmente en el futuro (sin mercado especifico
decidido todavia). El sitio esta construido en Next.js desplegado en
Vercel/Netlify. Necesito informacion tecnica actualizada — confirma con
busqueda web, no asumas desde tu entrenamiento, porque las tarifas y
requisitos de estos proveedores cambian con frecuencia.

PARTE 1 — PASARELAS NACIONALES (COLOMBIA), CON RECOMENDACION

Investiga estas opciones (y cualquier otra relevante que encuentres):
PSE (via un agregador, ya que PSE no se integra directo), Wompi, ePayco,
Bold, MercadoPago Colombia.

Para cada una, en documentacion oficial Y en foros de desarrolladores
(Stack Overflow, comunidades de desarrolladores colombianos, GitHub issues):

1. Modelo de integracion: redireccion a pagina del banco/agregador vs API
   directa con tokenizacion de tarjeta. Cuales metodos de pago cubre cada
   una (PSE, tarjeta credito/debito, Nequi, Daviplata, efectivo/corresponsal).
2. Proceso y tiempos reales para activarse como comercio (KYC, documentos
   legales requeridos — NIT, camara de comercio, etc.), reportados por
   desarrolladores, no solo el marketing oficial.
3. Estructura de comisiones (% + fijo por transaccion), tiempos de
   desembolso a la cuenta bancaria del comercio.
4. Calidad de la documentacion y disponibilidad de SDK/libreria oficial
   para Node.js/TypeScript, o si hay que integrar via REST directo.
5. Modelo de webhook para confirmacion asincrona de pago: como se suscribe,
   forma del payload, y como se verifica la firma/autenticidad del webhook.
6. Entorno de pruebas/sandbox disponible antes de credenciales de produccion.
7. Problemas o quejas frecuentes reportadas por desarrolladores en los
   ultimos 6-12 meses (caidas del servicio, cambios de API sin aviso,
   demoras en aprobacion de comercio, soporte deficiente).

AL FINAL DE ESTA PARTE: da una RECOMENDACION UNICA de cual usar primero,
justificada explicitamente por "integracion mas simple + mayor
compatibilidad" con un stack Next.js/Vercel — ese es el criterio de decision,
no el mas barato ni el mas conocido necesariamente.

PARTE 2 — PANORAMA INTERNACIONAL (SIN RECOMENDACION TODAVIA)

Sin pedir una decision — el mercado internacional a atacar no esta definido
todavia — da un panorama de alto nivel de: Stripe, PayPal, dLocal, y
MercadoPago (fuera de Colombia). Para cada una: en que paises/regiones opera
bien, modelo de integracion general, y que tan facil seria conectarla
despues siguiendo el mismo contrato que la pasarela nacional (ver mas abajo).
No profundices tanto como en la Parte 1 — esto es solo panorama para decidir
mas adelante.

CONTRATO BORRADOR A VALIDAR

Tengo este contrato TypeScript borrador:

  interface ChargeRequest { amount; currency; method?; reference; customer;
    redirectUrl?; metadata?; }
  interface ChargeResult { id; externalId?; status; amount; currency;
    checkoutUrl?; raw?; }
  interface RefundRequest { chargeId; amount?; reason?; }
  interface PaymentAdapter {
    charge(request): Promise<ChargeResult>;
    getStatus(chargeId): Promise<ChargeResult>;
    refund?(request): Promise<ChargeResult>;
    handleWebhook?(payload, headers): Promise<ChargeResult[]>;
    verifyWebhook?(payload, headers): boolean;
  }

Para la pasarela nacional recomendada en la Parte 1, evalua si esta forma es
suficiente. Senala cualquier campo o concepto que NO tenga donde encajar
(ej. estados intermedios especificos, datos obligatorios adicionales del
comercio o del comprador que el contrato no contempla).

FORMATO DE SALIDA ESPERADO

1. Parte 1: una seccion por pasarela nacional respondiendo los 7 puntos,
   citando fuentes (URLs), + la recomendacion final justificada.
2. Parte 2: panorama breve de las opciones internacionales.
3. Ajustes que el contrato borrador necesitaria para la pasarela recomendada.
```
