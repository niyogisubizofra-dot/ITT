import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // ── Production build optimizations ──────────────────────────────────────────
  build: {
    target: 'es2020',
    // Vite 8 uses Oxc/Rolldown by default — no need to specify minify explicitly
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendors into separate cacheable chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
              return 'vendor-charts';
            }
            if (id.includes('socket.io-client') || id.includes('engine.io')) {
              return 'vendor-socket';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('react-is')
            ) {
              return 'vendor-react';
            }
            if (id.includes('zustand') || id.includes('axios')) {
              return 'vendor-state';
            }
          }
        },
      },
    },
  },

  // Pre-bundle heavy deps so dev mode doesn't re-process them on each request
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'lucide-react',
      'socket.io-client',
      'zustand',
      'axios',
    ],
  },
})
