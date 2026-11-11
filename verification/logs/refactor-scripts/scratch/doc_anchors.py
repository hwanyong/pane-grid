import sys
import pathlib
import re

# docs/*.md · README.md 가 `hooks/<파일>` 의 `<이름>` 으로 가리키는 식별자가 그 파일에 정의돼 있는지 base · tgt 에서 본다.
ROOT = pathlib.Path('/Users/uhd/.claude/jobs/2d2d4469/tmp')
PAT = re.compile(r"`(hooks/[\w.-]+|skills/add-pane-grid-cell/pane-grid\.ts)`\s*(?:의|에서|\()\s*`([A-Za-z_][\w.]*)`")
for tree in (sys.argv[1:] or ['base', 'tgt']):
    print('==', tree)
    docs = sorted((ROOT / tree / 'docs').glob('*.md')) + [ROOT / tree / 'README.md']
    for doc in docs:
        for n, line in enumerate(doc.read_text().splitlines(), 1):
            for m in PAT.finditer(line):
                f, name = m.group(1), m.group(2).split('.')[0]
                src = ROOT / tree / f
                if not src.exists():
                    print(f'  {doc.name}:{n} {f} MISSING FILE ({name})')
                    continue
                text = src.read_text()
                defined = re.search(rf"(const|function|let|type|class)\s+{re.escape(name)}\b|\b{re.escape(name)}\s*[:=(]", text)
                if not defined:
                    print(f'  {doc.name}:{n} {f} lacks {name}')
