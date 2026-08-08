# Plan: Arquitectura de destino — ERP + Sitio público en un solo repo Next.js

**ID de tarea:** t-005 (pre-diseño, precede a la creación de tareas por módulo)
**Fecha de creación:** 2026-07-31
**Estado:** pendiente de aprobación del Supervisor — no se escribe código de producto hasta que esto se apruebe.

---

## Objetivo

Definir, antes de escribir una sola línea de código de producto, cómo se organiza el repo nuevo, cómo funciona el login multiusuario (interno ERP + clientes externos, con rutas y destino post-login claros), cómo coexisten el sitio público con SEO y el ERP privado en la misma aplicación Next.js, y cómo se maneja la base de datos en desarrollo local sin mezclar mocks con producción — para que cada módulo que se construya después encaje en un plano ya decidido, no en una arquitectura que se inventa sobre la marcha módulo por módulo.

---

## 1. Organización de carpetas (dentro del worktree `dev`)

```text
empresa_muebles_clone-dev/
├── app/
│   ├── (publico)/                  ← grupo de rutas: sitio de marketing, SSG/ISR, SEO fuerte
│   │   ├── page.tsx                   home
│   │   ├── colecciones/               catálogo público
│   │   ├── portafolio/                casos reales (portfolio_publico)
│   │   ├── espacios/[categoria]/      landing pages (cocinas, closets, etc. — reemplaza "Espacios High-Design")
│   │   ├── agendar/                   captura de leads
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── (auth)/                     ← login, registro, recuperación — layout mínimo, sin nav de ERP
│   │   ├── login/
│   │   ├── registro/                  solo clientes (ver §2)
│   │   └── recuperar/
│   ├── cuenta/                     ← portal de CLIENTE autenticado (no confundir con /app/erp)
│   │   ├── page.tsx                   resumen: proyectos, contratos, próximos pagos
│   │   ├── proyectos/[id]/            detalle de su proyecto
│   │   └── perfil/
│   └── app/erp/                    ← ERP interno, protegido por rol de EMPLEADO
│       ├── layout.tsx                  valida sesión + rol, redirige si no corresponde
│       ├── comercial/
│       ├── cotizador/
│       ├── contratos/
│       ├── taller/
│       ├── finanzas/
│       ├── catalogo/
│       ├── calendario/
│       └── equipo/
├── lib/
│   ├── db/                         ← Drizzle: schema.ts, migrations/, client.ts (una sola conexión a la misma Neon)
│   ├── auth/                       ← sesión, roles, guards, post-login routing (ver §2)
│   ├── seo/                        ← generadores de metadata/JSON-LD reutilizables (ver §4)
│   └── modules/                    ← lógica de negocio pura por módulo (cotizador/, contratos/, produccion/...),
│                                       sin JSX, testeable sin levantar Next
├── components/
│   ├── ui/                         ← shadcn/ui, sin lógica de negocio
│   ├── publico/                    ← componentes exclusivos del sitio de marketing
│   └── erp/                        ← componentes exclusivos del ERP interno
└── arnes/                          ← este mismo arnés, viaja con el código
```

**Regla de fondo:** `(publico)` y `cuenta/` y `app/erp/` son tres superficies con modelos de autenticación y de renderizado distintos (estático/SEO vs. portal de cliente vs. ERP interno). No comparten layout raíz más allá de `<html>`/providers globales. Esto es exactamente lo que el motor legacy no distinguía — todo pasaba por el mismo `AgnosticShell`.

---

## 2. Autenticación y multiusuario (el "caos" actual, resuelto)

### 2.1 Dos poblaciones de usuario, nunca mezcladas

El inventario (t-002, namespace `usuarios_equipo` vs `clientes`) confirma que hoy ya son dos tablas distintas en los datos, pero el legacy nunca les dio un flujo de login diferenciado real. En el repo nuevo:

| Población | Tabla | Login | Registro | Post-login |
|---|---|---|---|---|
| Empleado (interno) | `usuarios` (roles: admin, comercial, taller, finanzas) | `/login` con email+password | **Nunca autoregistro.** Un admin crea la cuenta desde `app/erp/equipo` y el sistema manda invitación por email. | Redirige a `/app/erp` (dashboard por rol — ver 2.2) |
| Cliente (externo) | `clientes` | mismo formulario `/login`, detectado por dominio de cuenta | **Autoregistro habilitado en `/registro` — decisión confirmada.** Necesario para cuando la tienda web salga al aire: cualquier cliente debe poder crearse una cuenta y hacer un pedido sin que nadie del equipo intervenga manualmente. Se vincula a un registro `clientes` existente por documento/email si ya existía (proyecto previo hecho por comercial); si no hay match, se crea `clientes` nuevo directamente — sin marca de revisión pendiente, porque bloquear la creación de la cuenta contradice el propósito de la tienda (comprar sin fricción). | Redirige a `/cuenta` |

