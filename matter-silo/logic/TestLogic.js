/**
 * 🧪 TEST LOGIC SCRIPT (Native JS Version)
 * Este archivo vive en el Silo. Es código puro de negocio.
 * Nota: No usamos JSX para que el navegador lo lea directamente sin compilación.
 */
export const projection = {
    id: "test-logic",
    
    /**
     * Función de renderizado siguiendo el contrato.
     */
    render: ({ state, dispatch, bridge, props, React }) => {
        // Atajo para crear elementos (hyperscript)
        const h = React.createElement;

        return h('div', {
            style: {
                padding: '2rem',
                border: '2px solid #D4C5A1',
                borderRadius: '12px',
                background: 'rgba(212, 197, 161, 0.1)',
                color: '#D4C5A1',
                fontFamily: 'sans-serif'
            }
        }, [
            h('h1', { style: { margin: '0 0 1rem 0' }, key: 'h1' }, '🛰️ Lógica Soberana Inyectada'),
            h('p', { key: 'p1' }, 'Este componente no existe en el código fuente de la Semilla.'),
            h('p', { key: 'p2' }, [
                'Ha sido leído y ejecutado desde ', 
                h('b', { key: 'b' }, 'matter-silo/logic/TestLogic.js')
            ]),
            h('hr', { style: { borderColor: '#D4C5A1', opacity: 0.3 }, key: 'hr' }),
            h('div', { style: { marginTop: '1rem' }, key: 'state' }, [
                h('strong', { key: 'label' }, 'Estado del Satélite:'),
                h('pre', {
                    style: {
                        background: '#000',
                        padding: '1rem',
                        borderRadius: '4px',
                        overflow: 'auto',
                        color: '#fff'
                    },
                    key: 'pre'
                }, JSON.stringify(state.system.config, null, 2))
            ]),
            h('button', {
                onClick: () => alert("¡Lógica nativa ejecutada desde el Silo!"),
                style: {
                    marginTop: '1rem',
                    padding: '0.7rem 1.5rem',
                    background: '#D4C5A1',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                },
                key: 'btn'
            }, 'Probar Interacción Nativa')
        ]);
    }
};
