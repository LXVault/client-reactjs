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

React 18, React Router 6, Recharts, Vite 5. One hand written stylesheet in
`src/index.css`, no CSS framework and no component library. Production is a static build
served by nginx from a two stage image.

## Shared instruction set

Mode B consumer. The shared set is resolved through the `lxagents-agents-base` MCP
connector, adopted version `1.0.0`. Nothing from it is copied into this repository.

## What is not built

* No test suite, no linter configuration, no CI workflow.
* No runtime configuration: `VITE_API_URL` is inlined at build time.
* No pagination anywhere; every list renders whatever the API returns.

## Known limitation being worked on

`EmbeddingModelCard` tells the user that changing the model "applies to newly added
knowledge", which understates what happens. The backend stores one embedding per chunk and
search matches on an exact model name, so switching the model makes the whole existing
knowledge base unsearchable until it is deleted and re-uploaded. The card shows no coverage
information and offers no way to re-embed.

## Next obvious step

Once the backend keys embeddings on `(chunk_id, model_name)`, surface coverage on the card
and add an action that embeds the chunks missing a vector for the selected model.
