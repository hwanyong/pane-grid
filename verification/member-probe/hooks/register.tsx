import type { EngineInterface, Register } from 'claude-code'
import { readPlacement } from './pane-grid'

// 시험용 plugin. 실행 전에 skills/add-pane-grid-cell/pane-grid.ts 를 hooks/pane-grid.ts 로 복사한다(엔진은 plugin 폴더 밖의 import 를
// 거부한다. .gitignore 에 있다). member 쪽 읽기 모듈의 readPlacement 가 내는 값을
// 1초마다 읽어, 바뀌었을 때만 debug log 에 적는다. pane-grid 가 프로젝트 파일에서 읽은 배치를 member 가 같은 값으로 받는지 본다.
const PLUGINS = ['usage-gauge', 'filetree'] as const
const POLL_MS = 1000

const seen = { last: '' }

const placements = async ($: EngineInterface) => {
  const pairs = await Promise.all(PLUGINS.map(async plugin => [plugin, (await readPlacement($, plugin)) ?? null] as const))
  return JSON.stringify(Object.fromEntries(pairs))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.clock.every(POLL_MS, async () => {
      const now = await placements($)
      if (now == seen.last) return
      $.ui.log(`k8member: readPlacement ${now}`, { to: 'debug' })
      seen.last = now
    })
    return next(e)
  })
}
