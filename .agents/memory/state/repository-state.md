---
name: memory-state-repository-state
description: Current known state of the mcp-rag-client frontend after the instruction system setup. Overwritten in place, always current.
---

# Repository State

## What exists

A working React and Vite single page app, version `1.0.0`, plain JavaScript with JSX, no
build step beyond Vite.

* Login and register, with the session held in `AuthContext` and the JWT in `localStorage`.
* Dashboard listing the user's projects with chunk and file counts.
* Project detail: title and summary editing, knowledge file upload and deletion, the
  project token, and the embedding model card.
* Members screen for adding and removing members and setting roles.
* Tokens screen listing every project token the user holds.
* Analysis screen with charts built on Recharts.
* Profile screen, including the OpenRouter key card.

## Stack

React 19, React Router 7, Recharts 3, Vite 8. One hand written stylesheet in
`src/index.css`, no CSS framework and no component library. Production is a static build
served by nginx from a two stage image.

## Shared instruction set

Mode B consumer. The shared set is resolved through the `lxagents-agents-base` MCP
connector, adopted version `1.0.0`. Nothing from it is copied into this repository.

## What is not built

* No test suite, no linter configuration, no CI workflow.
* No runtime configuration: `VITE_API_URL` is inlined at build time.
* No pagination anywhere; every list renders whatever the API returns.

## Embedding model handling

Resolved in `1.1.0`, against the backend change of the same version.
`EmbeddingModelCard`, rendered on the members screen, now shows a coverage bar and how many
chunks are embedded with the selected model, offers a backfill button when any are pending,
and lists every model the project already holds vectors for with a remove action for the
ones not in use. Its copy says plainly that changing the model deletes nothing.

Verified in Chromium against a live backend and database: 13 checks covering the switch,
the pending state, backfill to completion, both models holding vectors at once, switching
back with no backfill offered, and the card not overflowing at 390px.

## Next obvious step

Nothing outstanding on the embedding model. The page already overflows horizontally at
phone width because of the navbar and the members table, which predates this work and is
reported as a finding rather than fixed here.
