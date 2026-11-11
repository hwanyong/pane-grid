import type { GridChild, GridNode, GridTab } from '../types/index.d.ts'
import { cellsOf, normalize } from './tree'

// layout 파일(프로젝트 파일 `<설정 디렉터리>/pane-grid/projects/<이름>/layout.json` 과 global 파일 `<설정 디렉터리>/pane-grid/layout.json`)의
// 형식과 검사. 프로젝트 파일이 배치의 원본이다(docs/grid-and-tabs.md §3.1, 결정 20).
// 형식: { "version": 1, "project"?: string, "tabs": GridTab[] }. `project` 는 그 파일의 프로젝트 경로이고 사람이 읽으라고 적는다.
// 읽을 때는 보지 않는다. 칸 스크롤 위치와 칸 크기는 파일에 적지 않는다.

const FILE_VERSION = 1
export const TAB_NAME = /^[a-z0-9][a-z0-9_-]{0,31}$/
const CELL_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/
const PLUGIN_NAME = /^[a-z0-9][a-z0-9_.-]{0,127}$/

export type Parsed = { isValid: true; tabs: GridTab[] } | { isValid: false; reason: string }

// 결정 14: 파일이 없으면 칸 하나짜리 빈 탭 `main`.
export const defaultTabs = (): GridTab[] => [{ name: 'main', root: { kind: 'cell', id: 'c1' }, active: 'c1' }]

const isObject = (value: unknown): value is Record<string, unknown> => typeof value == 'object' && value != null && !Array.isArray(value)

// 노드 하나를 검사해 정규형으로 돌려준다. 틀린 곳이 있으면 이유 문자열을 던지지 않고 반환한다.
const parseNode = (value: unknown, where: string): GridNode | string => {
  if (!isObject(value)) return `${where}: not an object`
  if (value.kind == 'cell') {
    if (typeof value.id != 'string' || !CELL_ID.test(value.id)) return `${where}: cell id must match ${CELL_ID}`
    if (value.plugin == undefined) return { kind: 'cell', id: value.id }
    if (typeof value.plugin != 'string' || !PLUGIN_NAME.test(value.plugin)) return `${where}: plugin must match ${PLUGIN_NAME}`
    return { kind: 'cell', id: value.id, plugin: value.plugin }
  }
  const kind = value.kind == 'row' ? 'row' : value.kind == 'column' ? 'column' : undefined
  if (!kind) return `${where}: kind must be cell, row or column`
  if (!Array.isArray(value.children) || value.children.length < 2) return `${where}: a ${kind} needs two children or more`
  const children: GridChild[] = []
  for (const [index, child] of value.children.entries()) {
    const at = `${where}.children[${index}]`
    if (!isObject(child)) return `${at}: not an object`
    const node = parseNode(child.node, `${at}.node`)
    if (typeof node == 'string') return node
    // 비율이 없거나 유한한 수가 아니면 1 로 두고, 아래 normalize 가 합 100 으로 맞춘다.
    children.push({ node, size: typeof child.size == 'number' && Number.isFinite(child.size) ? child.size : 1 })
  }
  return { kind, children: normalize(children) }
}

const parseTab = (value: unknown, where: string): GridTab | string => {
  if (!isObject(value)) return `${where}: not an object`
  if (typeof value.name != 'string' || !TAB_NAME.test(value.name)) return `${where}: name must match ${TAB_NAME}`
  const root = parseNode(value.root, `${where}.root`)
  if (typeof root == 'string') return root
  const ids = cellsOf(root).map(cell => cell.id)
  const [first] = ids
  if (!first) return `${where}.root: no cell`
  const active = typeof value.active == 'string' && ids.includes(value.active) ? value.active : first
  const zoomed = typeof value.zoomed == 'string' && ids.includes(value.zoomed) ? value.zoomed : undefined
  return zoomed ? { name: value.name, root, active, zoomed } : { name: value.name, root, active }
}

// 탭 이름 · 칸 id 는 파일 전체에서 하나씩, mod 는 한 칸에만 놓인다.
export const checkUnique = (tabs: GridTab[]): string | undefined => {
  const names = tabs.map(tab => tab.name)
  const cells = tabs.flatMap(tab => cellsOf(tab.root))
  const ids = cells.map(cell => cell.id)
  const plugins = cells.flatMap(cell => (cell.plugin ? [cell.plugin] : []))
  const twice = (list: string[]) => list.find((item, index) => list.indexOf(item) != index)
  const name = twice(names)
  if (name) return `tab name ${name} is used twice`
  const id = twice(ids)
  if (id) return `cell id ${id} is used twice`
  const plugin = twice(plugins)
  if (plugin) return `plugin ${plugin} is placed in two cells`
  return undefined
}

export const parseLayoutFile = (text: string): Parsed => {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    return { isValid: false, reason: `not JSON: ${(error as Error).message}` }
  }
  if (!isObject(value)) return { isValid: false, reason: 'not an object' }
  if (value.version != FILE_VERSION) return { isValid: false, reason: `version must be ${FILE_VERSION}` }
  if (!Array.isArray(value.tabs) || value.tabs.length == 0) return { isValid: false, reason: 'tabs must be a list of one tab or more' }
  const tabs: GridTab[] = []
  for (const [index, tab] of value.tabs.entries()) {
    const parsed = parseTab(tab, `tabs[${index}]`)
    if (typeof parsed == 'string') return { isValid: false, reason: parsed }
    tabs.push(parsed)
  }
  const duplicate = checkUnique(tabs)
  if (duplicate) return { isValid: false, reason: duplicate }
  return { isValid: true, tabs }
}

export const serializeLayoutFile = (tabs: GridTab[], project: string) => `${JSON.stringify({ version: FILE_VERSION, project, tabs }, null, 2)}\n`
