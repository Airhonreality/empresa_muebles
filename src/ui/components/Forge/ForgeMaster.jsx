import React, { useState, useEffect, useMemo } from 'react';
import { ForgeSidebar } from './ForgeSidebar';
import { ForgeAlfa } from './ForgeAlfa';
import { ForgeSigma } from './ForgeSigma';
import { ForgeOmega } from './ForgeOmega';
import { ForgeCommands } from './ForgeCommands';
import { useSovereign } from '../../../score/SovereignContext';
import { BootstrapSchema } from '../../../score/logic/BootstrapSchema';

/**
 * 🏛️ FORGE MASTER (MMS Level 2)
 * El orquestador ya no tiene lógica de negocio; es un intérprete de la arquitectura cargada.
 */
export const ForgeMaster = () => {
    const { state, bridge, dispatch } = useSovereign();
    const [materiaList, setMateriaList] = useState([]);
    const [currentMateria, setCurrentMateria] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Listado de contextos disponibles (Silo + Bootstrap)
    const availableContexts = useMemo(() => {
        const siloContexts = Object.keys(state.system.archetypes);
        const bootContexts = Object.keys(BootstrapSchema);
        return [...new Set([...siloContexts, ...bootContexts])];
    }, [state.system.archetypes]);

    useEffect(() => {
        loadMateriaFromAllContexts();
    }, [availableContexts]);

    const loadMateriaFromAllContexts = async () => {
        let allMateria = [];
        for (const ctx of availableContexts) {
            try {
                const res = await bridge.execute({ protocol: 'ATOM_READ', context_id: ctx });
                if (res.items) {
                    // Inyectamos el contexto en el meta si no lo tiene
                    const items = res.items.map(m => ({ ...m, meta: { ...m.meta, context: ctx } }));
                    allMateria = [...allMateria, ...items];
                }
            } catch (e) { console.warn(`Contexto ${ctx} vacío.`); }
        }
        setMateriaList(allMateria);
    };

    const handleSelect = (m) => {
        if (isDirty && !window.confirm("Descartar cambios?")) return;
        setCurrentMateria(JSON.parse(JSON.stringify(m)));
        setIsDirty(false);
    };

    const handleSave = async () => {
        if (!currentMateria) return;
        const context = currentMateria.meta?.context || 'ENTITIES';
        try {
            await bridge.execute({
                protocol: 'UPDATE',
                context_id: context,
                data: currentMateria
            });
            setIsDirty(false);
            
            // Si guardamos una META_CLASS o SYSTEM_CONFIG, forzamos re-ignición parcial
            if (context === 'META_CLASSES' || context === 'SYSTEM_CONFIG') {
                window.location.reload(); // Forma bruta de re-ignitar por ahora
            } else {
                loadMateriaFromAllContexts();
            }
            alert("✨ MATERIA CRISTALIZADA");
        } catch (e) { alert("ERROR: " + e.message); }
    };

    return (
        <div className="forge-master-layout">
            <aside className="forge-aside">
                <div className="silo-selector">
                    <button className="btn-ignite-new" onClick={() => handleSelect({ 
                        slug: 'nueva-entidad', 
                        data: {}, 
                        meta: { context: availableContexts[0], roles: ['GUEST'] } 
                    })}>+ NUEVA MATERIA</button>
                </div>
                <ForgeSidebar 
                    materiaList={materiaList} 
                    onSelect={handleSelect} 
                    activeSlug={currentMateria?.slug}
                />
            </aside>

            <main className="forge-main">
                {currentMateria ? (
                    <div className="forge-scroller animate-fade">
                        <ForgeCommands isDirty={isDirty} onSave={handleSave} />
                        
                        <div className="forge-zones">
                            <ForgeAlfa 
                                data={currentMateria.data} 
                                meta={currentMateria.meta}
                                archetypes={state.system.archetypes}
                                onChange={(newData) => {
                                    setCurrentMateria(prev => ({ ...prev, data: { ...prev.data, ...newData }, slug: newData.slug || prev.slug }));
                                    setIsDirty(true);
                                }} 
                            />
                            
                            <ForgeSigma 
                                meta={currentMateria.meta} 
                                onChange={(newMeta) => {
                                    setCurrentMateria(prev => ({ ...prev, meta: { ...prev.meta, ...newMeta } }));
                                    setIsDirty(true);
                                }} 
                            />

                            <ForgeOmega 
                                blocks={currentMateria.data?.composition || []} 
                                onChange={(newBlocks) => {
                                    setCurrentMateria(prev => ({ ...prev, data: { ...prev.data, composition: newBlocks } }));
                                    setIsDirty(true);
                                }} 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="forge-empty-state">
                        <h2>SISTEMA DE GESTIÓN DE MATERIA (MMS)</h2>
                        <p>El satélite está en órbita. Selecciona una entidad para proyectar realidad.</p>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .forge-master-layout { display: grid; grid-template-columns: 350px 1fr; height: 100vh; background: var(--surface-0); overflow: hidden; }
                .silo-selector { padding: 1rem; border-bottom: 1px solid var(--border-soft); }
                .btn-ignite-new { width: 100%; padding: 0.8rem; background: var(--accent-vibrant); border: none; color: white; border-radius: var(--radius-sm); font-weight: 900; font-size: 0.7rem; cursor: pointer; }
                .forge-main { height: 100%; overflow-y: auto; }
                .forge-scroller { padding: 2rem 4rem; max-width: 900px; margin: 0 auto; }
                .forge-zones { display: flex; flex-direction: column; gap: 3rem; padding-bottom: 15rem; }
                .forge-empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.3; }
            `}} />
        </div>
    );
};
