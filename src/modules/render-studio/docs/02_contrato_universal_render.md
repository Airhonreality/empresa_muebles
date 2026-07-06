# Contrato universal de render

## Razon de ser

La herramienta de renderizado necesita generar imagenes de piezas reales en espacios reales sin que el mueble se deforme (no puede alucinar una bisagra donde no va) — precision geometrica no negociable. Al mismo tiempo, distintos casos (mueble en catalogo generico vs mueble en el espacio especifico de un cliente) usan flujos de trabajo distintos dentro de la misma herramienta. El contrato — ver `../../../adapters/_contracts/render-adapter.ts` — separa lo que es "adapter" (el puente hacia el servicio de inferencia) de lo que es "configuracion de workflow" (que hace exactamente ese servicio con cada request).

## Adapter vs workflow — la distincion central de esta capability

- **Adapter** (anteriormente `runpod-comfyui/adapter.ts`, ahora extraído): el puente técnico hacia la API de RunPod/ComfyUI, provisto vía HTTP delegando al proyecto satélite `estudio_multimedia`.
- **Workflow** (`../workflows/<id>/`, uno o mas JSON): la receta que el servicio ejecuta — que checkpoint (FLUX/SD3), que LoRA, si usa ControlNet (depth/canny) y sobre que imagen de entrada, si usa IP-Adapter para absorber iluminacion/textura de una foto de referencia. Cambiar de "renderizar un mueble en un plano SKP" a "renderizar el mismo mueble en la foto del espacio del cliente" es **cambiar el workflow JSON, no el codigo de integracion** — este es el punto que las notas originales ya identificaron correctamente y que este modulo preserva.

Ejemplo (traducido de las notas, adaptado al caso de muebles):

| Caso de uso | `workflow` | Que hace distinto |
|---|---|---|
| Catalogo — mueble en escenario generico | `veta_catalogo_v1` | checkpoint FLUX.1-dev, sin ControlNet, prompt describe el ambiente |
| Espacio real del cliente | `veta_controlnet_depth_v1` | ControlNet Depth ancla la geometria al plano SKP del mueble; IP-Adapter absorbe la foto del espacio del cliente para iluminacion/textura |

## Forma actual del contrato (borrador)

- `RenderRequest` — `workflow` (que receta usar), `prompt`/`negativePrompt`, `images` (con `role` explicito: `plan`, `reference_photo`, `texture`), `params` para overrides puntuales.
- `RenderResult` — `status` porque el render es asincrono (no es instantaneo como un webhook de pago), `imageUrl` cuando termina.
- `RenderAdapter` — `submit`, `getResult` (polling), `listWorkflows` (que recetas soporta esta instancia).

No se expande especulativamente — los campos exactos de `params` y la lista real de `images.role` se confirman con el primer workflow real, despues de la investigacion.

## Relacion con `AdapterManifest` del seed

`AdapterManifest.kind` (`packages/core/src/adapter.ts` del seed) hoy es `'data-source' | 'messaging' | 'payment' | 'llm' | 'other'` — **no existe `'visual-generation'` todavia**. Al haberse extraído el adapter local al proyecto satélite `estudio_multimedia`, no se requiere registrar un manifest local en este fork; la capability es consumida vía llamadas HTTP directamente.

`permissions.network` sera `'outbound-api'` con `runsOutsideSandbox: true` — llamadas a RunPod y polling de resultados no caben en el sandbox de zaps.

## Que falta antes de escribir el adapter

Ver `docs/03_prompt_deep_research.md` — todavia sin correr, resultados caen en `../../../adapters/_research/render_2026.md`.
