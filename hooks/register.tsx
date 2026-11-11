import { update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderNode } from 'claude-code'
import type { GridLayout, GridNode, GridPlacement, GridScroll, GridShown, GridTab } from '../types/index.d.ts'
import { VERBS, apply, checkOutcome } from './actions'
import type { ActivatePost, DividerPost, DividerProps, MeasurePost, MeasureProps } from './client-messages'
import { HORIZONTAL, VERTICAL } from './glyphs'
import { defaultTabs, dirName, parseLayoutFile, serializeLayoutFile } from './layout-file'
import { RULE_ROWS, TOOLBAR_ROWS, activeOf, cellAt, contentArea, contentSize, gridRect, visibleRects } from './pane-area'
import {
  ACTIVATE_KEY, ACTIVE_SUFFIX, CHOICES_KEY, DIVIDER_KEY, HOTKEY_KEY, HOTKEYS, MEASURE_KEY, NONE_KEY, PLACE_KEY, PRESS_KEY, SLOT_KEY,
  collectCells, dividerKey, gridReady, holdsKey, parseDividerKey, pressWords,
} from './render-keys'
import { isScrollIn, scrollsKey } from '../skills/add-pane-grid-cell/pane-grid'
import { ROOT_PATH, allCells, cellsOf, childPath, findCell, moveDivider, rectAt, replaceAt, splitAt, splitRects } from './tree'
import type { Rect } from './tree'

// pane-grid: 탭(엔진 pane `grid-<이름>`)마다 배치 트리를 그리고, 칸에 규약 mod 가 그린 `cell:<plugin>` Box 를 놓는다.
// 설계는 docs/grid-and-tabs.md §3. 배치의 원본은 프로젝트 파일 `<설정 디렉터리>/pane-grid/projects/<이름>/layout.json` 이고
// (결정 20), state 는 그 사본이다. 프로젝트 파일이 없으면 global 파일 `<설정 디렉터리>/pane-grid/layout.json` 을 읽는다.

const LAYOUT = { plugin: 'pane-grid', key: 'layout' } as const
const SCROLL = { plugin: 'pane-grid', key: 'scroll' } as const
const SHOWN = { plugin: 'pane-grid', key: 'shown' } as const
const COMMAND = 'grid'
const PANE_PREFIX = 'grid-'
// 설정 디렉터리 아래의 경로. 설정 디렉터리는 CLAUDE_CONFIG_DIR, 없으면 $HOME/.claude 다(엔진이 설정 · plugin 을 두는 곳).
const OWN_DIR = 'pane-grid'
const GLOBAL_FILE = `${OWN_DIR}/layout.json`
const PROJECTS_DIR = `${OWN_DIR}/projects`
const FILE_NAME = 'layout.json'
const INVALID_NAME = 'layout.invalid.json'
// 0.4.x 의 global 파일 자리. 0.4.x 는 CLAUDE_CONFIG_DIR 과 무관하게 $HOME 아래 이 경로에 썼다. 설정 디렉터리 아래 global 파일이 없을 때
// 초기값으로 읽기만 한다(쓰지 않는다). CLAUDE_CONFIG_DIR 을 쓰는 사람의 0.4.x 배치가 0.5.0 에서 사라지지 않게 한다.
const LEGACY_GLOBAL_FILE = `.claude/${GLOBAL_FILE}`
// HOME 도 CLAUDE_CONFIG_DIR 도 없으면 설정 디렉터리를 정할 수 없어 파일을 읽지도 쓰지도 않는다(배치는 이 세션의 $.state 에만 있다).
const NO_FILE = 'no file (neither HOME nor CLAUDE_CONFIG_DIR is set)'
const COMMON_GIT_DIR = '/.git'
const SHOWN_POLL_MS = 1000
const ACTIVE_COLOR = 'green'
// 빈 칸 선택지의 hotkey 는 활성 칸에서만 1-9 를 붙인다. 칸마다 붙이면 같은 숫자가 겹친다.
const CHOICE_HOTKEYS = 9
// slot 을 채우지 않은 놓인 mod: 불러오지 않았거나, hooks/pane-grid.ts 가 slot 을 모르는 0.3.0 이전 사본이다.
const UNFILLED_HINT = 'not loaded, or its hooks/pane-grid.ts is older than pane-grid 0.3.0'

