# Make your Claude Code mod draw in a pane-grid cell

This guide shows how to make a Claude Code mod (a plugin with a hooks module) draw inside a cell of a [pane-grid](../README.md) layout. A mod that follows it is called **grid-ready** in this repository. The steps were taken from the mods that already follow it: [usage-gauge](https://github.com/hwanyong/usage-gauge), [uhd-kanban](https://github.com/hwanyong/skill-kanban), [pending-questions](https://github.com/hwanyong/pending-questions) and [filetree](https://github.com/hwanyong/claude-code-filetree/tree/pane-grid-cell).

You can do every step by hand, or let Claude do them: paste the prompt in [Use the skill](#use-the-skill), which names `https://github.com/hwanyong/pane-grid`, into a Claude Code session opened in your mod's repository. The skill reads this guide and applies it to your code.

## Contents

- [What does pane-grid expect from a mod?](#what-does-pane-grid-expect-from-a-mod)
- [What does pane-grid publish?](#what-does-pane-grid-publish)
- [Step 1: copy the reading module](#step-1-copy-the-reading-module)
- [Step 2: draw with a width argument](#step-2-draw-with-a-width-argument)
- [Step 3: add the grid render hook](#step-3-add-the-grid-render-hook)
- [Step 4: leave your own pane or band while placed](#step-4-leave-your-own-pane-or-band-while-placed)
- [Step 5: accept Button presses from the grid pane](#step-5-accept-button-presses-from-the-grid-pane)
- [Step 6: stop timers while the grid tab is hidden (optional)](#step-6-stop-timers-while-the-grid-tab-is-hidden-optional)
- [Step 7: scroll your own rows in the cell (optional)](#step-7-scroll-your-own-rows-in-the-cell-optional)
- [Step 8: check it](#step-8-check-it)
- [Use the skill](#use-the-skill)
- [FAQ](#faq)

## What does pane-grid expect from a mod?

pane-grid opens one engine pane per layout, with the id `grid-<layout name>`, and draws a tree of cells in it. It does not draw your mod. Your mod draws its own content, and pane-grid moves that content into the cell.

| Rule | What your mod does |
|---|---|
| Hook | A `ui.render` hook on `{ component: 'Pane', requestId: /^grid-/ }` |
| Placement | Reads pane-grid's `layout` state and finds its own entry in `placed`. No entry, or an entry for another grid pane: return `next(e)` unchanged |
| Content | Draws one `Box` with the key `cell:<plugin name>`. `fillSlot` puts it into the slot pane-grid drew for your mod; when there is no slot, your mod appends it after the result of `next(e)`. The plugin name is the `name` in your `.claude-plugin/plugin.json` |
| Choice | Calls `offerChoice` on the result of `next(e)`, so empty cells list your mod |
| Width | Draws that Box `placement.columns` wide. The value is 0 until pane-grid has measured the pane; fall back to `e.props.bodyColumns` |
| One place | While it has a cell, it does not draw in its own pane or band. It goes back there when the cell is emptied |
| Read only | It never writes pane-grid's state. `$.state` lets only the owner write |

Without pane-grid installed, the `layout` read is `undefined` and your mod behaves as before. pane-grid is an optional companion, not a dependency.

Load order does not matter. When your mod loads after pane-grid, pane-grid finds your hook in `next.trace` of the grid render and lists your mod in empty cells; it takes your `cell:` Box from the tree. When your mod loads before pane-grid, `next(e)` already holds pane-grid's grid: `offerChoice` adds your Button to each empty cell's `choices:<cell>` Box, and `fillSlot` puts your cell into the `slot:<plugin name>` Box. Either way your hook runs on every grid render, so no registration is needed.

## What does pane-grid publish?

Two values in `$.state`, owned by the plugin `pane-grid`.

| Key | Type | Meaning |
|---|---|---|
| `layout` | `{ version: 1, revision, tabs, placed }` | `placed` maps a plugin name to `{ tab, requestId, cell, column, row, columns, rows, isActive }`. `requestId` is the grid pane id, `columns` and `rows` are the cell's inner size, `column` and `row` its top left in the grid pane's body (0.4.0), `isActive` whether it is the active or zoomed cell (0.4.0) |
| `shown` | `string \| null` | The name of the grid layout on screen; `null` when no grid pane is shown |

The values are declared in pane-grid's own contract (`types/index.d.ts`), which your mod does not import. The reading module in Step 1 reads them as `unknown` and checks them at run time.

## Step 1: copy the reading module

Copy [`skills/add-pane-grid-cell/pane-grid.ts`](../skills/add-pane-grid-cell/pane-grid.ts) to `hooks/pane-grid.ts` in your mod. Do not edit the exports you keep; delete only the ones the table below says you may delete. It exports seven functions and eight constants.

| Export | Use |
|---|---|
| `placementIn(layout, plugin)` | Finds your cell in a layout value. Pure; use it on a `state.set` hook's `value` and `previous` |
| `readPlacement($, plugin)` | Reads the current layout and finds your cell. Called while drawing, it makes the drawing redraw when the layout changes. Needs Claude Code 2.1.299 or later; delete it if your mod supports an older engine ([Engine floor](#engine-floor-claude-code-21299)) |
| `readShownTab($)` | Reads `shown`. Only Step 6 needs it; delete it if you skip Step 6. Needs Claude Code 2.1.299 or later, as `readPlacement` does |
| `offerChoice(below, plugin, placement, makeButton)` | Adds your Button, made by `makeButton`, to each empty cell's choices in `below`. Returns `below` unchanged when it holds no choices |
| `fillSlot(below, plugin, cell)` | Puts `cell` into your slot in `below`. Returns `undefined` when `below` holds no slot |
| `scrollsKey(plugin)` | The key of the Box that tells pane-grid your mod scrolls its own rows. Only Step 7 needs it; delete it if you skip Step 7 |
| `isScrollIn(placement, e)` | Whether a `ui.scroll` on a grid pane is for your cell. Only Step 7 needs it; delete it if you skip Step 7 |
| `TOOLBAR_KEYS` | The letters of pane-grid's toolbar hotkeys. Only Step 5 needs it, when your cell draws Button `hotkey`s; delete it otherwise |
| `GRID_VERSION` | The layout format's version. pane-grid writes its layout value from this constant. `placementIn` uses it, so keep it even though your mod does not import it |
| `SLOT_KEY`, `CHOICES_KEY`, `ACTIVE_SUFFIX`, `NONE_KEY`, `PLACE_KEY`, `CHOICE_HOTKEYS` | The render key prefixes pane-grid draws and the number of choice hotkeys. pane-grid draws from these constants. `fillSlot` and `offerChoice` use them, so keep them even though your mod does not import them |

`readPlacement` and `readShownTab` are `function` declarations on purpose. From Claude Code 2.1.299, `claude plugin validate` follows `$` across an import only through function declarations.

### Engine floor: Claude Code 2.1.299

A hooks module that passes `$` to `readPlacement` or `readShownTab` loads in Claude Code 2.1.299 or later. Claude Code 2.1.296 and older refuse the whole module, and `claude plugin validate` fails with:

```text
$ is passed to "readPlacement", imported from "./pane-grid": $ is followed only into a function declared in this same file, never across an import
```

The measurement is in [`verification/engine-floor/`](../verification/engine-floor/): 2.1.289 and 2.1.296 refuse both functions, 2.1.299 and 2.1.322 accept them, and 2.1.297 and 2.1.298 were never published to npm.

So pick the shape by the oldest engine your mod promises in its README, its CI or an `engines` field, and by your repository's own checks:

| Your mod | Shape |
|---|---|
| Supports 2.1.299 or later only, and nothing in the repository forbids passing `$` to an imported function | Import `readPlacement` (and `readShownTab` for Step 6) from `./pane-grid`, as the steps below do |
| Supports an engine older than 2.1.299 | Delete `readPlacement` and `readShownTab` from `hooks/pane-grid.ts`. Read pane-grid's state in your own hooks file, in a function declaration there or in the hook body, and import only `placementIn` |
| Has a check of its own that lets `$` be passed only to functions in the hooks file (a lint rule, a structure script), whatever the engine | The same as the row above |

The second shape, declared in the file whose hooks call it:

```tsx
import type { EngineInterface } from 'claude-code'
import { placementIn } from './pane-grid'

async function readPlacement($: EngineInterface, plugin: string) {
  const read = await $.state.get({ plugin: 'pane-grid', key: 'layout' } as never) as { value?: unknown }
  return placementIn(read.value, plugin)
}

// Step 6 only.
async function readShownTab($: EngineInterface) {
  const read = await $.state.get({ plugin: 'pane-grid', key: 'shown' } as never) as { value?: unknown }
  return typeof read.value == 'string' ? read.value : null
}
```

The functions keep the module's names and arguments, so the code in Steps 3 to 7 works with `readPlacement` and `readShownTab` left out of its `import` line. A mod with hooks in several files declares them in each file that calls them. The reason is the one behind the literal `state.set` matcher in Step 4: the engine checks a `$.state` reference only in the file that uses it, and engines before 2.1.299 check `$` itself the same way.

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
import { fillSlot, offerChoice, readPlacement } from './pane-grid'

const PLUGIN = 'your-mod' // the name in .claude-plugin/plugin.json

on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
  const placement = await readPlacement($, PLUGIN)
  const below = await next(e)
  const { Box, Button } = $.ui.resolve(e)
  const offered = offerChoice(below, PLUGIN, placement, choice => <Button key={choice.key} plain label={choice.label} hotkey={choice.hotkey} onPress={() => {}} />)
  if (!placement || placement.requestId != e.requestId) return offered
  const columns = placement.columns > 0 ? placement.columns : e.props.bodyColumns
  const cell = (
    <Box key={`cell:${PLUGIN}`} flexDirection="column">
      {await drawBoard($, e, columns)}
    </Box>
  )
  return fillSlot(offered, PLUGIN, cell) ?? <Box flexDirection="column">{offered}{cell}</Box>
})
```

Three details:

- Call `next(e)` before checking the placement, and return `offered` when your mod has no cell here. Other grid-ready mods and pane-grid itself draw beneath yours, and `offerChoice` is how empty cells list your mod when it loads first.
- The Button's `onPress` does nothing. Its key is `place:<cell>:<plugin>`, and pane-grid's `ui.press` hook places your mod when it is pressed.
- Keep `{offered}` in the fallback tree: pane-grid collects every `cell:` Box from the whole tree.

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

A Button `hotkey` inside a cell acts for the whole grid pane while it has focus, whichever cell is active. Of two Buttons with one hotkey the engine presses the later drawn, and cells are drawn after pane-grid's toolbar. So if your cell draws hotkeys:

- draw them only while `placement.isActive` is true, so they do not act while the person works in another cell
- leave out the letters in `TOOLBAR_KEYS` (`v s o z x w b c k q`), so the toolbar keeps working while your cell is active. The digits `1`-`9` belong to the active empty cell's choices, so they never collide with a placed mod
- give `autoFocus` under the same condition. The grid pane's focus ring starts on the first `autoFocus` element drawn when the pane takes the keyboard

```tsx
const keys = placement ? (placement.isActive ? myKeys.filter(k => !(TOOLBAR_KEYS as readonly string[]).includes(k.key)) : []) : myKeys
```

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

## Step 7: scroll your own rows in the cell (optional)

Skip this step if your mod lets the engine scroll its pane. pane-grid then scrolls your cell for you: the wheel over the cell moves the whole `cell:` Box up, header rows included.

A mod with a `ui.scroll` hook that moves its own rows under a fixed header (a list, a tree, a log) keeps doing so in the cell with two changes:

```tsx
import { isScrollIn, readPlacement, scrollsKey } from './pane-grid'

on('ui.scroll', { component: 'Pane', requestId: [PANE, /^grid-/] }, async ($, e, next) => {
  if (e.requestId != PANE && !isScrollIn(await readPlacement($, PLUGIN), e)) return next(e)
  // scroll your rows by e.by as before and return {}
})
```

```tsx
<Box key={`cell:${PLUGIN}`} flexDirection="column">
  <Box key={scrollsKey(PLUGIN)} />
  {drawPane(columns)}
</Box>
```

| Part | What it does |
|---|---|
| `scrollsKey` Box | An empty Box inside your `cell:` Box. pane-grid finds it in the grid render and hands the `ui.scroll` of your cell to the next hook instead of moving the cell. Without it pane-grid keeps moving the cell, so an older copy of the module is unaffected |
| `isScrollIn` | true for the wheel over your cell's content area, and for a scroll key while your cell is the active one. Every other event goes on with `next(e)`, so the other cells still scroll. The wheel over the cell's title row is dropped |
| Pointer row | The row in your cell is `e.pointer.row - placement.row`, and the column `e.pointer.column - placement.column`. A mod that reads `e.pointer` uses these in a cell |

Load order does not matter here either. When your mod loads before pane-grid, your hook sees the event first and answers it without `next(e)`. When it loads after, pane-grid sees the event first and calls `next(e)` for your cell.

`isScrollIn` is false with pane-grid before 0.4.0, which does not write `column`, `row` and `isActive`: your hook then calls `next(e)` and that pane-grid moves the cell as before.

## Step 8: check it

1. `claude plugin validate <your mod>`: the output lists `state reads: pane-grid.layout` and the `state.set{plugin=pane-grid, key=layout}` hook. If your mod supports an engine older than 2.1.299, run it with that engine too: `npx -y @anthropic-ai/claude-code@<oldest version> plugin validate <your mod>`.
2. Type-check: `tsc -p <your mod> --noEmit` once the engine has written `.claude-plugin/types/`.
3. Run a session with both plugins:

   ```sh
   claude --plugin-dir <path to pane-grid> --plugin-dir <path to your mod>
   ```

   Run it once more with the two `--plugin-dir` options swapped. Your mod should behave the same in both orders. If a placed cell reads `<plugin> is not loaded, or its hooks/pane-grid.ts is older than pane-grid 0.3.0` only when your mod comes first, its `hooks/pane-grid.ts` is an older copy, or the hook returns before calling `fillSlot`.

   Then, in that session:

   | Do | Expect |
   |---|---|
   | `/grid split -h` | A new empty cell lists your mod among its choices, in both load orders |
   | Press its digit, or `/grid place <your mod>` | Your content in the cell; your own pane or band is gone |
   | `/grid resize 30` | Your content redraws at the new width |
   | Wheel over your cell (Step 7 only) | Your rows scroll under your header; the wheel over another cell scrolls that cell |
   | `/grid place -` | Your own pane or band is back |
   | Run without pane-grid | Your mod behaves as before |

   Start Claude Code with `--debug` to read hook failures: a hook whose tree the engine refused is logged as `<plugin>: ui.render hook skipped: …`.

## Use the skill

pane-grid ships a skill that applies this guide to a mod. Open Claude Code in your mod's repository and paste this prompt. It names the pane-grid repository, so a session without pane-grid installed knows what to install and where this guide is:

```text
Make this Claude Code mod grid-ready for pane-grid: https://github.com/hwanyong/pane-grid
1. Install pane-grid: claude plugin install pane-grid --marketplace hwanyong/pane-grid
2. Run the skill /pane-grid:add-pane-grid-cell in this repository.
   If the skill is not loaded in this session, follow the guide instead:
   https://github.com/hwanyong/pane-grid/blob/main/docs/add-pane-grid-cell.md
   and copy https://github.com/hwanyong/pane-grid/blob/main/skills/add-pane-grid-cell/pane-grid.ts
   to hooks/pane-grid.ts without editing the exports you keep.
Do not commit. List what you changed and what I should check in a live session.
```

With pane-grid already installed, running `/pane-grid:add-pane-grid-cell` alone does the same.

The skill copies the reading module, finds where your mod draws, applies Steps 2 to 7 that match it, runs `claude plugin validate`, and lists what it changed and what you should check in a live session (Step 8.3). It does not commit.

## FAQ

### Does my mod need pane-grid installed to work?

No. Every pane-grid read returns `undefined` without it, and the hooks of Steps 3 to 7 then return `next(e)` or do nothing.

### Can my mod be in two cells at once?

No. pane-grid keeps one cell per mod. Placing a mod in a second cell empties the first.

### Why a `Box` key instead of a component or a registration call?

The engine has no call that lets one mod draw inside another mod's pane. Every `ui.render` hook on the grid pane sees the same tree, so a keyed `Box` is the one thing both sides can find without importing each other.

### My mod hooks every `ui.render` without a matcher. Will it show up in empty cells?

Yes. pane-grid lists every installed mod whose `ui.render` hook runs for the grid pane. Placing a mod that draws no `cell:` Box shows `<plugin> draws nothing here` in the cell.
