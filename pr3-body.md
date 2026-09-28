# Overview

Three input-handling defects. Path segments interpolated into API URLs came straight from
whatever the server returned, so a value containing a slash could change which endpoint a
request reached. The dashboard and the analysis screen both substituted their sample fixtures
in the **error** branch, so an unreachable API rendered three demo projects and a plausible
set of charts for an account that has neither. And a copied project token was left in the
clipboard indefinitely.

Merge order: 3 of 4 — merges after #13 in `client-reactjs`.

# Added

- `src/api/client.js` — `seg()`, applied to every interpolated path segment, and `modelSeg()`,
  which encodes the parts of an embedding model id and rejoins them with the slash intact.
- `src/pages/Tokens.jsx` — a copied token is cleared from the clipboard after 30 seconds, and
  a line under the copy button saying so.
- `wiki/environments/setup.md` — the verification section rewritten. It told the reader that
  seeing demo rows means the API is unreachable, which is the exact inverse of what this
  change makes them mean.
- `wiki/information/overview.md` and `.agents/wiki/context/repository-map.md` — corrected to
  say which component marks sample data how: the dashboard with a `demo` badge, the analysis
  screen with a "Showing sample data" notice.

# Modified

- `src/api/client.js` — thirteen call sites now encode: `getDocument`, `updateDocument`,
  `listMembers`, `addMember`, `removeMember`, the three project-token calls, the two
  embedding-model calls, `backfillEmbeddings`, `listFiles` and `deleteFile`.
- `src/pages/Analysis.jsx` — the `catch` branch no longer sets the fixture. The early return
  also had to change: it tested `!data` before `error`, so a failed load would have shown
  "No analysis data." and never reached the error banner — the failure made invisible, which
  is the same defect one layer down.
- `src/pages/Dashboard.jsx` — the `catch` branch sets `[]` rather than the fixture, because
  the totals below call `.reduce` on the list.
- `src/pages/Tokens.jsx` — the token is captured into a local when the copy happens rather
  than read from state when the timer fires, since the dialog can be closed and reopened for
  a different project inside that window.

# Summary

Verified in a real browser, not by reading the diff. **17/17** on the encoding, driving the
actual `api` object against a capturing fetch: thirteen call sites encode a hostile id
(`../../tokens` arriving as `..%2F..%2Ftokens`), the model arrives as
`openai/text-embedding-3-small` with no `%2F` in it, and a control confirms an ordinary id
like `abc-123` passes through untouched — so the assertions cannot pass by encoding
indiscriminately. Reading the source could not have proved this; it shows which call sites
changed, not that none was missed.

**12/12** across four scenarios for the sample-data change: the dashboard and the analysis
screen, each against a rejected and an empty response. The empty cases are the control and
are why the run means anything — if sample data had stopped appearing entirely, the error
cases would still have passed. It still appears, on exactly the condition intended.

Not verified: the clipboard behaviour was not run in a browser. It needs clipboard
permission, and a check that grants it would be testing the grant rather than the code. Both
failure paths — `writeText` throwing, and `readText` being refused — are caught and leave the
token in place rather than throwing inside a timer. That is the contained direction, but it
is reasoning, not a measurement.

Risk to watch: this removes data users may have been reading as real. Someone who had the
API down will now see an empty list and an error banner instead of three projects. That is
the fix, and the release notes say so.

Follows #13. Next is #15, the release.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
