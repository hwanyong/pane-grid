// X27: F1 탭에서 split -h 를 여덟 번 할 때 각 단계의 list 를 base 와 tgt 에서 대조한다(어느 단계에서 갈리는지 본다).
const LB = await import('../base/hooks/layout-file.ts')
const LT = await import('../tgt/hooks/layout-file.ts')
const AB = await import('../base/hooks/actions.ts')
const AT = await import('../tgt/hooks/actions.ts')
const F1 = '{"version":1,"tabs":[{"name":"main","root":{"kind":"cell","id":"c1"},"active":"c1"}]}'
const go = (L: typeof LB, A: typeof AB) => {
  let tabs = (L.parseLayoutFile(F1) as { tabs: never[] }).tabs
  const lines: string[] = []
  for (let i = 0; i < 8; i++) {
    tabs = (A.apply(tabs, 'main', ['split', '-h']) as { tabs: never[] }).tabs
    lines.push((A.apply(tabs, 'main', ['list']) as { text: string }).text)
  }
  return lines
}
const b = go(LB, AB), t = go(LT, AT)
b.forEach((line, i) => console.log(line == t[i] ? 'SAME' : 'DIFF', i + 1, `\n  base ${line}\n  tgt  ${t[i]}`))