// 모듈 변수는 다시 불러오면 처음 값으로 돌아간다. 그려진 것은 모두 $.state 에서 읽고, 여기에는 다시 계산할 수 있는 것만 둔다.
const run = {
  home: '',
  config: '',
  // 마지막으로 읽은 $.session.root(). 이것이 바뀔 때만(`/cd` · worktree 이동) 프로젝트를 다시 정한다.
  root: '',
  // 프로젝트 키(projectOf)와 그 프로젝트 파일이 있는 디렉터리.
  project: '',
  dir: '',
  // 이 세션이 프로젝트 파일을 마지막으로 읽거나 쓴 때의 mtimeMs. 그때 파일이 없었으면 undefined.
  // 저장 전에 파일의 mtimeMs 가 이것과 다르면 다른 세션이 바꾼 것이므로 쓰지 않는다.
  mtimeMs: undefined as number | undefined,
  // 파일이 형식에 맞지 않아 기본 배치로 시작했으면 그 원문. 처음 저장할 때 프로젝트 디렉터리의 INVALID_NAME 으로 옮겨 남긴다.
  invalidText: undefined as string | undefined,
  // slash 명령이 다룰 탭. 보이는 grid 탭이 있으면 그것, 없으면 마지막으로 보였던 탭.
  current: '',
  measured: new Map<string, MeasureProps>(),
  // 칸 안의 `scrolls:<plugin>` Box 로 자기 행을 스스로 스크롤한다고 알린 아래 규약 mod. render 마다 다시 모은다.
  scrolling: new Set<string>(),
  // ensureLayout 이 진행 중인 다시 읽기. render 뒤 콜백 · watchShown · runAction 이 다른 dispatch 에서 함께 불러도 파일을 한 번만 읽는다.
  restoring: undefined as Promise<GridLayout> | undefined,
}

const noop = () => {}

const log = ($: EngineInterface, text: string) => $.ui.log(`pane-grid: ${text}`, { to: 'debug' })

const paneId = (tab: string) => `${PANE_PREFIX}${tab}`
const tabOf = (requestId: string) => requestId.slice(PANE_PREFIX.length)
const titleOf = (tab: GridTab) => (tab.zoomed ? `${tab.name} [Z]` : tab.name)

const readLayout = async ($: EngineInterface): Promise<GridLayout | undefined> => (await $.state.get(LAYOUT)).value

// 칸 내용 자리와 크기. 탭을 아직 그리지 않았거나 다른 칸을 zoom 해 가려졌으면 0 이다. zoom 한 칸은 grid 전체에 그린다.
const placements = (tabs: GridTab[], measuredOf: ReadonlyMap<string, MeasureProps>): Record<string, GridPlacement> => {
  const placed: Record<string, GridPlacement> = {}
  for (const tab of tabs) {
    const measured = measuredOf.get(tab.name)
    const rects = measured ? visibleRects(tab, gridRect(measured)) : new Map<string, Rect>()
    for (const cell of cellsOf(tab.root)) {
      if (!cell.plugin) continue
      const rect = rects.get(cell.id)
      const area = rect ? contentArea(rect) : { column: 0, row: 0, columns: 0, rows: 0 }
      placed[cell.plugin] = { tab: tab.name, requestId: paneId(tab.name), cell: cell.id, ...area, isActive: activeOf(tab) == cell.id }
    }
  }
  return placed
}

// 칸 id 마다 놓인 mod. 탭을 모두 본다(칸 id 는 탭을 통틀어 하나뿐이다).
const occupants = (tabs: GridTab[]) => new Map(allCells(tabs).map(cell => [cell.id, cell.plugin ?? ''] as const))

// 놓인 mod 가 바뀌었거나 없어진 칸의 스크롤 행 수를 지운다. 새 mod 는 맨 위부터 그려지고, 자기 행을 스스로 스크롤하는 mod 의
// 칸은 pane-grid 의 marginTop 이 0 으로 남는다.
const dropStaleScroll = async ($: EngineInterface, before: GridTab[], after: GridTab[]) => {
  const was = occupants(before)
  const now = occupants(after)
  const scroll: GridScroll = (await $.state.get(SCROLL)).value ?? {}
  const stale = Object.keys(scroll).filter(id => was.get(id) != now.get(id) || !now.has(id))
  if (stale.length == 0) return
  await update($, SCROLL, current => Object.fromEntries(Object.entries(current ?? {}).filter(([id]) => !stale.includes(id))))
  log($, `scroll reset for ${stale.join(',')}`)
}

const publish = async ($: EngineInterface, tabs: GridTab[]) => {
  await dropStaleScroll($, (await readLayout($))?.tabs ?? [], tabs)
  const placed = placements(tabs, run.measured)
  const layout = await update($, LAYOUT, (current): GridLayout => ({ version: 1, revision: (current?.revision ?? 0) + 1, tabs, placed }))
  log($, `layout revision=${layout.revision} tabs=${tabs.map(tab => tab.name).join(',')} placed=${Object.keys(placed).join(',')}`)
  return layout
}

