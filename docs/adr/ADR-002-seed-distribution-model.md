# ADR-002 — Modelo de Distribución: Seed Repo, no Plataforma Multi-Tenant

**Fecha:** 2026-05-27  
**Estado:** Activo  
**Supersede:** ADR-001-HYBRID-RENDERING-ENGINE (v1, archivado)  
**Autores:** Agnostic Seed team  

---

## Contexto

El sistema fue concebido inicialmente como una plataforma multi-tenant donde `storage/{tenant}/` aislaba proyectos dentro de una sola instancia. Esto introdujo complejidad sin beneficio real: no había clientes diferentes compartiendo la instancia, solo un proyecto por despliegue.

Simultáneamente, el objetivo de "diseñador visual sin código" resultó desproporcionado en esfuerzo frente a su valor. El usuario final real no es un no-code user sino un **developer o AI asistida** que construye interfaces con código sobre una estructura estable.

## Decisión

Este repositorio es un **seed** (semilla), no una plataforma SaaS.

Cada proyecto que use Agnostic Seed es una **copia/fork** del repo semilla. El engine se actualiza en la semilla; los proyectos derivados aplican actualizaciones deliberadamente.

## Las Tres Capas — Fronteras Físicas

```
agnostic-seed/
├── packages/          ← CAPA ENGINE (no tocar en proyectos derivados)
│   └── core/
│       └── src/
│           ├── indra.ts      → tipos canónicos
│           ├── config.ts     → defineConfig
│           └── public.ts     → API surface (todo lo que exporta el engine)
│
├── src/               ← CAPA PROYECTO (fork libre, IA genera aquí)
│   ├── app/           → páginas, layouts, rutas custom
│   ├── components/
│   │   └── specialized/   → componentes custom generados con IA
│   └── generated/     → AUTO-GENERADO por agnostic:compile, NO editar
│       └── agnostic-schemas.ts
│
├── storage/           ← CAPA DATOS (Config Manager escribe aquí)
│   └── {project}/
│       └── db/
│           ├── schemas.json      → definiciones de schemas
│           ├── page_routes.json  → rutas y bloques
│           ├── scripts.json      → zaps/automatizaciones
│           └── {entity}.json     → datos por colección
│
└── agnostic.config.ts  ← BRIDGE (único punto de unión engine ↔ proyecto)
```

| Capa | Owner | Recibe updates del engine |
|------|-------|--------------------------|
| `packages/` | Agnostic team | Sí — es el engine |
| `src/` | Developer / AI | No — es tu proyecto |
| `storage/` | Config Manager / tú | No — son tus datos |

## El Contrato de Update

Cuando el engine lanza una nueva feature (ej. soporte de emails):

```bash
# El proyecto derivado decide cuándo y si aplicar el update
git pull upstream main   # trae cambios de packages/ solamente

# packages/ cambia → tu src/ y storage/ permanecen intactos
# Único contrato que el engine debe mantener: retrocompatibilidad
# con el formato de storage/db/*.json
```

## Schemas son Append-Only

Los schemas en `storage/db/schemas.json` son **append-only por defecto**. El Config Manager no permite borrar un schema si hay bloques en `page_routes.json` que lo referencian.

**Por qué:** si un schema se borra, el código custom en `src/components/specialized/` que importa `import type { MiSchema } from '@/generated/agnostic-schemas'` rompe en compilación. La IA generó ese código; el desarrollador debe revisarlo antes de eliminar el schema.

**El flujo correcto para "eliminar" un schema:**
1. Archivar los registros (marcar `archived: true` en los datos)
2. Remover los bloques que lo usan de `page_routes.json`
3. Deprecar el tipo en `agnostic-schemas.ts` con un comentario `@deprecated`
4. En el siguiente ciclo de limpieza: borrar el schema y el componente custom juntos

## El Rol del Config Manager

El Config Manager (ruta `/_agnostic`) es parte del engine. Es la UI mínima y suficiente para:

- Crear y editar schemas (campos, tipos, relaciones)
- Crear y editar rutas y bloques (qué se muestra en cada URL)
- Crear y editar scripts (automatizaciones/zaps)
- Disparar `agnostic:compile` (regenerar tipos TypeScript desde schemas)

**No es** un diseñador visual de interfaces. Para interfaces custom, se usa IA + código.

## El Modelo de Usuario

```
Config Manager (/_agnostic)
├── Define schemas → datos estructurados
├── Define rutas → vistas estándar automáticas (sheet, form, collection)
└── Define scripts → automatizaciones (enviar email, generar PDF, etc.)

IA asistida (AgnoChat / IDE Agent)
├── Lee src/generated/agnostic-schemas.ts (contexto tipado)
├── Lee agnostic.config.ts (cómo registrar)
├── Lee src/components/specialized/_TEMPLATE.tsx (patrón)
└── Genera src/components/specialized/MiComponente.tsx

Developer
└── Registra el componente en agnostic.config.ts
    └── Cambia block.type en page_routes.json
```

## Consecuencias

**Positivas:**
- Multi-tenancy eliminado → cero complejidad de aislamiento de datos
- El engine puede evolucionar sin romper proyectos derivados
- Cada proyecto tiene libertad total en `src/` sin restricciones arquitecturales
- La IA tiene un contrato estable (tipos generados) para generar código correcto

**Negativas:**
- No hay "actualización automática" de proyectos derivados — es intencional
- Cada proyecto derivado es responsable de sus propios updates del engine
- Los schemas append-only pueden acumular deuda si no se curan regularmente

## Lo que esto NO es

- No es un SaaS multi-tenant
- No es un no-code builder (requiere código para UI custom)
- No es un ORM ni reemplaza una base de datos real
- No es un framework con CLI generador (todavía — puede llegar en v4)
