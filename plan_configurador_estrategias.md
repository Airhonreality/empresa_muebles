# Plan: Configurador Interactivo de Estrategias + Health Check + API de Vercel

> Estado: **Borrador v2 — Auditoría completa**
> Fecha: 2026-06-09

---

## 0. Contexto Actual (Estado del Código)

El sistema ya posee una arquitectura de estrategias desacoplada:

| Archivo | Rol |
|---|---|
| [getStrategy.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/server/getStrategy.ts) | Resuelve la estrategia activa por prioridad de variables de entorno |
| [LocalStrategy.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/server/strategies/LocalStrategy.ts) | Persistencia en sistema de archivos local (fallback) |
| [GitHubStrategy.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/server/strategies/GitHubStrategy.ts) | Persistencia via API de GitHub (repos como base de datos) |
| [SupabaseStrategy.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/server/strategies/SupabaseStrategy.ts) | Persistencia en Supabase (PostgreSQL en la nube) |
| [sovereignty.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/types/sovereignty.ts) | Tipos: `StrategyType = 'LocalStrategy' \| 'GitHubStrategy' \| 'SupabaseStrategy'` |
| [upload/route.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/app/api/upload/route.ts) | Subida de archivos: Cloudflare R2 si hay credenciales, o filesystem local |
| [env-status/route.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/app/api/admin/env-status/route.ts) | Lee `process.env` y devuelve `true/false` por cada variable |
| [DeploySection.tsx](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/src/components/agnostic/designer/sections/DeploySection.tsx) | Panel de despliegue actual (pasivo, lista de pasos hardcodeada) |

### Problema Detectado

El panel actual (`DeploySection.tsx`) es **pasivo y estático**:
- Solo muestra si las variables de entorno existen o no (`true/false`).
- No permite seleccionar estrategias, ingresar credenciales, testear conexiones, ni guardar configuración.
- Los tutoriales de cada servicio están hardcodeados como pasos manuales sin interacción.

---

## 1. Principios de Diseño Axiomático

| Principio | Aplicación |
|---|---|
| **Sin almacenamiento local de secretos** | Las credenciales nunca se escriben en archivos JSON, `.env`, ni en disco. El único almacén seguro de secretos es la bóveda encriptada de Vercel. |
| **Bootstrapping mínimo** | El usuario solo configura manualmente 2-3 variables iniciales en Vercel (una sola vez). Todo lo demás se gestiona desde el panel interactivo. |
| **Desacoplamiento** | Cada estrategia tiene su propio health checker independiente. Añadir una nueva estrategia (ej. Neon Postgres) requiere solo agregar un checker y un formulario, sin modificar los existentes. |
| **Sin reinventar la rueda** | Se usa la API REST de Vercel (v10/v13) como bóveda de secretos y motor de despliegue. Se usa el estándar IETF `draft-inadarei-api-health-check` para las respuestas de salud. |

---

## 2. Variables de Bootstrap (Configuración Manual Única)

El usuario configura estas variables **una sola vez** directamente en el Dashboard de Vercel (Settings → Environment Variables):

