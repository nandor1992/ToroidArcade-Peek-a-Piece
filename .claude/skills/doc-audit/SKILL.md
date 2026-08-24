---
name: doc-audit
description: Run the doc-drift-checker agent across all of docs/specs/ to find stale, orphaned, or missing design docs. Suited to running periodically (e.g. via /loop or a scheduled cron) as well as on demand.
---

1. Invoke the `doc-drift-checker` agent with no scope restriction — it
   already sweeps all of `docs/specs/`.
2. Present its report as-is (stale / orphaned / undocumented, grouped).
3. If the user wants drift fixed, don't do it inline — either invoke
   `spec-writer` per flagged file as an explicit follow-up step, or hand the
   list back to the user to decide priority. Silently "fixing" docs during
   an audit hides whether the audit itself is trustworthy.
