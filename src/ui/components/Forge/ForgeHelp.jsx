import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

/**
 * 🔮 FORGE ORACLE (Ayuda Orgánica)
 * Un botón discreto y curvo que despliega la guía de inicio.
 */
export const ForgeHelp = () => {
    const [isOpen, setIsOpen] = useState(false);

    const tutorialContent = `
# 🛰️ GUÍA DE IGNICIÓN SOBERANA

1. **Configura el Satélite**: Edita la entidad en \`SYSTEM_CONFIG\`.
2. **Define Leyes**: Crea arquetipos en \`META_CLASSES\`.
3. **Proyecta Vistas**: Crea rutas en \`VIEW_PROJECTIONS\`.

[Ver documentación completa →](file:///docs/README.md)
`;

    return (
        <>
            {/* Botón Orgánico */}
            <button className="forge-help-trigger animate-fade" onClick={() => setIsOpen(true)}>
                <HelpCircle size={20} strokeWidth={1.5} />
            </button>

            {/* Modal de Ayuda */}
            {isOpen && (
                <div className="forge-help-overlay" onClick={() => setIsOpen(false)}>
                    <div className="forge-help-modal glass" onClick={e => e.stopPropagation()}>
                        <header>
                            <h2>ORÁCULO DE LA FORJA</h2>
                            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                        </header>
                        <div className="help-content" data-color-mode="dark">
                            <MDEditor.Markdown source={tutorialContent} />
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-help-trigger {
                    position: fixed; bottom: 2rem; right: 2rem;
                    width: 3.5rem; height: 3.5rem;
                    background: var(--surface-2); border: 1px solid var(--border-soft);
                    color: var(--text-secondary); border-radius: 50%; /* Sin puntas */
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: var(--transition-smooth);
                    z-index: 999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .forge-help-trigger:hover { 
                    transform: scale(1.1) rotate(10deg); 
                    color: white; border-color: var(--accent-vibrant); 
                }

                .forge-help-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000; backdrop-filter: blur(5px);
                }
                .forge-help-modal {
                    width: 90%; max-width: 500px; padding: 2.5rem;
                    border-radius: 2rem; /* Bordes muy suaves/orgánicos */
                    border: 1px solid var(--border-strong);
                }
                .forge-help-modal header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 2rem; border-bottom: 1px solid var(--border-soft);
                    padding-bottom: 1rem;
                }
                .forge-help-modal h2 { font-size: 0.7rem; letter-spacing: 0.3em; font-weight: 900; opacity: 0.5; }
                .forge-help-modal button { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
                
                .help-content { font-size: 0.9rem; line-height: 1.6; }
                .wmde-markdown { background: transparent !important; }
            `}} />
        </>
    );
};
