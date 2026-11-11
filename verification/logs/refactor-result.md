## 1. 결과 요약

기준선 main dd6cda9 · 대상 k11-refactor 2d2d846 을 같은 입력으로 돌려 203행을 대조했다. 판정 규칙은 c1 이다. k11 c11 3절 · 4절이 근거인 차이만 「다름(의도)」이고, 2절만 근거인 차이는 「다름」으로 적고 비고에 그 F 번호를 남겼다.

| 묶음 | 행 | 같음 | 다름 | 다름(의도) | 실행하지 못함 |
|---|---|---|---|---|---|
| AB | 63 | 58 | 2 | 2 | 1 |
| C1 | 16 | 15 | 0 | 1 | 0 |
| C2 | 18 | 18 | 0 | 0 | 0 |
| D | 34 | 29 | 4 | 1 | 0 |
| E | 23 | 22 | 1 | 0 | 0 |
| F | 10 | 5 | 4 | 1 | 0 |
| R | 4 | 1 | 3 | 0 | 0 |
| X | 32 | 4 | 23 | 4 | 1 |
| Y | 2 | 2 | 0 | 0 | 0 |
| break | 1 | 0 | 1 | 0 | 0 |
| 합계 | 203 | 154 | 38 | 9 | 2 |

증거: 브랜치 `k12-verify` 커밋 08608c0 (push 하지 않았다)
- 전체 표: `verification/logs/refactor-table.md` (행마다 기준선 출력 · 대상 출력 · 판정 · 비고 · 증거 경로, 끝에 diff 덩어리 57개 검토 표)
- 두 판의 출력: `verification/logs/refactor-out/<묶음>/{base,tgt}/<id>.txt`, 묶음별 `rows.md` · `compare.txt`
- 대조 절차: `verification/logs/refactor-scripts/compare.zsh <묶음>` (행마다 cmp, 차이가 있으면 종료 코드 1). 공용 함수 `refactor-scripts/lib.zsh`, 묶음 스크립트 `refactor-scripts/*.zsh`
- tsc: 두 판 모두 종료 코드 0, 출력 없음(`refactor-tsc-{base,tgt}.txt`). `claude plugin validate`: 두 판 모두 `✔ Validation passed`(`refactor-validate-{base,tgt}.txt`, 표시 차이는 T108)

## 2. 의도 밖 차이 · 결함 후보 (고치지 않았다)

| 행 | 무엇이 다른가 | 원인 커밋 | 재현 |
|---|---|---|---|
| T117e · X14 | 시작 때 `.git` 을 읽을 수 없는 디렉터리면 base 는 /grid 를 등록하지 않는다. tgt 는 /grid 를 등록하고 run.dir 이 빈 채 persist 가 `/layout.json` 에 쓰려 해서 `$.fs.write(/layout.json) failed: EROFS` 가 난다. tgt `hooks/register.tsx:158` 의 `${run.dir}/${FILE_NAME}`, session.start 가 `$.command.register` 를 `resolveProject` 앞에 두고 거부 때 `.catch` 로 `start failed` 만 남긴다 | c16cdd4(F48) · 10ad989(F49) | `mkdir locked`; `locked/.git` 에 `gitdir: /nonexistent`; `chmod 000 locked/.git`; `DIR=locked g split -h` (`refactor-scripts/X-tty.zsh <TREE> X14`) |
| X12 | `CLAUDE_CONFIG_DIR=/` 이면 HOME 이 있어도 tgt 는 `no file (neither HOME nor CLAUDE_CONFIG_DIR is set)` 를 낸다. `replace(/\/+$/, '')` 가 `/` 를 빈 문자열로 만든다(`register.tsx:399-402`). base 는 `//pane-grid/...` 로 읽는다 | ee6c176(F59) | `refactor-scripts/X-cli.zsh <TREE> X12` |
| X23 | Chrome 이 종료 코드 0 인데 PNG 를 만들지 않으면 tgt `build.py` 는 종료 코드 1 이고 SVG 만 새것으로 바뀐다. `render()` 주석의 「이전 SVG · PNG 가 어긋나지 않는다」가 성립하지 않는다 | abb6d80(F71) | `refactor-scripts/scratch/buildpy_fail.zsh <TREE> nopng` |
| F71m · X24 | Chrome 실행 파일이 없으면 FileNotFoundError 로 `returncode != 0` 분기에 도달하지 않아 `docs/images/pane-structure.draft.svg` 가 추적되지 않는 파일로 남는다 | abb6d80(F71) | `refactor-scripts/scratch/buildpy_fail.zsh <TREE> missing` |
| X26 | `docs/grid-and-tabs.md:22` 결정 10 의 TOOLBAR 앵커가 `hooks/register.tsx` 를 가리키는데 실제 자리는 `hooks/render-keys.ts:34-36` 이다. 동작 차이는 없다 | e030382 (a147478 이 옮김) | 문서 대조 |
| T106 | 시작 직후 아래 mod 의 첫 `readShownTab` 이 base 는 null 한 번, tgt 는 처음부터 `"main"`. session.start 가 watchShown 주기를 reload 앞에 건다. 화면 차이는 없다 | c16cdd4 | `refactor-scripts/E.zsh <TREE> T106` |
| T109 | `pane-grid.ts` export 가 8개에서 15개로 늘었다(GRID_VERSION, SLOT_KEY CHOICES_KEY ACTIVE_SUFFIX NONE_KEY PLACE_KEY CHOICE_HOTKEYS). member mod 가 복사하는 파일이다. 지운 export 는 없다 | e8502cc(F65) · a42b576(F66) | `refactor-out/F/{base,tgt}/T109.txt` |
| T108 | validate 가 ui.press matcher 를 `element=?` 로 표시한다(PRESS_KEY 가 `new RegExp`). 실행 때 정규식 source 는 두 판 모두 `^(place:\|hotkey:)` 이고 시험 문자열 10개 판정이 같다(T116). 다른 mod element 누름에 hook 이 불리지 않는 것도 두 판 같다 | a147478 | `refactor-out/F/*/T108.txt` · `refactor-out/C1/*/T116.txt` |

