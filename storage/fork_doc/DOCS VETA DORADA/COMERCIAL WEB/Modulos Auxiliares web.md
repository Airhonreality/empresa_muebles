#### El Modal de Calificación (`VetaAgendar.tsx`)
*   **Propósito:** Captura de prospectos (leads) calificados reduciendo el spam. Se acciona como un overlay despues de que el usuario cliquea en boton de contacto, captura la metadata del clic, guarda en db de leads, y redirige a whatsap.
*   **Diseño UX:** Caja modular que a pantalla completa en dispositivos móviles despliega un flujo en 2 pasos:
    *   *Paso 1:* Selección del tipo de proyecto (Cocina, Clóset, Muebles Auxiliares) y estado del mismo.
    *   *Paso 2:* Datos del contacto (Nombre y teléfono) con redirección parametrizada al WhatsApp de la marca, registrando el identificador publicitario en segundo plano de manera segura en la base de datos local.
