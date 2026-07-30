import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl(), react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/ot': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ot/, ''),
      },
      // Proxy OAC WebUI (port 8787) through Vite
      '/ui': { target: 'http://localhost:8787', changeOrigin: true, ws: true },
      '/assets': { target: 'http://localhost:8787', changeOrigin: true, ws: true },
      '/gradio': { target: 'http://localhost:8787', changeOrigin: true, ws: true },
      '/file': { target: 'http://localhost:8787', changeOrigin: true, ws: true },
      '/queue': { target: 'http://localhost:8787', changeOrigin: true, ws: true },
    },
  },
})
