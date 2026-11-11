# 묶음 D(저장) 대조 결과

- 스크립트: `$J/scripts/D.zsh <TREE>`(표 행 · T117a · T117b), `$J/scripts/D-extra.zsh <TREE>`(T117d · T117e), `$J/scripts/D-cwd.zsh`(T117c, 실행 없이 git log). `$J` = `/Users/uhd/.claude/jobs/2d2d4469/tmp`.
- 대조: `zsh $J/compare.zsh D` 의 마지막 출력 `summary: same=29 diff=4 missing=0`(`$J/out/D-compare3.txt`). DIFF 네 행은 T117b · T117b-rel · T117d · T117e 이다.
- 흔들림 확인: 대화형 행 T70 · T117a · T71a~T71d 를 두 트리에서 한 번 더 돌렸고 첫 실행의 파일(`$J/out/D-base-run1` · `D-tgt-run1`)과 `cmp` 로 같았다.
- 사용자의 실제 `/Users/uhd/.claude/pane-grid/layout.json` SHA-256 은 모든 실행의 시작과 끝에서 `1dca3aebdfa19b977e8a6b4ed3812e0d312357071abc32de70170837427918c5` 이고 `projects/` 목록(디렉터리 다섯 개)도 같았다(`$J/out/D/sha-log.txt`).

