/**
 * 🏛️ LOCAL VAULT STRATEGY (Node.js Edition)
 * Persistencia física en archivos JSON locales mediante el vault-server.
 */
export class LocalVaultStrategy {
    constructor() {
        // En local, usamos el puerto 3000 del vault-server
        this.api_url = import.meta.env.VITE_VAULT_API_URL || 'http://localhost:3000/api/vault';
    }

    async getMateria(context_id) {
        try {
            const response = await fetch(this.api_url);
            const db = await response.json();
            return db.materia?.[context_id] || [];
        } catch (e) {
            console.warn("⚠️ [LocalVault] No se pudo conectar al silo local. Usando fallback.");
            return [];
        }
    }

    async saveMateria(context_id, items) {
        try {
            // Primero leemos la base completa
            const response = await fetch(this.api_url);
            const db = await response.json();
            
            // Actualizamos el contexto específico
            db.materia = { ...db.materia, [context_id]: items };
            
            // Guardamos de vuelta en el servidor
            await fetch(this.api_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(db)
            });

            return true;
        } catch (e) {
            console.error("❌ [LocalVault] Error al cristalizar materia local:", e);
            return false;
        }
    }
}
