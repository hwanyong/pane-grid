import type { EngineInterface } from 'claude-code'

// pane-grid reading module. Copy this file to <your mod>/hooks/pane-grid.ts unchanged.
// Source: https://github.com/hwanyong/pane-grid/blob/main/skills/add-pane-grid-cell/pane-grid.ts
// Guide: https://github.com/hwanyong/pane-grid/blob/main/docs/add-pane-grid-cell.md
//
// pane-grid's state types live in the pane-grid repository only, so this module checks the values it reads at run time.
// When pane-grid is not installed every read is undefined and your mod keeps drawing in its own pane or band.

const GRID_LAYOUT = { plugin: 'pane-grid', key: 'layout' } as const
const GRID_SHOWN = { plugin: 'pane-grid', key: 'shown' } as const
const GRID_VERSION = 1

// tab: the layout holding the cell. requestId: that layout's grid pane id (`grid-<tab>`).
// columns and rows: the size to draw in. Both are 0 until pane-grid has measured the pane.
type GridPlacement = { tab: string; requestId: string; cell: string; columns: number; rows: number }

const isPlacement = (value: unknown): value is GridPlacement => {
  if (typeof value != 'object' || value == null) return false
  const placement = value as Record<string, unknown>
  return typeof placement.tab == 'string' && typeof placement.requestId == 'string'
    && typeof placement.columns == 'number' && typeof placement.rows == 'number'
}

// Finds this mod's cell in a pane-grid layout value. Also used on a `state.set` hook's `value` and `previous`.
export const placementIn = (layout: unknown, plugin: string): GridPlacement | undefined => {
  if (typeof layout != 'object' || layout == null) return undefined
  const { version, placed } = layout as { version?: unknown; placed?: unknown }
  if (version != GRID_VERSION || typeof placed != 'object' || placed == null) return undefined
  const placement = (placed as Record<string, unknown>)[plugin]
  return isPlacement(placement) ? placement : undefined
}

// The two functions below are function declarations, not arrow functions:
// `claude plugin validate` follows `$` across an import only through function declarations.

// This mod's cell. Called while drawing, the drawing is redrawn when pane-grid changes the layout.
export async function readPlacement($: EngineInterface, plugin: string): Promise<GridPlacement | undefined> {
  const read = await $.state.get(GRID_LAYOUT as never) as { value?: unknown }
  return placementIn(read.value, plugin)
}

// The name of the grid layout on screen; null when no grid pane is shown or pane-grid is not installed.
// Only a mod that runs timers (an animation, polling) needs it. Delete it otherwise.
export async function readShownTab($: EngineInterface): Promise<string | null> {
  const read = await $.state.get(GRID_SHOWN as never) as { value?: unknown }
  return typeof read.value == 'string' ? read.value : null
}
