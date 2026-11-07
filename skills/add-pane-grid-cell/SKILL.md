---
name: add-pane-grid-cell
description: Make a Claude Code mod (a plugin with a hooks module) grid-ready, so it draws inside a pane-grid cell. Use when the person asks to make their mod or plugin work with pane-grid, draw in a grid cell, join the pane-grid ecosystem, or support `/grid place`. Applies the pane-grid member guide to the mod in the current repository.
---

# Make a mod grid-ready

The guide this skill applies is `../../docs/add-pane-grid-cell.md`, relative to this skill's folder. Read it in full first; it is the source of truth for every step below. The reading module to copy is `pane-grid.ts` in this skill's folder.

## 1. Find the mod

1. Find the mod's `.claude-plugin/plugin.json` in the current repository. If there are several, ask which one. Note its `name`: it is the plugin name pane-grid uses (`cell:<name>`, `placed[<name>]`).
2. Read `hooks/hooks.json` and the hooks module it names.
3. If `hooks/pane-grid.ts` already exists and a `ui.render` hook on `requestId: /^grid-/` is there, the mod is already grid-ready: compare with the guide, report differences, and stop.

## 2. Find where the mod draws

Classify every `ui.render` hook:

| Hook | Case in the guide |
|---|---|
| `{ component: 'Pane', requestId: <id> }` with `$.ui.open({ id })` | Step 4, "A pane of your own" |
| `{ component: 'AbovePrompt' }` | Step 4, "A band above the prompt" |
| `ui.press` hooks with `requestId: <pane id>` | Step 5 |
| `$.clock.every`, `$.ui.blit`, polling | Step 6 |
| `ui.scroll` hooks with `requestId: <pane id>` that return without `next(e)` | Step 7 |

A mod that draws in neither a pane nor a band (a status line, a toast, a tool-row decoration) has nothing to put in a cell. Tell the person and stop.

## 3. Apply the guide

1. Copy `pane-grid.ts` from this skill's folder to `<mod>/hooks/pane-grid.ts` unchanged. Delete `readShownTab` if Step 6 does not apply, and `scrollsKey` and `isScrollIn` if Step 7 does not apply, so the mod has no unused export.
2. Step 2: move the drawing body into a function that takes `columns`, if it is not one already. Keep the existing hook's behaviour unchanged.
3. Step 3: add the grid render hook with the plugin name as a constant.
4. Step 4, Step 5, Step 6 and Step 7 as classified in section 2 of this skill.
5. Follow the mod's existing code style (semicolons, quotes, `==` or `===`, function style, comment language). Do not reformat code you did not change.

## 4. Check

1. Run `claude plugin validate <mod folder>`. Its output must list `state reads: pane-grid.layout` and, for a pane mod, `state.set{plugin=pane-grid, key=layout}`. Fix what it refuses.
2. If `<mod folder>/.claude-plugin/types/` exists, run `tsc -p <mod folder> --noEmit` and fix new errors.
3. Do not commit. Report:
   - the files changed and what each change does,
   - the guide steps applied and the ones skipped, with the reason,
   - the live check the person should run (guide Step 8.3), with the exact `claude --plugin-dir` command for this repository.
