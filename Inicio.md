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

Ahí verás en tiempo real qué variables de entorno están configuradas y cuáles faltan, con tutoriales paso a paso para obtener cada clave.

### Estrategias disponibles

| Estrategia | Cuándo usarla | Variables requeridas |
|---|---|---|
| **Local** (dev) | Desarrollo en tu máquina | Ninguna |
| **GitHub** (prod) | Producción gratuita, datos en JSON | `GITHUB_TOKEN`, `GITHUB_REPO` |
| **Supabase** (prod) | Producción con base de datos relacional | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### Archivos (subidas) — Cloudflare R2

Para que los uploads funcionen en producción configura:

```
CF_ACCOUNT_ID=
CF_R2_BUCKET=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_PUBLIC_URL=        ← opcional, para URLs públicas
```

Sin estas variables las subidas se guardan localmente (solo sirve en dev).

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

Sin `SESSION_SECRET`, el panel funciona sin login — ideal para desarrollo local.

### Dónde poner las variables

- **Desarrollo local:** archivo `.env.local` en la raíz del proyecto (no se sube a git)
- **Vercel:** Settings → Environment Variables

El tab Deploy del panel muestra exactamente cuáles faltan y qué significa cada una.

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
