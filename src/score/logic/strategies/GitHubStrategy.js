/**
 * ☁️ GITHUB STRATEGY (Cloud Silo)
 * Implementación del protocolo UQO sobre la API de GitHub.
 */

export class GitHubStrategy {
    constructor() {
        this.config = {
            owner: import.meta.env.VITE_GITHUB_OWNER,
            repo: import.meta.env.VITE_GITHUB_REPO,
            branch: import.meta.env.VITE_GITHUB_BRANCH || 'master',
            dbPath: import.meta.env.VITE_GITHUB_DB_PATH || 'src/score/silo/local_database.json'
        };
        this.token = null;
    }

    /**
     * Obtiene la llave soberana desde una bóveda externa (Vercel/Custom API).
     */
    async hydrateVault(email) {
        const vaultUrl = import.meta.env.VITE_VAULT_API_URL;
        if (!vaultUrl || !email) return false;

        try {
            const res = await fetch(vaultUrl, { headers: { 'x-sovereign-email': email } });
            if (res.ok) {
                const data = await res.json();
                this.token = data.token;
                return true;
            }
        } catch (e) { console.error("❌ [GitHubStrategy] Error en Vault:", e); }
        return false;
    }

    async execute(uqo) {
        const { protocol, context_id, data, payload } = uqo;

        if (protocol === 'ATOM_READ') {
            const db = await this._fetchDb();
            return { items: db[context_id] || [], metadata: { count: (db[context_id] || []).length } };
        }

        if (protocol === 'CREATE' || protocol === 'UPDATE') {
            const db = await this._fetchDb();
            if (!db[context_id]) db[context_id] = [];
            const index = db[context_id].findIndex(item => item.slug === data.slug);
            
            if (index !== -1) db[context_id][index] = data;
            else db[context_id].unshift(data);

            return await this._commit(db, `🛰️ [Materia] Update: ${data.slug}`);
        }

        if (protocol === 'DELETE') {
            const db = await this._fetchDb();
            if (db[payload.context_id]) {
                db[payload.context_id] = db[payload.context_id].filter(i => i.slug !== payload.slug);
                return await this._commit(db, `🔥 [Materia] Delete: ${payload.slug}`);
            }
        }
    }

    // --- Métodos Privados de Infraestructura ---

    async _fetchDb() {
        const { owner, repo, branch, dbPath } = this.config;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dbPath}?ref=${branch}`;
        
        try {
            const headers = this.token ? { 'Authorization': `token ${this.token}` } : {};
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("No se pudo conectar con el Silo");
            
            const fileData = await res.json();
            const content = decodeURIComponent(escape(atob(fileData.content)));
            return JSON.parse(content);
        } catch (e) {
            console.warn("⚠️ [GitHubStrategy] Fallo de red, usando fallback RAW.");
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dbPath}`;
            const res = await fetch(rawUrl);
            return res.ok ? await res.json() : {};
        }
    }

    async _commit(newDb, message) {
        const { owner, repo, branch, dbPath } = this.config;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dbPath}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `token ${this.token}` }
        });
        const fileData = await res.json();

        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(newDb, null, 4)))),
            sha: fileData.sha,
            branch
        };

        const updateRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return updateRes.ok ? { status: 'OK' } : { status: 'ERROR', error: await updateRes.json() };
    }
}
