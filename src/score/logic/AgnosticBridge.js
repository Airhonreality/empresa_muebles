/**
 * 🛰️ AGNOSTIC BRIDGE (Core Logic v2.0)
 * Orquestador de Silos con Resiliencia y Circuit Breaker.
 */

import { LocalVaultStrategy } from './strategies/LocalVaultStrategy';
import { GitHubStrategy } from './strategies/GitHubStrategy';

export class AgnosticBridge {
    constructor() {
        this.config = {
            strategy: import.meta.env.VITE_BRIDGE_STRATEGY || 'CLOUD',
            timeout: 5000
        };

        this.silos = {
            remote: this.config.strategy === 'CLOUD' ? new GitHubStrategy() : null,
            local: new LocalVaultStrategy()
        };

        this.isOnline = true;
    }

    /**
     * Inyecta identidad soberana.
     */
    async authorize(identity) {
        if (this.silos.remote) {
            return await this.silos.remote.hydrateVault(identity.email);
        }
        return true;
    }

    /**
     * Ejecutor Universal de Protocolos.
     */
    async execute(uqo) {
        const { protocol, context_id } = uqo;

        if (this.silos.remote && this.isOnline) {
            try {
                const result = await this._withTimeout(
                    this.silos.remote.execute(uqo),
                    this.config.timeout
                );
                
                // Si leemos con éxito del remoto, actualizamos la caché local
                if (protocol === 'ATOM_READ' && result.items) {
                    this.silos.local.sync(context_id, result.items);
                }
                
                return result;
            } catch (e) {
                console.warn("⚠️ [Bridge] Silo Remoto inaccesible. Activando redundancia local.");
                this.isOnline = false;
                setTimeout(() => { this.isOnline = true; }, 60000); // Reintento en 1 min
            }
        }

        // Operación resiliente en local
        return await this.silos.local.execute(uqo);
    }

    _withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
        ]);
    }
}
