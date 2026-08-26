import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// See README for how VITE_API_URL is used in src/services/api.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During local dev, forward /api calls straight to the PHP server
      // so you don't have to fight CORS. In production the frontend and
      // backend are typically served from the same domain instead.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
