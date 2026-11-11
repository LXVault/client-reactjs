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
| 1 | Task record | this file, `memory-index.md` | client-reactjs | `plan/typescript-migration` | |
| 2 | Dependency update | `package.json`, `package-lock.json` | client-reactjs | `build/dependency-update` | |
| 3 | TypeScript conversion | `src/**`, `vite.config.ts`, `tsconfig*.json`, `index.html`, scripts, docs naming the old paths | client-reactjs | `refactor/typescript` | |
| 4 | Release | version, `wiki/logs/`, `logs-index.md`, closing entry | client-reactjs | `release/1.3.0` | |

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
