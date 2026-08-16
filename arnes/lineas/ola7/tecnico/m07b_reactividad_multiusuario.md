# M-07b — Reactividad multi-usuario: long-polling + `LISTEN`/`NOTIFY` (reemplaza el polling corto fijo de `t-131`)

**Fecha:** 2026-08-14 · **Estado:** implementado y verificado (t-132) · **Fase:** F10 · **Riesgo:** medio
**Implementación en código:** completa (2026-08-14, misma sesión) — ver §7 y `t-132.json`. `lib/data/DataStoreProvider.tsx` ya no usa `setInterval`.

**Relación con lo existente:** extiende [`m07_capa_reactividad.md`](m07_capa_reactividad.md) (contrato `subscribe()`/`getVersion()`, mecanismo interno del store) al caso multi-usuario/multi-máquina. No lo reemplaza — `notify()` y `useDataStore()` siguen igual; lo que cambia es **cómo se entera el navegador de que otro usuario escribió algo**.

---

## 1. Por qué existe este documento

`t-127` (2026-08-13) decidió Server Actions + hidratación SSR + **polling corto (2-4s)** como mecanismo de reactividad cross-usuario, y `t-131` lo implementó: `DataStoreProvider.tsx` hace `setInterval(poll, 3000)` contra `fetchVersionTokenAction()`, sin pausa por visibilidad de pestaña.

El 2026-08-14 llegó una recomendación externa (`arnes/plan cambio f10 reactividad por eventos`, hoy archivada en [`archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md`](../archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md)) señalando un problema real: con Vercel **Hobby** (100.000 invocaciones/mes) y ~5 usuarios de equipo, un poll de 3s sin pausa agota la cuota mensual en aproximadamente un día de uso real:

```
5 usuarios × 8h × (3600s / 3s) ≈ 48.000 invocaciones/día ≈ 1.000.000/mes
```

El diagnóstico era correcto. La solución que proponía (`BroadcastChannel` + revalidar al foco + poll pasivo de 30s) no lo era — `BroadcastChannel` no cruza máquinas, así que no ataca el problema cross-usuario que es la razón de ser de todo `t-127`/`t-131`, y la alternativa de respaldo (30s + solo-al-foco) degrada silenciosamente el criterio ya aprobado de ≤4s (`CA-10`, `V-5b`) sin pasar por checkpoint. El análisis completo de por qué está mal queda en el archivo deprecado.

Esta discusión llevó a auditar alternativas reales (WebSocket, SSE, Web Push, disparo por actividad del mouse) contra la restricción real del proyecto: Vercel serverless clásico (sin proceso persistente propio) + Neon (compute que se autosuspende si nadie lo usa) + cero infraestructura nueva aprobada por el Supervisor (`t-127`, ya rechazó websockets/SSE-relay/pub-sub de terceros por ese motivo). Este documento cierra esa discusión con una decisión concreta.

## 2. Opciones evaluadas y por qué se descartan

