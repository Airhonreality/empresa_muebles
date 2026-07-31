# Plan: Arquitectura de destino — ERP + Sitio público en un solo repo Next.js

**ID de tarea:** t-005 (pre-diseño, precede a la creación de tareas por módulo)
**Fecha de creación:** 2026-07-31
**Estado:** pendiente de aprobación del Supervisor — no se escribe código de producto hasta que esto se apruebe.

---

## Objetivo

Definir, antes de escribir una sola línea de código de producto, cómo se organiza el repo nuevo, cómo funciona el login multiusuario (interno ERP + clientes externos, con direcciones y destino post-login claros), y cómo coexisten el sitio público con SEO y el ERP privado en la misma aplicación Next.js — para que cada módulo que se construya después encaje en un plano ya decidido, no en una arquitectura que se inventa sobre la marcha módulo por módulo.

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
│   │   ├── direcciones/               gestión de direcciones (ver §2.3)
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
| Cliente (externo) | `clientes` | mismo formulario `/login`, detectado por dominio de cuenta | Autoregistro permitido en `/registro`, pero se **vincula** a un registro `clientes` existente (match por documento/email) en vez de crear uno huérfano — si no hay match, se crea `clientes` nuevo y se marca `origen: 'autoregistro'` para que comercial lo revise | Redirige a `/cuenta` |

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

### 2.3 Direcciones (hoy: campos de texto sueltos y duplicados)

Hoy `clientes.domicilio` y `proyectos.direccion_obra` son dos campos de texto libre, sin relación formal, y `current_state.md` ya registra que se sincronizan a mano en el flujo de contrato. Propuesta: tabla `direcciones` propia:

```text
direcciones: id, cliente_id, etiqueta ('domicilio' | 'obra' | 'facturacion' | 'otra'),
             linea1, linea2, ciudad, barrio, notas, es_predeterminada
```

Un proyecto referencia `direccion_obra_id` (FK) en vez de copiar texto. Un cliente puede tener varias direcciones (útil para clientes con más de un proyecto en distintas ubicaciones, que ya existe en los datos reales según el inventario). La pantalla `/cuenta/direcciones` le da al cliente autoservicio para mantenerlas al día — hoy eso depende de que el equipo comercial lo escriba a mano cada vez.

### 2.4 Sesión

Reusar el patrón `iron-session` que ya funciona en el legacy (`src/lib/agnostic/session.ts`, `sessionOptions`) — es simple, sin dependencias de infraestructura nueva, cookies firmadas. No hay razón para cambiarlo solo por cambiar; es de las pocas piezas del legacy que no aparece en la lista de "qué no repetir".

---

## 3. Modelo de datos (Drizzle, misma Neon)

No se reescribe el inventario completo acá (ya está en `arnes/diagnostico/inventario_legacy.md`), pero los cambios de fondo respecto al legacy son:

1. **Tablas relacionales reales**, no un único `agnostic_records(id, namespace, data jsonb)`. Cada namespace del inventario (§2 de t-002) se vuelve una tabla Drizzle con columnas tipadas, FKs reales, `NOT NULL` donde corresponda.
2. **`hitos_pago` dejar de ser un array JSON suelto dentro de `contratos`** — pasa a ser su propia tabla `hitos_pago(id, contrato_id, tipo, monto_o_porcentaje, razon, orden)`. Esto elimina de raíz la clase de bug que debuggeamos hoy (un array-como-JSON-blob es exactamente lo que permitió que el estado se desincronizara sin que la base de datos lo notara).
3. **`direcciones` nueva** (ver §2.3).
4. **`usuarios` nueva**, separada de `clientes` (ver §2.1), con `usuarios_equipo` fusionándose ahí para los roles internos.
5. **Migración de datos real:** una vez aprobado este plan, se escribe un script de migración `usuarios_equipo` + `clientes` (con login) → `usuarios`, y `contratos.hitos_pago` (JSON) → filas de `hitos_pago`, corriendo contra la MISMA Neon, sin tocar las tablas legacy (`agnostic_records` queda intacta hasta el corte final, por si hay que volver atrás).

---

## 4. Sitio público + SEO

- **Metadata nativa de Next.js App Router**: `generateMetadata()` por página (title/description/OG dinámicos desde los datos reales del proyecto/producto), no meta tags hardcodeados.
- **`app/(publico)/sitemap.ts` y `robots.ts`** dinámicos generados desde `portfolio_publico` + `productos_catalogo` publicados — el legacy ya tenía `/sitemap.xml` y `/robots.txt` como rutas, se reconstruye igual pero con Drizzle en vez de leer JSON.
- **JSON-LD estructurado** en `lib/seo/`: `Organization` global (layout raíz), `LocalBusiness` en home, `Product`/`Service` en fichas de catálogo, `BreadcrumbList` en categorías — el legacy ya identificó esto como necesario (`current_state.md` lo menciona), se formaliza como módulo reutilizable en vez de HTML embebido zap por zap.
- **Renderizado**: páginas de `(publico)` usan ISR (`revalidate`) para catálogo/portafolio (cambian poco, deben ser rápidas y indexables) — nunca client-side fetching para contenido que Google necesita ver. El ERP (`app/erp/`) es 100% dinámico/autenticado, sin SEO ni ISR.
- **Imágenes**: `next/image` sobre las URLs de Cloudflare R2 existentes (mismo bucket, mismo `CF_R2_PUBLIC_URL`) con `remotePatterns` configurado — cero cambio de dónde viven los archivos.

---

## Archivos afectados

- Ninguno de producto todavía. Este documento en sí: `arnes/planes/plan_arquitectura_destino.md` (crear).

## Qué NO incluye este plan

- No incluye: el desglose de tareas por módulo (eso viene después de aprobar esto, como t-006, t-007...).
- No incluye: el script de migración de datos real (se escribe y se corre solo tras aprobación, y solo contra una copia de verificación antes de tocar `usuarios`/`hitos_pago` reales).
- No incluye: decisión sobre los 12 puntos grises de la sección 5 del inventario — quedan para que el Supervisor los resuelva uno por uno, no bloquean este plan de arquitectura pero sí van a bloquear tareas específicas que dependan de ellos (ej. el módulo de calendario no arranca hasta saber cuál de las dos versiones es la real).

## Preguntas abiertas

1. ¿El entorno Preview de Vercel ya tiene `DATABASE_URL`/`CF_R2_*` habilitadas, o hay que habilitarlas manualmente en el dashboard antes de que el primer push a `dev` sirva de algo?
2. ¿Confirmás el modelo de roles (admin/comercial/taller/finanzas) o hay roles reales del negocio que no capturé?
3. ¿El autoregistro de clientes (§2.1) es aceptable, o preferís que TODO acceso de cliente lo cree comercial manualmente (más control, menos fricción de datos duplicados)?
4. Migración de `hitos_pago` (JSON → tabla): ¿corremos esto ahora sobre los 6 contratos reales que están sin `hitos_pago` (hallazgo de t-001), o se dejan como están porque ya son contratos firmados y no se debe tocar nada legal ya cerrado?

## Aprobación del Plan

- **Revisor:** Javier (Supervisor)
- **Estado:** pendiente_cambios / aprobado / rechazado — a definir
