import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
        suppressWarnings: true
      },
      includeAssets: ['favicon.png', 'nexora-logo.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Nexora | Subscription & Billing Automation Platform',
        short_name: 'Nexora Billing',
        description: 'Automated recurring payment processing, subscription dunning, and invoice management platform.',
        theme_color: '#1976d2',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/127\.0\.0\.1:8000\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nexora-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 80,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
