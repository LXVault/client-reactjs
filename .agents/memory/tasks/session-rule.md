---
name: memory-tasks-session-rule
description: Record of correcting the session rule after server-side logout made "logout clears the token" a false summary of what the code does.
---

# Task: the session rule after server-side logout

**Goal.** `.agents/rules/repository.md` § Session described the session accurately in every
detail except the one that matters most. It said a rejected token "is the logout path",
which was true when logout was a local `localStorage` clear and stopped being true when
#11 made logout issue a revocation. A rule that reads as though logging out is a local
operation is the kind of thing a future change builds on.

**Objective.** The rule states that logout is a server call, says what clearing local state
does and does not achieve, and does not overclaim in the other direction either.

**Detail.** Task 1 of 3 in this chain. This is a correction to an instruction file, reported
under the discovery protocol and applied because the user selected it. No application code
changes and no test is affected.

## Tasks

| # | Title | Scope | Repository | Branch | PR |
|---|---|---|---|---|---|
| 1 | Task record | this file | client-reactjs | `chore/session-rule-plan` | |
| 2 | Correct the session rule | `.agents/rules/repository.md` | client-reactjs | `docs/session-revocation` | |
| 3 | Close the record | the `PR` column above | client-reactjs | `chore/session-rule-release` | |

## Decisions

**A new `##` section rather than more bullets under `## Session`.** The file is organised
one `##` per subject — one API path, styling, session, demo fallback, coverage — and
"logout is a server call" is a subject with its own rules in it, not a third bullet about
tokens. Bolting it on would also have left the misleading sentence in place and merely
contradicted it further down.

**The order in `logout` is written into the rule.** It is the kind of detail that looks
incidental and is not: reversing it sends the revocation unauthenticated and gets a 401,
and a later reader "tidying" the async into a straight await would reintroduce a
user-visible wait. A rule that only says "logout is async" would not stop either.

**The httpOnly cookie is named as not done.** The rule would be read by whoever eventually
does that migration, and the reason it has not been attempted is not obvious from the code:
`requireAuth` on the backend reads only the `Authorization` header, so the client half
alone would be a no-op, and it needs CSRF protection with it.

**The rule does not claim logout fixes token theft, because it does not.** The token is
still in `localStorage` when the click happens, and anything that read it first had it
already. Stating the revocation's limit is what stops this correction from becoming the
overclaim the audit found in `mcp`.

### Task 1 — chore/session-rule-plan

The confirmed list, written before any of it is built. No production file, and no
instruction file, is touched by this task.

Reading the rule against the code it governs found that the finding and the fix are not the
same size. The reported problem was one stale sentence. Checking the rest of the file
against what #11 and #14 actually did found that § The demo fallback is stale in the same
way and for the same reason — it still says the fallback covers "an unreachable API", which
#14 changed to a *successful but empty* response, with failures now producing an error
banner. That is a **separate finding** and is not applied here: the protocol is one finding
per report and the user selects them, and it is not this one. It is reported at the end of
this chain instead.
