import type { RenderElement, RenderNode, Tier, TraceEntry } from 'claude-code'
import { PLACE_KEY, TOOLBAR_KEYS } from '../skills/add-pane-grid-cell/pane-grid'

// grid pane 의 render tree key 와 Button 누름 해석. 만드는 쪽(register.tsx 의 render)과 읽는 쪽(press · message hook)이 이 파일의
// 상수 · 함수를 함께 쓴다. $ 를 받지 않는다.

// render tree 의 key 머리말(docs/grid-and-tabs.md §3.7). 규약 mod 가 pane-grid 보다 아래(뒤에 로드)에 있으면 `cell:<plugin>` Box 를
// 그려 next(e) 결과로 내고, 위(먼저 로드)에 있으면 pane-grid 가 그린 `slot:<plugin>` Box 를 채우고 `choices:<cell>` Box 에 선택지 Button 을 더한다.
// 규약 mod 와 함께 쓰는 머리말(SLOT_KEY · CHOICES_KEY · ACTIVE_SUFFIX · NONE_KEY · PLACE_KEY)과 CHOICE_HOTKEYS 는 읽기 모듈
// skills/add-pane-grid-cell/pane-grid.ts 가 갖는다. 그 파일은 member 저장소에 복사되어 hooks/ 를 import 하지 않으므로 이쪽이 읽는다.
export const CELL_KEY = 'cell:'
// pane-grid 가 그리는 Button 의 key 머리말은 PLACE_KEY(선택지)와 이것(툴바)이다. 누름은 모두 ui.press hook 하나가 받는다(로드 순서와 무관하게 같은 입구).
export const HOTKEY_KEY = 'hotkey:'
// ui.press hook 의 element matcher. 두 머리말로 만든다(머리말을 바꾸면 matcher 도 따라 바뀐다).
export const PRESS_KEY = new RegExp(`^(${PLACE_KEY}|${HOTKEY_KEY})`)
// pane-grid 의 Client(surface module) key 머리말. 누름 · 끌기는 ui.message hook 이 받는다.
export const ACTIVATE_KEY = 'activate:'
export const DIVIDER_KEY = 'divider:'
export const MEASURE_KEY = 'measure:'

// 분할선 Client 의 key `divider:<path>:<index>`. path 는 tree.ts 의 노드 경로(':' 가 없다), index 는 왼쪽(위) 자식의 차례다.
const DIVIDER_SEPARATOR = ':'
export const dividerKey = (path: string, index: number) => `${DIVIDER_KEY}${path}${DIVIDER_SEPARATOR}${index}`
export const parseDividerKey = (element: string): { path: string; index: number } | undefined => {
  const [path, index] = element.slice(DIVIDER_KEY.length).split(DIVIDER_SEPARATOR)
  return path && index != undefined && Number.isInteger(Number(index)) ? { path, index: Number(index) } : undefined
}

// trace 에서 규약 mod 를 고를 때 빼는 이름과 tier. 사람이 설치한 mod 만 빈 칸의 선택지가 된다.
const OWN_NAME = 'pane-grid'
const ENGINE_NAME = 'engine'
const INSTALLED_TIERS: readonly Tier[] = ['prepend', 'user', 'append']

// docs/grid-and-tabs.md §2.3 결정 10. 이름 바꾸기(`r`)는 이름 입력이 필요해 slash 명령으로만 한다.
// 글자는 읽기 모듈의 TOOLBAR_KEYS 가 갖고(규약 mod 가 그 글자를 피한다), 여기서는 글자마다 이름과 명령을 붙인다.
const TOOLBAR: Record<(typeof TOOLBAR_KEYS)[number], { label: string; words: string[] }> = {
  v: { label: 'split-h', words: ['split', '-h'] },
  s: { label: 'split-v', words: ['split', '-v'] },
  o: { label: 'next', words: ['next'] },
  z: { label: 'zoom', words: ['zoom'] },
  x: { label: 'kill', words: ['kill'] },
  w: { label: 'swap', words: ['swap'] },
  b: { label: 'break', words: ['break'] },
  c: { label: 'new tab', words: ['new'] },
  k: { label: 'close tab', words: ['close'] },
  q: { label: 'list', words: ['list'] },
}
export const HOTKEYS = TOOLBAR_KEYS.map(key => ({ key, ...TOOLBAR[key] }))

// Box 아래에 key 가 `key` 인 노드가 있는가.
export const holdsKey = (node: RenderNode, key: string): boolean => {
  if (typeof node == 'string') return false
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  if (props?.key == key) return true
  return 'children' in node && (node.children ?? []).some(child => holdsKey(child, key))
}

// 규약 mod 가 그린 칸: key 가 `cell:<plugin>` 인 Box.
export const collectCells = (node: RenderNode, out: Map<string, RenderElement>): void => {
  if (typeof node == 'string') return
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  const key = props?.key
  if (typeof key == 'string' && key.startsWith(CELL_KEY)) return void out.set(key.slice(CELL_KEY.length), node)
  if ('children' in node) for (const child of node.children ?? []) collectCells(child, out)
}

// grid pane 의 ui.render 에 hook 을 건 mod: 규약 mod 는 놓이지 않았어도 이 hook 을 걸고 있으므로 next.trace 에 이름이 남는다.
export const gridReady = (trace: readonly TraceEntry[]) => [
  ...new Set(trace.filter(entry => INSTALLED_TIERS.includes(entry.tier) && entry.plugin != OWN_NAME && entry.plugin != ENGINE_NAME).map(entry => entry.plugin)),
].sort()

// Button key 를 /grid 명령의 낱말로 바꾼다. `place:<cell>:<plugin>` · `hotkey:<key>`.
export const pressWords = (element: string): string[] | undefined => {
  if (element.startsWith(PLACE_KEY)) {
    const [cell, plugin] = element.slice(PLACE_KEY.length).split(':')
    return cell && plugin ? ['place', plugin, cell] : undefined
  }
  if (element.startsWith(HOTKEY_KEY)) return HOTKEYS.find(item => item.key == element.slice(HOTKEY_KEY.length))?.words
  return undefined
}
