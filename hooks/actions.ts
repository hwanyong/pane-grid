import type { GridCell, GridNode, GridTab } from './grid-types'
import { TAB_NAME, checkUnique } from './layout-file'
import { PRESETS, cellsOf, describe, findCell, newCellId, preset, remove, resize, split, swap } from './tree'
import type { Preset } from './tree'

// `/grid <동작>` 과 hotkey 가 함께 부르는 동작 함수(docs/grid-and-tabs.md §2.3: 동작 함수 하나에 입구 두 개).
// 순수 함수다. 탭 목록과 지금 탭을 받아 새 탭 목록 · 지금 탭 · 출력 문자열을 반환하고, pane 여닫기 · 파일 쓰기는 부르는 쪽이 한다.

export type Outcome = {
  tabs: GridTab[]
  current: string
  text: string
  isChanged: boolean
  // 이 탭을 `$.ui.open({ focus: true })` 로 보이게 한다.
  focus?: string
}

const USAGE = [
  'split -h|-v [plugin]     split the active cell left-right (-h) or top-bottom (-v)',
  'kill                     remove the active cell',
  'next                     make the next cell active',
  'select-cell <id>         make that cell active',
  'place <plugin>|- [<id>]  put a plugin in the active cell (or that cell), or empty it',
  'swap [<id>]              swap the active cell with that cell (default: the next one)',
  'zoom                     draw the active cell alone, or undo it',
  'resize <1-99>            set the active cell\'s share of its parent in percent',
  `layout <preset>          ${PRESETS.join(' | ')}`,
  'new [<name>]             open a new tab',
  'select <name>            show that tab',
  'rename <name>            rename the current tab',
  'close                    close the current tab',
  'break                    move the active cell to a new tab',
  'list                     print the tabs and their cells',
  'reload                   read ~/.claude/pane-grid/layout.json again',
].join('\n')

const same = (tabs: GridTab[], current: string, text: string): Outcome => ({ tabs, current, text, isChanged: false })

const changed = (tabs: GridTab[], current: string, text: string, focus?: string): Outcome =>
  focus ? { tabs, current, text, isChanged: true, focus } : { tabs, current, text, isChanged: true }

const replaceTab = (tabs: GridTab[], tab: GridTab) => tabs.map(item => (item.name == tab.name ? tab : item))

// mod 하나는 한 칸에만 놓인다(결정 6). 다른 칸에 있던 같은 mod 를 비운다.
const unplace = (tabs: GridTab[], plugin: string) =>
  tabs.map(tab => ({ ...tab, root: mapCells(tab.root, cell => (cell.plugin == plugin ? { kind: 'cell', id: cell.id } : cell)) }))

const mapCells = (node: GridNode, change: (cell: GridCell) => GridCell): GridNode =>
  node.kind == 'cell' ? change(node) : { ...node, children: node.children.map(child => ({ ...child, node: mapCells(child.node, change) })) }

const unusedTabName = (tabs: GridTab[]) => {
  let index = tabs.length + 1
  while (tabs.some(tab => tab.name == `w${index}`)) index += 1
  return `w${index}`
}

const listText = (tabs: GridTab[], current: string) =>
  tabs.map(tab => `${tab.name == current ? '*' : ' '} ${tab.name} active=${tab.active}${tab.zoomed ? ' zoomed' : ''} ${describe(tab.root)}`).join('\n')

