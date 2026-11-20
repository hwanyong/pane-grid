import type { EngineInterface, Register, RenderElement, RenderInput } from 'claude-code'
import { fillSlot, hoversKey, isScrollIn, offerChoice, offerKey, readPlacement, scrollsKey } from './pane-grid'

// k38 시험용 plugin(kanban-main 의 flow-probe 사본). member id 두 개를 낸다.
// `flow-probe`: Box hover 툴팁 NODE-A · NODE-B, Button `probe-btn`, 채움 30줄. DECLARES_HOVERS 가 true 면 `hovers:` Box 를 그린다.
//   툴팁은 hover.scope 로 노드와 묶어 칸 안(내용 영역 안)에 두고 트리 끝에 그린다(뒤에 그린 형제가 툴팁 위에 덮어 그려지지 않게).
// `flow-probe.scroll`: `scrolls:` Box 를 그리고 자기 ui.scroll hook 으로 40줄을 스스로 스크롤한다.
// 모든 사건을 debug log 에 `k38probe: ...` 로 남긴다.
const PLUGIN = 'flow-probe'
const HOVER_ID = PLUGIN
const SCROLL_ID = `${PLUGIN}.scroll`
const MEMBERS = [HOVER_ID, SCROLL_ID]
const DECLARES_HOVERS = true
const FILLER_ROWS = 30
const SCROLL_ROWS = 40
const run = { presses: 0, offset: 0 }

const log = ($: EngineInterface, text: string) => $.ui.log(`k38probe: ${text}`, { to: 'debug' })

const drawHover = ($: EngineInterface, e: RenderInput): RenderElement => {
  const { Box, Text, Button } = $.ui.resolve(e)
  const filler = Array.from({ length: FILLER_ROWS }, (_, index) => <Text key={`fill-${index}`}>{`filler ${String(index + 1).padStart(2, '0')}`}</Text>)
  return (
    <Box key={`cell:${HOVER_ID}`} flexDirection="column">
      {DECLARES_HOVERS ? <Box key={hoversKey(HOVER_ID)} /> : null}
      <Box key="probe-node-a" borderStyle="round" width={24} hover={{ scope: 'probe-a', borderColor: 'green' }}>
        <Text>NODE-A hover me</Text>
      </Box>
      <Text>row between</Text>
      <Box key="probe-node-b" borderStyle="round" width={24} hover={{ scope: 'probe-b', borderColor: 'green' }}>
        <Text>NODE-B hover me</Text>
      </Box>
      <Button key="probe-btn" label={`PRESS-ME count=${run.presses}`} onPress={() => {}} />
      {filler}
      <Box position="absolute" top={3} left={26} display="none" hover={{ display: 'flex', scope: 'probe-a' }} borderStyle="single">
        <Text>TOOLTIP-A</Text>
      </Box>
      <Box position="absolute" top={6} left={26} display="none" hover={{ display: 'flex', scope: 'probe-b' }} borderStyle="single">
        <Text>TOOLTIP-B</Text>
      </Box>
    </Box>
  )
}

const drawScroll = ($: EngineInterface, e: RenderInput): RenderElement => {
  const { Box, Text } = $.ui.resolve(e)
  const rows = Array.from({ length: SCROLL_ROWS }, (_, index) => `own row ${String(index + 1).padStart(2, '0')}`).slice(run.offset)
  return (
    <Box key={`cell:${SCROLL_ID}`} flexDirection="column">
      <Box key={scrollsKey(SCROLL_ID)} />
      <Text bold>{`SCROLL-HEADER offset=${run.offset}`}</Text>
      {rows.map(row => <Text key={row}>{row}</Text>)}
    </Box>
  )
}

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: /^grid-/, plugin: 'pane-grid' }, async ($, e, next) => {
    const below = await next(e)
    const { Box, Button } = $.ui.resolve(e)
    const appended: RenderElement[] = []
    let tree = below
    for (const memberId of MEMBERS) {
      const placement = await readPlacement($, memberId)
      tree = offerChoice(tree, memberId, placement, choice => <Button key={choice.key} plain label={choice.label} hotkey={choice.hotkey} onPress={() => {}} />)
      appended.push(<Box key={offerKey(memberId)} />)
      if (!placement || placement.requestId != e.requestId) continue
      const cell = memberId == HOVER_ID ? drawHover($, e) : drawScroll($, e)
      const filled = fillSlot(tree, memberId, cell)
      if (filled) tree = filled
      else appended.push(cell)
    }
    return <Box flexDirection="column">{tree}{appended}</Box>
  })

  on('ui.press', { component: 'Pane', requestId: /^grid-/, element: 'probe-btn', plugin: PLUGIN }, async ($, e, next) => {
    run.presses += 1
    log($, `press ${e.element} count=${run.presses}`)
    return next(e)
  })

  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    if (!isScrollIn(await readPlacement($, SCROLL_ID), e)) return next(e)
    run.offset = Math.min(Math.max(run.offset + e.by, 0), SCROLL_ROWS - 1)
    log($, `scroll by=${e.by} offset=${run.offset} pointer=${JSON.stringify(e.pointer)}`)
    return {}
  })
}
