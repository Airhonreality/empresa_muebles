# 🏛️ MCP: Contrato Industrial Agnóstico (v5.1)
## Protocolo de Mediación Soberana y Contextos Dinámicos

Este contrato define las leyes de interacción entre la IA y el Núcleo Agnóstico. Versión 5.1: Isomorfismo de Persistencia.

---

## 1. El Handshake 0 (Algoritmo de Descubrimiento)
Obligatorio para toda IA que inicie sesión con Zero Context:

1.  **Structure Index:** `query({ domain: 'structure', context: 'schema_definitions' })`
2.  **Navigation Index:** `query({ domain: 'structure', context: 'page_routes' })`
3.  **Inventory Index:** `query({ domain: 'inventory' })`
4.  **Specs Index:** `query({ domain: 'specs' })`

---

## 2. Herramientas de Soberanía v5.1

### 👁️ `query(domain, context?, target?)` — El Oráculo Universal
- **Dominios y Contextos:**
    - `structure`: DNA del sistema. Requiere `context` (ej: `schema_definitions`, `page_routes`, `menus`).
    - `inventory`: Manifiesto de Materia. Contexto por defecto: `vault_manifest`.
    - `specs`: Registro de Capacidades UI.
- **Isomorfismo:** Todas las respuestas están normalizadas bajo el patrón de envoltorio `{ context: [items] }`.
- **Target:** ID o Path específico para evitar el truncamiento.

### ✍️ `saveItem(context, payload)` — Escritura Isomórfica
- **Acción:** Crea o actualiza un ítem en cualquier contexto.
- **Garantía:** El puente asegura que el archivo físico mantenga siempre la estructura envuelta, eliminando ambigüedades de lectura.

---

## 3. Arquitectura de Navegación (DNA-Driven)
Las rutas no son código; son **Registros de DNA** en el contexto `page_routes`.

**Esquema de Ruta:**
- `path`: URL de la página.
- `component`: Nombre del módulo UI (`AgnosticGrid`, `AgnosticForm`, etc.).
- `props`: Parámetros de configuración (vinculación a bóvedas, densidad, etc.).

---

## 🛡️ Axioma de Oro
> "El sistema es Isomórfico: la forma de los datos en el DNA, en la Materia y en el Protocolo es la misma. La IA no navega por archivos; gobierna contextos."
