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
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ot': {
        target: 'http://localhost:8210',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ot/, ''),
      },
    },
  },
})