Por qué importa distinguir esto ahora: el legacy nunca tuvo pantalla de registro clara precisamente porque mezclaba conceptualmente "quién usa el sistema" (cualquiera con contraseña) con "quién es cliente" (un registro de datos). Separar la tabla de identidad (`usuarios`) de la tabla de negocio (`clientes`), con una FK opcional `usuarios.cliente_id`, resuelve la ambigüedad de raíz.

### 2.2 Destino post-login (lo que hoy no existe)

Una sola función `resolverDestinoPostLogin(usuario)` en `lib/auth/`:

```text
si usuario.tipo === 'cliente'          → /cuenta
si usuario.rol === 'admin'             → /app/erp  (dashboard general)
si usuario.rol === 'comercial'         → /app/erp/comercial
si usuario.rol === 'taller'            → /app/erp/taller
si usuario.rol === 'finanzas'          → /app/erp/finanzas
```

Se llama una sola vez, en el endpoint de login, no se re-decide en cada página. Cada `layout.tsx` bajo `app/erp/<modulo>` solo valida "¿tengo sesión y el rol correcto?" — no vuelve a decidir a dónde mandar a nadie.

### 2.3 Rutas del sitio y del ERP (corrección: esto NO es sobre domicilios de clientes)

*(Nota de corrección: una versión anterior de este plan interpretó "direcciones" como domicilios de clientes y proponía una tabla nueva. Error de lectura — el Supervisor se refería a las URLs/rutas del sitio y del ERP. `clientes.domicilio` y `proyectos.direccion_obra` quedan tal como están hoy, como campos de texto simples; no hace falta una tabla relacional para eso, solo llevarlos ordenados en el schema de `clientes`/`proyectos` del §3.)*

Convención de rutas:

- **Público (`(publico)`)**: rutas cortas, en español, sin prefijo técnico — `/colecciones`, `/portafolio`, `/espacios/cocinas`, `/agendar`. Son las que indexa Google; cambiar una de estas después de publicada implica un `redirect` permanente declarado en `next.config.ts`, nunca un 404 silencioso.
- **Cuenta de cliente (`/cuenta/*`)**: siempre bajo ese único prefijo, nunca mezclado con `/app/erp/*` aunque ambos requieran sesión — son dos guards de auth distintos (ver §2.2), y compartir prefijo invita a que alguien reutilice un componente o un layout que no debería cruzar esa frontera.
- **ERP interno (`/app/erp/*`)**: un segmento por módulo de negocio (`/app/erp/cotizador`, `/app/erp/contratos`, `/app/erp/taller`...), nombrado igual que la carpeta en `lib/modules/`. Si el nombre del módulo en el código y el segmento de la URL divergen, cuesta más navegar el repo sin razón real — se mantienen idénticos por convención, no por regla técnica forzada.
- **Nunca URLs generadas dinámicamente desde datos de configuración** (como hacía `page_routes.json` en el legacy, donde una ruta podía apuntar a rutas rotas tipo `"C:/Program Files/Git/tienda"` sin que nada lo validara en compilación). Las rutas del repo nuevo son archivos reales en `app/`, el propio `next build` falla si algo no cuadra — el chequeo de rutas rotas pasa a ser gratis, en vez de un problema de datos.

### 2.4 Sesión

Reusar el patrón `iron-session` que ya funciona en el legacy (`src/lib/agnostic/session.ts`, `sessionOptions`) — es simple, sin dependencias de infraestructura nueva, cookies firmadas. No hay razón para cambiarlo solo por cambiar; es de las pocas piezas del legacy que no aparece en la lista de "qué no repetir".

### 2.5 Separación de seguridad público ↔ ERP (el mecanismo real, no solo la carpeta)

Que `(publico)`, `cuenta/` y `app/erp/` sean carpetas distintas (§1) es organización — lo que de verdad impide que alguien entre a un módulo del ERP sin permiso es un **único `middleware.ts` en la raíz**, que corre en el edge antes de que cualquier página se renderice. Diseño concreto (parte de la base ya probada en el legacy, corregida donde importa):

