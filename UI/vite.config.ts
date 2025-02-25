import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7285',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // Tar bort /api prefix
      },
      '/uploads': {
        target: 'https://localhost:7285',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
