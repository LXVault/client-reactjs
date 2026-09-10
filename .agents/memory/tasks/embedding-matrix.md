---
name: memory-tasks-embedding-matrix
description: Record of surfacing embedding coverage and backfill in the web app, so a model change reads as reversible rather than destructive.
---

# Task: embedding matrix

**Goal.** The embedding model card told the user a model change "applies to newly added
knowledge". That understated it: with one vector per chunk, switching model made the whole
knowledge base unsearchable. The backend now keeps a vector per model, so the card has to
say what is actually true and give the user the one action that closes the gap.

**Objective.** The card reports how much of the knowledge base the selected model can
search, offers to embed what is missing, and shows the models already covered so a switch
reads as reversible.

**Detail.** This is task 2 of three. It depends on the backend change in
`LXVault/server-expressjs` landing first, since it consumes the coverage payload that
change introduced. No new dependency, no framework, and new classes go in
`src/index.css` beside their relatives.

## Tasks

| # | Title | Scope | Repository | Branch | PR |
|---|---|---|---|---|---|
| 1 | Schema split, migration, coverage and backfill | The table, the migration, search, ingestion, the API | server-expressjs | `feat/embedding-matrix` | |
| 2 | Coverage and backfill in the web app | The embedding model card and its API methods | client-reactjs | `feat/embedding-matrix` | |
| 3 | Tool descriptions that explain coverage | `get_project` and `search_knowledge` wording, the tool reference | mcp | `feat/embedding-matrix` | |

### Task 2 — feat/embedding-matrix

Landed:

* `src/api/client.js`: `backfillEmbeddings` and `deleteModelEmbeddings`.
* `src/components/EmbeddingModelCard.jsx`: a coverage bar and count, a backfill button that
  appears only when chunks are pending, the list of models with stored embeddings including
  an in-use badge and a remove action, and corrected copy. One `apply` function handles the
  payload from all four endpoints, so no action needs a second round trip.
* `src/index.css`: `coverage-bar`, `coverage-bar-fill`, `model-list` and `model-name`.
* Corrected `wiki/information/overview.md`, which said the embedding model lives on the
  project detail screen. It is on the members screen. The error was found by opening the
  page, not by reading the code.

Verified in Chromium against a live backend and a real database with pgvector, 13 checks
passing: the covered state offers no backfill; a switch reports pending work and says
nothing was deleted; the previous model keeps its vectors; backfill runs to completion and
reports what it embedded; both models hold vectors at once; switching back offers no
backfill at all; the card does not overflow at 390px; no uncaught page errors.

Depends on: task 1.

## Decisions

* **Backfill loops in the client.** The backend batches at 100 chunks and reports what is
  pending, so the card keeps calling while a batch makes progress and stops when one embeds
  nothing. That covers a large project without a request that never returns, and cannot
  spin forever on a chunk that will not embed.
* **Removing a model is offered, never automatic.** It is the only action that discards a
  vector, so it sits behind an explicit control and is hidden for the model in use.
* **The phone-width overflow was left alone.** Measured before and after this change: the
  page scroll width is identical, and the offending elements are the navbar and the members
  table, neither touched here. Reported as a finding instead of widening this task.
