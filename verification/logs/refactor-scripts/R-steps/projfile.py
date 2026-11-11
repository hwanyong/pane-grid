#!/usr/bin/env python3 -I
# projfile.py <HOME> <PROJ> <tabs JSON>: 격리 HOME 아래 프로젝트 layout 파일을 pane-grid 가 쓰는 꼴로 쓴다(lib.zsh 의 pdir 과 같은 이름).
import hashlib, json, os, sys
home, proj, tabs = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
real = os.path.realpath(proj)
d = f"{home}/.claude/pane-grid/projects/{os.path.basename(real)}-{hashlib.sha256(real.encode()).hexdigest()[:16]}"
os.makedirs(d, exist_ok=True)
open(f"{d}/layout.json", "w").write(json.dumps({"version": 1, "project": real, "tabs": tabs}))
