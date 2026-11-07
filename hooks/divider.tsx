import type { ClientModule } from 'claude-code'

// 나란히 놓은 두 칸 사이의 분할선. 끌면 pointer 가 놓인 자리를 hooks module 에 보낸다(ui.message).
// `start` 는 부모 사각형 시작에서 이 분할선까지의 칸 수다. pointer 좌표는 이 분할선 영역 기준이므로 `start` 를 더해 부모 기준 자리로 바꾼다.
// 분할선은 그려질 때마다 옮겨 가므로, 같은 그리기에서 온 `start` 와 pointer 좌표를 더해야 자리가 어긋나지 않는다.

type DividerProps = { kind: 'row' | 'column'; start: number; length: number }
type DividerState = { isHeld: boolean }

const VERTICAL = '│'
const HORIZONTAL = '─'
const HELD_COLOR = 'green'

const Divider: ClientModule<DividerProps, DividerState> = (props, surface) => {
  // listener 는 그릴 때마다 다시 건다(나중 것이 앞 것을 바꾼다). 처음 건 listener 는 처음 props 의 start 를 계속 써서 끄는 만큼 덜 움직였다.
  surface.onPointer(event => {
    if (event.type == 'down' && event.button == 'left') surface.setState({ isHeld: true })
    if (!surface.state?.isHeld) return
    if (event.type == 'move' || event.type == 'up') surface.post({ at: props.start + (props.kind == 'row' ? event.x : event.y), isFinal: event.type == 'up' })
    if (event.type == 'up') surface.setState({ isHeld: false })
  })
  const { Box, Text } = surface.elements
  const color = surface.state?.isHeld ? HELD_COLOR : undefined
  if (props.kind == 'row') return <Box flexDirection="column">{Array.from({ length: props.length }, (_, row) => <Text key={`d${row}`} dimColor={!color} color={color}>{VERTICAL}</Text>)}</Box>
  return <Text dimColor={!color} color={color}>{HORIZONTAL.repeat(props.length)}</Text>
}

export default Divider
