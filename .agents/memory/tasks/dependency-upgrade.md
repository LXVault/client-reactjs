---
name: memory-tasks-dependency-upgrade
description: Record of the dependency upgrade and dev-server exposure fix, so a later upgrade starts from the known state rather than re-deriving it.
---

# Task: dependency upgrade and dev-server exposure

**Goal.** The frontend was three majors behind on every library, and `npm audit` reported 8
advisories, 4 of them high. Separately, the dev server was bound to every network interface,
which put the source tree on the LAN. Both are fixed here.

**Objective.** Current majors, a clean audit, and a dev server that is loopback unless
someone deliberately says otherwise. The versions land in their own commit after the
exposure fix, so the exploitable half is not waiting on a major upgrade.

**Detail.** Task 1 of 3 in this chain. Task 2 is the session-hygiene fix, and task 3 is a
release, which needs explicit version approval and has not been asked for. No new
dependency is added and none is removed.

## Tasks

| # | Title | Scope | Repository | Branch | PR |
|---|---|---|---|---|---|
| 1 | Dev-server exposure, then the version upgrade | `vite.config.js`, `Dockerfile`, `package.json`, version-referencing docs | client-reactjs | `build/dependency-upgrade` | not opened |
| 2 | Session hygiene: real logout | `api.logout()`, `AuthContext`, `Navbar` | client-reactjs | `fix/session-hygiene` | not opened |
| 3 | Release | version and `wiki/logs/` | client-reactjs | — | needs approval |

### Task 1 — build/dependency-upgrade

Two commits.

**Commit 1, the exposure.** `vite.config.js` set `host: true` on both the dev and the
preview server, which is `0.0.0.0`. A Vite dev server transforms and serves the source it
is given, so that exposed the repository to the network. `FRONTEND_HOST` now selects the
interface and defaults to `localhost`.

Measured, not inferred. Before, on port 5198:

```
TCP  0.0.0.0:5198   LISTENING
TCP  [::]:5198       LISTENING
Network: http://172.20.10.4:5198/
Network: http://192.168.208.1:5198/
```

After, on port 5199:

```
TCP  [::1]:5199      LISTENING
Local:   http://localhost:5199/
```

**Commit 2, the versions.**

| Package | From | To |
|---|---|---|
| `vite` | `^5.4.2` | `^8.3.1` |
| `@vitejs/plugin-react` | `^4.3.1` | `^6.1.1` |
| `react`, `react-dom` | `^18.3.1` | `^19.3.0` |
| `react-router-dom` | `^6.26.1` | `^7.18.4` |
| `recharts` | `^2.12.7` | `^3.10.1` |
| build image | `node:20-slim` | `node:24-slim` |

`npm audit`: 8 advisories across 7 packages, 4 high, 4 moderate → **0**. The tree also went
from 848 to 613 modules, because Vite 8 replaces `esbuild` with `rolldown` and `esbuild` is
no longer installed at all. That is what closes the esbuild advisory that commit 1 could not.

## Decisions

* **The exposure is fixed before the versions, not after.** The loopback fix stands on its
  own and needs no major upgrade. Bundling it with the upgrade would have meant the network
  path stayed open until a breaking change finished.
* **`node:24-slim`, not `node:22-slim` as originally planned.** Node 20 reached end of life
  on 2026-04-30, and Node 24 is the current Active LTS until 2028-04-30. Node 22 would
  have satisfied Vite 8's `^20.19.0 || >=22.12.0` range, so this is about the base image
  being on a supported line, not about the upgrade requiring it. `engines` is now declared
  in `package.json` so the requirement is mechanical rather than prose.
* **`isAnimationActive` was left alone.** It would have made the chart render without its
  entrance animation. Changing product behaviour to suit a test harness is backwards.
* **No permanent test harness was added.** The verification below is described so it can be
  repeated, but this repository has no test runner and no CI, and adding scripts that
  nothing executes would not have made that any better. It is the same finding already
  recorded for the other two repositories.

## Verifying the charts, and three things that made it look worse than it was

A passing `npm run build` says nothing about whether the charts still draw, and the analysis
screen is the only screen using a non-trivial library surface. So it was checked in a real
browser, against the real `Analysis` component, over the DevTools Protocol: 17 assertions,
all passing, no console errors or warnings.