| Opción | Por qué se descarta |
|---|---|
| **Polling corto fijo (2-4s), sin pausa** — lo que implementó `t-131` | Funciona, pero agota la cuota de Vercel Hobby con el equipo real (§1). No tiene pausa por inactividad ni por pestaña oculta. |
| **`BroadcastChannel` + foco + poll pasivo 30s** (plan externo, deprecado) | `BroadcastChannel` es same-origin/same-browser — cero valor para el caso cross-usuario que es el requisito no negociable de `t-127`. La alternativa de respaldo (30s + solo-al-foco) regresiona el SLA ya aprobado de ≤4s a ≤30s (o peor, indefinido para una pestaña que nunca pierde el foco) sin checkpoint. |
| **WebSocket** | Vercel no soporta el *handshake* de upgrade de `ws://` en su capa de routing. No es una limitación de configuración, es estructural — descartado sin más análisis. |
| **SSE con re-consulta interna a la base** | Streaming sí es posible en Vercel (respuesta HTTP normal que se mantiene abierta), pero si adentro se sigue consultando la DB en loop, solo se mudó el polling del navegador al servidor — no elimina el problema, lo esconde. |
| **Web Push API (Service Worker + notificaciones push)** | Es la única opción de push "real" sin infraestructura propia (usa los servidores de push de Google/Mozilla/Apple, gratis, ya existentes). Descartada por ahora porque exige pedirle permiso de notificaciones al usuario y registrar un Service Worker — fricción y complejidad mayor de la que justifica un equipo de ~5 personas con datos ya casi resueltos por la opción elegida (§4). Queda documentada como opción de reserva si el equipo crece mucho o el long-polling no alcanza. |
| **Disparo de refetch por click/mousemove del propio usuario** | Sin correlación causal: que yo mueva el mouse no implica que otro usuario haya escrito algo. Falla exactamente cuando más importa — un usuario tipeando sin tocar el mouse durante 15 minutos no se entera de nada, mientras que en los tramos de actividad normal puede generar más tráfico que un poll bien calibrado. Sí es válido como señal de **presencia** (ver §4.3), pero no como gatillo de "hay novedad". |

## 3. Decisión

Arquitectura de tres capas, cada una resolviendo un problema distinto — no se mezclan responsabilidades:

### 3.1 Detección de cambio real: long-polling acotado + `LISTEN`/`NOTIFY`

En vez de "¿pasó algo? no. ¿pasó algo? no..." cada 3s, el cliente hace una petición que el servidor **no responde de inmediato**: la deja abierta hasta que (a) Postgres avisa un cambio vía `NOTIFY`, o (b) se cumple el timeout máximo que permita el plan de Vercel para esa función — lo que ocurra primero. Al responder (por cualquiera de los dos motivos), el cliente reabre la siguiente espera de inmediato.

Adentro de la función, la conexión no repregunta a la base en loop — usa `LISTEN`/`NOTIFY` de Postgres, y el paquete `postgres` (`postgres.js`) que este proyecto ya usa como driver de Drizzle **soporta `.listen()` nativamente** (no hay que instalar nada nuevo). Las Server Actions de escritura (`t-130`) agregan un `NOTIFY` al final de cada mutación confirmada; la función de long-poll se despierta exactamente ahí, sin ciclos desperdiciados esperando.

Esto reduce el conteo de invocaciones en un orden de magnitud frente al poll fijo (una espera larga cubre lo que antes eran ~10-15 peticiones cortas) sin sacrificar latencia — al contrario, la mejora, porque el aviso llega en el instante del `NOTIFY`, no en el próximo tick del timer.

**Nota sobre Neon:** la conexión que sostiene el `LISTEN` vive solo mientras dura **una** invocación de función (acotada, se relanza sola) — no un socket eterno. Si no hay ningún long-poll en vuelo (nadie con la app abierta), no hay conexión persistente y Neon puede autosuspenderse igual que hoy.

### 3.2 Sincronización entre pestañas del mismo usuario: `BroadcastChannel` + pestaña líder

Es normal que un mismo empleado tenga varias pestañas abiertas (cotizador, taller, finanzas). Sin coordinación, cada una abriría su propio long-poll — multiplicando conexiones por pestaña en vez de por usuario real. Se elige una pestaña "líder" (`navigator.locks`, API nativa, sin librerías) que es la única que mantiene el long-poll abierto; al recibir una actualización, la reparte a sus pestañas hermanas por `BroadcastChannel` en el mismo navegador.

Esto es lo único del plan deprecado que sobrevive — pero en el rol correcto: fan-out local entre pestañas propias, nunca como mecanismo cross-usuario.

### 3.3 Pausa por inactividad real (no por temporizador ciego)

Un timestamp de "última actividad" (mouse/teclado, actualizado con throttle — no en cada evento crudo) decide si el mecanismo debe seguir vivo:

