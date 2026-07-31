# Estado del proyecto

Este archivo se lee al arrancar cualquier sesión y se actualiza al cerrar cada tarea o al reiniciar contexto.

## Resumen

Rama `dev` huérfana (worktree `../empresa_muebles_clone-dev`), sobre el MISMO repo/Neon/R2/Vercel de producción. Fase 0 (diagnóstico) cerrada. Se corrigió el enfoque inicial (que proponía repo/infra nuevos) por decisión explícita del Supervisor: todo vive en `empresa_muebles_clone`, con `main` intacto hasta el corte final y `legacy-agnostic-backup` como snapshot de seguridad. Se entregó un plan de arquitectura de destino (`arnes/planes/plan_arquitectura_destino.md`) pendiente de aprobación. No se ha escrito código de producto todavía.

## Última sesión cerrada

**Fecha:** 2026-07-31

**Qué se hizo:**
- Fase 0 cerrada: t-001 (auditoría Neon: 0 duplicados/huérfanos, 6/7 contratos sin `hitos_pago` por ser previos al fix del día, 0 clientes duplicados) y t-002 (inventario de 15 módulos, 33 namespaces, ~28 zaps, 5 patrones de arquitectura a no repetir con evidencia real, 12 zonas grises).
- Corregido el modelo de infraestructura: se descartó crear repo/Neon/R2/Vercel nuevos (`empresa_muebles_v2` queda abandonado). Se creó `legacy-agnostic-backup` (snapshot de `main` en `fbe9bdd`) y se recreó `dev` como rama huérfana en worktree separado, tras confirmar con el Supervisor que la `dev` vieja no tenía commits únicos (0 vs 65 de diferencia con `main`) y borrarla.
- t-004 marcada obsoleta (ya no hace falta provisionar infraestructura).
- Se entregó `arnes/planes/plan_arquitectura_destino.md`: organización de carpetas (`(publico)` / `cuenta` / `app/erp` como tres superficies separadas), modelo de autenticación multiusuario (tabla `usuarios` separada de `clientes`, destino post-login por rol, tabla `direcciones` propia), modelo de datos Drizzle (namespaces del legacy → tablas relacionales, `hitos_pago` deja de ser JSON embebido), y subsistema SEO del sitio público.

**Qué quedó pendiente:**
- Aprobación del Supervisor sobre `plan_arquitectura_destino.md`, incluyendo 4 preguntas abiertas explícitas (env vars de Preview en Vercel, modelo de roles, autoregistro de clientes sí/no, qué hacer con los 6 contratos sin `hitos_pago`).
- t-003 (auditoría R2) sigue `[SOLO_HUMANO]` — no resuelta.
- Los 12 puntos grises del inventario (sección 5) siguen sin que el Supervisor decida cuáles son basura y cuáles hay que preservar/investigar más.

**Decisión tomada:**
- Mismo repo, mismo Neon, mismo Cloudflare R2, mismo proyecto Vercel. La migración es de código de aplicación, no de proveedor de infraestructura. Motivo: cero riesgo de migración de datos (no hay dos bases de datos que puedan desincronizarse), y el corte final es un merge de git, no un cambio de DNS/dominio.
- Flujo de ramas: `main` (producción, intacta) ← merge manual aprobado ← `dev` (huérfana, arquitectura nueva) en worktree separado. `legacy-agnostic-backup` como snapshot de retorno.
- Migración TOTAL pero limpia: no se copian bugs ni basura acumulada. Ver `plan_arquitectura_destino.md` para el modelo de datos y auth nuevos.

## Próxima acción permitida

Esperar la aprobación (o correcciones) del Supervisor sobre `arnes/planes/plan_arquitectura_destino.md` y respuestas a sus 4 preguntas abiertas. Ningún agente escribe código de producto hasta esa aprobación explícita, ni siquiera andamiaje de Next.js/Drizzle.

## Decisiones vigentes

- Stack: TypeScript en toda la pila. Next.js App Router. Drizzle ORM sobre la misma Neon.
- Sin motor schema-driven genérico. Motivo: causa raíz de la deuda que motivó esta migración (ver sección 4 de `arnes/diagnostico/inventario_legacy.md`).
- Todas las tareas de riesgo alto o máximo pasan por checkpoint humano explícito. No hay fast-track.
- Infraestructura de proveedores (Neon, Cloudflare R2, GitHub, Vercel) NO cambia — mismo repo, mismas credenciales ya configuradas en Vercel.
- `main` no recibe push directo durante la migración. Todo el trabajo ocurre en el worktree de `dev`.