`Analysis.jsx:59-63` falls back to `MOCK_ANALYSIS` when the API is unreachable, which is
what made this possible without a backend and without stubbing the component under test.
Bar heights came out 239.8889 / 84.6667 / 56.4444 for chunk counts of 34 / 12 / 8, so the
data reaches the chart and the geometry is proportional. The pie drew three sectors with the
right palette, the axis drew all three document titles and eight tick values, and the legend
drew three items.

Three false alarms came first, and all three are worth knowing about:

1. **Server-side rendering proves nothing here.** `renderToStaticMarkup` returned
   `<div class="recharts-wrapper">` and no chart at all. Recharts 3 renders chart content
   client-side only. An SSR harness would have reported a total failure that does not exist.
2. **Recharts 3 renamed enough classes that copied-from-v2 assertions silently match
   nothing.** `recharts-rectangle` is now on a `<path>`, not a `<rect>`; the grid classes are
   `recharts-cartesian-grid-horizontal` / `-vertical`; the legend root is
   `recharts-default-legend`. Every one of those first failed, and every one was the
   assertion being wrong rather than the chart.
3. **The pie labels look missing in a headless tab and are not.** `Pie.js:522` gates labels
   on `showLabels: !isAnimating`, and the entrance animation is driven by
   `requestAnimationFrame`, which a headless tab never runs. So the labels never unblock.
   Confirmed by rendering the identical label function with `isAnimationActive={false}`,
   which produced `owner (3)`, `editor (5)`, `viewer (2)`. This was nearly recorded as a
   regression in a dependency upgrade.

**Not verified:** the animated path end to end, because a headless tab cannot run it. The
label prop itself is proven correct by the isolated probe, and no application code changed,
but nobody has watched the pie animate in this upgrade. The other two screens touched by the
majors are plain React with no changed API surface: `main.jsx` already used `createRoot`, and
the router usage is entirely `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`,
`Navigate`, `Outlet`, `useParams`, `useNavigate`, `useLocation`, all unchanged in v7.

### Task 2 — fix/session-hygiene

Landed:

* `src/api/client.js`: `api.logout()`, a `POST /api/auth/logout`.
* `src/context/AuthContext.jsx`: `logout` is now async. It issues the revocation, ends the
  local session, and lets the revocation finish in the background.
* `src/components/Navbar.jsx`: `void logout()`, so the intent is explicit and no rejection
  can escape.
* `wiki/information/architecture.md`: the session section and the `api` method list.

**The defect.** `logout()` only cleared local state. The backend's `logout` handler bumps
`token_version`, which retires every session token signed with the previous value — so
before this, clicking Logout left a credential that kept working until it expired on its
own. Anything that had read the token out of `localStorage` — an XSS, a shared machine, a
console — stayed signed in after the user believed they had left.

**Why the order in `logout` is load-bearing.** `request` reads the stored token and builds
its `Authorization` header synchronously, before its first `await`, so the revocation is
issued before the state updates clear the token. Clearing first would send the call
unauthenticated and get a 401. Awaiting first would hold the user on the page for a round
trip they did not ask to wait for.

**Verified in a real browser**, driving the real `Navbar` and the real `AuthProvider` with a
controllable `fetch`: 17 assertions, all passing, no console errors. The revocation fetch
was deliberately left unresolved while the post-click state was measured, so "the session
ended before the network answered" is a measurement and not an inference. The
`Authorization: Bearer` header was confirmed on the wire, and the same suite passes with the
revocation rejecting, with no unhandled rejection.

A control runs first, asserting the pre-fix behaviour issues no revocation call. Without it,
a harness that could not detect a missing revocation would make the rest of the suite
meaningless — which is the same trap that produced a vacuous negative test in `mcp`.

**Out of scope, and why.** Moving the JWT out of `localStorage` into an httpOnly cookie is
the real fix for token theft, and it is a cross-repository change: the backend's
`requireAuth` reads only the `Authorization` header and has no cookie support. Doing the
half that is available here is worth more than doing none of it.

## Status

Two commits on `build/dependency-upgrade` and one on `fix/session-hygiene`, all unpushed.
`fix/session-hygiene` is stacked on `build/dependency-upgrade`, so its pull request must
target that branch, not `master`. No pull request has been opened and none has been asked
for. Merging is the user's call.

Task 3, the release, is not started and needs explicit version approval.

Record open.
