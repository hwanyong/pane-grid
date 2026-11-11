### c13 [assign] from=main to=k11 at=2026-11-11T19:14:35Z

recover 로 이어 갔다(state done, --force). claude --bg --resume a410a752-5f1a-4cfa-9399-c766bd15bacc → session=95cf730f-2e80-4eeb-bced-e9457e346605

### c14 [result] from=k11 to=main at=2026-11-11T19:27:25Z

c12 정정을 반영했다. 같은 worktree `.claude/worktrees/k11`, 브랜치 `k11-refactor` 위에 커밋 6개를 더했다(2d2d846..4934a60). push 하지 않았고 plugin.json version 은 0.5.1 그대로다.

## 1. 커밋

| 커밋 | 행 | 바뀐 것 |
|---|---|---|
| ce45e24 | T117e · X14 | 시작과 주기가 같은 `tryResolveProject` 를 쓴다. `projectFile()` 은 run.dir 이 빈 문자열이면 undefined 다. persist 는 `'written' \| 'changed' \| 'unresolved'` 를 돌려주고, 바꾸는 동작은 unresolved 면 이유를 단 `refused:` 를 낸다 |
| cbad508 | X12 | `run.config` 를 `string \| undefined` 로 바꿨다. undefined 가 「설정 디렉터리 없음」이고 빈 문자열은 루트 `/` 다 |
| 837a2aa | X23 | Chrome 이 종료 코드 0 이어도 PNG 초안이 없으면 두 초안을 옮기지 않고 종료 코드 1 로 끝난다 |
| 4faf56e | F71m · X24 | 초안 정리를 `try`/`finally` 로 옮겼다. 종료 코드 1 은 그대로다 |
| 97ef86a | X26 | `docs/grid-and-tabs.md:22` 의 앵커를 `hooks/render-keys.ts` 로 고쳤다 |
| 4934a60 | T109 · T106 | `docs/add-pane-grid-cell.md` Step 1 · Step 6 에 문단을 더했다(4절) |

커밋마다 `npx -y -p typescript tsc -p .` 출력 없음, `claude plugin validate .` 통과를 확인했다.

## 2. 행마다 고친 판의 출력

재현은 k12 의 `refactor-scripts/X-tty.zsh` · `X-cli.zsh` · `scratch/buildpy_fail.zsh` · `scratch/doc_anchors.py` 를 `/Users/uhd/.claude/jobs/a410a752/tmp/k12s/` 로 복사하고 J 경로만 바꿔 돌렸다. TREE 는 `fix`(작업 트리의 rsync 사본)다. 출력은 `tmp/k12s/out/X/fix/` 에 있다.

| 행 | 고친 판의 출력 |
|---|---|
| X14 (`X-tty.zsh fix X14`) | start failed · hook skipped 줄 없음. list `pane-grid: * main active=c1 {c1:50,c2:50}`. split -h `pane-grid: refused: this session's project is not resolved yet, so the layout cannot be saved; see the debug log`. debug log 의 `project not resolved: HooksError: ... $.fs.read(.../sm/.git) failed: EACCES` 23줄(주기가 1초마다 다시 정한다), EROFS · start failed · command failed 0줄. 스크립트 끝의 `chmod 644` 뒤 주기가 프로젝트를 정해 toast `the session moved to ~/sm; loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` 이 났다 |
| X12 (`X-cli.zsh fix X12`) | reload `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json`(`/pane-grid/layout.json` 이 없어 0.4.x 자리를 읽었다), split -h `the command failed; see the debug log`, log `$.fs.write(/pane-grid/projects/proj-<hash>/layout.json) failed: EROFS`. k12 의 base 출력과 같다 |
| X23 (`buildpy_fail.zsh fix nopng`) | exit=1, stderr `<W>/chrome exited with 0 but wrote no pane-structure.draft.png while rendering pane-structure.svg`, SVG · PNG 네 개 old, 초안 0개 |
| F71m · X24 (`buildpy_fail.zsh fix missing`) | exit=1, `FileNotFoundError: [Errno 2] No such file or directory: '<W>/chrome'` traceback, SVG · PNG 네 개 old, 초안 0개 |
| X26 (`doc_anchors.py`) | 고치기 전 `grid-and-tabs.md:22 hooks/register.tsx lacks TOOLBAR` 와 `grid-and-tabs.md:392 hooks/register.tsx lacks placedNote`, 고친 뒤 392행 줄만 남는다. 392행은 k12 가 두 판 공통이라고 적은 줄이라 고치지 않았다 |

추가로 돌린 것:

