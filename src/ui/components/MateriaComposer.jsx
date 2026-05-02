import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { DataCard } from './DataCard';
import { useIndraResonance } from '../../score/hooks/useIndraResonance';
import { useSovereignAction } from '../../score/hooks/useSovereignAction';

/**
 * 🧱 BLOCK VESSEL (El Contenedor Geométrico)
 */
const BlockVessel = ({ layout = {}, children }) => {
    const span = layout.span || 12;
    const style = {
        '--span': span,
        '--align': layout.align || 'stretch',
        '--padding': layout.padding || '0rem'
    };

    return (
        <div className={`block-vessel ${layout.glass ? 'glass' : ''} animate-fade`} style={style}>
            <div className="vessel-content">{children}</div>
            <style dangerouslySetInnerHTML={{ __html: `
                .block-vessel { flex: 0 0 calc((100% / 12 * var(--span)) - (var(--fluid-gap, 2vw) * (12 - var(--span)) / 12)); align-self: var(--align); min-width: 0; }
                .vessel-content { padding: var(--padding); }
                @media (max-width: 768px) { .block-vessel { flex: 0 0 100% !important; } }
            `}} />
        </div>
    );
};

/**
 * ⚡ SOVEREIGN TRIGGER (El Botón Agnóstico)
 * No tiene lógica propia. Solo emite una Intención al Dispatcher.
 */
const SovereignTrigger = ({ content }) => {
    const { triggerIntent } = useSovereignAction();
    return (
        <button 
            className="btn-sovereign" 
            onClick={() => triggerIntent(content.intent_id, content.payload || {})}
        >
            {content.label || 'EJECUTAR ACCIÓN'}
            <style dangerouslySetInnerHTML={{ __html: `
                .btn-sovereign { 
                    padding: 1.2rem 2.5rem; background: var(--accent-vibrant); 
                    color: white; border: none; border-radius: var(--radius-sm);
                    font-weight: 900; font-size: 0.75rem; letter-spacing: 0.15em;
                    cursor: pointer; transition: var(--transition-smooth); width: 100%;
                }
                .btn-sovereign:hover { transform: scale(1.02); filter: brightness(1.1); }
            `}} />
        </button>
    );
};

/**
 * 🛰️ DYNAMIC GRID PROJECTION
 */
const DynamicGrid = ({ config = {} }) => {
    const { remoteData: items, loading } = useIndraResonance(config.context_id);
    if (loading) return <div className="loading-shimmer">RESONANDO...</div>;
    return (
        <div className="materia-grid-container">
            {items.map((m, i) => (
                <BlockVessel key={i} layout={{ span: config.span || 4 }}>
                    <DataCard materia={m} projection={config.projection} />
                </BlockVessel>
            ))}
        </div>
    );
};

/**
 * 🎨 MATERIA COMPOSER (MMS Level 2 + Workflow Enabled)
 */
export const MateriaComposer = ({ blocks = [] }) => {
    if (!blocks || blocks.length === 0) return null;

    return (
        <div className="materia-grid-container" data-color-mode="dark">
            {blocks.map((block, i) => (
                <BlockVessel key={block.id || i} layout={block.layout}>
                    {block.type === 'HEADING' && <h2 className="block-title">{block.content}</h2>}
                    {block.type === 'MARKDOWN' && (
                        <div className="block-markdown-pro">
                            <MDEditor.Markdown source={block.content} style={{ background: 'transparent' }} />
                        </div>
                    )}
                    {block.type === 'DYNAMIC_GRID' && <DynamicGrid config={block.content} />}
                    {block.type === 'IMAGE' && <img src={block.content} className="block-img" alt="Materia" />}
                    {block.type === 'SOVEREIGN_TRIGGER' && <SovereignTrigger content={block.content} />}
                </BlockVessel>
            ))}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .materia-grid-container { display: flex; flex-wrap: wrap; gap: var(--fluid-gap, 2vw); width: 100%; max-width: 1400px; margin: 0 auto; }
                .block-title { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.05em; margin: 0; line-height: 1; }
                .block-markdown-pro { font-size: 1.1rem; line-height: 1.7; color: var(--text-secondary); }
                .block-img { width: 100%; border-radius: var(--radius-md); }
                .wmde-markdown { background: transparent !important; color: inherit !important; }
            `}} />
        </div>
    );
};
