# Ola 6 — Metodología de grafos relacionales y catálogos (borrador para validación)

**Supervisor:** Javier  
**Fecha:** 2026-08-04  
**Estado:** Preguntas + propuestas para validación antes de Ola 7

---

## Objetivo

Construir **grafos relacionales separados** (NO tabla monstruosa) que permitan:
1. Cotizar proyectos modulares por métricas objetivas (m², m.l., cantidad)
2. Calcular nóminas basadas en procesos elementales + costos
3. Gestionar catálogos de herrajes, productos, insumos sin duplicación
4. Escalar a proyectos complejos (cava hexagonal, mesas custom, cajas eléctricas)

---

## Propuesta 1: Espacios arquitectónicos — Métricas objetivas

### Pregunta P1.1: ¿Cuál es la lista arquitectónica COMPLETA de espacios?

**Propuesta inicial** (basada en ejemplos dados):

| ID | Espacio arquitectónico | Unidad base | Métrica ejemplo | Notas |
|---|---|---|---|---|
| ESP-001 | Cocina integral | m.l. | 2.5–4 m.l. | Módulos: gabinetes, encimera, instalación eléctrica |
| ESP-002 | Closet/vestidor | m.l. + m² | 1.5–3 m.l.; 4–12 m² | Módulos: varillero, gavetas, divisiones |
| ESP-003 | Centro de entretenimiento | m² | 2–5 m² | Módulos: entrepaños, nichos, soporte TV |
| ESP-004 | Estudio/home office | m.l. + m² | 1–2 m.l. escritorio; 2–4 m² | Módulos: escritorio, shelving, caja eléctrica |
| ESP-005 | Cava/bar | m.l. | 1–3 m.l. | Módulos: repisas, frigobar, iluminación LED |
| ESP-006 | Consola/recibidor | m.l. | 1–2 m.l. | Módulos: repisas, espejo, iluminación |
| ESP-007 | Forma especial (cava hexagonal, mesa custom) | m² o unidad | variable | **GRAFO CUSTOM:** definible por usuario |

**¿Es correcto?** ¿Faltan espacios? ¿Qué métrica no es determinista (pequeño/grande)?

---

## Propuesta 2: Procesos elementales — Grafos de composición

### Pregunta P2.1: ¿Cuál es la lista de procesos elementales?

**Propuesta inicial** (basada en ejemplos dados):

```
PROCESOS ELEMENTALES (costo + tiempo estimado)
├─ Armado estructural
│  ├─ ARM-001: Armado estructura modular (tarjeta) — 15k COP/h
│  ├─ ARM-002: Armado cajón con corredera (30 min) — 7.5k COP
│  └─ ARM-003: Postura bisagra (2 unidades por puerta) — 2.5k COP c/u
├─ Acabados/herrajes
│  ├─ ACB-001: Instalación manija/tirador — 2.5k COP c/u
│  ├─ ACB-002: Instalación condimentero — 30k COP
│  ├─ ACB-003: Instalación bassurero — 30k COP
│  └─ ACB-004: Instalación bisagra — 2.5k COP c/u
├─ Electrificación
│  ├─ ELE-001: Apertura hueco para tomacorriente — 2.5k COP
│  ├─ ELE-002: Instalación conexión eléctrica — 2.5k COP
│  └─ ELE-003: Instalación interruptor LED — 5k COP
├─ Iluminación LED
│  ├─ LED-001: Acanalado/perfil LED por metro — 2.5k COP/m
│  ├─ LED-002: Fuente + control (1 por módulo) — incluido en diseño
│  └─ LED-003: Instalación perfil LED — 2.5k COP/m
└─ Acabados especiales
   ├─ ESP-001: Forma especial (hexágono, curva) — variable (m² × factor)
   └─ ESP-002: Superficie mesa/escritorio — variable (m² × factor)
```

**¿Es correcto?** ¿Qué procesos faltan? ¿Los costos son realistas?

---

## Propuesta 3: Catálogos relacionales — Grafos sin tabla monstruosa

### Pregunta P3.1: ¿Estructura correcta de grafos separados?

**Propuesta de 7 grafos relacionados:**

