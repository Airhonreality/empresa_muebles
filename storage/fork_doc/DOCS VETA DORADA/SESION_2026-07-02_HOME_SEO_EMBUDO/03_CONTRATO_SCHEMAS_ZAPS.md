# 03 — Contrato Final: Schemas y Zaps (comandos `agno` exactos)

Ejecutar en este orden exacto. Todos los comandos usan `npx tsx scripts/agno.ts ...` (agregar `--env-file=.env.local` si el proyecto usa `DATABASE_URL`; si no está cargada, escribe directo a `storage/db/*.json` vía `LocalStrategy`). **No editar los JSON de `storage/db/` a mano** (regla de `Comandos CLI.md`).

## 1. Schema nuevo: `testimonios`

```bash
npx tsx scripts/agno.ts create-schema testimonios field:nombre_cliente:text:"Nombre del Cliente" field:barrio:text:"Barrio / Zona" field:texto_resena:textarea:"Texto de la Reseña" field:calificacion:number:"Calificación (1-5)" field:proyecto_relacionado:text:"Proyecto Relacionado" field:destacado:boolean:"Destacado en Home" field:fecha_resena:date:"Fecha de la Reseña"
```

Después, marcar campos requeridos (el flag `required` de `create-schema` no aplica por campo en la forma abreviada; usar `set`):

```bash
npx tsx scripts/agno.ts set testimonios.nombre_cliente.required true
npx tsx scripts/agno.ts set testimonios.texto_resena.required true
npx tsx scripts/agno.ts set testimonios.calificacion.required true
```

**Regla de negocio (de `Tono de voz de marca.md` §5):** estos registros se crean/curan manualmente por el equipo de marketing desde el panel admin — **nunca** generados o inventados por IA ni importados automáticamente de Google Maps. `calificacion` debe estar en rango 1-5. Solo los que tengan `destacado = true` se muestran en el Home; el resto puede usarse en páginas de silo futuras.

## 2. Extender `leads`

```bash
npx tsx scripts/agno.ts add-field leads gclid text label:"Google Click ID"
npx tsx scripts/agno.ts add-field leads estado_proyecto select label:"Estado del Proyecto" options:"Tengo diseño y medidas,Necesito que me visiten y asesoren"
npx tsx scripts/agno.ts add-field leads score_conversion number label:"Score de Conversión (1-10)"
npx tsx scripts/agno.ts add-field leads utm_source text label:"UTM Source"
npx tsx scripts/agno.ts add-field leads utm_medium text label:"UTM Medium"
npx tsx scripts/agno.ts add-field leads utm_campaign text label:"UTM Campaign"
```

Ninguno de estos campos es `required`: `gclid`/`utm_*` pueden venir vacíos (tráfico orgánico o directo), `score_conversion` se llena después por comercial, no en el submit del formulario.

**No tocar** `nombre_completo`, `telefono_whatsapp`, `email`, `barrio_zona`, `tipo_espacio`, `mensaje` — ya cubren el resto del embudo y `VetaAgendar.tsx` ya los renderiza dinámicamente desde el schema.

## 3. NAP real en `configuracion_comercial` (records, no campos)

El schema ya existe con `llave/valor/grupo/etiqueta`. Solo faltan records:

```bash
npx tsx scripts/agno.ts create-record configuracion_comercial llave=direccion_taller valor="Carrera 72A # 71A-57, Bogotá D.C., Colombia" grupo=Contacto etiqueta="Dirección del Taller"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=ciudad_operacion valor="Bogotá D.C." grupo=Contacto etiqueta="Ciudad de Operación"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=codigo_postal valor="111611" grupo=Contacto etiqueta="Código Postal (referencial, verificar antes de publicar)"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=geo_latitud valor="4.65500" grupo=Contacto etiqueta="Latitud (referencial, verificar antes de publicar)"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=geo_longitud valor="-74.09000" grupo=Contacto etiqueta="Longitud (referencial, verificar antes de publicar)"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=horario_semana valor="Mo-Fr 08:00-18:00" grupo=Contacto etiqueta="Horario Lunes a Viernes"
npx tsx scripts/agno.ts create-record configuracion_comercial llave=horario_sabado valor="Sa 09:00-13:00" grupo=Contacto etiqueta="Horario Sábado"
```