두 판에 공통인 기존 결함(리팩터링과 무관, 「같음」):
- T114: close 응답의 `; it is behind w3, …` 접미가 두 판 모두 흔들린다(base 13번 중 5번, tgt 9번 중 4번 없음). `refactor-out/C1/T114.raw`
- X1 관련: 유한한 큰 size(1e308) 두 개는 두 판 모두 합이 Infinity 가 되어 크기가 NaN 이 되고 list 에 `null` 로 나온다
- 재현하지 못한 것: run.queue job 이 끝나지 않으면 뒤 job 이 모두 기다린다(코드 검토에서 나온 위험, 실행으로 만들지 못했다)

## 3. 깨 본 대조 (§8③)

버린 사본 `broke` 의 `hooks/actions.ts:122` 를 `share > SHARE_MAX` 에서 `share > SHARE_MAX + 1` 로 바꾸고 AB 묶음을 돌렸다. 사본은 지웠고 깨 본 커밋은 없다.

```
$ zsh compare.zsh AB tgt broke
T44 DIFF
    -pane-grid: usage: resize <1-99>
    +pane-grid: resized c1 to 100%
    -NOFILE
    +{ ... 쓰인 layout.json ... }
summary: same=61 diff=1 missing=0
(종료 코드 1)
```

base 와 대조하면 T17 T44 T56 T94 T98 이 DIFF 였다. T44 를 뺀 네 행은 깨기 전 base 대 tgt 대조의 DIFF 행과 같다. 전문: `refactor-out/break/compare-{tgt,base}-broke.txt`

## 4. 사용자 실제 파일 SHA-256

| 파일 | 시작 2026-11-11T17:03:31Z | 끝 2026-11-11T19:09:47Z |
|---|---|---|
| `~/.claude/pane-grid/layout.json` | 1dca3aebdfa19b977e8a6b4ed3812e0d312357071abc32de70170837427918c5 | 같음 |
| `projects/CloudLLM-Claude-code-6468e2a086c7fdc4/layout.json` | c978e66404a4ff21f8c94a60a090ed04f52a9ca14cb806d50fc88a03f01d08ce | 같음 |
| `projects/hwanyong.github.io-6c87ed0b1be55dbe/layout.json` | b7b413d1d56752eccba8afb04ffd2fec506e07a266ba86e47c8e968046caddf3 | 같음 |
| `projects/plugin-pane-grid-6314d9b7b3856a6d/layout.json` | 454dcf08df3ae581c4adce65926892e9bcb36b94a5908f3dc2ca7e8795072451 | 같음 |
| `projects/rea_cathode-bdad1510bdb093c0/layout.json` | 0e9220233c729ee55371f79634b4d60b3e035f6b257ffa4c0d85571dfa4cc6a3 | 같음 |
| `projects/skill-kanban-8c90ad5db404dce5/layout.json` | f34bc87f97342bed27efcc751ee6fe56785af2b7f53f4b3198cea830d2943609 | 같음 |

SHA-256 줄을 정렬해 `diff` 한 출력이 비었다(`refactor-sha.txt`). projects 디렉터리 목록(다섯 개)도 같다.

다른 곳에 남긴 것: X10(HOME 없음) 실행 중 claude 가 실제 `~/.claude/projects/` 에 세션 기록 디렉터리를 만들었고 시험 에이전트가 실행 뒤 지웠다. pane-grid 파일이 아니다.

## 5. 실행하지 못함

