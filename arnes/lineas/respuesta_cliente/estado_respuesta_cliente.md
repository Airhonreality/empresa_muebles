# Estado — Línea de Respuesta al Cliente

Progreso de la línea de bandeja unificada de WhatsApp + monitor IA de respuesta al cliente.
Ver `plan_respuesta_cliente.md` para el plan vigente (Capa 0 a 4).

---

## Por qué existe esta línea — incidente del 2026-09-30

**Cocina Integral Chía, $73.078.700 COP.** El cliente envió observaciones a 9 cláusulas del
contrato y no recibió respuesta en 24 h. Dio por cancelada la negociación y contracción con otro
proveedor.

Diagnóstico propio (no la versión del chat que lo resumió): el sistema tenía **tres roturas**,
y las dos primeras eran estructurales, no de atención:

| # | Rotura | Estado |
|---|---|---|
| 1 | `leads.etapa` tenía 6 estados y **solo se escribía el inicial** — ningún código en el repo la movía | ✅ **Cerrada 2026-09-30** |
| 2 | `eventos_conversion_offline` **nunca recibía filas** — la tabla existía desde el diseño V3 y nadie la escribía | ✅ **Cerrada 2026-09-30** |
| 3 | **No hay registro de los mensajes** — el silencio de 24 h es invisible | 🔴 **Abierta. Es el objeto de esta línea** |

Lo que se investingió y salió a la luz en el proceso, y que queda registrado acá porque cambia
la lectura del incidente:

- **El KPI estaba ciego por definición, no por bug.** La conversión de Google Ads **es** un clic
  a WhatsApp (decisión del Supervisor, 2026-08-03). El clic se paga a ~$8.102 COP; el silencio
  posterior costó $73M. El indicador se maximiza produciendo exactamente lo que se perdió.
- **La infraestructura para arreglarlo existía y estaba apagada.** `eventos_conversion_offline`
  y `leads.scoreConversion` estaban en el schema desde el diseño V3, con `INVESTIGACION_P5`
  explicando para qué servían. Cero código los tocaba. Es el tercer caso del patrón que ya
  registra `destilacion_docs_veta.md` §7: *"No falta estrategia. La estrategia está hecha... y la
  migración al repo nuevo dejó afuera su implementación."*
- **La regla manual que salió del incidente es más débil que el diseño que ya existía.** El
  borrador decía *"te lo entrego hoy a las 4 pm"* — un compromiso que nadie se ocupaba de cumplir, en un
  canal que no loguea. El diseño legacy-era un modal de micro-filtro **antes** de abrir WhatsApp:
  capturar el lead en el sistema propio y después redirigir.

**Conclusión que ordena la línea:** la regla de oro no se aplica con disciplina, se aplica con
estructura. El detector de silencio es una comparación de fechas — no necesita IA. Lo que necesita
IA es redactar el borrador, y eso es lo último que se construye.

---

## Cerrado 2026-09-30 — Capa −1: el embudo dejó de estar roto

Trabajo ejecutado y verificado en esta sesión:

| Archivo | Qué hace |
|---|---|
| `lib/modules/comercial/leads.ts` | Matriz de transiciones de `leads.etapa` + `evaluarRiesgoLead()` con 3 reglas. Funciones puras, sin DB ni reloj |
| `lib/modules/comercial/leads.test.ts` | ~35 asserts con `node:assert` |
| `lib/data/actions/leads.ts` | `avanzarLeadEtapaAction` (valida transición, y al firmar escribe en `eventos_conversion_offline` con el `valorTotal` real del contrato) + `listarLeadsEnRiesgoAction` |
| `lib/data/fixtures.ts` | 8 parámetros nuevos (`par26`-`par33`): umbrales de riesgo + la regla de oro del incidente |
| `plan_respuesta_cliente.md` | Este plan, Capa 0 a 4 |

**Verificado:** `npx tsc --noEmit` 0 errores · `npx eslint` 0 · tests OK · baseline `tsc` era
limpio antes de tocar, así que los 0 errores son propios.

**No se tocó el schema.** Solo se escribió en tablas que ya existen (`leads`,
`eventos_conversion_offline`, `parametros`). Correr esto a producción no requiere migración.

### Las 3 reglas de detección

1. **`cotizado` en silencio ≥ `lead_cotizado_silencio_horas`** → crítico. **Esta es la del
   incidente.** El reloj corre desde `updatedAt`, no `createdAt`: cuenta el silencio desde el
   último toque real, que es lo que un cliente percibe como abandono.
