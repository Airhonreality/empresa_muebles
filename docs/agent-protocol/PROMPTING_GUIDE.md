# Protocolo de Prompting — Agnostic System

## Activar el agente

Abre AgnoChat (`/_agnostic` → ícono de chat).
El agente ya tiene las reglas cargadas. No necesitas configurar nada.

Para ejecutar comandos en la máquina, AgnoChat habla directamente con el MCP bridge:
```
npm run mcp:bridge   ← debe estar corriendo en otra terminal
```

---

## Los 4 patrones

### 1. Nueva entidad
```
Crea un schema "proveedores" con campos:
nombre (texto), nit (texto), categoria (select: madera/herraje/tapicería)
```
→ AgnoChat ejecuta: `create-schema` → `commit --force`

### 2. Nueva página
```
Agrega una ruta /proveedores con tabla editable y formulario de alta
```
→ AgnoChat ejecuta: `create-route` → `add-block` × 2 → `commit --force`

### 3. Pantalla custom
```
Crea un bloque especializado "proveedor_card" para el schema proveedores.
Tarjetas con nombre grande, categoría como badge de color.
```
→ AgnoChat genera `src/components/specialized/ProveedorCard.tsx`
→ Registra en `agnostic.config.ts` → actualiza la ruta

### 4. Automatización (botón con lógica)
```
El botón "Archivar" debe poner activo=false y mostrar un toast
```
→ AgnoChat ejecuta: `write-script archivar_proveedor` → `add-block /ruta action`

---

## Reglas para el prompt

- **Nombra exactamente.** `"el schema proveedores"` no `"los suppliers"`.
- **Describe qué ves, no cómo se hace.** Tú diseñas, el agente codifica.
- **Nunca edites `storage/*.json` a mano.** Si algo se rompe, díselo al agente.
- Después de cambios de schema: `"Regenera los tipos TypeScript"` → `agnostic:compile`.

---

## Si algo no funciona

```
Describe el problema → el agente diagnóstica → usa los comandos del bridge
```
No toques los JSON. El hook de pre-commit bloqueará commits inválidos de todas formas.
