// Nexora & Velora Billing Automation Platform main entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import i18n from './i18n.js';
import { I18nextProvider } from 'react-i18next';
import App from './App.jsx';

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('New version of Nexora is available. Update now?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Nexora PWA is ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