2. **`contrato_firmado` sin `proyectoId`** → crítico. Plata won que no aparece en operación,
   cronograma ni facturación.
3. **`nuevo_lead` sin contacto ≥ `lead_nuevo_sin_contacto_horas`** → atención.

### Una decisión que se apartó del incidente, y por qué

El umbral se fijó en **48 h**, no en las 24 h del caso real. Un umbral de 24 h **no habría
evitado el incidente**: el detector necesita margen para que el comercial conteste primero. Y
un umbral más corto que el intervalo de trabajo del comercial produce ruido, no señal — cada
falso positivo entrenza al equipo a ignorar la alerta. La regla correcta es *"el cliente se
enfría"* (24 h), pero el umbral correcto es *"el comercial tuvo tiempo de responder"* (48 h).
Es un parámetro: `lead_cotizado_silencio_horas`.

### Lo que esta capa NO arregla

- El lead de Chía **hoy ya no se habría perdido** por falta de datos: un comercial que avanzara
  la etapa lo habría visto. Lo que habría detectado es el **riesgo**, no la causa. La causa —el
  silencio en WhatsApp— solo se ve con los mensajes. **Por eso la Capa 1 no es opcional.**
- Enviar conversiones offline a Google requiere Google Data Manager API. Lo que quedó es el
  *registro* (`estadoEnvio = 'pendiente'`), que es el prerrequisito, no la solución.

---

## Bloqueos abiertos — decisiones que no son de código

| # | Bloqueo | Quién | Qué desbloquea |
|---|---|---|---|
| 1 | **Token de Meta + app secret** (WABA, número dedicado). Hoy solo hay `wa.link/rmgga6` hardcodeado en 9 archivos del sitio público | Supervisor `[SOLO_HUMANO]` | Capa 0 entera → sin esto no hay bandeja |
| 2 | **Proveedor de IA** — no hay ninguno instalado | Supervisor | Fase E (borrador) y F (autonomía L2) |
| 3 | **Scheduler** — no hay `vercel.json`. Vercel Hobby = 2 crons/día con 1 ejecución: **no alcanza** para alertas por hora | Supervisor | El chequeo proactivo "a la tarde seguís sin responder → avisar". El reactivo puede colgarse del long-poll existente |
| 4 | **Número nuevo o el actual** | Supervisor | Migrar los 9 CTAs; cortar conversaciones en curso si cambia |

---

## Próxima acción permitida

**Fase A del plan** — migración idempotente de `conversaciones`, `mensajes` y `compromisos`, más
normalizar a E.164 `clientes.telefono` y `proveedores.telefonoComercial`. **No requiere Meta ni
IA.** Desbloquea la Capa 2 completa y es la única Fase A que no depende de nadie.

Seguir en orden: Fase A → verificar contra `dev-local` → recién entonces Fase B (requiere token).

---

## Próxima acción permitida — heed: verificación antes de producción

**Nada de lo de la Capa −1 se ha ejecutado contra una base real.** Los tests cubren la lógica
pura, no el SQL. Antes de integrar a `main` hace falta, en este orden:

1. Confirmar con `SELECT` que producción tiene `leads.etapa`, `leads.scoreConversion`,
   `eventos_conversion_offline` y `eventos_conversion_offline.estado_envio` en el estado que el
   código asume.
2. Script de verificación contra `dev-local` con datos falsos: avanzar un lead de `nuevo_lead` a
   `cotizado`, confirmar que **rechaza** los saltos inválidos, y firmarlo para comprobar que el
   evento queda con el `valorTotal` del contrato.
3. Aplicar los 8 parámetros nuevos por `scripts/apply-*.ts` (patrón idempotente, `IF NOT EXISTS`).
   **No** por `seed-dev.ts` — ver la trampa documentada en `riesgo_seed_allowlist_produccion.md`.

---

## Riesgos abiertos de la línea

- 🔴 **`scripts/seed-dev.ts` tiene una trampa**: su `DEV_HOST_ALLOWLIST` incluye
  `ep-muddy-cherry-at5j2mz7`, que `arnes/estado.md` identifica como **la base real que lee
  Vercel**. El guard dice "nunca correr contra producción" y a la vez permite el host de
  producción. Ver `riesgo_seed_allowlist_produccion.md`.
- Los CTAs del sitio apuntan a `wa.link/rmgga6` hardcodeado en 9 archivos. Cambiar el número los
  rompe todos; hay que centralizarlos en una constante primero.
- Sin migraciones aplicadas, las acciones usan fallback y funcionan — pero los umbrales no aplican.