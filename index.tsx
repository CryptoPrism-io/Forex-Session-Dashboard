
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

// Register service worker for PWA support with correct base path on GitHub Pages
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const rawBase = (import.meta as any).env?.BASE_URL ?? '/';
      const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
      const swUrl = `${normalizedBase}sw.js`;
      navigator.serviceWorker.register(swUrl).catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
    } catch (err) {
      console.log('Service Worker registration error:', err);
    }
  });
}
