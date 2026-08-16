# Diamante — D-08b: modelo de datos/roles para login interno (Persona/Proveedor)

**Fecha:** 2026-08-10 · **Estado:** SOLO DISEÑO, NO EJECUTAR — decisión explícita de Javier (2026-08-10): este ciclo diseña el modelo, no construye sesión/credenciales/UI. Nada de este documento se implementa sin un plan de ejecución aparte + checkpoint del Supervisor (toca `lib/auth/`, fuera de lo que un lote autónomo puede tocar). · **Origen:** `backlog_auditoria_pantallas.md` D-08b, bloqueado desde el diamante original de Perfil Persona/Proveedor (`diseno_perfil_persona_proveedor.md`).

---

## 1. Goal

Hoy `store.auth.usuarioActual()` devuelve un `UsuarioMock` fijo (personal interno: admin/comercial/desarrollador/compras/taller/finanzas/supervisora_qa). No existe ningún mecanismo para que una `Persona` (empleado) o un `Proveedor` inicien sesión y vean/editen únicamente su propio perfil (`/erp/equipo/[personaId]`, `/erp/compras/proveedores/[proveedorId]`) — D-08a construyó esas pantallas solo para la vista de gerente (acceso total, sin restricción por identidad).

## 2. Verificación de computabilidad / reuso (antes de diseñar, no después)

**No hay que inventar el mecanismo de sesión — ya existe uno real y aprobado para exactamente este mismo problema:** el portal cliente (F-07, `lib/auth/session.ts`) ya resuelve "una parte externa inicia sesión y solo ve su propio recorte de datos" — iron-session sin estado en servidor, cookie cifrada con `SESSION_SECRET`, login por `email + documento` (sin hash — decisión ya tomada por el Supervisor 2026-08-09: "prototipo de acceso, no producción real"), guard reutilizable `requireSesionCliente()`. D-08b es el mismo problema (`Persona`/`Proveedor` en vez de `Cliente`), no uno nuevo. Diseñar un mecanismo distinto sería la misma violación de Axioma 1 que ya se corrigió en D-09c (dos vías para el mismo requisito funcional, con garantías distintas).

## 3. Descomposición FR-DP

```
FR0: Una Persona o un Proveedor inicia sesión y solo ve/edita su propio perfil.

├─ FR1: Identificar qué Persona/Proveedor corresponde a esta sesión.
│   └─ DP1: extender SessionData (lib/auth/session.ts) — no reemplazarla, agregar campos nuevos
│          junto a clienteId (ya nullable), mismo patrón:
│          interface SessionData { clienteId: string | null; personaId: string | null; proveedorId: string | null }
│          Una sesión nunca tiene más de uno de los tres campos no-null (cliente XOR persona XOR
│          proveedor) — son 3 tipos de acceso externo distintos, no roles combinables.
│
├─ FR2: Autenticar sin inventar un mecanismo nuevo.
│   └─ DP2: reusar login(email, documento) tal cual, aplicado a Persona/Proveedor en vez de
│          Cliente — ambos tipos ya tienen email (Persona.email desde D-08a) y un identificador
│          análogo a "documento" (Persona.documento ya existe; Proveedor.nit cumple el mismo rol).
│          Dos funciones nuevas espejo de login(): loginPersona(email, documento),
│          loginProveedor(email, nit) — mismo cuerpo, misma falta de hash (ya aceptado como
│          prototipo, no se sube el estándar de seguridad a mitad de camino).
│
└─ FR3: Restringir cada pantalla de perfil a "solo lo mío".
    └─ DP3: guard nuevo requireSesionPersona()/requireSesionProveedor() (mismo patrón que
           requireSesionCliente()), llamado al inicio de cada Server Component de
           app/erp/equipo/[personaId]/page.tsx y app/erp/compras/proveedores/[proveedorId]/page.tsx
           — SOLO si el acceso viene de fuera del ERP (URL pública tipo /mi-perfil/[..], no la ruta
           interna actual). El acceso de gerente (D-08a, sin restricción) sigue existiendo tal cual
           en las rutas /erp/**: son dos superficies distintas para el mismo dato, no una migración.
```

**Por qué son rutas separadas, no la misma ruta con dos guards (decisión de diseño, no solo de datos):** `/erp/equipo/[personaId]` vive detrás de `ErpShell`/`erp-sidebar.tsx` — implícitamente "esto es para staff". Mezclar ahí un guard de autogestión externa confundiría la superficie (¿un empleado logueado ve el sidebar completo del ERP?). Precedente ya existente en este mismo repo: el portal cliente vive en `/cuenta/**`, completamente separado de `/erp/**`, con su propio `AppShell`. D-08b debería seguir ese mismo patrón — una superficie nueva (ej. `/mi-perfil` para persona, algo equivalente para proveedor), no una bifurcación de la pantalla de gerente.

## 4. Cambios de schema (`lib/data/contracts.ts`, propuesta — no aplicar todavía)

No se agrega ninguna tabla de "credenciales" nueva — mismo principio que el portal cliente (sin password, sin hash, email+documento/nit contra datos que ya existen). Cambios mínimos:

| Cambio | Justificación |
|---|---|
| `SessionData.personaId: string \| null` | DP1 |
| `SessionData.proveedorId: string \| null` | DP1 |
| Ninguno en `Persona`/`Proveedor` | `email`, `documento`, `nit` ya existen (D-08a) — nada que agregar para habilitar el login en sí |

## 5. Explícitamente fuera de este documento (decisiones que sí necesitan a Javier antes de construir)

- **¿Cuándo se construye esto?** No hay urgencia de negocio declarada — nadie pidió que empleados/proveedores se autogestionen todavía. Este documento deja el terreno listo, no dispara la construcción.
- **¿Personas y Proveedores editan algo además de ver, o es de solo lectura?** D-08a (vista gerente) sí permite editar datos de contacto de Persona. Autogestión ¿hereda el mismo permiso de edición sobre sí mismo, o es de solo lectura hasta que se decida lo contrario?
- **¿El login de Proveedor tiene sentido si un proveedor es una empresa, no una persona?** `Proveedor.email`/`nit` son de la empresa, no de un individuo — ¿inicia sesión "el proveedor" (una sola cuenta compartida) o hace falta un concepto de "contacto del proveedor" que no existe hoy?

## 6. Checklist de propagación (si Javier aprueba construir, en un plan aparte)

- [ ] `lib/auth/session.ts` — `SessionData` + `loginPersona`/`loginProveedor` + guards nuevos
- [ ] Superficie nueva de rutas (fuera de `/erp/**`), con su propio shell — no reutilizar `ErpShell`
- [ ] `arnes/tareas/` — registrar como mutación de `lib/auth/` con checkpoint del Supervisor (AGENTS.md: fuera de lo que un lote autónomo puede tocar)
