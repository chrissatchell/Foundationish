---
name: sparse-view
description: Manually apply or refresh sparse-checkout so the working tree shows only the top-level directory matching the current (or a given) branch name. Use when the user says "/sparse-view", asks to sync sparse-checkout to the branch, or wants to narrow/reset their working tree view to match a branch/component directory.
---

# sparse-view

Applies the same directory-matching logic as the repo's `.githooks/post-checkout`
hook, but on demand — useful when the hook didn't fire (e.g. git config
`core.hooksPath` isn't set yet on this clone) or the user just wants to
re-sync the view without switching branches.

## Usage

- `/sparse-view` — match against the current branch name.
- `/sparse-view <name>` — match against an explicit directory/branch name instead.

## Steps

1. Determine the target name:
   - If the user passed an argument, use it verbatim.
   - Otherwise get the current branch: `git branch --show-current`.
2. Find a top-level tracked directory matching that name case-insensitively:
   `git ls-tree -d --name-only HEAD | grep -ix "<name>"`
3. If a match is found:
   ```bash
   git sparse-checkout init --cone
   git sparse-checkout set ".githooks" "<matched-dir>"
   ```
   `.githooks` must always stay in the cone alongside the matched directory —
   narrowing it away deletes `post-checkout` from disk, and git silently skips
   missing hooks, so no later checkout could ever undo the narrowing again.
   Report which directory is now the only one visible.
4. If no match is found:
   - If sparse-checkout is currently active (`.git/info/sparse-checkout` exists),
     disable it: `git sparse-checkout disable`, and tell the user the full tree
     is now showing since no directory matched "<name>".
   - List the available top-level directories (`git ls-tree -d --name-only HEAD`)
     so the user can see valid options.
5. Never run this against branches with uncommitted changes without checking
   `git status` first — sparse-checkout can hide, but does not discard, files;
   confirm with the user before proceeding if the working tree isn't clean and
   the change in view might be confusing.
