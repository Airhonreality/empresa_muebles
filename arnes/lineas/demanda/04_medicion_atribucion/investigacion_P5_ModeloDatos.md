# 🔬 Deep Research — Pregunta 5: Modelo de Datos de Atribución en el ERP (Drizzle ORM + Postgres)
**Fecha:** 21 de Agosto de 2026  
**Línea:** Demanda / Arnés de Medición V3  
**Estado:** ✅ Investigación Completada  

---

## 🎯 RESUMEN DE HALLAZGOS Y DISEÑO DEL SCHEMA

Auditando el archivo existente `lib/db/schema.ts` (Líneas 100-110), confirmamos la hipótesis H2 del arnés:  
Actualmente la tabla `leads` **solo captura 3 campos UTM** (`utmSource`, `utmMedium`, `utmCampaign`) y carece de los campos indispensables para atribución de pauta digital y conversiones offline.

---

## 📐 PROPOSAL DE SCHEMA MEJORADO (DRIZZLE ORM)

### 1. Ampliación de la Entidad `leads` (`lib/db/schema.ts`)

```typescript
export const estadoLeadEnum = pgEnum("estado_lead", [
  'nuevo_lead',
  'contactado',
  'asesoria_agendada',
  'cotizado',
  'contrato_firmado',
  'descartado'
]);

export const leads = pgTable("leads", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  nombre: text().notNull(),
  telefonoWhatsapp: text("telefono_whatsapp").notNull(),
  email: text(),
  
  // ── Capa de Atribución Google Ads & UTMs ────────────────
  gclid: text("gclid"),
  wbraid: text("wbraid"),
  gbraid: text("gbraid"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),

  // ── Enhanced Conversions (SHA-256) ─────────────────────
  hashedPhone: text("hashed_phone"), // Formato E.164 SHA-256 (Hexadecimal)
  hashedEmail: text("hashed_email"),

  // ── Cualificación del Embudo Híbrido ───────────────────
  tipoProyecto: text("tipo_proyecto"), // 'cocina', 'closet', 'amoblamiento'
  ubicacion: text("ubicacion"), // 'Bogotá Norte', 'Chía', 'Sabana', etc.
  scoreConversion: integer("score_conversion").default(0), // 1 a 10 asignado por vendedor
  etapa: estadoLeadEnum("etapa").default('nuevo_lead').notNull(),

  // ── Trazabilidad en ERP ────────────────────────────────
  proyectoId: uuid("proyecto_id").references(() => proyectos.id),
  clienteId: uuid("cliente_id").references(() => clientes.id),

  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
```

---

### 2. Nueva Entidad Append-Only: `eventos_conversion_offline`

Esta tabla registra cada disparo de conversión enviado a Google Data Manager API a medida que el lead avanza en el embudo comercial del ERP.

```typescript
export const estadoEnvioGoogleEnum = pgEnum("estado_envio_google", [
  'pendiente',
  'procesando',
  'enviado_exitoso',
  'error_matching'
]);

export const eventosConversionOffline = pgTable("eventos_conversion_offline", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  contratoId: uuid("contrato_id").references(() => contratos.id),
  
  // Tipo de Hito en Google Ads
  nombreEventoGoogle: text("nombre_evento_google").notNull(), // 'Lead_Qualificado', 'Cotizacion_Enviada', 'Contrato_Firmado'
  valorConversion: numeric("valor_conversion", { precision: 14, scale: 2 }).default('0').notNull(),
  
  // Identificadores de Coincidencia Enviados
  gclidUsado: text("gclid_usado"),
  hashedPhoneUsado: text("hashed_phone_usado"),
  
  // Auditoría del Envió
  estadoEnvio: estadoEnvioGoogleEnum("estado_envio").default('pendiente').notNull(),
  respuestaGoogleApi: jsonb("respuesta_google_api"),
  reintentos: integer("reintentos").default(0),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  enviadoEn: timestamp("enviado_en", { mode: 'string' }),
});
```

---

## 🔄 CICLO DE VIDA DE ATRIBUCIÓN EN EL ERP

```
[1. Submit Modal Web] ──> Crea Lead (Guarda GCLID + HashedPhone + Utms)
                              │
[2. Filtro Comercial] ──> Vendedor asigna Score >= 7 
                              │
                              └──> Dispara Evento 'Lead_Qualificado' a Google Ads ($0 COP)
                              │
[3. Elaboración Propuesta] ──> Proyecto pasa a 'cotizado'
                              │
[4. Firma de Contrato] ──> Proyecto pasa a 'firmado' (Valor: $18.500.000 COP)
                              │
                              └──> Dispara Evento 'Contrato_Firmado' a Google Data Manager API
                                   con valor REAL ($18.500.000 COP) para calcular ROAS real.
```

---

## ✅ BENEFICIOS DEL DISEÑO DE DATOS
1. **Medición de ROAS Real (Retorno sobre Inversión Publicitaria):** Al conectar el valor del contrato en el ERP con el `gclid` original, Google Ads optimiza por dinero real ganado, no por clics.
2. **Historial Inmutable:** La tabla `eventos_conversion_offline` es append-only, lo que permite auditar exactamente qué conversiones recibió Google Ads y cuáles fallaron.
3. **Compatible con Drizzle ORM:** Encaja perfectamente con la arquitectura existente en `lib/db/schema.ts` y las convenciones del arnés de código.
