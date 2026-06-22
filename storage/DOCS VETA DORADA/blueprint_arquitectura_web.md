# 🗺️ BLUEPRINT: ARQUITECTURA WEB Y EMBUDO COMERCIAL

Este documento establece la estructura de la página web de **Veta Dorada**, el mapa de navegación principal, el diseño de contenido de cada página y las relaciones de datos agnósticas requeridas para las ventas y captación de clientes potenciales (leads).

---

## 1. Concepto Visual y Estético (Luz y Biofilia)

La web debe transmitir paz, amplitud y conexión con la naturaleza. Se implementará un diseño centrado en el bienestar del usuario:
*   **Dominancia Lumínica:** Uso intensivo de fondos claros (blanco hueso, champaña) para maximizar la percepción de luz natural en los espacios.
*   **Elementos Biofílicos:** Integración visual de vegetación (plantas de interior en los renders), texturas de madera natural al desnudo y fluidez espacial. El diseño de la interfaz será "respirable", con amplios márgenes y sin elementos opresivos.
*   **Acentos de Lujo:** El negro y los tonos oscuros se utilizarán de manera minimalista, únicamente para generar contraste en tipografías, botones de acción primaria o para enmarcar piezas de altísima exclusividad (Colección Premium).

---

## 2. Estructura de Navegación (Menú Principal)

El menú principal estará presente en todas las páginas, diseñado con una estética limpia, tipografía premium y alta visibilidad:

```text
+-----------------------------------------------------------------------------+
| VETA DORADA [Studio]         Espacios a Medida    Colecciones    Agendar    |
+-----------------------------------------------------------------------------+
```

*   **VETA DORADA [Studio]:** Logo principal (Redirige a `/`).
*   **Espacios a Medida:** Portafolio y explicación del servicio de carpintería personalizada de alta gama (Cocinas insignia, vestidores, cavas, baños, oficinas).
*   **Colecciones:** Catálogo interactivo de piezas de diseño terminadas con precio fijo.
*   **Agendar:** Botón destacado de conversión directa (Abre el modal de filtrado y contacto).

---

## 3. Mapa de Páginas y Estructura de Contenido

### A. Página de Inicio (`/`)
El Home es la carta de presentación de la marca y el inicio del embudo.
1.  **Presentación de Marca (Hero):**
    *   *Mensaje Central:* "Carpintería arquitectónica de alta precisión."
    *   *Subtítulo:* "Diseñamos, fabricamos e instalamos espacios integrales pensados para tu bienestar. Tecnología 3D, materiales premium y calidad de fábrica, sin intermediarios."
    *   *Visual:* Imagen fotorrealista muy iluminada (luz solar entrando por ventanales), mostrando una cocina o estudio con toques biofílicos (vegetación).
    *   *CTA Principal:* "Agendar Asesoría" (Abre el embudo de conversión).
2.  **Validación Técnica y Calidad:**
    *   Explicación de la tecnología 3D para lograr precisión milimétrica.
    *   Ventaja de ser punto de fábrica (control total del proceso y eliminación de sobrecostos).
    *   Uso de materiales nobles y herrajes de clase mundial.
3.  **Portafolio Aspiracional:**
    *   Galería curada de "El arte de la unión fina", mostrando detalles de acabados.

### B. Espacios a Medida (`/espacios-a-medida`)
Página enfocada en vender proyectos integrales residenciales.
*   **El Proceso de Diseño Veta Dorada:**
    1.  *Levantamiento y Entendimiento:* Escuchamos tus necesidades y medimos tu espacio.
    2.  *Ingeniería del Diseño (3D):* Prototipado digital preciso para asegurar la viabilidad técnica y estética.
    3.  *Materialización:* Ensamble en fábrica e instalación impecable en tu hogar.

---

## 4. Estrategia de Conversión: Embudo Híbrido (Formulario + WhatsApp)

### Análisis de Comportamiento del Consumidor
Las investigaciones demuestran que en el mercado latinoamericano, **WhatsApp es el canal de cierre de ventas B2C por excelencia** debido a la inmediatez y cercanía. Sin embargo, un botón directo a WhatsApp genera demasiados "leads basura" (curiosos sin intención de compra), lo que contamina los datos de Google Ads e impide optimizar las campañas para clientes de alto valor.

