# Inicio — Agnostic System

---

## Cómo está organizado todo

En tu computador tienes dos tipos de carpetas conviviendo como hermanas:

```
DEVs/
  agnostic system/        ← El ENGINE. No lo tocas para trabajar.
  empresa_muebles_clone/  ← Un PROYECTO. Aquí vive tu negocio.
  otro_proyecto/          ← Otro proyecto (cuando lo crees).
```

El **engine** es el cerebro compartido. Los **proyectos** son los que le dan identidad y datos a cada cliente.  
El engine mejora solo — tus proyectos reciben esas mejoras con un comando.

Cada proyecto tiene su propio directorio `storage/` que actúa como base de datos viva:

```
mi_proyecto/
  storage/
    db/         ← Schemas, rutas, registros (JSON)
    styles/     ← Tokens visuales
    manifest.json  ← Estrategia de almacenamiento activa
```

---

## Crear un proyecto nuevo

Abre la terminal en la carpeta del engine (`agnostic system`) y corre:

```powershell
.\scripts\admin\new-workspace.ps1 -Name nombre_del_proyecto
```

Reemplaza `nombre_del_proyecto` con el nombre real (sin espacios, usa guión bajo).

**Qué pasa automáticamente:**
- Se clona el engine en `../nombre_del_proyecto`
- Se crea el repositorio en GitHub
- El proyecto queda registrado para recibir mejoras del engine en el futuro

**Qué haces tú después:**

```powershell
cd ..\nombre_del_proyecto
npm install
npm run dev
```

Abre `http://localhost:3000` — si no hay usuarios registrados, verás el modo **bootstrap**: crea el primer administrador directamente desde ahí.

---

## Configurar el despliegue

Una vez dentro del panel (`http://localhost:3000/schema`), ve al tab **⚡ Deploy** en el rail izquierdo.

El **Configurador de Servicios** diagnostica cada servicio en tiempo real, te permite probar credenciales antes de guardarlas, y las escribe directamente en Vercel sin que salgas del panel.

### Asistente de Configuración Inicial (Setup Wizard)

Cuando levantas el sistema por primera vez en un nuevo fork, la interfaz detecta de forma autónoma si faltan las variables de entorno principales. En lugar de mostrar el panel vacío, el sistema inicia un **Setup Wizard interactivo** paso a paso:

1. **Pantalla de Bienvenida:** Explica el modelo mental del sistema y el flujo que se va a seguir.
2. **Paso 1: Vincular Vercel:** Solicita las claves de la API de Vercel (`VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`). Esto permite que el panel pueda escribir automáticamente en tu entorno de producción. (Se omite automáticamente en desarrollo local).
3. **Paso 2: Estrategia de Datos:** Permite elegir de forma visual tu persistencia de datos (PostgreSQL, GitHub o Local) y probar la conexión en tiempo real antes de continuar.
4. **Paso 3: Archivos (Cloudflare R2):** Configura el bucket de almacenamiento para imágenes y archivos en producción.
5. **Paso 4: Resumen y Despliegue:** Muestra un consolidado de las variables recolectadas. Al confirmar:
   - **En Vercel:** Guarda todo mediante un único envío seguro y realiza el redespliegue automático de la aplicación.
   - **En Local:** Genera un bloque de configuración listo para copiar y pegar directamente en tu archivo `.env.local`.

> **Omitir Configuración:** Si estás en desarrollo y deseas ignorar el asistente, puedes hacer clic en "Omitir configuración". Esto persistirá tu elección en el navegador (`localStorage`) para que no te vuelva a molestar durante el desarrollo.

### Estrategias disponibles

