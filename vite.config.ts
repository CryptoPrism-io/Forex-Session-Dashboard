import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // For production, use Cloud Run backend or fallback to relative path
    // For dev, use localhost
    const apiBaseUrl = mode === 'production'
      ? env.VITE_API_BASE_URL || 'https://forex-dashboard-963362833537.us-central1.run.app'
      : 'http://localhost:5000';

    return {
      // Base path: GitHub Pages needs '/Forex-Session-Dashboard/', Cloud Run needs '/'
      // Check both process.env (from CI/CD) and loaded env (from .env files)
      base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || (mode === 'production' ? '/' : '/'),
      server: {
        port: 3000,
        host: '0.0.0.0',
        https: true,
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react(), mkcert()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
