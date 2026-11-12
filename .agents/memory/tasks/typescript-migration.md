---
name: memory-tasks-typescript-migration
description: Record of migrating the frontend from JavaScript to strict TypeScript, with the dependency update that preceded it: the agreed task list, what each task landed, and the checklist items deliberately not applied.
---

# Task: TypeScript migration

**Goal.** The owner asked for every Node.js repository in the project to move to
TypeScript, on current dependencies and a clean audit. For this frontend that means the
source, the Vite config and the build all move to TypeScript, without changing what the app
does.

**Objective.** Every `.jsx` file is `.tsx` and every `.js` file is `.ts`; `tsc` passes in
strict mode with no implicit `any`; `npm run build` type checks before bundling; `npm audit`
reports 0; and the app behaves as it did, checked in a browser.

**Detail.** Runtime behaviour, routes, the `api` wrapper's contract, styling, the nginx
image and the `dist/` output do not change. Vite keeps compiling; `tsc` only type checks.
The sibling repositories migrate on their own branches and do not depend on this one.

## Tasks

| # | Title | Scope | Repository | Branch | PR |
|---|---|---|---|---|---|
| 1 | Task record | this file, `memory-index.md` | client-reactjs | `plan/typescript-migration` | #21 |
| 2 | Dependency update | `package.json`, `package-lock.json` | client-reactjs | `build/dependency-update` | #22 |
| 3 | TypeScript conversion | `src/**`, `vite.config.ts`, `tsconfig*.json`, `index.html`, scripts, docs naming the old paths | client-reactjs | `refactor/typescript` | #23 |
| 4 | Release | version, `wiki/logs/`, `logs-index.md`, closing entry | client-reactjs | `release/1.3.0` | #24 |

## Checklist items not applied, and why

The request carried a checklist written for Node services. These items do not fit a static
single page app and were left out on purpose:

* **`main`, `types`, `bin`, `start`.** The package is private and nothing imports it; nginx
  serves `dist/`. `preview` already serves the built output locally.
* **`tsx` or `ts-node`.** Nothing runs TypeScript under Node directly. Vite loads
  `vite.config.ts` and transforms `src/` itself.
* **`outDir: ./dist` on `tsc`.** Vite owns `dist/`. `tsc` runs with `noEmit`, so the bundle
  is the only output and the image is unchanged.
* **A `test` script.** There is no test suite, as `repository-state.md` already records.
  Adding a script that runs nothing would imply a check that does not exist.

### Task 1 — plan/typescript-migration

This record, written before any of the work, and its row in `memory-index.md`.

### Task 2 — build/dependency-update

| Package | From | To |
|---|---|---|
| `react`, `react-dom` | `^19.3.0` | `^19.3.1` |
| `react-router-dom` | `^7.18.4` | `^7.18.5` |
| `recharts` | `^3.10.1` | `^3.10.1`, already latest |
| `vite` | `^8.3.1` | `^8.3.8` |
| `@vitejs/plugin-react` | `^6.1.1` | `^6.3.0` |

Added as dev dependencies, for task 3: `typescript` `^7.0.2`, `@types/node` `^26.6.6`,
`@types/react` `^19.3.0`, `@types/react-dom` `^19.3.0`. TypeScript 7 is the native
compiler; it still installs as `tsc`.

`npm audit`: 0 vulnerabilities. No code changed in this task, so `npm run build` on this
branch is the same JavaScript build as before.

### Task 3 — refactor/typescript

Landed:

* Every file under `src/` renamed: `.jsx` to `.tsx`, `src/api/client.js` to `.ts`, and
  `vite.config.js` to `vite.config.ts`. `index.html` loads `src/main.tsx`.
* `tsconfig.json` for `src/`: `ES2022`, bundler resolution, `react-jsx`, `strict`,
  `noEmit`, `rootDir: ./src`, `vite/client` types. `tsconfig.node.json` for
  `vite.config.ts`: `NodeNext`, `node` types.
* `src/api/types.ts` describes each backend response as the screens read it. Field shapes
  were checked against the controllers in `server-expressjs`; ids are UUID strings.
* `src/api/client.ts`: `request<T>` and `upload<T>` are generic and every `api` method
  names its response type. The two copies of the error construction became
  `responseError` and `networkError`, with the same messages and `status`. A new
  `errorMessage(err, fallback)` replaces `err.message || fallback` in every component,
  because a caught value is `unknown` under `strict`.
* `src/vite-env.d.ts` types `VITE_API_URL`.
* Scripts: `typecheck` runs both configurations, and `build` runs it before `vite build`.
* Docs: `wiki/information/architecture.md` (new Types section), `wiki/environments/env.md`,
  `wiki/environments/setup.md`, `.agents/wiki/context/repository-map.md`,
  `.agents/memory/state/repository-state.md`.

Two narrowings were not pure annotations. `ProjectDetail` returns `null` when no document
has loaded and there is no error, a state that previously threw on `document.title`, and
`startEdit` returns early on the same condition. `ProtectedRoute` wraps `children` in a
fragment so its return type is an element.

**Verified.** `npm run typecheck` and `npm run build` pass; `npm audit` reports 0. The
bundle is 689 kB against 691 kB before; the chunk size warning predates this change. A
Playwright run against `vite preview`, with the API stubbed at the network layer, passed 14
of 14 checks: login stores the token, every protected screen renders its data, the bar and
pie charts draw, a `403` shows the backend's message, logout sends the bearer before
clearing it, and the console stays clean. The harness was not committed, for the reason
`dependency-upgrade.md` gives.

**Left stale, on purpose.** `.agents/rules/repository.md` still forbids TypeScript, still
names the `.js` and `.jsx` paths, and still says components render `err.message`. It is an
instruction file, so the change is proposed to the owner rather than written. The same goes
for `.gitignore`, which does not exclude `.agents/plans/`.

### Task 4 — release/1.3.0

`package.json` and `package-lock.json` go from `1.2.0` to `1.3.0`, approved by the owner with
the plan. Minor rather than patch because the release adds files and a script, and changes
every source path a contributor edits, even though no behaviour changes for a user.
`wiki/logs/1/3/0/CHANGELOG.md` describes the release, with a row in `logs-index.md`, and
`repository-state.md` carries the new version.

## Status

Done on the branches; waiting on review. #21 → #22 → #23 → #24 are stacked, and each targets
the branch below it. Nothing is merged. Merging needs the owner's separate yes, in order,
deleting each branch as it merges, then checking that `release/1.3.0` is an ancestor of
`master`.

Open findings for the owner: update `.agents/rules/repository.md` for TypeScript and the new
paths, and add `.agents/plans/` to `.gitignore`.
