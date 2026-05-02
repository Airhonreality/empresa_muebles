# 📜 PROTOCOLO: UQO (Universal Query Object)

El UQO es el lenguaje único que hablan los componentes de la interfaz con el Core del sistema. Este protocolo garantiza que las peticiones sean agnósticas a la base de datos final.

## 📥 1. Estructura de Petición
Toda llamada al Bridge debe seguir este esquema:

```javascript
{
  protocol: 'ATOM_READ' | 'UPDATE' | 'CREATE' | 'DELETE' | 'TRIGGER_WORKFLOW',
  context_id: 'STRING', // El namespace de la materia
  data: { ... },        // La carga útil de materia
  payload: { ... }      // Parámetros extra para flujos
}
```

## 🔄 2. Diccionario de Protocolos

### `ATOM_READ`
Sintoniza el Silo para traer todas las entidades de un contexto.
*   **Retorno**: Un array de objetos Materia `{ slug, data, meta }`.

### `UPDATE` / `CREATE`
Cristaliza los cambios en el Silo activo. 
*   **Nota**: Si no hay conexión, el Bridge lo guarda en el `LocalVault` para sincronización posterior.

### `TRIGGER_WORKFLOW`
No realiza cambios directos. Envía un `intent_id` al **WorkflowEngine** para procesar lógica compleja.

## 🛡️ 3. Reglas de Resonancia
Tras cada ejecución de protocolo, el sistema genera un evento de **Resonancia**. Esto actualiza el `AppState` global, provocando que todos los componentes visuales se redibujen con la nueva realidad sin necesidad de recargar la página.
