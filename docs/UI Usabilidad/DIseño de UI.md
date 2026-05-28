C:\Users\javir\Documents\DEVs\agnostic system\docs\UI Usabilidad\Frame 478.png

"El panel cambia e indica su naturaleza según el objeto activo" es la clave de todo el diseño. El panel derecho no es estático: se reconfigura completamente según el tipo de nodo seleccionado. Tus imágenes muestran al menos cinco estados distintos del mismo panel:



El panel sigue una jerarquía consistente de arriba hacia abajo, ordenada de lo más general a lo más específico:



b) Position — el bloque más universal, presente en todos los estados. Contiene:





Alignment: matriz de botones de alineación (horizontal y vertical respecto al contenedor).



Position: coordenadas X / Y absolutas.



Rotation: ángulo + íconos de volteo (flip horizontal/vertical).

c) Layout / Auto layout — aquí está una de tus observaciones más finas: "Cuando el padre es autolayout, las opciones de ancho y alto despliegan compactamente opciones de autolayout". El bloque Layout muta según el contexto:





En un frame normal: Dimensions (W/H) simples.



En Auto layout: aparecen Flow (dirección del flujo), Dimensions con menús desplegables (Fixed height, Fill container, Add min/max height, Apply variable), Alignment en matriz, Gap y Padding.



En Text: aparece Resizing en lugar de dimensiones fijas.

d) Appearance — Opacity y Corner radius. Bloque transversal a casi todos los tipos.
e) Bloques específicos por tipo — Fill, Stroke, Effects, Typography, edición de imagen, Selection colors, Export.

"Las propiedades vacías se colapsan" — Stroke, Effects y Export aparecen como filas colapsadas con un + cuando no tienen valor. Esto reduce la carga visual: el panel solo muestra "peso" donde hay contenido real. Es economía de atención — el usuario no procesa secciones irrelevantes.

"Las opciones selectivas muestran desplegables compactos" — campos como familia tipográfica, peso o tamaño usan dropdowns que conviven en una rejilla densa pero ordenada. La información se comprime sin perder accesibilidad.

"Al hacer clic en esos cuadritos se despliega la opción de aplicar tokens CSS o variables personalizadas" — el ícono de cuadrícula (que rodeaste en rojo, junto a "Typography") es el punto de entrada a las variables/tokens. Esto conecta valores literales con un sistema de diseño: cada propiedad puede pasar de valor crudo a valor referenciado (Apply variable...).

Estos tres patrones forman una gramática de revelación progresiva (progressive disclosure): mostrar lo esencial, colapsar lo vacío, y ofrecer profundidad bajo demanda.

Ademas cada parametro tiene un slide comodo deslizando encima con lick oprimido. 

4. Sistema de retroalimentación de selección (C:\Users\javir\Documents\DEVs\agnostic system\docs\UI Usabilidad\Frame 482.png)

"Cuando un frame está activo se señala con un azul delgado indicando el límite de la selección, y lo mismo en el árbol de nodos" — hay coherencia de estado en tres lugares simultáneos:

En el canvas: borde azul + etiqueta de nombre ("Frame 478") arriba y badge de dimensiones ("3198 × 1696") abajo.
En el árbol de capas (izquierda): la fila del nodo se resalta.
En el panel derecho: el encabezado muestra "Frame" y todas las propiedades correspondientes.