| 행 | 이유 |
|---|---|
| T97 `there is no tab` | 탭 목록이 빈 배열이 되는 입력이 없다. loadFile 은 탭 하나짜리 기본값을 쓰고 parse 는 탭 0개를 거부하고 close 는 마지막 탭을 거부한다. 두 판 모두 그렇다 |
| X20 run.measured 의 surface 키 | tmux 로는 terminal surface 하나만 띄울 수 있다. 같은 내용을 R-F54 가 headless SDK 로 실행했다 |

T93(Client 가 없는 surface)은 E 묶음에서 실행하지 못했다가 Y 묶음에서 headless SDK mobile surface 로 실행해 「같음」이다. F67 의 활성 분기는 T128 로 실행해 「같음」이다.

## 6. 내 시험 도구의 결함과 영향

`lib.zsh` 를 `GROUP=X TREE=Y source lib.zsh` 꼴로 부르면 zsh 가 대입을 source 뒤 되돌려 tmux 소켓이 `pgt-` 로 합쳐진다. 또 `--debug-file` 은 덧붙여 쓴다(claude 2.1.322). 판정에 쓴 AB · C1 · C2 · D · E · X 스크립트는 `GROUP=..;` 꼴이고 실행 전 log 를 지운다. 잘못된 꼴은 탐색용 `C2-x.zsh` 와 R 묶음 스크립트뿐이고 R 은 tmux 를 쓰지 않으므로 판정에 영향이 없다고 판단했다.

## 7. 「다름」 행 전부 (재현 · 두 출력 · 원인 커밋)

출력은 앞 240자만 적었다. 전문은 각 행의 증거 경로에 있다.

