# X25: 한 트리(argv[1])의 docs/images/build.py 로 SVG 두 장을 Chrome 없이 만들고, 커밋된 SVG 와 같은지 · 그 줄들 · PNG 의 SHA-256 을 낸다.
# 사용: python3 -I x25.py <base|tgt>
import hashlib
import pathlib
import sys

ROOT = pathlib.Path('/Users/uhd/.claude/jobs/2d2d4469/tmp')
tree = sys.argv[1]
path = ROOT / tree / 'docs/images/build.py'
src = '\n'.join(l for l in path.read_text().splitlines() if not l.startswith('render("'))
g = {'__file__': str(path), '__name__': 'x'}
exec(compile(src, str(path), 'exec'), g)
for name in ['structure', 'lifecycle']:
    out = g[name]()
    svg = out[0] if isinstance(out, tuple) else out
    committed = (ROOT / tree / 'docs/images' / f'pane-{name}.svg').read_text()
    png = (ROOT / tree / 'docs/images' / f'pane-{name}.png').read_bytes()
    print(f'== {name}: committed == generated: {committed == svg}; png sha256 {hashlib.sha256(png).hexdigest()}')
    print('arrow-fail marker defs:', committed.count('id="arrow-fail"'), 'refs:', committed.count('url(#arrow-fail)'))
    print(committed.replace('><', '>\n<'))
