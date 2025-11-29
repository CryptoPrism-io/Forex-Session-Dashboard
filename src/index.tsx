
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { reportWebVitals } from './utils/reportWebVitals';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start tracking Core Web Vitals
reportWebVitals();

// Register service worker for PWA support using vite-plugin-pwa
// This will automatically handle updates and proper registration
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('PWA Service Worker registered:', r);
  },
  onRegisterError(error) {
    console.log('PWA registration error:', error);
  }
});
