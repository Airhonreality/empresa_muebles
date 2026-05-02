import React from 'react';
import { BootstrapSchema } from '../../../score/logic/BootstrapSchema';

/**
 * 🛰️ FORGE ALFA (Dynamic Edition)
 * Ahora es un intérprete de esquemas. Genera inputs basados en el Arquetipo.
 */
export const ForgeAlfa = ({ data, meta, archetypes = {}, onChange }) => {
    
    // Obtener el esquema (del sistema o del bootstrap)
    const schema = archetypes[meta.context] || BootstrapSchema[meta.context];

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="forge-zone-alfa animate-fade">
            <header className="zone-header">
                <span className="zone-tag">ALFA_CORE</span>
                <h2 className="zone-title">{schema?.title || 'Identidad de Materia'}</h2>
            </header>

            {/* Siempre editamos el Slug */}
            <div className="input-group">
                <label>SLUG SOBERANO</label>
                <input 
                    type="text" 
                    value={data.slug || ''} 
                    onChange={(e) => handleChange('slug', e.target.value)}
                />
            </div>

            {/* Generación Dinámica de Campos basada en el Esquema */}
            {schema?.fields?.map(field => (
                <div key={field.name} className="input-group">
                    <label>{field.label.toUpperCase()}</label>
                    <input 
                        type={field.type || 'text'} 
                        value={data[field.name] || ''} 
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={`Ingresa ${field.label}...`}
                    />
                </div>
            ))}

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-zone-alfa { display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem; background: rgba(255,255,255,0.01); border-radius: var(--radius-md); }
                .zone-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--border-soft); padding-bottom: 1rem; }
                .zone-tag { font-size: 0.6rem; font-weight: 900; background: var(--accent-vibrant); color: white; padding: 0.2rem 0.5rem; border-radius: 2px; }
                .zone-title { margin: 0; font-size: 1.2rem; font-weight: 500; }
                .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .input-group label { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; }
                .input-group input { background: var(--surface-2); border: 1px solid var(--border-soft); color: white; padding: 0.8rem; border-radius: var(--radius-sm); outline: none; }
            `}} />
        </div>
    );
};
