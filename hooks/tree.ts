import type { GridCell, GridChild, GridNode, GridSplit, GridTab } from '../types'

// 배치 트리를 다루는 순수 함수. 입력 트리를 바꾸지 않고 새 트리를 반환한다.
// 크기 규칙은 tmux 3.7c 실측(docs/grid-and-tabs.md §2.1)을 따른다.

export type Rect = { x: number; y: number; width: number; height: number }

export const PRESETS = ['even-horizontal', 'even-vertical', 'main-vertical', 'main-horizontal', 'tiled'] as const
export type Preset = typeof PRESETS[number]

// tmux 120x40 실측: main-vertical 의 왼쪽 80열, main-horizontal 의 위 24행.
const MAIN_VERTICAL_SHARE = 67
const MAIN_HORIZONTAL_SHARE = 60

export const cellsOf = (node: GridNode): GridCell[] =>
  node.kind == 'cell' ? [node] : node.children.flatMap(child => cellsOf(child.node))

export const findCell = (node: GridNode, id: string): GridCell | undefined =>
  cellsOf(node).find(cell => cell.id == id)

// 모든 탭에서 쓰지 않은 가장 작은 `c<n>`.
export const newCellId = (tabs: GridTab[]) => {
  const used = new Set(tabs.flatMap(tab => cellsOf(tab.root).map(cell => cell.id)))
  let index = 1
  while (used.has(`c${index}`)) index += 1
  return `c${index}`
}

// 나란히 놓은 자식 사이의 분할선 폭(열) 또는 높이(행).
export const DIVIDER = 1
// 비율은 소수 둘째 자리까지 둔다. 분할선을 끌어 놓은 칸 수를 정수 비율로 내리면 1% 가 2칸 이상인 넓은 pane 에서 칸 단위로 놓이지 않는다.
const PRECISION = 100

const sizeOf = (child: GridChild) => (child.size > 0 ? child.size : 1)
const total = (children: GridChild[]) => children.reduce((sum, child) => sum + child.size, 0)
const rounded = (value: number) => Math.round(value * PRECISION) / PRECISION

// 합이 100 인 비율(소수 둘째 자리)로 맞춘다. 0 이하는 1 로 올리고, 나머지는 마지막 자식이 받는다.
export const normalize = (children: GridChild[]): GridChild[] => {
  const whole = children.reduce((sum, child) => sum + sizeOf(child), 0)
  const scaled = children.map(child => ({ node: child.node, size: Math.max(1, Math.floor((sizeOf(child) * 100 * PRECISION) / whole) / PRECISION) }))
  const rest = rounded(100 - total(scaled))
  return scaled.map((child, index) => (index == scaled.length - 1 ? { node: child.node, size: rounded(child.size + rest) } : child))
}

const evenly = (nodes: GridNode[]): GridChild[] => normalize(nodes.map(node => ({ node, size: 1 })))

const isCell = (node: GridNode, id: string) => node.kind == 'cell' && node.id == id

const mapNode = (node: GridNode, change: (node: GridNode) => GridNode): GridNode => {
  const next = node.kind == 'cell' ? node : { ...node, children: node.children.map(child => ({ ...child, node: mapNode(child.node, change) })) }
  return change(next)
}

// 칸 `id` 를 `kind` 방향으로 반 나눠 그 뒤에 `added` 를 놓는다(tmux split-window -h · -v).
// 부모가 같은 방향이면 형제로 넣고, 아니면 그 칸 자리에 새 노드를 만든다.
export const split = (root: GridNode, id: string, kind: GridSplit['kind'], added: GridCell): GridNode => {
  if (root.kind == 'cell') return root.id == id ? { kind, children: [{ node: root, size: 50 }, { node: added, size: 50 }] } : root
  if (root.kind == kind && root.children.some(child => isCell(child.node, id))) {
    const children = root.children.flatMap(child => (isCell(child.node, id)
      ? [{ node: child.node, size: child.size / 2 }, { node: added, size: child.size / 2 }]
      : [child]))
    return { ...root, children: normalize(children) }
  }
  return { ...root, children: root.children.map(child => ({ ...child, node: split(child.node, id, kind, added) })) }
}

// 칸 `id` 를 지운다. 그 공간은 앞 형제(없으면 뒤 형제)가 받는다(tmux kill-pane).
// 마지막 칸이면 undefined 를 반환한다. 자식이 하나 남은 노드는 그 자식으로 바꾼다.
export const remove = (root: GridNode, id: string): GridNode | undefined => {
  if (root.kind == 'cell') return root.id == id ? undefined : root
  return removeFromSplit(root, id)
}

