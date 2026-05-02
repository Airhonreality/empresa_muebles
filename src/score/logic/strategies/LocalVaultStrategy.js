/**
 * 🛡️ LOCAL VAULT STRATEGY
 * Gestiona la persistencia en el navegador (IndexedDB o LocalStorage).
 * Actúa como caché y como fallback cuando el Silo Remoto falla.
 */

export class LocalVaultStrategy {
    constructor() {
        this.storageKey = 'SOVEREIGN_VAULT_CACHE';
    }

    async execute(uqo) {
        const { protocol, context_id, data, payload } = uqo;
        const db = this._loadDb();

        if (protocol === 'ATOM_READ') {
            return { items: db[context_id] || [], metadata: { source: 'LOCAL_VAULT' } };
        }

        if (protocol === 'CREATE' || protocol === 'UPDATE') {
            if (!db[context_id]) db[context_id] = [];
            const index = db[context_id].findIndex(item => item.slug === data.slug);
            
            if (index !== -1) db[context_id][index] = data;
            else db[context_id].unshift(data);
            
            this._saveDb(db);
            return { status: 'OK', msg: 'Materia cristalizada en Bóveda Local.' };
        }

        if (protocol === 'DELETE') {
            if (db[payload.context_id]) {
                db[payload.context_id] = db[payload.context_id].filter(i => i.slug !== payload.slug);
                this._saveDb(db);
            }
            return { status: 'OK' };
        }
    }

    /**
     * Sincroniza datos externos con la bóveda local.
     */
    sync(context_id, items) {
        const db = this._loadDb();
        db[context_id] = items;
        this._saveDb(db);
    }

    _loadDb() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {};
        } catch (e) { return {}; }
    }

    _saveDb(db) {
        localStorage.setItem(this.storageKey, JSON.stringify(db));
    }
}
