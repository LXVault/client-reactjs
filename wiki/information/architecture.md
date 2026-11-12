# Architecture

## Shape

```
src/main.tsx            mount, BrowserRouter, AuthProvider
  src/App.tsx           every route, and which are wrapped in ProtectedRoute
    src/components/Layout.tsx    navbar plus the routed page
      src/pages/*.tsx            one file per screen
        src/api/client.ts        the only module that calls fetch
        src/api/types.ts         the response and payload shapes the screens read
```

TypeScript with JSX, in strict mode. No state management library, no CSS framework and no
component library. Local component state plus one context is the whole model.

## Types

`tsc` only type checks; Vite still does the compiling, so the output in `dist/` is the same
static bundle it always was. There are two configurations: `tsconfig.json` covers `src/`
with bundler module resolution and the React JSX transform, and `tsconfig.node.json` covers
`vite.config.ts`, which runs in Node.

`src/api/types.ts` describes the backend's responses as this client reads them. The backend
owns those contracts, so the types list only the fields a screen uses, and a field the code
already guards against being absent is optional. A response is cast to its type, not
validated, so a backend change can still reach the screen as a runtime surprise rather than
a compile error.

## Routing

`src/App.tsx` declares every route inside a single `Layout` element, so the navbar renders
once and the page swaps beneath it. Authenticated routes are wrapped in `ProtectedRoute`,
which redirects to `/login` when there is no session. An unknown path redirects to `/`.

## Session

`AuthContext` owns the session and exposes `login`, `register`, `logout` and the current
user through `useAuth()`.

The JWT is stored in `localStorage` under `mcp_rag_token`, written only through `setToken`
in `src/api/client.ts`. On first load, a stored token is exchanged for the user with
`GET /api/profile`; if the backend rejects it the token is cleared, which is how an expired
session logs itself out.

Logging out calls `POST /api/auth/logout`, which retires the token server-side by bumping
the user's token version. A stateless JWT has no other way to be cancelled, so without that
call a token read out of `localStorage` keeps working until it expires on its own. The local
session ends immediately and the revocation continues in the background, so a slow or failed
network never leaves the user sitting on a page they have already left.

## Talking to the backend

`src/api/client.ts` is the single boundary. It owns four things:

**The base URL.** `VITE_API_URL` is the backend origin, and the client appends `/api`
itself. An empty value resolves to a same origin relative base, which the Vite dev server
proxies in development and which is not used in production. A trailing slash or an
accidental `/api` suffix is stripped defensively.

**The bearer token.** Read from `localStorage` and attached to every authenticated request.

**Error normalization.** A network failure becomes `Network error: unable to reach the
API`. A non 2xx response becomes an `Error` carrying the backend's own `error` string and
its status. Pages render the message through `errorMessage(err, fallback)`, which also
gives a caught value of unknown type a readable string, and never inspect a response
themselves.

**One method per endpoint.** The exported `api` object mirrors the backend surface:
`login`, `register`, `logout`, `profile`, projects and members, files, tokens, the
OpenRouter key, the embedding model and its embeddings, and analysis.

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
