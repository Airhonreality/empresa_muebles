import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Configurar el worker de MSW para el cliente
const worker = setupWorker(...handlers);

export const startMockServiceWorker = async () => {
  if (process.env.NODE_ENV === 'development') {
    await worker.start({
      onUnhandledRequest: 'bypass', // Ignorar solicitudes no manejadas
    });
    console.log('✅ MSW (Mock Service Worker) iniciado');
  }
};

// Exportar el worker para pruebas
export { worker };