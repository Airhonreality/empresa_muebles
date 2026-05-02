import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { AppState } from './AppState';
import { AgnosticBridge } from './logic/AgnosticBridge';

const SovereignContext = createContext();
const bridge = new AgnosticBridge();

function stateReducer(state, action) {
    const mutation = AppState.mutations[action.type];
    if (mutation) return mutation(state, action.payload);
    return state;
}

export const SovereignProvider = ({ children }) => {
    const [state, dispatch] = useReducer(stateReducer, AppState);

    // 🔥 SECUENCIA DE IGNICIÓN (Bootstrapping)
    useEffect(() => {
        const ignite = async () => {
            dispatch({ type: 'setLoading', payload: true });
            try {
                // 1. Cargar Configuración de Sistema
                const configRes = await bridge.execute({ 
                    protocol: 'ATOM_READ', 
                    context_id: 'SYSTEM_CONFIG' 
                });
                if (configRes.items?.[0]) {
                    dispatch({ type: 'setSystemConfig', payload: configRes.items[0].data });
                }

                // 2. Cargar Arquetipos (Meta-Clases)
                const metaRes = await bridge.execute({ 
                    protocol: 'ATOM_READ', 
                    context_id: 'META_CLASSES' 
                });
                const archetypes = {};
                (metaRes.items || []).forEach(m => {
                    archetypes[m.slug] = m.data;
                });
                dispatch({ type: 'setArchetypes', payload: archetypes });

            } catch (e) {
                console.warn("⚠️ [Ignición] El Silo está vacío. Entrando en Modo Semilla.");
            } finally {
                dispatch({ type: 'setLoading', payload: false });
            }
        };

        ignite();
    }, []);

    const value = useMemo(() => ({ state, dispatch, bridge }), [state]);

    return (
        <SovereignContext.Provider value={value}>
            {children}
        </SovereignContext.Provider>
    );
};

export const useSovereign = () => useContext(SovereignContext);
