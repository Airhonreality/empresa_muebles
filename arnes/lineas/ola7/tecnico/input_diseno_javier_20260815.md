# Input de diseño — Javier (Supervisor), 2026-08-15

**Fuente:** mensaje directo del Supervisor en sesión de arnés. Se registra textual (sin editorializar) como entrada de los diamantes t-136/t-137/t-138. Cualquier resumen o interpretación en los `disenio_*.md` resultantes debe poder trazarse a este texto.

---

## 1. Optimización de Cards de Proyecto / Oportunidad (Kanban) → t-136, revisa `disenio_p01_kanban_comercial.md`

> Jerarquía de Contenido: Rediseñar el orden visual dentro de la card para priorizar la lectura rápida:
> - Título principal: Nombre del cliente.
> - Subtítulo: Nombre del proyecto / tipo de espacio.
> - Detalle: Dirección.
> - Ajuste: Eliminar el campo de precio de la card.
>
> Badges / Etiquetas de Estado:
> - Reducir drásticamente el tamaño (super diminutos).
> - Estilizado tipográfico: Fuente Light y tamaño muy reducido (mini).
> - Estética minimalista: Eliminar bordes; utilizar únicamente el punto o botón con efecto pulsante e irradiación blur.
>
> Gestión de Estados (Workflow):
> - Integrar controles de cambio de estado minimalistas en la propia card (acciones rápidas para Avanzar o Retornar al estado anterior).

**Nota de contexto (no es parte del texto de Javier):** esto coincide con "Lote C (kanban P-01 rediseño) diferido a revisión de Javier" (`arnes/estado.md` línea 17) — es la revisión que estaba pendiente.

---

## 2. Rediseño del Dashboard de Proyecto (Pantalla Detalle & Daily Flow) → t-137, nuevo `disenio_dashboard_proyecto.md`

> Problema: El diseño actual se enfoca excesivamente en los Gates mediante cards estáticas y emojis hardcodeados, descuidando el flujo operativo diario (Daily Flow) y el acceso a la información técnica.
>
> Línea de Tiempo Minimalista (Gates):
> - Reemplazar la grilla/colección de cards por un carrusel o timeline horizontal interactivo.
> - Deberá indicar de forma clara: estado de origen (de dónde vienes), estado actual (dónde estás) y siguiente hito (a dónde vas).
> - Soporte para reprocesos: Permitir la creación de bifurcaciones visuales (branches) si un gate requiere revisiones o ajustes.
>
> Integración del Dashboard Operativo:
> - Incluir vista estructurada para la gestión diaria con navegación modular: Visualización de Nodos → Espacios → Módulos → Ítem / Planos de detalle → Dirección y datos de instalación.
>
> Navegación por Micro-interacciones (Gates Inmersivos):
> - Para los Gates de acción específica (ej. Retoma de medidas), evitar pantallas completas independientes que desliguen al usuario del proyecto.
> - Implementar modales, capas superpuestas (overlays) o paneles contextuales que simulen estar dentro del nodo del proyecto, mejorando los signifiers de usabilidad.

**Nota de contexto (no es parte del texto de Javier):** no existe hoy un `disenio_PXX.md` propio para `/erp/proyectos/[proyectoId]/page.tsx` — se construyó sin documento de diseño dedicado. Relacionado con `disenio_f3_cronograma_gates.md` (P-06..P-12) pero no es el mismo artefacto: ese cubre las pantallas de gates individuales, este es el shell/dashboard que las contiene. La auditoría 2026-08-10 (D-11..D-17, `backlog_auditoria_pantallas.md`) ya había señalado como hallazgo diferido a propósito que "gates evaluados por proyecto completo en vez de por nodo" viola la premisa central del diseño — el pedido de "bifurcaciones visuales" y "Nodos→Espacios→Módulos" de este punto 2 es una oportunidad de resolver ese hallazgo diferido de una vez, no un requerimiento nuevo aislado. El diamante de t-137 debe leer ese hallazgo antes de proponer diseño.

---

## 4. Módulo de Gestión de Clientes (CRM) → t-138, nuevo `disenio_p28_crm_clientes.md`

> Nuevo Acceso: Agregar al menú principal de navegación el acceso al Tablero / Base de Datos de Clientes.

**Nota de contexto (no es parte del texto de Javier):** la entidad `clientes` ya existe en el schema (`nucleo/REGISTRO_DE_ENTIDADES.md` §3, línea "clientes | Cliente | Identidad del cliente..."), con relaciones 1—N hacia `proyectos`, `visitas`, `pedidos_web`, `obligaciones_pendientes`. No hay hoy ninguna pantalla `P-XX` que la exponga como tablero — es pantalla nueva de punta a punta, no requiere cambio de schema. Numerada `P-28` provisionalmente (P-27 está duplicado en el repo entre `disenio_P27_gestion_portafolio.md` y `disenio_p27_catalogo_diseno_desarrollo.md` — no reutilizar ese número, el diamante debe señalar esa colisión pre-existente como hallazgo, no resolverla).

---

## Punto 3 — Rediseño Responsive: Formulario del Catálogo (Creación/Edición) → t-139, actualiza `disenio_p27_catalogo_diseno_desarrollo.md`

> **Optimización de Layout (Desktop / Tablets):** Reestructurar la pantalla para eliminar el scroll innecesario y aprovechar pantallas anchas mediante una maquetación a dos columnas:
> - **Columna 1:** Formulario de edición/creación de datos.
> - **Columna 2:** Slider de imágenes del producto con cabecera de datos básicos.
>
> **Caso de Uso Adicional:** El diseño de la columna derecha debe permitir su uso como ficha de presentación de productos frente al cliente final.
>
> Proceso acordado por Javier: primero revisar `disenio_p27_catalogo_diseno_desarrollo.md` (no hay `disenio_FXX` para el formulario del catálogo — P-27 es la pantalla del ERP), luego el backlog (`backlog_auditoria_pantallas.md` + `checklist_progreso_pantallas.md`), y recién ahí implementar.

**Nota de contexto (no es parte del texto de Javier):** este es el punto 3 que el mensaje original omitió (saltó de "2." a "4."). Se registra como `t-139`. Decisiones tomadas con Javier antes de implementar: (1) agregar `galeriaImagenesUrl: string[]` a `productos_catalogo` (patrón `galeriaPortafolioUrl`/`fotosEspacio`, mutación de schema → checkpoint Supervisor); (2) la pantalla de dos columnas se materializa como **panel a pantalla completa** dentro de `/erp/catalogo` (preserva el deep-link `?source=cotizador&proyectoId=` de R9 sin cambiar rutas); (3) la columna derecha es un componente presentacional **standalone** (`ProductoFicha`) + preview en vivo, reutilizable como ficha cliente, y la propuesta pública (F-08) lo adopta al final por minimalismo (reemplaza su `GaleriaCarril` local por la primitiva `gallery-rail` compartida).
