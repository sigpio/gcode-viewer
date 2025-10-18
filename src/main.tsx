import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('./service-worker.ts', import.meta.url);
    navigator.serviceWorker
      .register(swUrl, { type: 'module' })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error);
      });
  });
}
