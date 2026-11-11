#!/bin/zsh -f
# 묶음 X(diff 검토가 「덮는 행이 없다」고 낸 변경) 중 `claude -p` 로 도는 시나리오.
# 사용: zsh X-cli.zsh <TREE> [행 id ...]   (TREE = base | tgt | broke 등)
# 출력: $J/out/X/<TREE>/<id>.txt
# 정규화에서 지운 것: debug log 줄 머리의 시각(plog 의 sed), 프로젝트 hash 를 <hash> 로(base 와 tgt 가 같은 JOB 을 써서 같지만 broke 등에서 경로가 다를 수 있어서).
#   그 밖의 출력(명령 응답 · JSON)은 시각 · pid 를 담지 않아 그대로 둔다.
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=X; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
want(){ [ ${#ONLY} -eq 0 ] && return 0; (( ${ONLY[(Ie)$1]} )) }
nh(){ sed -E 's/proj-[0-9a-f]{16}/proj-<hash>/g; s/2d2d4469/JOB/g' }
tabjs(){ python3 -c 'import json,sys
s=sys.stdin.read()
try: t=json.loads(s)["tabs"][0]; print("active=%s zoomed=%s" % (t["active"], t.get("zoomed")))
except Exception: print(s.strip())' }
fl(){ print -r -- "failed hooks: $(cat $LOG/p.log 2>/dev/null | grep -c -E 'hook skipped|start failed|(command|scroll|press|message|render) failed')" }

# X1: tree.ts normalize 의 Number.isFinite(sum). 자식 size 1e308 두 개(합이 Infinity)
if want X1; then setup; reset "$F2"; d=$(pdir $PROJ); mkdir -p $d
  print -r -- '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":1e308},{"node":{"kind":"cell","id":"c2"},"size":1e308}]},"active":"c1"}]}' > $d/layout.json
  { g list; fl; g split -h; fl; g list; print -- '--file'; pl; } | nh > $OUT/X1.txt
fi

# X3: zoom 한 탭에서 활성이 아닌 칸에 place / place -
if want X3; then setup; reset "$F2"
  { g zoom; g place usage-gauge c2; g list; print -- '--file after place'; pl | tabjs; g place - c1; print -- '--file after place -'; pl | tabjs; fl; } | nh > $OUT/X3.txt
fi

# X4a: 탭 목록이 바뀌지 않는 동작 뒤 파일을 쓰는가(F1 의 next, F2 의 select-cell c1)
if want X4a; then setup
  { reset "$F1"; g next; print -- '--file'; pl; reset "$F2"; g select-cell c1; print -- '--file'; pl; reset "$F2"; g resize 50; print -- '--file'; pl; reset "$F2"; g place - c2; print -- '--file'; pl; } | nh > $OUT/X4a.txt
fi

# X4b: 깨진 프로젝트 파일 뒤의 바뀌지 않는 동작
if want X4b; then setup; reset "$F2"; d=$(pdir $PROJ); mkdir -p $d; print 'not json' > $d/layout.json
  { g select-cell c1; print -- '--ls'; ls $d; print -- '--layout.json'; cat $d/layout.json; print -- '--layout.invalid.json'; cat $d/layout.invalid.json 2>&1 | sed "s|$d|<d>|"; } | nh > $OUT/X4b.txt
fi

# X5: 동작 뒤 검사가 plugin 이름 규칙을 본다(split -h Foo · place Foo c2 · place -x)
if want X5; then setup
  { reset "$F2"; print '## split -h Foo'; g split -h Foo; print -- '--file'; pl; g list; plog 'refused' | sed -E 's/^.*pane-grid: //' | sort -u
    reset "$F2"; print '## place Foo c2'; g place Foo c2; print -- '--file'; pl
    reset "$F2"; print '## place -x'; g place -x; print -- '--file'; pl; fl; } | nh > $OUT/X5.txt
fi

# X6: child.size 가 Infinity(JSON 1e999)
if want X6; then setup
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":1e999},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1"}]}'
  { g list; fl; g split -h; print -- '--file'; pl; g list; fl; } | nh > $OUT/X6.txt
fi

# X11: 상대 경로 CLAUDE_CONFIG_DIR(rel)
if want X11; then setup; reset "$F2"
  { DIR=$PROJ gc rel reload; DIR=$PROJ gc rel split -h; DIR=$PROJ gc rel reload; print -- '--ls'; ls $PROJ/rel/pane-grid/projects 2>&1; } | nh > $OUT/X11.txt
fi

# X12: CLAUDE_CONFIG_DIR=/
if want X12; then setup; reset "$F2"
  { DIR=$PROJ gc / reload; fl; plog 'pane-grid: (command failed|no file|start failed)' | sed -E 's/^.*pane-grid: //' | cut -c1-160
    DIR=$PROJ gc / split -h; fl; plog 'pane-grid: (command failed|no file|start failed)' | sed -E 's/^.*pane-grid: //' | cut -c1-160; } | nh > $OUT/X12.txt
fi

# X10: HOME 과 CLAUDE_CONFIG_DIR 이 둘 다 없을 때. HOME 을 지우면 claude 가 getpwuid 로 실제 사용자 홈(~/.claude)을 쓰므로
#   HOME 을 빈 문자열로 둔다. pane-grid 는 두 판 모두 `$.env.get('HOME') ?? ''` 로 읽어 빈 문자열과 없음을 같게 다룬다.
if want X10; then setup; reset "$F2"
  { for a in 'split -h' 'reload'; do
      (cd $PROJ && env -u CLAUDE_CONFIG_DIR -u CLAUDECODE HOME= claude -p "/grid $a" --plugin-dir $REPO --debug-file $LOG/p.log 2>&1 | grep -v 'mcp-sdk\] SEP-')
      fl; plog 'pane-grid: (no file|command failed|start failed)' | sed -E 's/^.*pane-grid: //' | cut -c1-160
    done
    print -- '--written under PROJ'; (cd $PROJ && ls -A | grep -v '^\.git$'); } | nh > $OUT/X10.txt
fi

# X9: plugin.json version
if want X9; then mkdir -p $OUT
  python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' $REPO/.claude-plugin/plugin.json > $OUT/X9.txt
fi
T kill-server 2>/dev/null
exit 0
