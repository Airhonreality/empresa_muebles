import React from 'react';
import { Shield, Navigation, Users } from 'lucide-react';

/**
 * 🛰️ FORGE SIGMA (Soberanía)
 * Gestión de acceso, roles, navegación y metadatos de sistema.
 */
export const ForgeSigma = ({ meta = {}, onChange }) => {
    const handleChange = (field, value) => {
        onChange({ ...meta, [field]: value });
    };

    return (
        <div className="forge-zone-sigma animate-fade">
            <header className="zone-header">
                <span className="zone-tag">SIGMA_GOV</span>
                <h2 className="zone-title">Soberanía y Gobernanza</h2>
            </header>

            <div className="forge-grid">
                <div className="input-group">
                    <label><Users size={12} /> ROLES REQUERIDOS</label>
                    <select 
                        value={meta.roles?.[0] || 'GUEST'} 
                        onChange={(e) => handleChange('roles', [e.target.value])}
                    >
                        <option value="GUEST">GUEST (Abierto)</option>
                        <option value="ADMIN">ADMIN (Restringido)</option>
                        <option value="AUDITOR">AUDITOR</option>
                    </select>
                </div>

                <div className="input-group">
                    <label><Navigation size={12} /> CONTEXTO DE REALIDAD</label>
                    <input 
                        type="text" 
                        value={meta.context || 'ENTITIES'} 
                        onChange={(e) => handleChange('context', e.target.value)}
                    />
                </div>
            </div>

            <div className="input-group">
                <label><Shield size={12} /> ESTRATEGIA DE RENDERIZADO</label>
                <div className="radio-group">
                    {['PROJECTION', 'RAW_DATA', 'SATELLITE'].map(type => (
                        <button 
                            key={type}
                            className={`radio-btn ${meta.render_type === type ? 'active' : ''}`}
                            onClick={() => handleChange('render_type', type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-zone-sigma { display: flex; flex-direction: column; gap: 2rem; padding: 2rem; border: 1px solid var(--border-soft); border-radius: var(--radius-md); }
                .zone-header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid var(--border-soft); padding-bottom: 1rem; }
                .zone-tag { font-size: 0.6rem; font-weight: 900; background: #6b4cff; color: white; padding: 0.2rem 0.5rem; border-radius: 2px; }
                .zone-title { margin: 0; font-size: 1.2rem; font-weight: 500; }
                
                .forge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .input-group { display: flex; flex-direction: column; gap: 0.6rem; }
                .input-group label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.5rem; }
                
                select, input { 
                    background: var(--surface-2); border: 1px solid var(--border-soft); 
                    color: white; padding: 0.8rem; border-radius: var(--radius-sm); outline: none;
                }

                .radio-group { display: flex; gap: 0.5rem; }
                .radio-btn { 
                    flex: 1; padding: 0.6rem; background: var(--surface-2); border: 1px solid var(--border-soft); 
                    color: var(--text-muted); font-size: 0.65rem; font-weight: 700; cursor: pointer; border-radius: var(--radius-sm);
                }
                .radio-btn.active { background: #6b4cff; color: white; border-color: #6b4cff; }
            `}} />
        </div>
    );
};
