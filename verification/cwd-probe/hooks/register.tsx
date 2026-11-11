import type { EngineInterface, Register } from 'claude-code'

const where = async ($: EngineInterface) => {
  const cwd = await $.session.cwd()
  const root = await $.session.root()
  const repo = await $.session.repo()
  const config = await $.env.get('CLAUDE_CONFIG_DIR')
  return JSON.stringify({ cwd, root, repoRoot: repo?.root ?? null, config: config ?? null })
}

const seen = { last: '' }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'k8probe', description: 'probe' })
    seen.last = await where($)
    $.ui.log(`k8probe: start ${seen.last}`, { to: 'debug' })
    $.clock.every(1000, async () => {
      const now = await where($)
      if (now == seen.last) return
      $.ui.log(`k8probe: poll changed ${now}`, { to: 'debug' })
      seen.last = now
    })
    return next(e)
  })
  on('classic.CwdChanged', async ($, e, next) => {
    $.ui.log(`k8probe: CwdChanged old=${e.old_cwd} new=${e.new_cwd} now=${await where($)}`, { to: 'debug' })
    return next(e)
  })
  on('command.run', { command: 'k8probe' }, async $ => ({ text: await where($) }))
}
