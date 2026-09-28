# Docker

## The image

`Dockerfile` is a two stage build.

1. **build**, on `node:24-slim`: takes `VITE_API_URL` as a build argument, installs
   dependencies, copies the source, and runs `npm run build` into `dist/`.
2. **serve**, on `nginx:1.27-alpine`: copies `nginx.conf` over the default site and
   `dist/` into the web root, exposes `80`, and runs nginx in the foreground.

```
docker build -t mcp-rag-client \
  --build-arg VITE_API_URL=https://your-backend.example.com .
docker run --rm -p 8080:80 mcp-rag-client
```

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
