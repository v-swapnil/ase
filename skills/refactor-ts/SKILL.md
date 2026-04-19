---
name: refactor-ts
description: Refactor TypeScript code for clarity or structure without changing behaviour.
when_to_use: When the user asks to clean up, rename, extract, simplify, or restructure existing TS/JS code without changing what it does.
tags: [refactor, typescript, cleanup]
---

# TypeScript Refactor

A refactor is **a behaviour-preserving transformation**. The test suite must be green
before and after.

## Procedure

1. **Run tests first.** Use `run_tests`. If they're already failing, this is a bug-fix
   task, not a refactor — switch skills.
2. **Inventory the change.** Use `grep` and `list_dir` to find every call site of the
   symbol or every file impacted. List them in your `thought` before editing.
3. **One transformation per pass.** Don't combine "extract function" with "rename" with
   "change signature" in a single edit. Make the change, run tests, then make the next.
4. **Prefer `apply_patch` over `write_file`** for surgical edits in existing files.
   Reserve `write_file` for new files.
5. **Update all call sites in the same task.** Do not leave the project in a state where
   half the codebase calls the old API and half calls the new.
6. **Run tests after each meaningful change.** If they go red, revert that single change
   and try a smaller step.
7. **Don't add new dependencies** unless the user explicitly asked.

## Specifically forbidden

- Changing observable behaviour ("while I was here, I also fixed…").
- Reformatting unrelated files.
- Removing comments that look outdated unless you've verified they are wrong.
- Tightening types in a way that changes runtime behaviour (e.g. swapping `==` for `===`
  silently).
