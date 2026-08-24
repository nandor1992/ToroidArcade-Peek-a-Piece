---
name: new-component
description: Scaffold a new src/ file (component, screen, game module, service, or hook) together with its matching docs/specs/ design doc from the template, in one step. Use when starting any new piece of FamilyPuzzles functionality.
---

Given a description of what's being built and its kind (component / screen /
game / service / hook), and where it belongs under `src/`:

1. Determine the source path following the existing structure in
   `docs/architecture.md` / `CLAUDE.md` (e.g. a new game goes under
   `src/games/<name>/`, a shared UI piece under `src/components/`).
2. Create the source file with a minimal working skeleton (proper RN/TS
   imports, an exported component/function matching the stated kind — no
   speculative props or logic beyond what was asked for).
3. Invoke the `spec-writer` agent (or follow its instructions directly) to
   create the matching `docs/specs/...md` from `docs/specs/_TEMPLATE.md`,
   filling in `Purpose` and `Interface` from what's known now, and marking
   `Edge cases`, `Test scenarios`, and `Toddler UX constraints` as TODO
   where the behavior isn't decided yet — don't invent behavior to fill
   sections.
4. Confirm both files exist at their mirrored paths and report them.

Do not scaffold a test file speculatively — add `Foo.test.tsx` co-located
with the source once there's real behavior to test.
