# Local Setup

## Requirements

* Node.js `^20.19.0` or `>=22.12.0`, which is what Vite 8 requires. The build image is
  `node:24-slim`, on the current Active LTS line.
* The Express backend running locally, if you want real data. Without it every screen
  reports that the API is unreachable — no screen falls back to sample data on a failure,
  only on a genuinely empty account.

## Steps

```
npm install
npm run dev
```

The dev server listens on `FRONTEND_PORT`, default `5173`, and proxies `/api` to
`VITE_PROXY_TARGET`, default `http://localhost:4000`. That proxy is why a local backend
needs no CORS configuration and why no `.env` file is required to develop against one.

It also binds to `localhost` and nothing else, so it is not reachable from another machine
by default. To reach it from a container, a phone, or a second box, set `FRONTEND_HOST` to
`0.0.0.0` — deliberately, because the dev server serves the source it transforms.

Every variable and its fallback: [env.md](env.md).

## Verify

Open `http://localhost:5173`. Register an account, and the dashboard should come up showing
the three demo projects with a `demo` badge and a note that they are sample data. They stand
in for an account that has no projects yet, and disappear once the first real project
exists.

If the API cannot be reached you get an **error banner and an empty list** instead, never
demo rows — a failed request is not the same as an empty account, and showing samples for it
would report three projects for an account that has none. A banner means the backend is not
up on port 4000 or `VITE_PROXY_TARGET` points somewhere else.

Anything that embeds text, uploading a file or changing knowledge, needs an OpenRouter API
key on the account. Set it on the profile screen. Without one those actions come back with
a message saying so.

## Building

```
npm run build      # static bundle in dist/
npm run preview    # serve dist/ with the same /api proxy
```

`npm run build` is the only mechanical check in this repository. It catches syntax errors
and bad imports and nothing else: there is no test suite and no linter. Verify a change by
exercising the screen in a browser.

## Pointing at a deployed backend

Set `VITE_API_URL` to the backend **origin**, with no `/api` suffix, and rebuild:

```
VITE_API_URL=https://your-backend.onrender.com npm run build
```

Vite inlines the value at build time, so it cannot be changed afterwards without another
build. The backend must allow that origin through its own `CORS_ORIGIN`.
