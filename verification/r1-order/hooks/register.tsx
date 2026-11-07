import type { Register } from 'claude-code'

// R1: 이 mod 의 Pane render hook 이 설치된 mod(filetree)의 pane render 를 받는지,
// 받는다면 next(e) 가 그 mod 의 트리를 반환하는지(이 mod 가 위에서 실행되는지) 기록한다.
// 트리는 바꾸지 않고 그대로 반환한다. 같은 내용의 줄은 한 번만 남긴다.
// 설치본(R1b)으로 쓰면 사용자의 모든 세션에서 로드되므로, 작업 폴더가 ACTIVE_CWD 인 세션에서만 기록한다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const seen = new Set<string>()
const session = { isActive: false }

const summarize = (node: any): string => {
  if (node == null) return 'null'
  if (typeof node != 'object') return typeof node
  const owner = node.part?.plugin ?? '-'
  return `${node.type ?? '?'}(part=${owner})`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    session.isActive = e.cwd == ACTIVE_CWD
    if (session.isActive) $.ui.log('r1: loaded')
    return next(e)
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    const tree = await next(e)
    if (!session.isActive) return tree
    const trace = next.trace.map(link => `${link.index}:${link.plugin}/${link.tier}/${link.outcome}`).join(' ')
    const line = `r1: Pane requestId=${e.requestId} placement=${e.props.placement} tree=${summarize(tree)} trace=[${trace}]`
    if (seen.has(line)) return tree
    seen.add(line)
    $.ui.log(line)
    return tree
  })
}
