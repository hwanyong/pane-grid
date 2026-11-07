import type { PluginState } from 'claude-code'

// 배치 형식의 이름들. 원본은 types/index.d.ts 의 state 계약이고, 여기서는 그 계약이 PluginState 에 더한 형식에서 꺼내기만 한다.
// mod 가 types/index.d.ts 를 import 하지 않는 이유: `claude plugin validate` 는 계약 파일이 import 없이 `declare module` 을 담기를 요구하고,
// plugin directory 의 검증은 mod 가 불러올 수 있는 파일에 `declare` 가 있으면 차단한다(MOD_SOURCE_UNCERTAIN).
type State = PluginState['pane-grid']

export type GridLayout = State['layout']
export type GridScroll = State['scroll']
export type GridShown = State['shown']
export type GridVersion = GridLayout['version']
export type GridPlacement = GridLayout['placed'][string]
export type GridTab = GridLayout['tabs'][number]
export type GridNode = GridTab['root']
export type GridCell = Extract<GridNode, { kind: 'cell' }>
export type GridSplit = Extract<GridNode, { kind: 'row' | 'column' }>
export type GridChild = GridSplit['children'][number]
