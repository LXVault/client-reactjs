# Overview

Releases the chain as 1.2.0, and in doing so fixes a version inconsistency this repository
has been carrying. It also closes the task record, including the pull request column, which
could not be filled until the pull requests existed.

Merge order: 4 of 4 — merges after #14 in `client-reactjs`.

# Added

- `wiki/logs/1/2/0/CHANGELOG.md` — the release. It covers more than this chain: PRs #10 and
  #11 merged before it began and carried no version claim of their own, so this is the first
  release to describe the loopback dev server, the dependency majors and server-side logout
  revocation.
- A row for 1.2.0 in `.agents/index/logs-index.md`, newest first.

# Modified

- `package.json` — `1.0.0` to `1.2.0`.
- `.agents/memory/state/repository-state.md` — the app version line now says 1.2.0. The
  shared instruction set version in the same file stays at 1.0.0; that is a different
  version and was deliberately left alone.
- `.agents/memory/tasks/frontend-hardening.md` — the task 4 entry, the `PR` column, and a
  status section.

# Summary

**1.1.0 was not available.** A minor was asked for and 1.1.0 was approved; checking the tree
first showed `wiki/logs/1/1/0/CHANGELOG.md` already there, committed as `2e661a5` on
2026-09-10. Writing this chain's log into that directory would have rewritten a released
version, which the changelog creator forbids. 1.2.0 was chosen instead.

**The manifest had drifted.** `package.json` said `1.0.0` while the logs were at `1.1.0` —
1.1.0 shipped without ever bumping it. This is the same two-sources-of-truth problem
reported for the `mcp` repository, found here on the way past. The manifest now agrees with
the logs.

**The record's status was corrected mid-task.** The first version of the status section said
every branch was pushed and every pull request open. Neither was true at the time it was
written — it had been copied from an older record in this repository. It now states the
actual position. A record that describes work as merged when it is not is worse than an empty
one.

The task record is closed except for the pull request numbers, which cannot be known before
the requests are opened. Those go in a memory-only commit after this merges.

`dependency-upgrade.md` stays open: PRs #10 and #11 are described in this release, but that
record's own release was never requested and this one does not stand in for it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
