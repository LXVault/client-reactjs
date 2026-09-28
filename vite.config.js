import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fallbacks are applied for every env-driven value so the dev server runs
// without any .env file present.
export default defineConfig(() => {
  const port = parseInt(process.env.FRONTEND_PORT || '5173', 10);

  // Loopback by default. The dev and preview servers transform and serve the
  // source they are given, so binding them to every interface put both on the
  // network for anything else on the LAN to read. FRONTEND_HOST is the
  // deliberate opt-in for container and device testing, which is a real need —
  // it just is not the default, because the safe setting is the one you get
  // by doing nothing.
  const host = process.env.FRONTEND_HOST || 'localhost';

  // Same-origin /api calls are proxied to the backend during local development
  // and preview, so the frontend can use relative URLs (matches the nginx
  // setup). The backend browser calls reach directly in production; nginx does
  // NOT proxy /api.
  const proxy = {
    '/api': {
      target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: { port, host, proxy },
    preview: { port, host, proxy },
  };
});
