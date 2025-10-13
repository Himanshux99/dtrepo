import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw-unified.js',
      injectRegister: 'inline',
      injectManifest: {
        injectionPoint: undefined,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
      },
      devOptions: {
        enabled: false, // Changed to false to avoid dev-sw issues
      },
      manifest: {
        name: 'DT App',
        short_name: 'DT App',
        description: 'Your app description',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { 
            src: '/vite.svg', 
            sizes: '64x64', 
            type: 'image/svg+xml' 
          },
          { 
            src: '/vite.svg', 
            sizes: '192x192', 
            type: 'image/svg+xml' 
          },
          { 
            src: '/vite.svg', 
            sizes: '512x512', 
            type: 'image/svg+xml', 
            purpose: 'any maskable' 
          }
        ],
      },
    }),
  ],
});
