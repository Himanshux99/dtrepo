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
        name: 'V++',
        short_name: 'V++',
        description: 'Your app description',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { 
            src: '/android-chrome-48x48.png', 
            sizes: '64x64', 
            type: 'image/svg+xml' 
          },
          { 
            src: '/android-chrome-192x192.png', 
            sizes: '192x192', 
            type: 'file/svg+xml' 
          },
          { 
            src: '/android-chrome-512x512.png', 
            sizes: '512x512', 
            type: 'image/svg+xml', 
            purpose: 'any maskable' 
          }
        ],
      },
    }),
  ],
});
