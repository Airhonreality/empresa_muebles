# Diseño Axiomático — Generador Paramétrico de Interfaces
**Método:** Axiomatic Design (Nam P. Suh, MIT, 1990)  
**Paradigma:** Minimalismo funcional / Vibe Code  
**Fecha:** 2026-05-16

---

## Teleología — ¿Qué hace este sistema?

Un generador paramétrico de interfaces hace **una sola cosa**:

> Transforma estructura en superficie.

"Estructura" es un esquema: una descripción de qué forma tienen los datos.  
"Superficie" es una interfaz: un formulario, una lista, una vista de detalle.  
El sistema no sabe de negocios. No sabe de muebles, clientes, ni proyectos.  
Solo sabe que si hay un campo `texto`, puede proyectar un `<input type="text">`.  
Si hay un campo `número`, proyecta un `<input type="number">`.  
Si hay una colección de registros, proyecta una lista.

**El sistema tiene un trabajo. Uno.**

---

## Los Axiomas de Suh aplicados

Suh propone dos axiomas para juzgar la calidad de un diseño:

**Axioma 1 — Independencia:** Cada Requerimiento Funcional (RF) debe ser satisfecho por exactamente un Parámetro de Diseño (PD). No puede haber acoplamiento entre RFs.

**Axioma 2 — Información:** De todos los diseños que satisfacen el Axioma 1, el mejor es el que minimiza el contenido de información (el más simple).

Aplicados al generador paramétrico:

```
RF-1: El usuario puede definir estructuras de datos (schemas)
RF-2: El usuario puede persistir y recuperar datos
RF-3: El sistema proyecta UI a partir de schemas
RF-4: El sistema orquesta operaciones externamente (CLI/MCP)
```

La condición de independencia exige que:
- Cambiar cómo se definen los schemas NO afecte la persistencia ni la UI
- Cambiar el backend de persistencia NO afecte los schemas ni la UI
- Cambiar el motor de UI NO afecte los schemas ni la persistencia
- El CLI/MCP pueda operar sin conocer detalles de implementación de ninguna de las capas anteriores

Si cualquier cambio en una capa rompe otra capa, el diseño viola el Axioma 1.  
Si el sistema tiene más partes de las necesarias para cumplir los 4 RFs, viola el Axioma 2.

---

## Los Cinco Átomos

Bajo este diseño axiomático, el sistema se compone de exactamente **cinco conceptos**. No más.

### Átomo 1 — Schema

Un schema es la descripción de la forma de un dato. Es un contrato.

```json
{
  "name": "projects",
  "fields": [
    { "key": "name", "type": "text", "required": true },
    { "key": "budget", "type": "number" },
    { "key": "client_id", "type": "relation", "target": "clients" }
  ]
}
```

Un schema no sabe dónde viven sus datos. No sabe cómo se proyecta su UI.  
Solo describe estructura. Es un sustantivo, no un verbo.

**Identidad de un schema:** su `name`. No hay IDs, no hay slugs.  
La colección de schemas vive en un namespace reservado: `schemas`.

### Átomo 2 — Record

