import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const manifestUrl = import.meta.env.VITE_TONCONNECT_MANIFEST_URL
  || new URL('/tonconnect-manifest.json', window.location.origin).toString();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
);
