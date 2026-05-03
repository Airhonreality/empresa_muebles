export const es = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    new: 'Nuevo',
    loading: 'Cargando...',
    error: 'Error',
    actions: 'Acciones',
    settings: 'Configuración'
  },
  schema: {
    title: 'Constructor de Esquemas',
    system_config: 'Configuración del Sistema',
    definitions: 'Definiciones de Esquemas',
    routes: 'Rutas de Páginas',
    new_schema: 'Nuevo Esquema',
    schema_name: 'Nombre del Esquema',
    fields_arch: 'Arquitectura de Campos',
    add_field: 'Añadir Campo',
    field_key: 'Clave',
    field_label: 'Etiqueta',
    field_type: 'Tipo',
    field_opts: 'Opciones',
    placeholder_name: 'Producto, Cliente, Pedido...',
    no_fields: 'Sin campos definidos. Empieza añadiendo uno.'
  },
  explorer: {
    title: 'Repositorio de Entidades',
    empty: 'No hay esquemas definidos. Crea uno en el constructor.',
    new_item: 'Nuevo',
    custom_logic: 'Lógica personalizada activa',
    automatic_view: 'Vista automática de datos'
  }
};

export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    new: 'New',
    loading: 'Loading...',
    error: 'Error',
    actions: 'Actions',
    settings: 'Settings'
  },
  schema: {
    title: 'Schema Builder',
    system_config: 'System Configuration',
    definitions: 'Schema Definitions',
    routes: 'Page Routes',
    new_schema: 'New Schema',
    schema_name: 'Schema Name',
    fields_arch: 'Fields Architecture',
    add_field: 'Add Field',
    field_key: 'Key',
    field_label: 'Label',
    field_type: 'Type',
    field_opts: 'Options',
    placeholder_name: 'Product, Client, Order...',
    no_fields: 'No fields defined. Start by adding one.'
  },
  explorer: {
    title: 'Entity Repository',
    empty: 'No schemas found. Create one in the builder.',
    new_item: 'New',
    custom_logic: 'Custom logic active',
    automatic_view: 'Automatic data view'
  }
};

export type Dictionary = typeof es;
export type TranslationKey = keyof Dictionary;
