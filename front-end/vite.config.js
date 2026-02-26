import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests are forwarded to the .NET backend
      // The /api prefix is stripped before forwarding
      // e.g. /api/users → http://localhost:5117/users
      '/api': {
        target: 'http://localhost:5117',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