```
GRAFO 1: HERRAJES (compra + presentación)
┌─ catalogo_herrajes (tabla core)
│  ├─ id, nombre, tipo (enum: bisagra, manija, corredera, etc.)
│  ├─ proveedor_id FK
│  ├─ precio_compra (costo al comprar)
│  ├─ stock_actual
│  └─ costo_instalacion (labor, no material)
│
└─ herrajes_presentacion (catálogo comercial)
   ├─ id, herraje_id FK
   ├─ color, acabado, imagen_cliente
   ├─ precio_publico (lo que ve el cliente)
   └─ disponible_web (boolean)

GRAFO 2: CORREDERAS (sub-caso de herrajes)
┌─ catalogo_correderas
│  ├─ id, nombre, tipo (oculta, full extensión, lateral metálico)
│  ├─ herraje_id FK (relación a herrajes si aplica)
│  ├─ precio_compra
│  └─ costo_instalacion
│
└─ correderas_especificaciones
   ├─ largo_disponible (200mm, 250mm, 300mm, etc.)
   └─ resistencia_kg

GRAFO 3: PRODUCTOS BÁSICOS (tableros, perfiles, insumos)
┌─ catalogo_insumos
│  ├─ id, nombre, tipo (tablero, perfil, tornillo, etc.)
│  ├─ proveedor_id FK
│  ├─ unidad (metro lineal, metro cuadrado, pieza, etc.)
│  ├─ precio_compra_por_unidad
│  └─ rendimiento_metrica (ej: 1 m² de tablero rinde 2 gavetas)
│
└─ insumos_especificaciones
   ├─ espesor, ancho, largo
   ├─ material, densidad
   └─ disponible_web

GRAFO 4: ACABADOS (colores, pinturas, laminados)
┌─ catalogo_acabados
│  ├─ id, nombre, familia (pintura, laminado, enchapado)
│  ├─ codigo_proveedor
│  └─ precio_diferencial (+ X% sobre material base)
│
└─ acabados_muestras
   ├─ imagen_muestra
   ├─ disponible_web
   └─ compatibilidad_insumo (tablero A + acabado X)

GRAFO 5: PROCESOS ELEMENTALES (servicios de mano de obra)
┌─ catalogo_procesos
│  ├─ id, codigo (ARM-001, ELE-002, etc.)
│  ├─ nombre, descripcion
│  ├─ tiempo_estimado_min
│  ├─ costo_laboral (tarifa × tiempo, o fijo)
│  └─ herramientas_requeridas (drill, sierra, etc.)
│
└─ procesos_dependencias
   ├─ proceso_id FK
   ├─ requiere_proceso_id FK (ej: ARM-002 requiere ARM-001)
   └─ orden_secuencia

GRAFO 6: COMPONENTES/MÓDULOS (sub-composiciones)
┌─ catalogo_componentes
│  ├─ id, nombre (ej: "Gaveta con corredera")
│  ├─ tipo (gaveta, puerta, repisa, etc.)
│  └─ descripcion
│
└─ componentes_composicion
   ├─ componente_id FK
   ├─ insumo_id FK (cantidad de cada insumo)
   ├─ proceso_id FK (lista de procesos)
   ├─ herraje_id FK (lista de herrajes)
   └─ cantidad_necesaria

GRAFO 7: PROYECTOS ESPECIALES (hexágono, custom, etc.)
┌─ catalogo_formas_especiales
│  ├─ id, nombre (cava hexagonal, mesa redonda, etc.)
│  ├─ formula_costo (función de m², perímetro, etc.)
│  └─ complejidad_factor (1.0=estándar, 1.5=complejo)
│
└─ formas_especiales_plantillas
   ├─ imagen_3d, medidas_base
   └─ procesos_adicionales
```

**¿Es correcto?** ¿Qué relaciones faltan? ¿Hay redundancia?

---

## Propuesta 4: Ejemplo completo — Cocina pequeña (100k)

### Pregunta P4.1: ¿Este breakdown es realista?

