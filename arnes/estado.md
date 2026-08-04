# Estado del proyecto

Este archivo se lee al arrancar cualquier sesión y se actualiza al cerrar cada tarea o al reiniciar contexto.

## TRANSICIÓN A LA V3 "VETA DORADA REAL" (2026-08-04) — EL ARNÉS VIVE ACÁ

**Decisión del Supervisor (2026-08-04):** el prototipo v2 se descarta por completo. Su código nunca se pusheó a producción, era prototipo sin uso y heredaba patrones viejos. Lo único valioso era el conocimiento en `arnes/`, que se conserva íntegro en esta carpeta.

**Qué pasó (checkpoint aprobado por el Supervisor):**
1. Se commiteó todo el arnés v2 sin commitear (entrada Ola 7, afinaciones OLA_6, plan maestro, ledger t-035..t-073) en la rama `dev` vieja.
2. La rama `dev` vieja se renombró a `backup/dev-v2-arquitectura-20260804` (congelada en 8526676) — respaldo puro, no se le hace push de código nuevo.
3. Se creó **esta carpeta** (`empresa_muebles_clone_v3`) como worktree de una **rama `dev` huérfana** (sin historia de código v2), con `arnes/` + config. Commit fundacional: `e2c765b`.
4. `main` y `legacy-agnostic-backup` intactos. No hubo push a `origin` todavía.

**Próxima acción permitida:**
- **Diamante 4 (sistema visual) ABIERTO** — metodología en `arnes/diagnostico/diamante4_metodologia.md`. Primera fase de la V3, previa a Ola 7.
- Ola 7 (Execute) sigue su plan maestro (`arnes/planes/plan_ola7_maestro.md`, fases F0-F9) pero **las pantallas consumirán los tokens del D4** — no estilo improvisado.

**Regla nueva de esta carpeta:** nunca reutilizar código del prototipo v2; si un patrón resultara necesario, se discute con el Supervisor antes de copiarlo.

---

## Oleada de paridad con el legacy (2026-08-02) — 9 tareas, 21 archivos nuevos

Contexto: una auditoría comparativa (inventario de rutas legacy vs. nuevas) encontró 13 pantallas del sistema viejo sin equivalente todavía. El Supervisor delegó la planeación completa y autorizó ejecución en paralelo con subagentes mientras estaba fuera.

**Cerradas sin checkpoint (7, riesgo bajo, todas delegadas a opencode/deepseek-v4-flash-free, todas exactas al prompt en el primer intento):**
- t-024 `/app/erp/pedidos` — vista ERP de pedidos_web (contraparte del checkout de t-015).
- t-025 `/app/erp/perfil` — empleado edita su nombre y cambia su password (verificado en runtime: password actual incorrecta se rechaza).
- t-026 `/app/erp/portfolio` — gestión de casos de portafolio (crear, publicar/despublicar).
- t-027 `/app/ficha/:id` — ficha de producción imprimible para taller (sin precios a propósito).
- t-028 `/espacios` — landing de índice de categorías.
- t-029 `/proceso` — landing de proceso en 4 pasos, con copy real del legacy.
- t-030 — 6 landings SEO por categoría (cavas-y-bares, centros-de-entretenimiento, closets-vestidores-bogota, cocinas-integrales-bogota, consolas-recibidores, estudios-home-office), migradas como 1 componente compartido (`LandingEspacio.tsx`) + 6 configs de contenido real extraído del legacy — no 6 implementaciones sueltas ni contenido inventado. Nota: sin el Tailwind/VetaHeader del legacy (no existen en este repo) — estilo simple consistente con el resto de `app/(publico)/`, deliberado, no un descuido.

**t-023 `/app/prefabricados` (riesgo alto, schema aprobado explícitamente antes de escribir código):** un prefabricado dejó de ser un concepto separado — es un `proyecto` de un solo espacio (`tipo_proyecto='producto_fijo'`) cuyo resultado calculado se publica en `productos_catalogo` (`proyecto_origen_id`, columna única). Cero tablas nuevas. Circularidad publicar→editar→republicar verificada dos veces: test automatizado contra dev-local real (4/4 OK) y manualmente vía HTTP.

**t-031 `/propuesta/:proyectoId` (riesgo alto, construida directamente, no delegada):** reemplaza el snapshot público del legacy — el mismo tipo de dato (`unit_price`/`total` de la propuesta) que causó un incidente documentado por desincronización. La versión nueva no tiene snapshot: consulta el proyecto en vivo con el mismo motor de cálculo del ERP, así que no puede mostrar un total viejo por diseño. Verificado en runtime: total calculado ($1.800.000) coincide a mano con materiales+mano de obra+costos operativos, y el control de acceso por estado (`activa` = no visible) se probó creando un proyecto real y confirmando 404.

**t-032 (decisión, sin código):** `/share/:token` del legacy — un motor genérico para compartir cualquier registro con cualquier campo — se deja explícitamente FUERA de esta migración. Es exactamente el tipo de "herramienta para construir herramientas" que esta migración decidió dejar de construir. El único caso de uso real conocido (compartir una cotización) ya lo cubre t-031, construido directamente para eso. Si aparece un segundo caso real repetido, se reevalúa entonces — no antes.

**Balance de la oleada:** `tsc`/`eslint`/`next build` limpios en un solo pase para las 21 rutas/archivos nuevos (53 páginas generadas en el build, antes 38). 9 commits nuevos en `dev`. El inventario de 13 pantallas faltantes queda en 0 pendientes reales — 12 migradas, 1 (`/share/:token`) descartada a propósito con su razón documentada.

## ✅ HALLAZGO CRÍTICO — RESUELTO el 2026-08-01

**Actualización:** el Supervisor generó una API key de Neon (cuenta, alcance todo el proyecto) y la entregó en el chat. Con ella:
1. Se creó la rama `dev-local` en Neon vía `neonctl` (branch id `br-steep-hat-acbu7xiu`, desde `main`).
2. Se guardó su `DATABASE_URL` (pooled, rol `neondb_owner`) en `.env.local` del worktree `dev` — **nunca versionado**, cubierto por `.gitignore` (`.env*.local`), verificado con `git check-ignore`.
3. Se corrió `npm run db:migrate`: las 18 tablas se crearon sin errores (solo NOTICEs de Postgres truncando nombres de constraint >63 caracteres, no bloqueante).
4. Se corrió `npm run db:seed`: usuarios de prueba reales (`admin@dev.local`, `comercial@dev.local`, `cliente@dev.local`, password `dev12345`), 1 producto, 1 proyecto con contrato e hitos 50/25/25.
5. Se corrió `npm run dev` de verdad por primera vez en toda la sesión, y se probaron flujos reales con `curl` contra la base de datos real.

**Bug real encontrado y corregido en el camino:** faltaba `SESSION_SECRET` (requerido por `lib/auth/session.ts`, sin fallback a propósito) — nunca se había detectado porque nunca se había corrido el servidor. Se generó un secreto aleatorio de 32 bytes con `node -e "crypto.randomBytes(32)"` y se guardó en `.env.local` (dev-local, no reutilizable en producción).

**Resultados de las pruebas end-to-end (todas contra `dev-local`, datos reales, nunca contra producción):**
- Login admin/comercial/cliente: **OK** (200, cookie de sesión válida).
- `GET /api/erp/catalogo` con sesión admin: **OK**, devuelve el producto sembrado.
- Cliente intentando `GET /api/erp/catalogo` (ruta de ERP): **403 correcto**, aislamiento de superficie confirmado.
- Cotizador (`GET /api/erp/proyectos?id=...`): **OK**, devuelve proyecto + espacios + items reales.
- **Contrato con hitos NO estándar (40/35/25) — el bug original exacto que arrancó toda esta migración**: `POST /api/erp/contratos` con esa combinación, releído directo de la tabla `hitos_pago` después: **se guardó 40/35/25 exacto, sin revertir a 50/25/25.** Bug original confirmado corregido de punta a punta, no solo a nivel de código.
- Portal de cliente: proyecto propio → **200**; proyecto inexistente → **404** (no 403, como exige el diseño de t-013).
- **Checkout (t-015, el módulo de mayor riesgo por dinero)**: se intentó el ataque exacto que la lógica está diseñada para prevenir — el cliente mandó `precioUnitario: 1` en el body. El servidor lo ignoró y usó el precio real (`65000`) leído fresco de `productos_catalogo`. Pedido creado con `subtotal: 130000` (2 × 65000), no `2`. **Confirmado: un cliente no puede fijar su propio precio.**

