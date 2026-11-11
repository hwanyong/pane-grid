## 1. 결과 요약 (c6: tgt2 = k11-refactor 4934a60 다시 대조)

c5 의 결정에 따라 2절 근거 「다름」 행은 k11 의 의도한 수정으로 본다. 이번 대상 tgt2 는 `k11-refactor` 4934a60 이다(2d2d846 뒤 커밋 6개: ce45e24 cbad508 837a2aa 4faf56e 97ef86a 4934a60). 기준선 base 는 main dd6cda9, 앞 대상 tgt 는 2d2d846 이다. 2d2d846 과 4934a60 의 차이는 파일 네 개다(`hooks/register.tsx` · `docs/images/build.py` · `docs/grid-and-tabs.md` · `docs/add-pane-grid-cell.md`, `git diff --stat` 79줄 추가 · 46줄 삭제).

| 구분 | 행 | 판정 |
|---|---|---|
| 고친 행 | T117e · X14 · X12 · X23 · F71m · X24 · X26 | 일곱 행 모두 k11 c14 2절의 출력과 같다. X12 · X26 은 base 와 같다 |
| 관련 행 | X10 · X11 · X13 · X15 · T117b-rel · T117d · T56 · X4a · X4b · X4c | tgt 와 같다 |
| 관련 행 | T117b | 다름(debug log 한 줄, 아래 2절) |
| 회귀 | AB 62행 · C1 17행 · C2 18행 · D 33행 · E 24행 · F 10행 | 고친 행과 T117b 를 빼고 tgt 와 같다(C2 · E 의 usage-gauge 막대 차이와 C1 T57k 의 close 접미는 아래 3절) |
| 문서 | `docs/add-pane-grid-cell.md` Step 1 · Step 6 에 더한 문단 | 코드와 맞는다 |
| k11 c14 5절 toast | X14m(새 시나리오) | 글이 일어난 일과 맞지 않는다(아래 2절) |

묶음마다 `compare.zsh <묶음> tgt tgt2` 의 summary:

| 묶음 | summary | DIFF 행 |
|---|---|---|
| AB | same=62 diff=0 missing=0 | 없음 |
| D | same=31 diff=2 missing=0 | T117b · T117e |
| F | same=9 diff=1 missing=0 | F71m |
| X | same=26 diff=5 missing=0 | X12 · X14 · X23 · X24 · X26 |
| C1 | same=16 diff=1 missing=1 | T57k (missing 은 T116i: 별도 스크립트 C1-T116i.zsh 의 행이라 이번에 돌리지 않았다. 바뀐 파일에 ui.press 경로가 없다) |
| C2 | same=15 diff=3 missing=0 | T61 · T62 · T63 (막대 정규화 뒤 같음) |
| E | same=16 diff=8 missing=0 | T81~T85 · T90~T92 (막대 정규화 뒤 같음) |

C1 · C2 · E 는 c6 이 요구한 「persist · 분할선 끌기 · reload 를 쓰는 행」보다 넓게 묶음 전부를 돌렸다. X 묶음은 X-cli · X-tty · X-static 세 스크립트 전부를 돌렸다.

## 2. 행마다 tgt2 의 출력

| 행 | tgt2 출력 | 판정 |
|---|---|---|
| T117e | `DIR=locked g list` → `pane-grid: * main active=c1 {c1:50,c2:50}`; `g split -h` → `pane-grid: refused: this session's project is not resolved yet, so the layout cannot be saved; see the debug log`; log `project not resolved: HooksError: pane-grid: $.fs.read($H/locked/.git) failed: EACCES`(실행마다 3줄), EROFS 줄 0 | k11 c14 과 같다 |
| X14 | list `* main active=c1 {c1:50,c2:50}`, split -h `refused: this session's project is not resolved yet, ...`, start failed · hook skipped · command failed 줄 0 | k11 c14 과 같다 |
| X12 | reload `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json`, split -h `the command failed; see the debug log`, log `$.fs.write(/pane-grid/projects/proj-<hash>/layout.json) failed: EROFS` | base 와 바이트 같다 |
| X23 | exit=1, stderr `<W>/chrome exited with 0 but wrote no pane-structure.draft.png while rendering pane-structure.svg`, SVG · PNG 네 개 old | k11 c14 과 같다 |
| X24 | exit=1, `FileNotFoundError: [Errno 2] No such file or directory: '<W>/chrome'`, 네 개 old | k11 c14 과 같다 |
| F71m | exit 1, FileNotFoundError, `git status --short docs/images` 출력 없음(tgt 에는 `?? docs/images/pane-structure.draft.svg`) | k11 c14 과 같다 |
| X26 | `grid-and-tabs.md:392 hooks/register.tsx lacks placedNote` 한 줄(22행 TOOLBAR 줄 없음) | base 와 같다 |
| T117b | `-- no HOME split -h: pane-grid: split c1 into c1 and c2`, `no file (neither HOME nor CLAUDE_CONFIG_DIR is set); ...`, log `pane-grid: project $H/proj (root $H/proj) ->` | **다름**(아래) |
| X10 X11 X13 X15 X4a X4b X4c T117b-rel T117d T56 | tgt 출력과 바이트 같다 | 같음 |
| X14m | 아래 | 글이 일어난 일과 맞지 않음 |

