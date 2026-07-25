# Diseño de Detalle: Módulo Servicios (Sitio Web Airhon)

**Especificación Técnica de UI, Tarjetas de Servicio, Calculadora Interactiva y Copys**  
**Enfoque:** Transparencia Comercial, B2B y Cero Entropía en Precios  
**Versión:** 1.0  
**Fecha:** Junio 2026  

---

## 1. Estructura General y Cabecera de Sección

El módulo de Servicios está diseñado para calificar prospectos comerciales del Eje 3 (Optimización Kaizen) y Eje 4 (Desarrollo de Software), separando la experimentación artística de la propuesta de valor económica directa.

* **Título de la Sección (H1):** `Servicios y Consultoría`
* **Sub-headline (H2):** `Estructuras digitales soberanas y optimización de procesos para empresas operativas.`
  * *Especificación CSS:* `--font-h2` fluido (`clamp(1.5rem, calc(1.2rem + 1.5vw), 2.5rem)`), color gris neutro, ancho acotado a `55ch`.

---

## 2. Tarjetas de Servicio (Catálogo Fijo)

Se estructuran dos bloques principales alineados con los servicios de consultoría real de Airhon. Cada tarjeta utiliza un diseño bento compacto con tipografía de alto contraste.

### Tarjeta 1: Auditoría y Optimización de Procesos (Modelo Kaizen)
* **Categoría:** `Consultoría Organizacional`
* **Título del Servicio (H3):** `Estandarización Operativa Kaizen`
* **Texto Descriptivo:**  
  `Inmersión en flujos departamentales para identificar cuellos de botella, fugas financieras en compras y mermas logísticas. Diseñamos el mapa físico e instructivo de procesos antes de implementar cualquier software.`
* **Entregables Clave:**
  * Mapa de Flujo Operativo Estandarizado.
  * Definición de Acuerdos de Nivel de Servicio (SLA) internos.
  * Manifiesto de Arquitectura Organizacional.
* **Modelo Comercial:**
  * **Tarifa Inicial (CapEx):** Desde `$8.000.000 COP` (Estudio de procesos inicial).
  * **Suscripción de Mejora (OpEx):** `$1.200.000 COP / mes` (Evolución y auditoría continua).

### Tarjeta 2: Desarrollo de Software e Infraestructura Independiente
* **Categoría:** `Ingeniería de Software`
* **Título del Servicio (H3):** `Plataformas Web y Sistemas a Medida`
* **Texto Descriptivo:**  
  `Desarrollo de sistemas de gestión (ERP, CRM, Dashboards) adaptados al pulgar en pantallas de campo y tabletas móviles. Despliegue en servidores independientes sin dependencias ni alquileres forzados de plataformas cerradas.`
* **Entregables Clave:**
  * Código fuente propietario (Next.js / TypeScript) transferido al 100%.
  * Base de datos Postgres en la nube optimizada para alta velocidad de lectura.
  * Configuración de servidores de bajo consumo (Scale-to-Zero).
* **Modelo Comercial:**
  * **Inversión por Módulos:** Cotización por hitos de entrega funcionales.
  * **Costo de Servidores:** `$0 COP / mes` bajo operaciones estándar (gracias a la arquitectura en la nube de consumo bajo demanda).

---

## 3. Calculadora Interactiva de Presupuesto

Para reducir la fricción en la primera llamada de ventas y filtrar clientes con el presupuesto adecuado, la página incorpora una calculadora ligera en el frontend:

* **Estructura Visual:** Panel de control de dos columnas (Izquierda: Opciones interactivas, Derecha: Resumen financiero en tiempo real).
* **Campos y Selectores (Inputs interactivos):**
  
  | Identificador del Selector | Etiqueta en UI | Tipo de Control | Impacto Financiero en la Calculadora |
  | :--- | :--- | :--- | :--- |
  | `calc_kaizen` | `Auditoría e Instructivo de Procesos Kaizen` | Checkbox (Interruptor) | `+ $8.000.000 COP` CapEx inicial |
  | `calc_software` | `Desarrollo de Software / Dashboard a Medida` | Checkbox (Interruptor) | `+ $12.000.000 COP` CapEx inicial |
  | `calc_infrastructure`| `Migración y Servidores Serverless` | Checkbox (Interruptor) | `+ $3.000.000 COP` CapEx inicial |
  | `calc_support` | `Soporte Técnico y Evolutivos Mensuales` | Checkbox (Interruptor) | `+ $1.450.000 COP / mes` OpEx recurrente |

* **Visualización Dinámica del Costo (Columna Derecha):**
  * **Inversión Inicial Estimada (CapEx):** Se calcula sumando los valores iniciales seleccionados. (Ej: `$23.000.000 COP`).
  * **Soporte Recurrente Mensual (OpEx):** Muestra el valor de soporte si `calc_support` está activo.
  * *Métricas de Garantía:* `Propiedad intelectual del código: 100% cliente. Cero licenciamiento por usuario.`
* **Acción de Enlace Comercial:**
  * Botón: `Solicitar cotización formal`
  * *Comportamiento:* Al hacer clic, hace scroll automático al formulario de contacto de la Home, autoselecciona la opción "Optimización de Procesos" o "Desarrollo de Software" e inyecta un texto predefinido en el campo de mensaje detallando las opciones seleccionadas en la calculadora.

---

## 4. Garantías y Acuerdos de Servicio (SLA)

Un bloque de texto minimalista con iconos informativos para construir confianza técnica y resolver las dudas más comunes:

1. **Propiedad Absoluta del Código:**  
   `El cliente es dueño del 100% de la propiedad intelectual. Si la relación finaliza, te llevas tu código e infraestructura contigo.`
2. **Arquitectura sin Secuestro Operativo (No Lock-In):**  
   `Utilizamos tecnologías web estándar (Next.js, Tailwind, PostgreSQL, Node.js). Cualquier desarrollador calificado en el mundo puede leer y dar mantenimiento a tu sistema.`
3. **Optimización Móvil Ergonómica:**  
   `Todas las interfaces se diseñan para ser utilizadas con el pulgar en pantallas móviles, garantizando que el personal operativo en campo registre datos sin fatiga.`
