# 🗺️ BLUEPRINT: ARQUITECTURA WEB Y EMBUDO COMERCIAL

Este documento establece la estructura de la página web de **Veta Dorada**, el mapa de navegación principal, el diseño de contenido de cada página y las relaciones de datos agnósticas requeridas para las ventas y captación de clientes potenciales (leads).

---

## 1. Estructura de Navegación (Menú Principal)

El menú principal estará presente en todas las páginas, diseñado con una estética limpia, tipografía premium y alta visibilidad:

```
+-----------------------------------------------------------------------------+
| VETA DORADA [Studio]         Espacios a Medida    Colecciones    Agendar    |
+-----------------------------------------------------------------------------+
```

*   **VETA DORADA [Studio]:** Logo principal (Redirige a `/`).
*   **Espacios a Medida:** Portafolio y explicación del servicio de carpintería personalizada de alta gama (Cocinas insignia, vestidores, cavas, baños).
*   **Colecciones:** Catálogo interactivo de piezas de diseño terminadas con precio fijo (Cavas, consolas, mesas, camas).
*   **Agendar:** Botón destacado de conversión directa (Abre el formulario de contacto simplificado).

---

## 2. Justificación de la Arquitectura del Menú Principal

### ¿Por qué "Cocinas" no es una sección independiente en el Menú Principal?

Anteriormente, el sitio web se enfocaba casi exclusivamente en "Cocinas integrales", lo que limitaba la percepción comercial de la marca. Al migrar al nuevo modelo de negocio, la eliminación de "Cocinas" del menú de primer nivel se justifica bajo los siguientes pilares de diseño:

1.  **Evitar el Encasillamiento (Broadening the Scope):**
    Si un usuario ve "Cocinas" en el menú principal, asume inmediatamente que la empresa solo fabrica cocinas. Al cambiar a **"Espacios a Medida"**, el cliente entiende de inmediato que diseñamos toda la casa (cavas de vino, vestidores, estudios, baños). Esto eleva la marca a la categoría de *Estudio de Diseño Interior / Arquitectura de Mobiliario*, y no una simple fábrica de cocinas.
2.  **Las Cocinas como Insignia dentro de "Espacios a Medida":**
    Aunque no está en el menú de navegación superior para evitar el encasillamiento, la cocina sigue siendo el producto estrella. Al hacer clic en *"Espacios a Medida"*, la primera sección destacada y con mayor peso visual es el diseño de cocinas integrales premium. De esta forma, captamos la demanda de alta intención (Google Ads de cocinas) sin cerrarle la puerta a proyectos residenciales completos.
3.  **Prevención de Fricción Cognitiva:**
    Un menú con demasiados elementos (ej: Home, Cocinas, Cavas, Closets, Camas, Mesas, Agendar) abruma al usuario. Agrupar la carpintería arquitectónica en *"Espacios a Medida"* y los productos móviles de precio fijo en *"Colecciones"* crea una división limpia, intuitiva y fácil de navegar.

---

## 3. Mapa de Páginas y Estructura de Contenido

### A. Página de Inicio (`/`)
El Home no es una landing page de campaña aislada, sino la carta de presentación de la marca. Su contenido se distribuye de la siguiente manera:

1.  **Presentación de Marca (Hero):**
    *   *Mensaje:* Ebanistería fina contemporánea para hogares sofisticados.
    *   *Enfoque:* Diseño espacial de autor y piezas atemporales. Cero jerga de "punto de fábrica" o promesas de bajo costo.
    *   *Elementos Visuales:* Fotografía fotorrealista a pantalla completa de una cocina insignia o cava instalada en Bogotá.
2.  **Los Dos Caminos (Navegación Comercial):**
    *   Dos bloques visuales limpios que separan la intención de compra del usuario:
        *   *Opción A:* "Diseñar mi espacio a medida" (lleva a `/espacios-a-medida`).
        *   *Opción B:* "Explorar colecciones de catálogo" (lleva a `/colecciones`).
3.  **Filosofía de Materiales y Herrajes:**
    *   Explicación de la calidad que el cliente puede tocar:
        *   Uso exclusivo de herrajes de clase mundial (Blum y Häfele) con garantía de por vida.
        *   Maderas seleccionadas y acabados finos aplicados a mano.
4.  **Historias de Proyectos (Prueba Social):**
    *   Casos de estudio breves con testimonios de clientes reales en Bogotá (Chicó, Rosales, Cabrera), enfocados en el valor que el mobiliario aportó a su vida diaria.

---

### B. Espacios a Medida (`/espacios-a-medida`)
Página enfocada en vender proyectos integrales (cocinas, vestidores, remodelaciones completas).
*   **Galería de Inspiración:** Espacios reales categorizados.
*   **El Proceso de Diseño Veta Dorada:** Explicado de forma sencilla para eliminar la fricción:
    1.  *Visita en Obra (Gratuita):* Tomamos medidas y entendemos tus necesidades en tu hogar en Bogotá.
    2.  *Modelado 3D (Renderizado):* Creamos una previsualización realista de tu espacio por un costo reembolsable (se descuenta del valor total del proyecto al contratar).
    3.  *Fabricación e Instalación:* Cuidado minucioso en ensamble y entrega.

---

### C. Colecciones (`/colecciones`)
El catálogo interactivo de productos a precio fijo.
*   **Filtros de Búsqueda Agnósticos:**
    *   Filtrado por tipo de mueble (Consolas/Recibidores, Cavas de Vino, Mesas, Camas).
    *   Filtrado por línea de precio (Línea Ultra-Lujo vs. Colección de Diseño/Gama Media).
