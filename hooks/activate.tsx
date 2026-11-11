import type { ClientModule } from 'claude-code'
import type { ActivatePost } from './client-messages'

// 활성이 아닌 칸 위에 덮는 빈 영역. 그 칸 어디를 눌러도(글자 · Button 위도) 그 칸을 활성으로 한다.
// 글자 위의 누름은 어느 hook 에도 오지 않으므로 칸 위에 덮어야 한다(docs/grid-and-tabs.md §4.1 8회차).
// 활성 칸에는 덮지 않으므로 규약 mod 의 Button 은 활성 칸에서 눌린다. 휠은 덮은 영역과 관계없이 ui.scroll 로 간다.

type ActivateState = { isStarted: true }

const Activate: ClientModule<null, ActivateState> = (_props, surface) => {
  if (surface.state == undefined) {
    surface.onPointer(event => {
      const post: ActivatePost = { activate: true }
      if (event.type == 'down') surface.post(post)
    })
    surface.setState({ isStarted: true })
  }
  const { Box } = surface.elements
  return <Box />
}

export default Activate