**Atención al modelo ejecutor:** `codigo_postal`, `geo_latitud` y `geo_longitud` están marcados explícitamente como **referenciales** porque el usuario solo confirmó la dirección textual (`Carrera 72A # 71A-57, Bogotá D.C.`), no las coordenadas exactas ni el código postal DANE. **No publicar estos tres valores en el JSON-LD de producción sin verificarlos** (Google Maps / catastro) — usar un geocodificador real o pedir confirmación antes del deploy final. El `horario_semana`/`horario_sabado` también son un valor razonable por defecto del sector (ver benchmarking de competencia en `INVS_SEO_empresas mobiliario.md`), no un dato confirmado — verificar contra el horario real del taller.

También corregir el valor legacy que hoy fuerza "Medellín" en el footer (fallback hardcodeado en `VetaFooter.tsx` línea 118, `<span>Medellín, Colombia</span>`) — ver `04_PLAN_HOME_BIOFILIA.md`.

## 4. Zap nuevo: `capturar_lead_embudo`

```bash
npx tsx scripts/agno.ts script write capturar_lead_embudo --file storage/fork_doc/SESION_2026-07-02_HOME_SEO_EMBUDO/scripts/capturar_lead_embudo.js
```

Contenido sugerido para `scripts/capturar_lead_embudo.js` (el modelo ejecutor debe crear este archivo temporal antes del `script write`, o pasar el código inline si la CLI lo permite):

```javascript
// input esperado: { nombre_completo, telefono_whatsapp, tipo_espacio, estado_proyecto,
//                    barrio_zona, email, mensaje, gclid, utm_source, utm_medium, utm_campaign,
//                    whatsapp_destino }  // whatsapp_destino: numero E.164 sin '+' ni espacios
const id = crypto.randomUUID()

await api.saveItem('leads', {
  id,
  data: {
    nombre_completo: input.nombre_completo,
    telefono_whatsapp: input.telefono_whatsapp,
    email: input.email || '',
    barrio_zona: input.barrio_zona || '',
    tipo_espacio: input.tipo_espacio,
    estado_proyecto: input.estado_proyecto,
    mensaje: input.mensaje || '',
    gclid: input.gclid || '',
    utm_source: input.utm_source || '',
    utm_medium: input.utm_medium || '',
    utm_campaign: input.utm_campaign || ''
  }
})

const mensajePrellenado =
  `Hola Veta Dorada, soy ${input.nombre_completo}. ` +
  `Necesito un ${input.tipo_espacio}. Actualmente ${input.estado_proyecto}.`

const url =
  `https://wa.me/${input.whatsapp_destino}?text=${encodeURIComponent(mensajePrellenado)}`

api.dispatchEvent('open_url', { url, target: '_blank' })
api.notify.success('Solicitud registrada, te redirigimos a WhatsApp')
```

Nota: confirmar en tiempo de ejecución cuál es la forma real de pasar `input` al zap en este engine (revisar cómo otros zaps con formulario reciben parámetros, p. ej. `registrar_abono_y_activar`) — el snippet de arriba es la lógica de negocio a preservar; adaptar la firma de entrada al patrón real de `AgnosticAction`/`api.query` si difiere.

## 5. Zap nuevo: `actualizar_score_lead`

```bash
npx tsx scripts/agno.ts script write actualizar_score_lead --file storage/fork_doc/SESION_2026-07-02_HOME_SEO_EMBUDO/scripts/actualizar_score_lead.js
```

```javascript
// input esperado: { lead_id, score_conversion }  // score_conversion: 1-10
const leads = await api.query('leads')
const lead = leads.find(l => l.id === input.lead_id)
if (!lead) {
  api.notify.error('Lead no encontrado')
} else {
  await api.saveItem('leads', {
    id: lead.id,
    data: { ...lead.data, score_conversion: input.score_conversion }
  })
  api.notify.success('Score de conversión actualizado')
}
```

Punto de integración recomendado para invocar este zap: `ComercialKanban.tsx` / `ComercialCard.tsx` (donde comercial ya marca proyectos como ganados) — ver `05_PLAN_EMBUDO_ARQUITECTURA.md` para el detalle. Si esos componentes no tienen todavía una vista de "leads" (solo de "proyectos"), documentar el punto de integración exacto sin forzar un acople que no existe en el modelo de datos actual.

## 6. Cierre técnico

```bash
npm run agnostic:compile
npx tsx scripts/agno.ts validate --zaps
npx tsx scripts/agno.ts docs all
```

`docs all` regenera `arbol_de_schemas.md`, `arbol_de_zaps.md`, `arbol_de_rutas.md`, `arbol_de_modulos.md` — deben reflejar los 2 zaps y el schema `testimonios` nuevos antes de dar por cerrado este contrato.
