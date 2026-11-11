// Client 모듈(divider.tsx · measure.tsx · activate.tsx)과 register.tsx 가 주고받는 props · post data 의 모양.
// 타입만 둔다. register.tsx 의 ui.message hook 은 data 가 Client 에서 온 것이라 실행 중에도 이 모양인지 검사한다.

export type DividerProps = { kind: 'row' | 'column'; start: number; length: number }
export type DividerPost = { at: number; isFinal: boolean }
export type MeasureProps = { columns: number; rows: number }
export type MeasurePost = MeasureProps
export type ActivatePost = { activate: true }