```text
middleware.ts
├── /app/erp/*        → requiere sesión con tipo="empleado" + rol permitido para ese módulo.
│                         Sin sesión válida → redirect a /login?from=<ruta>.
│                         Con sesión de tipo="cliente" → 403, NO redirect (un cliente
│                         nunca debe ni enterarse de que /app/erp existe).
├── /api/erp/*        → mismo guard que /app/erp/*, pero responde 401 JSON en vez de redirect
│                         (son endpoints, no páginas).
├── /cuenta/*         → requiere sesión con tipo="cliente". Sin sesión → redirect a /login.
│                         Con sesión de tipo="empleado" → 403 (un empleado no opera como cliente
│                         desde ahí; si necesita ver la cuenta de un cliente, lo hace desde
│                         /app/erp/comercial con sus propios permisos, nunca "impersonando").
├── /api/pedidos, /api/cuenta/*  → mismo guard que /cuenta/*.
└── (publico)/*, /api/leads, /api/registro
                        → sin guard de sesión (son las únicas superficies que un visitante
                          anónimo puede tocar), pero con rate-limiting (ver abajo) porque
                          "público" en una tienda real significa "expuesto a bots", no
                          "confiable".
```

Diferencias deliberadas respecto al middleware que ya existe en el legacy (`src/middleware.ts`, que leí como parte de la Fase 0 — para ejecutar el zap corregido de Ciro Rincón):

- El legacy tiene un bypass `x-api-secret` (M2M) que aplica a **todas** las rutas protegidas por igual, incluida `/api/engine` sin ningún chequeo adicional de qué zap se está corriendo. Eso fue exactamente lo que usamos hoy para arreglar el contrato de Ciro Rincón — útil para un CLI/script gobernado, pero es una puerta ancha si algún día esa clave se filtra. En el repo nuevo, ese tipo de acceso "de máquina" se limita a rutas explícitas de administración (`/api/admin/*`), nunca a rutas que ya son de negocio (`/api/erp/*`, `/api/cuenta/*`) — la automatización interna no debería tener más alcance que un empleado real.
- El legacy no distingue "cliente autenticado pidiendo `/app/erp`" de "nadie autenticado pidiendo `/app/erp`" — ambos casos redirigen a `/login`. En el repo nuevo eso es un 403 explícito para un cliente autenticado (no un simple "no tenés sesión"), porque son dos situaciones distintas: una es "andá a loguearte", la otra es "esto no es para vos aunque sí tengas cuenta".
- **Rate limiting real en las rutas verdaderamente públicas** (`/api/leads`, `/api/registro`, y después `/api/pedidos` de checkout): esto no existía como necesidad seria cuando el sitio público era básicamente una landing de marketing. Con autoregistro + tienda con pedidos reales, `/registro` y el checkout pasan a ser superficie de ataque real (creación masiva de cuentas falsas, fuerza bruta de login). Se implementa con un middleware de rate-limit simple basado en IP + Neon (tabla `intentos_rate_limit` o un servicio como Upstash si se prefiere no tocar la base transaccional para esto) — decisión de implementación, no bloquea este plan, pero queda declarado como requisito desde ahora para que nadie lo "olvide para después".

---

## 3. Modelo de datos (Drizzle, misma Neon)

No se reescribe el inventario completo acá (ya está en `arnes/diagnostico/inventario_legacy.md`), pero los cambios de fondo respecto al legacy son:

1. **Tablas relacionales reales**, no un único `agnostic_records(id, namespace, data jsonb)`. Cada namespace del inventario (§2 de t-002) se vuelve una tabla Drizzle con columnas tipadas, FKs reales, `NOT NULL` donde corresponda.
2. **`hitos_pago` dejar de ser un array JSON suelto dentro de `contratos`** — pasa a ser su propia tabla `hitos_pago(id, contrato_id, tipo, monto_o_porcentaje, razon, orden)`. Esto elimina de raíz la clase de bug que debuggeamos hoy (un array-como-JSON-blob es exactamente lo que permitió que el estado se desincronizara sin que la base de datos lo notara).
3. **`usuarios` nueva**, separada de `clientes` (ver §2.1), con `usuarios_equipo` fusionándose ahí para los roles internos.
4. **Migración de datos real:** una vez aprobado este plan, se escribe un script de migración `usuarios_equipo` + `clientes` (con login) → `usuarios`, y `contratos.hitos_pago` (JSON) → filas de `hitos_pago` **solo para contratos nuevos que se generen desde el repo nuevo en adelante**. Los 6 contratos reales que hoy no tienen `hitos_pago` (hallazgo t-001) NO se tocan — ya están firmados, decisión del Supervisor de no modificar nada legal ya cerrado. Su fila en la tabla `hitos_pago` simplemente queda vacía, que es un estado válido (equivale al 50/25/25 estándar en el momento en que se firmaron). Todo corre contra la MISMA Neon, sin tocar las tablas legacy (`agnostic_records` queda intacta hasta el corte final, por si hay que volver atrás).

