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

---

## Crear un proyecto nuevo

Abre la terminal en la carpeta del engine (`agnostic system`) y corre:

```powershell
.\scripts\admin\new-workspace.ps1 -Name nombre_del_proyecto
```

Reemplaza `nombre_del_proyecto` con el nombre real (sin espacios, usa guión bajo).

**Qué pasa automáticamente:**
- Se crea la carpeta `../nombre_del_proyecto` con el engine adentro
- Se crea el repositorio en GitHub
- El proyecto queda registrado para recibir mejoras del engine en el futuro

**Qué haces tú después (una sola vez):**

1. Entra a la carpeta del proyecto:
   ```powershell
   cd ..\nombre_del_proyecto
   npm install
   npm run dev
   ```

2. Abre el navegador en `http://localhost:3000/_agnostic`

3. Crea el **silo** del proyecto desde la UI — esto le da identidad y dice dónde vivirán los datos.

4. Ya puedes crear schemas, rutas y datos desde el panel.

---

## Trabajo diario en un proyecto existente

```powershell
cd ..\nombre_del_proyecto
npm run dev
```

Abre `http://localhost:3000` — tu app.  
Abre `http://localhost:3000/_agnostic` — el panel de configuración.

Nada más.

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
