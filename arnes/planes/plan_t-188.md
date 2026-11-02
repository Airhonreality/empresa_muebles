# Plan t-188 — Conversiones y atribución dentro de Clientes

## Objetivo
Ver, en el ERP, qué clics de Google Ads/sitio se convirtieron en leads, cuáles se pueden
enlazar a una persona y cuáles ya son clientes/contratos — sin agregar una pantalla nueva.
Además, cerrar las fugas de atribución que hoy impiden ese enlace.

## Decisiones del Supervisor (2026-10-26)
- **Fusionar con Clientes**, no una sección "Marketing" nueva (minimalismo de la información):
  `/erp/clientes` gana una vista "Conversiones" al lado de la tabla de clientes.
- **Sin métricas de Google Ads todavía** (costo/clics/impresiones): requieren la API de Ads
  con OAuth + developer token, bloqueados en `t-110` (`[SOLO_HUMANO]`). La pantalla muestra
  solo datos de primera parte ya capturados.
- **Todos los CTA de WhatsApp pasan por el formulario** (`AsesoriaBoton`/`AsesoriaModal`):
  el teléfono es la llave de enlace con la conversación real.
- **Sin cambios de schema** en esta tarea: `leads` (gclid/wbraid/gbraid, UTMs, etapa,
  `cliente_id`, `proyecto_id`), `eventos_conversion_offline` y `clientes` ya existen.

## Diagnóstico que origina la tarea
1. Ninguna pantalla del ERP lee `leads` ni `eventos_conversion_offline`.
2. 7 CTA de WhatsApp abren `wa.me` directo: no crean lead, no llevan gclid/UTM, el mensaje no
   identifica a la persona (`espacio-landing`, `bitacora`, `bitacora/[slug]`,
   `para-arquitectos`, `portafolio/[slug]`, `espacios`, `espacios/pisos-de-madera`).
3. `AsesoriaModal` usa un circuit breaker de 1.5 s: si la DB tarda, navega a WhatsApp con un
   mensaje genérico y el lead puede no quedar guardado.
4. El nombre es opcional y, si falta, la acción guarda "Cliente Web" y el mensaje lo repite.
5. La conversión de gtag se dispara sin `user_data` (Enhanced Conversions no implementado).
6. `eventos_conversion_offline` no tiene ningún escritor: la cola está vacía siempre.

## Cambios

### A. Atribución del sitio público
1. `lib/leads/ref.ts` (puro): `generarRefLead(id)` (`VD-XXXXXX`) y
   `construirMensajeWhatsApp({ nombre, tipoProyecto, ubicacion, ref })`. Si no hay nombre, el
   mensaje no dice "mi nombre es"; siempre lleva la referencia.
2. `app/actions/lead-actions.ts`: acepta `leadId` generado en el cliente (uuid) para que la
   referencia exista aunque la escritura tarde; devuelve `ref` y el mensaje se arma con el
   helper. Mantiene el `id` del server si no llega.
3. `components/veta/asesoria-modal.tsx`: genera `leadId` y `ref` antes de enviar; espera la
   respuesta hasta 5 s (sin mensaje genérico); en fallo/timeout navega con el mismo mensaje
   (nombre + ref), nunca con uno distinto. Antes de disparar la conversión, setea
   `gtag('set','user_data',{sha256_phone_number, sha256_email_address})` con Web Crypto
   (normalización E.164 simple).
4. `components/veta/asesoria-boton.tsx`: `precio3dFormatted` opcional (lo consulta al abrir si
   no llega), para poder usarlo en páginas públicas que no lo tienen.
5. Reemplazar los 7 enlaces `wa.me` por `AsesoriaBoton` (mismo copy y estilos).

### B. Pantalla dentro de Clientes
6. `lib/data/contracts.ts`: tipos `Lead` y `EventoConversionOffline` (mapean 1:1 el schema).
7. `lib/data/actions/lecturas-clientes.ts`: el snapshot de clientes suma `leads` y
   `eventosConversion` (lectura completa de ambas tablas, ~cientos de filas).
8. `lib/data/queries/clientes-types.ts` + `clientes-compat.tsx`: exponer `leads`,
   `eventosConversion` y mutations de asociación; `ClientesSnapBridge` invalida también por
   `leads` y `eventos_conversion_offline`.
9. `lib/data/actions/leads.ts` (nuevo, `use server` + `requireSesionEmpleado` + Zod):
   - `asociarLeadAClienteAction({ leadId, clienteId })` → set `cliente_id`.
   - `convertirLeadEnClienteAction({ leadId })` → crea cliente con nombre/teléfono/email del
     lead y lo asocia.
10. `lib/data/queries/conversiones.ts` (puro): filas de conversión (lead + cliente + proyecto +
    contrato + eventos), filtros (fecha, campaña, atribución, etapa, sin cliente) y KPIs.
11. `app/erp/(modern)/clientes/page.tsx`: conmutador "Clientes | Conversiones". KPIs: total,
    atribuidas a Ads, sin atribución, sin identificar, asociadas a cliente, contratos firmados.
    Tabla ordenable/filtrable con: fecha, referencia, persona, teléfono, campaña/término,
    atribución, etapa, cliente, acciones (asociar / convertir en cliente / ver proyecto).
    Sección colapsable con la cola `eventos_conversion_offline` (pendientes/enviadas/error).
12. `components/veta/asociar-lead-modal.tsx`: buscar cliente existente o crear uno desde el
    lead; cierra y refresca el snapshot.
13. `app/erp/(modern)/clientes/[clienteId]/page.tsx`: bloque "Conversiones" con los leads
    asociados a ese cliente (fecha, ref, campaña, etapa).

### C. Cola de conversiones offline
14. `lib/data/actions/core.ts`: al crear un contrato (y al editarlo, solo si no existe) inserta
    en `eventos_conversion_offline` un evento `contrato_firmado` en estado `pendiente` si el
    proyecto tiene un lead con `gclid`/`wbraid`/`gbraid`, con el valor del contrato. Idempotente
    por (lead, contrato). No sube nada a Google: el uploader queda bloqueado por `t-110`.

### D. Pruebas y verificación
15. Tests puros `node:assert` + `tsx`:
    - `lib/leads/ref.test.ts`: formato de ref, mensaje con/sin nombre, ref presente siempre.
    - `lib/data/queries/conversiones.test.ts`: KPIs, filtros y merge lead→cliente/proyecto.
16. `npx tsc --noEmit`, `npx eslint .`, los tests nuevos y `npx next build` con
    `DATABASE_URL` placeholder (los errores de conexión son esperados).

## Riesgos y mitigación
- **Datos personales**: la vista muestra teléfonos/gclid; ya vive detrás del login del ERP
  (middleware). No se agrega un gate por rol en esta tarea porque hoy ningún módulo lo tiene.
- **Latencia del formulario**: se elimina el corte de 1.5 s; el peor caso es una espera de 5 s
  antes del fallback, que ya lleva el mensaje correcto.
- **Sin migración**: ninguna tabla/columna nueva; el deploy no puede romper producción por
  schema. Si `leads`/`eventos_conversion_offline` no tuvieran datos en producción, la pantalla
  muestra vacíos, no error.

## Rollback
Revert del commit. Sin migración de datos.