Un record es una instancia de un schema. Un dato concreto.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "schema": "projects",
  "data": {
    "name": "Cocina Rodríguez",
    "budget": 4500000,
    "client_id": "otro-uuid"
  }
}
```

Un record tiene tres campos fijos: `id` (UUID v4, generado por el servidor), `schema` (qué forma tiene), y `data` (la materia).  
Nada más pertenece al record.

**Regla de identidad:** el `id` es inmutable. El servidor lo asigna. El cliente nunca lo genera.

### Átomo 3 — Adapter

El adapter es el único punto de contacto con la persistencia. Es una interfaz, no una implementación.

```typescript
interface Adapter {
  read(namespace: string): Promise<Record[]>
  write(namespace: string, record: Record): Promise<Record>
  remove(namespace: string, id: string): Promise<void>
}
```

**Eso es todo el contrato.** Tres operaciones. Un adapter que implementa estas tres operaciones puede ser:
- Un directorio de archivos JSON
- Una base de datos Supabase
- Un repositorio de GitHub
- Una base de datos en memoria para tests

El namespace es el nombre del contexto (`projects`, `clients`, `schemas`). El adapter decide qué significa ese namespace en su capa física (un archivo `.json`, una tabla SQL, una branch de git).

**Regla del adapter:** el adapter es el único lugar donde existe lógica de persistencia. Ninguna otra parte del sistema toca disco, red, o base de datos.

### Átomo 4 — Block

Un block es una directiva de proyección. Le dice al motor: "toma este schema y proyéctalo de esta manera".

```json
{ "type": "form",   "schema": "projects" }
{ "type": "list",   "schema": "projects" }
{ "type": "detail", "schema": "projects" }
```

El conjunto de tipos de block es **finito y pequeño**: `form`, `list`, `detail`.  
Nada más es un tipo de block. Los bloques custom son composiciones de estos tres.

Un block no tiene configuración compleja. Si necesitas mucha configuración para proyectar un campo de texto, el sistema está mal diseñado.

### Átomo 5 — Page

Una page es una lista ordenada de blocks, anclada a una URL.

```json
{
  "path": "/projects",
  "blocks": [
    { "type": "list", "schema": "projects" }
  ]
}
```

```json
{
  "path": "/projects/:id",
  "blocks": [
    { "type": "detail", "schema": "projects" },
    { "type": "list",   "schema": "clients", "filter": "client_id" }
  ]
}
```

Una page no sabe de rutas de Next.js, de React Router, ni de ningún framework. Es pura declaración. El router del framework la consume.

---

## El Protocolo Único — Flujo Canónico

```
DEFINE   →  Schema Registry (Átomo 1)
PERSIST  →  Adapter (Átomo 3)
PROJECT  →  Block Projector (Átomo 4 + 5)
```

El flujo completo de una operación del usuario:

```
1. El usuario navega a /projects
2. El sistema busca la Page con path="/projects"
3. La Page declara blocks: [{ type: "list", schema: "projects" }]
4. El projector pide al Adapter: read("projects")
5. El Adapter devuelve records[]
6. El projector lee el Schema "projects" para saber cómo renderizar las columnas
7. El block "list" pinta los registros
```

```
1. El usuario hace clic en "Crear"
2. El projector renderiza un block "form" vacío para schema "projects"
3. El usuario llena los campos
4. El projector envía al Adapter: write("projects", { data: {...} })
5. El Adapter genera un UUID, guarda el record, lo devuelve
6. El projector actualiza el estado local con el record guardado
```

Hay exactamente **un camino de datos**. No hay atajos, no hay bypass.

---

## Arquitectura en capas — El Diagrama Mínimo

```
┌─────────────────────────────────────────┐
│              SCHEMA REGISTRY            │
│         [ schema_1, schema_2, ... ]     │
│  Única fuente de verdad de la forma     │
└───────────────┬─────────────────────────┘
                │ schema (estructura)
     ┌──────────▼──────────┐   ┌─────────────────────┐
     │   BLOCK PROJECTOR   │   │      ADAPTER         │
     │                     │◄──┤  read / write / rm   │
     │  form | list |      │   │                      │
     │  detail             │   │  [JSON] [Supabase]   │
     │                     │   │  [GitHub] [Memory]   │
     └──────────┬──────────┘   └─────────────────────┘
                │ UI (superficie)
         ┌──────▼──────┐
         │   BROWSER   │
         └─────────────┘
```

La matriz de diseño (en notación de Suh) debe ser diagonal:

```
        DP-1(Schema)  DP-2(Adapter)  DP-3(Projector)  DP-4(CLI)
