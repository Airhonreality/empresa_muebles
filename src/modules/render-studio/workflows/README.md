# Workflows

Aqui viven los JSON de configuracion de ComfyUI (que checkpoint, que ControlNet, que LoRA, que IP-Adapter usa cada caso de uso) — **no son adapters**, son la "receta" que el adapter en `../../../adapters/runpod-comfyui/` ejecuta. Ver `../docs/02_contrato_universal_render.md` para la distincion completa.

Vacio hasta que la investigacion (`../../../adapters/_research/render_2026.md`) confirme que combinacion de ControlNet/IP-Adapter/checkpoint funciona para renderizar mobiliario con precision geometrica.

Convencion esperada cuando se agreguen: una carpeta por workflow, ej. `veta_catalogo_v1/workflow.json`, `veta_controlnet_depth_v1/workflow.json` — el `id` de carpeta es el mismo string que `RenderRequest.workflow` en el contrato (`../../../adapters/_contracts/render-adapter.ts`).
