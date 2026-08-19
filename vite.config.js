import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Directs local development traffic
      '/api': {
        target: 'http://127.0.0.1:5000', // Points to your local Flask server
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
