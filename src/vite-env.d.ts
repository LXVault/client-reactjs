/// <reference types="vite/client" />

// Build-time variables Vite inlines into the bundle. See wiki/environments/env.md.
interface ImportMetaEnv {
  // The backend origin, with no /api suffix. Empty means a same-origin base.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
