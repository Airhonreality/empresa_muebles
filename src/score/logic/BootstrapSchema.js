/**
 * 🌱 BOOTSTRAP SCHEMA
 * El esquema mínimo inyectado cuando el silo está vacío.
 * Permite crear las primeras Meta-Clases y la Configuración de Sistema.
 */

export const BootstrapSchema = {
    'META_CLASSES': {
        title: 'Gestor de Clases (Arquetipos)',
        fields: [
            { name: 'name', label: 'Nombre de la Clase', type: 'text' },
            { name: 'icon', label: 'Icono (Lucide)', type: 'text' },
            { name: 'fields', label: 'Campos Requeridos (JSON)', type: 'text' }
        ]
    },
    'SYSTEM_CONFIG': {
        title: 'Configuración del Satélite',
        fields: [
            { name: 'site_title', label: 'Título del Sitio', type: 'text' },
            { name: 'home_slug', label: 'Slug de Inicio', type: 'text' },
            { name: 'active_nav_slug', label: 'Navbar Activo', type: 'text' }
        ]
    }
};
