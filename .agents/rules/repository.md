---
name: repository-rules
description: Rules specific to the mcp-rag-client frontend: the single API wrapper, the styling vocabulary, session handling, the demo fallback, and the build time base URL.
---

# Repository Rules

Rules that are true for this frontend and nowhere else. Conventions true for more than this
repository live in the shared set and are never restated here.

## Mode and shared set

This repository is a **Mode B consumer**. The shared instruction set is resolved through
the `lxagents-agents-base` MCP connector, as declared in the bootstrap block of
[`../../AGENTS.md`](../../AGENTS.md). Nothing from that set is copied into this repository.

## One path to the backend

`src/api/client.js` is the only module that calls `fetch`. Every page and component goes
through the `api` object it exports.

* A new endpoint gets a method on `api`, named for what it does, and the component calls
  that method. A component that builds its own URL or sets its own `Authorization` header
  is a bug, because it bypasses the token handling, the error normalization and the base
  URL resolution that wrapper owns.
* `request` normalizes failures: a network failure becomes `Network error: unable to reach
  the API`, and a non 2xx response becomes an `Error` carrying the backend's `error` string
  and the status. Components render `err.message` and do not parse responses themselves.
* Multipart uploads use the separate helper in the same file, which deliberately does not
  set `Content-Type` so the browser can add the boundary. Do not add one.

## The API base URL is an origin, and it is baked in at build time

`VITE_API_URL` is the backend **origin**, with no `/api` suffix. The client appends `/api`
itself, so routing stays a frontend concern. The wrapper tolerates a trailing slash and an
accidental `/api` suffix, but new code must not rely on that tolerance.

Vite inlines `VITE_*` variables at build time. The value is therefore fixed when the image
is built, not when the container starts, and changing it means rebuilding. Never write code
that expects to read it at runtime.

## Styling

There is no CSS framework and no component library. `src/index.css` holds one hand written
stylesheet with a shared class vocabulary: `card`, `btn` and its variants, `form-group`,
`section-title`, `muted`, `small`, `badge` and its variants, `error-banner`,
`success-banner`, `notice`, `stat-card`, `page-header`, `modal-*`, `grid`.

* Reuse an existing class before inventing one. A new class goes in `src/index.css` beside
  its relatives, never in a component file.
* Inline `style` is for one off layout nudges only, such as a margin on a single card. It
  is not where a reusable appearance belongs.
* Do not introduce Tailwind, CSS modules, styled components, or a UI kit. The stylesheet is
  small on purpose.

## Session

`AuthContext` owns the session. The JWT lives in `localStorage` under `mcp_rag_token`,
written only through `setToken` in `src/api/client.js`.

* On first load, a stored token is exchanged for the user through `api.profile()`. A
  rejected token is cleared silently, which is the logout path for an expired session.
* Components read the session with `useAuth()`. Nothing else touches `localStorage`
  directly.
* `ProtectedRoute` guards every authenticated page. A new page that needs a session is
  wrapped in it in `src/App.jsx`, not guarded by its own check.

## The demo fallback

`Dashboard` and `Analysis` fall back to `MOCK_*` constants when the API is unreachable, so
the app is presentable without a running backend.

* Keep the fallback visibly a demo. The dashboard marks those rows with a `demo` badge; a
  new fallback does the same.
* Never let a fallback stand in for a real failure the user should act on. It covers an
  unreachable API, not a `403`, a `412` for a missing OpenRouter key, or a validation
  error, all of which are shown as errors.

## What must not be introduced

* A second HTTP client, or a `fetch` call outside `src/api/client.js`.
* TypeScript, a CSS framework, a component library, or a state management library. Local
  state plus `AuthContext` is the whole model.
* A hardcoded backend URL, including in a default, a comment example or a test fixture.
* Any storage of a password or an OpenRouter key in the browser. The key is written to the
  backend and never read back; the UI only ever shows the last four characters the backend
  returns.

## Running it

`npm run dev` serves on `FRONTEND_PORT`, default `5173`, and proxies `/api` to
`VITE_PROXY_TARGET`, default `http://localhost:4000`. There is no test suite and no linter,
so `npm run build` is the only mechanical check: it catches a syntax error or a bad import
and nothing more. Verify a change by exercising the screen in a browser, and report it that
way rather than implying a suite ran.
