import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { motion, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Type, Grid, Image as ImageIcon, Code, Layout } from 'lucide-react';

/**
 * 🛰️ FORGE OMEGA (Geometric Edition)
 * Permite componer materia definiendo su peso geométrico (Span 1-12).
 */
export const ForgeOmega = ({ blocks = [], onChange }) => {
    
    const addBlock = (type) => {
        const newBlock = { 
            id: `block-${Date.now()}`, 
            type, 
            content: type === 'DYNAMIC_GRID' ? { context_id: '', projection: {} } : '',
            layout: { span: 12 } // Por defecto 100%
        };
        onChange([...blocks, newBlock]);
    };

    const updateBlock = (id, field, value) => {
        onChange(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleLayoutChange = (id, span) => {
        const block = blocks.find(b => b.id === id);
        updateBlock(id, 'layout', { ...block.layout, span: parseInt(span) });
    };

    return (
        <div className="forge-zone-omega animate-fade" data-color-mode="dark">
            <header className="zone-header">
                <span className="zone-tag">OMEGA_MATTER</span>
                <h2 className="zone-title">Composición de Materia</h2>
            </header>

            <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="blocks-container">
                {blocks.map((block) => (
                    <Reorder.Item key={block.id} value={block} className="block-editor-wrapper">
                        <div className="block-editor glass">
                            <div className="block-controls">
                                <div className="block-drag-handle"><GripVertical size={14} /></div>
                                <div className="layout-picker">
                                    <label>SPAN</label>
                                    <select 
                                        value={block.layout?.span || 12} 
                                        onChange={(e) => handleLayoutChange(block.id, e.target.value)}
                                    >
                                        {[12, 8, 6, 4, 3].map(s => <option key={s} value={s}>{s}/12</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="block-content-editor">
                                {block.type === 'MARKDOWN' ? (
                                    <MDEditor
                                        value={block.content || ''}
                                        onChange={(val) => updateBlock(block.id, 'content', val)}
                                        preview="edit"
                                        height={150}
                                    />
                                ) : (
                                    <input 
                                        className="simple-input"
                                        value={block.content || ''}
                                        onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                                        placeholder={`CONTENIDO ${block.type}...`}
                                    />
                                )}
                            </div>

                            <button className="btn-remove-block" onClick={() => updateBlock(block.id, 'delete', true)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <div className="block-picker-notion glass">
                <button onClick={() => addBlock('HEADING')}><Type size={14} /> HEADING</button>
                <button onClick={() => addBlock('MARKDOWN')}><Code size={14} /> MARKDOWN</button>
                <button onClick={() => addBlock('DYNAMIC_GRID')}><Grid size={14} /> GRID</button>
                <button onClick={() => addBlock('IMAGE')}><ImageIcon size={14} /> IMAGE</button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .blocks-container { display: flex; flex-direction: column; gap: 1rem; }
                .block-editor { display: flex; gap: 1.5rem; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-soft); }
                .block-controls { display: flex; flex-direction: column; gap: 1rem; width: 60px; align-items: center; }
                .layout-picker { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
                .layout-picker label { font-size: 0.5rem; font-weight: 900; opacity: 0.5; }
                .layout-picker select { background: var(--surface-2); border: none; color: white; font-size: 0.6rem; border-radius: 2px; padding: 0.2rem; }
                .block-content-editor { flex-grow: 1; }
                .simple-input { width: 100%; background: transparent; border: none; color: white; font-size: 1.2rem; outline: none; }
                .block-picker-notion { display: flex; gap: 1rem; padding: 1.5rem; border: 1px solid var(--border-soft); justify-content: center; margin-top: 2rem; border-radius: var(--radius-md); }
                .block-picker-notion button { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.7rem; }
            `}} />
        </div>
    );
};
