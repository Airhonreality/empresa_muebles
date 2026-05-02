import React, { useState } from 'react';
import { Search, Tag, Database, Settings } from 'lucide-react';

/**
 * 🏛️ FORGE SIDEBAR (El Silo Inteligente)
 * Navegación y filtrado de materia mediante etiquetas y búsqueda real-time.
 */
export const ForgeSidebar = ({ materiaList = [], onSelect, activeSlug }) => {
    const [search, setSearch] = useState('');
    const [activeTags, setActiveTags] = useState([]);

    // Extraer etiquetas únicas (contextos) de la lista de materia
    const contexts = [...new Set(materiaList.map(m => m.meta?.context || 'SISTEMA'))];

    const toggleTag = (tag) => {
        setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const filtered = materiaList.filter(m => {
        const matchSearch = (m.slug + (m.data?.title || '')).toLowerCase().includes(search.toLowerCase());
        const matchTag = activeTags.length === 0 || activeTags.includes(m.meta?.context || 'SISTEMA');
        return matchSearch && matchTag;
    });

    return (
        <div className="forge-sidebar glass">
            <div className="sidebar-header">
                <div className="search-box">
                    <Search size={14} />
                    <input 
                        type="text" 
                        placeholder="BUSCAR MATERIA..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="tag-cloud">
                    {contexts.map(ctx => (
                        <button 
                            key={ctx} 
                            className={`tag-pill ${activeTags.includes(ctx) ? 'active' : ''}`}
                            onClick={() => toggleTag(ctx)}
                        >
                            {ctx}
                        </button>
                    ))}
                </div>
            </div>

            <div className="materia-list">
                {filtered.map(m => (
                    <div 
                        key={m.slug} 
                        className={`materia-item ${activeSlug === m.slug ? 'active' : ''}`}
                        onClick={() => onSelect(m)}
                    >
                        <div className="item-info">
                            <span className="item-slug">{m.slug}</span>
                            <span className="item-title">{m.data?.title?.es || m.data?.title || 'Sin Título'}</span>
                        </div>
                        <div className="item-meta">
                            {m.meta?.context === 'SISTEMA' ? <Settings size={12} /> : <Database size={12} />}
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-sidebar { height: 100%; display: flex; flex-direction: column; border-right: 1px solid var(--border-soft); }
                .sidebar-header { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid var(--border-soft); }
                .search-box { display: flex; align-items: center; gap: 0.8rem; background: rgba(0,0,0,0.2); padding: 0.6rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-soft); }
                .search-box input { background: transparent; border: none; color: white; font-size: 0.75rem; outline: none; width: 100%; letter-spacing: 0.05em; }
                .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .tag-pill { background: var(--surface-2); border: 1px solid var(--border-soft); color: var(--text-muted); font-size: 0.6rem; padding: 0.3rem 0.6rem; border-radius: 100px; cursor: pointer; transition: var(--transition-smooth); font-weight: 700; }
                .tag-pill.active { background: var(--accent-vibrant); color: white; border-color: var(--accent-vibrant); }
                
                .materia-list { flex-grow: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
                .materia-item { 
                    padding: 0.8rem 1rem; border-radius: var(--radius-sm); cursor: pointer; 
                    display: flex; justify-content: space-between; align-items: center;
                    transition: var(--transition-smooth); border: 1px solid transparent;
                }
                .materia-item:hover { background: rgba(255,255,255,0.03); }
                .materia-item.active { background: rgba(255,255,255,0.07); border-color: var(--border-soft); }
                .item-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .item-slug { font-size: 0.65rem; color: var(--accent-vibrant); font-weight: 700; letter-spacing: 0.05em; }
                .item-title { font-size: 0.85rem; color: var(--text-primary); }
                .item-meta { opacity: 0.3; }
            `}} />
        </div>
    );
};
