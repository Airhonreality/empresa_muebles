import { useSovereign } from '../SovereignContext';
import { WorkflowEngine } from '../logic/WorkflowEngine';

/**
 * 🛰️ HOOK: useSovereignAction
 * Provee la interfaz para disparar Intenciones desde la UI.
 */
export const useSovereignAction = () => {
    const { state, bridge, dispatch } = useSovereign();

    /**
     * Dispara un workflow basado en un ID de intención.
     * @param {string} intentId - El ID vinculado a una ENTITY_WORKFLOW
     * @param {Object} payload - Los datos (materia) para el flujo
     */
    const triggerIntent = async (intentId, payload) => {
        dispatch({ type: 'setLoading', payload: true });

        try {
            // 1. Buscamos el workflow en la materia cargada (Silo)
            const workflows = state.materia['SYSTEM_WORKFLOWS'] || [];
            const workflow = workflows.find(w => w.data?.intent_id === intentId);

            if (!workflow) {
                throw new Error(`La intención "${intentId}" no tiene un workflow definido en el Silo.`);
            }

            // 2. Ejecutamos la secuencia a través del motor
            console.log(`⚡ [Action] Disparando Intención: ${intentId}`);
            await WorkflowEngine.process(workflow.data.steps, payload, bridge);
            
            return { success: true };
        } catch (error) {
            alert(`⚠️ ERROR SOBERANO: ${error.message}`);
            return { success: false, error };
        } finally {
            dispatch({ type: 'setLoading', payload: false });
        }
    };

    return { triggerIntent };
};
