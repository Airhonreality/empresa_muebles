# Estado del proyecto — dashboard

Este archivo se lee al arrancar cualquier sesión. Es un dashboard corto: en qué fase está cada línea de trabajo activa, ahora mismo. El detalle cronológico completo vive en el `estado_<linea>.md` de cada línea — no se duplica acá.

**Índice de líneas:** `arnes/lineas/REGISTRO_LINEAS.md`.

---

## Línea técnica (Ola 6/7: ERP + Sitio)

**Banda F0–F9 CERRADA** (2026-08-08, checkpoint Supervisor). Todos los planes de diseño aprobados; QA documental pasó 10/10 condiciones; 17 pantallas alineadas a PLANTILLA_PANTALLA; 5 gates con predicados; glosario H07 completo.

**F10 — Prototipo con mocks (ABIERTA).** Plan aprobado: prototipado real de las pantallas con subsistema de datos mock controlado, antes de migraciones. Feedback de uso → hallazgos → cambios de diseño/gates/schema → migraciones reales al final.

**B1 (Kanban Comercial + Cotizador) — CERRADO (2026-08-09).** 3 pasadas de auditoría completadas: POC-15 (duplicar variante, presupuesto adicional, ImagePicker), POC-16 (jerarquía espacio→variante, ojo visibleEnPropuestaPublica, punto referencial, detalles con miniatura, ImagePicker generalizado), 3ª pasada (limpieza schema `descripcionAlternativa`, activación en header, kanban compacto, responsive móvil, patrón A.10 en M-06). Verificación mecánica: `tsc --noEmit` 0, `eslint .` 0, 29/29 tests mock-store. Checklist: `arnes/lineas/ola7/tecnico/checklist_requisitos_b1_cierre.md` (30/34 cumplidos).

**B2 Lotes A/B (F3 cronograma/gates) — CERRADO (2026-08-09, POC-17).** 7 pantallas (P-06..P-12), navegación conectada. Lote C (kanban P-01 rediseño) diferido a revisión de Javier.

**Lote F5/F6/F-02/F-03/F-07 — CERRADO (2026-08-09, POC-18).** 11 pantallas más (taller/calidad/instalación/entrega/garantía/finanzas P-16..P-23, catálogo P-27, tienda F-02, portafolio F-03) + F-07 portal cliente con auth real (`iron-session`, no mock) + P-03/F-08 (solo-lectura cotizador/propuesta pública). Desde este lote los sub-agentes usan `opencode run` + modelos Zen free en vez del Agent tool de Claude (conservar rate limit). Verificación: tsc/eslint 0 errores, 78/78 tests, build 27/27 rutas. Detalle: `arnes/lineas/ola7/tecnico/registro_hallazgos_poc4.md` POC-18. Nada commiteado. **Pendiente: revisión de Javier sobre el prototipo; Lote C de B2 (kanban P-01) sigue diferido.**

**Próxima acción permitida:** ninguna de código hasta que Javier revise el prototipo actual (B1+B2+este lote) en vivo. Si aprueba, siguiente foco es Lote C (kanban P-01) o el resto de pantallas F10 aún sin capa de datos.

**Detalle completo:** `arnes/lineas/ola7/estado_ola7.md`.

---

## Línea de demanda (captación, conversión, marca)

**Estado:** v3 del marco, sin aprobar. D2-D5 cerradas (2026-08-08, ver `plan_demanda.md` §1). Bloqueada esperando al Supervisor — falta aprobar alcance, credenciales de solo lectura (Ads/GA4/Search Console, ver t-110 [SOLO_HUMANO]), informe de sector, checkpoint del schema para el Bloque A (ver t-111), y decisión de eslogan D1 (ver t-112).

**Próxima acción permitida:** ninguna hasta que el Supervisor apruebe el alcance (`plan_demanda.md` §5). En paralelo, `plan_estructura_sitio_publico.md` ya dejó determinantes listos para cuando el bucle F7 de la línea técnica llegue a F-09..F-13. D2/D3/D5 ya no bloquean esas pantallas.

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
