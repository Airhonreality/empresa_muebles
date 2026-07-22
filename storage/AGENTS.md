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

## Definition lifecycle for this fork

Before enabling production, record these fork decisions:

```text
AGNOSTIC_STORAGE_STRATEGY:
AGNOSTIC_DEFINITION_MODE:
active definition revision:
definition snapshot used by the build:
rollback revision:
```

`schema_definitions`, `page_routes`, and `scripts` are engine definitions.
Their formats and names remain unchanged. In `revision` mode, mutate them only
through the definition publisher (Vault, governed CLI, or MCP routing), never
by writing the backing revision store directly.

Adoption sequence for an existing fork:

```text
legacy -> definitions plan -> definitions apply -> shadow -> revision
```

Do not advance if shadow reports divergence. A declared revision failure is a
blocking error; do not silently read legacy namespaces.

Engine reference: `src/docs/DEFINITION_LIFECYCLE.md`.

## Sincronización de Rutas en Despliegue

Las rutas definidas en `storage/db/page_routes.json` se sincronizan automáticamente a Neon (o tu capa de persistencia activa) durante el despliegue mediante el pipeline post-build:

```
npm run build → npm run post-deploy
├─ Valida consistencia de rutas
└─ Sincroniza a Neon (si AGNOSTIC_STORAGE_STRATEGY=postgres)
```

Si la validación falla, el despliegue se revierte automáticamente.

Ver detalles de arquitectura en [src/docs/ROUTES_SYNC_PIPELINE.md](../src/docs/ROUTES_SYNC_PIPELINE.md).

Para instrucciones de setup en Vercel, ver [src/docs/ROUTES_SYNC_VERCEL_SETUP.md](../src/docs/ROUTES_SYNC_VERCEL_SETUP.md).

## Contrato de publicación pública

La aplicación no publica datos a través de `GET /api/vault`. El vault es privado.

- Los catálogos públicos se declaran como `publicReadModels`: lista explícita de campos, filtros fijos impuestos por servidor y límite. Nunca se filtran en el cliente datos ya descargados.
- Los documentos individuales usan `public_links`: una capacidad por registro y una proyección explícita de campos. No se publica el registro fuente completo ni campos fuera de la proyección.
- Los slugs, tokens y rutas públicas pertenecen al fork. El seed solo exige capacidades revocables, expiración y almacenamiento de tokens mediante hash.
- Las rutas públicas deben ser páginas aisladas. No montan `AppProvider`, `AgnosticShell`, ni hacen polling del vault.

Antes de publicar, auditar campo por campo la proyección y comprobar que revocación y expiración devuelven 404.

# Fork Documentation
    - storage\fork_doc\MANIFEST GOAL.MD - Contiene la semilla del proyecto que se debe seguir cómo goal base. 
    - Modelo de diseño de detalle de modulos de fork: (pendiente por incluir)

# Arboles de arqutiectura:
    Se generan autoamticamente con CLI en storage/docs/ y muestran el estado actual real de los schemas, zaps y rutas del fork.
    - Arbol de schemas
    - Arbol de zaps
    - Arbol de rutas
Son snapshots regenerables (no se editan a mano). Siempre se usa esta infromacion para diagnosicar y tomar decisiones de diseño.

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