| 무엇 | 결과 |
|---|---|
| `buildpy_fail.zsh fix fail` | exit=1, stderr `fake chrome: GPU init failed` 와 `<W>/chrome exited with 3 while rendering pane-structure.svg`, 네 개 old, 초안 0개 |
| 실제 Chrome 으로 사본에서 `python3 -I docs/images/build.py` | exit=0, 초안 0개, SVG 두 장의 SHA-256 이 커밋된 것과 같다 |
| X10 (HOME · CLAUDE_CONFIG_DIR 둘 다 없음) | k12 tgt 출력과 같다(X12 수정이 「없음」 분기를 바꾸지 않았다) |
| X13 · X15 | k12 tgt 출력과 tmp 경로 글자만 다르다 |
| c11 의 run.zsh(48개 명령) | `tmp/sc/final-c12.txt` 가 c11 때의 `final-k11.txt` 와 프로젝트 hash · mcp-sdk 줄을 빼고 같다. 실패 hook 0 |

깨 보기(§8③): 사본의 `finally` 에서 두 `unlink` 를 뺀 build.py 로 `missing` 을 돌리자 `pane-structure.draft.svg new` 가 남았다. 되돌린 판은 초안 0개다.

## 3. 출력 문자열이 바뀐 자리

| 자리 | 바뀌기 전(k11 c11 판) | 바뀐 뒤 |
|---|---|---|
| 시작 때 프로젝트를 정하지 못한 세션의 바꾸는 `/grid` 동작 | `pane-grid: the command failed; see the debug log` | `refused: this session's project is not resolved yet, so the layout cannot be saved; see the debug log` |
| 같은 세션에서 분할선을 놓을 때 | (끌기가 state 를 바꾸고 persist 가 EROFS 로 실패) | 옮기지 않고 toast `pane-grid: refused: this session's project is not resolved yet, ...` |
| 시작 때 프로젝트를 정하지 못함(debug log) | `start failed: {"kind":"throw",...EACCES...}` | `project not resolved: HooksError: ... EACCES`(주기의 거부와 같은 줄) |
| `CLAUDE_CONFIG_DIR=/` 의 reload | `loaded 1 tab(s) from no file (neither HOME nor CLAUDE_CONFIG_DIR is set)` | `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` |
| build.py, PNG 없음 | `FileNotFoundError: ... pane-structure.draft.png -> ... pane-structure.png` | `<CHROME> exited with 0 but wrote no pane-structure.draft.png while rendering pane-structure.svg` |

## 4. 문서에 적은 자리

| 행 | 자리 | 적은 것 |
|---|---|---|
| T109 | `docs/add-pane-grid-cell.md` Step 1, 「`readPlacement` and `readShownTab` are `function` declarations」 문단 다음 | 0.5.1 이 export 7개(GRID_VERSION · SLOT_KEY · CHOICES_KEY · ACTIVE_SUFFIX · NONE_KEY · PLACE_KEY · CHOICE_HOTKEYS)를 더했다. 이전 파일도 같은 값의 상수를 export 하지 않고 가졌으므로 render key 와 layout version 은 그대로다. 지운 export · 바꾼 이름은 없고 0.5.1 전 사본도 동작한다. 다시 복사하면 offerChoice 의 `active` 칸 id 수정을 받는다. SKILL.md 는 이 가이드를 원본으로 읽게 하므로 고치지 않았다 |
| T106 | 같은 파일 Step 6, 「`readShownTab($)` gives the same value」 문단 다음 | 문서에 적었다. 시작 직후 첫 값에 기대지 말라고 적었다. 0.5.1 은 1초 shown 주기를 layout 파일 읽기 앞에 건다(main 판 `register.tsx:421-422` 는 뒤에 걸었다). 그래서 첫 `readShownTab` 이 탭 이름을 낼 수 있고 0.5.0 은 null 을 먼저 냈다. 자기 탭이 아닌 값(null 포함)을 모두 가려진 것으로 다룬다. member 가 기댈 동작이 아니라 「차례가 정해지지 않았다」는 것을 적었다 |

## 5. 남은 것

- 시작 때 프로젝트를 정하지 못한 동안 debug log 에 `project not resolved` 가 1초마다 한 줄씩 쌓인다. /cd 뒤 거부(10ad989)와 같은 처리라 그대로 두었다.
- 나중에 정해지면 주기가 「the session moved to ...」 toast 를 낸다. run.root 가 빈 문자열에서 바뀐 것으로 보기 때문이다.
- 사용자의 `~/.claude/pane-grid/` 는 건드리지 않았다. 시험은 모두 `tmp/k12s/run/X/home` 격리 HOME 에서 했다.
