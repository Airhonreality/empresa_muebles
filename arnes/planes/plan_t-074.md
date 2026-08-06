# Plan de Tarea: t-074

**Título:** Lógica de identidad y auditoría de F0 (roles, parámetros con historial, eventos y audit) sobre las tablas core ya migradas

**Fecha de creación:** 2026-08-05

---

## Objetivo

El ERP podrá gestionar por código, sin interfaz, los cimientos de identidad y auditoría de F0: un catálogo tipado de los 7 roles canónicos, la lectura y actualización de parámetros del negocio registrando cada cambio en historial append-only, y el registro de eventos del dominio (catálogo de 61 eventos) y de auditoría, todo contra las tablas core que ya existen en dev-local.

---

## Zona

**Zona afectada:** `datos`

---

## Tipo y Riesgo

**Tipo de tarea:** `logica_negocio`

**Riesgo calculado:** `alto`

**Frena al humano:** sí (checkpoint requerido al cerrar)

---

## Archivos Afectados

- `arnes/planes/plan_t-074.md` (crear — este plan)
- `lib/modules/f0/roles.ts` (crear — catálogo tipado de 7 roles + helpers)
- `lib/modules/f0/parametros.ts` (crear — leer/actualizar parámetros con historial append-only)
- `lib/modules/f0/eventos.ts` (crear — catálogo de 61 eventos + registrar evento y audit log)
- `lib/modules/f0/roles.test.ts` (crear)
- `lib/modules/f0/parametros.test.ts` (crear)
- `lib/modules/f0/eventos.test.ts` (crear)

---

## Criterios de Aceptación

1. Ejecutar `npx tsc --noEmit` y obtener 0 errores en todo el árbol.
2. Ejecutar `npx eslint .` y obtener 0 errores.
3. Ejecutar `DATABASE_URL=<dev-local> npx tsx lib/modules/f0/roles.test.ts` y obtener tests en verde: el catálogo contiene exactamente los 7 roles canónicos (`admin`, `comercial`, `desarrollador`, `compras`, `taller`, `finanzas`, `supervisora_qa`) y `esRolValido` acepta los 7 y rechaza un código inventado.
4. Ejecutar `DATABASE_URL=<dev-local> npx tsx lib/modules/f0/parametros.test.ts` y obtener tests en verde contra dev-local: `actualizarParametro` sobre una clave de prueba crea exactamente 1 fila nueva en `parametros_historial` con los valores anterior/nuevo correctos según el tipo del parámetro, actualiza el valor en `parametros` y actualiza `vigente_desde` y `updated_at` al momento del cambio. El test limpia sus propias filas de prueba al terminar (append-only es regla de la app, no del fixture).
5. Ejecutar `DATABASE_URL=<dev-local> npx tsx lib/modules/f0/eventos.test.ts` y obtener tests en verde contra dev-local: `registrarEvento` inserta en `eventos` y `registrarAuditLog` en `audit_logs`. El módulo `eventos.ts` NO exporta operaciones de update ni delete sobre `eventos`/`audit_logs` (verificación por grep).
6. Verificar por grep que `lib/modules/f0/eventos.ts` contiene los 61 códigos de evento del dominio (E-01..E-61), derivados de `arnes/diagnostico/diamante2_discover_eventos.md`, como constante tipada. Código `tipo_evento` fuera del catálogo se rechaza con error claro en `registrarEvento`.
7. Round-trip real de trazabilidad: ejecutar un query contra dev-local que devuelva la cadena completa de cambios de una clave de parámetro (anterior → nuevo, actor, motivo) leyendo `parametros_historial`, confirmando que el historial acumula en vez de reescribir.

---

## Comandos de Verificación que Aplican

```bash
npx tsc --noEmit
npx eslint .
DATABASE_URL='postgres://...dev-local...' npx tsx lib/modules/f0/roles.test.ts
DATABASE_URL='postgres://...dev-local...' npx tsx lib/modules/f0/parametros.test.ts
DATABASE_URL='postgres://...dev-local...' npx tsx lib/modules/f0/eventos.test.ts
```

> Los tests de F0 importan `lib/db/client.ts`; corren contra la rama `dev-local` (única base permitida). Nunca contra producción. Si un test solo necesita construir el cliente sin conectar, usar el placeholder documentado en `AGENTS.md`.

---

## Qué NO Incluye Este Plan

- No incluye: DDL ni migración nueva — las 8 tablas core ya existen en dev-local vía migración `0001`. Esta tarea NO modifica `lib/db/schema.ts` ni `drizzle/`.
- No incluye: UI de administración de identidad/parámetros (decisión del bucle F0: F0 = base de datos + lógica, SIN UI).
- No incluye: auth/sesión ni guards de ruta (entran en la fase que administre identidad, no en F0).
- No incluye: helpers de `personas`/`personas_roles` ni de `procedencia` — no tienen consumidor aún; se evita crear un campo muerto (lección `score_conversion`, I-005).
- No incluye: `tipo_evento` como enum de base de datos (decisión del bucle F0: text + validación en la app).
- No incluye: re-discutir las 4 decisiones cerradas del bucle F0.

---

## Preguntas Abiertas

No hay preguntas abiertas. Las 4 decisiones del bucle F0 (7 roles, `tipo_evento` text, sin UI, parámetros A-01 v1) ya las cerró el Supervisor el 2026-08-05.

---

## Aprobación del Plan

- **Revisor:** Javier (Supervisor)
- **Fecha de aprobación:** 2026-08-05
- **Estado:** pendiente

**Observaciones del revisor (si aplica):**

---

## Referencias

- Esquema de tarea: [ESQUEMA_TAREA.md](../tareas/ESQUEMA_TAREA.md)
- Estado del arnés: [estado.md](../estado.md) (sección "Bucle F0 (determinantes) VALIDADO")
- Catálogo de eventos: [diamante2_discover_eventos.md](../diagnostico/diamante2_discover_eventos.md) (61 eventos)
- Declaración de zonas: [AGENTS.md](../../AGENTS.md) (zona `datos`)
