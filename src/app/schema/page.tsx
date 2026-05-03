'use client';

import { useState, useMemo } from 'react';
import { SchemaSidebar } from './components/SchemaSidebar';
import { SchemaDefinitionsPanel } from './components/SchemaDefinitionsPanel';
import { PageRoutesPanel } from './components/PageRoutesPanel';
import { SystemConfigPanel } from './components/SystemConfigPanel';

/**
 * Schema Architect Page (Core Builder)
 * Orchestrates the Materia management panels.
 */
export default function SchemaPage() {
  const [activeTab, setActiveTab] = useState('definitions');

  // Unified translations for the Architect
  const t = useMemo(() => {
    const dictionary: Record<string, string> = {
      'schema.definitions': 'Definiciones de Esquemas',
      'schema.new_schema': 'Nuevo Esquema',
      'schema.schema_name': 'Nombre del Esquema',
      'schema.fields_arch': 'Arquitectura de Campos',
      'schema.add_field': 'Añadir Campo',
      'routes.title': 'Orquestador de Rutas',
      'routes.new': 'Nueva Ruta',
      'system.config': 'Configuración del Sistema',
      'common.save': 'Guardar Cambios',
      'common.cancel': 'Cancelar'
    };
    return (key: string) => dictionary[key] || key;
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - The Power Control */}
      <SchemaSidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      {/* Main Content - The Forge */}
      <main className="flex-1 overflow-y-auto p-12 bg-[#FAF9F6]/50">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'definitions' && <SchemaDefinitionsPanel t={t} />}
          {activeTab === 'routes' && <PageRoutesPanel t={t} />}
          {activeTab === 'config' && <SystemConfigPanel t={t} />}
        </div>
      </main>
    </div>
  );
}
