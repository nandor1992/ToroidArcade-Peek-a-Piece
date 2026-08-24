---
name: e2e-run
description: Run automated E2E UI tests for a named feature/spec (or all specs) by invoking the e2e-tester agent against the app's documented test scenarios. Requires Maestro CLI and a running simulator/emulator with a debug build installed.
---

1. Resolve the target spec(s): a named feature/screen/game maps to
   `docs/specs/.../Name.md` via the 1:1 mirror rule. If none named, ask
   which feature to test rather than running the entire suite by default —
   full sweeps are slow and should be explicit.
2. Before invoking `e2e-tester`, do a quick sanity check yourself: is
   `maestro` on PATH, is a simulator/emulator running? If not, report that
   clearly and stop — don't attempt to install tooling or start emulators
   as a side effect of a test run.
3. Invoke the `e2e-tester` agent for each target spec.
4. Summarize pass/fail across all run scenarios. On failure, surface the
   failing step and any screenshot/log path Maestro produced so the user
   can look at it directly.
