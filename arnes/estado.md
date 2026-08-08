# Estado del proyecto — dashboard

Este archivo se lee al arrancar cualquier sesión. Es un dashboard corto: en qué fase está cada línea de trabajo activa, ahora mismo. El detalle cronológico completo vive en el `estado_<linea>.md` de cada línea — no se duplica acá.

**Índice de líneas:** `arnes/lineas/REGISTRO_LINEAS.md`.

---

## Línea técnica (Ola 6/7: ERP + Sitio)

**Estado:** F0–F7 con diseño/plan aprobado. **F8 (Hardening/Integraciones) es la fase abierta** — sin plan todavía. F9 (QA + corte) pendiente.

**Próxima acción permitida:** abrir el bucle de diseño F8 (hardening): enums aditivos + backfill de datos existentes, deprecación `rolEmpleado`→`personas_roles`, integraciones diferidas (Viewer 3D). Usa `arnes/lineas/ola7/tecnico/PLANTILLA_HARDENING.md`.

**Detalle completo:** `arnes/lineas/ola7/estado_ola7.md`.

---

## Línea de demanda (captación, conversión, marca)

**Estado:** v3 del marco, sin aprobar. Bloqueada esperando al Supervisor — falta aprobar alcance, credenciales de solo lectura (Ads/GA4/Search Console), informe de sector y checkpoint del schema para el Bloque A.

**Próxima acción permitida:** ninguna hasta que el Supervisor apruebe el alcance (`plan_demanda.md` §5). En paralelo, `plan_estructura_sitio_publico.md` ya dejó determinantes listos para cuando el bucle F7 de la línea técnica llegue a F-09..F-13.

**Detalle completo:** `arnes/lineas/demanda/estado_demanda.md`.

---

## Artefactos canónicos del arnés (leer al arrancar)

1. `AGENTS.md` — zonas, prohibiciones, comandos
2. `estado.md` — este archivo
3. `INDEX.md` — índice de contexto activo
4. `MODELOS.md` — stack de modelos free
5. `nucleo/REGISTRO_DE_ENTIDADES.md` — schema canónico compartido (~60 entidades)
6. `nucleo/logica_de_negocio.md` — mapa de negocio compartido
7. `nucleo/glosario_h07.md` — vocabulario de UI compartido
8. `ESTRUCTURA_OUTPUT_PRE_CODIGO.md` — gate de salida a código (línea técnica)
9. `lineas/REGISTRO_LINEAS.md` — qué líneas de trabajo existen y qué producen

## Decisiones vigentes (aplican a todas las líneas)

- Stack: TypeScript en toda la pila. Next.js App Router. Drizzle ORM sobre la misma Neon.
- Sin motor schema-driven genérico.
- Tareas de riesgo alto o máximo pasan por checkpoint humano explícito antes de considerarse terminadas para producción real, aunque el commit en `dev` ya exista.
- Infraestructura de proveedores NO cambia.
- `main` no recibe push directo bajo ninguna circunstancia durante la migración.
- Ningún agente corre la app (`npm run dev`) ni prueba flujos de escritura mientras `DATABASE_URL` apunte a la Neon de producción compartida.
- **El código de las PoC del Diamante 4 (PoC 1/2/3/3.1, t-098/t-099) es prueba de concepto de estética/tokens/interacción únicamente.** Ninguna referencia puede citarlo como evidencia de que una pantalla de negocio "existe" o está aprobada — la única fuente de aprobación de pantalla es un `disenio_PXX.md`/`disenio_FXX.md` con checkpoint del Supervisor (decisión 2026-08-08).
- **Matryoshka por línea de trabajo (2026-08-08):** `nucleo/` es la verdad de negocio compartida; cada línea (`lineas/<nombre>/`) tiene su propio progreso, plan, y archivo histórico. Ver `lineas/_plantilla/LEEME.md` para abrir una línea nueva.
