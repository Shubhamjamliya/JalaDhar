import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Jaladhar',
        short_name: 'Jaladhar',
        description: 'Borewell Service Booking Platform',
        theme_color: '#0A84FF',
        background_color: '#F6F7F9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      manifestFilename: 'manifest.webmanifest',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Disable in development for faster reloads
      },
      injectRegister: 'auto',
      injectManifest: false
    }),
    ...(mode === 'analyze' ? [visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })] : [])
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['react-icons'],
          // Module chunks
          'user-module': [
            './src/modules/user/user-pages/UserDashboard',
            './src/modules/user/user-pages/UserServiceProvider',
            './src/modules/user/user-pages/UserRequestService',
            './src/modules/user/user-pages/UserStatus',
            './src/modules/user/user-pages/UserBookingDetails',
            './src/modules/user/user-pages/UserProfile',
          ],
          'vendor-module': [
            './src/modules/vendor/vendor-pages/VendorDashboard',
            './src/modules/vendor/vendor-pages/VendorRequests',
            './src/modules/vendor/vendor-pages/VendorBookings',
            './src/modules/vendor/vendor-pages/VendorStatus',
            './src/modules/vendor/vendor-pages/VendorWallet',
            './src/modules/vendor/vendor-pages/VendorProfile',
          ],
          'admin-module': [
            './src/modules/admin/admin-pages/AdminDashboard',
            './src/modules/admin/admin-pages/AdminVendors',
            './src/modules/admin/admin-pages/AdminUsers',
            './src/modules/admin/admin-pages/AdminPayments',
            './src/modules/admin/admin-pages/AdminSettings',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
}))
