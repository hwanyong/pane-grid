import type { ClientModule } from 'claude-code'
import type { MeasurePost, MeasureProps } from './client-messages'

// render 가 잰 grid pane 크기를 hooks module 의 ui.message hook 에 돌려보낸다. 크기를 state 에 쓰는 일은 render 중에 할 수 없고
// (엔진: `state.set: denied: it was made while ui.render is being dispatched`), handler 인 ui.message hook 에서는 할 수 있다.
// 영역은 0칸이라 화면에 아무것도 그리지 않고 pointer 도 받지 않는다. 크기가 바뀐 props 를 받을 때만 보낸다.

type MeasureState = { sent: string }

const Measure: ClientModule<MeasureProps, MeasureState> = (props, surface) => {
  const text = JSON.stringify(props)
  if (surface.state?.sent != text) {
    const post: MeasurePost = props
    surface.post(post)
    surface.setState({ sent: text })
  }
  const { Box } = surface.elements
  return <Box />
}

export default Measure
