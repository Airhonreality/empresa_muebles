/**
 * 🧠 AGNOSTIC APP STATE (MMS Level 2)
 * La única fuente de verdad reactiva, ahora capaz de autoconfigurarse.
 */

export const AppState = {
    identity: {
        actor: 'guest',
        email: null,
        isAuthenticated: false
    },
    
    // 🏛️ NODO DE SISTEMA: Define las leyes del satélite actual
    system: {
        config: {
            site_title: 'AGNOSTIC SEED',
            active_nav_slug: 'main-navbar',
            home_slug: 'home',
            theme: 'dark'
        },
        archetypes: {} // Mapa de META_CLASSES (Factura, Proyecto, etc.)
    },
    
    // Contenedor de Materia por Namespace
    materia: {},
    
    // UI Global State
    ui: {
        isLoading: true,
        activeContext: null,
        notifications: []
    },

    // Métodos de mutación atómica
    mutations: {
        setIdentity: (state, profile) => ({ 
            ...state, 
            identity: { 
                actor: profile.name, 
                email: profile.email, 
                avatar: profile.picture,
                isAuthenticated: true 
            } 
        }),
        
        logout: (state) => ({ 
            ...state, 
            identity: { actor: 'guest', email: null, isAuthenticated: false } 
        }),
        
        setSystemConfig: (state, config) => ({
            ...state,
            system: { ...state.system, config: { ...state.system.config, ...config } }
        }),
        
        setArchetypes: (state, archetypes) => ({
            ...state,
            system: { ...state.system, archetypes }
        }),
        
        setMateria: (state, { context_id, items }) => ({
            ...state,
            materia: { ...state.materia, [context_id]: items }
        }),
        
        setLoading: (state, isLoading) => ({
            ...state,
            ui: { ...state.ui, isLoading }
        })
    }
};