---

## 4. Sitio público + SEO

*(Aclaración directa: `generateMetadata` NO es una convención heredada de Agnostic Seed — es una API nativa de Next.js App Router, del framework mismo, sin relación con el motor genérico. En el legacy, cada página armaba sus propios `<meta>` a mano o ni los tenía; `generateMetadata` es simplemente la forma estándar de Next.js de declarar título/descripción/OG por página de forma tipada. No estoy arrastrando ninguna regla vieja acá — es la práctica por defecto de cualquier proyecto Next.js nuevo, legacy o no.)*

- **Metadata nativa de Next.js App Router**: `generateMetadata()` por página (title/description/OG dinámicos desde los datos reales del proyecto/producto), no meta tags hardcodeados.
- **`app/(publico)/sitemap.ts` y `robots.ts`** dinámicos generados desde `portfolio_publico` + `productos_catalogo` publicados — el legacy ya tenía `/sitemap.xml` y `/robots.txt` como rutas, se reconstruye igual pero con Drizzle en vez de leer JSON.
- **JSON-LD estructurado** en `lib/seo/`: `Organization` global (layout raíz), `LocalBusiness` en home, `Product`/`Service` en fichas de catálogo, `BreadcrumbList` en categorías — el legacy ya identificó esto como necesario (`current_state.md` lo menciona), se formaliza como módulo reutilizable en vez de HTML embebido zap por zap.
- **Renderizado**: páginas de `(publico)` usan ISR (`revalidate`) para catálogo/portafolio (cambian poco, deben ser rápidas y indexables) — nunca client-side fetching para contenido que Google necesita ver. El ERP (`app/erp/`) es 100% dinámico/autenticado, sin SEO ni ISR.
- **Imágenes**: `next/image` sobre las URLs de Cloudflare R2 existentes (mismo bucket, mismo `CF_R2_PUBLIC_URL`) con `remotePatterns` configurado — cero cambio de dónde viven los archivos.

---

## 5. Estrategia de datos en desarrollo local

Pediste algo mejor que "en local se ven solo los JSON", que evite mezclar mocks con producción. Propuesta: **rama de Neon dedicada a desarrollo**, no archivos JSON sueltos.

**Por qué no JSON puro (aunque es tentador por lo instantáneo):** el legacy ya demostró el problema — un archivo JSON de mock no tiene forma de garantizar que su forma coincida con el schema real. Cuando el schema cambia (una migración de Drizzle agrega una columna, una FK nueva), el JSON mock queda desactualizado en silencio y nadie se entera hasta que algo falla justo en producción. Es la misma clase de bug que "estado sin sincronizar", aplicado a datos en vez de a un componente de React.

**Propuesta: Neon branching** (la base de datos ya es Neon — esto no es infraestructura nueva, es una función nativa del mismo proveedor):

```text
Neon (mismo proyecto)
├── main            → producción real. Nadie desarrolla contra esto directamente.
└── dev-local        → rama de la base de datos (copy-on-write, instantánea, del mismo Neon),
                        con datos de mentira generados por un script de seed.
```

- `DATABASE_URL` en `.env.local` (de cada desarrollador) apunta a `dev-local`, nunca a producción.
- Un script `npm run db:seed` (Drizzle + datos ficticios realistas — nombres, proyectos, contratos de prueba) repuebla `dev-local` en segundos. Esto te da la misma sensación de "instantáneo" que editar un JSON, pero contra el schema REAL — si el seed falla, es porque el schema cambió y hay que actualizar el seed, exactamente la señal que el JSON mock nunca te daba.
- Resetear a un estado limpio es una operación de Neon (recrear la rama desde `main`, o desde un punto de restauración), no editar archivos a mano.
- Cero riesgo de que un desarrollador local escriba sobre datos reales de un cliente por accidente — es físicamente otra base de datos.

