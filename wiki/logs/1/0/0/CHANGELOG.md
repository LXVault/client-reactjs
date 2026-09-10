# 1.0.0

Released 2026-09-10.

The web app as it stands, plus the agent instruction, knowledge and memory system.

## Added

* Login and register, with the session held in `AuthContext` and the JWT in
  `localStorage`.
* Dashboard listing every project the user owns or belongs to, with chunk and file counts,
  falling back to demo rows when the API cannot be reached.
* Project detail: title and summary editing, knowledge file upload and deletion, the
  project execution token, and the embedding model card.
* Members screen for adding and removing members and setting their role.
* Tokens screen listing every project token the user holds.
* Analysis screen with charts built on Recharts.
* Profile screen, including the card that sets and clears the user's own OpenRouter API
  key.
* A single fetch wrapper owning the base URL, the bearer token and error normalization, so
  no component talks to the backend directly.
* A production image: a static Vite build served by nginx with an SPA fallback.
* The agent instruction system: `AGENTS.md` as an entry point resolving the LXAgents shared
  set through the `lxagents-agents-base` connector, `.agents/` with indexes, local rules,
  agent knowledge and memory, and this `wiki/` tree.
* `README.md`, which the repository previously did not have.

## Changed

* `SKILLS.md` moved from the repository root to `.agents/skills/universal.md`, and the
  folder was registered in the agents index. Only `AGENTS.md`, `README.md` and `LICENSE`
  belong at the root, and `skills/` is an instruction folder like any other. Its body was
  filled in, since the original carried frontmatter with no title.
* `CLAUDE.md` moved to `.claude/CLAUDE.md`, which Claude Code treats as an equivalent
  project instruction location, so nothing about how it loads changes.
