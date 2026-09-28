---
name: memory-index
description: Index of .agents/memory/. Read every session, and load only the rows whose scope matches the current request.
---

# Memory Index

**Scope:** `.agents/memory/`
**Parent:** [`root-index.md`](root-index.md)

This index is the standing exception to the routing protocol: it is read every session,
because continuity depends on it. Load only the rows whose scope matches the request.

## state

| File | Purpose |
|---|---|
| [`../memory/state/repository-state.md`](../memory/state/repository-state.md) | Current known state of the repository: what exists, what does not, and the next obvious step. |

## tasks

| File | Purpose |
|---|---|
| [`../memory/tasks/embedding-matrix.md`](../memory/tasks/embedding-matrix.md) | Record of surfacing embedding coverage and backfill in the web app: goal, what landed, how it was verified, and the decisions taken. |
| [`../memory/tasks/dependency-upgrade.md`](../memory/tasks/dependency-upgrade.md) | Record of the dev-server exposure fix and the version upgrade: what each version went to, how the charts were verified in a real browser, and the three false alarms that check produced. |
| [`../memory/tasks/agents-setup.md`](../memory/tasks/agents-setup.md) | Record of the instruction system setup: goal, mode, what was created, and the decisions taken. |

## Maintenance

Any file added to or removed from `.agents/memory/` is reflected in this table in the same
commit as the change.
