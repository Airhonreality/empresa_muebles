vamos a deiseñar un erp par auna empresa de mobiliarion... vamos a ocmenzar por el disñeo del cotizador y la porpeusta de cotizacion.

cotizador, 





header con la metadata del proeycto, cliente, direccion, correo, cedula, etc etc, imgaina metadatos completos (poscicion fija en la parte de arriba)...

1.1 sub header colapsado desplegable con otros datos del proyecto: direccion del proyecto, dias estimados de entrega, gerantida (campos de tiempo/fecha),



cuerpo de cotizador: cards bloques de "espacios" en el eje Y, cada card estara distribuida asi: 





Header card espacios: titulo del espacio, + fila de pestañas para cada variante de cotizacion (variante1), boton "+" --> variante 2, etc..

------



cuerpo de cotizacion por espacio: lista de items cotizados, debe ser una sheets anidada para agregar filas "+" la fila importa del catalogo cada item con sus campos:

nombre, unidad de medida, cantidad, precio.

------



fila card espacio (colapsado por defecto, desplegable (solo se ve la franja)): contine campos de calculo de mano de obra: 1. dias de desarrollo, 2 dias de ensamblaje, 2 dias de instalación, cada campo con un contador (felcha arriba, flecha abajo)

----



Fotter de espacio tambien colapsable que muestra totales: 1. total materiales, 2. total mano de obra, 3 total espacio.

----cierra la card de espacio----



Boton "+" --> despleiga neuva card de esapcio vacio



 footer cotizador (posicion fija al final de la pantalla): 





banner con totalizacion de espacios



campos para: Costos operativos (moneda), Imprevistos de instalación (moneda), 2 campos ocultos solo desplegable con un boton secreto una felcha a un borde o algo asi; "descuento" y "ajuste" (campos para variar el precio final arbitrariamente)



Boton generar cotización (genera vista previa pdf).



FIN 

Cada campo de texto debe ser editable, ejemplo "nombre del espacio" "variante" datos de cleinte" allí mismo donde se proyectan debe ser el lugar ideal para editarse, con un doble clic se activa el campo para ser editado, para campos como cleinte peude ofrecer un desplegable porqeu son campos que ya estan guardados pero al mismo timepo debe permitir escribir en caso de querer registrar un cleinte neuvo, tod ala inteligencia radica en el campo NO BOTONES adicionales como "crear cliente nuevo" etc etc, mas denisdad y usabidiad agil... deben haber vistas movil y vista web pc... responsividad total. Colores de estetica de lujo que resuenen con la marca "veta de oro".