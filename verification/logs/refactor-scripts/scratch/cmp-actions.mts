// layout-file.ts 의 변경이 actions.ts 를 거쳐 사용자 출력으로 나오는 경우를 base 와 tgt 에서 대조한다.
// 입력: (1) size 1e999 가 든 파일을 읽은 탭에 list · split -h · resize, (2) 이름 규칙을 어기는 plugin 을 쓰는 동작.
const LB = await import('../base/hooks/layout-file.ts')
const LT = await import('../tgt/hooks/layout-file.ts')
const AB = await import('../base/hooks/actions.ts')
const AT = await import('../tgt/hooks/actions.ts')
const inf = '{"version":1,"project":"/p","tabs":[{"name":"main","active":"c1","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":1e999},{"node":{"kind":"cell","id":"c2"},"size":50}]}}]}'
const F2 = '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1"}]}'
const run = (L: typeof LB, A: typeof AB, text: string, words: string[]) => {
  const parsed = L.parseLayoutFile(text) as { isValid: boolean; tabs?: never[] }
  if (!parsed.isValid) return `invalid ${JSON.stringify(parsed)}`
  const out = A.apply(parsed.tabs!, 'main', words) as { text?: string; tabs: never[] }
  const check = A.checkOutcome(out as never)
  return JSON.stringify({ text: out.text, check, file: check ? undefined : JSON.parse(LT.serializeLayoutFile(out.tabs, '/p')).tabs[0].root })
}
const cases: [string, string, string[]][] = [
  ['inf list', inf, ['list']], ['inf split', inf, ['split', '-h']], ['inf resize', inf, ['resize', '30']],
  ['F2 place Foo', F2, ['place', 'Foo']], ['F2 place Foo c2', F2, ['place', 'Foo', 'c2']], ['F2 split Foo', F2, ['split', '-h', 'Foo']],
  ['F2 place a.b', F2, ['place', 'a.b']], ['F2 place -x', F2, ['place', '-x']],
]
for (const [name, text, words] of cases) {
  const b = run(LB, AB, text, words), t = run(LT, AT, text, words)
  console.log(b == t ? 'SAME' : 'DIFF', name, b == t ? b.slice(0, 220) : `\n  base ${b}\n  tgt  ${t}`)
}
