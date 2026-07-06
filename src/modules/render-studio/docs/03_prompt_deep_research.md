# Prompt de deep research — pegar tal cual en un LLM con busqueda web

> Instrucciones de uso: copia todo el bloque de codigo de abajo y pegalo en una ventana de chat de un LLM con capacidad de busqueda web. Cuando tengas la respuesta, vuelca los resultados en `../../../adapters/_research/render_2026.md` y retoma el trabajo desde `INDEX.md`.

```text
ROL Y OBJETIVO

Eres un investigador tecnico. Estoy construyendo una herramienta de
renderizado fotorrealista para un negocio de muebles de alta gama: a partir
de un plano/pieza real (exportado de SketchUp como lineas o mapa de
profundidad) y una foto del espacio del cliente, quiero generar una imagen
del mueble instalado en ese espacio, respetando la geometria exacta del
mueble (no puede "alucinar" formas que no existen en el plano). Necesito
informacion tecnica actualizada — confirma con busqueda web, no asumas desde
tu entrenamiento, porque pricing y disponibilidad de estos servicios cambian
seguido.

1. RUNPOD (o alternativas) — HOSTING DE COMFYUI
   - Como se expone ComfyUI via API en RunPod (Serverless vs Pod persistente).
   - Pricing actual por hora/segundo de GPU, y diferencia de costo entre
     modelos de GPU disponibles (cual es suficiente para FLUX/SD3 en
     resolucion util para catalogo de producto).
   - Latencia de arranque en frio (cold start) si se usa Serverless — cuanto
     tarda en estar listo para el primer request despues de estar inactivo.
   - Alternativas directas a RunPod (Replicate, Modal, Baseten, servidor GPU
     propio) — comparacion de costo y facilidad de integracion via API REST
     desde Node.js/TypeScript.

2. COMFYUI EN MODO API
   - Como se estructura un workflow JSON para ComfyUI y como se envia via
     API (endpoint, formato del payload, como se recibe el resultado —
     polling vs webhook).
   - Como se cargan checkpoints (FLUX.1-dev u otro) y LoRAs personalizados
     en una instancia remota.

3. CONTROLNET PARA PRECISION GEOMETRICA
   - Que modelo de ControlNet (Depth, Canny, u otro) es mas efectivo para
     forzar que la IA respete la geometria de un mueble a partir de un plano
     de lineas o mapa de profundidad exportado de SketchUp.
   - Ejemplos o casos documentados de uso de ControlNet para productos/
     mobiliario (no solo personas), y que tan confiable es en la practica
     segun reportes de la comunidad (no solo demos oficiales).

4. IP-ADAPTER (O EQUIVALENTE) PARA CONTEXTO DE ESPACIO
   - Como se usa para que la IA absorba iluminacion/textura/ambiente de una
     foto de referencia (la foto del espacio del cliente) sin alterar la
     geometria del mueble que ya esta fijada por ControlNet.
   - Compatibilidad de IP-Adapter + ControlNet simultaneos en el mismo
     workflow — confirma si hay conflictos conocidos reportados en foros.

5. LICENCIAS PARA USO COMERCIAL
   - Licencia actual de los checkpoints base relevantes (FLUX.1-dev,
     FLUX.1-schnell, SD3, u otros vigentes) para uso comercial en un negocio
     que vende productos reales con las imagenes generadas — confirma
     restricciones, no asumas que "gratis" significa "uso comercial libre".

6. PROBLEMAS REPORTADOS POR LA COMUNIDAD (ULTIMOS 6-12 MESES)
   - Busca en foros/comunidades de ComfyUI y RunPod: quejas frecuentes sobre
     estabilidad, cambios de API que rompieron integraciones, o resultados
     inconsistentes de ControlNet con planos tecnicos (no fotos).

CONTRATO BORRADOR A VALIDAR

Tengo este contrato TypeScript borrador:

  interface RenderRequest { workflow; prompt; negativePrompt?; images?; params?; }
  interface RenderResult { id; status; imageUrl?; raw?; }
  interface RenderAdapter {
    submit(request): Promise<RenderResult>;
    getResult(jobId): Promise<RenderResult>;
    listWorkflows(): Promise<string[]>;
  }

Evalua si esta forma es suficiente para el flujo ControlNet+IP-Adapter que
describiste arriba. Senala cualquier dato que el contrato no contemple (ej.
parametros obligatorios de ControlNet/IP-Adapter que no encajan en `params`
generico, o si el modelo asincrono de polling no es el correcto para este
proveedor).

FORMATO DE SALIDA ESPERADO

1. Respuestas a los 6 puntos, citando fuentes (URLs) cuando sea posible.
2. Una recomendacion concreta: que combinacion (proveedor de hosting +
   checkpoint + ControlNet + IP-Adapter) usar para empezar, priorizando
   precision geometrica sobre creatividad.
3. Ajustes que el contrato borrador necesitaria.
```
