/**
 * 🏛️ SONDA DE DIAGNÓSTICO AXIOMÁTICA
 * ─────────────────────────────────
 * Ruta estática ultra-simple aislada de dependencias.
 */
export default function PingPage() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#0b0f19',
      color: '#38bdf8'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: 900 }}>PONG</h1>
      <p style={{ color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Next.js Sovereign Routing is Operational
      </p>
    </div>
  );
}
