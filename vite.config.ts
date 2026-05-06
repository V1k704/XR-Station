import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/claude': 'http://localhost:5173',
      '/api/github': 'http://localhost:5173',
      '/api/htb': 'http://localhost:5173',
    },
  },
})
