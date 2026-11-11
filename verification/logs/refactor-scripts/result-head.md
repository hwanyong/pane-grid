## 1. 결과 요약

기준선 main dd6cda9 · 대상 k11-refactor 2d2d846 을 같은 입력으로 돌려 203행을 대조했다. 판정 규칙은 c1 이다. k11 c11 3절 · 4절이 근거인 차이만 「다름(의도)」이고, 2절만 근거인 차이는 「다름」으로 적고 비고에 그 F 번호를 남겼다.

| 묶음 | 행 | 같음 | 다름 | 다름(의도) | 실행하지 못함 |
|---|---|---|---|---|---|
{{SUMMARY}}

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

