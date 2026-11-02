# Plan — Línea de Respuesta al Cliente (bandeja de WhatsApp + monitor IA)

> **Documento fundacional de la línea.** Ver `estado_respuesta_cliente.md` para el progreso
> vigente y qué está bloqueado.

**Estado:** planificado. Capa 0-1 construir; Capa 2-4 bloqueadas por decisiones del Supervisor.
**Origen:** incidente del **2026-09-30** — Cocina Integral Chía, $73.078.700 COP. El cliente
mandó observaciones al contrato, nadie respondió en 24 h, y cerró con otro proveedor.
**Zonas que toca:** `datos` (schema nuevo, riesgo **alto**), `comercial`, `compras`, `produccion`
— las tres últimas están **congeladas** desde el 2026-09-30 (`AGENTS.md` §2.b). El Supervisor
reabrió `comercial` + `compras` + `produccion` explícitamente al pedir esta línea.

> **Lo que YA está hecho (2026-09-30):** `lib/modules/comercial/leads.ts` (máquina de estados +
> detección de riesgo, con tests) y `lib/data/actions/leads.ts` (`avanzarLeadEtapaAction`,
> `listarLeadsEnRiesgoAction`). `leads.etapa` por fin se mueve, y `eventos_conversion_offline` por
> fin recibe datos al firmarse un contrato. **Este plan empieza desde ahí, no desde cero.**

---

## 0. El problema, medido

El sistema de hoy tiene el embudo cortado en tres puntos, y los tres importan dinero:

| # | Rotura | Costo |
|---|---|---|
| 1 | `leads.etapa` nunca se movía | Un lead esperando contrato era indistinguible de uno recién creado. **Ya arreglado.** |
| 2 | `eventos_conversion_offline` nunca se escribía | El dinero que entra por pauta no es distinguible del que no entra. **Ya arreglado** (queda `pendiente` de envío). |
| 3 | **No hay registro de los mensajes** | El silencio de 24 h es invisible. Es lo que este plan resuelve. |

Sobre el punto 1, hay que ser honesto en una cosa: el lead de Chía **hoy no se habría perdido**
por falta de datos. Un comercial que avanzara la etapa a tiempo lo habría visto en la bandeja.
Lo que habría detectado es el riesgo, no la causa. **La causa —el silencio en WhatsApp— solo se
ve con los mensajes.** Por eso la Capa 1 no es opcional ni "extra": es el cierre del problema.

---

## 1. Capa 0 · Captura — `[SOLO_HUMANO]`

Meta Cloud API. Requiere, del lado del Supervisor:
- Verificación de negocio en Meta + WhatsApp Business Account (WABA) + número dedicado.
- Token de acceso permanente y **app secret** (este último es el que valida las firmas).
- Dominio HTTPS público para el webhook (Vercel sirve).

**Código:**
- `POST /api/whatsapp/webhook` — recibe `messages`, responde 200 de inmediato (Meta reintenta si
  tarda >20 s), encola el procesamiento.
- `GET /api/whatsapp/webhook` — handshake `hub.challenge`.
- Validar **siempre** `X-Hub-Signature-256` con el app secret (`timingSafeEqual`).

🔴 **El endpoint es público.** `middleware.ts:48` solo protege `/erp/:path*`. Sin validación de
firma, cualquiera que descubra la URL podría escribir un mensaje como si lo hubiera mandado un
cliente, y la IA lo respondería. **Es la línea de defensa, no un extra.**

- **Idempotencia:** `wamid` con UNIQUE. Meta reintenta entregas; sin esto se duplican mensajes y
  se disparan alertas falsas.
- **Media:** empezar solo con texto. Adjuntos implican descarga a R2 + `sharp` para previews;
  es una fase aparte.
- **Fuera de alcance:** plantillas promocionales de Meta, respuestas rápidas de la app móvil,
  broadcast campaigns. Esto es una bandeja interna, no marketing.

**Migración de los CTAs:** hoy hay `wa.link/rmgga6` hardcodeado en 9 archivos del sitio público
y `lead-actions.ts:70` genera `https://api.whatsapp.com/send/?phone=573025922101`. Al cambiar
el número, pasar todo a una constante única (`NEXT_PUBLIC_WHATSAPP_NUMERO`) y revisar los 9.

---

## 2. Capa 1 · Modelo de datos

**No son 3 sistemas: es una bandeja con filtros**, porque los datos son los mismos.

