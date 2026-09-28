---
name: memory-tasks-frontend-hardening
description: Record of the response headers, the reproducible install, and the input-handling hygiene pass, so a later pass starts from the known state rather than re-deriving it.
---

# Task: response headers and input-handling hygiene

**Goal.** Three client-side findings from the audit were only partly closed. The served app
sends no response headers at all, the image installs from `package.json` rather than the
lockfile, and the dashboard and analysis screens substitute sample data when the API call
*fails* — so a broken deployment looks like a healthy empty account. The rest is fixed here.

**Objective.** Five response headers on the served app, an install that is reproducible from
the lockfile, and no screen that displays invented data as if it were real.

**Detail.** Task 1 of 4 in this chain. Task 4 is a release and needs explicit version
approval, which has not been given — no version is touched and no `wiki/logs/` directory is
created here. The httpOnly-cookie migration stays out of scope: it is an auth-model change
that needs CSRF protection with it, not a line in a hygiene pass. No dependency is added,
removed, or changed.

## Tasks

| # | Title | Scope | Repository | Branch | PR |
|---|---|---|---|---|---|
| 1 | Task record | this file | client-reactjs | `chore/frontend-hardening-plan` | not opened |
| 2 | Response headers and reproducible installs | `nginx.conf`, `Dockerfile`, `wiki/environments/docker.md` | client-reactjs | `fix/response-headers` | not opened |
| 3 | Input-handling hygiene | `src/api/client.js`, `Analysis.jsx`, `Dashboard.jsx`, `Tokens.jsx`, `wiki/environments/setup.md` | client-reactjs | `fix/input-handling` | not opened |
| 4 | Release | version, `wiki/logs/`, the `PR` column above | client-reactjs | `chore/frontend-hardening-release` | needs approval |

## Decisions

**`connect-src` is `'self' https:` rather than the exact backend origin.** A static
`nginx.conf` cannot know the backend origin — it is baked in at build time as `VITE_API_URL`
— so the precise value would need a new Docker build argument. That breaks every existing
deployment built without it. `'self' https:` is the containment that ships without a
coordinated redeploy, and the residual risk is bounded: `script-src 'self'` already stops
injected script from running, so the only thing `connect-src` widens is where the
application's *own* JavaScript may send a request, which it can already choose. Recorded here
so a later pass can tighten it deliberately rather than discover it.

**`style-src 'unsafe-inline'` is required and stays.** There are 25 inline `style={{...}}`
props across `src/`, and Vite does not extract them. Inline styles are not a script
execution vector, so this relaxation is contained; it is written into `nginx.conf` as a
comment so the next reader knows it was a decision.

**The model id is not encoded whole.** `api.deleteModelEmbeddings` sends
`{platform}/{model}` — `openai/text-embedding-3-small` — and the backend matches it with a
wildcard route (`server-expressjs/src/routes/documents.js:141`, `/:id/embeddings/*model`).
`encodeURIComponent` on the whole value turns that slash into `%2F` and the route stops
matching. Each part is encoded and the slash is rejoined.

**The demo rows stay, but only for an empty account.** The audit asked for sample data never
to be substituted on an error. It is still substituted when the API succeeds and returns
nothing, because that is what a new account sees and an empty screen tells them nothing.
What changes is that a *failed* request produces an error banner and an empty list instead of
three fabricated projects.

### Task 1 — chore/frontend-hardening-plan

The confirmed list, written before any of it is built. No production file is touched by
this task.

Reading the code before planning changed three things in it, and each is recorded at the
point above rather than discovered later: the model id's slash, the early return in
`Analysis.jsx` that would have hidden the error banner behind "No analysis data.", and the
paragraph in `wiki/environments/setup.md` that tells the reader demo rows mean the API is
down — the exact inverse of what this chain makes them mean.
