# Arquitectura del paquete — camino de crecimiento

## Decision

Herramienta de renderizado interna de Vetadorada: toma un plano/pieza real (SKP exportado como lineas o mapa de profundidad) y una foto del espacio del cliente, y genera una imagen fotorrealista del mueble instalado en ese espacio. Nace en `empresa_muebles_clone` por la misma razon que `../inbox/` y `../payments-checkout/`: es donde se usa primero.

## De donde viene esta idea, y que se trajo (y que no)

Esta idea se traduce de notas sueltas en `Influencer digital/` que describian una arquitectura de generacion de imagenes con ComfyUI/RunPod/LoRA/ControlNet, aplicada originalmente a un proyecto de contenido de "influencer IA" (generacion de imagenes de un personaje simulado para monetizacion en plataformas de suscripcion). **Esa logica de negocio no se trajo.** Lo unico que se traduce aqui es el puente tecnico generico — como conectar un servicio de inferencia de imagenes (ComfyUI corriendo en RunPod) desde el Core — que es infraestructura legitima y reusable para un caso de uso completamente distinto: renderizar mobiliario real con precision geometrica para catalogo y ventas.

## El insight que se preserva tal cual (viene de las notas originales, es correcto)

> "Stable Diffusion, FLUX, LoRAs y ControlNet NO son adaptadores. Son modelos y herramientas matematicas que viven dentro de un software. Tu unico adaptador visual es el puente hacia la maquina que corre ese software."

Por eso esta capability tiene su lógica de ejecución (ComfyUI) delegada vía HTTP al proyecto satélite `estudio_multimedia` (el adapter local `runpod-comfyui` fue extraído) y una carpeta separada (`../workflows/`) para los JSON de configuracion (ControlNet depth, LoRA, IP-Adapter) — no se modelan como "sub-adapters". Ver `docs/02_contrato_universal_render.md` para el detalle.

## Camino de tres pasos (mismo que inbox y payments-checkout)

1. **Ahora — construir aqui.** `src/modules/render-studio/` autocontenido, consumiendo la capability vía HTTP delegada en `estudio_multimedia`.
2. **Cuando el contrato este probado** (funcionando con precision geometrica real sobre piezas de Vetadorada, y con evidencia de que el mismo flujo sirve para al menos 2 workflows distintos sin cambiar codigo, solo el JSON), promover a `packages/render/` en el seed.
3. **Distribucion via `scripts/admin/sync-workspaces.ps1`.**

## Costo y operacion — por que esto no es una decision trivial

A diferencia de mensajeria y pagos (SaaS con pricing por transaccion/mensaje), correr ComfyUI implica una instancia GPU (RunPod u otro proveedor) con costo por hora/uso independientemente del volumen de renders. `docs/03_prompt_deep_research.md` pide explicitamente comparar costo y latencia de arranque (cold start) antes de comprometerse.
