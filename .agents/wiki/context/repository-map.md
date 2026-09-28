---
name: agent-wiki-context-repository-map
description: Orientation for an agent before touching this frontend. What lives where, how to run and verify a change, and the gotchas that cost time.
---

# Repository Map

Read this before editing anything in `mcp-rag-client`. Underlying facts live once in
`wiki/` and are linked rather than repeated.

## What this is

A React 19 single page app built with Vite, plain JavaScript with JSX, no TypeScript. It is
the human facing client for the Express backend in `LXVault/server-expressjs`. Screens and
concepts:
[`../../../wiki/information/overview.md`](../../../wiki/information/overview.md).

## Layout

| Path | Holds |
|---|---|
| `src/main.jsx` | Mount point. Wraps the app in the router and `AuthProvider`. |
| `src/App.jsx` | Every route, and which ones are wrapped in `ProtectedRoute`. |
| `src/api/client.js` | The only module that calls `fetch`. Base URL resolution, the bearer token, error normalization, and one method per endpoint. |
| `src/context/AuthContext.jsx` | The session: login, register, logout, and hydrating the user from a stored token. Logout ends the local session immediately and revokes the token in the background. |
| `src/pages/` | One file per screen: `Login`, `Register`, `Dashboard`, `ProjectDetail`, `Members`, `Tokens`, `Analysis`, `Profile`. |
| `src/components/` | Shared pieces: `Layout`, `Navbar`, `Modal`, `ProtectedRoute`, `EmbeddingModelCard`, `OpenRouterKeyCard`. |
| `src/index.css` | The entire stylesheet. One hand written class vocabulary, no framework. |
| `vite.config.js` | Dev and preview servers: the port, the interface they bind to, and the `/api` proxy target. |
| `nginx.conf`, `Dockerfile` | Production: a static build served by nginx. |

## Entry points

* Mount: `src/main.jsx`, then `src/App.jsx` for routing.
* Backend calls: `src/api/client.js`. Nothing else talks to the API.
* Styling: `src/index.css`. Nothing else defines appearance.

## Running and verifying

```
npm install
npm run dev          # http://localhost:5173, proxies /api to localhost:4000
npm run build        # the only mechanical check available
```

The dev server proxies `/api`, so a locally running backend needs no CORS configuration and
no `.env`. Full setup:
[`../../../wiki/environments/setup.md`](../../../wiki/environments/setup.md).

**There is no test suite and no linter.** `npm run build` catches syntax and import errors
and nothing else. Verification is exercising the screen in a browser. Report it that way.

## Gotchas

* **`VITE_API_URL` is an origin, not a base path.** The client appends `/api`. Passing
  `https://host/api` works only because the wrapper strips the suffix defensively; do not
  write new code that depends on that.
* **Vite inlines `VITE_*` at build time.** In production the value is fixed when the image
  is built. Nothing reads it at runtime, so a container cannot be reconfigured by an
  environment variable.
* **nginx does not proxy `/api`.** That is deliberate: on Render the frontend and backend
  are separate services with no shared private hostname, so the browser calls the backend
  origin directly and the backend must allow it through `CORS_ORIGIN`.
* **`Dashboard` and `Analysis` fall back to mock data** when the API is unreachable. A
  screen that looks fine may be showing demo rows; check for the `demo` badge before
  concluding a call succeeded.
* **The backend calls a project a `document`.** Routes are `/documents/:id` and the API
  fields are `document_id`, while the UI says project. They are the same thing.
* **Embedding and upload calls spend the user's own OpenRouter credits.** A `412` from the
  API means the user has no key configured, and the UI must say so rather than showing a
  generic failure.

## Where things get documented

Human documentation goes in `wiki/`, agent knowledge in `.agents/wiki/`, memory in
`.agents/memory/`, and indexes in `.agents/index/`. The placement rules are in
[`../../../AGENTS.md`](../../../AGENTS.md); the shared set is resolved through the
`lxagents-agents-base` connector and is never copied into this repository.