**Lo que sigue sin probar end-to-end:** finanzas (t-017) — el seed no crea `cuentas_financieras` ni `obligaciones_pendientes`, así que `registrarMovimiento()` no se pudo ejercitar contra datos reales todavía (la página `/app/erp/finanzas` sí carga, 200). Sigue con QA de código completa (lectura manual + tsc + eslint) pero no runtime real. R2 (t-003) sigue sin tocar, aparte.

**Importante — esto NO es aprobación de producción:** haber corrido las pruebas de arriba con éxito es evidencia fuerte, pero el `checkpoint.veredicto_humano` de t-008/t-009/t-013/t-015 sigue en `"pendiente"` en el ledger — esa aprobación es exclusiva del Supervisor (`AGENTS.md`: "Tareas de riesgo alto... pasan por checkpoint humano explícito"). Lo que cambió es que ahora hay evidencia real que mostrarle, no solo lógica aislada.

## Cierre de la iteración del diamante del mapeo (2026-08-03) — Fase 2 abierta

**Contexto:** mapeo sistémico del negocio (Double Diamond) — Discover en 2 rondas de entrevista con Javier, Define convergido en `cierre_diamante.md`, loop metodológico ejecutado e integrado en `logica_de_negocio.md` (Parte I) con trazabilidad 1:1.

**Qué se integró en el mapa (`logica_de_negocio.md`, Parte I):**
- Corrección: diseño 3D $100k → **$130k + facturación DIAN** (4 lugares: diagrama, árbol de problemas, línea de tiempo, narrativa).
- Adiciones: modelo **socios-por-comisión** con tabla de compensación; contexto central **Control de cronograma** (inmutable, holgura máx 5 días, causa del desfase auditable, SLA 5-24h); **Capa 1 = control entre subsistemas** con los 4 gates (check de schema, triple verificación de recepción, citación de calidad push, cronograma con causa) + hallazgo B resuelto (Producción se disuelve en Desarrollo/Cronograma/Taller/Calidad); **Capacidad instalada** (4:1 demanda/fábrica); narrativas de política financiera, integraciones de producción (SketchUp/OpenCutList→CVC→Corte Cloud, Veta Designer), documentación (Drive VETA_ERP), micro cuentas de cobro.
- Diagrama Mermaid actualizado (gates de capa 1) en el mismo pase.
- Marcado Living Documentation: 7 secciones CONTRATO VIVO, 1 REGISTRO HISTÓRICO.

**Verificación:** tabla de trazabilidad 23 hallazgos → cambios en `loop2_y_retroalimentacion.md` PARTE C. Aprobado por el Supervisor.

**Diferido (registrado, no editado):** neto post-impuestos del diseñador (% y $130k→neto, pendiente de contador); % del carpintero "por tamaño" (sin número); diagnóstico de `G:\Mi unidad\VETA_ERP`; modelo de micro cuentas de cobro en detalle; capa 2 (taller/ISO); sesión estratégica §2.D.

**Fase 2 (diamante de solución) — recién abierta.** Candidatos a diseño de schema/UI/automatizaciones de capa 1: **Control de cronograma, Desarrollo capa 1, Calidad, Finanzas/Compensación**. Primera acción: diagnosticar `G:\Mi unidad\VETA_ERP` (flag mecánico, datos reales, sin preguntas al negocio). Criterio de reapertura vigente: si aparece una regla que cambia bounded contexts o gates → loop focalizado, no ronda completa.

## Resumen

Rama `dev` huérfana (worktree `../empresa_muebles_clone-dev`), sobre el MISMO repo/Neon/R2/Vercel de producción. Fase 0 y el plan de arquitectura aprobados. **Implementación en curso**, autorizada explícitamente por el Supervisor mientras está fuera 4 horas, con dos límites no negociables: nunca merge/push a `main`, nunca migrar datos reales de producción sin aprobación explícita.

## Última sesión (en curso)

**Fecha:** 2026-07-31

**Qué se hizo (28 commits en `dev`, todo verificado independientemente antes de commitear):**
- Fundación: Next.js + Drizzle (18 tablas relacionales) + auth completo (login/registro/sesión, `usuarios` separado de `clientes`) + middleware de seguridad (3 superficies, 403 explícito, bypass M2M acotado a `/api/admin`).
- **Módulos cerrados (`ui`/`andamiaje`, riesgo bajo):** catálogo (t-006+t-011: listado+detalle+CRUD+API REST), sitio público (t-007: home/colecciones/portafolio+SEO/JSON-LD, confirmado por grep que portafolio nunca menciona precio), shells de comercial/taller/finanzas/equipo/calendario (t-010), captura de leads `/agendar` (t-012), proveedores (t-014), detalle de orden de taller con tareas (t-016), crear empleado con password temporal server-side (t-018, solo `admin`).
- **Módulos de lógica de negocio o seguridad, código completo pero en `esperando_humano` (checkpoint requerido, riesgo alto):**
  - t-008 cotizador: cálculo puro con 5 tests, componentes controlados.
  - t-009 contratos: `PaymentScheduleEditor.tsx` con CERO `useState` real (verificado por grep + lectura manual completa), `hitos_pago` como tabla relacional, texto dinámico sin "undefined", 7 tests.
  - t-013 portal de cliente: cadena de aislamiento por `clienteId` verificada de punta a punta (la función que trae el proyecto filtra por cliente Y se llama antes que la que trae el contrato), `notFound()` en vez de 403, 2 tests.
  - **t-015 checkout (pedidos_web): la tarea de mayor riesgo real de la sesión (dinero).** `ItemPedidoInput` no tiene campo `precioUnitario` (estructuralmente imposible leer un precio del cliente), el precio se re-consulta FRESCO de `productos_catalogo.precio_publico` en cada POST filtrado por `publicado_web=true`, `clienteId` siempre de la sesión. 5 tests unitarios, verificado con lectura manual completa de los 3 archivos críticos.
  - **t-017 finanzas (registrar pago/cobro): integridad transaccional real.** Las 6 operaciones (leer obligación, leer cuenta, insertar movimiento, actualizar saldo, `SUM`, actualizar obligación) corren dentro de un único `db.transaction()` — verificado leyendo el archivo completo, confirmando que TODAS usan `tx`, ninguna `db` suelto. El estado se recalcula con un `SUM` real dentro de la misma transacción (ve la fila recién insertada), nunca un contador incrementado a ciegas. 6 tests unitarios.
- Script de seed para desarrollo local con guardia anti-producción (`scripts/seed-dev.ts` — pero nunca corrido de verdad, ver hallazgo crítico arriba).
- **Tooling de verificación completado:** `eslint.config.mjs` agregado. `npx next build` (con `DATABASE_URL` placeholder) encontró y permitió corregir **3 bugs reales** que `tsc` nunca hubiera visto (relación de Drizzle incompleta, `useSearchParams()` sin `<Suspense>` en `/agendar` y `/login`). Se repitió después de cada oleada nueva (incluida esta) — el build sigue avanzando limpio hasta `/portafolio` con el mismo `ECONNREFUSED` esperado, sin bugs nuevos en las últimas 2 oleadas.

**Anomalía de proceso documentada dos veces (t-011):** el proceso de `opencode` invocado para tareas de catálogo siguió escribiendo archivos SIN pedírselo, en dos rondas separadas, después de que la tarea original ya estaba cerrada. El código resultante pasó QA real y se aceptó, pero el orquestador no tiene visibilidad/control total del ciclo de vida de esos procesos una vez lanzados.

**Qué quedó pendiente:**
- **Prioridad real para cuando el Supervisor vuelva: resolver el hallazgo crítico de arriba antes de agregar más módulos sin probar.**
- t-003 (auditoría R2) sigue `[SOLO_HUMANO]`.
- Los 12 puntos grises del inventario original sin decisión del Supervisor.
- Merge `dev` → `main`: bloqueado hasta aprobación explícita.
- Migración de datos reales: NO ejecutada.
- Módulos aún no tocados: compras/abastecimiento, finanzas a fondo, taller a fondo, checkout/pedidos_web de la tienda.