### La Solución: El Embudo Híbrido de Calificación
Para mantener la eficiencia de WhatsApp y al mismo tiempo alimentar el algoritmo de Google Ads con datos de alta calidad, implementaremos un sistema de 2 pasos al hacer clic en cualquier botón de "Agendar" o "Cotizar":

**Paso 1: Modal de Micro-Filtro (Overlay)**
Al hacer clic, no se abre WhatsApp inmediatamente. Se despliega un formulario minimalista flotante para cualificar al prospecto:
```text
+-----------------------------------------------------------+
|               DISEÑEMOS TU ESPACIO IDEAL                  |
|                                                           |
|  ¿Qué espacio necesitas?                                  |
|  [ ] Cocina Integral   [ ] Clóset / Vestier               |
|  [ ] Centro de TV      [ ] Oficina / Estudio              |
|  [ ] Otro                                                 |
|                                                           |
|  Estado de tu proyecto:                                   |
|  ( ) Tengo diseño y medidas (Cotizar a distancia)         |
|  ( ) Necesito que me visiten y asesoren                   |
|                                                           |
|  Tu Nombre: [_______________________]                     |
|                                                           |
|           [ CONTINUAR A WHATSAPP ]                        |
+-----------------------------------------------------------+
```

**Paso 2: Captura Técnica y Redirección Bifurcada**
Al hacer clic en "Continuar a WhatsApp", el sistema realiza dos acciones en paralelo:
1.  **Hacia el CRM (Segundo Plano):** Captura de forma invisible el identificador de clic de Google (`GCLID`), junto con el Nombre y Teléfono del formulario. Esta data se guarda en la base de datos interna (Agnostic DB) **sin** mostrarse jamás al cliente.
2.  **Hacia WhatsApp (Primer Plano):** El usuario es redirigido a la App con un mensaje amable pre-escrito (*"Hola Veta Dorada, soy [Nombre]. Necesito un [Espacio]. Actualmente [Estado del proyecto]."*). El código técnico nunca viaja por WhatsApp.

**Paso 3: Importación de Conversiones Offline (El Santo Grial del ROAS)**
Para optimizar la pauta publicitaria sin revelar los ingresos reales a Google (protegiendo tu privacidad financiera), implementaremos un modelo de **Puntuación de Calidad de Conversión (Score 1-10)**:
*   Una vez que el equipo comercial cierra una venta en el mundo físico, actualizan el estado del lead en el CRM interno.
*   El CRM le "avisa" a Google Ads devolviéndole el `GCLID` e informándole que ese usuario compró.
*   En lugar de enviar el precio en Pesos, el CRM envía un score predefinido. (Ej. Venta de repisa = 1 punto; Venta de Cocina Premium = 10 puntos).
*   *Resultado:* El algoritmo de IA de Google aprende a buscar perfiles de usuarios tipo "10" y los prioriza en las subastas, maximizando la rentabilidad sin comprometer tus finanzas.

---

## 5. Estructura del Footer (Pie de Página)

*   **Columna 1: Veta Dorada Studio**
    *   *Slogan:* "Habita en el bienestar."
    *   Enlaces a Redes Sociales oficiales.
*   **Columna 2: Navegación Principal**
    *   *Espacios a Medida*, *Colecciones de Catálogo*, e *Iniciar Sesión*.
*   **Columna 3: Contacto**
    *   Dirección de fábrica/showroom en Bogotá.
*   **Bloque Inferior: Desacoplamiento Legal**
    > *"Veta Dorada es una marca comercial registrada. Todos los procesos de facturación, contratos legales, recaudos y garantías son operados y representados legalmente por la sociedad HERMANOS GARCIA GONZALEZ SAS, con NIT 901421357-9."*

---

## 6. Arquitectura de Composición de Productos en Base de Datos

(Mantiene el modelo de lista de materiales BOM agnóstica para colecciones de precio fijo).
1. Un "Mueble Terminado de Catálogo" es un producto maestro.
2. Su precio se calcula dinámicamente sumando el costo de sus insumos y mano de obra.
3. Asegura rentabilidad automática ante fluctuaciones de precios de proveedores.
