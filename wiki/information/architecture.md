# Architecture

## Shape

```
src/main.jsx            mount, BrowserRouter, AuthProvider
  src/App.jsx           every route, and which are wrapped in ProtectedRoute
    src/components/Layout.jsx    navbar plus the routed page
      src/pages/*.jsx            one file per screen
        src/api/client.js        the only module that calls fetch
```

Plain JavaScript with JSX. No TypeScript, no state management library, no CSS framework and
no component library. Local component state plus one context is the whole model.

## Routing

`src/App.jsx` declares every route inside a single `Layout` element, so the navbar renders
once and the page swaps beneath it. Authenticated routes are wrapped in `ProtectedRoute`,
which redirects to `/login` when there is no session. An unknown path redirects to `/`.

## Session

`AuthContext` owns the session and exposes `login`, `register`, `logout` and the current
user through `useAuth()`.

The JWT is stored in `localStorage` under `mcp_rag_token`, written only through `setToken`
in `src/api/client.js`. On first load, a stored token is exchanged for the user with
`GET /api/profile`; if the backend rejects it the token is cleared, which is how an expired
session logs itself out.

## Talking to the backend

`src/api/client.js` is the single boundary. It owns four things:

**The base URL.** `VITE_API_URL` is the backend origin, and the client appends `/api`
itself. An empty value resolves to a same origin relative base, which the Vite dev server
proxies in development and which is not used in production. A trailing slash or an
accidental `/api` suffix is stripped defensively.

**The bearer token.** Read from `localStorage` and attached to every authenticated request.

**Error normalization.** A network failure becomes `Network error: unable to reach the
API`. A non 2xx response becomes an `Error` carrying the backend's own `error` string and
its status. Pages render `err.message` and never inspect a response themselves.

**One method per endpoint.** The exported `api` object mirrors the backend surface:
`login`, `register`, `profile`, projects and members, files, tokens, the OpenRouter key,
the embedding model and its embeddings, and analysis.

Multipart uploads use a separate helper in the same file, which deliberately omits
`Content-Type` so the browser supplies the multipart boundary.

## Components

| Component | Purpose |
|---|---|
| `Layout` | Navbar plus the routed page. |
| `Navbar` | Navigation and the signed in user. |
| `ProtectedRoute` | Redirects to `/login` without a session. |
| `Modal` | The one dialog primitive, used for destructive confirmations. |
| `EmbeddingModelCard` | Reads and writes a project's embedding model, reports how much of the knowledge base that model can search, backfills what is missing, and lists the models the project already holds vectors for. Disabled for non admins. Rendered on the members screen. |
| `OpenRouterKeyCard` | Sets and clears the user's own API key. |

## Embedding coverage

The backend stores one vector per chunk per model, so a project can hold several models at
once and changing the selected model never deletes anything. Every embedding endpoint
returns the same payload: the selected model, `coverage` as total, embedded and pending
chunk counts, and `storedModels` as the models that already have vectors.

`EmbeddingModelCard` applies that one payload after a read, a switch, a backfill or a
removal, so the card never needs a second round trip to know what an action cost. Backfill
runs in a loop because the backend embeds in batches and reports what is left; the loop
stops when a batch embeds nothing, so a chunk that cannot be embedded does not spin
forever.

## Styling

`src/index.css` is the entire stylesheet: a hand written class vocabulary of `card`, `btn`
and its variants, `form-group`, `section-title`, `muted`, `small`, `badge`, `error-banner`,
`success-banner`, `notice`, `stat-card`, `page-header`, `table`, `modal-*` and `grid`. New
appearance goes there, beside its relatives. Inline `style` is used only for one off layout
nudges.

## Production

`npm run build` produces a static bundle in `dist/`, which nginx serves with an SPA
fallback so client side routing works on a deep link. The browser calls the backend origin
directly; nginx does not proxy `/api`. See [docker.md](../environments/docker.md) for why.
