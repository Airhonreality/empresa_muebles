# Orquestación y automatización — dónde corre esto y con qué

Este documento responde una pregunta que surgió en diseño: cuando el LLM adapter se conecta al adapter de Instagram/Meta para responder comentarios/DMs automáticamente, o para publicar contenido en horario fijo, **¿en qué entorno corre eso?** No es el CLI (`agno.ts`), no es una sesión de Claude Code, y no es un zap.

## Dev-time vs run-time — la distinción que hay que tener clara

| | Dev-time (esta sesión, `agno.ts`) | Run-time (producción) |
|---|---|---|
| Qué es | Herramienta de desarrollo, humano presente | Código ya escrito, desplegado, sin humano |
| Cuándo corre | Solo mientras la tienes abierta | 24/7, reactivo a eventos o a un timer |
| Costo | Por sesión/token, modelo de razonamiento caro (Claude) | Por invocación, modelo barato de alto volumen (Groq/Gemini Flash) |
| Rol aquí | Escribir el código de la orquestación (este documento, los adapters) | Ejecutar ese código cuando Instagram avisa algo o cuando llega el horario |

**No existe un "proceso agente" corriendo en bucle en ningún lado.** Lo que la gente llama "el agente" es una llamada a un LLM dentro de una función serverless normal — la misma infraestructura que ya corre el resto de la app (Vercel/Netlify). Esa función está dormida y no cuesta nada hasta que algo la despierta.

## Patrón reactivo — responder comentarios/DMs

Disparado por un webhook de Meta, no por polling ni por un bucle:

```
Instagram/Meta → webhook POST a src/app/api/webhooks/meta/route.ts
  → MessagingAdapter.handleWebhook() normaliza el evento (NormalizedMessage)
  → lee el prompt base desde storage/db/ai_config.json (namespace reservado del engine)
  → llama al LLM adapter (ver mas abajo) con el prompt base + el mensaje
  → toma la respuesta y llama MessagingAdapter.sendMessage() de vuelta
```

Esta ruta **no puede ser un zap** — el sandbox de zaps no tiene `fetch`, y esto necesita llamar tanto al LLM como a Meta. Por eso vive en `src/app/api/`, siguiendo el mismo contrato de permisos que ya aplica a los adapters de mensajería.

## Patrón proactivo — publicar en horario fijo, investigar tendencias

Next.js serverless no tiene un proceso de fondo propio — necesita un pulso externo. El más simple dado que ya despliegan en Vercel: **Vercel Cron Jobs**, configurado en `vercel.json`, golpeando una ruta a horario fijo:

```
Vercel Cron (semanal) → src/app/api/cron/weekly-content/route.ts
  → LLM adapter (investigacion de tendencias — ver nota abajo)
  → Render adapter (../../render/) genera la imagen
  → adapter de Meta, metodo de publicacion (no sendMessage — publish)
```

Nota: investigar tendencias probablemente exige más que el LLM adapter solo — Groq/Mistral no navegan la web por si mismos. Eso es un adapter de búsqueda aparte o un proveedor con herramienta de búsqueda integrada — pendiente de su propia investigación, no resuelto aquí.

## El LLM adapter — ya hay una base instalada, no hay que empezar de cero

El seed (`agnostic system`) ya trae el **Vercel AI SDK** en `package.json` (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/mistral`, `@ai-sdk/openai`) — interfaz unificada entre proveedores, se cambia de proveedor sin reescribir la llamada. Esto simplifica el `kind: 'llm'` de `AdapterManifest` (ya existe en el enum del seed, igual que `payment`): el adapter es básicamente un wrapper delgado sobre esa librería, no una integración REST hecha a mano.

**Recomendación de costo, no de capacidad de razonamiento:**

- **Claude** → sesiones de desarrollo (como esta). No para runtime automatizado — el costo por token de un modelo de razonamiento profundo no se justifica para "responde este comentario de Instagram".
- **Groq** (Llama/Mixtral alojados por Groq) → runtime, alto volumen, respuestas simples. Rápido y con free tier generoso — el candidato natural para el patrón reactivo de arriba.
- **Gemini Flash** u otro con free tier — alternativa para investigación de tendencias si necesita herramienta de búsqueda integrada.

Confirmar disponibilidad real de free tier y límites en el momento de implementar — no asumir cifras de este documento como vigentes indefinidamente.

## El "prompt base" — ya tiene casa

`storage/db` reserva el namespace `ai_config` desde antes de este módulo (visible en `SYSTEM_NAMESPACES` de `scripts/agno-zap-analysis.ts` del seed). El prompt/persona base se guarda ahí como un registro normal, editable con `agno.ts create-record ai_config ...` — la ruta de orquestación lo lee en cada evento en vez de tenerlo hardcodeado en el código.

## Resumen

Nada de esto es un tercer tipo de adapter. Es una **ruta de orquestación** en `src/app/api/` que llama a adapters ya existentes (`MessagingAdapter`, LLM, `RenderAdapter`) juntos, disparada por un webhook (reactivo) o un cron externo (proactivo) — nunca por un proceso corriendo indefinidamente.
