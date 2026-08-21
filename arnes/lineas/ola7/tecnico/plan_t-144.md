# Plan de Tarea: t-144

**Título:** Integración de Motor de Envío de Contratos (Gmail OAuth2) en ERP Next.js
**Fecha de creación:** 2026-08-21
**Origen:** Especificación técnica validada en `google_workspace_cli` (`.credentials/auth_empresa.json`)
**Estado:** PROPUESTA EN ARNÉS (Pendiente de aprobación de Javier para codificación)

---

## 1. Objetivo

Integrar un servicio nativo de envío de correos electrónicos desde el ERP (Next.js + Vercel) utilizando la API oficial de Gmail con autenticación OAuth2 persistente via `refresh_token`. 

Permitirá enviar contratos en PDF (almacenados en Cloudflare R2) a los clientes directamente desde la cuenta oficial de la empresa (`ventas@empresa.com` / `vetadeoro.co@gmail.com`), garantizando:
1. Registro automático en la bandeja de **Enviados** de Gmail.
2. Respuestas directas del cliente a la bandeja oficial.
3. Alta entregabilidad libre de filtros de spam (SPF/DKIM/DMARC nativos de Google Workspace).

---

## 2. Zona y Alcance

- **Zona afectada:** `lib/email/` (servicio), `app/actions/` (Server Actions), `components/veta/` / `app/erp/` (UI de contratos).
- **Riesgo:** Medio (requiere dependencia `googleapis` y variables de entorno en Vercel/.env.local).
- **Checkpoint requerido:** Sí (Aprobación explícita de Javier antes de ejecutar `npm install` y modificar código de la aplicación).

---

## 3. Requisitos Previos y Credenciales

Las credenciales fueron validadas y generadas previamente en el entorno de desarrollo local (`google_workspace_cli/.credentials/auth_empresa.json`):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `SENDER_EMAIL`

---

## 4. Fases de Implementación Propuestas (Post-Aprobación)

### Paso 1: Configurar Dependencias
Instalar el SDK oficial de Google en el ERP:
```bash
npm install googleapis
```

### Paso 2: Configurar Variables de Entorno
Registrar en `.env.local` y en el panel de Vercel (Preview & Production):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `SENDER_EMAIL`

### Paso 3: Servicio Helper de Gmail (`lib/email/gmail-service.ts`)
Crear el helper con autenticación serverless inyectando el `refresh_token` de forma persistente y formateando el mensaje MIME UTF-8 base64url.

### Paso 4: Server Action (`app/actions/send-contract.ts`)
Crear Server Action `'use server'` que reciba los parámetros del contrato (`to`, `clientName`, `contractUrl`), invoque `sendContractEmail` y actualice opcionalmente el estado/bitácora del envío en el ERP.

### Paso 5: Conexión UI en ERP
Vincular el botón "Enviar por Correo" / "Enviar Contrato" en los modales de contrato del ERP (`components/veta/` / `app/erp/cotizador/` / `app/erp/contratos/`).

---

## 5. Criterios de Aceptación y Verificación

1. `npx tsc --noEmit` exit 0.
2. `npx eslint .` exit 0 en los archivos creados.
3. Envío exitoso retornando HTTP 200 / confirmación del mensaje de Gmail.
4. Verificación de presencia en la bandeja de "Enviados" de Gmail.

---

## 6. Referencias

- Tarea del arnés: `arnes/tareas/t-144.json`
- CLI de referencia: `C:\Users\javir\Documents\DEVs\Agentic_Toolbox\google_workspace_cli`
