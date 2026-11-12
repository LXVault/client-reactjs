# 1.3.0

Released 2026-11-12.

The frontend is now written in strict TypeScript, and the build type checks it before
bundling. Nothing the app does has changed.

**What you need to do: nothing to run it, and re-read the paths if you edit it.** Every
`.jsx` file is now `.tsx`, `src/api/client.js` is `src/api/client.ts`, and `vite.config.js` is
`vite.config.ts`. A type error now fails `npm run build`.

## Added

* `tsconfig.json` for `src/` and `tsconfig.node.json` for `vite.config.ts`, both `strict`.
  `tsc` only checks; Vite still compiles, so `dist/` and the image are unchanged.
* `src/api/types.ts`, the backend's responses as the screens read them. They are cast onto
  responses, not validated, so a backend field rename still type checks. See
  [information/architecture.md](../../../../information/architecture.md).
* `npm run typecheck`, which `npm run build` now runs first.

## Changed

* Every source file moved to TypeScript. `src/api/client.ts` is generic over each response
  type, and components show failures through `errorMessage(err, fallback)` because a caught
  value is `unknown` under `strict`.
* Dependencies moved to their latest releases within the current majors: React 19.3.1,
  React Router 7.18.5, Vite 8.3.8 and `@vitejs/plugin-react` 6.3.0. TypeScript 7 and the
  `@types` packages for Node and React were added as dev dependencies. `npm audit` reports
  0 vulnerabilities.

## Fixed

* The project detail screen no longer throws if the project fails to load without an
  error message. It renders nothing instead.
