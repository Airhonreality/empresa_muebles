# Plan de Integraciones de Producción: Segunda Ola Nomon

Este documento actúa como radar de arquitectura para desacoplar el desarrollo de primera ola (basado en simulaciones de alta fidelidad) de las integraciones de producción de la segunda ola.

## 📋 Radar de Componentes y Estado de Integración

| Módulo / Feature | Fase 1: Desarrollo Local (Mock Hifi) | Fase 2: Producción (Integración Real) |
| :--- | :--- | :--- |
| **Sesiones & Identidad** | **Mock User Switcher** flotante en cabecera para conmutar perfiles locales (Javier, Elena, Nam, Sol, Bio) usando cookies/headers locales. | Integración con **Iron Session** o **NextAuth** ligado a firma criptográfica (Sovereign Tech). |
| **Videoconferencia (LiveKit)**| **Simulador Sala Viva**: Iframe interactivo local con streaming simulado, listado de participantes real y chat en tiempo real integrado por base de datos local. | Conexión a un servidor de **LiveKit Cloud / Local SFU** usando JWT dinámicos firmados con `@livekit/components-react`. |
| **Pasarela de Recarga Fiat** | **Simulador Webhook Webpay/Wompi**: Disparador local que invoca el Zap `zap_registrar_recarga_fiat` con referencias y montos customizados. | Integración con Webhooks reales firmados criptográficamente de la pasarela de pagos seleccionada. |
| **Visor de Documentos (Zen)**| Renderizado nativo en componente de archivos Markdown y PDF locales utilizando buffers locales. | Almacenamiento en CDN de **Vercel Blob / AWS S3** integrado en el visor web. |
| **Base de Datos / Persistencia**| `LocalStrategy` basada en archivos JSON estructurados en `storage/db/`. | `PostgresStrategy` en la nube (ej. Supabase o Neon DB) activado desde `manifest.json`. |