// 탭 크기를 잰 뒤 칸 크기가 바뀌었을 때만 다시 쓴다. render 중에는 쓸 수 없으므로 render 가 끝난 뒤 부른다.
const publishPlacements = async ($: EngineInterface) => {
  const layout = await readLayout($)
  if (!layout) return
  const placed = placements(layout.tabs, run.measured)
  if (JSON.stringify(placed) == JSON.stringify(layout.placed)) return
  await publish($, layout.tabs)
}

// 프로젝트 파일이 없을 때 읽을 global 파일: 설정 디렉터리 아래 것, 없으면 0.4.x 의 자리. 둘 다 없으면 설정 디렉터리 아래 경로를 낸다.
const globalFile = async ($: EngineInterface) => {
  const own = `${run.config}/${GLOBAL_FILE}`
  const legacy = `${run.home}/${LEGACY_GLOBAL_FILE}`
  if (own == legacy || (await $.fs.exists(own))) return own
  return (await $.fs.exists(legacy)) ? legacy : own
}
const projectFile = () => `${run.dir}/${FILE_NAME}`

// 사람이 읽는 경로: $HOME 아래면 `~` 로 줄인다.
const shownPath = (path: string) => (run.home && path.startsWith(`${run.home}/`) ? `~${path.slice(run.home.length)}` : path)

// 없는 경로는 undefined. $.fs.stat 은 없는 경로에서 ENOENT 로 거부한다.
const statOf = ($: EngineInterface, path: string, options?: { resolve: boolean }) => $.fs.stat(path, options).catch(() => undefined)

const absoluteIn = (dir: string, path: string) => (path.startsWith('/') ? path : `${dir}/${path}`)

// `.git` 이 파일인 디렉터리(worktree · submodule)의 주 작업 트리. 그 파일의 `gitdir:` 이 가리키는 git 디렉터리에 `commondir` 가
// 있으면(worktree) 그것이 공통 git 디렉터리이고, 그 이름이 `.git` 이면 그 위가 주 작업 트리다. 그 밖(submodule 등)은 undefined.
const mainTreeOf = async ($: EngineInterface, dir: string) => {
  const gitdir = (await $.fs.read(`${dir}/.git`)).match(/^gitdir:\s*(.+)$/m)?.[1]?.trim()
  if (!gitdir) return undefined
  const own = absoluteIn(dir, gitdir)
  const pointer = `${own}/commondir`
  if (!(await $.fs.exists(pointer))) return undefined
  const common = (await statOf($, absoluteIn(own, (await $.fs.read(pointer)).trim()), { resolve: true }))?.realPath
  return common?.endsWith(COMMON_GIT_DIR) ? common.slice(0, -COMMON_GIT_DIR.length) : undefined
}

// dir 에서 위로 `.git` 을 찾는다. 디렉터리면 dir 이 주 작업 트리이고, 파일이면 mainTreeOf, 끝까지 없으면 fallback.
const findProject = async ($: EngineInterface, dir: string, fallback: string): Promise<string> => {
  const dotGit = await statOf($, `${dir}/.git`)
  if (dotGit?.kind == 'dir') return dir
  if (dotGit?.kind == 'file') return (await mainTreeOf($, dir)) ?? dir
  const cut = dir.lastIndexOf('/')
  return cut > 0 ? findProject($, dir.slice(0, cut), fallback) : fallback
}

// 프로젝트 키: root 가 속한 git 저장소의 주 작업 트리, git 밖이면 root. symbolic link 를 따라간 경로다.
// $.session.repo() 를 쓰지 않는다. repo() 는 shell `cd` 를 따라가서(작업 디렉터리 안의 중첩 저장소로 cd 하면 그 저장소를 낸다)
// 다시 정하는 순간의 셸 위치에 따라 키가 root 와 다른 저장소가 될 수 있다.
const projectOf = async ($: EngineInterface, root: string) => {
  const real = (await statOf($, root, { resolve: true }))?.realPath ?? root
  return findProject($, real, real)
}

// $.session.root() 를 읽어 프로젝트를 정한다. root 가 그대로면 아무것도 하지 않는다. 프로젝트가 바뀌었으면 true.
const resolveProject = async ($: EngineInterface) => {
  const root = await $.session.root()
  if (root == run.root) return false
  run.root = root
  const project = await projectOf($, root)
  if (project == run.project) return false
  run.project = project
  run.dir = `${run.config}/${PROJECTS_DIR}/${await dirName(project)}`
  run.mtimeMs = undefined
  run.invalidText = undefined
  log($, `project ${project} (root ${root}) -> ${run.dir}`)
  return true
}

