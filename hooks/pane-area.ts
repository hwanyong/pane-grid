import type { GridTab } from '../types/index.d.ts'
import type { MeasureProps } from './client-messages'
import { geometry } from './tree'
import type { Rect } from './tree'

// grid pane 본문 안의 좌표. pane 위에서부터 고정 구분선 · hotkey 줄 · 고정 구분선 · grid 이고, 칸마다 제목 1행이 있다.
// 좌표는 `UiScrollPointer` 와 같은 pane 본문 기준이다. $ 를 받지 않는다.

// hotkey Button 줄. 높이를 고정해야 칸 사각형과 휠 `pointer.row` 를 맞출 수 있다.
export const TOOLBAR_ROWS = 2
// 엔진의 탭 줄과 hotkey 줄 사이, hotkey 줄과 grid 사이의 고정 구분선(끌 수 없다). 각 1행이다.
export const RULE_ROWS = 1
// grid 위의 행 수: 구분선 · hotkey 줄 · 구분선.
export const HEADER_ROWS = RULE_ROWS + TOOLBAR_ROWS + RULE_ROWS
// 칸에는 테두리가 없고 제목 1행만 있다. 칸 사이는 끌어서 크기를 바꾸는 분할선 1칸이다(tree.ts DIVIDER).
export const CELL_CHROME_ROWS = 1

// 활성으로 그리고 hotkey 가 다루는 칸: zoom 한 칸, 없으면 활성 칸.
export const activeOf = (tab: GridTab) => tab.zoomed ?? tab.active

// 보이는 칸과 그 사각형. zoom 한 탭은 그 칸 하나가 grid 전체이고 나머지 칸은 없다. placements · cellAt 이 함께 쓴다.
export const visibleRects = (tab: GridTab, area: Rect): Map<string, Rect> => (tab.zoomed ? new Map([[tab.zoomed, area]]) : geometry(tab.root, area))

export const gridRect = (measured: MeasureProps): Rect => ({ x: 0, y: 0, width: measured.columns, height: Math.max(measured.rows - HEADER_ROWS, 0) })

export const contentSize = (rect: Rect) => ({
  columns: Math.max(rect.width, 0),
  rows: Math.max(rect.height - CELL_CHROME_ROWS, 0),
})

// 칸 내용의 왼쪽 위를 pane 본문 좌표(`UiScrollPointer` 와 같은 좌표)로 더한다. 위에 구분선 · hotkey 줄 · 칸 제목이 있다.
export const contentArea = (rect: Rect) => ({ column: rect.x, row: HEADER_ROWS + rect.y + CELL_CHROME_ROWS, ...contentSize(rect) })

// 휠이면 `pointer` 가 가리키는 칸, 페이지 키면 활성 칸(tmux 의 활성 pane). 칸 밖이면 undefined.
export const cellAt = (tab: GridTab, measured: MeasureProps, pointer: { column: number; row: number } | undefined) => {
  if (!pointer) return activeOf(tab)
  const row = pointer.row - HEADER_ROWS
  const rects = [...visibleRects(tab, gridRect(measured))]
  const hit = rects.find(([, rect]) => pointer.column >= rect.x && pointer.column < rect.x + rect.width && row >= rect.y && row < rect.y + rect.height)
  return hit?.[0]
}