export const apply = (tabs: GridTab[], current: string, words: string[]): Outcome => {
  const [verb = 'help', ...rest] = words
  const tab = tabs.find(item => item.name == current) ?? tabs[0]
  if (!tab) return same(tabs, current, 'there is no tab')
  const cells = cellsOf(tab.root)
  const index = cells.findIndex(cell => cell.id == tab.active)

  if (verb == 'help') return same(tabs, tab.name, USAGE)
  if (verb == 'list') return same(tabs, tab.name, listText(tabs, tab.name))

  if (verb == 'split') {
    const [flag, plugin] = rest
    if (flag != '-h' && flag != '-v') return same(tabs, tab.name, 'usage: split -h|-v [plugin]')
    const id = newCellId(tabs)
    const added: GridCell = plugin ? { kind: 'cell', id, plugin } : { kind: 'cell', id }
    const base = plugin ? unplace(tabs, plugin) : tabs
    const own = base.find(item => item.name == tab.name) ?? tab
    const root = split(own.root, own.active, flag == '-h' ? 'row' : 'column', added)
    return changed(replaceTab(base, { name: own.name, root, active: id }), tab.name, `split ${own.active} into ${own.active} and ${id}`)
  }

  if (verb == 'kill') {
    const root = remove(tab.root, tab.active)
    const heir = cells[index > 0 ? index - 1 : index + 1]
    if (!root || !heir) return same(tabs, tab.name, 'the last cell of a tab cannot be removed; use close')
    return changed(replaceTab(tabs, { name: tab.name, root, active: heir.id }), tab.name, `removed ${tab.active}`)
  }

  if (verb == 'next' || verb == 'select-cell') {
    const target = verb == 'next' ? cells[(index + 1) % cells.length]?.id : rest[0]
    if (!target || !findCell(tab.root, target)) return same(tabs, tab.name, `no cell ${target ?? ''} in ${tab.name}`)
    const zoomed = tab.zoomed ? { zoomed: target } : {}
    return changed(replaceTab(tabs, { ...tab, active: target, ...zoomed }), tab.name, `active cell ${target}`)
  }

  if (verb == 'place') {
    const [plugin, id = tab.active] = rest
    if (!plugin) return same(tabs, tab.name, 'usage: place <plugin>|- [<id>]')
    if (!findCell(tab.root, id)) return same(tabs, tab.name, `no cell ${id} in ${tab.name}`)
    const base = plugin == '-' ? tabs : unplace(tabs, plugin)
    const own = base.find(item => item.name == tab.name) ?? tab
    const root = mapCells(own.root, cell => (cell.id != id ? cell : plugin == '-' ? { kind: 'cell', id } : { kind: 'cell', id, plugin }))
    return changed(replaceTab(base, { ...own, root, active: id }), tab.name, plugin == '-' ? `emptied ${id}` : `placed ${plugin} in ${id}`)
  }

  if (verb == 'swap') {
    const target = rest[0] ?? cells[(index + 1) % cells.length]?.id
    if (!target || target == tab.active || !findCell(tab.root, target)) return same(tabs, tab.name, `no other cell ${target ?? ''} in ${tab.name}`)
    return changed(replaceTab(tabs, { ...tab, root: swap(tab.root, tab.active, target) }), tab.name, `swapped ${tab.active} and ${target}`)
  }

  if (verb == 'zoom') {
    const { zoomed, ...plain } = tab
    const next = zoomed ? plain : { ...tab, zoomed: tab.active }
    return changed(replaceTab(tabs, next), tab.name, zoomed ? 'unzoomed' : `zoomed ${tab.active}`)
  }

  if (verb == 'resize') {
    const share = Number(rest[0])
    if (!Number.isInteger(share) || share < 1 || share > 99) return same(tabs, tab.name, 'usage: resize <1-99>')
    return changed(replaceTab(tabs, { ...tab, root: resize(tab.root, tab.active, share) }), tab.name, `resized ${tab.active} to ${share}%`)
  }

  if (verb == 'layout') {
    const name = rest[0] as Preset
    if (!PRESETS.includes(name)) return same(tabs, tab.name, `usage: layout ${PRESETS.join('|')}`)
    return changed(replaceTab(tabs, { name: tab.name, root: preset(tab.root, name), active: tab.active }), tab.name, `layout ${name}`)
  }

  if (verb == 'new') {
    const name = rest[0] ?? unusedTabName(tabs)
    if (!TAB_NAME.test(name) || tabs.some(item => item.name == name)) return same(tabs, tab.name, `tab name ${name} is taken or does not match ${TAB_NAME}`)
    const id = newCellId(tabs)
    return changed([...tabs, { name, root: { kind: 'cell', id }, active: id }], name, `opened tab ${name}`, name)
  }

  if (verb == 'select') {
    const target = tabs.find(item => item.name == rest[0])
    if (!target) return same(tabs, tab.name, `no tab ${rest[0] ?? ''}`)
    return { tabs, current: target.name, text: `showing ${target.name}`, isChanged: false, focus: target.name }
  }

  if (verb == 'rename') {
    const name = rest[0]
    if (!name || !TAB_NAME.test(name) || tabs.some(item => item.name == name)) return same(tabs, tab.name, `tab name ${name ?? ''} is taken or does not match ${TAB_NAME}`)
    return changed(tabs.map(item => (item.name == tab.name ? { ...item, name } : item)), name, `renamed ${tab.name} to ${name}`, name)
  }

  if (verb == 'close') {
    if (tabs.length == 1) return same(tabs, tab.name, 'the last tab cannot be closed')
    const at = tabs.findIndex(item => item.name == tab.name)
    const left = tabs.filter(item => item.name != tab.name)
    const heir = left[Math.max(at - 1, 0)]
    if (!heir) return same(tabs, tab.name, 'the last tab cannot be closed')
    return changed(left, heir.name, `closed ${tab.name}`, heir.name)
  }

  if (verb == 'break') {
    const root = remove(tab.root, tab.active)
    const moved = cells[index]
    const heir = cells[index > 0 ? index - 1 : index + 1]
    if (!root || !moved || !heir) return same(tabs, tab.name, 'the only cell of a tab cannot be moved out')
    const name = unusedTabName(tabs)
    const next = [...replaceTab(tabs, { name: tab.name, root, active: heir.id }), { name, root: moved, active: moved.id }]
    return changed(next, name, `moved ${moved.id} to tab ${name}`, name)
  }

  return same(tabs, tab.name, `unknown: ${verb}\n${USAGE}`)
}

// 동작 뒤에도 파일 규칙(이름 · id · mod 한 칸)이 지켜지는지 본다. 어기면 그 이유.
export const checkOutcome = (outcome: Outcome) => checkUnique(outcome.tabs)
