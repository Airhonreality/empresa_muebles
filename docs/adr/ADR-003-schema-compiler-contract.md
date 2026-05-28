# ADR-003 — El Compilador de Schemas como Contrato Estable

**Fecha:** 2026-05-27  
**Estado:** Activo  
**Depende de:** ADR-001, ADR-002  
**Autores:** Agnostic Seed team  

---

## Contexto

Los schemas se definen en `storage/db/schemas.json` como JSON. El código custom del proyecto (componentes en `src/components/specialized/`) necesita consumir esos schemas de forma type-safe. Sin tipado, la IA genera código incorrecto o se inventa nombres de campos.

El problema: los schemas son dinámicos (el usuario los define en el Config Manager) pero el código TypeScript necesita tipos estáticos en tiempo de compilación.

## Decisión

Un script de compilación lee `storage/db/schemas.json` y genera `src/generated/agnostic-schemas.ts`. Este archivo generado es **el único punto de importación de tipos de schema** para el código custom del proyecto.

## El Flujo Completo

```
storage/db/schemas.json          ← fuente de verdad (Config Manager escribe aquí)
        │
        ▼  npm run agnostic:compile
src/generated/agnostic-schemas.ts  ← contrato tipado (nunca editar manualmente)
        │
        ├──► IA recibe como contexto → genera componentes correctamente tipados
        │
        └──► src/components/specialized/*.tsx importan desde aquí
```

## Qué genera el compilador

Para cada schema en `schemas.json`, el compilador produce:

```typescript
// Ejemplo: schema { name: "clientes", fields: [{key: "nombre", type: "text", required: true}, ...] }

export interface Cliente {
  nombre: string        // required → sin ?
  email?: string        // opcional → con ?
  telefono?: string
}

export type ClienteRecord = DataItem<Cliente>
// donde DataItem<T> = { id: string, context: string, data: T }
```

Y al final del archivo, el mapa global que la IA necesita:

```typescript
export interface AgnosticSchemas {
  clientes: Cliente
  cotizaciones: Cotizacion
  productos: Producto
  // un entry por cada schema del proyecto
}

export type SchemaName = keyof AgnosticSchemas
// = 'clientes' | 'cotizaciones' | 'productos'
```

## El Archivo Generado se Commitea al Repo

`src/generated/agnostic-schemas.ts` **se commitea** (no está en .gitignore).

**Por qué:** la IA en el IDE (GitHub Copilot, Claude, Cursor) lo lee sin necesidad de correr `agnostic:compile`. El archivo commiteado es el contexto que la IA usa para generar código correcto. Sin él, la IA no conoce los schemas y genera tipos `any` o se inventa campos.

**El desarrollador es responsable de** correr `npm run agnostic:compile` cada vez que modifica schemas en el Config Manager y commitear el archivo actualizado.

## Cuándo correr el compilador

```bash
npm run agnostic:compile   # explícitamente al modificar schemas

# El script también corre automáticamente en:
npm run dev    # antes de levantar el servidor de desarrollo
npm run build  # antes del build de producción
```

## Cómo la IA usa este contrato

El contexto mínimo para que la IA genere un componente correcto:

```
Archivos de contexto:
  1. src/generated/agnostic-schemas.ts    → "qué campos tienen los schemas"
  2. agnostic.config.ts                   → "cómo registrar el bloque"
  3. src/components/specialized/_TEMPLATE.tsx  → "cuál es el patrón"

Prompt:
  "Crea un componente CotizadorDashboard para el schema 'cotizaciones'.
   Debe mostrar una tabla con las cotizaciones y un botón para exportar PDF
   usando el zap 'exportar_cotizacion'."

La IA genera:
  src/components/specialized/CotizadorDashboard.tsx
  - Importa CotizacionRecord desde '@/generated/agnostic-schemas'
  - Usa BlockProps del engine
  - Fetcha datos via /api/vault?namespace=cotizaciones
  - TypeScript correcto, sin tipos any, sin campos inventados
```

## Contrato de retrocompatibilidad del engine

El engine garantiza:

1. El formato de `storage/db/schemas.json` tiene una versión explícita (`schema_format_version`)
2. El compilador acepta todas las versiones anteriores del formato
3. Un campo nuevo en el formato es siempre aditivo (no rompe compiladores viejos)
4. Si el formato cambia de forma breaking, la versión mayor del engine incrementa

## Anti-patrones prohibidos

```typescript
// FORBIDDEN: hardcodear tipos de schema en src/ sin importar del generado
interface Cliente { nombre: string }   // en cualquier archivo de src/
// → siempre importar desde '@/generated/agnostic-schemas'

// FORBIDDEN: editar src/generated/agnostic-schemas.ts manualmente
// → el archivo se sobreescribe en cada npm run agnostic:compile

// FORBIDDEN: importar de rutas internas del engine para tipos de schema
import type { Schema } from '../../packages/core/src/indra'  // para modelar datos del proyecto
// → los tipos de indra.ts son del engine, no del proyecto

// FORBIDDEN: asumir que un campo existe sin verificar el archivo generado
r.data.campo_que_me_invente   // TypeScript debe atrapar esto en compilación
```

## Consecuencias

**Positivas:**
- La IA siempre tiene tipos correctos → cero campos inventados
- TypeScript atrapa errores cuando los schemas cambian
- El contrato entre el Config Manager y el código custom es explícito y verificable
- `npx tsc --noEmit` valida que el código custom es compatible con los schemas actuales

**Negativas:**
- El desarrollador debe correr `agnostic:compile` después de cada cambio de schema
- Si el compilador no se corre, `src/generated/` queda desincronizado
- El archivo generado puede causar diff noise en PRs si los schemas cambian frecuentemente
  (mitigación: commitear solo cuando los schemas estabilicen, no en cada iteración)
