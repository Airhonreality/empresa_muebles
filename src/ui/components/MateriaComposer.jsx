import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { DataCard } from './DataCard';
import { useIndraResonance } from '../../score/hooks/useIndraResonance';
import { useSovereignAction } from '../../score/hooks/useSovereignAction';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useSovereign } from '../../score/SovereignContext';
import { Upload, File, Link as LinkIcon, ShieldAlert } from 'lucide-react';

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
                    padding: 1.2rem 2.5rem; background: #ffffff; 
                    color: #000000; border: none; border-radius: var(--radius-sm);
                    font-weight: 900; font-size: 0.75rem; letter-spacing: 0.15em;
                    cursor: pointer; transition: var(--transition-smooth); width: 100%;
                }
                .btn-sovereign:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.1); }
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
 * 👤 IDENTITY TRIGGER (Acceso Soberano)
 * Bloque agnóstico para invocar la identidad del actor.
 */
const IdentityTrigger = ({ content }) => {
    const { dispatch } = useSovereign();
    
    return (
        <div className="identity-trigger-wrapper">
            <GoogleLogin
                onSuccess={credentialResponse => {
                    const profile = jwtDecode(credentialResponse.credential);
                    dispatch({ type: 'setIdentity', payload: profile });
                    console.log("👤 [Identity] Actor reconocido:", profile.name);
                }}
                onError={() => console.error("❌ Fallo en reconocimiento de identidad")}
                useOneTap
                theme="filled_black"
                shape="circle"
            />
            <style dangerouslySetInnerHTML={{ __html: `
                .identity-trigger-wrapper { display: flex; justify-content: center; padding: 1rem; }
            `}} />
        </div>
    );
};

/**
 * 📁 FILE VESSEL (Gestor Canónico de Activos)
 * Soporta Drag & Drop, Explorador y Links.
 */
const FileVessel = ({ content = {}, onUpdate }) => {
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            onUpdate({ ...content, url: data.url, filename: file.name, type: file.type });
        } catch (e) { console.error("❌ Fallo en subida física:", e); }
    };

    return (
        <div className="file-vessel glass">
            {content.url ? (
                <div className="file-preview">
                    <File size={40} strokeWidth={1} />
                    <div className="file-info">
                        <span className="file-name">{content.filename}</span>
                        <a href={content.url} target="_blank" className="file-link">VER ACTIVO</a>
                    </div>
                </div>
            ) : (
                <label className="file-dropzone">
                    <Upload size={30} />
                    <span>ARRASTRA MATERIA BINARIA O HAZ CLIC</span>
                    <input type="file" onChange={handleFileUpload} hidden />
                </label>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
                .file-vessel { padding: 2rem; border: 2px dashed var(--border-soft); border-radius: var(--radius-md); transition: var(--transition-smooth); }
                .file-vessel:hover { border-color: var(--text-primary); }
                .file-dropzone { display: flex; flex-direction: column; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-muted); font-size: 0.7rem; font-weight: 900; }
                .file-preview { display: flex; align-items: center; gap: 1.5rem; }
                .file-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .file-name { font-size: 0.9rem; font-weight: 700; }
                .file-link { font-size: 0.6rem; color: var(--text-muted); text-decoration: none; border-bottom: 1px solid; }
            `}} />
        </div>
    );
};

/**
 * 🎨 MATERIA COMPOSER (MMS Level 2 + Workflow Enabled)
 */
export const MateriaComposer = ({ blocks = [], meta = {} }) => {
    const { state } = useSovereign();
    
    // 🛡️ ACCESO SOBERANO (Whitelist)
    if (meta.access_control?.type === 'WHITELIST') {
        const isWhitelisted = meta.access_control.emails.includes(state.identity?.email);
        if (!isWhitelisted) {
            return (
                <div className="access-denied animate-fade">
                    <ShieldAlert size={50} strokeWidth={1} />
                    <h2>ACCESO RESTRINGIDO</h2>
                    <p>Tu firma digital no está en la whitelist de esta entidad.</p>
                    <style dangerouslySetInnerHTML={{ __html: `
                        .access-denied { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #ff4d4d; text-align: center; }
                        .access-denied h2 { font-size: 1rem; letter-spacing: 0.5em; margin-top: 2rem; }
                        .access-denied p { font-size: 0.8rem; opacity: 0.6; }
                    `}} />
                </div>
            );
        }
    }
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
                    {block.type === 'IDENTITY_TRIGGER' && <IdentityTrigger content={block.content} />}
                    {block.type === 'FILE_VESSEL' && <FileVessel content={block.content} />}
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