| id | 시나리오 | 기준선 | 대상 | 비고(재현 · 원인 커밋) | 증거 |
|---|---|---|---|---|---|
| T108 | claude plugin validate | ✔ Validation passed, exit 0. ui.press 필터 element=/"^(place\|hotkey):"/. calls 에 $.session.cwd 없음 | ✔ Validation passed, exit 0. ui.press 필터 element=?. calls 에 $.session.cwd 있음 | 검증 통과 여부는 같다. 차이 두 가지 모두 k11 c11 3·4절에 없다. (1) element=?: a147478 이 matcher 를 hooks/render-keys.ts:15 의 PRESS_KEY(new RegExp)로 바꿔 validate 가 값을 정적으로 표시하지 못한다. 실제 판정은 T108p 에서 같았다. (2) $.session.cwd: ee6c176(F59, 상대 CLAUDE_CONFIG_DIR 을 시작 디렉터리 기준으로 읽음)이 register.tsx:401 에서 부른다. F59 는 k11 2절에 의도한 수정으로 있다 | out/F/base/T108.txt, out/F/tgt/T108.txt |
| T109 | pane-grid.ts 의 export 이름 · 매개변수 · 반환형 · 값 | export 8개: TOOLBAR_KEYS ["v","s","o","z","x","w","b","c","k","q"], fillSlot length=3, isScrollIn 2, offerChoice 4, placementIn 2, readPlacement AsyncFunction 2, readShownTab AsyncFunction 1, scrollsKey 1 | 같은 8개가 선언 줄까지 같고, 7개가 더 있다: GRID_VERSION 1, SLOT_KEY "slot:", CHOICES_KEY "choices:", ACTIVE_SUFFIX ":active", NONE_KEY "none:", PLACE_KEY "place:", CHOICE_HOTKEYS 9 | 지운 export 는 없고 7개가 늘었다. GRID_VERSION 은 e8502cc(F65), 나머지 6개는 a42b576(F66)에서 더해졌다. k11 c11 2절에는 있으나 3·4절에는 없다. member mod 가 복사하는 파일의 export 목록이 바뀌었다. k10 기대(export 8줄)와도 어긋난다 | out/F/base/T109.txt, out/F/tgt/T109.txt |
| F71s | 정상 실행이 만든 SVG · PNG 의 sha256 | svg 16e12066… · 2a6a00c8…, png eb8814c8… · a1a1c8a6… | svg 51d96c8e… · 7cd7ecb4…, png 두 장은 base 와 같다 | SVG 두 장에서 <marker id="arrow-fail"> 정의가 2줄씩 빠졌다(두 사본의 SVG 를 diff 해 확인). 원인은 a930a1c(F73 2단계)다. k11 2절 F73 행에 적혀 있으나 3·4절에는 없다. PNG 바이트는 같다 | out/F/base/F71s.txt, out/F/tgt/F71s.txt |
| F71m | Chrome 실행 파일이 없을 때(CHROME=/nonexistent/chrome) | FileNotFoundError: [Errno 2] No such file or directory: '/nonexistent/chrome' traceback, exit 1, status 빈 줄 | 같은 traceback, exit 1, status `?? docs/images/pane-structure.draft.svg` | 원인 abb6d80. render() 가 svg_draft 를 쓴 뒤 subprocess.run 을 부른다. 실행 파일이 없으면 FileNotFoundError 가 나서 returncode != 0 분기에 도달하지 않으므로 draft 가 지워지지 않는다. 그래서 저장소의 docs/images/ 에 추적되지 않는 파일이 남는다. 3절 F71 행은 0 이 아닌 종료 코드만 다룬다. 재현: tgt 를 복사하고, 커밋하기 전에 docs/images/build.py 의 CHROME 줄을 "/nonexistent/chrome" 으로 바꾼다. 그다음 git init · add · commit 하고 python3 docs/images/build.py 를 돌린 뒤 git status --short docs/images 를 본다 | out/F/base/F71m.txt, out/F/tgt/F71m.txt |
| T56 | 칸 하나에서 resize · layout | resized c1 to 50% / layout tiled / * main active=c1 c1 · ls after layout.json(파일 생김) | resized c1 to 50% / layout tiled / * main active=c1 c1 · ls after 없음 · 파일 NOFILE | 재현: reset F1; g resize 50; g layout tiled; g list; ls $(pdir $PROJ). 원인으로 보이는 커밋은 8e2c8c3(F17, tgt actions.ts:175-178 의 JSON 비교로 isChanged false)이다. c11 2절에는 있지만 3절 · 4절에 없다. k10 기대(파일이 쓰인다)와 tgt 가 어긋난다. | out/AB/{base,tgt}/T56.txt |
| T98 | checkOutcome 의 refused | (g split -h Foo) split c1 into c1 and c3 / 다음 list * main active=c1 c1 · log refused | refused: tabs[0].root.children[1].node: plugin must match … / * main active=c1 {c1:50,c2:50} · 파일 NOFILE | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] F12(70b85fd) 와 같은 원인이고 c11 3절은 place 의 경우만 적었다. k10 기대의 세 이유에는 두 판 모두 도달하지 못했다. | out/AB/{base,tgt}/T98.txt |
| T106 | E readShownTab | 체크포인트 "main" / new w2 뒤 "w2" / select main 뒤 "main"; 전체 줄 null → "main" → "w2" → "main"; pane-grid 없이 null | 체크포인트 같음; 전체 줄 "main" → "w2" → "main"(시작 직후 null 줄 없음); pane-grid 없이 null | 재현: `zsh scripts/E.zsh <TREE> T106`(base · tgt 각 두 번, 두 번 모두 같은 차이). 원인으로 보이는 커밋 c16cdd4: session.start 가 watchShown 주기를 reload 앞에 걸어, pane-grid 가 SHOWN 을 아래 mod 의 첫 1초 poll 보다 먼저 쓴다(tgt log: session.start settled 11.012, k12shown 첫 줄 12.008 "main"). k11 c11 3 · 4절에 없는 차이. 화면 차이는 없다. k10 은 조작 방법 미확인이었고, 시험용 plugin k12shown 으로 실행했다 | out/E/base/T106.txt · out/E/tgt/T106.txt · out/E/tgt/T106-order.log |
| R-F47 | /clear 뒤 render 뒤 콜백 · watchShown 이 겹쳐 부르는 ensureLayout(무효 global 파일, 사본 loadFile 3초 지연) | /clear 한 번 뒤 `layout state is empty` 4줄, `layout file … refused: tabs must be a list of one tab or more` 4줄, `$.ui.toast (pane-grid): … is not a valid layout …` 4줄, `layout revision=` 4줄. 지연 없는 원래 트리에서는 각 1줄 | 지연 사본과 원래 트리 모두 `layout state is empty` 1줄, refused 1줄, toast 1줄, `layout revision=1` 1줄 | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] 결함 창은 사본 지연으로 만들었다(scripts/R-steps/patch.py delay47). 지연이 없으면 base 도 load 를 1번만 했다. 고친 커밋은 cbaa798(run.restoring). 재현 명령: zsh scripts/R-f47.zsh <TREE> | /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/base/R-F47.txt , /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/tgt/R-F47.txt |
| R-F54 | 크기가 다른 두 surface(desktop 100x40 · mobile 50x30)가 같은 grid 탭을 번갈아 그림 + mobile 휠 + desktop 분할선 끌기 | placed 가 render 마다 50↔25 칸으로 바뀌어 `layout revision=` 1~10(10줄). mobile 휠(col 30)은 c2 를 골라 `c2.marginTop=-1`. desktop 에서 at=70 으로 끌기는 mobile 너비로 계산돼 `cellbox:c1 w=97 … cellbox:c2 w=2`, 파일 size 97.95/2.05 | placed 는 desktop 크기로 고정, `layout revision=` 1~3(3줄, 3 은 끌기). mobile 휠은 desktop 크기로 c1 을 골라 `c1.marginTop=-1`. 끌기 결과는 `cellbox:c1 w=70 … cellbox:c2 w=29`, 파일 size 70.7/29.3 | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] 창 없이 headless SDK 의 ui_attach 두 개로 결함 창을 만들었다. 고친 커밋은 2f02c54. mobile 휠이 desktop 크기로 칸을 고르는 것은 k11 c11 7절에 적힌 한계다(UiScrollInput 에 surface 필드가 없다). terminal 이 없을 때의 기준 surface 는 먼저 잰 surface(desktop)였다. 재현 명령: R.zsh 의 run_f54 | /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/base/R-F54.txt , /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/tgt/R-F54.txt |
| R-F63 | 크기 변경 render(100→60 칸) 뒤 measure 보고 전에, 스스로 스크롤하는 member 칸 위로 휠 | 창 안의 휠(col 40)에 `rscroller:` 줄이 없다. pane-grid 가 옛 placed(column 51)로 isScrollIn 을 false 로 판정해 휠을 버렸다. measure 60 뒤 `layout revision=3` 이 나왔고 그 뒤 휠은 전달됐다 | 창 안의 휠 앞에 `layout revision=3` 이 나왔고 이어 `rscroller: scroll by=1 pointer={40,10} placement={31,29}`. measure 60 뒤 휠도 전달됐다 | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] measure ui.message 를 늦게 보내 결함 창을 만들었다. 고친 커밋은 7d95ac7. chain 에서 pane-grid 아래의 member 도 새 placement(column 31)를 읽었다. 시험 member 는 scripts/R-scroller 다. 재현 명령: R.zsh 의 run_f63 | /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/base/R-F63.txt , /Users/uhd/.claude/jobs/2d2d4469/tmp/out/R/tgt/R-F63.txt |
| X1 | tree.ts:73-79 normalize Number.isFinite(sum), size 1e308 두 개 (f141608) | `* main active=c1 {c1:null,c2:null}` / split 뒤 `{c1:33.33,c3:33.33,c2:33.34}` | `* main active=c1 {c1:50,c2:50}` / split 뒤 `{c1:25,c3:25,c2:50}` | k11 c11 2절 F10 의 의도한 수정이지만 3절·4절에는 없다. base 의 NaN 은 list 에 null 로 나온다. 두 판 모두 failed 0 | out/X/base/X1.txt, out/X/tgt/X1.txt |
| X2 | tree.ts:224-233 moveDivider before+after<MIN_PART*2, column [98,1,1] 마지막 분할선 3행 위로 (76ca1d2) | `pane-grid: * main active=c1 [c1:96,c2:1,c3:3]`, 끈 뒤 c3 제목이 보인다 | `pane-grid: * main active=c1 [c1:98,c2:1,c3:1]`, c2 제목만 보인다 | 2절 F2. 높이 45 에서 끌기 전 c3 가 0행인 것을 화면으로 확인했다 | out/X/base/X2.txt, out/X/tgt/X2.txt |
| X3 | actions.ts:105 place 의 activate, zoom 중 활성이 아닌 c2 에 place (2365df8) | 응답 `zoomed c1` / `placed usage-gauge in c2` / `* main active=c2 zoomed {c1:50,c2=usage-gauge:50}`, 파일 active=c2 zoomed=c1 | 응답 같음, 파일 active=c2 zoomed=c2 | 2절 F16. place - c1 뒤는 두 판 모두 c1 c1 | out/X/base/X3.txt, out/X/tgt/X3.txt |
| X4a | actions.ts:175-178 탭 목록이 같으면 쓰지 않음: next · select-cell c1 · resize 50 · place - c2 (8e2c8c3) | 응답 `active cell c1` 등, 네 경우 모두 프로젝트 파일을 쓴다 | 응답 같음, 앞 세 경우 NOFILE, place - c2 는 파일을 쓴다 | 2절 F17. place - c2 는 활성 칸을 바꾸므로 두 판 모두 쓴다. 시나리오의 「빈 칸 place - 는 tgt NOFILE」 과 다르다 | out/X/base/X4a.txt, out/X/tgt/X4a.txt |
| X4b | 8e2c8c3 같은 변경, 깨진 프로젝트 파일 뒤 select-cell c1 | ls `layout.invalid.json layout.json`, invalid 내용 `not json`, 새 layout.json 은 탭 JSON | ls `layout.json`, 내용 `not json` | 2절 F17 | out/X/base/X4b.txt, out/X/tgt/X4b.txt |
| X4c | 8e2c8c3 같은 변경, 밖에서 프로젝트 파일을 쓴 뒤 대화형 select-cell c1 | `pane-grid: refused: another session changed this project's layout; loaded ~/.claude/pane-grid/projects/proj-<hash>/layout.json again, do it once more` | `pane-grid: active cell c1` | 2절 F17. 동시 claude 한 개 제한으로 둘째 세션 대신 밖의 쓰기를 썼다 | out/X/base/X4c.txt, out/X/tgt/X4c.txt |
| X5 | layout-file.ts:83-102 checkTabs 의 plugin 이름 규칙: split -h Foo · place Foo c2 · place -x (70b85fd) | `split c1 into c1 and c3`(파일 씀, 다음 list `* main active=c1 c1`, log `refused: tabs[0].root.children[1].node: plugin must match …`) / `placed Foo in c2` / `placed -x in c1` | `refused: tabs[0].root.children[1].node: plugin must match /^[a-z0-9][a-z0-9_.-]{0,127}$/`(split · place c2), `refused: tabs[0].root.children[0].node: …`(place -x), 세 경우 NOFILE, list `{c1:50,c2:50}` | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] 3절 F12 · 4절 T94. split 경로의 자리 문자열은 3절에 없지만 같은 규칙이다. 목록의 5번 · 7번을 합쳤다 | out/X/base/X5.txt, out/X/tgt/X5.txt |
| X6 | layout-file.ts:47 size 1e999(Infinity) (f141608) | `* main active=c1 {c1:null,c2:null}` / split 뒤 `{c1:33.33,c3:33.33,c2:33.34}` | `* main active=c1 {c1:1.96,c2:98.04}` / split 뒤 `{c1:1,c3:1,c2:98}` | 2절 F10. 시나리오 기대와 같다 | out/X/base/X6.txt, out/X/tgt/X6.txt |
| X8 | skills/add-pane-grid-cell/SKILL.md:39 member 사본 절차 (99fcd59) | TOOLBAR_KEYS 0줄, Keep 문장 NONE, export 8줄 | TOOLBAR_KEYS 1줄, `Keep GRID_VERSION and the render key constants (SLOT_KEY, CHOICES_KEY, ACTIVE_SUFFIX, NONE_KEY, PLACE_KEY, CHOICE_HOTKEYS)`, export 15줄 | 2절 F69. 정적 대조만 했다. SKILL.md 대로 지운 사본의 실행은 하지 않았다 | out/X/base/X8.txt, out/X/tgt/X8.txt |
| X9 | .claude-plugin/plugin.json:3 version (2d2d846) | `0.5.0` | `0.5.1` | c11 1절 version 행의 의도한 변경이지만 3절·4절에는 없다 | out/X/base/X9.txt, out/X/tgt/X9.txt |
| X11 | register.tsx:401 상대 CLAUDE_CONFIG_DIR=rel (ee6c176) | 셋째 reload `loaded 1 tab(s) from rel/pane-grid/projects/proj-<hash>/layout.json` | `loaded 1 tab(s) from ~/proj/rel/pane-grid/projects/proj-<hash>/layout.json` | 2절 F59. 앞 두 출력과 파일 자리는 같다. /cd 뒤 경우는 돌리지 않았다 | out/X/base/X11.txt, out/X/tgt/X11.txt |
| X12 | register.tsx:399-402 CLAUDE_CONFIG_DIR=/ (ee6c176) | reload `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json`, split -h `the command failed; see the debug log`(`$.fs.write(/pane-grid/projects/proj-<hash>/layout.json) failed: EROFS`) | reload `loaded 1 tab(s) from no file (neither HOME nor CLAUDE_CONFIG_DIR is set)`, split -h `split c1 into c1 and c2` | 의도 밖. HOME 이 설정돼 있는데도 「neither HOME nor CLAUDE_CONFIG_DIR is set」 를 낸다. 원인 커밋 ee6c176. 재현: zsh scripts/X-cli.zsh <TREE> X12 | out/X/base/X12.txt, out/X/tgt/X12.txt |
| X13 | register.tsx:403-412 시작 차례와 catch, global 파일 chmod 000 뒤 644 (c16cdd4) | `hook skipped` 1줄(`session.start hook skipped: threw pane-grid: $.fs.read(…`), `start failed` 0줄, 644 뒤 c1 제목 0줄 | `start failed` 1줄(`pane-grid: start failed: {"kind":"throw",…`), `hook skipped` 0줄, 644 뒤 grid 를 그린다, `layout state is empty` 있음 | 2절 F48. 목록 14번 · 19번을 합쳤다 | out/X/base/X13.txt, out/X/tgt/X13.txt |
| X14 | register.tsx:405-407 시작 때 resolveProject 거부(.git EACCES) (c16cdd4) | list · split 모두 `Unknown command: /grid` | list `pane-grid: * main active=c1 {c1:50,c2:50}`, split -h `the command failed; see the debug log`, log `$.fs.write(/layout.json) failed: EROFS` | 의도 밖(F48 의 등록 차례와 F49 의 run.root 대입이 겹쳐 생긴다). 원인 커밋 c16cdd4 · 10ad989. 재현: zsh scripts/X-tty.zsh <TREE> X14 | out/X/base/X14.txt, out/X/tgt/X14.txt |
| X15 | register.tsx:198-213 /cd 뒤 프로젝트 거부와 회복 (10ad989) | `$.fs.read (not awaited)` 1줄, `project not resolved` 0줄, 권한 회복 뒤 toast 없음, project `~/proj` 그대로 | `project not resolved: HooksError: …` 여러 줄, 회복 뒤 toast `pane-grid: the session moved to ~/sm; loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` | 2절 F49 | out/X/base/X15.txt, out/X/tgt/X15.txt |
| X16 | register.tsx:240 loadFile 이 invalidText 를 지움 (1ca03e9) | ls `layout.invalid.json layout.json`, invalid `not json`, log `kept the invalid layout file as …` | ls `layout.json`, invalid NONE | 2절 F40 | out/X/base/X16.txt, out/X/tgt/X16.txt |
| X18 | register.tsx:529 drawCell isActive=activeOf, zoomed c2 · active c1 (2365df8) | c2 제목 SGR `[0m[38;5;246m`, 선택지 `usage-gauge`, 클릭에 `pane-grid: action select-cell c2: active cell c2`, 키 1 `placed usage-gauge in c2` | 제목 SGR `[0;1m[38;5;72m`, 선택지 `1: usage-gauge`, 클릭에 action 없음, 키 1 `placed usage-gauge in c2` | 2절 F16. k10 기대와 어긋난다: 시나리오는 base 의 키 1 이 toast 를 내지 않는다고 했지만 두 판 모두 toast 를 냈다 | out/X/base/X18.txt, out/X/tgt/X18.txt |
| X21 | register.tsx:78-89 serial 큐, hotkey vvvv 를 한 번에 (3ba5537) | action 4줄 모두 `split -h: split c1 into c1 and c3`, list `* main active=c3 {c1:25,c3:25,c2:50}` | `split c1 into c1 and c3` / `c3 into c3 and c4` / `c4 into c4 and c5` / `c5 into c5 and c6`, list `* main active=c6 {c1:25,c3:12.5,c4:6.25,c5:3.12,c6:3.12,c2:50.01}` | 2절 F50. k10 기대와 어긋난다: 시나리오는 두 판 같음을 기대했다. base 는 겹친 dispatch 가 같은 상태에서 계산해 세 번을 잃는다. 큐가 막히는 경우는 재현하지 않았다 | out/X/base/X21.txt, out/X/tgt/X21.txt |
| X23 | build.py:328-329 Chrome 종료 코드 0, PNG 없음 (abb6d80) | exit=0, stdout `<W>/pane-structure.png` `<W>/pane-lifecycle.png`, 두 SVG new · 두 PNG old | exit=1, `FileNotFoundError: [Errno 2] No such file or directory: '<W>/pane-structure.draft.png' -> '<W>/pane-structure.png'`, pane-structure.svg new · 나머지 old | 의도 밖. render() 주석의 「이전 SVG · PNG 가 어긋나지 않는다」가 성립하지 않는다. 원인 커밋 abb6d80. 재현: zsh scratch/buildpy_fail.zsh <TREE> nopng | out/X/base/X23.txt, out/X/tgt/X23.txt |
| X24 | build.py:316-322 CHROME 실행 파일 없음 (abb6d80) | exit=1, FileNotFoundError, pane-structure.svg new, draft 없음 | exit=1, 같은 예외, pane-structure.svg old, `pane-structure.draft.svg new` 가 남는다 | 의도 밖. 저장소에서는 untracked draft 가 남는다. 원인 커밋 abb6d80. 재현: zsh scratch/buildpy_fail.zsh <TREE> missing | out/X/base/X24.txt, out/X/tgt/X24.txt |
| X25 | build.py:79-90 SVG defs 의 arrow-fail marker (a930a1c) | 두 그림 marker 정의 1개 · 참조 0, committed == generated True | 정의 0 · 참조 0, 그 밖의 줄은 같음, PNG SHA-256 같음, committed == generated True | 2절 F73 의 의도한 변경이지만 3절·4절에는 없다. PNG 바이트는 같다 | out/X/base/X25.txt, out/X/tgt/X25.txt |
| X26 | docs/grid-and-tabs.md:22 결정 10 의 TOOLBAR 앵커 (e030382) | `grid-and-tabs.md:392 hooks/register.tsx lacks placedNote` | 그 줄과 `grid-and-tabs.md:22 hooks/register.tsx lacks TOOLBAR` | 의도 밖 문서 결함이고 동작 차이는 없다. TOOLBAR 는 tgt hooks/render-keys.ts:34-36 에 있다(a147478 이 옮겼다). placedNote 줄은 두 판 공통 | out/X/base/X26.txt, out/X/tgt/X26.txt |
| X27 | docs/grid-and-tabs.md:92 최소 크기, F1 탭에 split -h 여덟 번 (e030382) | split 8줄 거부 없음, list `{c1:49.29,c2:24.64,c3:12.32,c4:6.16,c5:3.07,c6:1.53,c7:1,c8:1,c9:0.99}`, 칸 제목 4개 | split 8줄 같음, list `{c1:48.57,c2:25,c3:12.5,c4:6.25,c5:3.12,c6:1.56,c7:1,c8:1,c9:1}`, 칸 제목 4개 | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] 문서 문장(거부 없음 · 너비 0 인 칸에는 제목이 없음)은 두 판 같다. list 차이는 F1(76ca1d2, 4절 T17 의 새 기대값)이다. scratch/x27-trace.mts 로 보면 여덟째 split 에서 base 의 메모리 안 c9 가 -0.43 이다. T17 은 다른 입력이라 엄격히 보면 「다름」이다 | out/X/base/X27.txt, out/X/tgt/X27.txt |
| T117b-rel | 상대 CLAUDE_CONFIG_DIR(F59) | log `-> rel-cfg/pane-grid/projects/proj-…` | log `-> $H/proj/rel-cfg/pane-grid/projects/proj-…` | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] 쓰인 파일 자리는 같다. c11 2절 F59 · ee6c176 본문에 있고 3절 표에는 없다. /cd 뒤 차이는 방법 C 가 대화형에서 로그인하지 못해 실행하지 못함 | out/D/{base,tgt}/T117b-rel.txt |
| T117c | $.session.cwd 호출을 넣은 커밋 | 호출 0곳 | 호출 1곳(register.tsx:401, 상대 경로일 때만) | [c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] git log -S 결과 ee6c176(F59) 하나. F49 10ad989 · F50 3ba5537 과 무관. 실행 대조가 아닌 조사 행 | out/D/T117c.txt |
| T117d | 무효 파일 뒤 유효 파일을 다시 읽고 저장(F40) | 둘째 split 뒤 layout.invalid.json 생성(내용 `not json`), log `kept the invalid layout file …` | layout.invalid.json 없음, kept log 없음. 응답은 같다 | 재현: 무효 프로젝트 파일로 up → 파일을 F2 로 바꿈 → /grid split -h 두 번. 원인 1ca03e9(F40). c11 2절의 의도한 수정이지만 3·4절에 없다 | out/D/{base,tgt}/T117d.txt |
| T117e | .git 을 읽을 수 없는 디렉터리(F48 · F49) | `session.start hook skipped: threw … $.fs.read($H/locked/.git) failed: EACCES`, /grid 가 등록되지 않아 모델이 글로 답함 | log `start failed: … EACCES`, list `* main active=c1 c1`, split `pane-grid: the command failed; see the debug log`, log `$.fs.write(/layout.json) failed: EROFS` | 재현: mkdir locked; .git 에 `gitdir: /nonexistent`; chmod 000; DIR=locked g split -h. 원인 c16cdd4(F48) · 10ad989(F49). 결함 후보: projectOf 가 거부되면 run.dir 이 빈 채로 persist 가 `/layout.json` 에 쓰려 한다(tgt register.tsx:158, 217-236) | out/D/{base,tgt}/T117e.txt |

