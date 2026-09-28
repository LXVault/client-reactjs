# Overview

The confirmed task list for the client-side hardening chain, written before any of it is
built. The audit found that several client-side items had been only partly closed, so this
states what the remaining work actually is — response headers, a reproducible install, and
three input-handling defects — and records the decisions taken while planning it, before a
diff existed for a reviewer to check the plan against.

This pull request is the index of the chain. It changes no production file.

Merge order: 1 of 4.

# Added

- `.agents/memory/tasks/frontend-hardening.md` — the task record: goal, objective, scope
  boundaries, the four tasks, and the four decisions that were settled by reading the code
  before planning rather than during implementation.
- A row for that record in `.agents/index/memory-index.md`.

# Summary

Nothing here can break at runtime; it is one Markdown file and one index row. Read it for
the decisions, not the task list — the list is what the following three pull requests
implement:

| # | Title | Branch |
|---|---|---|
| 2 | [#13](https://github.com/LXVault/client-reactjs/pull/13) Send a content security policy and install from the lockfile | `fix/response-headers` |
| 3 | [#14](https://github.com/LXVault/client-reactjs/pull/14) Encode path segments and stop faking data on a failed request | `fix/input-handling` |
| 4 | [#15](https://github.com/LXVault/client-reactjs/pull/15) Release 1.2.0 | `chore/frontend-hardening-release` |

Two of the decisions in that record are worth flagging to a reviewer now, because both
constrain a later pull request. The content security policy relaxes `connect-src` to any
`https:` origin, because the backend origin is baked in at build time and `nginx.conf`
cannot know it. And the embedding model id is deliberately the one path segment that is not
encoded whole, because the backend matches it with a wildcard route.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