| Tabla | Campos | Nota |
|---|---|---|
| `conversaciones` | `tipo` (`lead`/`cliente`/`proveedor`/`desconocido`), `entidadTipo`, `entidadId`, `telefonoE164` UNIQUE, `ultimoInboundAt`, `ultimoOutboundAt`, `sinRespuestaDesde` | `sinRespuestaDesde` es el reloj del detector. Es un campo, no un cálculo en cada consulta. |
| `mensajes` | `conversacionId`, `wamid` UNIQUE, `direccion` (`in`/`out`), `cuerpo`, `timestampWa`, `estadoEnvio`, `autorTipo` (`humano`/`ia`), `autorId` | `autorTipo` es lo que hace auditable la IA. |
| `compromisos` | `conversacionId`, `prometidoPara`, `cumplidoEn`, `origen`, `cumplido` | La regla de oro, medible. |

**El cruce es el teléfono en E.164.** `lead-actions.ts:51` ya guarda E.164 vía
`normalizeAndHashPhone` (`lib/security/user-hashing.ts`), y Meta manda `wa_id` en ese mismo
formato. El match es directo. Falta normalizar `clientes.telefono` y
`proveedores.telefonoComercial` con el mismo helper + UNIQUE.

- Sin match → `desconocido`. **Un número desconocido no puede recibir mensajes automáticos**:
  no se sabe con quién se está hablando.
- Migración: `IF NOT EXISTS` en todo y **SQL directo, no `drizzle-kit migrate`**
  (ver `arnes/estado.md` — el tracking está desincronizado desde 2026-09-29).

---

## 3. Capa 2 · Las 3 vistas

| Vista | Filtro | Rol |
|---|---|---|
| Proveedores | `tipo = proveedor` | `compras` |
| Leads | `tipo = lead` | `comercial` |
| Producción | `tipo = cliente` con proyecto en `desarrollo`/`armado`/`en_instalacion` | `taller` |

🔴 **El filtro va en el query del servidor, no en la UI.** Si filtras en cliente, un comercial ve
las conversaciones de proveedores. El rol da la *vista*; el servidor hace la *restricción*.
El enum `rolCanonico` (`schema.ts:50`) ya tiene `comercial`, `compras`, `taller`.

**Reactividad:** reusar el patrón que ya existe y ya se validó — `LISTEN/NOTIFY` de Postgres +
long-polling acotado (`lib/data/actions/longpoll.ts`).

🔴 **No inventar polling.** La lección t-132 (`arnes/estado.md`): el polling de 3s agotó la cuota
de Vercel Hobby (100k/mes) en ~1 día con 5 usuarios. Una bandeja en vivo es exactamente el caso
que la vuelve a reventar. El trigger `drizzle/v3/0004_veta_notify_trigger.sql` ya cubre 64
tablas; hay que agregar `conversaciones` y `mensajes` a ese trigger.

---

## 4. Capa 3 · El monitor IA — escalera, no interruptor

| Nivel | Qué hace | Riesgo |
|---|---|---|
| **L0** | Detecta silencio, avisa al humano. No manda nada. | Nulo |
| **L1** | Redacta borrador; el humano aprueba con un clic. | Bajo |
| **L2** | Envía solo acuses de lista blanca. | Bajo |
| **L3** | Envía cualquier borrador. | Alto |

Nivel actual: **L0**, vía parámetro `autonomia_ia = 0`. Se sube a mano, con registro.

### Reglas duras (no negociables)

1. **La IA nunca promete una hora que el sistema no pueda cumplir.** El borrador del 30/09 decía
   *"te lo entrego hoy a las 4 pm"*. Si nada garantiza eso, la IA solo acelera la mentira, y esta
   vez con más seguridad. **Todo compromiso va a `compromisos.prometidoPara`** → después se mide.
2. **L3 nunca aplica a clientes en producción.** Quien firmó contrato habla con la empresa, no
   con un bot. Solo L0/L1.
3. **Tope duro por conversación por día** (`tope_mensajes_ia_dia = 3`). Sin tope, un bucle de
   "sigo trabajando / mañana temprano" es spam a alguien que ya se fue.
4. **Todo lo que hace la IA queda auditado.** Patrón inmutable de `notas_reunion`. Si no se puede
   auditar, no es defendible.
5. **El detector NO usa IA.** *"Silencio = último inbound hace > N minutos"* son 3 líneas de
   `Date.now()`. El LLM solo **redacta**. Así no se gastan tokens ni se deja que un modelo
   alucine urgencia en un chat corriente.
6. **Lista blanca en L2** acotada a un solo patrón (acuse de recibo con hora), redactado con
   plantilla fija. Sin LLM. Es la que habría salvado el deal del 30/09.

### La cadena del 30/09, tal como quedaría