RF-1       X              0               0               0
RF-2       0              X               0               0
RF-3       X              X               X               0
RF-4       X              X               0               X
```

RF-3 es la única que usa Schema + Adapter + Projector juntos: necesita saber la forma (schema), los datos (adapter), y saber proyectar (projector). Esto es acoplamiento necesario — lo que Suh llama acoplamiento "funcional" permitido, no "parasitario".

---

## El MCP como primera clase

El MCP bridge no es una extensión del sistema. Es una **quinta interfaz al mismo Adapter**.

```
Browser    → HTTP → API Gateway → Adapter → Storage
CLI/MCP    →        Adapter     → Storage
Tests      →        Adapter     → Storage
```

El MCP solo necesita conocer tres comandos que mapean directamente al Adapter:

```
READ   namespace [filter?]     →  adapter.read(namespace, filter?)
WRITE  namespace payload       →  adapter.write(namespace, record)
REMOVE namespace id            →  adapter.remove(namespace, id)
```

Y dos comandos que operan sobre el Schema Registry:

```
SCHEMA LIST                    →  adapter.read("schemas")
SCHEMA CREATE name fields      →  adapter.write("schemas", schema)
```

El MCP no tiene lógica propia. Es un shell que traduce comandos a llamadas al Adapter.  
Puede correr sin servidor Next.js. Puede correr sin browser. Es solo un adaptador de protocolo (stdio → Adapter).

---

## El API Gateway — El Único Punto de Entrada

El sistema expone exactamente **un endpoint HTTP**:

```
POST /api
```

Con un discriminador de acción:

```json
{ "action": "READ",   "namespace": "projects" }
{ "action": "WRITE",  "namespace": "projects", "record": { "data": {...} } }
{ "action": "REMOVE", "namespace": "projects", "id": "uuid" }
```

No hay endpoints por entidad. No hay `/api/projects`, `/api/clients`, `/api/schemas`.  
Un solo gateway, un solo handler, un solo Adapter detrás.

---

## Lo que deliberadamente NO existe

Bajo el Axioma 2 (minimizar información), estos conceptos no tienen cabida en el sistema mínimo:

| Concepto excluido | Por qué |
|---|---|
| Concepto de "tenant" en el núcleo | Tenancy es configuración del Adapter (qué directorio leer), no del sistema |
| Sistema de validación con schemas JSON-Schema complejos | La validación básica (campo requerido) la cubre el schema. La validación de negocio va en el Adapter si es necesaria |
| Registro de capacidades (capability registry) | Los block types son fijos y conocidos. No necesitan registro |
| Middleware de normalización (canonicalize, compiler) | Si el Adapter devuelve un record bien formado, no hay nada que normalizar |
| Caché de estrategia con TTL | El Adapter es una instancia que ya está en memoria. No necesita caché |
| Passport de soberanía con validación de campos requeridos | La configuración del sistema es un archivo. Léelo. Si falta algo, lanza un error claro |
| Múltiples vocabularios de acción (WRITE/COMMIT, DELETE/PURGE) | Un solo verbo por operación, sin aliases |
| Sistema de UUID en cliente + fallback en servidor | El servidor asigna. Siempre. Fin |

---

## La Regla de Oro del Vibe Code

> El sistema debe ser tan simple que al leer su código fuente, un desarrollador nuevo entienda la arquitectura completa en menos de 30 minutos.

Si no se puede leer el sistema completo en media hora, tiene demasiadas partes.  
Si tienes dudas sobre dónde poner algo nuevo, el diseño tiene un agujero.  
Si tienes que escribir un documento de 500 líneas para explicar cómo arrancar, el sistema es demasiado complejo.

El test de simplicidad: **¿puedo agregar un nuevo schema y que la UI aparezca sin tocar ningún archivo de código?**  
Si la respuesta es sí, el sistema está bien diseñado.

---

## MVP Mínimo — Qué necesita existir para funcionar

```
src/
├── schema/           ← Schema Registry + tipos
│   └── index.ts      ← Schema interface + validación básica
├── adapter/          ← El contrato + implementaciones
│   ├── adapter.ts    ← interface Adapter { read, write, remove }
│   └── json.ts       ← JsonAdapter (lee/escribe archivos .json)
├── projector/        ← El motor de UI
│   ├── form.tsx      ← <FormBlock schema record? />
│   ├── list.tsx      ← <ListBlock schema records />
│   └── detail.tsx    ← <DetailBlock schema record />
├── router/           ← El despachador de pages
│   └── index.ts      ← Busca page por path → renderiza blocks
└── api/              ← El gateway único
    └── route.ts      ← POST /api → Adapter

storage/              ← Los datos (fuera del código)
└── db/
    ├── schemas.json  ← Los schemas del usuario
    ├── pages.json    ← Las pages del usuario
    └── *.json        ← Una colección por entidad
```

**Cuenta de archivos de sistema: 8.**  
Si tu sistema tiene 80 archivos de infraestructura, tiene 72 archivos de entropía.

---

## Coda — La Pregunta Axiómatica

Antes de agregar cualquier parte nueva al sistema, hazte esta pregunta:

> ¿A qué Requerimiento Funcional sirve esto? ¿Solo a ese?

Si sirve a más de uno, estás creando acoplamiento.  
Si no sirve a ninguno, estás creando burocracia.

El generador paramétrico de interfaces es simple porque su problema es simple.  
La complejidad es siempre un error de diseño, nunca un tributo a la sofisticación.
