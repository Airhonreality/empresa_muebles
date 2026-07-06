# Contrato de lane: goal/webstore-clientes

> Subsistema de usuarios cliente: cuentas con rol `cliente` ligadas al schema `clientes`,
> y portal público `/cuenta` donde el cliente sigue sus proyectos activos (y luego sus
> pedidos, que conecta la lane de checkout).

<!-- lane-surface: storage/db/** | src/components/specialized/cuenta/** | src/components/specialized/clientes/** | agnostic.config.ts | src/generated/** | src/app/api/auth/register/** | storage/progreso/lanes/goal-webstore-clientes.md -->

## Identidad
- **Rama:** `goal/webstore-clientes`
- **Worktree:** `git worktree add ../wt-webstore-clientes -b goal/webstore-clientes`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-05, ronda web-store)

## Goal (teleología)
Un cliente con cuenta inicia sesión en `/cuenta` y ve SOLO sus proyectos con su estado del
ciclo comercial en una línea de tiempo amable. El ERP puede crear el acceso web de un
cliente desde su ficha.

## Verdad de terreno (no re-investigar)
- Logins viven en `storage/db/users.json` (namespace `users`, `SYSTEM_NS.USERS`).
  `EmailPasswordStrategy` (`src/lib/agnostic/auth/`) compara `data.email` +
  `data.password_hash` (helpers en `src/lib/agnostic/auth/password.ts`) y deriva
  `role = type.includes('admin') ? 'admin' : type[0]` desde `data.type: string[]`.
  → Un cliente = record en `users` con `type: ['cliente']` y `data.cliente_id` apuntando
  al schema `clientes`.
- Sesión: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`; client-side
  `src/context/AuthContext.tsx` (`useAuth()`).
- Estados de `proyectos.estado` (snake_case, canon en
  `storage/fork_doc/MATRIZ_ESTADOS.md`): activa, enviada, en_contrato, pre_produccion,
  produccion, entregado, perdida, cancelada.
- Los zaps corren server-side vía POST `/api/engine` `{zap, payload}` — sandbox SIN
  fetch/fs/process/crypto. El hash de password NO puede hacerse en un zap.
- Mocks: convención `ESTRATEGIA_DATOS_LOCAL_VS_PROD.md`, lote `webstore_r2`.

## Superficie (y SOLO esta)
- `storage/db/**` (ruta `/cuenta`, zap de consulta, mocks de users cliente)
- `src/components/specialized/cuenta/**` (portal público, nuevo)
- `src/components/specialized/clientes/**` (widget ERP "crear acceso web", nuevo)
- `src/app/api/auth/register/**` (nuevo, ÚNICO toque de engine permitido — ver tarea 2)
- `agnostic.config.ts`, `src/generated/**`

## Fuera de alcance
- NO tocar pedidos/checkout (la sección "Mis pedidos" queda como placeholder con
  `data-pedidos-slot` para la lane de pagos).
- NO tocar EmailPasswordStrategy ni AuthContext (solo consumirlos).

## Depende de / bloquea a
- Depende de: `goal/webstore-data-mocks` (clientes/proyectos mock).
- Bloquea a: `goal/webstore-checkout-pagos` (usa la cuenta cliente).

## DAG de tareas (cada una con DoD ejecutable)
1. **Zap `consultar_portal_cliente`.** Payload `{cliente_id}`. Devuelve SOLO campos
   seguros: proyectos del cliente (`nombre_proyecto`, `estado`, `dias_entrega_estimados`,
   `barrio` si existe) — nunca costos internos, descuentos ni dirección exacta. Registrar
   vía `agno script write`.
   DoD: POST `/api/engine` con un cliente mock devuelve sus proyectos y NO contiene
   `costos_operativos` ni `descuento_comercial` (curl + grep documentado).
2. **Endpoint `POST /api/auth/register`** (`src/app/api/auth/register/route.ts`) —
   dominio-agnóstico y mínimo: recibe `{email, password, name, invite?}`, valida email
   único contra `users`, hashea con los helpers de `password.ts`, escribe record en
   `users` con `type: ['cliente']` (whitelist DURA: este endpoint jamás crea admin/otros
   tipos) y `data.cliente_id` si viene un invite válido. Rate-limit simple en memoria.
   Este es un toque de engine consciente y acotado: queda marcado para auditoría del
   Orquestador. Si encuentras un endpoint de registro ya existente, ÚSALO y no crees otro
   (PÁRATE y documenta si difiere).
   DoD: curl al endpoint crea user con `type:['cliente']` y login posterior devuelve
   sesión con `role: 'cliente'`; intento de crear `type:['admin']` es rechazado.
3. **Portal `/cuenta`** — bloque `VetaCuenta.tsx` (`src/components/specialized/cuenta/`),
   ruta pública en `page_routes.json`, registrado en `agnostic.config.ts`:
   - sin sesión: login (email+password vía `useAuth()`) y registro (llama tarea 2);
   - con sesión rol `cliente`: saludo, "Mis proyectos" con timeline de estado (mapea el
     canon snake_case a etiquetas amables: pre_produccion → "Preparando tu proyecto",
     produccion → "En fabricación", entregado → "Entregado", etc.), datos vía zap tarea 1;
   - sección "Mis pedidos" placeholder (`data-pedidos-slot`);
   - logout. Si el user logueado es admin/equipo, mostrar aviso y link al ERP en vez del
     portal.
   DoD: curl `/cuenta` → 200; flujo manual documentado: registro → login → ve proyectos
   del cliente mock ligado.
4. **Widget ERP "Acceso web del cliente"** (`src/components/specialized/clientes/
   ClienteAccesoWeb.tsx`): dado un `clientes.id`, muestra si existe user ligado
   (`data.cliente_id`) y permite crear el acceso (genera password temporal, llama al
   endpoint de registro con invite=cliente_id, muestra la credencial UNA vez). Integrarlo
   donde ya se administren clientes (si no hay pantalla clara, exponerlo como bloque
   registrado y documentar dónde montarlo).
   DoD: tsc verde + flujo manual documentado.
5. **Mocks**: 1 user cliente (`type:['cliente']`, ligado a un cliente mock con proyectos),
   password conocida SOLO mock (documentarla en el contrato), lote `webstore_r2`.
   DoD: login con ese user vía curl devuelve sesión rol cliente.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-clientes` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-clientes --contract storage/progreso/lanes/goal-webstore-clientes.md` → PASS
- [ ] Matriz completa

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | zap sin campos sensibles | curl /api/engine + grep | sin costos internos | | |
| V2 | register whitelist | curl intentando admin | rechazado | | |
| V3 | login cliente mock | curl /api/auth/login | role cliente | | |
| V4 | /cuenta responde | curl /cuenta | 200 | | |
| V5 | en superficie | lane-qa.mjs | PASS | | |
| V6 | gates | validate + tsc | verdes | | |

## Handoff
Al cerrar, el Orquestador corre QA mecánico, audita (con foco extra en el toque de engine
`/api/auth/register`) e integra a `dev` con `--no-ff`.