| id | 시험 | 기준선 출력 | 대상 출력 | 판정 | 비고 |
|---|---|---|---|---|---|
| T66 | 프로젝트 파일 경로 | `split c1 into c1 and c3`, log `project $H/proj (root $H/proj) -> $H/.claude/pane-grid/projects/proj-bb3a7976d66e81fa`, 파일 c1:25 · c3:25 · c2:50, global SHA 같음 | 기준선과 글자가 같다 | 같음 | |
| T67 | worktree · 하위 디렉터리 | 두 번 모두 `* main active=c3 {c1:25,c3:25,c2:50}`, root 만 `$H/proj-wt` · `$H/proj/sub`, projects 디렉터리 한 개 | 같다 | 같음 | |
| T68 | git 밖 | `plain-3f6987686c31a492/layout.json`, `"project": "$H/plain"` | 같다 | 같음 | |
| T69 | 다른 프로젝트 | `* main active=c1 {c1:50,c2:50}` | 같다 | 같음 | |
| T70 | /cd 뒤 1초 poll | `/cd` 출력 `Moved to $H/proj`, toast `the session moved to ~/proj; loaded 1 tab(s) from ~/.claude/pane-grid/projects/proj-…/layout.json`, list `* main active=c3 {c1:25,c3:25,c2:50}` | 같다 | 같음 | |
| T71a | 두 세션 slash 명령 | b `refused: another session changed this project's layout; loaded ~/…/proj-…/layout.json again, do it once more`, log `… changed by another session (mtimeMs N -> N); not written`, b list 에 a 의 c4, b 둘째 split `split c4 into c4 and c5` | 같다 | 같음 | |
| T71b | 두 세션 hotkey | a 가 reload 뒤 `split c5 into c5 and c6`, b 의 키 `v` toast `pane-grid: refused: another session changed …` | 같다 | 같음 | 절차에 a 의 `/grid reload` 를 더했다(T71a 뒤 a 의 사본이 낡아 a 의 split 이 먼저 거부된다) |
| T71c | 두 세션 divider | a `split c6 into c6 and c7`, b 의 drag toast `pane-grid: refused: another session changed …`, b 화면이 a 의 배치로 다시 그려짐 | 같다 | 같음 | T71b 와 같이 a 의 reload 를 더했다 |
| T71d | 파일을 지운 경우 | `refused: … loaded ~/.claude/pane-grid/layout.json again, do it once more`, log `(mtimeMs N -> undefined)`, 파일 없음 | 같다 | 같음 | |
| T72 | CLAUDE_CONFIG_DIR 없음 | `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` | 같다 | 같음 | |
| T73 | 빈 CLAUDE_CONFIG_DIR | `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` / `* main active=c1 {c1:50,c2:50}` | 같다 | 같음 | |
| T74 | 0.4.x 자리는 읽기만 | `$CFG/pane-grid/projects/proj-…/layout.json` 생성, reload 가 그 경로, `$H` global SHA 같음, `$H/.claude/pane-grid` 에 `layout.json` 만 | 같다 | 같음 | |
| T75 | 설정 디렉터리 global 먼저 | `* main active=c1 c1` | 같다 | 같음 | |
| T76 | 실제 HOME, 빈 CLAUDE_CONFIG_DIR | 실제 파일 SHA-256 전후 `1dca3aeb…918c5`, projects 다섯 개 전후 같음, 쓰인 파일 `pane-grid/projects/proj-HEX/layout.json` 하나, `split c6 into c6 and c9` | 같다 | 같음 | 응답은 사용자의 실제 0.4.x 파일 내용에서 나왔다 |
| T77a | JSON 아님 | `* main active=c1 c1`, log `refused: not JSON: JSON Parse error: Unexpected identifier "not"` | 같다 | 같음 | |
| T77b | version | `refused: version must be 1` | 같다 | 같음 | |
| T77c | 중복 id | `refused: cell id c1 is used twice` | 같다 | 같음 | |
| T77d | 그 밖의 이유 다섯 가지 | `not an object` / `tabs must be a list of one tab or more` / `tabs[0]: name must match …` / `tabs[0].root: a row needs two children or more` / `tabs[0].root.children[1].node: plugin must match …` | 같다 | 같음 | |
| T77e | layout.invalid.json | `split c1 into c1 and c2`, `kept the invalid layout file as …/layout.invalid.json`, 내용 `not json`, list `* main active=c2 {c1:50,c2:50}` | 같다 | 같음 | |
| T77f | 깨진 파일 toast | toast `~/.claude/pane-grid/projects/proj-…/layout.json is not a valid layout (not JSON: …); using one empty tab`, 칸 `c1 -` 하나 | 같다 | 같음 | |
| T77g | 느슨한 값 | `* main active=c1 {c1:25,c2:75}` | 같다 | 같음 | |
| T78 | /clear 뒤(grid 보임) | log `layout state is empty …` 뒤 `layout revision=1 tabs=main placed=`, grid 다시 그려짐, list `{c1:25,c3:25,c2:50}` | 같다 | 같음 | |
| T79 | /clear 뒤(grid 가려짐) | 보이는 pane `pending-questions`, 같은 두 log 줄 | 같다 | 같음 | |
| T80 | 다시 시작한 뒤 배치 | 앞 `* main active=c3 zoomed {c1:23.33,c3=usage-gauge:30,c2:46.67}` · `notes active=c4 c4`, 뒤 `  main …` · `- notes …`(current 가 notes) | 같다 | 같음 | k10 기대(글자가 같다)와 어긋난다. 다시 시작하면 마지막에 연 notes 탭이 보이는 탭이 되어 `*` 가 notes 로 옮고, 화면은 `* notes` 를 markdown 목록 `- notes` 로 그렸다. 배치 · 비율 · zoomed 는 같다 |
| T103 | CLAUDE_CONFIG_DIR 끝 `/` | log `-> $J/run/D/cfg-own/pane-grid/projects/proj-…`, `//` 없음 | 같다 | 같음 | |
| T104 | 이름 문자 치환 | `my-proj-62460fb349f0dd18`(공백 든 realpath 의 SHA-256 앞 16자리와 같음) | 같다 | 같음 | |
| T105 | `.git` 파일, commondir 없음 | log `project $H/sm (root $H/sm) -> …/projects/sm-d137313b15ac2c65`, `* main active=c1 {c1:50,c2:50}` | 같다 | 같음 | |
| T115 | 깨진 global 파일 | `split c1 into c1 and c2`, log `layout file $H/.claude/pane-grid/layout.json refused: not JSON: …` 와 `kept …/layout.invalid.json`, 내용 `not json`, global SHA 같음 | 같다 | 같음 | |
| T117a | /cd 직후 split | `/cd proj-b` 와 `/grid split -h` 를 0.6초 사이로 넣음: toast `the session moved to ~/proj-b; loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` 뒤 `split c1 into c1 and c3`, proj-b 파일에 c3, proj 파일 그대로 | 같다 | 같음 | 두 판 모두 poll 의 전환이 split 보다 먼저 끝났다. F50 의 경쟁 창은 재현하지 못했다 |
| T117b | HOME · CLAUDE_CONFIG_DIR 둘 다 없음 | split `pane-grid: the command failed; see the debug log`(log `$.fs.write(/.claude/pane-grid/projects/…) failed: EROFS`), reload `loaded 1 tab(s) from /.claude/pane-grid/layout.json` | split `split c1 into c1 and c2`, reload `loaded 1 tab(s) from no file (neither HOME nor CLAUDE_CONFIG_DIR is set)`, log `no file …; the layout is kept in this session only` | 다름(의도) | k11 c11 3절 F59 의 두 행과 같다(ee6c176). 덧붙임: 대상 log 의 `project … -> /pane-grid/projects/proj-…` 는 쓰지 않는 경로를 적는다(run.config 가 빈 문자열) |
| T117b-rel | 상대 CLAUDE_CONFIG_DIR | log `-> rel-cfg/pane-grid/projects/proj-…` | log `-> $H/proj/rel-cfg/pane-grid/projects/proj-…` | 다름(의도) | 쓰인 파일 자리는 두 판 모두 `$PROJ/rel-cfg/pane-grid/projects/proj-HEX/layout.json`. 차이는 c11 2절 F59 행과 ee6c176 본문에 있고 3절 표에는 없다. `/cd` 뒤 경로 차이는 방법 C 가 대화형에서 로그인하지 못해 실행하지 못했다 |
| T117d | 무효 파일 뒤 유효 파일을 다시 읽고 저장(F40) | 둘째 split 뒤 `layout.invalid.json` 이 생기고 내용 `not json`, log `kept the invalid layout file …` | `layout.invalid.json` 없음, `kept` log 없음. 응답은 같다 | 다름 | 1ca03e9(F40). c11 2절의 의도한 수정이지만 3·4절에 없어 규칙대로 「다름」. main 판정이 필요하다 |
| T117e | `.git` 을 읽을 수 없는 디렉터리(F48 · F49) | `session.start hook skipped: threw … $.fs.read($H/locked/.git) failed: EACCES` 뒤 `/grid` 가 등록되지 않아 모델이 글로 답함(list · split 모두) | log `start failed: … EACCES`, list `* main active=c1 c1`, split `pane-grid: the command failed; see the debug log`, log `$.fs.write(/layout.json) failed: EROFS` | 다름 | c16cdd4(F48: 등록을 파일 읽기 앞으로)와 10ad989(F49). 결함 후보: projectOf 가 거부되면 run.dir 이 빈 문자열로 남는데 run.config 는 있어서 persist 가 `projectFile()` = `/layout.json` 에 쓰려 한다(tgt register.tsx:158 projectFile, 217-236 persist, 397-407 session.start). 여기서는 `/` 가 읽기 전용이라 EROFS 로 끝났다 |
| T117c | $.session.cwd 를 넣은 커밋 | 호출 0곳 | 호출 1곳(register.tsx:401) | 다름(의도) | `git log -S'session.cwd' main..k11-refactor` 결과 ee6c176(F59) 하나. F49(10ad989) · F50(3ba5537)과 무관. 상대 경로일 때만 부른다. 증거 `$J/out/D/T117c.txt`(실행 대조 아님) |