```
inbound "observaciones al contrato"          00:00   → conversación.tipo = lead
  ¿respuesta humana en 5 min?                NO      → exceeded regla_ack_minutos
  borrador L1: "Recibido Iván, estoy revisando los 9 puntos,
                te entrego el documento hoy a las HH:MM"        ← compromiso.prometidoPara
  el comercial aprueba y sale                ✅      → unlikely perdido el deal
  nadie aprueba en 2 h                       → alerta de urgencia al comercial
     (alerta_comercial_horas = 2)
  el comercial tampoco actúa en 4 h          → L2: la IA manda el acuse sola
```

### Lo que este plan NO arregla

- **No arregla la conversión = clic a WhatsApp.** La campaña de CPA objetivo sigue optimizando
  contra el clic. Enviar conversiones offline a Google requiere Google Data Manager API, que es
  una fase aparte de esto. Lo que sí queda es el *registro* (`estadoEnvio = 'pendiente'`), que es
  el prerrequisito.
- **No revierte un lead ya perdido.** Preventivo, no reactivo.
- **No cubre el teléfono/WhatsApp como canal de solo texto.** Si un cliente llama, no hay registro.

---

## 5. Capa 4 · Proveedor de IA

No hay **ninguno** instalado (`package.json` no tiene una sola dependencia de IA). Decisión
pendiente del Supervisor. Criterios:
- Coste por token bajo (esto va a disparar muchas veces al día).
- structured output / JSON mode (los umbrales no pueden depender de parsear prosa).
- **Regla del detector en código, no en prompt.** Lo que se puede expresar como comparación de
  fechas, se expresa como comparación de fechas.

Orden de arranque: reglas deterministas + plantillas fijas primero → medir → recién entonces LLM
para lo que de verdad lo necesita (redactar el borrador).

---

## 6. Faltantes de infraestructura (bloqueantes, ninguno es de código)

| Falta | Estado | Quién |
|---|---|---|
| Meta WABA + token + app secret | No existe (`wa.link` hardcodeado en 9 archivos) | `[SOLO_HUMANO]` |
| Proveedor de IA | No existe | Decisión |
| **Scheduler** | No hay `vercel.json`. Hobby = 2 crons/día, 1 ejecución/día → **no alcanza** para alertas por hora | Decisión |
| Trigger LISTEN/NOTIFY para `conversaciones`/`mensajes` | Solo cubre 64 tablas actuales | Código, Capa 2 |

**Sobre el scheduler:** si el chequeo del detector cuelga del tráfico del ERP (el long-poll ya
existe), no hace falta cron para el caso *reactivo*. El problema es el **proactivo**: "a la tarde
seguís sin responder → avisar" requiere un despertador. Opciones: Postgres + `pg_cron`, un worker
propio, o subir el plan de Vercel. **Decisión del Supervisor.**

---

## 7. Orden de ejecución propuesto

| Fase | Entrega | Bloqueo |
|---|---|---|
| **A** | Migración idempotente de las 3 tablas + normalización E.164 de las columnas de teléfono | — |
| **B** | Endpoint webhook + verificación de firma + persistencia idempotente | Token de Meta |
| **C** | Bandeja con los 3 filtros + trigger en el `LISTEN/NOTIFY` | — |
| **D** | Detector determinista + alertas al comercial (`autonomia_ia = 0`) | — |
| **E** | L1: redacción de borrador + aprobación con un clic | Decisión de IA |
| **F** | L2: lista blanca | Decisión de IA |
| ~~L3~~ | ~~Borrador libre~~ | **Fuera de alcance hasta que L2 lleve un ciclo real medido** |

Cada fase se verifica con `npx tsc --noEmit` + `npx eslint .` + `npx tsx <archivo>.test.ts`,
según `AGENTS.md` §Comandos de verificación.

---

## 8. Preguntas abiertas para el Supervisor

1. **¿Número nuevo o el actual?** Cambiarlo toca los 9 CTAs del sitio y corta conversaciones en curso.
2. **¿El webhook va en `/api/whatsapp/` o detrás de `/erp/`?** Si va en `/erp/`, entra al matcher
   de `middleware.ts` y hay que excluirlo del chequeo de sesión explícitamente.
3. **¿Proveedor de IA y scheduler?**
4. **¿Leen los proveedores por WhatsApp o por otro canal hoy?** Si ya usan otro, la bandeja de
   compras cambia de canal y hay que decidir si se migra o se duplica.
5. **¿Los tres filtros son de solo lectura o cada rol también escribe/rechaza?** Hoy el comercial
   descarta leads; los proveedores no.