## Oleada de auditoría (2026-07-31, posterior al resumen anterior)

Elegí auditoría/hardening sobre agregar módulos nuevos (instrucción del Supervisor: "usá tu criterio"), dado que ya hay 5 tareas de riesgo alto esperando checkpoint y el hallazgo crítico de runtime sigue sin resolver — más superficie sin probar no ayuda antes de eso.

**Barrido de autorización (script sobre `app/api/erp`, `app/api/pedidos`, `app/api/leads`, `app/app/erp/*/page.tsx`, `app/cuenta/*/page.tsx`):**
- `app/api/leads/route.ts` sin `requireEmpleado`/`requireCliente`: **correcto por diseño** (captura pública de leads, t-012).
- `app/app/erp/page.tsx` sin `requireEmpleado`: **correcto por diseño** (dashboard genérico, cualquier empleado autenticado por el layout).
- `app/app/erp/cotizador/[proyectoId]/page.tsx` sin `requireEmpleado`: investigado a fondo, **falsa alarma verificada, no gap real**. Es `'use client'` (no puede llamar una función server-only), y el layout padre (`app/app/erp/layout.tsx`) solo exige "ser empleado" (`requireEmpleado()` sin roles) — la restricción real (`['admin','comercial']`, declarada en `lib/erp-nav.ts`) vive en las 5 llamadas a `requireEmpleado(['admin','comercial'])` dentro de `app/api/erp/proyectos/route.ts` y `app/api/erp/proyectos/[id]/espacios/route.ts` (confirmado leyendo ambos archivos). Verifiqué además que la página maneja el 403 correctamente: `if (error && !proyecto) return <p role="alert">{error}</p>` y `if (!proyecto) return null` antes de renderizar el formulario — un empleado sin el rol correcto ve un mensaje de error, nunca datos ni el botón de guardar. Conclusión: dato protegido en la capa que importa (API), sin fix necesario.
- Páginas de `app/cuenta`: todas con `requireCliente`, sin hallazgos.

**Documentación cerrada:** `AGENTS.md`/`CLAUDE.md`, fila "Pruebas" de la tabla de verificación, ahora documenta que `lib/modules/*/queries.test.ts` (y cualquier test que importe `lib/db/client.ts`) exige `DATABASE_URL` seteada (aunque sea un placeholder que nunca conecta) para no fallar al importar — hallazgo real de esta sesión (`lib/modules/cuenta/queries.test.ts`), antes no documentado.

**Balance de la oleada:** sin bugs nuevos encontrados, dos hipótesis de riesgo cerradas con evidencia (no solo descartadas de palabra), un gap de documentación real cerrado. Refuerza la lectura de que la lógica de negocio construida hasta ahora es sólida a nivel estático; el techo de confianza sigue siendo el mismo hallazgo crítico de runtime, no la falta de revisión de código.

**t-019 (cerrada, `ui`/riesgo bajo):** la auditoría encontró un gap real (no una falsa alarma): `app/api/erp/tareas-produccion/route.ts` ya existía con auth y validación correctas, pero la página de detalle de orden de taller (t-016) era de solo lectura — nadie podía usar esa API desde el ERP. Delegado a `opencode/deepseek-v4-flash-free` con prompt prescriptivo (código casi completo, mismo patrón que t-018). Resultado: exacto a lo pedido en el primer intento, `tsc`/`eslint`/`next build` limpios, componente controlado con `useEffect` de resincronización y rollback optimista en caso de error del POST. Verificado con lectura manual completa de ambos archivos, no solo el reporte del ejecutor.

**t-020 (cerrada, `ui`/riesgo bajo):** mismo patrón de hallazgo que t-019, esta vez en proveedores: `crearProveedor` + `POST /api/erp/proveedores` ya existían con auth/validación correctas, `app/app/erp/proveedores/page.tsx` era de solo lectura. Delegado a `opencode/deepseek-v4-flash-free` con el mismo enfoque prescriptivo. Resultado: exacto en el primer intento, `tsc`/`eslint`/`next build` limpios, usa `router.refresh()` para reflejar el alta sin recargar toda la página. Verificado con lectura manual completa.

**Patrón detectado en esta oleada:** varias APIs de escritura (`crearX`) se construyeron completas (auth + zod) pero sus páginas correspondientes quedaron de solo lectura — probablemente porque los módulos se cerraron en oleadas separadas (t-014 proveedores fue solo el listado, t-016 taller fue solo el detalle). Vale la pena, en la próxima oleada, revisar sistemáticamente el resto de `app/api/erp/*/route.ts` con métodos POST/PUT contra sus páginas correspondientes antes de asumir que un módulo "cerrado" está completo end-to-end (a nivel de UI, no de runtime real — ese sigue bloqueado por el hallazgo crítico).

**Barrido sistemático completo (aplicado tras detectar el patrón):** se listaron TODAS las rutas de `app/api/erp/*/route.ts` con métodos POST/PUT/PATCH/DELETE y se verificó cuáles tenía UI real conectada (`grep` de la ruta en `app/` y `components/erp/`). Resultado:
- `catalogo` (POST/PATCH/DELETE): **sin UI, gap real y el más grande de los tres** — corregido con t-021 (crear) + t-022 (editar/eliminar), ambas lanzadas en paralelo en opencode por no compartir archivos, ambas cerradas con QA independiente completa (lectura manual + tsc + eslint + next build, todo limpio en el primer intento).
- `contratos` (POST): SÍ tiene UI (`components/erp/ContratoForm.tsx`, t-009). Sin hallazgo.
- `equipo` (POST): SÍ tiene UI (`components/erp/CrearEmpleadoForm.tsx`, t-018). Sin hallazgo.
- `movimientos` (POST): SÍ tiene UI (`components/erp/RegistrarMovimientoForm.tsx`, t-017). Sin hallazgo.
- `proyectos` / `proyectos/[id]/espacios` (POST/PUT): SÍ tienen UI (cotizador, t-008). Sin hallazgo.
- `proveedores` (POST): corregido en t-020 (ver arriba).
- `tareas-produccion` (POST): corregido en t-019 (ver arriba).

**Conclusión del barrido: cerrado.** Los 8 módulos de escritura de `app/api/erp` ahora tienen UI real conectada. No queda ningún endpoint de escritura huérfano de interfaz en el ERP.

**Checkout de la tienda pública, verificado (no es un gap):** `/api/pedidos` (t-015, el módulo de mayor riesgo real de la sesión por tocar dinero) SÍ tiene UI real conectada — `components/cuenta/PedidoCarritoForm.tsx`, usado en `app/cuenta/pedido/page.tsx`. Confirmado con `grep`, no se investigó más a fondo porque t-015 ya tiene QA exhaustiva registrada de la oleada anterior.

## Cierre de esta oleada de auditoría (2026-08-01, madrugada)

**Balance total de la oleada:** 4 tareas nuevas cerradas (t-019, t-020, t-021, t-022), todas `ui`/riesgo bajo, todas con el mismo hallazgo raíz (API de escritura completa sin UI que la use) encontrado por un barrido sistemático propio, no por instrucción externa. Todas delegadas a `opencode/deepseek-v4-flash-free` con prompts prescriptivos (código casi completo), todas correctas al primer intento, todas verificadas con lectura manual completa + `tsc`/`eslint`/`next build` independientes antes de cerrar. Cero bugs nuevos quedaron sin corregir. 4 commits nuevos en `dev` (`ac1c476`, `438fff4`, `5383828`, `1e497e2`).

**Estado del ledger tras esta oleada:** 15 tareas `cerrada`, 6 `esperando_humano` (t-003 R2 `[SOLO_HUMANO]`, t-008 cotizador, t-009 contratos, t-013 portal cliente, t-015 checkout, t-017 finanzas — todas de riesgo alto/lógica de negocio o dinero, checkpoint pendiente del Supervisor).

