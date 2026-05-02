import React from 'react';
import { SovereignProvider } from './score/SovereignContext';
import { SovereignRouter } from './ui/SovereignRouter';
import './styles/theme-base.css';

/**
 * 🛰️ AGNÓSTICO SYSTEM - BOOT SEQUENCE
 * El ensamblaje maestro que inicializa la soberanía de datos y el enrutamiento.
 */
function App() {
  return (
    <SovereignProvider>
      <div className="agnostic-app-container">
        {/* Aquí podrían ir componentes globales como un Navbar Agnóstico */}
        <SovereignRouter />
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .agnostic-app-container {
          min-height: 100vh;
          background: var(--surface-0);
          color: var(--text-primary);
        }
      `}} />
    </SovereignProvider>
  );
}

export default App;
