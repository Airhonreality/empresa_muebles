# Evidencia P0 — t-200 (2026-11-27)

Medición con Playwright Component Testing (`npx playwright test -c playwright-ct.config.ts`).
Sin servidor, sin base de datos, sin sesión. Los componentes se montan aislados con los tokens D4 reales.
El solapamiento se mide como intersección de cajas (`boundingBox`) entre todos los `<button>` del componente.

| Componente | Viewport | Botones | Pares solapados | Objetivo táctil ≥ 44 px | Desborde horizontal |
|---|---|---|---|---|---|
| `ImagePicker` antiguo (línea base) | 360 px | 18 | **12** | no medido | no medido |
| `SlotImagen` nuevo | 360 px | 10 | **0** | sí | no |
| `SlotImagen` nuevo | 768 px | 10 | **0** | sí | no |
| `SlotImagen` nuevo | 1280 px | 10 | **0** | sí | no |

Los 12 pares del picker antiguo son: el botón de ampliar (cubre toda la miniatura) contra ◀, ▶ y × de cada una de las 4 fotos de prueba.

Capturas:
- `antes_picker-antiguo_movil-360.png` — línea base.
- `despues_slot-nuevo_movil-360.png`, `despues_slot-nuevo_tablet-768.png`, `despues_slot-nuevo_escritorio-1280.png`.

Limitación: la captura de la pantalla real del cotizador no se pudo hacer. Necesita sesión y base de datos, y el modo mock todavía no cubre las lecturas del cotizador (decisión A/B pendiente).