**Lectura honesta del estado real:** a nivel de UI/API/tipos, el ERP + sitio público ahora están funcionalmente completos para el conjunto de tablas existente — no hay endpoints huérfanos, no hay páginas de solo lectura donde debería haber escritura, auth revisada y confirmada correcta en las tres superficies (ERP por rol, cuenta por cliente, público sin auth). **Esto sigue siendo "compila y la lógica aislada es correcta", no "funciona"** — el hallazgo crítico del inicio de este archivo (ningún módulo corrió jamás contra una base de datos real) sigue exactamente igual de vigente y sigue siendo el único techo real de confianza. Ese hallazgo no se puede resolver con más agentes ni más tiempo autónomo: requiere el dashboard de Neon.

**Próxima acción recomendada para cuando el Supervisor vuelva, en orden:**
1. Leer el hallazgo crítico (arriba del todo de este archivo) y decidir sobre la rama `dev-local` de Neon.
2. Con esa base de datos, correr `npm run db:migrate` + `npm run db:seed` + `npm run dev` y probar de verdad los 6 flujos en `esperando_humano` (son los que más importan: dinero, contratos, aislamiento de datos de cliente).
3. Recién ahí dar checkpoint a t-008/t-009/t-013/t-015/t-017.
4. t-003 (R2) sigue bloqueada aparte, no depende de lo anterior.

**Decisión tomada / lecciones de proceso:**
- Modelos gratis de opencode: fallan con prompts abiertos, funcionan con prompts muy prescriptivos (código casi completo).
- Nunca se acepta el reporte de un ejecutor como prueba — el orquestador re-corre tsc/eslint/tests de forma independiente en cada integración, y en t-013 además releyó manualmente la cadena completa de llamadas para confirmar que la verificación de propiedad ocurre antes del acceso a datos, no solo que la función aislada esté bien escrita.
- Con varios agentes en paralelo en el mismo worktree, staging siempre explícito (`git add <rutas>`), nunca `-A` a ciegas.
- `npx next build` con una `DATABASE_URL` placeholder es una verificación real y barata que conviene correr periódicamente sobre código nuevo — encuentra bugs de framework (Suspense, relaciones) que `tsc` no ve, aunque no pueda completar sin una base de datos real.

## Línea de demanda: captación, conversión y sistema de marca (2026-08-03) — t-034, `esperando_humano`

Se abrió la línea que atacaba la restricción #2 del negocio (demanda, ratio 4:1), documentada desde el mapeo y sin dueño: las 33 tareas del ledger eran todas técnicas. **Objetivo del Supervisor:** *más leads cualificados reales → más ventas → el departamento de diseño comercial visitando clientes en forma.*

**El marco pasó por dos correcciones del Supervisor antes de estabilizarse. Las dos valen como lección de método:**

1. **Recorte.** La v1 proponía un programa de investigación de mercados de 4 fases (JTBD, ZMET, sondas culturales, rejilla de repertorio, semiótica, diseño especulativo). El Supervisor lo cortó: *"es trabajo no requerido; el focus real es tomar lo que ya hay, organizarlo y darle mejora y estabilidad pro, no iniciar una nueva línea de investigación de mercados cuando los ads están produciendo leads."* → **§2.D obliga al abanico ancho de consultor, pero no exime de la pregunta previa: ¿el problema es de desconocimiento o de ejecución?** Este negocio ya sabe quién es su cliente. Su problema es de instrumentación.
2. **Sobrecorrección del asesor.** La v2 se fue al otro extremo y redujo todo a embudo y cualificación. El Supervisor lo señaló: *"se están centrando solo en el aspecto de una métrica y cualificación... me falta el plan de diagnóstico real sobre el sitio web, contenido, flow comercial, flow captación, organización del sistema de marca, tono."* → **"No es investigación de mercado" NO significa "solo métricas de embudo".** Diagnosticar el sitio, el contenido, el flujo comercial y la marca **propios** es exactamente "tomar lo que ya hay y organizarlo". Cabía desde el principio.

**Estructura final (v3): seis ramas paralelas, no fases.** R1 captación · R2 sitio y contenido · R3 lead y cualificación · R4 flujo comercial · R5 sistema de marca y tono · R6 ad management agentivo. **R6 está bloqueada por H1/H2/H3/H5**: sin verdad de terreno (qué lead se volvió venta y por cuánto), un agente optimizando campañas amplifica el error más rápido que un humano.

**Ocho hallazgos verificados en el código (evidencia, no hipótesis). Ninguno requiere investigación de mercado; los ocho sirven al objetivo. Destilados al `log_insights_fase2.md` como I-005 a I-010.**

