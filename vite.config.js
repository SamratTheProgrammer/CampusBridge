import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'apk-mime-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.apk')) {
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', 'attachment; filename="CampusBridge.apk"');
            res.setHeader('X-Content-Type-Options', 'nosniff');
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.apk')) {
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', 'attachment; filename="CampusBridge.apk"');
            res.setHeader('X-Content-Type-Options', 'nosniff');
          }
          next();
        });
      }
    }
  ],
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
        target: 'http://localhost:5001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[vite proxy] Backend connection error (will retry):', err.code);
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
