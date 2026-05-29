# Inicio — Agnostic System

---

## Parte 1 — Crear un proyecto nuevo desde cero

**Cinco pasos, una sola vez.**

### Paso 1 — Clonar el seed

```bash
git clone https://github.com/Airhonreality/Agnostic_System_Seed.git nombre-proyecto
cd nombre-proyecto
```

Esto te da el engine completo. `nombre-proyecto` es el nombre de la carpeta local.

---

### Paso 2 — Crear el silo (obligatorio, manual)

El silo es el identificador de tu proyecto y dice dónde viven tus datos.  
Crea este archivo exacto:

**`storage/system_config.json`**
```json
[
  {
    "id": "master_passport",
    "context": "system_config",
    "data": {
      "project_identity": "nombre-proyecto",
      "storage_strategy": "LocalStrategy",
      "dna_strategy": "local"
    }
  }
]
```

Luego crea la carpeta de datos vacía:
```bash
mkdir -p storage/nombre-proyecto/db
```

> ⚠️ `project_identity` debe coincidir con el nombre de la carpeta dentro de `storage/`.  
> No se puede crear desde la UI — la UI solo gestiona silos ya existentes.

---

### Paso 3 — Instalar y correr

```bash
npm install
npm run dev
```

Abre `http://localhost:3000/_agnostic` — desde ahí creas schemas, rutas y datos. Tu app está lista.

---

### Paso 4 — Conectar a GitHub (para guardar y sincronizar)

Crea un repo vacío en GitHub, luego:

```bash
git remote set-url origin https://github.com/TU_USUARIO/nombre-proyecto.git
git remote add upstream https://github.com/Airhonreality/Agnostic_System_Seed.git
git push -u origin main
```

- `origin` = tu proyecto (donde guardas cambios)
- `upstream` = el seed (de donde recibes mejoras del engine)

---

## Parte 2 — Trabajo diario en un proyecto existente

```bash
# Abrir VS Code en la carpeta del proyecto
code nombre-proyecto

# Primera vez:
npm install

# Siempre:
npm run dev
```

Eso es todo. Tus datos, componentes y configuración están en el repositorio del proyecto.

---

## Parte 3 — Recibir mejoras del engine (raro)

Cuando el seed tiene un fix o feature nuevo:

```bash
git fetch upstream
git merge upstream/main
```

Seguro porque el seed **nunca toca** `storage/` ni `src/components/specialized/`.

---

## Parte 4 — Arreglar un bug del engine (muy raro)

```bash
# Abrir la carpeta del seed puro
code "agnostic system"

# Hacer el fix y subirlo al seed
git push origin main

# Luego en cada proyecto:
git fetch upstream && git merge upstream/main
```

---

## Comienza a usar

Una vez con `npm run dev` corriendo:

- **`/_agnostic`** → UI de administración: crear schemas, rutas, ver datos, gestionar silo
- **`npx tsx scripts/agno.ts`** → CLI para agentes de IA y automatización

---

[@Comandos CLI.md](Comandos%20CLI.md) — Guía completa del CLI agno: cómo crear schemas, rutas, scripts y estructuras de datos desde terminal o con un agente de IA.

[@Interfaces Custom.md](Interfaces%20Custom.md) — Guía de widgets, tipos TypeScript y patrones para proyectar datos en interfaces personalizadas (React, WebGL, etc.).
