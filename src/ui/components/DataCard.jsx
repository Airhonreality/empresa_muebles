import React from 'react';

/**
 * 🗂️ DATA CARD (Universal Cell)
 * Proyecta materia cruda basándose en un mapeo de proyección.
 */
export const DataCard = ({ materia = {}, projection = {} }) => {
    // Mapeo agnóstico: Se adapta a cualquier forma de JSON
    const title = materia[projection.title || 'title'] || materia.name || 'Sin Título';
    const subtitle = materia[projection.subtitle || 'subtitle'] || materia.slug || '';
    const image = materia[projection.image || 'image'] || materia.cover;

    return (
        <div className="data-card glass animate-fade">
            {image && (
                <div className="card-media">
                    <img src={image} alt={title} loading="lazy" />
                </div>
            )}
            <div className="card-content">
                {subtitle && <span className="card-subtitle">{subtitle}</span>}
                <h3 className="card-title">{title}</h3>
                {materia.description && <p className="card-desc">{materia.description}</p>}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .data-card {
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    transition: var(--transition-smooth);
                    border: 1px solid var(--border-soft);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .data-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--border-strong);
                    background: rgba(255,255,255,0.05);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .card-media img { 
                    width: 100%; 
                    height: 180px; 
                    object-fit: cover; 
                    opacity: 0.7; 
                    transition: var(--transition-smooth);
                }
                .data-card:hover .card-media img { opacity: 1; }
                .card-content { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                .card-subtitle { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; }
                .card-title { margin: 0; font-size: 1.25rem; font-weight: 500; color: var(--text-primary); }
                .card-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}} />
        </div>
    );
};
