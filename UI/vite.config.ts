import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Development port
    proxy: {
      '/api': {
        target: 'http://localhost:5069',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 4173, // Production preview port
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  }
})