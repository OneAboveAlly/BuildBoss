import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { analyzer } from 'vite-bundle-analyzer'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import imagePresets, { widthPreset } from 'vite-plugin-image-presets'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Explicitly set React version to avoid conflicts
      jsxRuntime: 'automatic',
      // Ensure React is properly resolved
      include: '**/*.{jsx,tsx}',
    }),
    
    // PWA plugin configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'BuildBoss',
        short_name: 'BuildBoss',
        description: 'Professional construction project management platform',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your project dashboard',
            url: '/dashboard',
            icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Projects',
            short_name: 'Projects',
            description: 'Manage your projects',
            url: '/projects',
            icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Tasks',
            short_name: 'Tasks',
            description: 'View and manage tasks',
            url: '/tasks',
            icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Materials',
            short_name: 'Materials',
            description: 'Material inventory',
            url: '/materials',
            icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
          }
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'BuildBoss Dashboard - Desktop View'
          },
          {
            src: '/screenshots/mobile-projects.png',
            sizes: '375x667',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'BuildBoss Projects - Mobile View'
          }
        ],
        categories: ['business', 'productivity', 'utilities']
      }
    }),
    
    // Bundle analyzer plugin (only in analyze mode)
    ...(process.env.ANALYZE ? [analyzer()] : []),
    
    // Sentry plugin for source maps and release tracking
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      
      // Only upload source maps in production
      disable: process.env.NODE_ENV !== 'production',
      
      // Source maps configuration
      sourcemaps: {
        assets: ['./dist/**'],
        ignore: ['node_modules'],
        filesToDeleteAfterUpload: '**/*.map'
      },
      
      // Release configuration
      release: {
        name: process.env.VITE_APP_VERSION || 'unknown',
        deploy: {
          env: process.env.NODE_ENV || 'development'
        }
      },
      
      // Additional options
      silent: false,
      debug: process.env.NODE_ENV === 'development',
    }),

    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    imagePresets({
      optimized: widthPreset({
        widths: [400, 800, 1200],
        formats: {
          webp: { quality: 80 },
          jpg: { quality: 80 }
        },
        class: 'img-optimized',
        loading: 'lazy'
      })
    }),
  ],
  
  // Build configuration
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          sentry: ['@sentry/react', '@sentry/browser'],
          router: ['react-router-dom'],
          charts: ['chart.js'],
          ui: ['@headlessui/react', '@heroicons/react'],
          i18n: ['react-i18next', 'i18next'],
          utils: ['date-fns', 'lodash'],
          maps: ['leaflet', 'react-leaflet'],
          pwa: ['workbox-window']
        },
      },
    },
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000, // Warn about chunks larger than 1000kb
  },
  
  // Define environment variables for the app
  define: {
    __SENTRY_DEBUG__: process.env.NODE_ENV === 'development',
    // Version tracking for auto-refresh
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.NODE_ENV === 'development'
        ? 'dev'
        : (process.env.VITE_APP_VERSION || `v${Date.now()}`)
    ),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-i18next',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid'
    ],
    // Force React to be a single instance
    force: true,
    // Ensure React is properly deduplicated
    exclude: []
  },

  resolve: {
    // Ensure React is properly resolved
    alias: {
      'react': 'react',
      'react-dom': 'react-dom'
    },
    // Force deduplication of React
    dedupe: ['react', 'react-dom']
  },

  server: {
    port: 5173,
    host: '127.0.0.1',
    hmr: {
      port: 5173,
      host: '127.0.0.1',
      clientPort: 5173,
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
      },
      '/plans-admin': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 30000,
      }
    },
    fs: {
      allow: ['..'],
    },
  },

  // Preview configuration (for production builds)
  preview: {
    port: 3000,
    host: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/plans-admin': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
