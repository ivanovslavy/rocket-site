import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // bind dev + preview to all interfaces (0.0.0.0) so the site is reachable on
  // the LAN (e.g. from a phone at http://<laptop-ip>:5173)
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
})
