import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || __dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['react-icons', 'react-toastify'],
          'state': ['zustand'],
          'api': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    cssCodeSplit: true
  }
})