// 프로젝트 파일에 쓴다. global 파일에는 쓰지 않는다. 이 세션이 마지막으로 읽거나 쓴 뒤 파일의 mtimeMs 가 바뀌었으면
// (다른 세션이 쓰거나 지웠으면) 쓰지 않고 false 를 돌려준다. 부른 쪽이 reloadChanged 로 다시 읽는다.
const persist = async ($: EngineInterface, tabs: GridTab[]) => {
  if (!run.config) return true
  const path = projectFile()
  const now = await statOf($, path)
  if (now?.mtimeMs != run.mtimeMs) {
    log($, `${path} changed by another session (mtimeMs ${run.mtimeMs} -> ${now?.mtimeMs}); not written`)
    return false
  }
  if (run.invalidText != undefined) {
    await $.fs.write(`${run.dir}/${INVALID_NAME}`, run.invalidText)
    log($, `kept the invalid layout file as ${run.dir}/${INVALID_NAME}`)
    run.invalidText = undefined
  }
  await $.fs.write(path, serializeLayoutFile(tabs, run.project))
  run.mtimeMs = (await $.fs.stat(path)).mtimeMs
  return true
}

// 프로젝트 파일이 있으면 그것을, 없으면 global 파일을 읽는다. 읽은 파일의 경로를 함께 돌려준다.
// mtimeMs 는 읽기 전에 잰다. 읽은 뒤에 재면 그 사이에 다른 세션이 쓴 것을 이 세션이 읽은 것으로 여겨 덮어쓸 수 있다.
// run.mtimeMs 를 이 파일의 것으로 정하고, 파일이 무효였으면 run.invalidText 에 원문을 남긴다(둘 다 persist 가 읽는다).
const loadFile = async ($: EngineInterface): Promise<{ tabs: GridTab[]; path: string }> => {
  // 앞서 읽은 무효 원문은 이번에 읽는 파일이 유효하거나 없으면 남기지 않는다.
  run.invalidText = undefined
  if (!run.config) return { tabs: defaultTabs(), path: NO_FILE }
  const own = await statOf($, projectFile())
  run.mtimeMs = own?.mtimeMs
  const path = own ? projectFile() : await globalFile($)
  if (!own && !(await $.fs.exists(path))) return { tabs: defaultTabs(), path }
  const text = await $.fs.read(path)
  const parsed = parseLayoutFile(text)
  if (parsed.isValid) return { tabs: parsed.tabs, path }
  run.invalidText = text
  log($, `layout file ${path} refused: ${parsed.reason}`)
  $.ui.toast(`pane-grid: ${shownPath(path)} is not a valid layout (${parsed.reason}); using one empty tab`)
  return { tabs: defaultTabs(), path }
}

// 엔진 pane 으로 여는 것: 탭마다 pane id 와 title. 이 값이 같으면 syncPanes 가 할 일이 없다.
const paneSpec = (tabs: GridTab[]) => tabs.map(tab => `${paneId(tab.name)}\t${titleOf(tab)}`).join('\n')

// 탭 목록과 엔진 pane 을 맞춘다. 같은 id 를 다시 열면 title 만 바뀐다.
const syncPanes = async ($: EngineInterface, tabs: GridTab[]) => {
  const ids = new Set(tabs.map(tab => paneId(tab.name)))
  for (const pane of await $.ui.panes()) {
    if (pane.id.startsWith(PANE_PREFIX) && !ids.has(pane.id)) await $.ui.close({ id: pane.id })
  }
  for (const tab of tabs) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab) })
}

const currentTab = async ($: EngineInterface, tabs: GridTab[]) => {
  const shown = (await $.state.get(SHOWN)).value
  const name = shown ?? run.current
  return tabs.some(tab => tab.name == name) ? name : tabs[0]?.name ?? name
}

