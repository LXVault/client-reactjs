import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fallbacks are applied for every env-driven value so the dev server runs
// without any .env file present.
export default defineConfig(() => {
  const port = parseInt(process.env.FRONTEND_PORT || '5173', 10);
  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      // Proxy same-origin /api calls to the backend during local development
      // so the frontend can use relative URLs (matches the nginx setup).
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: true,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
