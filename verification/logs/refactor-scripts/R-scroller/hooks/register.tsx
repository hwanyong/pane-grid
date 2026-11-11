import type { Register } from 'claude-code'
import { fillSlot, isScrollIn, offerChoice, readPlacement, scrollsKey } from './pane-grid'

// k12 R 묶음(F63) 시험용 member. docs/add-pane-grid-cell.md Step 3 · Step 7 그대로 칸을 그리고, 자기 칸으로 온 ui.scroll 을
// debug log 에 `rscroller: scroll ...` 으로 적는다. 실행 전에 그 트리의 skills/add-pane-grid-cell/pane-grid.ts 를 hooks/pane-grid.ts 로 복사한다.
const PLUGIN = 'r-scroller'

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const placement = await readPlacement($, PLUGIN)
    const below = await next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const offered = offerChoice(below, PLUGIN, placement, choice => <Button key={choice.key} plain label={choice.label} hotkey={choice.hotkey} onPress={() => {}} />)
    if (!placement || placement.requestId != e.requestId) return offered
    const cell = (
      <Box key={`cell:${PLUGIN}`} flexDirection="column">
        <Box key={scrollsKey(PLUGIN)} />
        <Text>rows of r-scroller</Text>
      </Box>
    )
    return fillSlot(offered, PLUGIN, cell) ?? <Box flexDirection="column">{offered}{cell}</Box>
  })

  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const placement = await readPlacement($, PLUGIN)
    if (!isScrollIn(placement, e)) return next(e)
    $.ui.log(`rscroller: scroll by=${e.by} pointer=${JSON.stringify(e.pointer)} placement=${JSON.stringify({ column: placement?.column, columns: placement?.columns })}`, { to: 'debug' })
    return {}
  })
}
