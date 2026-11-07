// member 가 쓰는 값. ownPane: 자기 pane 을 지금 열어 두었는가.
export type R20OwnPane = boolean

declare module 'claude-code' {
  interface PluginState {
    'pane-grid-r20-member': { ownPane: R20OwnPane }
  }
}