| Variable | Descripción | Obligatoria |
|---|---|---|
| `VERCEL_ACCESS_TOKEN` | Token de API personal o de equipo ([docs](https://vercel.com/docs/rest-api#authentication)) | ✅ |
| `VERCEL_PROJECT_ID` | ID del proyecto (visible en Settings → General) | ✅ |
| `VERCEL_TEAM_ID` | ID del equipo/organización (solo si la cuenta es de equipo) | ⚠️ Condicional |

> [!IMPORTANT]
> Sin estas variables, el configurador no puede comunicarse con Vercel. El panel debe detectar su ausencia y mostrar un asistente de bootstrap claro con los 3 pasos para obtener estos valores.

---

## 3. Catálogo de Estrategias y Variables

### 3.1 Persistencia de Datos (Registros / JSON)

La resolución actual en `getStrategy.ts` sigue esta prioridad:
`GITHUB_REPO` → `SUPABASE_URL` → `LocalStrategy` (fallback)

| Estrategia | Variables Requeridas | Health Check |
|---|---|---|
| **GitHubStrategy** | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` (opcional, default: `main`) | `GET https://api.github.com/repos/{owner}/{repo}` con header `Authorization: Bearer {token}`. Verificar que el response incluya `permissions.push === true`. |
| **SupabaseStrategy** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `POST {SUPABASE_URL}/rest/v1/rpc/` con una consulta liviana o verificar que el endpoint responda con un `200` al enviar un `SELECT 1` via el cliente REST. |
| **LocalStrategy** | *(Ninguna — es el fallback automático)* | Verificar que el directorio del silo sea escribible (`fs.access` con `fs.constants.W_OK`). En Vercel, este check siempre falla (filesystem de solo lectura). |

### 3.2 Almacenamiento de Archivos (Assets / Uploads)

| Estrategia | Variables Requeridas | Health Check |
|---|---|---|
| **Cloudflare R2** | `CF_ACCOUNT_ID`, `CF_R2_BUCKET`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_PUBLIC_URL` (opcional) | Inicializar un `S3Client` efímero y ejecutar `ListObjectsV2Command` con `MaxKeys: 1`. Si no lanza error de firma/credenciales, la conexión es válida. |
| **Local (fallback)** | *(Ninguna)* | Verificar escritura en el directorio `assets/` del silo. |

### 3.3 Autenticación

| Estrategia | Variables Requeridas | Health Check |
|---|---|---|
| **Session Auth** | `SESSION_SECRET` | Verificar que el valor tenga al menos 32 caracteres. No requiere conexión externa. |

---

## 4. Estándar de Health Check (IETF `draft-inadarei-api-health-check`)

### 4.1 Formato de Respuesta

```json
{
  "status": "warn",
  "description": "Estado de los servicios del sistema",
  "checks": {
    "data:github": [{
      "componentId": "github-strategy",
      "componentType": "datastore",
      "status": "pass",
      "time": "2026-06-09T18:30:00Z"
    }],
    "storage:r2": [{
      "componentId": "cloudflare-r2",
      "componentType": "object-store",
      "status": "fail",
      "output": "InvalidAccessKeyId: The AWS Access Key Id you provided does not exist in our records.",
      "time": "2026-06-09T18:30:01Z"
    }],
    "auth:session": [{
      "componentId": "session-secret",
      "componentType": "system",
      "status": "pass",
      "time": "2026-06-09T18:30:00Z"
    }]
  }
}
```

### 4.2 Reglas de Derivación de Status Global

| Condición | Status Global | HTTP Code |
|---|---|---|
| Todos los checks son `pass` | `pass` | `200` |
| Al menos uno es `fail` pero hay estrategias funcionales | `warn` | `200` |
| Ninguna estrategia de datos funciona | `fail` | `503` |

---

## 5. Endpoints del Backend

### 5.1 Health Check Global (Lee Variables Existentes del Servidor)

- **Ruta:** `GET /api/admin/health`
- **Autenticación:** Sesión de admin activa
- **Comportamiento:** Lee las variables de `process.env` del servidor actual y ejecuta los health checks en paralelo con un timeout de 5 segundos por servicio.
- **Respuesta:** Formato estándar de la Sección 4.

### 5.2 Test de Conexión en Caliente (Credenciales Temporales)

- **Ruta:** `POST /api/admin/health/test`
- **Autenticación:** Sesión de admin activa
- **Payload:**
```json
{
  "strategy": "r2",
  "credentials": {
    "CF_ACCOUNT_ID": "abc123",
    "CF_R2_BUCKET": "mi-bucket",
    "CF_R2_ACCESS_KEY_ID": "...",
    "CF_R2_SECRET_ACCESS_KEY": "..."
  }
}
```
- **Comportamiento:** Crea un cliente efímero con las credenciales recibidas (sin guardarlas), ejecuta el health check específico, y devuelve el resultado.
- **Respuesta:**
```json
{
  "status": "pass",
  "output": null,
  "time": "2026-06-09T18:30:00Z",
  "latency_ms": 342
}
```

### 5.3 Guardar Variables en Vercel y Redesplegar

- **Ruta:** `POST /api/admin/config/save`
- **Autenticación:** Sesión de admin activa
- **Payload:**
```json
{
  "variables": [
    { "key": "GITHUB_TOKEN", "value": "github_pat_...", "sensitive": true },
    { "key": "GITHUB_REPO", "value": "usuario/repo", "sensitive": false },
    { "key": "GITHUB_BRANCH", "value": "main", "sensitive": false }
  ],
  "redeploy": true
}
```
- **Comportamiento:**
  1. Lee `VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID` y `VERCEL_TEAM_ID` de `process.env`.
  2. Para cada variable del payload, ejecuta:
     ```
     POST https://api.vercel.com/v10/projects/{projectId}/env?upsert=true
     Authorization: Bearer {VERCEL_ACCESS_TOKEN}
     Body: { "key": "...", "value": "...", "type": "encrypted", "target": ["production", "preview", "development"] }
     ```
  3. Si `redeploy === true`, dispara un nuevo despliegue:
     ```
     POST https://api.vercel.com/v13/deployments
     Body: { "name": "{projectId}", "target": "production", "gitSource": { ... } }
     ```
  4. Devuelve el ID del despliegue para polling.

- **Respuesta:**
```json
{
  "saved": 3,
  "failed": 0,
  "errors": [],
  "deployment": {
    "id": "dpl_abc123",
    "url": "https://mi-proyecto-xyz.vercel.app",
    "readyState": "BUILDING"
  }
}
```

### 5.4 Polling de Estado de Despliegue

- **Ruta:** `GET /api/admin/config/deploy-status?deploymentId=dpl_abc123`
- **Comportamiento:** Proxy a `GET https://api.vercel.com/v13/deployments/{id}` y devuelve el estado actual.
- **Respuesta:**
```json
{
  "id": "dpl_abc123",
  "readyState": "READY",
  "url": "https://mi-proyecto-xyz.vercel.app"
}
```
- **Estados posibles de `readyState`:** `QUEUED` → `BUILDING` → `READY` | `ERROR` | `CANCELED`

---

## 6. Diseño de la Interfaz (`DeploySection.tsx`)

### 6.1 Estructura de la Nueva UI

```
┌─────────────────────────────────────────────────────────┐
│  🚀 CONFIGURADOR DE SERVICIOS                          │
│  ─────────────────────────────────────                  │
│  Health global: ● PASS  (3/3 servicios activos)        │
│                                                         │
│  ┌── PERSISTENCIA DE DATOS ────────────────────────┐   │
│  │  ○ Local (Solo desarrollo)                      │   │
│  │  ● GitHub Strategy (Activa)                     │   │
│  │  ○ Supabase Strategy                            │   │
│  │                                                  │   │
│  │  GITHUB_TOKEN   [••••••••••••••••]    ✅         │   │
│  │  GITHUB_REPO    [usuario/repo    ]    ✅         │   │
│  │  GITHUB_BRANCH  [main            ]    ✅         │   │
│  │                                                  │   │
│  │  [🔍 Probar Conexión]  ✅ Conexión exitosa 342ms│   │
│  │  [💾 Guardar en Vercel y Redesplegar]           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌── ALMACENAMIENTO DE ARCHIVOS ───────────────────┐   │
│  │  ○ Local (Solo desarrollo)                      │   │
│  │  ● Cloudflare R2 (Activa)                       │   │
│  │                                                  │   │
│  │  CF_ACCOUNT_ID          [abc123def    ]    ✅    │   │
│  │  CF_R2_BUCKET           [mi-bucket    ]    ✅    │   │
│  │  CF_R2_ACCESS_KEY_ID    [••••••••••   ]    ✅    │   │
│  │  CF_R2_SECRET_ACCESS_KEY[••••••••••   ]    ✅    │   │
│  │  CF_R2_PUBLIC_URL       [https://...  ]    ⚠️    │   │
│  │                                                  │   │
│  │  [🔍 Probar Conexión]  ✅ Conexión exitosa 187ms│   │
│  │  [💾 Guardar en Vercel y Redesplegar]           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌── AUTENTICACIÓN ────────────────────────────────┐   │
│  │  SESSION_SECRET  [••••••••••••••••]    ✅        │   │
│  │  [💾 Guardar en Vercel y Redesplegar]           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌── ESTADO DEL DESPLIEGUE ────────────────────────┐   │
│  │  ████████████████████░░░  BUILDING (78%)         │   │
│  │  ID: dpl_abc123                                  │   │
│  │  Esperando finalización...                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Estados de la Interfaz

| Estado | Comportamiento |
|---|---|
| **Sin Bootstrap** | `VERCEL_ACCESS_TOKEN` o `VERCEL_PROJECT_ID` no detectados. Se muestra un asistente de 3 pasos para obtenerlos manualmente en Vercel. |
| **Bootstrap OK** | Se carga el Health Check global. El selector de estrategias muestra cuál está activa y permite cambiar. |
| **Probando Conexión** | Spinner en el botón. Inputs deshabilitados. |
| **Test Exitoso** | Check verde con latencia. Se habilita el botón "Guardar y Redesplegar". |
| **Test Fallido** | Mensaje de error descriptivo del campo `output` del health check. |
| **Guardando** | Spinner. Toda la sección bloqueada. |
| **Desplegando** | Barra de progreso con polling cada 5 segundos al endpoint de deploy-status. |
| **Despliegue Completado** | Mensaje de éxito con enlace al URL de producción. |

---

## 7. Seguridad — Brechas Conocidas (MVP)

> [!CAUTION]
> **Credenciales en Tránsito por el Navegador:** En este MVP, las credenciales viajan desde el formulario del navegador al backend por HTTPS. Aunque están cifradas en tránsito (TLS), cualquier extensión maliciosa del navegador o ataque XSS podría interceptarlas. Esto es aceptable para un MVP donde el admin es el propio desarrollador, pero para producción multi-usuario se debería migrar a un flujo OAuth server-side o un CLI.

> [!WARNING]
> **El Token de Vercel es la Llave Maestra:** `VERCEL_ACCESS_TOKEN` da control total sobre el proyecto (variables, despliegues, dominios). Si un atacante obtiene este token, puede leer y escribir cualquier variable del proyecto. Mitigación: usar tokens con scope limitado (Fine-grained tokens de Vercel) y rotarlos periódicamente.

> [!NOTE]
> **Variables Sensibles en Vercel:** Las variables guardadas con `"type": "encrypted"` en Vercel **no pueden ser leídas de vuelta** por la API ni por el dashboard. Una vez guardadas, solo se pueden sobreescribir. Por esto, la UI no podrá pre-llenar los campos con valores existentes — solo puede mostrar si la variable existe o no (comportamiento actual con `!!process.env.VAR`).

---

## 8. Inventario de Archivos a Crear / Modificar

### Archivos Nuevos

| Archivo | Descripción |
|---|---|
| `src/app/api/admin/health/route.ts` | Endpoint GET — Health Check global del sistema |
| `src/app/api/admin/health/test/route.ts` | Endpoint POST — Test de conexión en caliente con credenciales temporales |
| `src/app/api/admin/config/save/route.ts` | Endpoint POST — Guarda variables en Vercel via API y dispara redeploy |
| `src/app/api/admin/config/deploy-status/route.ts` | Endpoint GET — Polling del estado de un despliegue de Vercel |
| `src/server/health/checkers.ts` | Módulo con los health checkers individuales por estrategia (GitHub, R2, Supabase, Local, Session) |

### Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/components/agnostic/designer/sections/DeploySection.tsx` | Reescritura completa: de panel pasivo a configurador interactivo con formularios, selectores, testers y polling de despliegue |
| `src/app/api/admin/env-status/route.ts` | Se conserva temporalmente para compatibilidad, pero será sustituido progresivamente por `/api/admin/health` |

### Archivos Sin Cambios

| Archivo | Razón |
|---|---|
| `src/server/getStrategy.ts` | No cambia. Sigue resolviendo la estrategia por `process.env`. El configurador solo se encarga de que esas variables existan en Vercel. |
| `src/server/strategies/*.ts` | No cambian. Son consumidores, no productores de configuración. |
| `src/app/api/upload/route.ts` | No cambia. Ya tiene la lógica condicional R2/Local. |

---

## 9. Flujo de Desarrollo Local (Sin Vercel)

> [!TIP]
> En desarrollo local (`process.env.VERCEL` no existe), el configurador debe detectar que no hay conexión a Vercel y ofrecer un modo degradado:
> - El Health Check global funciona normalmente (lee las variables del `.env.local`).
> - El botón "Probar Conexión" funciona normalmente (el test es independiente de Vercel).
> - El botón "Guardar en Vercel" se **deshabilita** con un mensaje: *"Guardado automático solo disponible en producción. En desarrollo, agrega las variables a tu `.env.local`"*.
> - Se muestra la plantilla `.env.local` copiable (funcionalidad actual que se conserva).

---

## 10. Orden de Implementación

| Fase | Tarea | Dependencia |
|---|---|---|
| **F1** | Crear `src/server/health/checkers.ts` con los health checkers individuales | Ninguna |
| **F2** | Crear `GET /api/admin/health` (Health Check global) | F1 |
| **F3** | Crear `POST /api/admin/health/test` (Test en caliente) | F1 |
| **F4** | Crear `POST /api/admin/config/save` (Puente con API de Vercel) | Ninguna |
| **F5** | Crear `GET /api/admin/config/deploy-status` (Polling de despliegue) | Ninguna |
| **F6** | Reescribir `DeploySection.tsx` — UI interactiva | F2, F3, F4, F5 |
| **F7** | Testing manual completo (dev local + Vercel staging) | F6 |

---

## 11. Dependencias de Paquetes

| Paquete | Uso | Estado |
|---|---|---|
| `@aws-sdk/client-s3` | Health checker de R2 (`ListObjectsV2Command`) | ✅ Ya en el proyecto (usado en `upload/route.ts`) |
| Vercel REST API | Peticiones HTTP con `fetch` nativo | ✅ Sin paquete adicional — es HTTP estándar |
| Supabase | Health checker — petición REST directa | ✅ Sin paquete adicional — se usa `fetch` directo al endpoint REST |
| GitHub API | Health checker — petición REST directa | ✅ Sin paquete adicional — se usa `fetch` directo |

> No se requieren nuevas dependencias de paquetes npm.
