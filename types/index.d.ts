// pane-grid 의 state 계약. 이 파일이 배치 형식의 원본이다(docs/grid-and-tabs.md 결정 9).
// 규약 mod 는 이 파일을 복사하지 않고, 읽은 값의 `version` 이 GRID_VERSION 과 같은지 실행 중에 검사한다.

// 배치 형식의 판. 형식을 바꾸면 올린다.
export type GridVersion = 1

// 칸 하나. `plugin` 이 없으면 빈 칸이다.
export type GridCell = { kind: 'cell'; id: string; plugin?: string }

// 나눈 노드의 자식 하나와 그 자식이 차지하는 비율. 한 노드의 `size` 합은 100 이다.
// 자식과 비율을 한 객체에 두어, 두 목록의 길이가 어긋나는 상태를 형식이 갖지 않게 했다.
export type GridChild = { node: GridNode; size: number }

// 칸을 나란히 놓는 노드. `row` 는 좌우, `column` 은 위아래다(tmux 배치 문자열의 `{}` · `[]`).
export type GridSplit = { kind: 'row' | 'column'; children: GridChild[] }

export type GridNode = GridCell | GridSplit

// 탭 하나 = 엔진 pane 하나(`grid-<name>`). `active` 는 활성 칸 id, `zoomed` 는 zoom 한 칸 id.
export type GridTab = { name: string; root: GridNode; active: string; zoomed?: string }

// 규약 mod 가 읽는 자기 칸. pane-grid 가 그 탭 pane 을 그릴 때 잰 칸 내용 크기다.
export type GridPlacement = { tab: string; requestId: string; cell: string; columns: number; rows: number }

// `layout`: 탭 목록과, 칸에 넣은 mod 마다 그 자리. mod 하나는 한 칸에만 놓인다(결정 6).
export type GridLayout = {
  version: GridVersion
  revision: number
  tabs: GridTab[]
  placed: Record<string, GridPlacement>
}

// `scroll`: 칸 id 마다 내용을 위로 민 행 수.
export type GridScroll = Record<string, number>

// `shown`: 지금 보이는 탭 이름. 어느 grid pane 도 보이지 않으면 null.
export type GridShown = string | null

declare module 'claude-code' {
  interface PluginState {
    'pane-grid': { layout: GridLayout; scroll: GridScroll; shown: GridShown }
  }
}
