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
    },
    preview: {
      port,
      host: true,
    },
  };
});
