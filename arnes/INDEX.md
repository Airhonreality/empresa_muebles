# Índice de contexto — Arnes

Este índice se mantiene corto a propósito. Existe para que un agente sepa qué leer al arrancar, sin cargar el proyecto entero a su memoria de trabajo.

**Regla de oro:** borrar lo obsoleto, no acumularlo. Cuando algo deja de ser cierto, se borra. No se marca obsoleto y se deja ahí.

## ℹ️ Nota sobre trazabilidad

Para un **mapa completo de todos los archivos** (vigente + histórico + obsoleto), ver `arnes/diagnostico/_INDICE_MAESTRO.md`. Este INDEX es entrada rápida (vigente); el maestro es trazabilidad del viaje completo.

## Contexto activo

Lee en este orden:

### 1. AGENTS.md
Declara las zonas del proyecto, sus dueños, y qué sí/qué no se puede hacer en cada una. Es la ley del arnés.

### 2. arnes/estado.md
Dónde estamos ahora. Mapeo sistémico del negocio (Double Diamond) convergido e integrado; **Fase 2 (diamante de solución: schema/UI/automatizaciones de capa 1) recién abierta**.

### 3. arnes/diagnostico/
Carpeta destino de los hallazgos del mapeo. Orden de lectura para entender el negocio:
1. `logica_de_negocio.md` — el mapa maestro (Parte I: negocio, Parte II: implicaciones técnicas). **Documento 1.**
2. `segunda_ronda_preguntas.md` — banco de preguntas + respuestas crudas de Javier (21, todas respondidas).
3. `cierre_diamante.md` — convergencia del Define (tesis, invariantes, bounded contexts, capacidad).
4. `loop2_y_retroalimentacion.md` — hallazgos de profundidad + el loop metodológico + su ejecución (PARTE C, trazabilidad 1:1).
5. `log_insights_fase2.md` — log acumulativo de hallazgos de Fase 2 que retroalimentan el proceso (se integra en el checkpoint de cada módulo).
6. `diamante2_discover_eventos.md` — **Discover del segundo diamante (Fase 2)**: inventario de **61 eventos** del sistema destilados del mapa (43 originales + 4 del loop de apertura + 14 del ciclo de pasadas). En diverge, previo al Define.
7. `diamante2_loop_apertura.md` — **loop de apertura del Discover** (segunda pasada de auditoría): 4 adiciones, 6 refuerzos, 6 vacíos de información. Leerlo como complemento del inventario.
8. `pasadas/diamante2_panorama_consolidado.md` — **ciclo de pasadas sistémicas orquestadas con subagentes (P2-P8)** sobre el inventario: 61 hallazgos únicos (P2-P7) + **12 de la 7ª pasada (P8, lente del fallo)**, agrupados en 10 familias + sección P8. **Aplicado al inventario (47→61 eventos)**; las decisiones estructurales quedaron resueltas (I-034 cronograma doble, I-035/I-043 verificador único sin conflicto). **La metodología aprobó abrir el Define.**
9. `diamante2_define_eventos.md` — **Define del segundo diamante (Fase 2), convergido y APROBADO por el Supervisor (2026-08-03)**: los **61 eventos** se agrupan en **15 bounded contexts** (12 del cierre + 3 nuevos: Marketing/Demanda, Tienda web, Gobierno/Medición), con dueños de gates decididos (E-18/E-21/E-23/E-33), enforcement como máquina de estados con guard + rama negativa (E-54), modelo rol-vs-persona como precondición, e interfaces entre contextos. **Auditado por el ciclo C1-C6** (`pasadas/diamante2_define_consolidado.md`): convergencia estructuralmente estable (0 PARTIR/MOVER_CONTEXTO, 61/61 eventos con hogar, 0 contradicciones silenciosas), correcciones documentales aplicadas. **Checkpoint del Supervisor APROBADO (2026-08-03)** — todas las decisiones del Bloque C/B2/D + P5-09 respondidas y aplicadas (B2 fila del taller en capa 1; adelanto sancionado; granularidad módulo + rastreo de origen; `recibido_verificado`; gate de caja bloqueante con gerente; verificador único = comercial; KPIs por subsistema; VACÍOs resueltos; P5-09 al mapa). **Loop 2 de diseño (schema/UI) ABIERTO** — los 6 valores numéricos configurables quedaron resueltos el 2026-08-03 (SLA 5min→LLM/segundo comercial, aviso gerente 12 días, lead no viable se pierde, SLA novedad registro+escalación, carpintero 5% por tamaño, neto diseñador parámetro configurable); solo la retención real del diseñador se valida con el contador antes del corte.
8. `marco_estrategia_mercado.md` — demanda: captación, conversión y sistema de marca (H1-H8, la palanca de código del embudo y del sitio). Ver §5.
9. `destilacion_docs_veta.md` — **destilación controlada de `DOCS VETA DORADA`** (contexto de sesiones previas del humano: Google Ads real, auditorías, marca, tono, tokens). **Destilación cerrada: los 5 pases completos**, 36 archivos, ~2.700 líneas, 24 insights al log. Contiene el bloqueador de corte a producción (I-011), el NAP real confirmado, y el hallazgo de fondo: **el plan del 2026-07-02 especifica las mismas correcciones que este diagnóstico encontró desde cero — no falta análisis, falta ejecución.**
10. **`fase2_ronda3_decisiones_respondidas.md` (NUEVO, 2026-08-04)** — sistematización de las **16 decisiones pendientes** del Diamante 3 (Fase B, schema y UI). **9 decisiones cerradas** (roles tipados, comisiones, parámetros, onboarding, documentos). **5 mini-diamantes abiertos** que requieren metodología (determinismo causal, grafos catálogo, derivación de parámetros, logging/KPIs, modularización carpintería). **2 aclaraciones pendientes** (parámetros específicos). Documento de referencia para el Execute.
11. **`PROXIMA_FASE_DEFINE.md` (NUEVO, 2026-08-04)** — arquitectura de la Ola 7 (Execute): checklist de aprobación, plan de codificación por zona (10 zonas en paralelo), plan de codificación por familia de pantallas (5 familias), migración de datos (4 fases), hardening. Responsable por cada fase, timing, verificación.
12. `auditoria_neon.md`, `inventario_legacy.md` — hallazgos de la Fase 0 técnica (pre-mapeo).

