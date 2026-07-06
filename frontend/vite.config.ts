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
      '/openavatarchat': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/webrtc': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8787',
        ws: true,
      },
      '/download': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/ui': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
