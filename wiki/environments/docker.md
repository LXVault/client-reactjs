# Docker

## The image

`Dockerfile` is a two stage build.

1. **build**, on `node:24-slim`: takes `VITE_API_URL` as a build argument, installs
   dependencies with `npm ci`, copies the source, and runs `npm run build` into `dist/`.
2. **serve**, on `nginx:1.27-alpine`: copies `nginx.conf` over the default site and
   `dist/` into the web root, exposes `80`, and runs nginx in the foreground.

```
docker build -t mcp-rag-client \
  --build-arg VITE_API_URL=https://your-backend.example.com .
docker run --rm -p 8080:80 mcp-rag-client
```

## `npm ci`, not `npm install`

The build installs from the committed lockfile. `npm ci` installs exactly what
`package-lock.json` pins and **fails the build** when that lockfile has drifted out of sync
with `package.json`, which is the behaviour you want: a dependency added without its lockfile
entry is a build failure rather than a silently different image. `npm install` would instead
resolve a newer tree, so the image could contain code that was never reviewed or audited.

## Security headers

`nginx.conf` sets four headers on every response, and denies dotfiles:

| Header | Value |
|---|---|
| `Content-Security-Policy` | see below |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

All four carry `always`, without which nginx attaches them only to a short list of success
and redirect statuses and sends a 404 or a 500 out bare.

The policy is `default-src 'self'`, with `object-src 'none'`, `base-uri 'self'`,
`form-action 'self'` and `frame-ancestors 'none'`. `frame-ancestors` is the modern equivalent
of `X-Frame-Options` and belongs in the header — in a `<meta>` tag it is silently ignored.
Vite emits no inline script, so `script-src` is plain `'self'`.

Two directives are relaxed on purpose:

* **`style-src` includes `'unsafe-inline'`.** The app sets 25 inline `style={{...}}` props
  across `src/` and Vite does not extract them. Inline styles are not a script execution
  vector.
* **`connect-src` includes `https:`.** The browser calls the backend origin directly, and
  that origin is baked in at build time as `VITE_API_URL`, so this file cannot know it.
  Narrowing it to the exact origin would need a new build argument and a coordinated
  redeploy of every deployment. Since `script-src 'self'` already stops injected script from
  running, the only thing this widens is where the application's *own* JavaScript may send a
  request — which it can already choose.

Dotfiles return 404. The pattern is `/.` rather than `.` so that `/index.html` still reaches
the SPA fallback. `.well-known` is excluded because a TLS terminator in front of the image
may need it.

## The build argument matters, the runtime environment does not

Vite inlines `VITE_*` variables into the bundle at build time, so `VITE_API_URL` must be
passed with `--build-arg`. Setting it with `-e` on `docker run` has no effect at all: the
bundle is already written. Changing which backend the app talks to means rebuilding the
image.

## nginx configuration

`nginx.conf` does two things.

**SPA fallback.** `try_files $uri $uri/ /index.html` sends any path that is not a real file
to the app, so a deep link such as `/documents/abc` loads instead of returning a 404.

**No API proxy.** There is deliberately no `/api` location block. On platforms such as
Render the frontend and backend are separate services with no shared private hostname, so a
hardcoded upstream fails to resolve and the container will not start. Instead the browser
calls the backend origin directly, using the `VITE_API_URL` baked in at build time, and the
backend must allow that origin through its own `CORS_ORIGIN`.

An earlier revision did proxy `/api` to a compose service named `backend`; it was removed
for exactly this reason.

## No compose file

There is none in this repository. Run the backend separately and point the build argument
at it.
