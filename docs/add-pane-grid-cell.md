# Make your Claude Code mod draw in a pane-grid cell

This guide shows how to make a Claude Code mod (a plugin with a hooks module) draw inside a cell of a [pane-grid](../README.md) layout. A mod that follows it is called **grid-ready** in this repository. The steps were taken from the three mods that already follow it: [usage-gauge](https://github.com/hwanyong/usage-gauge), [uhd-kanban](https://github.com/hwanyong/skill-kanban) and [pending-questions](https://github.com/hwanyong/pending-questions).

You can do every step by hand, or let Claude do them: with pane-grid installed, run `/pane-grid:add-pane-grid-cell` in a Claude Code session opened in your mod's repository. The skill reads this guide and applies it to your code. See [Use the skill](#use-the-skill).

## Contents

- [What does pane-grid expect from a mod?](#what-does-pane-grid-expect-from-a-mod)
- [What does pane-grid publish?](#what-does-pane-grid-publish)
- [Step 1: copy the reading module](#step-1-copy-the-reading-module)
- [Step 2: draw with a width argument](#step-2-draw-with-a-width-argument)
- [Step 3: add the grid render hook](#step-3-add-the-grid-render-hook)
- [Step 4: leave your own pane or band while placed](#step-4-leave-your-own-pane-or-band-while-placed)
- [Step 5: accept Button presses from the grid pane](#step-5-accept-button-presses-from-the-grid-pane)
- [Step 6: stop timers while the grid tab is hidden (optional)](#step-6-stop-timers-while-the-grid-tab-is-hidden-optional)
- [Step 7: check it](#step-7-check-it)
- [Use the skill](#use-the-skill)
- [FAQ](#faq)

## What does pane-grid expect from a mod?

pane-grid opens one engine pane per layout, with the id `grid-<layout name>`, and draws a tree of cells in it. It does not draw your mod. Your mod draws its own content, and pane-grid moves that content into the cell.

| Rule | What your mod does |
|---|---|
| Hook | A `ui.render` hook on `{ component: 'Pane', requestId: /^grid-/ }` |
| Placement | Reads pane-grid's `layout` state and finds its own entry in `placed`. No entry, or an entry for another grid pane: return `next(e)` unchanged |
| Content | Appends one `Box` with the key `cell:<plugin name>` to the result of `next(e)`. The plugin name is the `name` in your `.claude-plugin/plugin.json` |
| Width | Draws that Box `placement.columns` wide. The value is 0 until pane-grid has measured the pane; fall back to `e.props.bodyColumns` |
| One place | While it has a cell, it does not draw in its own pane or band. It goes back there when the cell is emptied |
| Read only | It never writes pane-grid's state. `$.state` lets only the owner write |

Without pane-grid installed, the `layout` read is `undefined` and your mod behaves as before. pane-grid is an optional companion, not a dependency.

pane-grid lists a mod in an empty cell's choices when the mod's `ui.render` hook runs for the grid pane. A grid-ready mod's hook runs on every grid render (it returns `next(e)` when it has no cell), so it shows up in the list without any registration.

## What does pane-grid publish?

Two values in `$.state`, owned by the plugin `pane-grid`.

| Key | Type | Meaning |
|---|---|---|
| `layout` | `{ version: 1, revision, tabs, placed }` | `placed` maps a plugin name to `{ tab, requestId, cell, columns, rows }`. `requestId` is the grid pane id, `columns` and `rows` are the cell's inner size |
| `shown` | `string \| null` | The name of the grid layout on screen; `null` when no grid pane is shown |

The values are declared in pane-grid's own contract (`types/index.d.ts`), which your mod does not import. The reading module in Step 1 reads them as `unknown` and checks them at run time.

## Step 1: copy the reading module

Copy [`skills/add-pane-grid-cell/pane-grid.ts`](../skills/add-pane-grid-cell/pane-grid.ts) to `hooks/pane-grid.ts` in your mod, unchanged. It exports three functions.

| Function | Use |
|---|---|
| `placementIn(layout, plugin)` | Finds your cell in a layout value. Pure; use it on a `state.set` hook's `value` and `previous` |
| `readPlacement($, plugin)` | Reads the current layout and finds your cell. Called while drawing, it makes the drawing redraw when the layout changes |
| `readShownTab($)` | Reads `shown`. Only Step 6 needs it; delete it if you skip Step 6 |

`readPlacement` and `readShownTab` are `function` declarations on purpose. `claude plugin validate` follows `$` across an import only through function declarations.

## Step 2: draw with a width argument

Your pane or band hook probably draws with `e.props.bodyColumns`. Move the body into a function that takes the width, so the pane hook and the grid hook call the same code.

```tsx
// before
on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
  const { Box, Text } = $.ui.resolve(e)
  return <Box>{/* uses e.props.bodyColumns */}</Box>
})

// after
type Resolvable = Parameters<EngineInterface['ui']['resolve']>[0]

const drawBoard = async ($: EngineInterface, e: Resolvable, columns: number) => {
  const { Box, Text } = $.ui.resolve(e)
  return <Box>{/* uses columns */}</Box>
}
on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => drawBoard($, e, e.props.bodyColumns))
```

`Resolvable` is the argument type of `$.ui.resolve`, which both hooks' `e` satisfies. If the drawing keeps per-pane state (an animation, a scroll offset), key it by the `requestId` you draw for, because the grid pane and your own pane have different ids.

## Step 3: add the grid render hook

```tsx
import { readPlacement } from './pane-grid'

const PLUGIN = 'your-mod' // the name in .claude-plugin/plugin.json

on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
  const placement = await readPlacement($, PLUGIN)
  if (!placement || placement.requestId != e.requestId) return next(e)
  const below = await next(e)
  const { Box } = $.ui.resolve(e)
  const columns = placement.columns > 0 ? placement.columns : e.props.bodyColumns
  return (
    <Box flexDirection="column">
      {below}
      <Box key={`cell:${PLUGIN}`} flexDirection="column">
        {await drawBoard($, e, columns)}
      </Box>
    </Box>
  )
})
```

Keep `{below}` in the tree: other grid-ready mods draw their cells beneath yours, and pane-grid collects every `cell:` Box from the whole tree.

## Step 4: leave your own pane or band while placed

Pick the case that matches where your mod draws today.

**A band above the prompt** (`component: 'AbovePrompt'`): return early while placed. The band redraws by itself when the cell is emptied, because the hook read the layout.

```tsx
on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
  if (await readPlacement($, PLUGIN)) return next(e)
  // draw the band as before
})
```

**A pane of your own** (`$.ui.open`): do not open it while placed, close it when a cell appears, and open it again only when the cell is removed.

```tsx
import type { StateWrite } from 'claude-code'
import { placementIn, readPlacement } from './pane-grid'

const openPane = async ($: EngineInterface) => {
  if (await readPlacement($, PLUGIN)) return
  await $.ui.open({ id: PANE, title: TITLE })
}

// Opens the pane again only when the cell was removed, so a pane the person closed stays closed.
const placeOwnPane = async ($: EngineInterface, layout: unknown, previous: unknown) => {
  const isPlaced = placementIn(layout, PLUGIN) != undefined
  const isOpen = (await $.ui.panes()).some(pane => pane.id == PANE)
  if (isPlaced && isOpen) return $.ui.close({ id: PANE })
  if (isPlaced || isOpen || placementIn(previous, PLUGIN) == undefined) return
  await $.ui.open({ id: PANE, title: TITLE })
}

on('state.set', { plugin: 'pane-grid' as never, key: 'layout' as never }, async ($, e, next) => {
  const write = e as StateWrite
  const result = await next(e)
  await placeOwnPane($, write.value, write.previous)
  return result
})
```

Two details in the `state.set` hook come from the engine's checks:

- The matcher values are literals. `claude plugin validate` refuses a `$.state` reference constant exported from another file, so the hook cannot reuse the constant in `hooks/pane-grid.ts`.
- The values are passed `as never` and `e` is read as `StateWrite`. pane-grid's values are not in your mod's contract, so the engine types refuse the matcher otherwise; `StateWrite` is the type the engine gives a write of an undeclared value.

If your mod has a slash command that opens its pane, check `readPlacement` there too and tell the person where the content is drawn.

## Step 5: accept Button presses from the grid pane

A `ui.press` hook with `requestId: PANE` does not match a Button drawn in the grid pane. List both ids:

```tsx
on('ui.press', { plugin: PLUGIN, component: 'Pane', requestId: [PANE, /^grid-/], element: /^q\d+$/ }, async ($, e) => {
  // handle the press as before
})
```

Button `hotkey`s inside a cell work while the grid pane has focus. pane-grid's toolbar uses the letters `v s o z x w b c k q` and the digits `1`-`9` in the active empty cell, so prefer other keys.

## Step 6: stop timers while the grid tab is hidden (optional)

Skip this step if your mod draws only from state. The engine redraws a hidden pane when it is shown again if the state it read has changed.

A mod that runs a timer (an animation, `$.ui.blit`, polling) should stop it while its grid layout is not on screen. pane-grid writes `shown` when the visible grid tab changes:

```tsx
import { readPlacement, readShownTab } from './pane-grid'

on('state.set', { plugin: 'pane-grid' as never, key: 'shown' as never }, async ($, e, next) => {
  const write = e as StateWrite
  const result = await next(e)
  const placement = await readPlacement($, PLUGIN)
  const isShown = placement != undefined && write.value == placement.tab
  // stop the timer when !isShown, start it again and call $.ui.invalidate('ui.render') when isShown
  return result
})
```

`readShownTab($)` gives the same value outside a `state.set` hook, for example inside the timer callback.

## Step 7: check it

1. `claude plugin validate <your mod>`: the output lists `state reads: pane-grid.layout` and the `state.set{plugin=pane-grid, key=layout}` hook.
2. Type-check: `tsc -p <your mod> --noEmit` once the engine has written `.claude-plugin/types/`.
3. Run a session with both plugins:

   ```sh
   claude --plugin-dir <path to pane-grid> --plugin-dir <path to your mod>
   ```

   Keep pane-grid first. pane-grid collects the `cell:` Boxes from what the hooks below it return, so a mod that loads before pane-grid draws its Box after the grid is drawn, and its cell reads `<plugin> is not loaded after pane-grid`. Installed plugins load in the order of the `enabledPlugins` keys in `~/.claude/settings.json`.

   Then, in that session:

   | Do | Expect |
   |---|---|
   | `/grid split -h` | A new empty cell lists your mod among its choices |
   | Press its digit, or `/grid place <your mod>` | Your content in the cell; your own pane or band is gone |
   | `/grid resize 30` | Your content redraws at the new width |
   | `/grid place -` | Your own pane or band is back |
   | Run without pane-grid | Your mod behaves as before |

   Start Claude Code with `--debug` to read hook failures: a hook whose tree the engine refused is logged as `<plugin>: ui.render hook skipped: …`.

## Use the skill

pane-grid ships a skill that applies this guide to a mod.

1. Install pane-grid (see the [README](../README.md#how-do-i-install-it)).
2. Open Claude Code in your mod's repository.
3. Run `/pane-grid:add-pane-grid-cell`, or ask "make this mod grid-ready".

The skill copies the reading module, finds where your mod draws, applies Steps 2 to 6 that match it, runs `claude plugin validate`, and lists what it changed and what you should check in a live session (Step 7.3). It does not commit.

## FAQ

### Does my mod need pane-grid installed to work?

No. Every pane-grid read returns `undefined` without it, and the hooks of Steps 3 to 6 then return `next(e)` or do nothing.

### Can my mod be in two cells at once?

No. pane-grid keeps one cell per mod. Placing a mod in a second cell empties the first.

### Why a `Box` key instead of a component or a registration call?

The engine has no call that lets one mod draw inside another mod's pane. Every `ui.render` hook on the grid pane sees the same tree, so a keyed `Box` is the one thing both sides can find without importing each other.

### My mod hooks every `ui.render` without a matcher. Will it show up in empty cells?

Yes. pane-grid lists every installed mod whose `ui.render` hook runs for the grid pane. Placing a mod that draws no `cell:` Box shows `<plugin> draws nothing here` in the cell.