*Medición — rota en los dos extremos:*
- **H1** — `score_conversion` existe en [schema.ts:279](lib/db/schema.ts#L279) con `default(0)` y **cero lecturas/escrituras** en todo el repo. El campo para cualificar leads existe hace tiempo y el criterio nunca se definió — es la pregunta que `logica_de_negocio.md:329` dejó abierta a propósito.
- **H2** — **`gclid` se perdió en la migración**: el legacy lo tenía (`inventario_legacy.md:52`), el schema nuevo no. Sin él no hay conversiones offline, así que **Google optimiza para formularios enviados, no para ventas cerradas**. Alternativa a verificar: conversiones mejoradas con email/teléfono hasheado, que sí se capturan hoy.
- **H3** — `leads` sin etapa, sin fecha de primer contacto, sin FK a `proyectos`. **Hoy es imposible responder "de 100 leads, cuántos llegaron a visita".**
- **H5** — **no hay ningún tag de analítica instalado. Cero** `gtag`/`googletagmanager`/`dataLayer`/GA4 en `app`, `lib`, `components`. Sin medición on-page, sin eventos de conversión hacia Ads, sin audiencias, sin embudo. **Junto con H2: se paga pauta a ciegas en la entrada y en la salida.**

*Sitio y conversión:*
- **H6** — NAP incompleto **a propósito** ([jsonld.ts:4-8](lib/seo/jsonld.ts#L4-L8) lo documenta con honestidad, esperando confirmación del Supervisor). Bloquea el SEO local, que para un negocio local de alto ticket es fuente de leads cualificados gratis y recurrente. Es un dato `[SOLO_HUMANO]` de cinco minutos.
- **H7** — **la prueba social se perdió**: el legacy tenía tabla `testimonios` (`inventario_legacy.md:53`), no existe en el schema nuevo ni en el sitio. En compra de alto ticket y alta consideración es palanca de conversión de primer orden, y el dato ya existía.
- **H8** — **desfase entre el canal real y el que ofrece el sitio**: todos los CTA públicos van a `/agendar` (5 enlaces) y **no hay un solo enlace a WhatsApp**, aunque el mapa dice que el flujo real es *lead llega → se atiende por WhatsApp*. Hipótesis fuerte, verificable en cuanto exista H5.
- **H4** — la visita comercial ya ocurre, ya está pagada y no deja un solo dato estructurado.

> **Lectura de conjunto:** el sitio nuevo tiene buena base técnica (`robots.ts`, `sitemap.ts`, JSON-LD por tipo, 16 páginas públicas, 6 landings SEO con contenido real). Lo que le falta no es construcción, es **medición, prueba social y una vía de contacto de baja fricción**.

**La carpeta de contexto previo del Supervisor ya no está sellada.** Las v1/v2 la sellaron para no sesgar una investigación abierta; con el alcance actual no es material que pueda sesgar preguntas, es **un activo existente que hay que diagnosticar y organizar**. Entra de primera, ruteada por rama (SEO→R1/R2, marca→R5, negocio→contraste contra el mapa), con protocolo de clasificación (evidencia / afirmación / decisión tomada / huérfano). Regla permanente: **cuando el material previo contradiga al comportamiento medido, gana el comportamiento.**

**Programa recortado (3 fases + 1 archivada):** A instrumentar y ver (embudo con números) → B definir cualificación y protocolo de visita → C mover la aguja en pauta y contenido. La Fase D (todo el bloque estratégico/especulativo) queda **archivada con condición de reapertura explícita**: solo si C demuestra que el embudo está sano y aun así no hay volumen, el problema sí era de mercado.

**Decisiones tomadas en esta línea:**
- **Sostenibilidad = viabilidad comercial en el tiempo** (Capacidades Dinámicas, Teece 1997). H1-H4 no son deuda técnica: son el órgano de sensado del mercado, o sea la condición material de la adaptabilidad. La capa ecológica queda parqueada **con condición de activación falsable**, no descartada.
- **Sin acceso a clientes nuevos ahora.** Se reemplaza por minería del corpus que ya existe (búsquedas, `leads`, WhatsApp) + un informe autoetnográfico del Supervisor. Ese informe entra con **protocolo antisesgo escrito antes de recibirlo**: cada afirmación va al registro de hipótesis con su falsador declarado, nunca al de hallazgos.
- **La carpeta previa del Supervisor deja de estar sellada hasta el final**: con el alcance recortado, las preguntas las decide el embudo y no el material, así que el riesgo de sesgo cae. Se abre en Fase C, y la parte de SEO probablemente se adelante a Fase A. Se mantiene: cuando el material previo contradiga al comportamiento medido, **gana el comportamiento**.
- **Ninguna escritura a la cuenta de Google Ads** (pujas, pausar campañas) sin checkpoint explícito — es plata real, mismo criterio que t-015.

**Esta línea corre en paralelo a la Fase 2 técnica, no la reemplaza ni la bloquea.**

## Ciclo de 6 pasadas sistémicas sobre el inventario del diamante 2 (2026-08-03) — esperando checkpoint

**Contexto:** el Supervisor ordenó NO abrir el Define del diamante 2 hasta agotar más loops metodológicos sobre el inventario de eventos (47). Ordenó además un cambio de rol: el Orquestador dejó de ejecutar las pasadas directamente y pasó a **orquestar 6 subagentes** (P2-P7), cada uno con un lente distinto y un **loop interno de 3 pasadas** (bruta → autocrítica → refinamiento), para obtener un panorama asegurado sin quemar el contexto del orquestador.

**Qué se hizo:**
- Metodología escrita: `arnes/diagnostico/pasadas/diamante2_metodologia_pasadas.md` (6 lentes: regla, dato, actor, secuencia, finalidad, causalidad; formato de output uniforme; reglas de anti-duplicación, trazabilidad y escepticismo).
- Ledger: t-035 a t-040 creadas (una por pasada), `esperando_humano`.
- 6 subagentes lanzados en paralelo, cada uno escribiendo SOLO su archivo (`pasadas/pasada2_invariantes.md` … `pasada7_arquetipos.md`). Serialización verificada con `git status` (nada compartido fue tocado).
- Auditoría del Orquestador sobre los 6 outputs: formato, trazabilidad `archivo:línea`, anti-duplicación contra el loop 1, y regla de escepticismo — todo cumplido.
- Deduplicación cruzada entre pasadas: **66 → 61 hallazgos únicos**, consolidados en `pasadas/diamante2_panorama_consolidado.md`, agrupados en 10 familias (A dinero, B cronograma, C schema, D cliente, E roles, F rol-vs-persona, G datos, H bucles, I límites, J fronteras).
- Contradicción entre pasadas resuelta: el vínculo E-16→cronograma (que P5/P3 pedían como adición) fue descartado por P6 por no estar documentado en el mapa; el Orquestador falló a favor de P6 → VACÍO.

**Lecturas transversales del ciclo:** (1) el inventario es fuerte en eventos de estado, débil en enforcement/negación; (2) el dinero es la cadena crítica oculta (6 hallazgos: gate de caja, nacimiento de obligación, arriendos, RED3); (3) el cuello humano es la cola del embudo, no la fábrica (comercial = 13 eventos, se satura primero); (4) el cliente queda en silencio ~4 semanas; (5) la promesa 15-20 días no reconcilia con 30 días ideal ni 6.5 reales (necesita dato de Javier); (6) la medición es precondición de la tesis de capacidad.

**Lo importante:** NINGÚN hallazgo cambia bounded contexts ni gates (verificado en las 6 pasadas). La única frontera que roza es el dueño del dinero del cliente Contratos↔Finanzas (P3-02) — se resuelve como frontera del Define, no reabre el esqueleto. **Nada se aplicó al inventario todavía.**

## 7ª pasada (P8, 2026-08-03) — Excepciones y fricción, completada

**Contexto:** el Supervisor aprobó una 7ª pasada con el lente del FALLO (qué pasa cuando un evento NO ocurre) y entregó 4 decisiones de negocio nuevas (I-024 a I-027 en `log_insights_fase2.md`): promesa contractual de 7 semanas + cuestionario de viajes al cliente (I-024), check de los 15 días con log de producción y 3 desenlaces (I-025), calidad revisable por el comercial vendedor o el gerente (I-026), y flow organizado de cambios de contrato con tercer origen de causa en E-33 (I-027).

**Qué se hizo:**
- I-024..I-027 registrados en el log de insights; lente P8 añadido a `diamante2_metodologia_pasadas.md`; t-041 creada.
- Subagente P8 lanzado, completado y **auditado por el Orquestador** (formato, trazabilidad `archivo:línea` al 100%, anti-duplicación, serialización limpia vía `git status`).
- Resultado: **12 hallazgos nuevos** (8 ADICIÓN, 2 REFUERZO, 1 ADICIÓN+VACÍO, 1 VACÍO) en `pasadas/pasada8_excepciones.md`, integrados al panorama consolidado. **4 de las 5 decisiones del Supervisor NO tienen evento en el inventario** — el inventario no materializa las reglas reales del negocio (promesa, viajes, check de 15 días, flow de cambios).

**⚠️ Dos decisiones del Supervisor que P8 destapó y quedaron pendientes de resolver ANTES de converger el Define — RESUELTAS el 2026-08-03 (I-034, I-035, I-043):**

1. **I-025 → cronograma doble (I-034 + I-043):** el Supervisor confirmó que SÍ hay dos calendarios, y precisó la lógica completa: cada proyecto tiene **predefinido un cambio de cronograma al cliente** — cuando el cronograma ideal de producción se cumple a los 15 días, se le notifica al cliente que **su proyecto se entrega antes** (cambio esperado y positivo, ya anticipado en el proyecto). Si ese cambio no se hace internamente, es un **mal indicador de producción**; externamente el cliente no se entera. **El único cambio visible al cliente es el positivo; los deslizamientos internos nunca llegan al cliente dentro de la promesa de 7 semanas.** Corrige la inmutabilidad de E-33/A-7 (una sola línea) y matiza P5-02.
2. **I-026 → verificador único + sin conflicto (I-035 + I-043):** la verificación la hace UNA sola persona designada por despacho (comercial o gerente), con misión única de verificar y aprobar. **NO hay conflicto de interés**: la comisión del comercial es por ventas, no por producción — si el cronograma se afecta, afecta al equipo de producción, no al comercial. La verificación por el comercial vendedor es limpia.

**Corrección a un hallazgo previo:** P5-02 (silencio del deslizamiento = defecto) queda acotado — I-025/I-043 aclaran que dentro de la promesa de 7 semanas el silencio deliberado es por diseño; la comunicación solo importa al salirse de la promesa.

## Aplicación al inventario + correcciones al mapa — COMPLETADA (2026-08-03)

**Contexto:** con las 2 decisiones cerradas, el Supervisor ordenó: *"ejecuta las aplicaciones al inventario, correcciones y destilación de info, y luego según tu auditoría tienes la decisión final sobre datos reales: si la metodología aprueba pasar a abrir el Define o requiere otra pasada."*

**Qué se aplicó al inventario (`diamante2_discover_eventos.md`):** de **47 a 61 eventos** (14 adiciones del ciclo P2-P8 + decisiones):
- **E-48** diseño 3D producido (rol diseñador, P4-F1) · **E-49** presupuesto no viable (Z1, F-8) · **E-50** SLA de primera respuesta (F-7) · **E-51** lead→cliente materialización (P3-01) · **E-52** estimación de duración (F-10) · **E-53** cuestionario de viajes (I-024/F-3) · **E-54** reproceso por calidad/schema rechazado (F-9) · **E-55** testimonio post-entrega (P6-06) · **E-56** nacimiento de la obligación de cobro (P3-02) · **E-57** pago de arriendos (P2-1) · **E-58** cuenta/saldo por socio (P2-7) · **E-59** check de los 15 días con 3 desenlaces (I-025/F-4) · **E-60** comunicación frontstage de progreso (P5-01/P5-02/P5-10) · **E-61** check de completitud de orden de garantía (F-11).
- **Refuerzos marcados en filas existentes** con su hallazgo de origen (P2-2, P2-3, P2-5, P2-7, P2-8, P3-03..P3-12, P4-F2..F8, P5-02/04/09/13, P6-01..07, H-03..H-11, P8 F-2, F-5, F-6, F-12).
- **Corrección de auditoría (2026-08-03):** la verificación mecánica detectó que E-49 y E-50 quedaron solo como referencias en prosa y que 9 refuerzos (P4-F3..F6, P5-09, P6-01, P6-04, H-04, H-11) no estaban anotados físicamente. Se crearon las filas faltantes (E-49, E-50) y se anotaron todos los refuerzos en sus filas objetivo. **Verificado: 61 filas, sin duplicados, sin faltantes; los 45 hallazgos trazables del panorama están en el inventario.**

**Qué se aplicó al mapa (`logica_de_negocio.md`, vía loop focalizado — contrato vivo):**
- Sección Control de cronograma: **promesa de 7 semanas + cuestionario de viajes (I-024)**, **cronograma doble (I-034)**, **check de los 15 días con 3 desenlaces (I-025)**, **tercer origen de causa "cambio de contrato" (I-027)**, **comisión del comercial por ventas (I-043)**.
- Diagrama N2: "ajuste en paralelo, no bloquea" → "cambio de contrato con flow organizado (I-027)".
- Sección separación ejecutor-verificador: **verificador único designado + sin conflicto de interés (I-035/I-043)**.
- Narrativa retoma de medidas: el cambio de contrato ya no es solo "corre en paralelo" — dispara E-33 con causa "cambio de contrato".
- KPI "15-20 días" reconciliado con la promesa de 7 semanas + check de 15 días.

**Destilación:** insights **I-024, I-025, I-026, I-027, I-034, I-035, I-043** marcados `integrado` en el log. Corrección de numeración: el insight de comisiones/cronograma pasó de I-036 (colisionaba con un I-036 SEO ya existente) a **I-043**.

## Decisión de auditoría del Orquestador — SE ABRE EL DEFINE

**Veredicto:** la metodología **aprueba abrir el Define** (`diamante2_define_eventos.md`). Los 61 eventos convergen en bounded contexts; las 2 decisiones estructurales ya quedaron resueltas por el Supervisor (cronograma doble, verificador único); los VACÍO que quedan son parámetros (SLA, consecuencia tras 12 días, presupuesto no viable) que se modelan "por definir" en el checklist del Define, no bloquean. Ningún hallazgo cambia bounded contexts ni gates (verificado en las 7 pasadas). Los criterios de reapertura (aparecer una regla que cambie bounded contexts o gates) no se dispararon.

**Lo que el Define lleva como decisiones ya tomadas:** cronograma doble (E-14/E-33/E-60), promesa 7 semanas (E-14/E-11/E-47), check de 15 días (E-59), verificador único (E-18/E-24), flow de cambios con tercer origen (E-16/E-33), comisión del comercial por ventas (E-31/E-35), sin conflicto verificador (I-043).

## Define convergido (2026-08-03, aprobado por el Supervisor)
**Qué se hizo:** el Supervisor aprobó abrir el Define; se creó `diamante2_define_eventos.md`. **Los 61 eventos convergen en 15 bounded contexts** (12 del cierre del diamante 1 + **3 nuevos** que resuelven los 5 eventos sin hogar que P6-03/P6-04 señalaron):

- **Marketing / Demanda** (nuevo): E-40 conversión Google Ads, E-42 medición de embudo, E-55 testimonio.
- **Tienda web** (nuevo): E-44 enganche pedido→producción.
- **Gobierno / Medición** (nuevo): E-47 KPIs operativos.
- **E-45 reposición** → Compras (resuelve P6-04).
- **E-08 pago de diseño 3D** → Finanzas (lo dispara Comercial pero el movimiento nace en Finanzas; frontera declarada).

**Decisiones del Define (ya tomadas, no son propuestas):**
1. **Enforcement = máquina de estados con guard** + rama negativa explícita (E-54 reproceso) — nunca "instrucción que se respeta si se quiere" (A3).
2. **Dueños de los gates:** E-18 → Compras (no crea pedido sin schema aprobado); E-21 → Compras→Taller (no transfiere control sin las 3 verificaciones); E-23 → Taller→Calidad (push); E-33 → Control de cronograma (no recalcula sin causa estructurada con tercer origen).
3. **Modelo rol-vs-persona** como precondición de todos los guards (P2-12/P4-F2/F4): roles tipados + asignación persona→rol explícita; los guards se evalúan contra el rol.
4. **Precedencia corregida (P5-09):** el cronograma pasa de "compras → aprobación → ensamblaje → instalación" a "**aprobación (check de schema) → compras → ensamblaje → instalación**". ⚠ **Toca contrato vivo (Parte I)** → se aplica vía loop focalizado con checkpoint del Supervisor al converger.
5. **Interfaces entre contextos** emergen de los gates (9 contratos listados en §5 del Define).

**VACÍO que entran al diseño como "por definir" (10, no bloquean):** SLA primera respuesta (E-50), consecuencia 12 días (E-29), presupuesto no viable (E-49), consecuencia SLA novedad (E-34), gate de caja (E-20), rama negativa E-21, rol de captura E-41, % carpintero, neto diseñador, actor de E-33.

**Decisiones de negocio que quedan para el Supervisor (definidas en §7 del Define):** actor del clasificador E-33, ¿gate de caja bloquea o advierte?, ventana SLA E-50, consecuencia SLA E-34, palanca de demanda H5-H8, pendientes financieros del cierre §9.

**Verificación mecánica:** 61/61 eventos asignados a contexto, sin faltantes ni doble conteo (script de parseo sobre la tabla §2).

## Ciclo de pasadas C1-C6 sobre la convergencia del Define — COMPLETADO y CONSOLIDADO (2026-08-03)

**Qué se hizo:** 6 subagentes (t-042..t-047) auditaron la convergencia del Define con lentes distintos, cada uno con loop interno de 3 iteraciones y trazabilidad `archivo:línea`. Outputs: `pasadas/define_c1_cohesion.md` … `define_c6_restriccion.md` (55 hallazgos brutos). Auditoría del Orquestador (formato, trazabilidad, anti-duplicación) y consolidación en `pasadas/diamante2_define_consolidado.md`.

**Veredicto del Orquestador — CONVERGENCIA ESTRUCTURALMENTE ESTABLE:**
- **0 `PARTIR_CONTEXTO`, 0 `MOVER_CONTEXTO`** — los 15 bounded contexts se sostienen (C1: Comercial 15 y Finanzas 12 no son cajón de sastre).
- **61/61 eventos con hogar** (re-verificado por C3); **7/7 decisiones I-024..I-043 materializadas**; **0 contradicciones silenciosas** (C5); los 9 contratos de §5 bien formados (C2); el grafo soporta la tesis de capacidad (C6).
- **3 correcciones documentales aplicadas al Define hoy (sin checkpoint, no mueven fronteras):** identidad compartida lead→cliente→proyecto (§2), fila E-24 en tabla de gates §4.1, filas de interfaz B3/B5/B7/B9 + nota de ramas negativas (§5), precondición rol-vs-persona (§8).

**Lo que el ciclo afloró y NO se aplicó en silencio (va al checkpoint del Supervisor):**
- **Bloque C — enforcement estructural (no parametrizable):** E-33 camino positivo (el adelanto de E-59 no tiene ruta por E-33; su rama negativa castigaría el éxito, C4-01), E-54 back-edges/granularidad módulo-vs-proyecto/recalc asimétrico (C4-02), E-21 estado de salida sin nombre (C4-03).
- **Bloque B2 — nueva frontera que cruza capas:** E-59 necesita la fila del Taller (capa 2) en capa 1 — cruza la división de capas aprobada (C2-03, C6-01).
- **Bloque D — 8 decisiones de negocio** (amplían §7 del Define): gate de caja bloquea/advierte + quién lo salta, rama negativa de E-21, identidad del verificador único, actor del clasificador E-33, rol de captura de E-41, KPI residual E-47 vs promesa 7 semanas, I-014/I-021 líneas de servicio reales, VACÍOs de apertura no formalizados.

**NO se abre el loop 2 todavía.** El enforcement (§4) es la máquina de estados que el loop 2 de schema/UI congela; diseñar sobre las ramas no deterministas de E-33/E-54/E-21 es deuda diferida. Próxima acción técnica: el Supervisor decide los puntos del Bloque C/B2/D (mismo paquete que la corrección P5-09 al mapa).

## Checkpoint de decisiones del Define — APROBADO (2026-08-03) → LOOP 2 ABIERTO

**El Supervisor respondió todas las decisiones del ciclo C1-C6 y el loop focalizado P5-09.** El paquete completo quedó aplicado al Define (`diamante2_define_eventos.md`, §§5/6/7/8) y al mapa (`logica_de_negocio.md`), y destilado como **I-053** en `log_insights_fase2.md`. Detalle completo en la sección 5 del consolidado (`pasadas/diamante2_define_consolidado.md`). Resumen:

- **B2:** la fila del taller (avance por módulo) es **capa 1** — input de E-59/E-34; sin pantallas de carpinteros (capa 2 diferida).
- **Enforcement:** adelanto = cambio sancionado (sin castigo de comisiones); granularidad de reproceso = **módulo/componente** con **rastreo de origen** (el culpable asume); E-21 sale con estado **`recibido_verificado`** (checklist de la lista de compra esperada); el control pasa al desarrollador sobre el proceso en taller.
- **Negocio:** gate de caja = **bloqueante** (lo resuelve el gerente moviendo cronogramas; el sistema es **guía + registrador de la realidad**); verificador único = **el comercial vendedor**; clasificador E-33 = interno/externo es atributo, no determinante (composición causal); E-41 = comercial define todo + desarrollador define en retoma; **KPIs por subsistema, ninguno residual** (4 semanas → 5% dev+carpintero · ventas → comisión comercial · 7 semanas → cliente recomienda); VACÍOs resueltos (V-1 no-show reagenda con límite, V-4 envío, V-5 horas automáticas, V-6 firma); I-014/I-021 → estrategia de mercado (t-034).
- **P5-09:** aplicado al mapa (cronograma corregido, verificador único, KPIs, gate de caja, guía+registrador, rastreo de origen, fila del taller, factores de tamaño).
- **Cronograma por factores de tamaño (C1):** base 4 semanas (1 dev + 1 compra + 1 ensamble + 1 instalación); un apto puede pedir 2 dev + 1.5 aprovisionamiento.

**Qué queda por definir — RESUELTO (2026-08-03):** los 6 valores numéricos configurables quedaron definidos por el Supervisor — SLA primera respuesta = **5 min** (excede → escala a LLM con registro; sin LLM → segundo comercial notifica); atraso 12 días = **aviso automático al gerente**; lead no viable = **se pierde, solo se registra el motivo**; SLA novedad crítica = **registro + visibilidad + escalación al gerente, sin multa**; % del carpintero = **5% por tamaño** + módulo instalado; neto del diseñador = **parámetro configurable** ($130k bruto − retención ± IVA, **validar con el contador** antes del corte). **El Define no tiene más decisiones de diseño pendientes.**

**Ledger:** t-042 a t-047 con `checkpoint.veredicto_humano = aprobado` (2026-08-03).

## Próxima acción permitida

**Fase 0 (decisiones) COMPLETADA (2026-08-04).** 14 de 16 decisiones cerradas, 2 pendientes de confirmación contable (retención diseñador, IVA diseño 3D). 5 mini-diamantes abiertos (no bloquean corte).

**Una línea viva: Execute (Ola 7).**

- **Técnica (Fase 3):** **Ola 7 Execute ABIERTA** — schema aprobado (65 tablas), pantallas aprobadas (34 core), decisiones de negocio resueltas. Iniciar codificación por zonas: transversal → comercial → cronograma → compras → taller → calidad → finanzas → cliente/docs. Schema migra en 4 fases paralelas a la codificación de pantallas.
- **Demanda/conversión (t-034):** bloqueada esperando al Supervisor. Faltan: aprobar alcance (§8 del marco), credenciales de solo lectura (`[SOLO_HUMANO]`), informe de sector, confirmar H1-H4 como tareas de código.
- **Ojo con H1-H3:** tocan el schema de datos, que `AGENTS.md` prohíbe modificar sin checkpoint.

## Diamante 3 — Fase B (schema y pantallas) COMPLETADA (2026-08-04) → checkpoint humano

**Contexto:** el loop 2 de diseño (schema/UI) corrió completo por el grafo de `diamante3_metodologia.md` (t-048 a t-073, 26 pases). Se cerraron la **Ola 4** (B3-1..B3-5: 34 pantallas core especificadas), la **Ola 5** (B4-1..B4-4: auditoría de 4 lentes, 0 hallazgos estructurales) y la **Ola 6** (B5 auditor final: veredicto **`APROBADO`** + consolidado UI).

**Entregables de la Fase A (schema):** `pasadas/d3_schema_consolidado.md` — **65 tablas** (18 existentes + 47 nuevas), **61/61 huella evento→tabla→columna**, **5/5 gates deterministas** (E-18/E-21/E-24/E-33/E-20), plan de migración en 4 fases, 9 DECISION_PENDIENTE (ninguna estructural). Correcciones A3-C1..C5 incorporadas.

**Entregables de la Fase B (pantallas):** `pasadas/d3_ui_b3_1..b3_5` (34 pantallas × 8 secciones del contrato de formato met:110-123), `pasadas/d3_ui_b4_1..b4_4` (auditorías), `pasadas/d3_ui_b5_auditor.md` (**APROBADO**: 100% pantallas · 100% gates con UI · roles×gates · 0 ambigüedad · UX destilado) y `pasadas/d3_ui_consolidado.md` (entregable final de Fase B).

**Verificación mecánica:** `git status --porcelain` confirma que **ningún pase tocó código vivo** (`app/`, `lib/`) — solo documentos en `arnes/`. La tarea de cada pase siguió el patrón de "solo escribe su archivo de salida".

**DECISION_PENDIENTE para el Supervisor — RESUELTO (2026-08-04):**
- DP-02 rol `compras` → **rol tipado dedicado**, gerente = suma de roles ✅
- DP-04 login del contador → **cuenta propia**, invitación con rol pre-asignado ✅
- H8 transparencia por rol → **permisos sumativos**, diseñador aislado, comercial ve sus proyectos + leads entrantes ✅
- H12 pedidos anónimos → **NO, cuenta obligatoria** para checkout; anónimo solo para agendamiento WP ✅
- DP-06 base de comisión → **subtotal sin IVA** ✅
- DP-09 alojador de docs → **Drive para SKP/SDK; R2 para imágenes exportadas** ✅
- DP-01 valores numéricos → **estimados dados** (comisión 5%, tarifa 15k/6.5k, reducción 0.5%/día, etc.); pendiente confirmación contador para retención e IVA diseño ✅
- Más las 9 del schema (sch_c §DP-01..09): 8 cerradas, 1 pendiente (DP-01 valores numéricos con estimados) ✅
- Validación del neto del diseñador con el contador → **pendiente** (retención diseñador + IVA diseño 3D) ✅

**Fronteras DIFERIDO que NO se construyen ahora (registradas, t-034/capa 2):** tienda (F-04/F-05/F-06), KPIs (P-32), testimonios (P-33), facturación DIAN (`facturas`), detalle interno del taller (`tareas_produccion`), subsistema de firma digital (wizard, no módulo).

**Próxima acción:** Confirmación de Supervisor sobre las 2 pendientes (A-01: `umbral_novedad_check15`, `recargo_hora_extra_pct`, `neto_diseno_3d_pct`, `iva_diseno_3d_pct`, marca) → Ola 7 (Execute) comienza con codificación de 34 pantallas + migración de schema en 4 fases.

## Fase 2, Ronda 3 — Decisiones respondidas (2026-08-04) → CHECKPOINT RESUELTO

**Contexto:** El Supervisor respondió las 16 DECISION_PENDIENTE de `d3_ui_consolidado.md` y `d3_schema_consolidado.md`. Respuestas sistematizadas en `diagnostico/pasadas/fase2_ronda3_decisiones_respondidas.md`.

**Veredicto:** 14 de 16 decisiones cerradas (2 pendientes de confirmación contable, no bloquean). 5 mini-diamantes abiertos (no bloquean corte).

**Decisiones cerradas (D-01 a D-14):**

| ID | Tema | Respuesta | Impacto |
|----|------|-----------|---------|
| D-01 | Rol `compras` | Rol tipado dedicado. Gerente = suma de roles (gerente + compras + otros). Personas se asignan roles; al cambiar de cargo, se reasignan. | `roles` tabla + fila `compras`, `personas_roles` N:N, `erp-nav.ts` módulo `compras`, gate E-20 |
| D-02 | Login contador | Cuenta propia con rol `contador`. Gerente (RRHH) crea invitación con rol pre-asignado; contador completa datos y crea password. | `usuarios` + `tokenInvitacion`, `/registro?token=`, `requireEmpleado` para P-23 |
| D-03 | Transparencia por rol (H8) | Permisos sumativos por rol asignado. Gerente ve todo. Comercial ve sus proyectos + leads entrantes (<5 min). Diseñador aislado solo a sus proyectos/clientes. | Nuevo rol `disenador`, `erp-nav.ts` filtrado por suma de roles, P-09/P-16/P-20 con aislamiento |
| D-04 | Checkout anónimo (H12) | No anónimo. Cuenta obligatoria para checkout. Anónimo solo para agendamiento WP (F-03). | F-06 requiere `requireCliente`, F-03 permanece público |
| D-05 | Base comisión (DP-06) | **Subtotal sin IVA**. La comisión es sobre el valor del trabajo, no sobre el impuesto. | Parámetro `base_comision_tamano = 'subtotal_sin_iva'`, P-22 muestra base de cálculo |
| D-06 | Alojador docs (DP-09) | Drive para SKP/SDK mobiliario. R2 para imágenes exportadas (JPG/espacio/módulo). Excel de herrajes eliminado → absorbido por pantalla del sistema con gate + catálogo. | `documentos_proyecto.alojador` enum, upload R2, pantalla definición de proyecto por espacios |
| D-07 | Valores numéricos compensación (DP-01) | Estimados dados como v1: comisión cierre 5%, módulo 5%, tarifa carpintero 15k COP/h, auxiliar 6.5k COP/h, reducción retraso 0.5%/día (máx 5%), etc. Pendiente confirmación contador para retención e IVA diseño. | `parametros` tabla con 10 claves, `parametros_historial` versionado, panel de administración |
| D-08 | Catálogo insumos vs producto (DP-05) | Metodología de grafos requerida. Entidades simples relacionadas: tabla de costos proveedores, catálogo productos/servicios, catálogo herrajes (compra + presentación), productos→colores→acabados, insumos→productos terminados. | Nuevas tablas: `catalogo_herrajes`, `productos_colores`, `productos_acabados`, `insumos_producto`. Mini-diamante M-02. |
| D-09 | Deprecación rolEmpleado (DP-03) | Migrar código existente al nuevo schema, no levantar de 0. Transición coordinada Fase 4. | `personas_roles` con backfill desde `usuarios.rolEmpleado`, deprecación gradual |
| **FLAG-4** | **Estructura catálogos: insumos vs producto vs herramienta** | **NO es columna `tipo` con enum.** Modelo axiomático: tabla base `productos_catalogo` (compartida) + 3 especializaciones 1:1 (`productos_tienda`, `materiales_insumos`, `herramientas_maquinaria`). Cada universo tiene campos/relaciones distintos: tienda = descripción_diseño + pedidos + margen; insumo = lote_mínimo + especificación técnica; herramienta = mantenimiento + marca + manual. | Todas las tablas en `d3_schema_consolidado.md` §5 (Compras) + `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` (especificación axiomática). t-075 las codifica en Ola 7. |
| D-10 | Determinismo causal E-33 (DP-04) | Metodología para determinismo con justificación humana natural. Verificador valida/rechaza composición causal con justificación textual. | `desfases_cronograma` + columnas `verificadoPor`, `verificadoEn`, `justificacion_rechazo`. Mini-diamante M-01. |
| D-11 | Grafos de composición (DP-05/schema) | Metodología de grafos para composición de entidades: insumo→producto→proyecto, herrajes como catálogo dual (compra + presentación). | Grafo implementado como relaciones FK en Drizzle. Mini-diamante M-02. |
| D-12 | Espejar parámetros en eventos (DP-07) | Logs robustos como sub-sistema de observabilidad. Cada cambio de parámetro, evaluación de gate, y acción de usuario → evento en `eventos`. KPIs derivan del log. | `eventos` tipos expandidos, sub-sistema KPIs, panel P-23 alimentado desde `eventos`. Mini-diamante M-04. |
| D-13 | Fuente SLA/holgura (DP-08) | Derivar del grafo de composición de proyecto. SLA y holgura no son valores sueltos sino consecuencia de módulos activos, dependencias, cantidad de espacios. | Mini-diamante M-03 (derivación de parámetros desde factores de proyecto). |
| D-14 | Marca/legal editable (DP-09/schema) | Panel de parametrización general en ERP, editable desde el logo. 6 claves de marca en `parametros`. | `/app/erp/configuracion` (nueva ruta), `parametros` con 6 claves de marca, `lib/seo/jsonld.ts` lee en tiempo real |

**Pendientes de confirmación (A-01 — no bloquean corte):**
- `umbral_novedad_check15`: unidad (días, horas, %). Estimado: ≥3 días.
- `recargo_hora_extra_pct`: revisar legal Colombia 2026.
- `neto_diseno_3d_pct`: ($130k − retención − IVA) → validar contador.
- `iva_diseno_3d_pct`: tasa IVA diseño (puede ser especial) → validar contador.
- Valores de marca (nombre, NIT, dirección, teléfono, horario): input del Supervisor.

**Mini-diamantes abiertos (no bloquean corte):**

| ID | Nombre | Sesión sugerida | Prepara | Bloquea |
|----|--------|-----------------|---------|---------|
| M-01 | Causalidad (E-33 determinismo) | Orquestador + Supervisor, 2h | Protocolo de auditoría de desfases | P-09 (cronograma doble) |
| M-02 | Grafos catálogo | Orquestador, 1h | Esbozo de modelo relacional insumo→producto→herraje | P-04 (cotizador), P-13 (compras) |
| M-03 | Derivación de parámetros | Supervisor + Orquestador, 1h | Tabla de factores que afectan comisiones | P-22 (compensación), gates E-31/E-35 |
| M-04 | Logging/KPIs | Orquestador, 2h | Diseño de `eventos` como observabilidad | P-23 (dashboard contador), gates E-18/E-21/E-24/E-33/E-20 |
| M-05 | Modularización | Supervisor + equipo producción, 3h | Inventario de procesos elementales del taller | P-16 (fila taller), P-18 (instalación) |

**Próxima acción:** Confirmación de Supervisor sobre A-01 → Ola 7 (Execute) comienza con codificación de 34 pantallas + migración de schema en 4 fases.

## Ola 6 — Cierre metodológico (2026-08-04) ✅ COMPLETA

**Qué se completó:**
- ✅ 16 decisiones del Supervisor sistematizadas + 9 cerradas
- ✅ 7 grafos relacionales diseñados y aprobados
- ✅ 5 gates validados contra schemas completos
- ✅ Subsistema de LOGS robusto (4 capas: core, agregación, KPIs, alertas)
- ✅ Documentación reorganizada: índice maestro + entrada única a Ola 7
- ✅ **Punto de entrada para Ola 7:** `arnes/diagnostico/OLA_7_ENTRADA.md` ← TODO COMIENZA AQUÍ

**Veredicto:** Ola 6 CERRADA sin bloqueadores. Ola 7 lista para ejecutar.

## Decisiones vigentes

- Stack: TypeScript en toda la pila. Next.js App Router. Drizzle ORM sobre la misma Neon.
- Sin motor schema-driven genérico.
- Tareas de riesgo alto o máximo pasan por checkpoint humano explícito antes de considerarse terminadas para producción real, aunque el commit en `dev` ya exista.
- Infraestructura de proveedores NO cambia.
- `main` no recibe push directo bajo ninguna circunstancia durante la migración.
- Ningún agente corre la app (`npm run dev`) ni prueba flujos de escritura mientras `DATABASE_URL` apunte a la Neon de producción compartida.
