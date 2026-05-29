# Guía de Prompting — Agnostic System

Manual para el diseñador. Sin código. Sin configuración.
Cuatro patrones cubre el 95% de lo que necesitas.

---

## Antes de empezar

Abre tu agente (Cursor, Claude, Copilot) y pega el contenido de `AGENT_RULES.md`
en la configuración de reglas del proyecto. Una vez. Para siempre en ese repo.

Luego asegúrate de que el MCP bridge esté activo cuando trabajes con datos:
```
npm run mcp:bridge
```

---

## Los 4 patrones

---

### Patrón 1 — Crear una entidad nueva

Cuando necesitas guardar un nuevo tipo de información (clientes, productos, pedidos…).

**Prompt:**
```
Crea un schema llamado "proveedores" con los campos:
- nombre (texto, requerido)
- nit (texto)
- telefono (texto)
- categoria (select: madera / herraje / tapicería)
- activo (booleano, default true)
```

El agente usa `create_schema` del MCP bridge. Nunca toca un JSON.

---

### Patrón 2 — Crear una página

Cuando necesitas una URL nueva que muestre o edite datos.

**Prompt:**
```
Crea una ruta /proveedores que muestre una tabla editable
de todos los proveedores y un formulario para agregar nuevos.
```

El agente usa `create_route` + `update_route`. La página aparece automáticamente.

---

### Patrón 3 — Construir una pantalla custom

Cuando la tabla y el formulario genéricos no son suficientes.
Usa esto para cotizadores, dashboards, editores complejos.

**Prompt:**
```
Crea un bloque especializado "proveedor_card" para el schema "proveedores".
Muestra cada proveedor como una tarjeta con nombre grande, categoría como badge
de color, y un botón de contacto que abre el teléfono. Estética minimalista.
```

El agente genera `src/components/specialized/ProveedorCard.tsx`,
lo registra en `agnostic.config.ts`, y te dice qué poner en la ruta.

---

### Patrón 4 — Automatizar una acción

Cuando un botón debe hacer algo: calcular, exportar, notificar, guardar.

**Prompt:**
```
Cuando el usuario haga clic en "Archivar proveedor", el sistema debe:
1. Poner activo = false en ese registro
2. Mostrar un toast "Proveedor archivado"
```

El agente crea el script con `write_script` y lo conecta a un bloque de acción.
El código corre en el servidor, no en el browser. No aparece como archivo `.js`.

---

## Reglas de prompting

**Sé específico con los nombres.** El sistema es case-sensitive y snake_case.
Siempre di exactamente el nombre del schema, no un sinónimo.

✅ `"el schema proveedores"`
❌ `"los proveedores"` / `"la tabla de suppliers"`

---

**Describe lo que quieres ver, no cómo hacerlo.**
Tú eres el diseñador. El agente es el técnico.

✅ `"Quiero una pantalla donde pueda ver los espacios de un proyecto agrupados por variante"`
❌ `"Haz un useState con un array de variantes filtrado por cotizacion_id"`

---

**Si algo se rompe, no edites los JSON a mano.**
Los JSON son los huesos. Si los tocas sin el MCP bridge, el cuerpo colapsa en silencio.

```
Si algo no funciona → describe el problema al agente
                    → el agente diagnostica y usa el MCP bridge para corregir
```

---

**Cuando termines cambios de schema, pide esto:**
```
Regenera los tipos TypeScript del proyecto.
```
El agente corre `npm run agnostic:compile`. Los tipos quedan sincronizados.

---

## Flujo completo de ejemplo

Quieres una pantalla de gestión de materiales nueva:

```
1. "Crea un schema 'materiales' con campos nombre, unidad, precio_base, stock_minimo"
2. "Crea una ruta /materiales con tabla editable y formulario de alta"
3. "Regenera los tipos TypeScript"
4. (si necesitas algo más visual)
   "Crea un bloque custom 'materiales_dashboard' que muestre
    los materiales con stock por debajo del mínimo resaltados en rojo"
```

Cuatro líneas. Pantalla funcional. Sin tocar un JSON.

---

## Referencia rápida de schemas existentes

```
cotizaciones         — propuestas de proyecto
espacio_variantes    — espacios y variantes de materiales
items_variante       — ítems de material por variante
productos_catalogo   — catálogo maestro de insumos
clientes             — datos de clientes
cotizaciones_snapshot — historial inmutable de exportaciones
```

> Para ver todos los schemas activos: `list_schemas` en el MCP bridge,
> o abre el Config Manager en `http://localhost:3000/_agnostic`.
