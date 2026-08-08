# Índice de contexto — Arnés

Este índice se mantiene corto a propósito. Existe para que un agente sepa qué leer al arrancar, sin cargar el proyecto entero a su memoria de trabajo.

**Regla de oro:** borrar lo obsoleto, no acumularlo. Cuando algo deja de ser cierto, se borra. No se marca obsoleto y se deja ahí.

**Estructura del arnés (2026-08-08 — matryoshka por línea de trabajo):** el arnés ya no es una sola línea. `arnes/nucleo/` es la verdad de negocio compartida; `arnes/lineas/` contiene una carpeta por línea de trabajo activa (técnica, demanda, futuras), cada una con su propio progreso, sus propios bucles y su propio archivo histórico. Ver `arnes/lineas/REGISTRO_LINEAS.md` para el índice de líneas.

## ℹ️ Nota sobre trazabilidad

Para el mapa completo del viaje histórico de la línea técnica (Discover→Define, pasadas P2-P8/C1-C6, trazabilidad punto-0), ver `arnes/lineas/ola7/archivo/`. `arnes/lineas/ola7/archivo/_INDICE_MAESTRO.md` es un mapa previo a la reestructuración — sus rutas están desactualizadas, se conserva solo como referencia de qué archivos existieron, no de dónde están hoy.

## Contexto activo

Lee en este orden:

### 1. AGENTS.md
Declara las zonas del proyecto, sus dueños, y qué sí/qué no se puede hacer en cada una. Es la ley del arnés.

### 1.b arnes/MODELOS.md
**Regla canónica de modelos (contrato vivo).** Modelos free verificados, intercalación opencode/zen + OpenRouter.

### 1.c arnes/nucleo/ — la verdad de negocio compartida (contrato vivo, cualquier línea puede proponerle cambios)
- `REGISTRO_DE_ENTIDADES.md` — **Canon raíz del schema.** ~60+ tablas en una vista, con nombre canónico, función de negocio y relaciones. **Si difiere de cualquier otra fuente, gana este.**
- `logica_de_negocio.md` — el mapa maestro del negocio (Parte I: negocio, Parte II: implicaciones técnicas), con el mermaid de gates embebido. **Documento 1** para entender el negocio desde cero.
- `glosario_h07.md` — vocabulario de UI: 36 entidades, ~70 estados, ~73 verbos, mapeo campo-schema→nombre natural. Consumir ANTES de escribir labels en cualquier pantalla.

### 1.d arnes/ESTRUCTURA_OUTPUT_PRE_CODIGO.md
**Gate de salida a codificación (contrato vivo).** Inventario completo de artefactos pre-código de la línea técnica, checklist de 10 condiciones para salir de F0–F9, proceso de actualización de `nucleo/REGISTRO_DE_ENTIDADES.md`.

### 2. arnes/estado.md
Dashboard corto: en qué fase está cada línea activa, ahora mismo. El detalle cronológico de cada línea vive en su propio `estado_<linea>.md` (ver abajo).

### 3. arnes/lineas/ — líneas de trabajo paralelas

**Índice:** `arnes/lineas/REGISTRO_LINEAS.md` (1 fila por línea: estado, qué produce, dónde escribe). Para abrir una línea nueva, usar `arnes/lineas/_plantilla/LEEME.md`.

#### 3.a `lineas/ola7/` — Ola 6/7: ERP + sitio (schema, pantallas, hardening, QA)

- `estado_ola7.md` — progreso detallado de esta línea (lo que antes era la mayor parte de `estado.md`).
- `plan_ola7_maestro.md` — contrato maestro F0–F9.
- `plan_alineacion.md` — doctor de esta línea (diagnóstico de desalineación de referencias).
- `plan_rediagnostico.md` — propuesta de reestructuración física, DIFERIDA (ver su §0.b).
- `plan_f4.md`..`plan_f7.md` — hallazgos y decisiones compiladas por fase.
- `destilacion_f3_publico.md` — fuente activa de F-08 (propuesta pública), no archivar hasta que se construya.
- **`pantallas/`** — diseños F2–F7 (`PLANTILLA_PANTALLA.md` + todos los `disenio_PXX.md`/`disenio_FXX.md`).
- **`tecnico/`** — salidas de datos F0/F1/F8/F9, no son pantallas (`plan_t-074.md`, `plan_t-075.md`, `plan_t-080.md`, `PLANTILLA_HARDENING.md`, `PLANTILLA_QA.md`, `m06_capa_tecnica_transversal.md`).
- **`archivo/`** — histórico: rondas de preguntas a Javier, diamante2 discover/define, pasadas P2-P8/C1-C6, trazabilidad punto-0, metodología OLA_6/7, Tercer input humano (diferido). Se lee para entender cómo se llegó a una decisión, no para decidir.

Detalle de pantallas por fase (cita rápida, el archivo vive en `pantallas/`):
- **F5** (Taller/Calidad/Entrega/Garantía): `disenio_P16_fila_taller.md`, `disenio_P17_calidad_gate.md`, `disenio_P18_instalacion.md`, `disenio_P19_acta_entrega.md`, `disenio_P20_garantia.md`
- **F6** (Finanzas): `disenio_P21_caja.md`, `disenio_P22_obligaciones.md`, `disenio_P23_cuentas_cobro.md`
- **F7** (Sitio Público/Frontstage): `disenio_F02_tienda_web.md`, `disenio_F03_portafolio_proyectos.md`, `disenio_F07_portal_cliente.md`, `disenio_F08_propuesta_publica.md`

#### 3.b `lineas/demanda/` — captación, conversión, marca (marketing/estrategia, sin código)

- `estado_demanda.md` — progreso de esta línea.
- `plan_demanda.md` — fuente única de la línea de demanda (Bloques A-F).
- `plan_estructura_sitio_publico.md` — entregable que inserta determinantes de pantalla en `lineas/ola7/pantallas/` (F-09..F-13, pendientes de diseñar ahí).
- `archivo/` — `destilacion_docs_veta.md` ("segundo input": DOCS VETA DORADA — marca/SEO/tono), `marco_estrategia_mercado.md`.

### 4. arnes/roles/
Contratos de los 5 roles (orquestador, iniciador, código, QA, supervisor). Compartido por todas las líneas — se lee al arranque de cada sesión (`AGENTS.md` paso 4), no es archivo histórico.

### 5. arnes/tareas/
Ledger compartido entre líneas (`t-001`..`t-101`+). Los IDs son un solo pool secuencial — t-034 es de la línea demanda, t-074+ son de la línea técnica.

## Archivado

Vacío como carpeta propia — el histórico vive dentro de `archivo/` de cada línea (`lineas/ola7/archivo/`, `lineas/demanda/archivo/`), no en un archivo global único. `arnes/diagnostico/` quedó como carpeta residual con 2 archivos que no pertenecen a ninguna línea específica: `diagnostico_de_proceso.md` (metodología de proceso, aplica a todas las líneas) y `_INDICE_MAESTRO.md` (mapa pre-reestructuración, desactualizado).
