import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
        https: false, // Disabled to prevent certificate issues with CDN resources
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 3000,
          clientPort: 3000,
        },
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
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
      ,
      build: {
        chunkSizeWarningLimit: 500,
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Split vendor libraries into separate chunks for better caching
              if (id.includes('node_modules')) {
                // React core (frequently used, rarely changes)
                if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                  return 'react-vendor';
                }

                // Recharts (large charting library)
                if (id.includes('recharts') || id.includes('d3-')) {
                  return 'chart-vendor';
                }

                // Framer Motion (animation library)
                if (id.includes('framer-motion')) {
                  return 'motion-vendor';
                }

                // React Aria (accessibility library)
                if (id.includes('react-aria') || id.includes('@react-aria') || id.includes('@react-stately')) {
                  return 'aria-vendor';
                }

                // Everything else (utilities, small libs)
                return 'utils-vendor';
              }

              // Chart components (lazy loaded)
              if (id.includes('components/ForexChart') || id.includes('components/VolumeChart') || id.includes('components/Tooltip')) {
                return 'charts';
              }

              // Web workers
              if (id.includes('workers')) {
                return 'workers';
              }
            },
          },
        },
      },
    };
});
