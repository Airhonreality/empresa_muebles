# 💎 DIAMANTE 1: PLAN MAESTRO DE ARQUITECTURA DE MEDICIÓN, ATRIBUCIÓN Y ANALÍTICA (V3)
**Línea de trabajo:** Demanda / Ads & Web V3  
**Fecha:** 21 de Agosto de 2026  
**Estado:** 📜 Plan Finalizado (Pendiente de Aprobación para Diamante 2: Implementación)  

---

## 🎯 OBJETIVO GENERAL

Construir una infraestructura de atribución y analítica de comportamiento de clase mundial en la V3 de Veta de Oro que:
1. Elimine la "ceguera" de Google Ads recuperando la captura de **GCLID + GBRAID + WBRAID + UTMs**.
2. Active **Enhanced Conversions for Leads** (SHA-256 en formato E.164) para recuperar entre 25% y 40% de conversiones perdidas en iPhones/Safari.
3. Integre **Microsoft Clarity** para grabar sesiones en video y mapas de calor con cero impacto en Core Web Vitals y mascaramiento de privacidad HTML.
4. Garantice **cero pérdida de eventos** al redirigir al usuario a WhatsApp mediante un patrón de resiliencia de 3 capas.
5. Amplíe el esquema de base de datos (`leads` y `eventos_conversion_offline` en Drizzle ORM) para conectar firmas de contratos en el ERP con ventas reales en Google Ads.

---

## 📚 CONSOLIDADO DE INVESTIGACIÓN (LOS 5 ENTREGABLES)

Toda la investigación profunda se encuentra guardada en la carpeta `arnes/lineas/demanda/archivo/`:

| Pregunta / Módulo | Archivo de Investigación | Hallazgo Clave |
|---|---|---|
| **P1: GCLID / GBRAID / WBRAID** | `INVESTIGACION_P1_GCLID_NEXTJS.md` | Captura del trío obligatorio de identificadores en `sessionStorage` + Cookie First-Party 90 días en Next.js. |
| **P2: Enhanced Conversions** | `INVESTIGACION_P2_ENHANCED_CONVERSIONS.md` | Formato E.164 + SHA-256 para matching en Google Data Manager API en caso de que Safari borre el GCLID. |
| **P3: Analítica Comportamiento** | `INVESTIGACION_P3_ANALITICA_COMPORTAMIENTO.md` | Microsoft Clarity (100% gratis ilimitado), `strategy="afterInteractive"`, `data-clarity-mask="true"`. |
| **P4: Resiliencia WhatsApp** | `INVESTIGACION_P4_RESILIENCIA_WHATSAPP.md` | Server Action + GTAG Callback + Timeout 500ms + Apertura en `_blank` para cero pérdida de datos. |
| **P5: Schema Drizzle / ERP** | `INVESTIGACION_P5_MODELO_DATOS_ERP.md` | Ampliación de la tabla `leads` y creación de `eventos_conversion_offline` (append-only). |

---

## 🛠️ ESTRUCTURA DE COMPONENTES A CREAR (DIAMANTE 2)

Cuando se ordene la implementación (Diamante 2), se crearán y modificarán los siguientes archivos en la V3:

```text
lib/
 ├── db/
 │    └── schema.ts                       <-- Ampliación de tabla leads + nueva tabla eventosConversionOffline
 ├── hooks/
 │    └── useGclidCapture.ts              <-- Hook puro de captura de GCLID/GBRAID/WBRAID/UTMs
 └── security/
      └── user-hashing.ts                 <-- Normalización E.164 y hashing SHA-256 (libphonenumber-js)

components/
 ├── analytics/
 │    ├── AttributionTracker.tsx         <-- Componente Headless client-side (layout)
 │    └── ClarityAnalytics.tsx            <-- Componente de script Microsoft Clarity
 └── veta/
      └── AsesoriaModal.tsx               <-- Modal de 2 pasos con resiliencia de envío a WhatsApp + mascaramiento

app/
 ├── actions/
 │    └── lead-actions.ts                 <-- Server Action para persistir lead y generar URL de WhatsApp
 └── layout.tsx                           <-- Inyección global de scripts de analítica
```

---

## 🏁 ENTREGABLE DEL DIAMANTE 1

Este plan maestro consolida el **Diamante 1 (Descubrimiento y Definición)**.  
Queda listo y guardado en el arnés para ser revisado por el Supervisor.
