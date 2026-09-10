---
name: project-wiki-index
description: Index of wiki/, the human documentation tree for this frontend. Release logs are routed from logs-index instead.
---

# Project Wiki Index

**Scope:** `wiki/`, excluding `wiki/logs/`
**Parent:** [`root-index.md`](root-index.md)

## information

| File | Purpose |
|---|---|
| [`../../wiki/information/overview.md`](../../wiki/information/overview.md) | What the app is, the screens it has, and the concepts a newcomer needs before reading code. |
| [`../../wiki/information/architecture.md`](../../wiki/information/architecture.md) | Routes, component layout, how the session is held, and the one path to the backend. |

## environments

| File | Purpose |
|---|---|
| [`../../wiki/environments/setup.md`](../../wiki/environments/setup.md) | Running the dev server against a local backend, and verifying a change. |
| [`../../wiki/environments/env.md`](../../wiki/environments/env.md) | The build time variables, why they are baked in rather than read at runtime, and what breaks when they are wrong. |
| [`../../wiki/environments/docker.md`](../../wiki/environments/docker.md) | The two stage image, the build argument it needs, and why nginx does not proxy the API. |

## Maintenance

Any page added to or removed from `wiki/` is reflected in this table in the same commit.
`wiki/logs/` is owned by [`logs-index.md`](logs-index.md) and never listed here.
