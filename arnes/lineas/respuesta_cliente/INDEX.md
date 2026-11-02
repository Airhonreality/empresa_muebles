# Índice — Línea de Respuesta al Cliente

**Bandeja unificada de WhatsApp + monitor IA de respuesta al cliente.**

Abierta el **2026-09-30** a partir del incidente de la Cocina Integral Chía ($73.078.700 COP):
el cliente mandó observaciones al contrato, nadie respondió en 24 h, y cerró con otro proveedor.

**Lee este archivo primero** para saber qué mirar y en qué orden.

---

## 📌 1. Documentos centrales

- 📄 **`estado_respuesta_cliente.md`** — **[FUENTE DEL PROGRESO]** Qué se sabe, qué está
  bloqueado, qué se puede hacer ahora y qué falta verificar antes de producción.
- 📄 **`plan_respuesta_cliente.md`** — **[FUENTE DE LAS DECISIONES]** El plan de Capa 0 a 4:
  captura, modelo de datos, las tres bandejas y el monitor IA. Incluye la escalera de autonomía
  L0→L3 y las 6 reglas duras.
- 📄 **`riesgo_seed_allowlist_produccion.md`** — 🔴 Trampa de seguridad en
  `scripts/seed-dev.ts`: su allowlist de "desarrollo" incluye el host de producción.

## 🗂 2. Archivo

- 📁 `archivo/` — Borradores y documentos superados **de esta línea**. Empieza vacía.

---

## 🔗 3. Relaciones con otras líneas

- **Origen del trabajo ya hecho:** por qué importa la Capa −1 (`leads.etapa` +
  `eventos_conversion_offline`) está en `estado_respuesta_cliente.md` §Cerrado.
- **Continuidad de diseño:** la línea `demanda` tiene
  `archivo/PLAN_ARQUITECTURA_MEDICION_Y_ATRIBUCION_V3.md` e `INVESTIGACION_P4_RESILIENCIA_WHATSAPP.md`,
  que son donde se diseñó (y no se construyó) la capa de atribución que esta línea termina de
  cerrar. Si tocás atribución, lee primero esos dos — **esta línea no los reemplaza, los ejecuta.**
- **Canon de negocio:** `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§1). Si difiere de cualquier
  documento de esta línea, **gana el canon**.

---

## ⚡ 4. Arranque rápido para un agente nuevo

1. Leé `estado_respuesta_cliente.md` entero. Dice qué está hecho y qué está bloqueado.
2. Si la tarea es de código: `plan_respuesta_cliente.md` §7 (orden de ejecución).
3. La **próxima acción permitida** está escrita al final del estado. No abras Fase B sin el token
   de Meta.
4. Antes de tocar `arnes/nucleo/`, recordá que es tierra común: la línea **propone**, el canon aplica.