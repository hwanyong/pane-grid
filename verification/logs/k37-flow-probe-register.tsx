import type { Register, RenderElement } from 'claude-code'
import { fillSlot, offerChoice, offerKey, readPlacement } from './pane-grid'

// k37 시험용 plugin. pane 두 개를 member id `flow-probe` · `flow-probe.b` 로 내고, 각 칸에 자기 글을 그린다.
// DRAWS_OFFER 를 false 로 바꾼 사본(flow-probe-nooffer)은 pane-grid 보다 뒤에 로드될 때 `offer:` Box 를 그리지 않는다(깨 보기).
const PLUGIN = 'flow-probe'
const MEMBERS = [PLUGIN, `${PLUGIN}.b`]
const BODIES: Record<string, string> = { [PLUGIN]: 'PROBE-A body', [`${PLUGIN}.b`]: 'PROBE-B body' }
const DRAWS_OFFER = true

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: /^grid-/, plugin: 'pane-grid' }, async ($, e, next) => {
    const below = await next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const appended: RenderElement[] = []
    let tree = below
    for (const memberId of MEMBERS) {
      const placement = await readPlacement($, memberId)
      tree = offerChoice(tree, memberId, placement, choice => <Button key={choice.key} plain label={choice.label} hotkey={choice.hotkey} onPress={() => {}} />)
      if (DRAWS_OFFER) appended.push(<Box key={offerKey(memberId)} />)
      if (!placement || placement.requestId != e.requestId) continue
      const cell = <Box key={`cell:${memberId}`} flexDirection="column"><Text>{`${BODIES[memberId]} ${placement.columns}x${placement.rows}`}</Text></Box>
      const filled = fillSlot(tree, memberId, cell)
      if (filled) tree = filled
      else appended.push(cell)
    }
    return appended.length == 0 ? tree : <Box flexDirection="column">{tree}{appended}</Box>
  })
}
