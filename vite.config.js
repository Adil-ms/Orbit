import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The ORBIT API (server/index.js) runs on 8787 in development
    proxy: { '/api': 'http://localhost:8787' },
    // Allow ngrok tunnel hostnames (e.g. abc123.ngrok-free.app) to reach the dev server
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io'],
  },
})
