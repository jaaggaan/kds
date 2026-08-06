import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    proxy: {
      // Forward /portal/* to captive portal dev server (which serves at /portal/)
      // Both apps are now under localhost:5173 → same origin → shared localStorage!
      '/portal': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

