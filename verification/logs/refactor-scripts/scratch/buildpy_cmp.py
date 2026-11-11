import difflib
import pathlib
import sys

ROOT = pathlib.Path('/Users/uhd/.claude/jobs/2d2d4469/tmp')


def load(tree):
    path = ROOT / tree / 'docs/images/build.py'
    src = path.read_text()
    # render(...) 호출 줄을 빼서 Chrome 을 띄우지 않고 SVG 문자열만 만든다.
    src = '\n'.join(l for l in src.splitlines() if not l.startswith('render("'))
    g = {'__file__': str(path), '__name__': 'x'}
    exec(compile(src, str(path), 'exec'), g)
    return g


b = load('base')
t = load('tgt')
base_sizes = {'structure': (1420, 830), 'lifecycle': (1960, 1520)}
for name in ['structure', 'lifecycle']:
    bd = b[name]()
    td, w, h = t[name]()
    print(name, 'svg equal:', bd == td, 'tgt size', (w, h), 'base size', base_sizes[name], 'size equal:', (w, h) == base_sizes[name])
    if bd != td:
        bl = bd.replace('><', '>\n<').splitlines()
        tl = td.replace('><', '>\n<').splitlines()
        for l in list(difflib.unified_diff(bl, tl, lineterm='', n=0))[:30]:
            print('  ', l[:220])
    tc = (ROOT / 'tgt/docs/images' / f'pane-{name}.svg').read_text()
    bc = (ROOT / 'base/docs/images' / f'pane-{name}.svg').read_text()
    print('  tgt committed == tgt generated:', tc == td, '| base committed == base generated:', bc == bd)
    print('  url(#arrow-fail) refs in base generated:', bd.count('url(#arrow-fail)'), 'mono font in base:', bd.count('Menlo'))
