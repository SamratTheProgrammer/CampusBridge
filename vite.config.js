import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['date-fns', 'react-icons', 'cropperjs', 'react-cropper', 'emoji-picker-react']
  },
  server: {
    host: true,
    watch: {
      ignored: ['**/*.~tmp']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[vite proxy] Backend connection error (will retry):', err.code);
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