## 8. 「다름(의도)」 행

| id | 근거 |
|---|---|
| F71f | k11 c11 3절 F71 행 그대로다(abb6d80). build.py 에는 Chrome 경로를 바꾸는 환경 변수 · 인자가 없어서 사본의 CHROME 상수 줄을 sed 로 바꿨다 |
| T17 | c11 4절 T17 행(F1, 76ca1d2)의 새 기대값과 tgt 가 같다. base 는 k10 기대와 같다. |
| T94 | c11 3절 F12 행 · 4절 T94 행(70b85fd)과 같다. |
| T35 | k11 c11 3절 F60 행과 4절 T35 행(f0cea8b). 두 회차 모두 같은 차이였다 |
| X7 | 4절 새 행 F67 |
| X10 | 3절 F59 두 행. HOME 을 빈 문자열로 돌렸다(pane-grid 는 `?? ''` 라 같은 분기다). claude 가 실제 ~/.claude/projects 에 세션 기록 디렉터리를 만들어서 실행 뒤 지웠다 |
| X17 | 3절 F58. 목록 18번 · 21번을 합쳤다. 화면 배치는 두 판 같다 |
| X22 | 3절 F71 |
| T117b | k11 c11 3절 F59 의 두 행, ee6c176. tgt log `project … -> /pane-grid/projects/…` 는 쓰지 않는 경로를 적는다 |

## 9. 결정해 줄 것

1. 2절만 근거인 「다름」 행(T56 T98 T109 F71s X1~X4c X6 X8 X9 X11 X13 X15 X16 X18 X21 X25 X27 T117d R-F47 R-F54 R-F63 T117b-rel T117c 등)을 k11 의 의도한 수정으로 인정할지. 인정하면 「다름(의도)」로 바꾸면 되고 행 내용은 그대로다.
2. 의도 밖 결함 후보 여섯 가지(T117e · X14 의 `/layout.json` 쓰기, X12, X23, F71m · X24, X26, T106)를 고칠 카드로 보낼지. 권하는 것: T117e · X14 와 X12 는 사용자 파일 자리에 관한 것이라 먼저 고칠 카드로, X23 · F71m · X26 은 묶어서 한 카드로, T106 · T109 는 문서에 적는 것으로 끝낸다.
