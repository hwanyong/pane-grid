// host 가 쓰는 배치. cells: grid 에 칸을 둘 member mod 이름. offsets: 칸 id 마다 내용의 첫 행.
export type R20Layout = { version: number; cells: string[]; offsets: Record<string, number> }

declare module 'claude-code' {
  interface PluginState {
    'pane-grid-r20-host': { layout: R20Layout }
  }
}