- Sin actividad humana durante **N minutos** (a calibrar; punto de partida razonable: 10-15 min) → se deja morir el long-poll en curso y **no se reabre uno nuevo**. Cero peticiones mientras la pestaña está genuinamente abandonada (noche, fin de semana, almuerzo largo).
- Al detectar la primera actividad tras la pausa → **primero** un catch-up puntual (`fetchVersionTokenAction()` → si cambió, `fetchSnapshotAction()` — el mismo mecanismo que ya existe hoy, sin piezas nuevas) para no perder lo que pasó durante la ausencia, y **recién después** se reabre el long-poll.

El mayor ahorro real de esta capa no está en las horas de uso activo (ahí el long-poll de §3.1 ya es barato) sino en las pestañas olvidadas abiertas fuera de horario — que sin pausa cuestan reconexiones toda la noche por nada.

## 4. Regla técnica (normativa — para que no se reintroduzca el patrón descartado)

1. **Ningún mecanismo de reactividad cross-usuario puede basarse en `BroadcastChannel` como fuente primaria.** `BroadcastChannel` solo puede usarse para fan-out entre pestañas del mismo navegador (§3.2), nunca como sustituto de la detección de cambios real.
2. **Ningún ajuste de "eficiencia" de este mecanismo puede degradar el SLA de reactividad cross-usuario (`CA-10`/`V-5b`, `t-127`) sin pasar explícitamente por el Supervisor.** Cambiar el número (ej. de ≤4s a un valor mayor, si se justifica con la frecuencia real de escritura del negocio) es aceptable como ajuste documentado; que el número deje de estar garantizado y pase a depender de un evento no relacionado (foco de ventana, actividad del mouse) no lo es.
3. **La detección de "hay novedad" nunca depende de una señal generada por el propio usuario que la va a recibir** (su mouse, sus clics, su foco). Esas señales sirven para decidir si el mecanismo debe estar prendido o apagado (§3.3), no para decidir si hay datos nuevos.
4. **No se agrega infraestructura nueva** (proceso siempre-vivo propio, relay de terceros tipo Pusher/Ably, WebSocket) sin checkpoint del Supervisor — sigue vigente el rechazo de `t-127`. Long-polling + `LISTEN`/`NOTIFY` no cuenta como infraestructura nueva: usa capacidades que Vercel y el driver `postgres.js` ya exponen.

## 5. Qué NO se hizo (y por qué)

- **No se adoptó Web Push API.** Es técnicamente la opción de push "más pura" (§2), pero exige permiso de notificaciones + Service Worker — fricción de producto y complejidad de implementación que no se justifican todavía para 5 usuarios con un long-poll que ya resuelve el problema. Se revisita si el equipo crece o si el long-polling muestra límites en producción real.
- **No se implementó fan-out server-side entre múltiples long-polls simultáneos** (ej. un solo listener de Postgres compartido entre todas las conexiones activas). A la escala actual (~5 usuarios) cada long-poll con su propio `.listen()` es suficiente; si el volumen de usuarios concurrentes crece mucho, reevaluar.
- **No se tocó el conteo/naturaleza de las Server Actions de escritura (`t-130`)** — este documento solo cambia cómo se detectan los cambios del lado de lectura/reactividad, no cómo se confirman las escrituras.

## 6. Impacto sobre lo ya implementado

`t-131` está marcada "Completada (código)" con el mecanismo de poll fijo de 3s — ese código queda **superado** por esta decisión, no borrado: sigue funcionando (correctamente, solo que más caro de lo necesario) hasta que se ejecute la tarea de código que lo reemplace. Ver nota agregada en `t-131.json` y la tarea nueva `t-132` (§7).

## 7. Implementación (código, `t-132`, 2026-08-14)

Completada la misma sesión en que se tomó la decisión, por instrucción explícita del Supervisor. Detalle completo en `arnes/tareas/t-132.json`.

