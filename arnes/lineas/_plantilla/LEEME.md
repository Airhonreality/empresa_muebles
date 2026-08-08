# Cómo abrir una línea de trabajo nueva

Una línea nueva (ej. medición de Ads, RRHH, expansión) se abre así:

1. **Crear la carpeta** `lineas/<nombre>/` (nombre corto, sin espacios, en minúsculas).
2. **Escribir `lineas/<nombre>/estado_<nombre>.md`** — progreso de la línea. Formato mínimo: qué se sabe, qué está bloqueado, próxima acción permitida.
3. **Escribir `lineas/<nombre>/plan_<nombre>.md`** — el plan vigente de la línea (fuente única de sus decisiones). Si reemplaza o extiende un documento previo, decláralo en el encabezado (regla de sucesión).
4. **Crear `lineas/<nombre>/archivo/`** — vacía al inicio. Ahí van los borradores, pasadas de subagentes, destilaciones y documentos superados que produce ESTA línea, no la carpeta general.
5. **Registrar la línea en `lineas/REGISTRO_LINEAS.md`** — una fila nueva en la tabla.
6. **Si la línea necesita tocar `arnes/nucleo/`** (schema, lógica de negocio, vocabulario), lo propone ahí explícitamente — nunca duplica la entidad dentro de su propia carpeta.
7. **Si la línea necesita insertar pantallas**, las entrega como determinantes (qué pantalla, por qué, qué requisitos) y cita `lineas/ola7/pantallas/` como destino — el diseño completo (`PLANTILLA_PANTALLA.md`, 7 secciones) lo escribe la línea técnica cuando le llegue el turno, no la línea que lo pide.

**No hace falta más ceremonia que esta.** Una línea no necesita su propio `roles/` ni su propio ledger — esos son compartidos (`arnes/roles/`, `arnes/tareas/`).
