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
| 1 | Task record | this file | client-reactjs | `chore/frontend-hardening-plan` | #12 |
| 2 | Response headers and reproducible installs | `nginx.conf`, `Dockerfile`, `wiki/environments/docker.md` | client-reactjs | `fix/response-headers` | #13 |
| 3 | Input-handling hygiene | `src/api/client.js`, `Analysis.jsx`, `Dashboard.jsx`, `Tokens.jsx`, `wiki/environments/setup.md` | client-reactjs | `fix/input-handling` | #14 |
| 4 | Release | version, `wiki/logs/`, the `PR` column above | client-reactjs | `chore/frontend-hardening-release` | #15 |

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

### Task 2 — fix/response-headers

`nginx.conf` gained the four headers and the dotfile rule; the Dockerfile installs with
`npm ci`.

**What was verified.** `npm ci` runs clean — 62 packages, 0 vulnerabilities — so the lockfile
is in sync with `package.json` and the build will not fail on it. The production build emits
no inline script, which is what makes plain `script-src 'self'` safe rather than a header
that would have blanked the page.

**What was NOT verified, and cannot be here.** The headers were never executed. This machine
has no nginx, no Docker and no nginx under WSL, so there is nothing to run the config
against. The plan said to confirm them with `curl -I`; that check was wrong on its own terms —
`npm run preview` serves `dist/` with Vite's own server and never reads `nginx.conf`, so it
would have passed whether or not these headers existed. What was actually done instead is a
structural read: braces balanced, directives valid, the dotfile pattern checked against
`/index.html` not matching it, and the lookahead confirmed as PCRE.

The first run of a real deployment is where this gets proven. If the policy is wrong, the
symptom is a blank page and a CSP violation in the console naming the directive — not a
silent failure — which is the reason to ship a policy that tight in the first place.

**A trap this task inherited.** `add_header` is not cumulative across blocks: a `location`
that declares its own `add_header` discards every header inherited from `server`. The dotfile
rule therefore declares none and uses `return 404`, so a dotfile response still inherits the
full set.

### Task 3 — fix/input-handling

Three defects, one branch.

**Path segments are encoded.** Every interpolated value in `src/api/client.js` goes through
`seg()`, except the model id, which goes through `modelSeg()` and keeps its slash. Verified
by driving the real `api` object against a capturing fetch, 17/17: thirteen call sites encode
a hostile id (`../../tokens` arriving as `..%2F..%2Ftokens`), the model arrives as
`openai/text-embedding-3-small` with no `%2F` in it, and a control confirms an ordinary id
like `abc-123` is left alone — so the assertions cannot pass by encoding indiscriminately.

Reading the source could not have proved this. It shows which call sites were changed, not
that none was missed.

**A failed request no longer renders sample data.** `Dashboard` and `Analysis` both
substituted their fixtures in the `catch` branch, so an unreachable API produced three demo
projects and a plausible-looking set of charts for an account that has neither — true of the
fixture, false of the user, with nothing on screen to say which. Verified in a real browser
against both a rejected and an empty response, 12/12 across four scenarios.

The empty-response cases are the control, and they are the reason the run means anything: if
sample data had stopped appearing entirely, the error cases would still have passed. They
still appear, on exactly the condition intended.

Two render guards came with it. `Analysis` returns early at `if (!data)`, which on a failed
load would have shown "No analysis data." and never reached the error banner — the failure
made invisible, which is the same defect one layer down. It now checks `error` first.
`Dashboard` calls `.reduce` on `documents`, so the error path sets `[]` rather than `null`.

**A copied token is cleared from the clipboard** after 30 seconds, but only if the clipboard
still holds it: read-back is attempted first, because clearing unconditionally would destroy
whatever the user copied in the meantime. The token is captured into a local when the copy
happens, not read from state when the timer fires, since the dialog can be closed and reopened
for a different project inside that window.

**Not verified.** The clipboard behaviour has not been run in a browser. It needs clipboard
permission, and a check that grants it would be testing the grant, not the code. What stands
behind it is the build, and the fact that both failure paths — `writeText` throwing, and
`readText` being refused — are caught and leave the token in place rather than throwing
inside a timer. That is the contained direction, but it is reasoning, not a measurement.

**Two false alarms in this task, both mine.** The first run reported
`analysis-empty` as failing to render sample data. It had: the assertion looked for a `demo`
badge, and `Analysis` has no badge — it marks the sample set with a "Showing sample data"
notice, and only `Dashboard` has the badge. The run was wrong, not the code. Correcting it
taught me the docs were wrong in the same way, and `wiki/information/overview.md` and
`.agents/wiki/context/repository-map.md` now say which component does what.

The second was the harness's own assertion count, which evaluated `results.length >= 12`
before pushing its own result, so a correct run of 11 read as a failure.

### Task 4 — chore/frontend-hardening-release

Released as **1.2.0**, into `wiki/logs/1/2/0/CHANGELOG.md`, with `logs-index.md` and
`package.json` in the same commit.

**1.1.0 was not available.** The plan asked for a minor and the user approved 1.1.0; the
first thing checked was the existing tree, and `wiki/logs/1/1/0/CHANGELOG.md` was already
there, committed as `2e661a5` on 2026-09-10. Writing this chain's log into that directory
would have rewritten a released version, which the changelog creator forbids. The user chose
1.2.0 instead.

**The manifest had drifted.** `package.json` said `1.0.0` while the logs were at `1.1.0` —
1.1.0 shipped without ever bumping it. This is the same two-sources-of-truth problem reported
for `mcp`, found here on the way past. The manifest is now `1.2.0` and agrees with the logs.
The two versions still named in `repository-state.md` are the app's and the shared
instruction set's, and the latter is correctly left at `1.0.0`.

**What the release covers that this record does not.** PRs #10 and #11 merged before this
chain began and carried no version claim of their own, so 1.2.0 is the first release to
describe them: the loopback dev server, the dependency majors, and server-side logout
revocation. Their own record, `dependency-upgrade.md`, stays open for the same reason it did
before — its release was never asked for, and this one does not stand in for it.

## Status

Work complete across four branches, all four pushed, and all four merged: #12 as `7f4359a`,
#13 as `1ff0ba5`, #14 as `af76b3c` and #15 as `489f9ed`, each as a merge commit. The `PR`
column above was filled in #15 rather than as a follow-up, because the release branch was
still open when the numbers existed.

**Each pull request was re-targeted to `master` before it was merged, not after.** A forge
only re-targets a stacked pull request when its base branch is deleted on merge; where that
setting is off, #13 would have merged into `chore/frontend-hardening-plan` and #15 into
`chore/frontend-hardening-release`, leaving `master` behind while every page said merged.
`git log origin/master..chore/frontend-hardening-release` is now empty, which is the check
that says the chain actually landed rather than that the pull requests closed.

1.2.0 is on `master`, and `wiki/logs/1/2/0/CHANGELOG.md` is with it. All ten branches this
record and `dependency-upgrade.md` produced have been deleted, locally and on the remote.

Record closed.