// slash 명령과 hotkey 의 공통 입구. `tabName` 은 누름 · 칸 누름이 일어난 grid pane 의 탭이다. slash 명령은 그것이 없어 보이는 탭에 적용한다.
// 누름을 보이는 탭(SHOWN_POLL_MS 마다 읽는 SHOWN)에 적용하면, 탭을 바꾼 직후의 누름이 앞의 탭에 적용될 수 있다.
const runAction = async ($: EngineInterface, words: string[], tabName?: string) => {
  const layout = await ensureLayout($)
  const pressedIn = layout.tabs.some(tab => tab.name == tabName) ? tabName : undefined
  const outcome = apply(layout.tabs, pressedIn ?? (await currentTab($, layout.tabs)), words)
  const broken = checkOutcome(outcome)
  if (broken) return `refused: ${broken}`
  run.current = outcome.current
  if (outcome.isChanged) {
    if (!(await persist($, outcome.tabs))) return reloadChanged($)
    await publish($, outcome.tabs)
    // 활성 칸 · 칸 나누기 · 크기처럼 탭 목록과 title 이 그대로인 동작에서는 pane 을 다시 열지 않는다.
    if (paneSpec(outcome.tabs) != paneSpec(layout.tabs)) await syncPanes($, outcome.tabs)
  }
  const hidden = outcome.focus ? await showTab($, outcome.tabs, outcome.focus) : undefined
  const text = hidden ? `${outcome.text}; it is behind ${hidden}, click its tab to show it` : outcome.text
  log($, `action ${words.join(' ')}: ${text.split('\n')[0]}`)
  return text
}

// 탭을 보이게 한다. 엔진은 사람이 pane 을 쥐고 있으면 `focus` 를 거부하므로(PaneOpenArgs.focus) 그 탭이 뒤에 남을 수 있다.
// 그때 앞에 보이는 탭의 이름을 돌려준다. 보이게 했거나 보이는 grid 탭이 없으면 undefined.
const showTab = async ($: EngineInterface, tabs: GridTab[], name: string) => {
  const tab = tabs.find(item => item.name == name)
  if (!tab) return undefined
  await $.ui.open({ id: paneId(tab.name), title: titleOf(tab), focus: true })
  const shown = (await $.ui.panes()).find(item => item.isShown)
  return shown && shown.id != paneId(name) && shown.id.startsWith(PANE_PREFIX) ? tabOf(shown.id) : undefined
}

// 칸을 눌러 활성으로 한다. pane 에 키보드를 주어 hotkey 가 곧바로 그 pane 에서 눌리게 한다.
const activateCell = async ($: EngineInterface, tabName: string, id: string) => {
  await runAction($, ['select-cell', id], tabName)
  const layout = await readLayout($)
  const tab = layout?.tabs.find(item => item.name == tabName)
  if (tab) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab), focus: true })
}

// 분할선을 끄는 동안은 state 만 바꾸고, 놓았을 때(isFinal) 파일에 쓴다.
const dragDivider = async ($: EngineInterface, tabName: string, path: string, index: number, at: number, isFinal: boolean) => {
  const layout = await readLayout($)
  const tab = layout?.tabs.find(item => item.name == tabName)
  const measured = run.measured.get(tabName)
  if (!layout || !tab || !measured || tab.zoomed) return
  const node = splitAt(tab.root, path)
  const rect = rectAt(tab.root, path, gridRect(measured))
  if (!node || !rect) return
  const moved = moveDivider(node, node.kind == 'row' ? rect.width : rect.height, index, at)
  const tabs = moved === node ? layout.tabs : layout.tabs.map(item => (item.name == tabName ? { ...item, root: replaceAt(item.root, path, moved) } : item))
  if (moved !== node) await publish($, tabs)
  if (isFinal && !(await persist($, tabs))) $.ui.toast(`pane-grid: ${await reloadChanged($)}`)
}

// 원본 파일을 읽어 state 사본과 엔진 pane 을 다시 만든다. 쓴 값과 읽은 파일을 돌려준다: 한 dispatch 의 $.state.get 은 모두 같은
// 시점을 읽어 방금 쓴 값을 다시 읽지 못한다.
const loadLayout = async ($: EngineInterface) => {
  const { tabs, path } = await loadFile($)
  const layout = await publish($, tabs)
  await syncPanes($, tabs)
  return { layout, path }
}

const reload = async ($: EngineInterface) => {
  const { layout, path } = await loadLayout($)
  return `loaded ${layout.tabs.length} tab(s) from ${shownPath(path)}`
}

// 다른 세션이 바꾼 프로젝트 파일을 다시 읽는다. 이 세션의 바뀐 배치는 버린다. 알릴 글을 돌려준다.
const reloadChanged = async ($: EngineInterface) => {
  const { path } = await loadLayout($)
  return `refused: another session changed this project's layout; loaded ${shownPath(path)} again, do it once more`
}

const layoutFromFile = async ($: EngineInterface) => (await loadLayout($)).layout

