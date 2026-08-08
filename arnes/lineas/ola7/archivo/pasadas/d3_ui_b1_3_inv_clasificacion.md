# Pase B1-3 — Clasificación de investigaciones (subagente, loop de 3 iteraciones)

- **Lente:** clasificación de investigaciones (INV/INS) del humano
- **Carpeta auditada (solo lectura):** `C:\Users\javir\Documents\DEVs\Arnes natural\`
- **Ruta de salida:** `arnes\diagnostico\pasadas\d3_ui_b1_3_inv_clasificacion.md`
- **Fecha:** 2026-08-04
- **Rol:** sub-agente B1-3 del Diamante 3 (UI pública)

---

## Iteración 1 (bruta)

- `glob **/*` sobre la carpeta: **17 archivos** en total (15 en raíz, 1 en `renderz ch invs motores de render/`, 2 en `Proyectos/`).
- Se leyeron **todos** los archivos completos con la herramienta `read`.
- **6 archivos de 1-2 líneas con líneas >2000 chars** se leyeron con truncado de línea (`INS_Arnes agentico.md` 31.9 KB, `INS_ergonomía cognitiva…` 30.2 KB, `INS_Sistemas shcemas…` 35.6 KB, `INS_Mejores Prácticas de JSON-LD…` 28 KB, `INVS_diseño global…` 27.8 KB, `INS_Pantallas responsive…` 43.3 KB). Para no clasificar por nombre, se extrajeron **fragmentos por offset** de las secciones no vistas (matrices de diseño FR=A·DP, Universal Cart/UCP, WebMCP, paletas OI-2026/PV-2027, emociones Strategic Joy/Witherwill, gráficos de contexto, datos empíricos 70/30 de delegación) usando PowerShell con `-Raw -Encoding UTF8`.
- `INS_Accesibilidad y Usabilidad Universal…WCAG.md` resultó ser **0 KB (archivo vacío)** — verificada su longitud con `Get-ChildItem`. No se puede clasificar contenido (no existe).
- Con esto, la clasificación se basa en **contenido real**, no en títulos.

## Iteración 2 (autocrítica)

Relectura y reevaluación de los casos dudosos:

1. **`Proyectos/Curso bootcam IA.txt` vs `.md`:** el `.txt` (0.6 KB) es un subconjunto literal del `.md` (1.8 KB, lo mismo + diagramas de flujo y notas de proyecto). El `.txt` es redundancia pura → **DESCARTADA**; el `.md` conserva **REFERENCIA** por mencionar el "motor de cotización" (zona real del ERP) y el paradigma agencial terminal/llm.
2. **`Server providers.md.txt`:** el stack ya está fijado (Vercel + Neon + R2, según `AGENTS.md` y `arnes/estado.md`). No es decisión pendiente; es consulta puntual sobre límites (bundle 50 MB, timeout 10 s de Vercel Hobby) y optimización de bundle/cold start → **REFERENCIA**, no VALIOSA.
3. **`INS_Sistemas shcemas y disñeo axioamtico.md`:** el grueso (NRP, CQL categórico, grafos neuronales, embeddings) es teoría académica que **no aplica** al stack Drizzle/Neon, y parte roza el patrón schema-driven **prohibido**. Pero el núcleo de **Diseño Axiomático de Suh aplicado a esquemas** (matriz desacoplada FR=DP, descomposición, minimización de información) sí es aprovechable para el diseño de tablas Drizzle → **REFERENCIA** (principios extractables, sin validar el marco completo).
4. **`renderz ch invs motores de render/invs 1 rendez ch.txt`:** no es parte del alcance de la migración actual (ERP + tienda), pero la tienda pública de muebles premium podría usar renders IA de producto/ambientaciones (Material Variants, upscaling 4K) → **REFERENCIA** (candidato a feature futura, no al corte actual). No se descarta por ser "motor de render" ajeno: su patrón de arquitectura backend (cola + workers GPU + CDN) es consultable.
5. **`INVS_diseño global 2026-2027.md`:** no es ingeniería, es investigación de tendencias de consumo (moda/calzado/color). Para el ERP no aplica; para la tienda pública premium aporta **dirección de marca** (paleta, autenticidad, trazabilidad) pero sin patrones técnicos → **REFERENCIA** (marca/tienda), no VALIOSA de ingeniería.
6. **`INS_Arnes agentico.md`:** la parte que podría parecer redundante con `ARNES_AGENTICO.md` aporta **datos empíricos citables** (70% decisiones de planificación en humano / 80% de ejecución en agente; corrección de código roto 33%→19%; ratio de fallos atribuibles al arnés ~65%) → sube a **VALIOSA** porque refuerza con evidencia las reglas del arnés que alimentan B2-1.
7. **`INS_Accesibilidad…WCAG.md`:** 0 KB → **DESCARTADA por inleíble** (vacío). Se marca para que el humano decida si debe regenerarse: es el único candidato a aportar pauta WCAG y su ausencia deja un hueco de accesibilidad cubierto parcialmente por `INS_Pantallas responsive` (focus, hover, zoom) y `INVS_Calendar math` (ergonomía táctil).

## Iteración 3 (refinamiento final)

- Clasificación final consolidada: **7 VALIOSA / 5 REFERENCIA / 5 DESCARTADA** = 17 archivos.
- Se distingue **destino** de cada principio: **B2-1 (destilación)** = gobernanza agéntica + reglas de negocio + diseño axiomático de schema; **ERP interno** = ergonomía cognitiva, dashboards/tablas, calendar math, workspaces aislados; **TIENDA PÚBLICA** = SEO/JSON-LD, responsive + Core Web Vitals, marca/diseño global, render de producto con IA (opcional).
- Regla cumplida: nada se descartó por extensión/ubicación; las 5 DESCARTADAS lo son por contenido (vacío, duplicado, o temática fuera del dominio ERP+muebles).
- Regla cumplida: solo se escribió el archivo de salida; la carpeta `Arnes natural` permaneció intacta (solo lectura).

---

## Inventario completo clasificado

| Archivo | Clasificación | Tema | Razón de la clasificación | Principios extraíbles (si aplica) |
|---|---|---|---|---|
| `ARNES_AGENTICO.md` | **VALIOSA** | Arnés agéntico (documento maestro) | Fuente directa del `AGENTS.md` del proyecto (el proyecto ya lo implementó). Es la especificación canónica de gobernanza que B2-1 debe destilar; sin él el arnés del proyecto no tiene sustrato. | Modelo+Arnés; 5 roles con separación ejecutor/verificador; riesgo derivado no declarado; ledger por tarea; loop operativo plan→ejecución→QA mecánico→checkpoint humano; HarnessMutation (plan→dry→confirmación→backup); delegación proceso-por-tarea con criterio paralelismo-vs-costo; capas de seguridad; secretos nunca en archivos editables; reinicio de contexto higiénico. |
| `INS_Arnes agentico.md` | **VALIOSA** | Arnés agéntico — estado del arte 2025-2027 | Evidencia empírica que refuerza las reglas del arnés (ratios humano/agente, % de fallos atribuibles al arnés, historia de Codex/OpenAI). Fortalece la justificación de B2-1 con datos, no solo con precepto. | ~65% de fallos de agentes en producción son del arnés, no del modelo; distribución 70% planificación humana / 80% ejecución agente; corrección de código roto 33%→19% con arnés; desalineación instrumental (Pan/Berkeley, Machiavelli) como riesgo a gobernar; el arnés como disciplina de proceso (arquitectura determinista alrededor del razonamiento probabilístico). |
| `INS_ergonomía cognitiva para el diseño de experiencia.md` | **VALIOSA** | Ergonomía cognitiva y UX | Aporta el marco teórico de carga cognitiva (intrínseca/extrínseca), affordances, ley de Fitts y jerarquía visual que el panel admin del ERP necesita para reducir fricción. Aplicable directamente al ERP interno (y en menor grado a la tienda). | Minimizar carga extrínseca (presentación) y memorización; affordances de Gibson: la GUI sugiere su modo de uso; ley de Fitts (distancia y tamaño del objetivo) para zonas de acción; sensing→inference→adaptation como patrón de reconfiguración de UI; evitar sobrecarga de menús; workspaces que reduzcan la carga navegacional; la ergonomía como criterio de calidad de la interacción, no decoración. |
| `INS_Pantallas responsive y CSS.md` | **VALIOSA** | Diseño responsivo y CSS moderno | Práctica técnica de alto valor y concreta (código real CSS): aplica a tienda pública y a paneles del ERP (dashboards, tablas, sidebar). Es la INV con mayor densidad de patrones implementables tal cual. | CSS Grid `repeat(auto-fill, minmax(min(100%,300px),1fr))`; Container Queries con `container-type: inline-size` + `@container` y unidades cqw/cqh/cqi; degradación elegante con `@supports`; `subgrid` para alinear tarjetas; `clamp()` para tipografía/espaciado fluido con fórmula punto-pendiente; tokens `--spacing-*` fluidos; hover solo en `(hover:hover)` + equivalencia `:focus`/`:focus-within`; zonas táctiles 44/48 px y separación ≥8 px (fat-finger); tablas de datos: filas 48-52 px (cómoda) / 36-40 px (densa), números y fechas a la derecha, textos a la izquierda, etiquetas centradas, `overflow-x:auto` con primera columna fija en móvil (no colapsar filas a tarjetas); tarjetas KPI: número destacado 28-32 px, comparación secundaria 14 px, un sparkline máximo; sidebar 240-280 px fijo / riel de iconos 64 px / drawer inferior en móvil; Core Web Vitals: WebP/AVIF, LCP/CLS/INP; tráfico móvil 52-67%; Mobile-First Indexing de Google (completado 2023-10-31). |
| `INS_Mejores Prácticas de JSON-LD y SEO Técnico para 2026-2027.md` | **VALIOSA** | JSON-LD y SEO técnico (2026-2027) | Es la hoja de ruta semántica para la tienda pública: define exactamente qué esquemas estructurar (Organization, LocalBusiness, Product) y cómo adaptarse a búsqueda generativa, Universal Cart/UCP y WebMCP. Transferible de su laboratorio inmobiliario (Bogotá) al dominio muebles. | JSON-LD como infraestructura de comunicación máquina-a-máquina (AI Overviews, ChatGPT Search, Perplexity); esquemas fundacionales: Organization (grafo de conocimiento) + Article/BlogPosting (E-E-A-T); LocalBusiness con `areaServed` + `GeoCircle` (indexación S2, no Haversine) para cobertura local; esquema `Product` ya no basta para comercio: requiere UCP/Universal Cart (Google I/O 2026) para elegibilidad de botón de compra; WebMCP como protocolo de transporte hacia 2027; Core Web Vitals (LCP<2,5 s móvil, INP) como condición de citación por IA; rastreo de entidades no decorativas; evitar esquemas visuales depreciados (HowTo); metadatos NAP consistentes. |
| `INVS_Calendar math.md` | **VALIOSA** | Programación temporal / calendario en Next.js | Patrón técnico completo y listo para implementar en el ERP (agenda de producción, citas, plazos): resuelve hidratación de fechas en SSR y da el algoritmo de colisión de eventos. Es la única INV con solución end-to-end en Next.js (stack del proyecto). | Evaluación de librerías de fechas (API Temporal nativa ES2026 vs date-fns v4 vs Day.js vs Luxon; tamaño gzip, inmutabilidad, zonas horarias); almacenar eventos con `timezone` explícita y timestamp ISO; evitar mismatch de hidratación: Estrategia A cookie `x-user-timezone` + middleware de Next.js (formateo determinista en RSC); Estrategia B `suppressHydrationWarning` acotado al elemento + script inline síncrono (sin flash); algoritmo de layout de eventos solapados O(n log n): orden por inicio asc / duración desc, agrupación en clusters, distribución en columnas con colSpan; condición de colisión C(i,j) ⇔ S_i < E_j ∧ S_j < E_i; ergonomía responsiva: vista mensual → mini-calendario con puntos en móvil, agenda scroll en móvil, drawer en desktop / bottom sheet en móvil; hit target ≥44 px. |
| `zaps_engineering_metodologia.md` | **VALIOSA** | Reglas de negocio y diseño axiomático del ERP | Es la **memoria del negocio** del motor viejo que se reemplaza: los loops (compras, ingresos, nómina) y las invariantes de cálculo (matemática ciega, verificación humana) son REQUERIMIENTOS reales del nuevo ERP Veta de Oro. El motor se descarta; su conocimiento de dominio no. | Zap = "diodo de entropía": la matemática crítica siempre en el servidor, nunca en la UI; rastreabilidad absoluta (anular/compensar, jamás borrar un error); "matemática ciega": recalcular desde el origen (`saldo = Monto_Total − SUMA(abonos)`) para evitar race conditions; axioma de verificación humana: loops críticos (listado→orden de compra, cobro→desbloqueo de proyecto, nómina) requieren auditoría humana antes de automatizar el output; workspace aislados por rol (matrushka): Finanzas vs Producción; derivación de KPIs operativos (horas estimadas vs horas reales = fuga de tiempo); costo dinámico (horas reales) en vez de costo estático estimado; descripción semántica en los registros para entrenar al LLM; entidades puras por departamento (`proveedores`, `clientes`) con llaves limpias, rechazo del Party Pattern; poblado con datos reales en creación. |
| `INS_Sistemas shcemas y disñeo axioamtico.md` | **REFERENCIA** | Diseño axiomático de esquemas y grafo-relacional | El marco completo (NRP, CQL, embeddings, migración asistida por IA) no aplica al stack Drizzle/Neon y roza el schema-driven prohibido. Se conserva como consulta por su núcleo de diseño axiomático de Suh aplicable al schema del ERP. | Diseño axiomático de esquemas: matriz de diseño FR=A·DP con matriz diagonal desacoplada (cada requerimiento funcional con su parámetro, sin interferencias); descomposición jerárquica funcional→físico→proceso; minimización de información (complejidad proporcional a la densidad de datos); entidades/contratos puros con relación limpia; semántica (descripción del propósito de cada entidad) como infraestructura de datos; gráficos de contexto para linaje de decisiones. Usar con cautela: no automatizar el esquema desde diagramas. |
| `INVS_diseño global 2026-2027.md` | **REFERENCIA** | Tendencias de consumo y diseño global 2026-2027 | Investigación de marca (moda/consumo/color), sin patrones técnicos. Aporta dirección estética/emocional para la tienda pública premium, no para el ERP. | Emociones 2027: Strategic Joy (juego/dopamina) y Witherwill (simplificación de rutinas) como ejes de posicionamiento; consumidor entre certidumbre y desconexión; demanda de autenticidad tangible y trazabilidad radical; paleta OI-2026/27-PV-2027: bases telúricas (marrón, khaki, neutros desérticos) + acentos dopamínicos (azul eléctrico, lila curativo, verde bioluminiscente); color como terapia visual anti-estrés; competir con valor/experiencia, no solo precio. |
| `Server providers.md.txt` | **REFERENCIA** | Plataformas de despliegue (PaaS/serverless) | El stack ya está decidido (Vercel + Neon + R2). Útil como consulta puntual de límites de Vercel Hobby (bundle 50 MB, timeout 10 s) y de técnicas para reducirlos; no cambia ninguna decisión. | Conocer límites del plan Vercel Hobby (bundle ~50 MB, timeout 10 s) para dimensionar dependencias server; optimización de bundle/cold start: `next build` standalone, tree-shaking, minificación con esbuild (85 MB→<1 MB, init 2-5 s→~100 ms); alternativas documentadas (Railway, Render, Fly.io, Zeabur, SST v3+OpenNext, Coolify/Dokku/CapRover) si algún día el costo de Vercel Pro ($20/user) fuera bloqueante; TCO de auto-hosting supera a veces la nube gestionada por costes de telemetría/logging. |
| `renderz ch invs motores de render\invs 1 rendez ch.txt` | **REFERENCIA** | Motor de render IA de arquitectura (Renderz.ch) | No está en el alcance de la migración actual, pero es el blueprint de una feature plausible de la tienda pública (visualización de muebles/ambientaciones con IA). Se conserva como consulta de arquitectura. | Patrón de backend para generación IA: frontend Next.js + API Node + cola de tareas (RabbitMQ/SQS/Celery) + workers GPU (Docker/K8s) + almacenamiento/CDN + estado del job en BD; pipeline open-source replicable: Stable Diffusion + ControlNet (fidelidad de geometría) + Real-ESRGAN (upscale 4K); Material Variants = misma semilla con prompts distintos; flujo async con polling/WebSocket; validar licencias de modelos y derechos de assets (muebles 3D). |
| `Proyectos\Curso bootcam IA.md` | **REFERENCIA** | Paradigma agencial y flujos de proyecto (notas de curso) | Esqueleto de curso/notas personales; aporta la alineación conceptual con el arnés y menciona el "motor de cotización" (zona real del proyecto). Superficial, sin patrones técnicos. | Paradigma agencial: la IA usa terminal/librerías como servicios directos, sin UI humana; flujos LLM→terminal→librerías→resultado en loops/goals; el arnés como infraestructura de contexto; idea de "motor de cotización" como solución funcional a problema genérico (candidato a destilar en B2-1 para el módulo cotizador). |
| `deep research agent.txt` | **DESCARTADA** | Deep research soberano (SearXNG, crawl4ai, verificación de veracidad) | Infraestructura de investigación personal del humano, fuera del dominio ERP + tienda de muebles. Ningún principio aplica al producto. | — |
| `formateo pc recuepracion de data automatico.md.txt` | **DESCARTADA** | Prompt fuente de la investigación de deep research | Duplicado temático de `deep research agent.txt` (el prompt del que esa INV es resultado). No aplica al ERP. | — |
| `server less frontera.md.txt` | **DESCARTADA** | Paradigmas post-serverless (unikernels, WASM, DBOS) | El stack del proyecto ya está decidido y en producción (Vercel + Neon). Teoría de infraestructura sin decisión pendiente que la use. No aplica. | — |
| `Windows deboulating.md.txt` | **DESCARTADA** | Debloating/optimización de Windows | Tema ajeno al ERP y a la tienda (máquina del humano). Sin relación con el producto. | — |
| `Proyectos\Curso bootcam IA.txt` | **DESCARTADA** | Notas de curso (redundante) | Subconjunto literal del `.md` homónimo (0.6 KB vs 1.8 KB). Duplicado; el `.md` ya conserva la REFERENCIA. | — |
| `INS_Accesibilidad y Usabilidad Universal Un Análisis Integral de la Ingeniería de Software Inclusiva y los Estándares WCAG.md` | **DESCARTADA** | Accesibilidad / WCAG | **Inleíble por contenido vacío (0 KB).** No es descarte por tema (la accesibilidad es relevante): es descarte por inexistencia de contenido. Se marca para que el humano decida si regenerar la INV (hueco: pauta WCAG queda cubierta solo parcialmente por `INS_Pantallas responsive` y `INVS_Calendar math`). | — |

**Resumen:** 17 archivos clasificados → **7 VALIOSA / 5 REFERENCIA / 5 DESCARTADA**.

---

## Síntesis de principios VALIOSA por tema

### 1. Arnés agéntico (alimenta B2-1)
Fuentes: `ARNES_AGENTICO.md`, `INS_Arnes agentico.md`, `Proyectos/Curso bootcam IA.md` (REF).
- Agente = modelo (razonamiento probabilístico) + arnés (entorno determinista). El arnés es disciplina de proceso en texto plano, no software: no automatizar el método hasta repetirlo a mano en 2-3 proyectos (`ARNES_AGENTICO.md` §1, líneas 15-21).
- **~65% de los fallos de agentes en producción son fallos del arnés, no del modelo** (`INS_Arnes agentico.md`, offset 8715); un agente único declara "terminado" código con conexiones rotas; cuatro roles separados entregan producto funcional (mismo dato en `ARNES_AGENTICO.md` §1, línea 19).
- Cinco roles: Orquestador (no escribe código), Iniciador (plan con criterios mecánicamente verificables), Código (una sola zona), QA (evidencia mecánica, **ejecutor≠verificador**, presupuesto de 2 reintentos), Supervisor humano (único que aprueba, decide por resultado mecánico, no por narrativa) (`ARNES_AGENTICO.md` §3).
- Riesgo derivado de tabla, nunca autoasignado; lógica/datos/integraciones = alto → frena al humano; UI/andamiaje = bajo (`ARNES_AGENTICO.md` §4).
- Ledger con trazabilidad completa (un registro nunca se reescribe para ocultar error) (`ARNES_AGENTICO.md` §5).
- Loop: plan como archivo → ejecución acotada → autorrevisión → QA mecánico → checkpoint humano → cierre transaccional (`ARNES_AGENTICO.md` §6).
- Delegación: **proceso-por-tarea** en worktrees aislados; el valor de delegar debe poder etiquetarse como **paralelismo o costo**; regla de parada tras 3 chequeos vacíos; invariante: Supervisor estructuralmente humano (`ARNES_AGENTICO.md` §7, líneas 238-255).
- Gobernanza de mutaciones del arnés: plan → dry-run → confirmación humana → backup; secretos nunca en archivos editables; reinicio de contexto higiénico (archivar→consolidar→actualizar INDEX→reiniciar) (`ARNES_AGENTICO.md` §8-10).
- Datos empíricos de trabajo colaborativo: humano retiene ~70% de decisiones de planificación, agente ~80% de ejecución técnica; sesiones de corrección de código roto caen 33%→19% con buen arnés (`INS_Arnes agentico.md`, offset 8715).

### 2. Reglas de negocio del ERP (alimenta B2-1, fuente crítica: `zaps_engineering_metodologia.md`)
- **Matemática crítica nunca en la UI, siempre en el servidor** ("diodo de entropía") — §1, líneas 6-10.
- **Rastreabilidad absoluta:** un error humano se anula/compensa, jamás se borra; la auditoría queda intacta — §1.
- **Matemática ciega:** recalcular desde el origen (`saldo = Monto_Total − SUMA(abonos)`) para eliminar race conditions — §2 Fase C.
- **Axioma de verificación humana (Human-in-the-Loop):** un loop crítico (lista comercial → Orden de Compra; cobro → desbloqueo de proyecto; nómina → liquidación) obliga a que un experto audite/ajuste el input antes de automatizar el output — §1 y §4 (Loops 1-3).
- **Workspaces aislados por rol (matrushka):** encapsular dominios (Finanzas vs Producción) atados al rol → carga cognitiva casi cero — §2 Fase D.
- **KPIs derivados, no registros:** Horas Estimadas (costo teórico) vs Horas Reales (costo dinámico) = fuga de tiempo; reemplazar "costo estático estimado" por recolección dinámica de horas reales — §2 Fase A/D y §3.
- **Entidades puras por departamento** (`proveedores`, `clientes`) con llaves limpias; rechazo al Party Pattern; descripción semántica en cada registro para documentar/entrenar al LLM; poblar con datos reales al crear — §2 Fase B.

### 3. Diseño axiomático de esquemas (alimenta B2-1 con cautela; `INS_Sistemas shcemas…` REF)
- Matriz de diseño `FR = A·DP` con matriz **diagonal desacoplada**: cada requerimiento funcional asignado a un único parámetro de diseño, sin interferencias → cada entidad/contrato de Drizzle debe poder evolucionar sin perturbar a las otras (offset 28608 y §2).
- Minimización de información: complejidad proporcional a la densidad de datos del esquema.
- Semántica del propósito existencial de cada entidad como infraestructura (gráficos de contexto / `descripcion_semantica`), alineado con `zaps_engineering` §2 Fase B.
- **Advertencia del propio proyecto:** no automatizar esquemas desde diagramas ni usar NRP/CQL (schema-driven prohibido) — solo tomar el *método* de descomposición.

### 4. Ergonomía cognitiva y UX del ERP interno (`INS_ergonomía cognitiva…` VALIOSA; `zaps_engineering` §2 Fase D)
- Reducir **carga extrínseca** (la forma de presentar la interfaz) y no obligar a memorizar comandos: las affordances (Gibson 1966) hacen que la GUI sugiera su modo de uso (offset ~línea 1).
- Ley de Fitts: MT ∝ f(D, W) → agrandar objetivos y reducir distancias en acciones frecuentes del panel admin.
- El panel no es un gestor de registros: es un **panel táctico** con KPIs derivados y workspaces por rol (`zaps_engineering` §2 Fase D).
- Patrón sensing→inference→adaptation como referencia para adaptar la densidad de la interfaz a la fatiga del operador (offset 2-19).

### 5. Responsive + CSS moderno (tienda pública + ERP; `INS_Pantallas responsive y CSS.md` VALIOSA)
- Tráfico móvil 52-67% y **Mobile-First Indexing** de Google completado 2023-10-31: diseñar móvil primero (línea 1).
- `grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr))` para grids fluidos sin desborde (líneas 2-5).
- Container Queries (`container-type: inline-size` + `@container`, unidades cqw/cqh/cqi) con degradación `@supports` → componentes reutilizables (líneas 6-31).
- `subgrid` para alinear cabecera/cuerpo/pie de tarjetas sin JS; en datos dinámicos usar `grid-template-rows: auto` (líneas 32-46).
- Tipografía/espaciado fluido con `clamp()` y fórmula punto-pendiente; **hibridar vw con rem/em en calc()** para no romper el zoom de accesibilidad; tokens `--spacing-*` fluidos (líneas 47-50, tabla de tokens).
- Hover solo con `@media (hover:hover)` + `:focus`/`:focus-within` como equivalente; hit targets 44 px (Apple) / 48 px (Google); separación ≥8 px entre controles (fat-finger) (líneas 51-69).
- Tablas: filas 48-52 px (lectura) / 36-40 px (densa); textos a la izquierda, números y fechas a la derecha, estados centrados; móvil: `overflow-x:auto` con primera columna fija, **no** colapsar filas a tarjetas salvo prioridad móvil crítica (líneas 71+).
- Dashboard KPI: número destacado 28-32 px, comparación 14 px con color de estado, un solo sparkline (líneas 71+).
- Sidebar 240-280 px fijo → riel de iconos 64 px → drawer inferior en móvil (offset 36000).
- Rendimiento: WebP/AVIF, minimizar LCP/CLS/INP.

### 6. Calendar math (ERP interno; `INVS_Calendar math.md` VALIOSA)
- Elegir librería de fechas por bundle/inmutabilidad/timezone: API Temporal nativa (0 KB) → date-fns v4 (~13 KB) → Luxon (~23 KB) como alternativas según uso (línea 1).
- Persistir eventos con `timezone` explícita + timestamp ISO; no confiar en la zona del servidor (líneas 2-13).
- Hidratación en SSR: Estrategia A cookie `x-user-timezone` + middleware de Next.js (formateo determinista en RSC, líneas 30-66); Estrategia B `suppressHydrationWarning` acotado + script inline síncrono sin flash (líneas 67-103).
- Algoritmo de colisión O(n log n): ordenar por inicio asc / duración desc, agrupar en clusters por max-end, distribuir en columnas con colSpan; condición C(i,j) ⇔ S_i < E_j ∧ S_j < E_i (líneas 104-232).
- Ergonomía responsiva del calendario: mensual → mini-calendario con puntos en móvil; diario/semanal → agenda scroll en móvil; drawer (desktop) / bottom sheet (móvil); hit target ≥44 px (líneas 233+).

### 7. SEO / JSON-LD para la tienda pública (`INS_Mejores Prácticas de JSON-LD y SEO Técnico para 2026-2027.md` VALIOSA)
- JSON-LD = infraestructura de comunicación máquina-a-máquina (AI Overviews, ChatGPT Search, Perplexity, Generative UI), no rich snippets decorativos (sección 1).
- Esquemas fundacionales: `Organization` (grafo de conocimiento, identidad corporativa, NAP consistente) + `Article`/`BlogPosting` (señales E-E-A-T) (sección 2).
- Localización: `LocalBusiness` con `areaServed` + `GeoCircle` (Google indexa por celdas S2, no Haversine; neutralizar supresión en bordes de celdas) (sección 3).
- Comercio: `Product` solo ya no desbloquea elegibilidad de compra: **Universal Cart + Universal Commerce Protocol (UCP)** (Google I/O 2026) rastrea intención a través de Search/Gemini/YouTube/Gmail (sección 8.1).
- Hacia 2027: **WebMCP** como protocolo de transporte (agentes consultan esquemas a nivel de base de datos en vez de crawl del DOM) (sección 9.2).
- Core Web Vitals como condición de citación por IA: LCP < 2,5 s móvil, INP cumplido (sección 9.1).
- Aplicación práctica: laboratorio sobre el mercado de Bogotá (estratos, clusters comerciales) demuestra el método de modelado semántico; transferir el método al dominio muebles premium (secciones 4-8).

### 8. Marca / diseño global de la tienda pública (`INVS_diseño global…` REF)
- Emociones 2027 (Strategic Joy, Witherwill) y demanda de autenticidad/trazabilidad como ejes de posicionamiento de la marca de muebles premium (offsets 7073, 23414-25481).
- Paleta de transición 2026-2028: bases telúricas (marrón, khaki, neutros) + acentos dopamínicos (azul eléctrico, lila, verde bioluminiscente); color como terapia visual (offset 18584).

### 9. Arquitectura de render IA de producto (tienda pública, opcional; `renderz…` REF)
- Cola + workers GPU + CDN para generación asíncrona de renders; Material Variants con misma semilla; ControlNet para fidelidad geométrica; upscale Real-ESRGAN a 4K; validar licencias de modelos y de assets 3D (secciones 3, 5, 6).

---

## Distribución de principios por destino (para el Orquestador)

### → Alimentan B2-1 (destilación / arquitectura de la reescritura)
1. **Gobernanza agéntica:** el arnés completo (`ARNES_AGENTICO.md` §1-12 + datos empíricos de `INS_Arnes agentico.md`).
2. **Reglas de negocio del ERP:** matemática en servidor, rastreabilidad (anular no borrar), matemática ciega, verificación humana obligatoria en loops críticos, workspaces por rol, KPIs derivados, costo dinámico vs estático, entidades puras + semántica en registros (`zaps_engineering_metodologia.md` — **fuente de dominio innegociable**).
3. **Diseño axiomático de esquemas:** matriz desacoplada FR=DP, minimización de información, semántica del propósito de cada entidad (`INS_Sistemas shcemas…` — aplicar solo el método, no la automatización).

### → ERP interno (panel admin)
4. Ergonomía cognitiva: reducir carga extrínseca, affordances, ley de Fitts, paneles tácticos por rol (`INS_ergonomía cognitiva…`, `zaps_engineering` §2 Fase D).
5. Responsive de paneles: tablas densas con alineación por tipo de dato, KPI cards, sidebar 240-280/64/drawer, hover+focus, hit targets (`INS_Pantallas responsive…`).
6. Calendar math: módulo de agenda/producción con manejo de zonas horarias y algoritmo de colisiones (`INVS_Calendar math.md`).

### → TIENDA PÚBLICA (muebles premium)
7. SEO/JSON-LD: esquemas fundacionales + LocalBusiness/GeoCircle + Product con UCP + Core Web Vitals + preparación WebMCP (`INS_Mejores Prácticas de JSON-LD…`).
8. Responsive de la tienda: grid fluido, container queries, subgrid, clamp/tokens fluidos, imágenes WebP/AVIF, Mobile-First (`INS_Pantallas responsive…`).
9. Marca/diseño global: paleta telúrica+dopamínica, ejes emocionales y de autenticidad (`INVS_diseño global…`).
10. (Opcional/futuro) Render IA de productos y ambientaciones — blueprint `renderz…` (no bloquea el corte).

### → Consulta puntual (no destilar)
11. `Server providers.md.txt` (límites Vercel Hobby y optimización de bundle/cold start).
12. `Proyectos/Curso bootcam IA.md` (alineación conceptual del paradigma agencial).

### → Descarte documentado
13. `deep research agent.txt`, `formateo pc recuepracion de data automatico.md.txt` (investigación personal, fuera de dominio), `server less frontera.md.txt` (stack ya decidido), `Windows deboulating.md.txt` (ajeno), `Proyectos/Curso bootcam IA.txt` (duplicado del `.md`), `INS_Accesibilidad…WCAG.md` (**vacío de 0 KB** — hueco de accesibilidad a cubrir por otro medio).

---

## Notas para el Orquestador

1. **Total:** 17 archivos leídos y clasificados → **7 VALIOSA / 5 REFERENCIA / 5 DESCARTADA**.
2. **Hueco crítico detectado:** la única INV de accesibilidad/WCAG está **vacía (0 KB)**. La accesibilidad queda cubierta solo parcialmente (focus, zoom, hit targets en `INS_Pantallas responsive…` y `INVS_Calendar math.md`). Recomiendo: (a) pedir al humano regenerar esa INV, o (b) que B2-1 incluya una pauta de accesibilidad WCAG mínima (contraste AA, semántica HTML, teclado, focus visible) como decisión de arquitectura de UI.
3. **Cuidado con la prohibición del motor viejo:** `zaps_engineering_metodologia.md` describe el patrón "Zap/schema-driven" del Agnostic que está **prohibido** en el código nuevo. La regla de B1-3 es: destilar su **conocimiento de negocio** (reglas de cálculo, verificación humana, loops operativos) y **descartar su mecanismo de implementación** (zaps interpretados en runtime). Señalárselo explícitamente a B2-1 para que no arrastre el patrón prohibido.
4. **Aplicación selectiva del diseño axiomático:** de `INS_Sistemas shcemas…` solo extraer el método (independencia funcional, entidades puras, semántica); ignorar NRP/CQL/embeddings (teoría sin aplicación en Drizzle/Neon).
5. **Trazabilidad:** todas las citas de la síntesis remiten al archivo fuente; las de archivos de una sola línea se referencian por offset de caracteres (no hay números de línea) — ver Iteración 1.
6. **Nada en `Arnes natural` fue modificado** (solo lectura). El único archivo escrito por este sub-agente es el presente documento.
