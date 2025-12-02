import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // For production, use Cloud Run backend or fallback to relative path
    // For dev, use localhost
    const apiBaseUrl = mode === 'production'
      ? env.VITE_API_BASE_URL || 'https://forex-dashboard-963362833537.us-central1.run.app'
      : 'http://localhost:5000';

    // Determine base path: GitHub Pages vs Cloud Run vs Dev
    const basePath = process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || (mode === 'production' ? '/' : '/');

    return {
      // Base path: GitHub Pages needs '/Forex-Session-Dashboard/', Cloud Run needs '/'
      // Check both process.env (from CI/CD) and loaded env (from .env files)
      base: basePath,
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
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['vite.svg'],
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            navigateFallback: '/Forex-Session-Dashboard/index.html',
            navigateFallbackDenylist: [/^\/api\//],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'tailwind-cdn',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                  }
                }
              }
            ]
          },
          manifest: {
            name: 'Global FX Trading Sessions',
            short_name: 'FX Sessions',
            description: 'Real-time session tracking with killzones and overlaps. Interactive dashboard for visualizing global Forex trading sessions with live timezone support.',
            start_url: basePath,
            scope: basePath,
            display: 'standalone',
            orientation: 'portrait-primary',
            background_color: '#0f172a',
            theme_color: '#06b6d4',
            icons: [
              {
                src: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'><rect fill=\'%230f172a\' width=\'192\' height=\'192\'/><circle cx=\'96\' cy=\'96\' r=\'85\' fill=\'%2306b6d4\' opacity=\'0.2\'/><text x=\'96\' y=\'135\' font-size=\'90\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'%2306b6d4\' font-family=\'system-ui\'>FM</text></svg>',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 512 512\'><rect fill=\'%230f172a\' width=\'512\' height=\'512\'/><circle cx=\'256\' cy=\'256\' r=\'230\' fill=\'%2306b6d4\' opacity=\'0.2\'/><text x=\'256\' y=\'380\' font-size=\'250\' font-weight=\'bold\' text-anchor=\'middle\' fill=\'%2306b6d4\' font-family=\'system-ui\'>FM</text></svg>',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ],
            categories: ['finance', 'productivity'],
            prefer_related_applications: false
          }
        })
      ],
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
      },
    };
});