### 4. arnes/planes/
Planes de arquitectura. El plan de la arquitectura destino (`plan_arquitectura_destino.md`) fue aprobado; la Parte II del mapa define qué módulos entran a diseño en Fase 2.

### 5. Línea de demanda — reglas de operación (t-034)
Línea **paralela** a la Fase 2 técnica, abierta el 2026-08-03. Ataca la restricción #2 del negocio (demanda, ratio 4:1). **Objetivo:** más leads cualificados reales → más ventas → comercial visitando clientes en forma.

- **Estado: v3, sin aprobar.** Nada arranca hasta que el Supervisor apruebe alcance (§8 del marco), entregue la ruta de su carpeta, credenciales de solo lectura, datos NAP y su informe de sector.
- **Seis ramas paralelas**, no fases: R1 captación · R2 sitio y contenido · R3 lead y cualificación · R4 flujo comercial · R5 sistema de marca y tono · R6 ad management agentivo. **R6 está bloqueada por H1/H2/H3/H5** — sin verdad de terreno, un agente optimizando campañas amplifica el error.
- **No es investigación de mercado, pero tampoco es solo métrica de embudo** (dos correcciones del Supervisor, registradas en §0 del marco). Es diagnóstico de activos que ya existen: sitio, contenido, flujo comercial, marca.
- **H1-H8 verificados en código**, destilados al `log_insights_fase2.md` como I-005 a I-010. **H1-H3 y H7 tocan el schema — checkpoint propio obligatorio.**
- **Líneas de servicio I-014 (restauración de pisos) e I-021 (B2B por m²) asignadas a esta línea** (decisión D7 del Supervisor, 2026-08-03) como log de alcance.
- La carpeta de contexto previo del Supervisor **ya no está sellada**: entra de primera, ruteada por rama (SEO→R1/R2, marca→R5, negocio→contraste). Regla permanente: **cuando el material previo contradiga al comportamiento medido, gana el comportamiento.**
- **Ninguna escritura a la cuenta de Google Ads sin checkpoint explícito** — es plata real, mismo criterio que t-015.

## Archivado

Vacío.