*   **Ficha de Producto de Catálogo:**
    *   Imagen destacada de alta calidad del mueble.
    *   Nombre de la pieza, SKU y dimensiones reales (ancho, alto, profundo).
    *   Materiales del acabado y herrajes incluidos.
    *   Precio final de venta al público (fijo y transparente).
    *   Botón *"Solicitar o Personalizar"* (Abre el formulario simplificado con la referencia autocompletada).

---

### D. Agendar Asesoría (`/agendar`)
Página de conversión enfocada puramente en captar leads calificados.
*   **Propuesta de Valor Clara:** *"Agenda una visita técnica en tu hogar en Bogotá sin costo. Permítenos medir tu espacio y proponerte un presupuesto."*

---

## 4. Formulario de Captura de Leads (Bajo en Fricción)

Para evitar que los clientes potenciales abandonen la página antes de enviar sus datos, **eliminamos cualquier campo complejo o intimidante** (como el rango de presupuesto o la solicitud de archivos adjuntos). El formulario se reduce a la información esencial de contacto para que el equipo comercial realice el seguimiento inmediato:

```
+-----------------------------------------------------------+
|               AGENDAR VISITA EN MI HOGAR                  |
|                                                           |
|  [ Nombre Completo ]                                      |
|  [ Teléfono Whatsapp ] (Obligatorio para contacto rápido)  |
|  [ Correo Electrónico ] (Opcional)                        |
|  [ Barrio / Zona de Bogotá ]                              |
|                                                           |
|  ¿Qué espacio deseas diseñar?                             |
|  ( ) Cocina  ( ) Vestidor/Closet  ( ) Mueble de Catálogo  |
|                                                           |
|  [ Mensaje o Notas adicionales ]                          |
|                                                           |
|                     [ SOLICITAR VISITA ]                  |
+-----------------------------------------------------------+
```

---

## 5. Estructura Detallada del Footer (Pie de Página)

El pie de página actúa como el cierre de marca y el ancla legal de la plataforma. Tendrá una estética sobria, fondo oscuro y tipografía reducida con los siguientes componentes:

*   **Columna 1: Veta Dorada Studio**
    *   Breve descripción de marca: *"Estudio de diseño residencial y ebanistería fina contemporánea."*
    *   Enlaces a Redes Sociales oficiales (Instagram, Pinterest) enfocadas en diseño.
*   **Columna 2: Navegación Principal**
    *   Enlaces a: *Espacios a Medida*, *Colecciones de Catálogo*, e *Iniciar Sesión* (acceso al ERP interno de forma discreta).
*   **Columna 3: Soporte y Contacto**
    *   Dirección física del Showroom / Oficina en Bogotá.
    *   Teléfono/WhatsApp de atención al cliente.
    *   Correo electrónico corporativo.
*   **Bloque Inferior: Desacoplamiento Legal y Razón Social**
    *   (Ver detalle a continuación).

---

## 6. Desacoplamiento Legal: Marca Comercial vs. Razón Social

Para mantener el posicionamiento aspiracional de **Veta Dorada** como una firma exclusiva de diseño y ebanistería de alta gama, es fundamental separar la comunicación de la marca de la estructura corporativa de facturación.

### Directrices de Comunicación
1.  **La Marca Comercial (`Veta Dorada`):**
    Aparece de forma dominante en toda la interfaz pública de la web, menús, imágenes, redes sociales y propuestas comerciales iniciales. Transmite exclusividad, lujo, diseño de autor y artesanía impecable.
2.  **La Empresa Legal (`HERMANOS GARCIA GONZALEZ SAS`):**
    Se limita estrictamente a documentos transaccionales, contratos de fabricación, facturas electrónicas de venta y textos de términos legales obligatorios. 

### Implementación en la Web
En la base de la página (Footer), el texto legal de copyright se estructurará de la siguiente forma para cumplir con la ley de comercio electrónico de Colombia sin contaminar el branding:

> *"Veta Dorada es una marca comercial registrada. Todos los procesos de facturación, contratos legales, recaudos y garantías son operados y representados legalmente por la sociedad **HERMANOS GARCIA GONZALEZ SAS**, con **NIT 901421357-9**."*

De esta forma:
*   El cliente potencial navega en un entorno visual y conceptual refinado bajo el sello de **Veta Dorada**.
*   El cliente contratante firma y transfiere bajo la razón social legalmente responsable en Colombia, garantizando transparencia fiscal y legal absoluta.

---

## 7. Arquitectura de Composición de Productos en Base de Datos

Para que el modelo de catálogo a precio fijo sea robusto ante la fluctuación de costos, implementaremos una estructura de **Lista de Materiales (BOM - Bill of Materials)** desacoplada en la base de datos.

### Lógica de Cálculo de Precios
1.  Un **"Mueble Terminado de Catálogo"** se registra como un producto maestro en `productos_catalogo` (con `tipo: "Mueble Terminado"`).
2.  Este producto maestro no tiene su costo "quemado" de forma estática en el código. En su lugar, el sistema lee una lista de sub-ítems asociados (otros registros en `productos_catalogo` como *juego de bisagras Blum*, *lámina de roble*, o *jornada de ensamble*).
3.  **Cálculo Dinámico:**
    $$\text{Costo del Mueble} = \sum (\text{Cantidad Insumo} \times \text{Precio Insumo}) + \text{Costo de Mano de Obra}$$
    $$\text{Precio al Público} = \text{Costo del Mueble} \times \text{Factor de Margen}$$
4.  Si el proveedor del mármol Carrara o de los rieles Blum incrementa sus precios en el ERP, el costo y el precio sugerido del mueble terminado se actualizan de forma automática, protegiendo el margen del negocio sin intervención manual.