**Complemento, no sustituto:** si en algún punto se necesita iterar sobre un componente de UI sin levantar base de datos en absoluto (ej. Storybook, o un componente puramente visual), ahí sí tiene sentido un archivo de fixtures estático — pero es un caso puntual de UI aislada, no la estrategia general de "desarrollo local" del proyecto completo.

**Pendiente de confirmar:** que el plan de Neon que ya tienen contratado incluye branching (la mayoría de los planes de Neon lo incluyen, incluido el free tier con límites) — esto se verifica una sola vez, no requiere nada nuevo si ya está disponible.

---

## 6. Qué reemplaza al "diseñador" y a los comandos `agno.ts` (correcto: ambos desaparecen)

Confirmación explícita de lo que preguntaste: al no existir el motor Agnostic, desaparecen por completo:
- El diseñador visual (`DataBrowser.tsx`, `WorkspaceSwitcher.tsx`, listado de schemas/rutas) — era UI del motor, no del negocio.
- `page_routes.json` y el creador de rutas — las rutas vuelven a ser archivos reales de Next.js en `app/`.
- `create-schema` / `add-field` / `schema_definitions.json` — el schema vuelve a ser código (`lib/db/schema.ts`), no datos interpretados en runtime.
- `Comandos CLI.md` tal como existe hoy — es el manual de `agno.ts`, y `agno.ts` es 100% específico del motor que se está retirando. No tiene sentido "portarlo", porque casi todos sus comandos existían para gestionar un modelo de datos genérico que ya no va a existir.

Eso es correcto y esperado. La pregunta real es qué lo reemplaza, punto por punto:

| Lo que hacía `agno.ts` | Reemplazo en el repo nuevo |
|---|---|
| Ver qué schemas/campos existen (`schema <name>`, `ls`) | Leer `lib/db/schema.ts` directamente — es UN archivo, tipado, versionado en git. No hace falta un comando para "listarlo", es legible como cualquier archivo TypeScript. |
| Navegar/editar datos a mano (`records`, `create-record`, `update-record`) | **`npx drizzle-kit studio`** — herramienta real de Drizzle, navegador visual de la base de datos completo (tablas, filtros, edición), corriendo contra la misma Neon (o la rama `dev-local` de §5). Mejor que el `DataBrowser` genérico porque entiende el schema real, con tipos y relaciones, no un JSON arbitrario. |
| Crear/modificar schema (`create-schema`, `add-field`) | `drizzle-kit generate` + `drizzle-kit migrate` — migraciones SQL versionadas, reviewables en un PR, exactamente el mismo espíritu del ciclo `plan → dry → confirm → backup` que ya exigía `refactor-schema`, pero con la herramienta estándar de la industria en vez de una hecha a mano. |
| Renombrar un campo/namespace con seguridad (`refactor-schema plan/apply`) | Una migración de Drizzle normal (`ALTER TABLE ... RENAME COLUMN`) generada y revisada antes de aplicar — mismo nivel de gobernanza, sin herramienta custom. |
| Validar que los zaps referencian namespaces reales (`validate:zaps`) | El compilador de TypeScript. Si un módulo en `lib/modules/contratos/` referencia una tabla o columna que no existe, no compila — es una verificación más fuerte que la que hacía `validate:zaps` (esa solo detectaba el error si alguien corría el comando a mano). |
| Sincronizar un zap/template puntual a producción (`push-data`) | No existe como concepto — no hay "código como datos en la base" que sincronizar aparte. El código vive en git; desplegar (`main` actualizado) YA es la sincronización completa. Esto elimina exactamente la clase de bug que debuggeamos hoy (zap corregido en git, nunca sincronizado a Neon). |
| Generar documentación para agentes de IA (`docs all`) | Se mantiene como idea, sin depender de Agnostic: un script propio (`scripts/generar-contexto-ia.ts`) que lee `lib/db/schema.ts` + los archivos reales de `app/` y arma un resumen corto para que un agente se ubique rápido — la misma utilidad, sin el motor genérico detrás. |

### ¿Sigue siendo posible usar el ERP por línea de comandos?

Sí, pero con una diferencia importante: `agno.ts` era genérico (servía para *cualquier* schema que alguien inventara en runtime). El reemplazo es **específico del negocio real** (porque el schema ya no es dinámico, está fijo en código) — y eso es una mejora, no una pérdida:

