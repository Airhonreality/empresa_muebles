import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// ID de Cliente de Google (Agnóstico vía .env)
const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-id";

/**
 * ⚡ IGNITION SEQUENCE
 * Punto de entrada único del sistema agnóstico.
 * Envolvemos la app con el proveedor de Identidad Soberana.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
