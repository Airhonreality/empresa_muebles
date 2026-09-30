# Índice de contexto — Arnés

Este índice se mantiene corto a propósito. Existe para que un agente sepa qué leer al arrancar, sin cargar el proyecto entero a su memoria de trabajo.

**Regla de oro:** borrar lo obsoleto, no acumularlo. Cuando algo deja de ser cierto, se borra. No se marca obsoleto y se deja ahí.

**Purga 2026-09-30 (Fase 0 de limpieza):** `arnes/lineas/ola6/` y `arnes/lineas/ola7/` (6MB, ~115 archivos de planeación histórica de fases ya implementadas o de módulos fuera de foco) se sacaron del working tree de `dev`. Siguen recuperables al 100% en la rama `arnes-historico-fase0` y en el historial de git — no se perdió nada, se dejó de cargar en el contexto de cada agente. Motivo: el volumen de documentación hacía que decisiones ya cerradas (ej. el precio del diseño 3D) se re-trataran como abiertas porque estaban repetidas en más de diez archivos distintos. Ver `arnes/decisiones_cerradas.md`.

## Contexto activo

Lee en este orden:

### 1. AGENTS.md
Declara las zonas del proyecto, sus dueños, y qué sí/qué no se puede hacer en cada una. Es la ley del arnés.

### 1.b arnes/MODELOS.md
**Regla canónica de modelos (contrato vivo).** Modelos free verificados, intercalación opencode/zen + OpenRouter.

### 1.c arnes/decisiones_cerradas.md
**Fuente única de decisiones de negocio cerradas.** Antes de tratar cualquier precio/parámetro/regla como "sin definir", se busca aquí primero. Editable directo por el Supervisor sin pasar por un agente.

### 1.d arnes/nucleo/ — la verdad de negocio compartida (contrato vivo)
- `REGISTRO_DE_ENTIDADES.md` — **Canon raíz del schema.** Tablas con nombre canónico, función de negocio y relaciones. **Si difiere de cualquier otra fuente, gana este.**
- `logica_de_negocio.md` — el mapa maestro del negocio. **Documento 1** para entender el negocio desde cero.
- `glosario_h07.md` — vocabulario de UI: entidades, estados, verbos, mapeo campo-schema→nombre natural. Consumir ANTES de escribir labels en cualquier pantalla.

### 2. arnes/estado.md
Dashboard: en qué punto está el proyecto y cuál es la próxima acción permitida.

### 3. arnes/tareas/
Ledger compartido (`t-001`..`t-1xx`+, un solo pool secuencial de IDs).

### 4. arnes/roles/
Contratos de los 5 roles (orquestador, iniciador, código, QA, supervisor). Se lee al arranque de cada sesión (`AGENTS.md` paso 4).

### 5. arnes/lineas/demanda/ — captación, conversión, marca del sitio público (sin código, sin tocar todavía en esta pasada de limpieza)
No auditada en la purga del 2026-09-30 (el pedido explícito fue "olas 6 y 7"). Sigue siendo la línea de trabajo del sitio público/SEO/marketing; candidata a la misma revisión más adelante si se decide.

## Foco vigente (2026-09-30)

El trabajo activo es el **ciclo núcleo**: cotizador (definidor de proyecto) → ficha de proyecto → contrato → seguimiento, más clientes y catálogo como soporte directo de ese ciclo, finanzas en versión simplificada, y una primitiva UI agnóstica de selector/creador de entidad reusable en modales. Auditoría de dependencias completa (2026-09-30, ver `arnes/decisiones_cerradas.md`): de 10 módulos candidatos a recorte, solo `gates` se eliminó (cero entrelazamiento). Los otros 9 (`comercial`, `taller`, `compras`, `equipo`, `herramientas`, `pedidos-web`, `portafolio`, `catalogos/espacios-arquitectonicos`, `garantia`) **quedan congelados, no borrados** — son funcionales, algunos (`portafolio`, `garantia`) son backend real del sitio público. No se planifica trabajo nuevo ahí sin pedido explícito del Supervisor, pero el código sigue intacto y editable. Detalle en `arnes/estado.md`.

## Archivado

`arnes/lineas/ola6/` y `arnes/lineas/ola7/` (histórico completo, incluida su carpeta `archivo/` interna) viven en la rama `arnes-historico-fase0` y en el historial de `dev` anterior al commit de purga. Se leen ahí si hace falta reconstruir cómo se llegó a una decisión — no son parte del contexto por defecto de un agente.
