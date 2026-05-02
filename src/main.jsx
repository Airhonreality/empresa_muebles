import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * ⚡ IGNITION SEQUENCE
 * Punto de entrada único del sistema agnóstico.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
