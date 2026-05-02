/**
 * 🛰️ WORKFLOW ENGINE (The Sovereign Will)
 * Procesador central de acciones atómicas. 
 * Permite que la lógica de negocio sea tratada como materia (JSON).
 */

export const WorkflowEngine = {
    /**
     * Procesa una secuencia de pasos definida en una ENTITY_WORKFLOW.
     */
    process: async (steps = [], payload, bridge) => {
        console.log(`🧠 [WorkflowEngine] Iniciando secuencia de ${steps.length} pasos.`);
        
        const results = [];
        let currentData = { ...payload };

        for (const step of steps) {
            try {
                const result = await WorkflowEngine.executeStep(step, currentData, bridge);
                results.push(result);
                
                // Si el paso devuelve datos nuevos, los integramos para el siguiente paso
                if (result?.data) {
                    currentData = { ...currentData, ...result.data };
                }
            } catch (error) {
                console.error(`❌ [WorkflowEngine] Error en el paso ${step.op}:`, error.message);
                throw error; // Abortamos la secuencia por seguridad (Transaccionalidad)
            }
        }

        return results;
    },

    /**
     * Ejecuta una operación atómica individual.
     */
    executeStep: async (step, data, bridge) => {
        const { op, params } = step;

        switch (op) {
            case 'VALIDATE':
                // Verificación de integridad de materia
                if (params.required) {
                    params.required.forEach(f => {
                        const val = data.data?.[f] || data[f];
                        if (!val) throw new Error(`Error de Validación: Falta ${f}`);
                    });
                }
                return { status: 'VALIDATED' };

            case 'BRIDGE_EXECUTE':
                // Comunicación con el Silo (CRUD Soberano)
                console.log(`📤 [Workflow:Bridge] Enviando materia a ${params.context_id}`);
                return await bridge.execute({
                    protocol: params.protocol || 'UPDATE',
                    context_id: params.context_id,
                    data: data
                });

            case 'NOTIFY':
                // Disparador de feedback visual
                alert(params.message || "Operación exitosa");
                return { status: 'NOTIFIED' };

            case 'LOG_ACTION':
                // Persistencia de auditoría técnica
                return await bridge.execute({
                    protocol: 'CREATE',
                    context_id: 'SYSTEM_LOGS',
                    data: { 
                        timestamp: Date.now(), 
                        action: params.action_id, 
                        status: 'SUCCESS' 
                    }
                });

            default:
                throw new Error(`Operación Atómica no soportada: ${op}`);
        }
    }
};
