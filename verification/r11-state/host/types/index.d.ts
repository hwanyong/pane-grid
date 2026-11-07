// host 가 쓰는 배치. cells: grid pane id 마다 그 pane 에 칸을 둘 mod 이름.
export type R11Layout = { version: number; cells: Record<string, string[]> }

declare module 'claude-code' {
  interface PluginState {
    'pane-grid-r11-host': { layout: R11Layout }
  }
}
