# Plan Arquitectónico: Unificación del Proyecto ERP Veta Dorada

## 1. Concepto Central: El "Proyecto Unificado"
Transición de una "Arquitectura Fragmentada por Departamentos" a una "Arquitectura Centrada en el Proyecto" (Single Source of Truth).
Un Proyecto (entidad base) es un organismo vivo que cambia de *estado* a medida que avanza en el tiempo, manteniendo su ID y concentrando toda su información en un solo lugar.

### Principios Axiomáticos Aplicados:
*   **Independencia:** Los datos del proyecto son la base agnóstica central (ej. `schema: cotizaciones`).
*   **Mínima Información (Ergonomía Cognitiva):** Se crean "Lentes" (Bloques de UI especializados) que consumen la misma base de datos, pero muestran u ocultan información dependiendo del rol del usuario (Comercial vs. Operario) y del estado del proyecto.

---

## 2. Los "Lentes" del Proyecto (Vistas UI)

### Lente Comercial (`Cotizador Pro` actual)
*   **Enfoque:** Configuración de espacios, asignación de materiales base, presupuestación y cierre de venta.
*   **Datos Visibles:** Precios de venta, márgenes de rentabilidad, datos financieros y de facturación del cliente.
*   **Estado Típico:** Prospecto, Cotizando, Negociación, Cerrado/Ganado.

### Lente de Fábrica (Nuevo: `Ficha Produccion Pro`)
*   **Enfoque:** Ejecución técnica, despiece, ensamble e instalación.
*   **Datos Visibles:** "Imágenes/Planos del Proyecto" ampliados para claridad visual, lista de insumos/materiales (BOM) asignados por cada espacio, instrucciones técnicas.
*   **Datos Ocultos:** Precios, tarifas de jornada, finanzas del cliente.
*   **Estado Típico:** En Producción, Ensamble, Despacho, Instalación.

---

## 3. Hoja de Ruta Cronológica de Ejecución (Plan de Acción)

*Nota: Dado que no hay datos históricos críticos en los campos de cabecera actuales, procedemos con un refactor directo (sin paralelismo) priorizando la limpieza del código.*

### Paso 1: La Cimentación Agnóstica (Migración a "Proyectos")
- [ ] Renombrar archivo físico de datos: `storage/db/cotizaciones.json` -> `proyectos.json` y actualizar internamente su `"context"` a `"proyectos"`.
- [ ] En `storage/db/schemas.json`, cambiar el `"name"` del esquema de `cotizaciones` a `proyectos`.
- [ ] En este mismo esquema (`proyectos`), **eliminar los campos estáticos obsoletos** (el formulario de cabecera tonto: fotos de referencia estáticas, etc.) y crear el campo vital de `"estado"` (Prospecto, Cotizando, Aprobado, Producción, Entregado).
- [ ] En `storage/db/page_routes.json`, cambiar todas las referencias para que apunten al nuevo contexto `proyectos`. Además, transformar la ruta principal de `/app/quoting` a `/app/proyectos`.
- [ ] Ejecutar `npm run agnostic:compile`.

### Paso 2: Creación de Esquemas Relacionales (El Pegamento)
- [ ] Crear el esquema `registros_tecnicos` (Apoyo Técnico) en `schemas.json`. Campos: `proyecto_id`, `tipo_registro`, `fecha`, `autor`, `descripcion_notas`, `recursos_urls`, `lista_requisitos`.
- [ ] Crear el esquema `project_tasks` en `schemas.json`. Campos: `proyecto_id`, `titulo`, `tipo`, `estado`, `responsable`.
- [ ] Ejecutar `npm run agnostic:compile`.

### Paso 3: Limpieza y Construcción UI (Lente Comercial)
- [ ] Ir al componente especializado `CotizadorPro`. Eliminar definitivamente el código del formulario de cabecera obsoleto.
- [ ] Construir e inyectar el nuevo componente visual `ApoyoTecnicoFeed` (que consume `registros_tecnicos`) en la cabecera/inicio del proyecto.
- [ ] Construir e inyectar el componente visual `ListaTareas` (que consume `project_tasks`) al final de la vista.

### Paso 4: Expansión a Fábrica (Lente de Producción)
- [ ] Tomar la base limpia del `CotizadorPro` y clonarla para crear el nuevo bloque especializado `FichaProduccionPro`.
- [ ] Ajustar la ergonomía cognitiva de `FichaProduccionPro`: ocultar campos financieros, escalar tamaños de imagen, mostrar BOM (lista de materiales) limpia.
- [ ] Configurar el enrutador en `page_routes.json` para que `/app/proyectos` decida qué bloque mostrar (Comercial o Producción) según el permiso del usuario o el estado de la tarjeta clickeada.
