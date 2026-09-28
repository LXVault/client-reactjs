# Overview

The app this container serves declared no boundary to the browser at all, and the image
resolved its dependencies fresh on every build rather than installing the tree that had
actually been reviewed. This pull request adds a content security policy and three companion
headers, denies dotfiles, and switches the build to `npm ci`.

Merge order: 2 of 4 — merges after #12 in `client-reactjs`.

# Added

- `nginx.conf` — `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` and
  `Referrer-Policy`, all with `always` so they are attached to 404s and 500s rather than only
  to a short list of success and redirect statuses.
- `nginx.conf` — a dotfile rule returning 404. The pattern is `/.` rather than `.` so that
  `/index.html`, whose dot is not directly after the slash, still reaches the SPA fallback.
  `.well-known` is excluded for a TLS terminator in front of the image.
- `wiki/environments/docker.md` — a section on the four headers, the two deliberate
  relaxations, and why the image installs with `npm ci`.

# Modified

- `nginx.conf` — the policy is `default-src 'self'` with `object-src 'none'`, `base-uri
  'self'`, `form-action 'self'` and `frame-ancestors 'none'`. `frame-ancestors` is in the
  header deliberately; in a `<meta>` tag it is silently ignored.
- `Dockerfile` — `npm install` became `npm ci`, which installs exactly what the committed
  lockfile pins and fails the build when that lockfile has drifted from `package.json`.

# Summary

Blast radius is the served app, and it is user-visible in one way: **if the policy is wrong,
the page goes blank.** That is deliberate — a broken policy fails loudly, with a console
violation naming the directive, rather than silently degrading — but it means the first
deployment is where this gets proven, not this pull request.

Two directives are relaxed on purpose, and both are commented in the file:

- `style-src 'unsafe-inline'`, because the app sets 25 inline `style={{...}}` props and Vite
  does not extract them. Inline styles are not a script execution vector.
- `connect-src https:`, because the browser calls the backend origin directly and that
  origin is baked in at build time as `VITE_API_URL`. Narrowing it needs a new Docker build
  argument and a coordinated redeploy of every deployment. Since `script-src 'self'` already
  stops injected script from running, what this widens is only where the application's own
  JavaScript may send a request — which it can already choose.

What was verified, and what was not: `npm ci` runs clean at 62 packages with 0
vulnerabilities, and the production build emits no inline script, which is what makes plain
`script-src 'self'` safe. The headers were **not** executed — this machine has no nginx, no
Docker and no nginx under WSL, so nothing could run the config. A `curl -I` check was
planned and is not a valid one here: `npm run preview` serves `dist/` through Vite and never
reads `nginx.conf`, so it would have passed whether or not these headers existed. What was
done instead is structural — braces balanced, directives valid, the dotfile pattern checked
against `/index.html`, the lookahead confirmed as PCRE.

Follows #12. Next is #14, which encodes path segments and removes sample data from the
failure path.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
