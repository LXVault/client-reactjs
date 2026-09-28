# 1.2.0

Released 2026-09-28.

The app no longer serves itself on the local network, tells the browser what it is allowed to
load, and stops showing you sample data when something has actually gone wrong.

**Read this one if you reach the dev server from another machine.** It binds to `localhost`
now. That is the point of the change, not a regression — see Changed.

## Security

* The served app sends `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`
  and `Referrer-Policy`, and returns 404 for dotfiles so a `.git` directory can never be
  served. Two directives are relaxed deliberately and are explained in `nginx.conf` and
  [environments/docker.md](../../environments/docker.md): `style-src` allows inline styles
  because the app sets 25 of them, and `connect-src` allows any `https:` origin because the
  backend origin is baked in at build time and nginx cannot know it.
* Path segments interpolated into API URLs are now encoded, so a value containing a slash
  can no longer change which endpoint a request reaches. The embedding model id keeps its
  slash: the backend matches it with a wildcard route, and encoding it would stop the match.
* A copied project token is cleared from the clipboard after 30 seconds — but only if the
  clipboard still holds it, so that clearing it cannot destroy something copied since.
* Logging out now revokes the session token server-side, rather than only forgetting it in
  the browser. A token read out of `localStorage` before this release stays valid until it
  expires on its own.

## Changed

* **The dev and preview servers bind to `localhost` instead of every network interface.** A
  Vite dev server transforms and serves the source it is given, so the old binding put the
  repository on the LAN. Set `FRONTEND_HOST=0.0.0.0` to restore the old behaviour
  deliberately — for a container, a phone, or a second machine. This is the one change in
  this release that can break a working setup.
* The dependency stack moved to current majors: Vite 8, React 19, React Router 7 and
  Recharts 3, on a `node:24-slim` build image. Vite 8 replaces esbuild with rolldown, which
  is what clears the last of the 8 advisories `npm audit` was reporting. Node `^20.19.0` or
  `>=22.12.0` is now required.
* The Docker build installs with `npm ci` rather than `npm install`, so the image contains
  the tree that was actually reviewed and the build fails when the lockfile has drifted.

## Fixed

* A failed request no longer renders sample data. The dashboard and the analysis screen
  both substituted their demo fixtures in the error branch, so an unreachable API produced
  three demo projects and a plausible set of charts for an account that has neither — true
  of the fixture, false of you, with nothing on screen saying which. A failure now shows an
  error banner and no rows.
* The analysis screen no longer hides that error behind "No analysis data."

## Notes

* The embedding model id is the one path segment that is not encoded whole, by design. The
  comment in `src/api/client.js` says why; it is the kind of exception that looks like an
  oversight to the next reader.
* `package.json` said `1.0.0` while `wiki/logs/` was already at `1.1.0` — the two had drifted
  apart when 1.1.0 shipped. The manifest now matches the logs.