- **`drizzle-kit studio`** cubre el 80% de lo que hoy se hace con `records`/`create-record`/`update-record` — inspección y edición ad-hoc de datos, sin escribir una línea de código.
- Para operaciones puntuales de negocio real (ej. "regenerar el PDF de un contrato desde la terminal", que fue literalmente lo que hicimos hoy a mano con un script improvisado) — se propone un **CLI propio y chico** (`scripts/erp-cli.ts`, con `commander` o similar) que llama a las MISMAS funciones de `lib/modules/contratos/` que usa la UI. Cero lógica duplicada: el CLI y la interfaz web ejecutan exactamente el mismo código de negocio, solo cambia la entrada (terminal vs. formulario).
- Este CLI nuevo se construye incrementalmente, comando por comando, según lo que realmente se necesite usar desde la terminal — no se intenta replicar los ~40 comandos de `agno.ts` de una sola vez, la mayoría de esos comandos existían para gestionar el motor genérico, no el negocio.

Consecuencia práctica para este mismo arnés: `Comandos CLI.md` deja de ser el manual operativo de este proyecto en cuanto se corte a `main`. Se reemplaza por un `Comandos CLI.md` nuevo y mucho más corto, documentando `drizzle-kit studio`, `drizzle-kit generate/migrate`, y los comandos reales que tenga `scripts/erp-cli.ts` — no antes de que ese CLI exista, para no documentar algo que todavía no se construyó.

### Navegación del ERP (confirmación de tu otra pregunta)

Correcto: sin el diseñador genérico, la navegación deja de ser "gratis" — tiene que ser real. Se resuelve con un único archivo `lib/erp-nav.ts`: un array TypeScript tipado (módulo, ícono, ruta, rol requerido) que alimenta tanto el sidebar del ERP como los breadcrumbs. Es la fuente de verdad de "qué módulos existen" — a diferencia de `page_routes.json`, si un módulo se agrega ahí sin que exista el archivo de ruta real, `next build` falla (no un 404 silencioso descubierto en producción).

### Configuración de Postgres — dónde vive y cómo se accede

No cambia de lugar: sigue en las variables de entorno de Vercel + `.env.local` (`DATABASE_URL`), exactamente como hoy. Lo que cambia es cómo se **usa** esa configuración para trabajar con la base de datos día a día — ya cubierto en la tabla de arriba (`drizzle-kit studio` para ver/editar, `drizzle-kit generate/migrate` para cambiar estructura). No hace falta una pantalla nueva de "configuración de base de datos" dentro del ERP — eso es tooling de desarrollo, no una feature que un usuario del negocio necesite tocar.

---

## Archivos afectados

- Ninguno de producto todavía. Este documento en sí: `arnes/planes/plan_arquitectura_destino.md` (crear).

## Qué NO incluye este plan

- No incluye: el desglose de tareas por módulo (eso viene después de aprobar esto, como t-006, t-007...).
- No incluye: el script de migración de datos real (se escribe y se corre solo tras aprobación, y solo contra una copia de verificación antes de tocar `usuarios`/`hitos_pago` reales).
- No incluye: decisión sobre los 12 puntos grises de la sección 5 del inventario — quedan para que el Supervisor los resuelva uno por uno, no bloquean este plan de arquitectura pero sí van a bloquear tareas específicas que dependan de ellos (ej. el módulo de calendario no arranca hasta saber cuál de las dos versiones es la real).

## Preguntas abiertas

Ninguna. Todo lo que estaba abierto quedó resuelto en esta revisión:
- Roles internos: admin/comercial/taller/finanzas, confirmados tal cual.
- Contratos ya firmados: no se tocan.
- Vercel Preview (`DATABASE_URL`/`CF_R2_*`): se activa cuando haga falta, no bloquea nada porque desarrollo local usa la rama de Neon (§5), no Preview.
- Autoregistro de clientes: **habilitado**, requisito directo de la tienda web (§2.1, §2.5).

## Aprobación del Plan

- **Revisor:** Javier (Supervisor)
- **Estado:** pendiente de tu confirmación explícita. Todas las preguntas abiertas quedaron resueltas — pero la aprobación para pasar de "plan" a "código" (desglosar en tareas por módulo y empezar `lib/db/schema.ts`) la das vos, no se asume.