// $.state 는 세션 id 마다 따로 있다. /clear 는 같은 프로세스를 새 세션 id 로 이어 가고 session.start 를 다시 부르지 않으므로
// (SessionEndInput.reason), 그 뒤에는 layout 사본이 비어 있다. 비어 있으면 원본 파일에서 다시 만든다. render 중에는 쓸 수 없으므로
// render hook 은 이것을 render 가 끝난 뒤 부른다.
const ensureLayout = async ($: EngineInterface): Promise<GridLayout> => {
  const layout = await readLayout($)
  if (layout) return layout
  if (run.restoring) return run.restoring
  log($, 'layout state is empty (a /clear starts a new session state); loading the layout file again')
  run.restoring = layoutFromFile($)
  try {
    return await run.restoring
  } finally {
    run.restoring = undefined
  }
}

const watchShown = async ($: EngineInterface) => {
  // `/cd` · worktree 이동은 mod 에 알리지 않으므로(classic.CwdChanged 도 오지 않는다) root 를 여기서 읽어 비교한다.
  if (await resolveProject($)) $.ui.toast(`pane-grid: the session moved to ${shownPath(run.project)}; ${await reload($)}`)
  // grid 탭이 가려져 있으면 render hook 이 불리지 않는다. 규약 mod 는 layout 이 비면 자기 pane 으로 돌아가므로 여기서도 되살린다.
  await ensureLayout($)
  const pane = (await $.ui.panes()).find(item => item.isShown && item.id.startsWith(PANE_PREFIX))
  const shown: GridShown = pane ? tabOf(pane.id) : null
  if (shown) run.current = shown
  const held = await $.state.get(SHOWN)
  if (held.version == 0 || held.value != shown) await $.state.set(SHOWN, shown)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.home = String((await $.env.get('HOME')) ?? '')
    const config = ((await $.env.get('CLAUDE_CONFIG_DIR')) || (run.home ? `${run.home}/.claude` : '')).replace(/\/+$/, '')
    // 상대 경로 CLAUDE_CONFIG_DIR 은 시작한 디렉터리 기준으로 고정한다. $.fs 는 상대 경로를 지금 작업 디렉터리 기준으로 풀어 `/cd` 뒤에 다른 곳을 읽는다.
    run.config = config && !config.startsWith('/') ? `${await $.session.cwd()}/${config}` : config
    if (!run.config) log($, `${NO_FILE}; the layout is kept in this session only`)
    // 파일 읽기에 기대지 않는 등록을 먼저 한다. 파일을 읽지 못해 reload 가 거부돼도 /grid 와 주기(watchShown)는 남고,
    // 주기의 ensureLayout 이 다시 읽는다. 주기는 resolveProject 뒤에 건다(run.root 가 비어 있으면 첫 주기가 「moved」로 여긴다).
    await $.command.register({ name: COMMAND, description: 'pane-grid: split panes into a grid of mods, tmux style', argumentHint: `<${VERBS.join('|')}>` })
    await resolveProject($)
    $.clock.every(SHOWN_POLL_MS, () => void watchShown($))
    await reload($)
    return next(e)
  }).catch(($, e, next) => {
    log($, `start failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const words = e.args.trim().split(/\s+/).filter(Boolean)
    if (words[0] == 'reload') return { text: await reload($) }
    return { text: await runAction($, words) }
  }).catch(($, e, next) => {
    log($, `command failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : { text: 'pane-grid: the command failed; see the debug log' }
  })

  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    const measured = run.measured.get(tabOf(e.requestId))
    if (!tab || !measured) return {}
    const id = cellAt(tab, measured, e.pointer)
    if (!id) return {}
    // 자기 행을 스스로 스크롤하는 아래 규약 mod 의 칸: 그 mod 의 ui.scroll hook 에 넘긴다. 칸 제목 줄의 휠은 버린다.
    const plugin = findCell(tab.root, id)?.plugin
    if (plugin && run.scrolling.has(plugin)) return isScrollIn(layout?.placed[plugin], e) ? next(e) : {}
    await update($, SCROLL, scroll => ({ ...scroll, [id]: Math.max((scroll?.[id] ?? 0) + e.by, 0) }))
    return {}
  }).catch(($, e, next) => {
    log($, `scroll failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })

  // grid pane 의 Button 누름. 규약 mod 가 pane-grid 위에 있어도 아래에 있어도 같은 hook 이 받는다.
  // 동작은 chain 이 끝난 뒤에 한다. 탭을 닫는 동작(k · break 등)은 이 pane 을 닫고, 그 뒤의 next(e) 는 chain 맨 아래의
  // Button onPress 를 handle 로 부르는데 pane 과 함께 그 handle 이 없어져 `no handler is held under handle` 로 실패했다.
  on('ui.press', { component: 'Pane', requestId: /^grid-/, element: PRESS_KEY }, async ($, e, next) => {
    const pressed = await next(e)
    const words = pressWords(e.element)
    if (words) {
      const text = await runAction($, words, tabOf(e.requestId))
      $.ui.toast(`pane-grid: ${text.split('\n')[0]}`)
    }
    return pressed
  }).catch(($, e, next) => {
    log($, `press failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : { element: e.element }
  })

  // 칸 누름(activate:<cell>)과 분할선 끌기(divider:<path>:<index>). data 는 surface module 이 보낸 것이므로 형식을 검사한다.
  on('ui.message', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const tabName = tabOf(e.requestId)
    // 필드 이름을 client-messages.ts 의 타입 키로 적는다. 한쪽 이름이 바뀌면 tsc 가 실패한다.
    const data: Partial<Record<keyof (DividerPost & MeasurePost & ActivatePost), unknown>> = typeof e.data == 'object' && e.data != null ? e.data : {}
    if (e.element.startsWith(MEASURE_KEY) && Number.isInteger(data.columns) && Number.isInteger(data.rows)) await publishPlacements($)
    if (e.element.startsWith(ACTIVATE_KEY) && data.activate == true) await activateCell($, tabName, e.element.slice(ACTIVATE_KEY.length))
    const divider = e.element.startsWith(DIVIDER_KEY) ? parseDividerKey(e.element) : undefined
    if (divider && typeof data.at == 'number' && Number.isInteger(data.at)) await dragDivider($, tabName, divider.path, divider.index, data.at, data.isFinal == true)
    return next(e)
  }).catch(($, e, next) => {
    log($, `message failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : {}
  })

  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    if (!layout) $.clock.after(0, () => void ensureLayout($))
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    if (!tab) return next(e)
    const scroll: GridScroll = (await $.state.get(SCROLL)).value ?? {}
    const below = await next(e)
    const cells = new Map<string, RenderElement>()
    collectCells(below, cells)
    for (const [plugin, cell] of cells) {
      if (holdsKey(cell, scrollsKey(plugin))) run.scrolling.add(plugin)
      else run.scrolling.delete(plugin)
    }
    const ready = gridReady(next.trace)
    const measured = { columns: e.props.bodyColumns, rows: e.props.scroll.bodyRows }
    const before = run.measured.get(tab.name)
    const isResized = !before || before.columns != measured.columns || before.rows != measured.rows
    run.measured.set(tab.name, measured)
    const { Box, Text, Button } = $.ui.resolve(e)
    // Client(surface module)는 terminal · desktop 의 표에만 있다. 다른 surface 에서는 분할선을 글자로 그리고, 칸 누름은 덮지 않는다.
    // Client 는 `h('Client', { module: './<name>.tsx', … })` 로 적는다. plugin directory 의 검증은 Client 요소를 이 꼴(또는 `<Client module=… />`)로만 읽고,
    // 표에서 꺼낸 Client 를 값으로 쓰면(조건 · 대입) 차단한다(MOD_IMPORT_DYNAMIC_COMPUTED). 그래서 그릴지는 surface 로 가른다.
    const hasClient = e.surface == 'terminal' || e.surface == 'desktop'
    // 잰 크기는 measure Client 가 ui.message 로 돌려보내 그 hook 이 칸 크기를 쓴다. Client 가 없는 surface 에서는 render 가 끝난 뒤 쓴다.
    if (isResized && !hasClient) $.clock.after(0, () => void publishPlacements($))

    // 빈 칸: pane-grid 아래의 규약 mod(trace) 를 Button 으로 늘어놓는다. 위의 규약 mod 는 이 `choices:` Box 에 자기 Button 을 더한다.
    // 누름은 ui.press hook 이 받아 그 칸에 놓고(다른 칸에 있던 것은 옮긴다) 그 칸을 활성으로 한다.
    const drawChoices = (id: string, isActive: boolean): RenderElement => (
      <Box key={`${CHOICES_KEY}${id}${isActive ? ACTIVE_SUFFIX : ''}`} flexDirection="column">
        <Text dimColor>empty. place a mod here:</Text>
        {ready.map((plugin, index) => {
          const from = layout?.placed[plugin]?.cell
          const label = from ? `${plugin} (move from ${from})` : plugin
          const hotkey = isActive && index < CHOICE_HOTKEYS ? String(index + 1) : undefined
          return <Button key={`${PLACE_KEY}${id}:${plugin}`} plain label={label} hotkey={hotkey} onPress={noop} />
        })}
        {ready.length == 0 ? <Box key={`${NONE_KEY}${id}`}><Text dimColor>no grid-ready mod is loaded</Text></Box> : null}
      </Box>
    )

    // 놓인 칸: `slot:` Box 안에 아래 규약 mod 의 `cell:` Box 를 넣는다. 위의 규약 mod 는 이 Box 의 children 을 자기 칸으로 바꾼다.
    const drawSlot = (plugin: string): RenderElement => {
      const content = cells.get(plugin)
      const note = ready.includes(plugin) ? `${plugin} draws nothing here` : `${plugin} is ${UNFILLED_HINT}`
      return <Box key={`${SLOT_KEY}${plugin}`} flexDirection="column">{content ?? <Text dimColor>{note}</Text>}</Box>
    }

    // 칸: 제목 1행과 내용. 활성이 아닌 칸에는 그 칸 전체를 덮는 activate Client 를 마지막에 그려(위에 칠해진다) 어디를 눌러도 활성이 되게 한다.
    const drawCell = (id: string, rect: Rect): RenderElement => {
      const cell = findCell(tab.root, id)
      const isActive = id == activeOf(tab)
      const size = contentSize(rect)
      const title = `${id} ${cell?.plugin ?? '-'}`
      return (
        <Box key={`cellbox:${id}`} width={rect.width} height={rect.height} flexDirection="column" position="relative">
          {isActive ? <Text color={ACTIVE_COLOR} bold wrap="truncate">{title}</Text> : <Text dimColor wrap="truncate">{title}</Text>}
          <Box width={size.columns} height={size.rows} overflow="hidden" flexDirection="column">
            <Box marginTop={-(scroll[id] ?? 0)} flexShrink={0} flexDirection="column">{cell?.plugin ? drawSlot(cell.plugin) : drawChoices(id, isActive)}</Box>
          </Box>
          {isActive || !hasClient ? null : (
            <Box position="absolute" top={0} left={0} width={rect.width} height={rect.height}>
              {h('Client', { key: `${ACTIVATE_KEY}${id}`, module: './activate.tsx', props: null, width: rect.width, height: rect.height })}
            </Box>
          )}
        </Box>
      )
    }

    const drawDivider = (kind: 'row' | 'column', path: string, index: number, start: number, rect: Rect): RenderNode | null | undefined => {
      const key = dividerKey(path, index)
      if (hasClient) return h('Client', { key, module: './divider.tsx', props: { kind, start, length: kind == 'row' ? rect.height : rect.width } satisfies DividerProps, width: rect.width, height: rect.height })
      const line = kind == 'row' ? Array.from({ length: rect.height }, () => VERTICAL).join('\n') : HORIZONTAL.repeat(rect.width)
      return <Box key={key} width={rect.width} height={rect.height}><Text dimColor>{line}</Text></Box>
    }

    // 나눈 노드: 자식 사이마다 분할선을 끼운다.
    const drawNode = (node: GridNode, rect: Rect, path: string): RenderElement => {
      if (node.kind == 'cell') return drawCell(node.id, rect)
      const { parts, dividers } = splitRects(node, rect)
      return (
        <Box flexDirection={node.kind} width={rect.width} height={rect.height}>
          {parts.flatMap((part, index) => {
            const divider = dividers[index]
            const drawn = drawNode(part.node, part.rect, childPath(path, index))
            return divider ? [drawn, drawDivider(node.kind, path, divider.index, divider.start, divider.rect)] : [drawn]
          })}
        </Box>
      )
    }

    // 고정 구분선. 분할선과 같은 글자로 그리지만 Client 가 아니므로 끌 수 없다.
    const drawRule = () => <Box width={measured.columns} height={RULE_ROWS}><Text dimColor wrap="truncate">{HORIZONTAL.repeat(measured.columns)}</Text></Box>

    const area = gridRect(measured)
    const grid = tab.zoomed ? drawCell(tab.zoomed, area) : drawNode(tab.root, area, ROOT_PATH)
    return (
      <Box flexDirection="column">
        {drawRule()}
        <Box height={TOOLBAR_ROWS} flexWrap="wrap" columnGap={1} overflow="hidden">
          {HOTKEYS.map(item => <Button key={`${HOTKEY_KEY}${item.key}`} plain hotkey={item.key} label={item.label} onPress={noop} />)}
        </Box>
        {drawRule()}
        {grid}
        {hasClient ? h('Client', { key: `${MEASURE_KEY}${tab.name}`, module: './measure.tsx', props: measured satisfies MeasureProps, width: 0, height: 0 }) : null}
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `render failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })
}
