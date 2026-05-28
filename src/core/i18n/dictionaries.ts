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
    settings: 'Configuración',
    data: 'Arquitectura de Datos',
    layout: 'Diseño y Estructura',
    system: 'Capacidades de Sistema',
    locked: 'Bloqueado',
    unlocked: 'Desbloqueado'
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
    field_key: 'Identidad (ID)',
    field_label: 'Etiqueta Visual',
    field_type: 'Tipos y Reglas',
    field_location: 'Ubicación / Sección',
    field_help: 'Ayuda (Tooltip)',
    delete_schema: 'Eliminar Esquema',
    architect_title: 'Arquitecto de Esquemas',
    consolidate: 'Consolidar DNA',
    discard: 'Descartar',
    materialize: 'Materializar Infraestructura',
    observatory: 'Observatorio de Infraestructura',
    purgue_warning: '¿Estás seguro de eliminar esta definición permanentemente?',
    delete_confirm: '¿Estás seguro de eliminar este esquema? Esta acción no se puede deshacer.',
    no_fields: 'Sin campos definidos. Empieza añadiendo uno.'
  },
  explorer: {
    title: 'Repositorio de Entidades',
    empty: 'No hay esquemas definidos. Crea uno en el constructor.',
    new_item: 'Nuevo',
    custom_logic: 'Lógica personalizada activa',
    automatic_view: 'Vista automática de datos'
  },
  agnostic: {
    intent: {
      label: 'Intención (Modo Proyección)',
      auto: 'Adaptativo (Inferencia de Contexto)',
      create: 'Creación (Lienzo Vacío)',
      edit: 'Edición (Cargar por ID)',
      view: 'Lectura (Solo Proyección)',
      list: 'Lista (Colección)',
      description: 'Define cómo debe despertar el bloque: si esperando datos o listo para crear materia nueva.'
    },
    blocks: {
      form: { name: 'Formulario / Ficha', description: 'Proyector de campos para lectura o escritura.' },
      table: { name: 'Tabla de Datos', description: 'Vista tabular densa con soporte para acciones masivas.' },
      section: { name: 'Sección de Diseño', description: 'Contenedor estructural para agrupar otros bloques.' },
      collection: { name: 'Colección Visual', description: 'Grid dinámico de tarjetas para exploración de materia.' },
      belt: { name: 'Cinta de Herramientas', description: 'Contenedor horizontal para micro-acciones y estado.' },
      sheet: { name: 'Hoja de Cálculo', description: 'Interfaz de edición masiva tipo Excel.' },
      project_selector: { name: 'Buscador de Proyectos', description: 'Selector maestro para anclar la gravedad de la página.' },
      custom: { name: 'Actor Personalizado', description: 'Puente para inyectar componentes React externos.' }
    },
    operations: {
      discover_infrastructure: "Sincronizar Infraestructura",
      discover_infrastructure_desc: "Detectar tablas y columnas físicas en Supabase para generar DNA."
    }
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
    settings: 'Settings',
    data: 'Data Architecture',
    layout: 'Design & Structure',
    system: 'System Capabilities',
    locked: 'Locked',
    unlocked: 'Unlocked'
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
    field_key: 'Identity (ID)',
    field_label: 'Visual Label',
    field_type: 'Types & Rules',
    field_location: 'Location / Section',
    field_help: 'Help (Tooltip)',
    delete_schema: 'Delete Schema',
    architect_title: 'Schema Architect',
    consolidate: 'Consolidate DNA',
    discard: 'Discard',
    materialize: 'Materialize Infrastructure',
    observatory: 'Infrastructure Observatory',
    purgue_warning: 'Are you sure you want to delete this structural definition permanently?',
    delete_confirm: 'Are you sure you want to delete this schema? This action cannot be undone.',
    no_fields: 'No fields defined. Start by adding one.'
  },
  explorer: {
    title: 'Entity Repository',
    empty: 'No schemas found. Create one in the builder.',
    new_item: 'New',
    custom_logic: 'Custom logic active',
    automatic_view: 'Automatic data view'
  },
  agnostic: {
    intent: {
      label: 'Intent (Projection Mode)',
      auto: 'Adaptive (Context Inference)',
      create: 'Creation (Empty Canvas)',
      edit: 'Edition (Load by ID)',
      view: 'Read-only (Projection)',
      list: 'List (Collection)',
      description: 'Defines how the block should wake up: waiting for data or ready to create new matter.'
    },
    blocks: {
      form: { name: 'Form / Record', description: 'Field projector for read or write.' },
      table: { name: 'Data Table', description: 'Dense tabular view with bulk actions support.' },
      section: { name: 'Layout Section', description: 'Structural container to group other blocks.' },
      collection: { name: 'Visual Collection', description: 'Dynamic grid of cards for matter exploration.' },
      belt: { name: 'Tool Belt', description: 'Horizontal container for micro-actions and state.' },
      sheet: { name: 'Spreadsheet', description: 'Excel-like bulk editing interface.' },
      project_selector: { name: 'Project Selector', description: 'Master selector to anchor page gravity.' },
      custom: { name: 'Custom Actor', description: 'Bridge to inject external React components.' }
    },
    operations: {
      discover_infrastructure: "Sync Infrastructure",
      discover_infrastructure_desc: "Detect physical tables and columns in Supabase to generate DNA."
    }
  }
};

export type Dictionary = typeof es;
export type TranslationKey = keyof Dictionary;
