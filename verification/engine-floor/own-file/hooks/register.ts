import type { EngineInterface, Register } from 'claude-code'
import { placementIn } from './pane-grid'

// 엔진 하한 시험: 가이드의 두 번째 모양. pane-grid 의 layout 을 이 파일 안에서 읽고 placementIn 만 import 한다.
// ui.render hook 은 이 파일의 function declaration 으로, ui.scroll hook 은 hook 본문에서 바로 읽는다.
// session.start hook 은 가이드 Step 4 의 openPane 처럼 같은 파일의 화살표 함수를 거쳐 function declaration 을 부른다.
// 이 mod 를 쓰는 차례는 verification/engine-floor/README.md 에 있다.
const PLUGIN = 'pane-grid-floor-own-file'
const PANE = 'floor-own-file'

async function readPlacement($: EngineInterface, plugin: string) {
  const read = await $.state.get({ plugin: 'pane-grid', key: 'layout' } as never) as { value?: unknown }
  return placementIn(read.value, plugin)
}

async function readShownTab($: EngineInterface) {
  const read = await $.state.get({ plugin: 'pane-grid', key: 'shown' } as never) as { value?: unknown }
  return typeof read.value == 'string' ? read.value : null
}

const openPane = async ($: EngineInterface) => {
  if (await readPlacement($, PLUGIN)) return
  await $.ui.open({ id: PANE, title: PANE })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await openPane($)
    return result
  })
  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const placement = await readPlacement($, PLUGIN)
    const shown = await readShownTab($)
    $.ui.log(`floor-own-file: cell=${placement?.cell} shown=${shown}`, { to: 'debug' })
    return next(e)
  })
  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const read = await $.state.get({ plugin: 'pane-grid', key: 'layout' } as never) as { value?: unknown }
    $.ui.log(`floor-own-file: scroll cell=${placementIn(read.value, PLUGIN)?.cell}`, { to: 'debug' })
    return next(e)
  })
}
