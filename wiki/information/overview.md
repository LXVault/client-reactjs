# Overview

`mcp-rag-client` is the React and Vite web app for the MCP Server with Knowledge Base (RAG)
feature. It is where a person creates a knowledge base project, uploads the files it is
built from, decides who can see it, and issues the token an AI assistant uses to reach it.

It holds no business logic. Every fact it shows comes from the Express backend in
[`LXVault/server-expressjs`](https://github.com/LXVault/server-expressjs), and every write
goes back through the same API.

## Screens

| Route | Screen | What it does |
|---|---|---|
| `/login`, `/register` | Login, Register | Create an account or sign in. Both return a session token. |
| `/` | Dashboard | Every project the user owns or belongs to, with chunk and file counts. |
| `/documents/:id` | Project detail | Title and summary, knowledge file upload and deletion, and the project token. |
| `/documents/:id/members` | Members | Add and remove members, set their role, and manage the project's embedding model. |
| `/tokens` | Tokens | Every project token the user holds, in one place. |
| `/analysis` | Analysis | Charts over the projects the user can reach. |
| `/profile` | Profile | The account, and the user's OpenRouter API key. |

Every route except login and register is wrapped in `ProtectedRoute` and redirects to
`/login` without a session.

## Concepts

**Project.** A knowledge base with an owner, members, files and chunks. The API calls it a
document, and the routes say `/documents/:id`, because the backend table is named
`documents`. The UI says project. They are the same thing.

**Role.** `owner`, `admin`, `editor` or `viewer`. The owner and admins can change the
project, manage members, upload files and change the embedding model. Everyone with access
can read.

**File and chunk.** An uploaded `.md`, `.txt` or `.pdf` is the record of what the knowledge
base was built from. The backend splits its text into chunks, which are what search
returns. The dashboard shows both counts.

**Embedding model.** Chosen per project, as a provider-namespaced OpenRouter model id such
as `openai/text-embedding-3-small`, on the members screen. Only the owner and admins can
change it.

A chunk carries one vector per model, so the model a project *searches with* and the models
it *has vectors for* are different things. Changing the model deletes nothing: the previous
model's vectors are kept, so switching back is instant. Chunks with no vector for the newly
selected model are simply not searchable yet, which the card reports as coverage, and
generating them is a separate, explicit action because it spends the user's own OpenRouter
credits.

**Project token.** A per project execution token the user generates and pastes into their
MCP client. The backend traces every action the assistant takes back to the user who issued
it. A user holds at most one active token per project.

**OpenRouter key.** Each user supplies their own, on the profile screen. The app sends it
once and never reads it back; only the last four characters are ever displayed. Uploading,
searching and adding knowledge all spend the acting user's own credits, so an action taken
without a key comes back as a clear message rather than a generic failure.

## Demo mode

The dashboard and the analysis screen show example data when the API answers successfully
but has nothing yet, so a new account is not a set of empty boxes. The dashboard marks those
rows with a `demo` badge; the analysis screen shows a "Showing sample data" note above the
charts. Both say so in words as well as by appearance.

They appear **only** for an empty result. If a call fails, the screen shows an error banner
and no rows — an unreachable API and an empty account are different problems and should not
look the same. Nothing else in the app fabricates data.

Routes, component layout and the path to the backend:
[architecture.md](architecture.md).