// 자식이 둘 이상인 노드에서 하나를 지우면 하나 이상 남으므로 늘 노드를 반환한다.
const removeFromSplit = (node: GridSplit, id: string): GridNode => {
  const removed = node.children.find(child => isCell(child.node, id))
  if (!removed) return { ...node, children: node.children.map(child => (child.node.kind == 'cell' ? child : { ...child, node: removeFromSplit(child.node, id) })) }
  const left = node.children.filter(child => child !== removed)
  const [first] = left
  if (left.length == 1 && first) return first.node
  const heir = left[Math.max(node.children.indexOf(removed) - 1, 0)]
  return { ...node, children: normalize(left.map(child => (child === heir ? { ...child, size: child.size + removed.size } : child))) }
}

// 두 칸의 자리를 바꾼다(tmux swap-pane). 칸 id 와 mod 가 함께 옮겨 간다.
export const swap = (root: GridNode, first: string, second: string): GridNode => {
  const a = findCell(root, first)
  const b = findCell(root, second)
  if (!a || !b) return root
  return mapNode(root, node => {
    if (node.kind != 'cell') return node
    if (node.id == first) return b
    if (node.id == second) return a
    return node
  })
}

// 칸 `id` 가 부모 안에서 차지하는 비율을 `share`(1 ~ 99)로 바꾸고 나머지 형제는 비율대로 줄인다.
export const resize = (root: GridNode, id: string, share: number): GridNode => {
  if (root.kind == 'cell') return root
  const target = root.children.find(child => cellsOf(child.node).some(cell => cell.id == id))
  if (!target) return root
  if (target.node.kind != 'cell') return { ...root, children: root.children.map(child => (child === target ? { ...child, node: resize(child.node, id, share) } : child)) }
  const others = total(root.children) - target.size
  const clamped = Math.min(Math.max(share, 1), 99)
  const children = root.children.map(child => ({ node: child.node, size: child === target ? clamped : (child.size * (100 - clamped)) / others }))
  return { ...root, children: normalize(children) }
}

// 노드가 하나면 그 노드, 둘 이상이면 같은 비율로 나란히 놓은 노드.
const group = (kind: GridSplit['kind'], first: GridNode, others: GridNode[]): GridNode =>
  (others.length == 0 ? first : { kind, children: evenly([first, ...others]) })

// 탭의 칸을 tmux select-layout 의 다섯 가지 배치로 다시 놓는다. 칸이 하나면 그대로 둔다.
export const preset = (root: GridNode, name: Preset): GridNode => {
  const cells = cellsOf(root)
  const [main, second, ...others] = cells
  if (!main || !second) return root
  if (name == 'even-horizontal') return group('row', main, [second, ...others])
  if (name == 'even-vertical') return group('column', main, [second, ...others])
  if (name == 'main-vertical') return { kind: 'row', children: [{ node: main, size: MAIN_VERTICAL_SHARE }, { node: group('column', second, others), size: 100 - MAIN_VERTICAL_SHARE }] }
  if (name == 'main-horizontal') return { kind: 'column', children: [{ node: main, size: MAIN_HORIZONTAL_SHARE }, { node: group('row', second, others), size: 100 - MAIN_HORIZONTAL_SHARE }] }
  const columns = Math.ceil(Math.sqrt(cells.length))
  const lines = Array.from({ length: Math.ceil(cells.length / columns) }, (_, at) => cells.slice(at * columns, (at + 1) * columns))
  const rows = lines.flatMap(([first, ...more]) => (first ? [group('row', first, more)] : []))
  const [top, ...below] = rows
  return top ? group('column', top, below) : root
}

// 나눈 노드의 자식 길이(칸 수). 분할선을 뺀 길이를 비율의 누적합으로 반올림해 나눈다. 누적합으로 나누므로 합이 늘 그 길이다.
export const partLengths = (node: GridSplit, length: number): number[] => {
  const room = Math.max(length - DIVIDER * (node.children.length - 1), 0)
  const bounds = node.children.map((_, index) => (index == node.children.length - 1
    ? room
    : Math.round((room * total(node.children.slice(0, index + 1))) / 100)))
  return bounds.map((bound, index) => Math.max(bound - (bounds[index - 1] ?? 0), 0))
}

// 자식 `index` 와 그 다음 자식 사이의 분할선. `start` 는 부모 사각형 시작에서 분할선까지의 칸 수다.
export type Divider = { index: number; start: number; rect: Rect }