**T117b 의 다름.** HOME · CLAUDE_CONFIG_DIR 이 둘 다 없을 때 debug log 의 `project ... -> <dir>` 줄 끝이 바뀌었다.

| 판 | 줄 |
|---|---|
| base | `pane-grid: project $H/proj (root $H/proj) -> /.claude/pane-grid/projects/proj-bb3a7976d66e81fa` |
| tgt | `pane-grid: project $H/proj (root $H/proj) -> /pane-grid/projects/proj-bb3a7976d66e81fa` |
| tgt2 | `pane-grid: project $H/proj (root $H/proj) ->` |

원인은 cbad508 이다. `run.config` 가 undefined 면 resolveProject 가 dir 을 빈 문자열로 둔다(tgt2 `hooks/register.tsx:213`). 쓰지 않는 경로를 적던 것이 없어졌으므로 결함이 아니라 c14 수정의 부수 효과로 본다. 명령 응답 · 파일은 tgt 와 같다. 재현: `zsh refactor-scripts/D.zsh tgt2 T117b`.

**X14m: k11 c14 5절의 toast.** 시작 디렉터리 `$H/sm` 의 `.git` 을 `chmod 000` 해 둔 세션을 띄우고 `/grid split -h` 를 한 뒤 `chmod 644` 하고 4초 기다렸다(`refactor-scripts/X14m.zsh <TREE>`).

| 단계 | tgt2 출력 |
|---|---|
| 시작 · split -h | log `project not resolved: ... $.fs.read($H/sm/.git) failed: EACCES`, 응답 `refused: this session's project is not resolved yet, ...`, `projects` 디렉터리 없음 |
| chmod 644 뒤 toast | `pane-grid: the session moved to ~/sm; loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` |
| log | `pane-grid: project $H/sm (root $H/sm) -> $H/.claude/pane-grid/projects/sm-<hash>` |
| 다시 split -h | `pane-grid: split c1 into c1 and c3`, 파일 `projects/sm-<hash>/layout.json` 이 쓰였다 |
| `!pwd` | `$H/sm` (시작 디렉터리 그대로) |

세션의 작업 디렉터리와 root 는 처음부터 `$H/sm` 이었고 바뀌지 않았다. 일어난 일은 「프로젝트를 이제 정했다」인데 toast 는 「the session moved to ~/sm」이라 적는다. **글이 일어난 일과 맞지 않는다.** 원인은 moveProject 가 run.root 를 빈 문자열에서 바뀐 것으로 보고 이동 알림 글을 그대로 쓰는 것이다(tgt2 `hooks/register.tsx:401` moveProject → `loadText`). base 에서는 이 세션에 /grid 가 없고(`Unknown command: /grid`, `session.start hook skipped`) toast 도 없다. 재현: `zsh refactor-scripts/X14m.zsh tgt2`, 출력 `refactor-out/X/{base,tgt2}/X14m.txt`.

## 3. 회귀 묶음의 차이를 「같음」으로 본 근거

- **C2 T61~T63, E T81~T85 · T90~T92:** usage-gauge 가 그리는 막대 자리만 다르다(`│<bar>│` 대 `<bar>│<bar>│`). 막대는 실제 사용량을 그리므로 실행 시각에 따라 너비가 0 이 되면 `<bar>` 하나가 사라진다. 막대 문자와 그 사이의 `│` 를 한 토큰으로 접는 `refactor-scripts/norm-bar.zsh` 로 다시 대조하니 11행 모두 `SAME-after-bar-norm` 이었다(`refactor-out/C2-barnorm-tgt-tgt2.txt` · `E-barnorm-tgt-tgt2.txt`). 이 정규화를 깨 본 것: tgt2 T61 의 toast 를 `in c1` 에서 `in c2` 로 바꾼 사본을 대조하니 `T61 DIFF-after-bar-norm` 과 그 줄 diff 가 나왔다(`refactor-out/break/norm-bar-break.txt`).
- **C1 T57k:** tgt2 의 close 응답에 `; it is behind w3, click its tab to show it` 접미가 붙었다. 첫 대조의 T114 와 같은 기존 흔들림이다. `C1-T114-loop.zsh 1 6 tgt2` 로 여섯 번 돌리니 6회째에만 접미가 붙었다(`refactor-out/C1-T114-loop-tgt2.txt`). 첫 대조에서는 base 13번 중 5번, tgt 9번 중 4번 접미가 없었다. 접미를 붙이는 줄은 tgt2 `hooks/register.tsx:315` 이고, 2d2d846..4934a60 diff 에 `is behind` 를 담은 줄은 0줄이다(`grep -c`).

