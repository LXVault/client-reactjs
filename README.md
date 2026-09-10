# mcp-rag-client

React and Vite web app for the MCP Server with Knowledge Base (RAG) feature. It is where a
person creates a knowledge base project, uploads the files it is built from, decides who
can see it, and issues the token an AI assistant uses to reach it.

It holds no business logic of its own. Every fact it shows comes from the Express backend
in [`LXVault/server-expressjs`](https://github.com/LXVault/server-expressjs), and the token
issued here is what the MCP server in [`LXVault/mcp`](https://github.com/LXVault/mcp)
presents.

## Features

* Accounts and sessions, with the JWT held in the browser.
* Projects with members, roles, and per project execution tokens.
* Knowledge file upload for `.md`, `.txt` and `.pdf`, with per file chunk counts.
* Per project embedding model selection for the owner and admins.
* The user's own OpenRouter API key, sent once and never read back.
* Usage charts across every project the user can reach.

## Quick start

```
npm install
npm run dev
```

The dev server runs on port `5173` and proxies `/api` to `http://localhost:4000`, so a
locally running backend needs no configuration and no `.env` file. Without a backend the
dashboard and analysis screens show demo rows, marked with a `demo` badge.

## Documentation

* [Overview](wiki/information/overview.md), the screens and the concepts behind them.
* [Architecture](wiki/information/architecture.md), routing, the session, and the one path
  to the backend.
* [Local setup](wiki/environments/setup.md), running, building and verifying.
* [Environment variables](wiki/environments/env.md), including why `VITE_API_URL` is baked
  in at build time.

The full documentation map is
[`.agents/index/project-wiki-index.md`](.agents/index/project-wiki-index.md).

## Working with agents

Agent instructions start at [`AGENTS.md`](AGENTS.md). Shared conventions come from the
LXAgents instruction set served by the `lxagents-agents-base` MCP connector; this
repository carries only what is its own.

## License

MIT. See [`LICENSE`](LICENSE).