// 나눈 노드의 자식마다 사각형과, 자식 사이의 분할선 사각형을 계산한다. render 와 geometry 가 같은 계산을 쓴다.
export const splitRects = (node: GridSplit, rect: Rect): { parts: { node: GridNode; rect: Rect }[]; dividers: Divider[] } => {
  const isRow = node.kind == 'row'
  const along = (start: number, length: number): Rect => (isRow
    ? { x: rect.x + start, y: rect.y, width: length, height: rect.height }
    : { x: rect.x, y: rect.y + start, width: rect.width, height: length })
  const lengths = partLengths(node, isRow ? rect.width : rect.height)
  const starts = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length + DIVIDER, 0))
  return {
    parts: node.children.map((child, index) => ({ node: child.node, rect: along(starts[index] ?? 0, lengths[index] ?? 0) })),
    dividers: lengths.slice(0, -1).map((length, index) => {
      const start = (starts[index] ?? 0) + length
      return { index, start, rect: along(start, DIVIDER) }
    }),
  }
}

export const childRects = (node: GridSplit, rect: Rect) => splitRects(node, rect).parts

// 분할선 `index` 를 부모 시작에서 `at` 칸 자리로 옮긴다. 양옆 두 자식만 길이가 바뀌고, 둘 다 1칸 이상 남긴다.
// 다른 자식의 길이는 그대로 두고 모든 비율을 지금 칸 수에서 다시 계산한다.
export const moveDivider = (node: GridSplit, length: number, index: number, at: number): GridSplit => {
  const lengths = partLengths(node, length)
  const before = lengths[index]
  const after = lengths[index + 1]
  if (before == undefined || after == undefined) return node
  const start = lengths.slice(0, index).reduce((sum, part) => sum + part + DIVIDER, 0)
  const moved = Math.min(Math.max(at - start, 1), before + after - 1)
  if (moved == before) return node
  const next = lengths.map((part, position) => (position == index ? moved : position == index + 1 ? before + after - moved : part))
  const room = next.reduce((sum, part) => sum + part, 0)
  if (room <= 0) return node
  return { ...node, children: normalize(node.children.map((child, position) => ({ node: child.node, size: ((next[position] ?? 0) * 100) / room }))) }
}

// 나눈 노드를 경로로 찾는다. 경로는 루트에서 자식 번호를 점으로 이은 것이고 루트는 `r` 이다(`r.1.0`).
export const ROOT_PATH = 'r'
export const childPath = (path: string, index: number) => `${path}.${index}`

export const splitAt = (root: GridNode, path: string): GridSplit | undefined => {
  const [head, ...indexes] = path.split('.')
  if (head != ROOT_PATH) return undefined
  let node: GridNode | undefined = root
  for (const index of indexes) node = node?.kind == 'cell' ? undefined : node?.children[Number(index)]?.node
  return node?.kind == 'cell' ? undefined : node
}

// 경로의 노드가 차지하는 사각형. 경로가 가리키는 노드가 없으면 undefined.
export const rectAt = (root: GridNode, path: string, rect: Rect): Rect | undefined => {
  const [head, ...indexes] = path.split('.')
  if (head != ROOT_PATH) return undefined
  let node: GridNode = root
  let found: Rect = rect
  for (const index of indexes) {
    if (node.kind == 'cell') return undefined
    const part = childRects(node, found)[Number(index)]
    if (!part) return undefined
    node = part.node
    found = part.rect
  }
  return found
}

export const replaceAt = (root: GridNode, path: string, replaced: GridSplit): GridNode => {
  const [, ...indexes] = path.split('.')
  const swapIn = (node: GridNode, depth: number): GridNode => {
    if (depth == indexes.length) return replaced
    if (node.kind == 'cell') return node
    const at = Number(indexes[depth])
    return { ...node, children: node.children.map((child, index) => (index == at ? { ...child, node: swapIn(child.node, depth + 1) } : child)) }
  }
  return swapIn(root, 0)
}

// 칸 id 마다 사각형(제목 줄 포함, 분할선 제외)을 계산한다. 좌표는 grid 영역 왼쪽 위가 0 이다.
export const geometry = (node: GridNode, rect: Rect, out = new Map<string, Rect>()): Map<string, Rect> => {
  if (node.kind == 'cell') return out.set(node.id, rect)
  for (const part of childRects(node, rect)) geometry(part.node, part.rect, out)
  return out
}

// tmux 배치 문자열 모양으로 적는다. `/grid list` 출력에 쓴다.
export const describe = (node: GridNode): string => {
  if (node.kind == 'cell') return node.plugin ? `${node.id}=${node.plugin}` : node.id
  const inner = node.children.map(child => `${describe(child.node)}:${child.size}`).join(',')
  return node.kind == 'row' ? `{${inner}}` : `[${inner}]`
}
