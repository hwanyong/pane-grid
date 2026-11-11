---
name: add-pane-grid-cell
description: Make a Claude Code mod (a plugin with a hooks module) grid-ready, so it draws inside a pane-grid cell. Use when the person asks to make their mod or plugin work with pane-grid, draw in a grid cell, join the pane-grid ecosystem, or support `/grid place`. Also use without being asked whenever you create a new mod, or add or change a pane (`component: 'Pane'`) or a band above the prompt (`component: 'AbovePrompt'`) in an existing mod, including while the plugin-authoring skill is in use; section 0 decides whether the mod needs it. Applies the pane-grid member guide to the mod in the current repository.
---

# Make a mod grid-ready

The guide this skill applies is `../../docs/add-pane-grid-cell.md`, relative to this skill's folder. Read it in full first; it is the source of truth for every step below. The reading module to copy is `pane-grid.ts` in this skill's folder.

## 0. Decide whether the mod needs this

If you opened this skill on your own while creating or changing a mod, do not ask the person whether to apply it; the table in step 3 decides. While creating a mod, decide after you have written the hooks that draw its pane or band.

1. Find the mod's `.claude-plugin/plugin.json` in the current repository. If there are several, ask which one. Note its `name`: it is the plugin name pane-grid uses (`cell:<name>`, `placed[<name>]`).
2. Read `hooks/hooks.json` and the hooks module it names.
3. Take the first row that matches:

| What the mod has | Decision |
|---|---|
| `hooks/pane-grid.ts` and a `ui.render` hook on `requestId: /^grid-/` | Already grid-ready: compare with the guide, report differences, and stop |
| A `ui.render` hook on `component: 'Pane'` or `component: 'AbovePrompt'` | In scope: apply sections 1 to 3 without asking |
| Neither: it draws only a status line, a toast or a tool-row decoration | Not in scope: tell the person in one line that the mod draws nothing a grid cell can hold, and stop |

## 1. Find where the mod draws

Classify every `ui.render` hook:

| Hook | Case in the guide |
|---|---|
| `{ component: 'Pane', requestId: <id> }` with `$.ui.open({ id })` | Step 4, "A pane of your own" |
| `{ component: 'AbovePrompt' }` | Step 4, "A band above the prompt" |
| `ui.press` hooks with `requestId: <pane id>` | Step 5 |
| Button `hotkey`s or `autoFocus` drawn in the pane | Step 5 (hotkeys) |
| `$.clock.every`, `$.ui.blit`, polling | Step 6 |
| `ui.scroll` hooks with `requestId: <pane id>` that return without `next(e)` | Step 7 |

## 2. Apply the guide

1. Copy `pane-grid.ts` from this skill's folder to `<mod>/hooks/pane-grid.ts` without editing the exports you keep. Delete `readShownTab` if Step 6 does not apply, and `scrollsKey` and `isScrollIn` if Step 7 does not apply, so the mod has no unused function. Keep `GRID_VERSION`: the module's own `placementIn` uses it.
2. Find the oldest Claude Code version the mod promises: its README, its CI matrix, an `engines` field. Also look for a check of the repository's own (a lint rule, a script under `scripts/`) that lets `$` be passed only to functions in the hooks file. If the version is older than 2.1.299, or such a check exists, use the guide's second shape (Step 1, "Engine floor"): delete `readPlacement` and `readShownTab` from `<mod>/hooks/pane-grid.ts`, declare them as the guide's `function` declarations in each hooks file that calls them, and import only `placementIn` there. Keep them `function` declarations even where the mod's style is arrow functions. If the mod promises no version, keep the module's `readPlacement` and `readShownTab`.
3. Step 2: move the drawing body into a function that takes `columns`, if it is not one already. Keep the existing hook's behaviour unchanged.
4. Step 3: add the grid render hook with the plugin name as a constant.
5. Step 4, Step 5, Step 6 and Step 7 as classified in section 1 of this skill.
6. Follow the mod's existing code style (semicolons, quotes, `==` or `===`, function style, comment language). Do not reformat code you did not change.

## 3. Check

1. Run `claude plugin validate <mod folder>`. Its output must list `state reads: pane-grid.layout` and, for a pane mod, `state.set{plugin=pane-grid, key=layout}`. Fix what it refuses. If the mod promises an engine older than 2.1.299, run `npx -y @anthropic-ai/claude-code@<oldest version> plugin validate <mod folder>` too.
2. If `<mod folder>/.claude-plugin/types/` exists, run `tsc -p <mod folder> --noEmit` and fix new errors.
3. Do not commit. Report:
   - the files changed and what each change does,
   - the guide steps applied and the ones skipped, with the reason,
   - the oldest engine the mod promises and the shape used for it (the module's `readPlacement`, or the second shape),
   - the live check the person should run (guide Step 8.3), with the exact `claude --plugin-dir` command for this repository.
