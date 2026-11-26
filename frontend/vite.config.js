import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api calls go to backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Short code redirects: proxy everything to backend UNLESS it's a known SPA route
      '/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // CRITICAL: do NOT follow redirects — pass the 302 straight to the browser
        followRedirects: false,
        bypass(req) {
          const url = req.url?.split('?')[0] ?? '/'

          // Let Vite handle these frontend routes
          const spaRoutes = ['/', '/login', '/register', '/dashboard', '/account', '/link-unavailable']
          if (spaRoutes.includes(url)) return url

          // Let Vite handle /links and /links/:id
          if (url.startsWith('/links')) return url

          // Let Vite handle its own internal assets
          if (
            url.startsWith('/@') ||
            url.startsWith('/src') ||
            url.startsWith('/node_modules') ||
            url.startsWith('/assets') ||
            url.includes('.')   // .js, .css, .svg, .ico etc.
          ) return url

          // Everything else → forward to Express (short codes like /coding2)
          return null
        },
      },
    },
  },
})