1. **Trigger SQL**: `drizzle/v3/0004_veta_notify_trigger.sql` — función `notify_veta_change()` + trigger genérico en las 64 tablas de negocio de `schema.ts` (no solo las Server Actions de `t-130`; el trigger vive en la base, cubre cualquier escritura sin importar por dónde entre). Aplicada a `dev-local`, verificada con query directa a `pg_trigger` (64/64).
2. **`lib/data/actions/longpoll.ts`**: `longPollVersionAction(clientVersion)` usa `.listen()` de `postgres.js` sobre el canal `veta_changes`, acotado a 20s (`maxDuration=25` declarado en `app/layout.tsx`, porque un archivo `'use server'` no puede exportar valores no-función). Devuelve `{ changed, version }`.
3. **`DataStoreProvider.tsx`** reescrito: `setInterval(3000)` reemplazado por el ciclo de long-poll; pestaña líder vía `navigator.locks`; `BroadcastChannel('veta_erp_reactividad')` reparte snapshots y señales de actividad; pausa real a los 12 min de inactividad (`waitForActivity()` sin red) con catch-up incondicional al reanudar.
4. **Verificación mecánica**: `tsc --noEmit` 0 errores, `eslint .` 0 errores/0 warnings nuevos, `next build` 31/31 rutas en `DATA_IMPL=mock` y `DATA_IMPL=drizzle` (contra `dev-local` real), 64/64 triggers confirmados, y dos smoke tests E2E con script efímero contra `dev-local` real: escritura real → `longPollVersionAction` resuelve en 2.4s con `changed=true`; sin escritura → resuelve en 20.1s con `changed=false` (timeout limpio).
5. **Pendiente, no verificable en este entorno headless**: V-5b con dos pestañas/usuarios reales de navegador simultáneas (igual que quedó pendiente en `t-131`), incluyendo el caso de cerrar la pestaña líder y confirmar que otra toma el long-poll, y la pausa por inactividad real (esperar 12 min y confirmar en DevTools que no salen peticiones). Requiere sesión manual del Supervisor.

**Hallazgo durante la implementación — punto ciego de `fetchVersionTokenAction()`.** El smoke test #1 (escritura real en `parametros`, tabla fuera de las 12 que cubre la fórmula de versión de `hydrate.ts`) reveló que comparar version-strings como señal de "hubo cambio" es insuficiente: el trigger SQL cubre las 64 tablas, pero `fetchVersionTokenAction()` (heredada de `t-131`, nunca corregida) solo aproxima 12. Se corrigió el diseño para que `changed` salga siempre de un `NOTIFY` real (nunca de comparar version-strings) y para que `catchUp()` (arranque del líder, reanudar de una pausa) sea incondicional — siempre trae el snapshot fresco en vez de condicionarlo a la fórmula incompleta. Con esto el punto ciego queda resuelto para el camino de long-poll en vivo. **`fetchVersionTokenAction()` en sí sigue sin cubrir las 64 tablas** — no se tocó, porque extenderla de verdad requeriría auditar qué tablas tienen columna `updated_at` (21 de 64 la tienen) y probablemente agregarla a las que no la tienen, que es un cambio de schema con checkpoint propio. Queda como mejora futura documentada, no bloqueante.

## 8. Referencias

- [`m07_capa_reactividad.md`](m07_capa_reactividad.md) — contrato base `subscribe()`/`getVersion()` que este documento extiende, no reemplaza.
- [`plan_f10_migracion.md`](plan_f10_migracion.md) §3.1d — arquitectura general de F10 (Server Actions + hidratación SSR); esta decisión reemplaza solo la sub-sección de reactividad multi-usuario.
- `arnes/tareas/t-127.json`, `t-130.json`, `t-131.json` — decisiones y código previos.
- [`archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md`](../archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md) — propuesta descartada, con el análisis completo de por qué.
