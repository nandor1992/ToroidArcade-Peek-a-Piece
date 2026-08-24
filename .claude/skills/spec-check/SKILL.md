---
name: spec-check
description: Run the spec-bug-hunter agent against the files changed in the current diff (or an explicitly named spec/source path), checking implementation against its design doc. Use before committing, or periodically against the whole repo.
---

1. Determine scope:
   - If the user named a spec or source path, use that.
   - Otherwise, scope to the current diff: `git diff --name-only` (and
     `--staged` if relevant) filtered to files under `src/`.
   - If asked for a full sweep, scope to every file under `docs/specs/`
     (excluding `_TEMPLATE.md`).
2. For each file in scope, resolve its spec/source pair via the 1:1 mirror
   rule (`docs/README.md`) and invoke the `spec-bug-hunter` agent on it.
   - If a source file in scope has no matching spec, report that separately
     as "no spec to check against" rather than silently skipping it.
3. Collect findings across all files into one report, most severe first.
   Don't fix anything automatically — this skill is read-only, matching
   `spec-bug-hunter`'s scope. If the user wants fixes applied, say so
   explicitly and make the edits as a separate, visible step.
