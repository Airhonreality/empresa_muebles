import { useEffect, useState, useCallback } from 'react';
import { useSovereign } from '../SovereignContext';

/**
 * 🛰️ HOOK: useIndraResonance
 * Sincroniza un componente con la realidad de un contexto de materia.
 */
export const useIndraResonance = (context_id) => {
    const { state, dispatch, bridge } = useSovereign();
    const [loading, setLoading] = useState(false);

    const resonance = useCallback(async () => {
        setLoading(true);
        try {
            const result = await bridge.execute({
                protocol: 'ATOM_READ',
                context_id: context_id
            });
            
            dispatch({
                type: 'setMateria',
                payload: { context_id, items: result.items }
            });
        } catch (e) {
            console.error(`❌ [Resonance] Error en contexto ${context_id}:`, e);
        } finally {
            setLoading(false);
        }
    }, [context_id, bridge, dispatch]);

    useEffect(() => {
        // Solo resonamos si no tenemos los datos o si queremos forzar refresh
        if (!state.materia[context_id]) {
            resonance();
        }
    }, [context_id, state.materia, resonance]);

    return {
        remoteData: state.materia[context_id] || [],
        loading,
        refresh: resonance
    };
};
