import { AgnosticDNA_Mutator } from './src/core/mcp/mutator';
import fs from 'fs';
import path from 'path';

const projectIntent = {
  name: "system_project",
  label: "Proyecto Agnóstico",
  description: "Entidad Maestra de Gestión de Repositorio y Despliegue",
  fields: [
    { key: "name", label: "Nombre del Proyecto", type: "text", required: true, width: "half", section: "Identidad" },
    { key: "slug", label: "Identidad Técnica (Repo)", type: "text", required: true, width: "half", section: "Identidad" },
    { key: "repo_url", label: "GitHub Repository", type: "text", required: true, width: "full", section: "Infraestructura" },
    { key: "vercel_link", label: "URL de Producción", type: "text", width: "half", section: "Infraestructura" },
    { key: "deployment_status", label: "Estado del Despliegue", type: "select", width: "half", section: "Infraestructura" },
    { key: "dna_strategy", label: "Estrategia ADN", type: "select", width: "half", section: "Configuración_Base" },
    { key: "storage_strategy", label: "Estrategia Almacenamiento", type: "select", width: "half", section: "Configuración_Base" }
  ]
};

// 🧬 Aplicar mutación para normalizar
const schemaItem = AgnosticDNA_Mutator.applyIntent(projectIntent);

// 🏺 Guardar en el ADN del Núcleo
const targetPath = path.join(process.cwd(), 'src', 'core', 'designer', 'dna', 'system_project.schema.json');
fs.writeFileSync(targetPath, JSON.stringify(schemaItem.data, null, 2));

console.log(`✅ Esquema system_project forjado con éxito en: ${targetPath}`);
