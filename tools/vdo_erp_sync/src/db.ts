// ============================================================================
// vdo_erp_sync/src/db.ts
// Cliente Postgres único para toda la capa MCP.
// Lee DATABASE_URL del entorno (inyectado por Infisical: `infisical export`)
// y nunca la escribe en disco.
// ============================================================================

import postgres from 'postgres';

export function crearClientePostgres(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL no definida. Ejecuta: infisical export --env dev > .env.local  (o infisical run -- tu_script)',
    );
  }
  return postgres(url, {
    ssl: { rejectUnauthorized: false },
    max: 5,
    connect_timeout: 15,
  });
}

/**
 * Obtiene un cliente listo para consultas SOLO LECTURA.
 */
export function clienteLectura(databaseUrl?: string) {
  return crearClientePostgres(databaseUrl);
}

/**
 * Obtiene un cliente listo para escrituras atómicas.
 * Se usa dentro de una transacción para PATCH de campos_personalizados.
 */
export function clienteEscritura(databaseUrl?: string) {
  return crearClientePostgres(databaseUrl);
}