| Estrategia | Cuándo usarla | Variables requeridas |
|---|---|---|
| **Local** (dev) | Desarrollo en tu máquina | Ninguna |
| **GitHub** (prod) | Producción gratuita, datos en JSON | `GITHUB_TOKEN`, `GITHUB_REPO` |
| **PostgreSQL** (prod) | BD relacional universal (Neon, Supabase Postgres, etc.) | `DATABASE_URL` |
| **Supabase** (prod) | API REST de Supabase (Legacy, requiere DDL manual) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Prioridad de resolución: `GITHUB_REPO` → `DATABASE_URL` → `SUPABASE_URL` → Local (fallback). Si configuras ambas, GitHub gana.

### Archivos (subidas) — Cloudflare R2

```
CF_ACCOUNT_ID=
CF_R2_BUCKET=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_PUBLIC_URL=        ← opcional, para URLs públicas
```

El health check de R2 verifica permisos reales de escritura (PutObject + DeleteObject), no solo que el bucket exista.

### Auth — activar login con contraseña

Por defecto el panel está abierto (modo desarrollo). Para activar login:

```
SESSION_SECRET=un_secreto_de_64_caracteres_hexadecimales
```

Genera el secreto con PowerShell:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$b = New-Object byte[] 32
$rng.GetBytes($b)
[System.BitConverter]::ToString($b).Replace('-','').ToLower()
```

El panel muestra el snippet copiable si `SESSION_SECRET` no está configurado.

### Migrar datos entre estrategias

Si ya tienes datos reales en una estrategia (p. ej. GitHub) y quieres migrar a otra (como PostgreSQL), el panel incluye una herramienta de migración controlada en la sección **Migrar datos**:

1. **Configura el destino** — agrega las variables de la nueva estrategia en Vercel sin eliminar las de la fuente. GitHub sigue siendo activo porque tiene mayor prioridad.
2. **(Solo Supabase PostgREST)** Genera el SQL de setup y ejecútalo en el editor SQL de tu proyecto Supabase antes de migrar. Para PostgreSQL estándar (Neon, Supabase directo, etc.), la tabla única `agnostic_records` se crea de forma automática en el primer guardado de datos (Zero-DDL).
3. **Simula** — revisa qué se migraría (namespace por namespace) sin escribir nada en el destino.
4. **Ejecuta la migración** — copia todos los registros al destino. La operación es idempotente; ejecutarla varias veces no duplica datos.
5. **Verifica** — confirma que los datos aparecen en el destino.
6. **Corta la fuente** — elimina las variables de la estrategia original en Vercel y redesplega. La nueva estrategia queda activa.

> La migración requiere que ambas estrategias estén configuradas simultáneamente durante el proceso. En datasets grandes (> 500 registros) puede exceder el límite de 10s de Vercel Hobby — en ese caso ejecuta desde un plan Pro o hazlo namespace por namespace vía la API.

### Dónde poner las variables

- **Desarrollo local:** archivo `.env.local` en la raíz del proyecto (no se sube a git)
- **Vercel:** a través del Configurador de Servicios del panel, o manualmente en Settings → Environment Variables

---

## Trabajo diario en un proyecto existente

```powershell
cd ..\nombre_del_proyecto
npm run dev
```

- `http://localhost:3000` — tu app
- `http://localhost:3000/schema` — el panel de configuración (schemas, rutas, datos, deploy)

---

## Cuando mejoras el engine

Cada vez que corriges un bug o agregas una funcionalidad al engine, dos pasos:

**Paso 1 — Guardar el cambio:**
```powershell
git add .
git commit -m "descripción del cambio"
```

**Paso 2 — Propagar a todos los proyectos:**
```powershell
.\scripts\admin\sync-workspaces.ps1
```

El script sube el engine a GitHub y actualiza automáticamente cada proyecto registrado.  
Si hay un conflicto en algún proyecto, el script lo reporta y sigue con los demás.

---

## Referencias

- [Comandos CLI.md](Comandos%20CLI.md) — Crear schemas, rutas y datos desde terminal o con un agente IA.
- [Interfaces Custom.md](Interfaces%20Custom.md) — Guía para construir componentes visuales personalizados.
