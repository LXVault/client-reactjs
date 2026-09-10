# Environment Variables

Every value has a fallback in code, so the app runs with no `.env` file at all. Copy
`.env.example` to `.env` only to override something.

| Variable | Default | Read by | Purpose |
|---|---|---|---|
| `VITE_API_URL` | empty | `src/api/client.js` | The backend **origin**, with no `/api` suffix. Empty resolves to a same origin relative base, which the dev server proxies. |
| `VITE_PROXY_TARGET` | `http://localhost:4000` | `vite.config.js` | Where the dev and preview servers proxy `/api`. Development only. |
| `FRONTEND_PORT` | `5173` | `vite.config.js` | Port for the dev and preview servers. |

## `VITE_API_URL` is an origin, not a base path

The client appends `/api` itself, so `https://api.example.com` is correct and
`https://api.example.com/api` is not. The wrapper strips a trailing slash and an accidental
`/api` suffix defensively, so both happen to work, but new code must not rely on that.

## It is inlined at build time, not read at runtime

Vite replaces `import.meta.env.VITE_*` with literals when it builds. In production the value
is fixed in the bundle when the image is built, which means:

* Setting `VITE_API_URL` on a running container does nothing. Rebuild instead.
* On Render, it is a build argument passed to the Docker build, not a runtime service
  variable.
* Never write code that expects to read the value at runtime, and never put a secret in a
  `VITE_*` variable: everything inlined ships to the browser in plain text.

## Development needs none of them

`npm run dev` against a backend on port 4000 works with no configuration: the proxy handles
`/api`, so the browser sees one origin and CORS never enters into it. Set `VITE_API_URL`
only when the backend lives somewhere else.
