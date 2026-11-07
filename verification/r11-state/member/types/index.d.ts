// member 가 쓰는 값. count: 4초마다 늘리는 시험 값, Button press 마다 100 을 더한다.
export type R11Count = number

declare module 'claude-code' {
  interface PluginState {
    'pane-grid-r11-member': { count: R11Count }
  }
}