## 4. 문서 행

`refactor-out/V2/DOC2.txt`:
- export 수 base 8, tgt2 15. tgt2 에만 있는 것은 ACTIVE_SUFFIX · CHOICE_HOTKEYS · CHOICES_KEY · GRID_VERSION · NONE_KEY · PLACE_KEY · SLOT_KEY 일곱 개이고 base 에만 있는 것은 0개다.
- base `pane-grid.ts:18-26` 에 같은 이름 · 같은 값의 상수가 export 없이 있다.
- 기존 export 여덟 개의 선언 줄은 base 와 tgt2 가 같다.
- shown 주기 차례: base `register.tsx:421` reload → `:422` `$.clock.every`, tgt2 `:430` `$.clock.every` → `:431` reload. Step 6 문단의 「0.5.1 starts its once-a-second shown check before it reads the layout file (0.5.0 started it after)」와 맞는다.

## 5. 깨 본 대조 (§8③)

tgt2 사본 `broke2` 의 `docs/images/build.py:334` `svg_draft.unlink(missing_ok=True)` 를 `pass` 로 바꾸고 F 묶음을 돌렸다. 사본은 지웠고 깨 본 커밋은 없다.

```
$ zsh compare.zsh F tgt2 broke2
F71f DIFF
    +?? docs/images/pane-structure.draft.svg
F71m DIFF
    +?? docs/images/pane-structure.draft.svg
summary: same=8 diff=2 missing=0
exit=1
```

전문: `refactor-out/break/compare-tgt2-broke2.txt`, 바꾼 줄 `refactor-out/break/broke2.diff`.

## 6. 사용자 실제 파일 SHA-256

시작 2026-11-11T19:28:58Z, 끝 2026-11-11T20:00:32Z. `~/.claude/pane-grid/layout.json` 1dca3aeb…918c5 와 `projects/*/layout.json` 다섯 개(c978e664… · b7b413d1… · 454dcf08… · 0e922023… · f34bc87f…)의 SHA-256 줄을 정렬해 `diff` 한 출력이 비었다(같음). 전문 `refactor-sha2.txt`.

다른 곳에 남은 것: 시험(HOME 이 없는 T117b · X10)이 실제 `~/.claude/projects/` 에 claude 세션 기록 디렉터리 두 개를 만들었다(`-Users-uhd--claude-jobs-2d2d4469-tmp-run-D-home-proj` 18:39Z, `...-run-X-home-proj` 19:36Z). 앞 것은 첫 대조 때 생긴 것을 놓친 것이다. 내용이 시험 세션 기록뿐인 것을 보고 둘 다 지웠다. pane-grid 파일이 아니다.

## 7. 내 시험 도구에서 고친 것

- `scratch/doc_anchors.py` 가 트리를 base · tgt 로 고정해 X-static 의 tgt2 X26 이 빈 출력이었다. 트리 이름을 인자로 받도록 고치고 base · tgt · tgt2 를 다시 돌렸다. base · tgt 출력은 첫 대조와 같다.
- X14m 의 `!pwd` 줄에서 `"$H[^ ]*"` 가 zsh 첨자로 해석돼 실패했다. `"${H}[^ ]*"` 로 고쳐 다시 돌렸다.

## 8. 결정해 줄 것

1. X14m: 나중에 프로젝트를 정했을 때의 toast `the session moved to ~/sm` 가 일어난 일(세션은 옮기지 않았고 프로젝트를 이제 정했다)과 맞지 않는다. 고칠지 정해 줄 것. 권하는 것: run.root 가 빈 문자열에서 정해진 경우만 `project resolved: <경로>; loaded ...` 처럼 다른 글을 낸다. 지금 동작은 파일 자리 · 저장이 맞으므로 급하지 않다.
2. T117b 의 debug log 줄 끝이 빈 것(`->` 뒤 없음)을 그대로 둘지. 권하는 것: 그대로 두거나, 같은 카드에서 `-> (no file)` 처럼 NO_FILE 을 적는다.

증거: 브랜치 `k12-verify` (push 하지 않았다). `verification/logs/refactor2-*` 와 `refactor-out/<묶음>/tgt2/`.
