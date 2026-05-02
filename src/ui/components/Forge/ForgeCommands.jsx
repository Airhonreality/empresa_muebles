import React from 'react';
import { Save, Trash2, RefreshCw } from 'lucide-react';

/**
 * 🛰️ FORGE COMMANDS
 * La barra de comandos superior. Gestiona la cristalización y disolución de materia.
 */
export const ForgeCommands = ({ isDirty, onSave, onDelete }) => {
    return (
        <div className="forge-commands-bar glass animate-fade">
            <div className="status-indicator">
                {isDirty ? (
                    <span className="status-dirty"><RefreshCw size={12} className="spin" /> MATERIA INESTABLE (Cambios sin guardar)</span>
                ) : (
                    <span className="status-clean">✨ MATERIA CRISTALIZADA</span>
                )}
            </div>

            <div className="actions">
                <button 
                    className={`btn-save ${isDirty ? 'active' : ''}`} 
                    onClick={onSave}
                    disabled={!isDirty}
                >
                    <Save size={16} /> CRISTALIZAR
                </button>
                
                <button className="btn-delete" onClick={onDelete}>
                    <Trash2 size={16} /> DISOLVER
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-commands-bar { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 1rem 2rem; border-radius: var(--radius-md); 
                    border: 1px solid var(--border-soft); margin-bottom: 2rem;
                    position: sticky; top: 1rem; z-index: 100;
                }
                .status-indicator { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; }
                .status-dirty { color: #ffab00; display: flex; align-items: center; gap: 0.5rem; }
                .status-clean { color: #00ff88; }
                
                .actions { display: flex; gap: 1rem; }
                .actions button { 
                    display: flex; align-items: center; gap: 0.5rem; 
                    background: transparent; border: 1px solid var(--border-soft); 
                    color: white; padding: 0.6rem 1.2rem; border-radius: var(--radius-sm);
                    font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: var(--transition-smooth);
                }
                .btn-save.active { background: var(--accent-vibrant); border-color: var(--accent-vibrant); box-shadow: 0 0 20px rgba(0, 112, 243, 0.3); }
                .btn-delete:hover { border-color: #ff4d4d; color: #ff4d4d; }
                
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 2s linear infinite; }
            `}} />
        </div>
    );
};
