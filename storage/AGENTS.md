# Fork Agent Harness

This file belongs to the fork layer. Update it in each project fork.

## Project Identity

Name: "Agnostic Seed"

Purpose: base seed for schema-driven project forks.

Business domain: none in the seed. Real domain meaning must be added by each fork.

## Encoding Contract

- Use UTF-8 without BOM for persisted text.
- Prefer explicit UTF-8 read and write calls in fork scripts.
- Validate encoding before propagating shared registry files across forks.

# Fork Documentation
    - storage\fork_doc\MANIFEST GOAL.MD - Contiene la semilla del proyecto que se debe seguir cómo goal base. 
    - Modelo de diseño de detalle de modulos de fork: (pendiente por incluir)

# Arboles de arqutiectura:
    Se generan autoamticamente con CLI y muestran el estado actual real de los schemas, zaps y rutas del fork.
    - Arbol de schemas
    - Arbol de zaps
    - Arbol de rutas
Siempre se usa esta infromacion para diagnosicar y tomar decisiones de diseño.

## Versionado y Sincronización del Fork

- **Versionado SemVer**: Se maneja independientemente del motor base en el `package.json` del fork. El incremento de versión se realiza manualmente con `npm version [patch|minor|major]` o mediante tags de Git.
- **Sincronización del Motor (Engine)**: Para importar actualizaciones del repositorio semilla (Agnostic Seed) sin sobrescribir las dependencias locales, se ejecuta:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/admin/sync-workspaces.ps1
  ```
  O de forma manual:
  ```bash
  git fetch upstream
  git merge upstream/main --no-ff -m "chore: sync engine"
  ```
- **Árboles de Arquitectura**: Se compilan dinámicamente con la fecha y hora de ejecución en `storage/progreso/` ejecutando:
  ```bash
  npx tsx scripts/agno.ts docs all
  ```