```
PROYECTO: Cocina pequeña
ESPACIO: ESP-002 (cocina integral)
MÉTRICA: 2.5 m.l.

MÓDULO 1: Gabinetes base (60k)
├─ Insumos
│  ├─ Tablero 18mm (1 m² × 350k) — 350k
│  ├─ Herrajes gabinete (bisagras, corrientes) — 20k
│  └─ Tornillos, pegante — 5k
├─ Procesos
│  ├─ ARM-001: Armado estructura (1 h × 15k) — 15k
│  ├─ ARM-003: Postura bisagra (4 u × 2.5k) — 10k
│  └─ ACB-001: Instalación manija (4 u × 2.5k) — 10k
└─ SUBTOTAL: 410k (pero 60k = solo labor + herrajes mínimos)

MÓDULO 2: Encimera (20k)
├─ Insumos
│  └─ Encimera laminada 2.5 m.l. — XX k
├─ Procesos
│  ├─ Corte encimera — 10k
│  └─ Instalación encimera — 10k
└─ SUBTOTAL: 20k

MÓDULO 3: Instalación eléctrica (20k)
├─ Procesos
│  ├─ ELE-001: Apertura hueco tomacorriente (2 u × 2.5k) — 5k
│  ├─ ELE-002: Conexión eléctrica (2 u × 2.5k) — 5k
│  └─ ELE-003: Instalación interruptor LED (1 u × 5k) — 5k
└─ SUBTOTAL: 15k + insumos LED 5k = 20k

VALOR TOTAL COTIZADO: 60k + 20k + 20k = 100k ✓
```

**Preguntas de validación:**
- ¿Los procesos y costos son correctos?
- ¿El desglose por módulo es el que quieres ver?
- ¿Faltan procesos o insumos?

---

## Propuesta 5: Panel de parametrización — Estructura editables

### Pregunta P5.1: ¿Qué parámetros deben ser editables en admin?

**Propuesta de tabla `parametros` para Ola 7:**

| Clave | Tipo | Valor v1 | Rango/Validación | Notas |
|---|---|---|---|---|
| `comision_cierre_pct` | float | 5 | 0–10 | Comercial, porcentaje del proyecto |
| `comision_modulo_instalado_pct` | float | 5 | 0–10 | Carpintero, porcentaje por módulo |
| `tarifa_hora_carpintero_cop` | int | 15000 | 10k–30k | Base para ARM-* |
| `tarifa_hora_auxiliar_cop` | int | 6500 | 5k–15k | Base para asistentes |
| `reduccion_comision_retraso_dia_pct` | float | 0.5 | 0–1 | Por día tardío (máx 5 días) |
| `bruto_diseno_3d_cop` | int | 130000 | 100k–200k | Diseño 3D + render |
| `neto_diseno_3d_pct` | float | — | variable | Después de retención + IVA (pendiente contador) |
| `iva_diseno_3d_pct` | float | — | variable | Tasa especial (pendiente contador) |
| `umbral_novedad_check15_dias` | int | 3 | 1–7 | Desfase que dispara check 15d |
| `empresa_nombre` | string | — | input | Veta de Oro |
| `empresa_nit` | string | — | input | 123456789 |
| `empresa_razon_social` | string | — | input | Hermanos García González S.A.S |
| `empresa_direccion` | string | — | input | Calle 123 #456 |
| `empresa_telefono` | string | — | input | +57 1 1234567 |
| `empresa_horario` | string | — | input | Lunes–Viernes 8am–6pm |

**¿Correcto?** ¿Faltan parámetros? ¿Qué NO debe ser editable?

---

## Propuesta 6: Investigación de estándares de industria (P1 abierta)

### Pregunta P6.1: ¿Dónde buscar referencias de espacios arquitectónicos?

**Propuesta de fuentes:**
1. **Catálogos de proveedores de muebles modulares:** IKEA, Hafele, Salvamar (modularidad, métricas)
2. **Estándares DIN 68871 (muebles de cocina):** altura, profundidad, anchos estándar
3. **ISO 1219 (diseño de espacios de trabajo):** metros cuadrados mínimos por función
4. **Normativa colombiana NTC (si existe):** construcción, iluminación
5. **Tus proyectos reales:** fotografías, cotizaciones, medidas

**¿Cuál es la fuente más confiable para TI?** ¿Existen estándares reales que uses hoy?

---

## Siguientes pasos (después de validación)

1. **Refinar propuestas 1–5** según tus respuestas
2. **Construir esquemas Drizzle** basados en los grafos
3. **Seed de datos iniciales** (espacios, procesos, herrajes reales)
4. **Validación con 1 cotización real** contra el nuevo schema
5. **Documentar relaciones** en `d3_schema_ola_6.md`
6. **Aprobar para Ola 7**

---

**Siguiente acción:** Responde P1.1 a P6.1 (o ajusta propuestas si son incorrectas). Luego sistematizamos tablas finales.

