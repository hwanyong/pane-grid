# 묶음 E: member mod 배치 (대화형, 방법 H)

- 스크립트: `/Users/uhd/.claude/jobs/2d2d4469/tmp/scripts/E.zsh <TREE> [행 id ...]`. 대조: `zsh /Users/uhd/.claude/jobs/2d2d4469/tmp/compare.zsh E`.
- 실행: base 전부 → tgt 전부(첫 대조 `out/E-compare1.txt`: same 14 · diff 10). DIFF 10개 중 9개는 usage-gauge 막대의 채운 길이(실제 사용량)가 두 실행 사이에 한 칸 늘어난 것이라 정규화에 `█`→`░` 을 더했다. 이어 T81~T92 · T106 을 base · tgt 에서 다시 돌렸다(두 번째 대조 `out/E-compare2.txt`: same 23 · diff 1).
- 시험용 plugin: member-probe(`$J/member-probe-<TREE>`), 이 카드가 만든 `$J/probe-src/k12shown`(readShownTab 을 log 에 적는다, T106) · `$J/probe-src/k12nothing`(grid pane 의 ui.render 를 hook 하고 cell: Box 를 내지 않는다, T87). 모두 저장소 밖 tmp 에 있다.
- 포크 mod 다섯 개는 SMB 위 폴더(브랜치 pane-grid-cell)를 그대로 `--plugin-dir` 로 줬다. fixture 는 F2 의 c1 에 그 mod(활성 c1). terminal-browser 는 `/browser` 를 보내지 않아 브라우저를 띄우지 않았다(칸에 `Run /browser [url] to open a page here` 만 그린다).
- 화면 정규화: grid pane(문자 index 95 부터)만, mod 가 놓인 칸의 숫자 → `N`, `█` → `░`. 그래서 `0.3.0` · `k12nothing` 같은 칸 안 숫자도 `N` 으로 보인다.

| id | 시험 | 기준선 출력 | 대상 출력 | 판정 | 비고 |
|---|---|---|---|---|---|
| T81 | E 뒤에 로드된 mod, `cell:` Box | `built for pane-grid,usage-gauge,pending-questions,…`, select 전 탭 줄 `main   Pending questions`, `/grid select main` 뒤 c1 `c1 usage-gauge` 아래 막대, c2 `1: pending-questions` · `2: usage-gauge (move from c1)`, 실패 hook 0 | 같다 | 같음 | 첫 실행은 막대 길이만 달랐다(사용량). 정규화 뒤 다시 돌려 같음 |
| T82 | E 뒤 mod 놓기 · 빼기 | `placed pending-questions in c2`, c2 에 `Mode: manual [ Switch to auto ]` · `No pending questions.`, 탭 줄에서 `Pending questions` 없어짐. `place - c2` → `emptied c2`, 보이는 탭이 `Pending questions` 자기 pane 으로 바뀜, `select main` 뒤 c2 다시 선택지 | 같다 | 같음 | |
| T83 | E 앞에 로드된 mod, slot 채우기 | `built for usage-gauge,pending-questions,pane-grid,…`, 탭 줄 `Pending questions   main`, c1 에 막대, `is not loaded` · `draws nothing here` 없음 | 같다 | 같음 | |
| T84 | E 앞 mod, choices Button | 키 `1` → toast `pane-grid: placed pending-questions in c2`, 파일 c2 `"plugin": "pending-questions"` | 같다 | 같음 | |
| T85 | E 앞 · 뒤 섞인 순서 | `built for usage-gauge,pane-grid,pending-questions,…`, c2 `1: pending-questions` · `2: usage-gauge (move from c1)` | 같다 | 같음 | |
| T86 | E 놓인 mod 가 로드되지 않음 | c1 `usage-gauge is not loaded, or its / hooks/pane-grid.ts is older than / pane-grid N.N.N`, c2 `no grid-ready mod is loaded` | 같다 | 같음 | |
| T87 | E `draws nothing here` | `built for pane-grid,k12nothing,…`, c1 `kNNnothing draws nothing here`(정규화 전 `k12nothing draws nothing here`), c2 `1: k12nothing (move from c1)` | 같다 | 같음 | k10 은 「조작 방법 미확인」. 이 카드가 시험용 plugin k12nothing 을 tmp 에 만들어 실행했다 |
| T88 | E placement 값 | 첫 줄 = 마지막 줄 `{"usage-gauge":{"tab":"main","requestId":"grid-main","cell":"c1","column":0,"row":5,"columns":37,"rows":34,"isActive":false},"filetree":null}` | 같다 | 같음 | k10 기대의 「첫 줄은 columns · rows 0」은 두 판 모두 보이지 않았다(첫 1초 poll 전에 이미 잼) |
| T89 | E placement 활성 · 옮기기 · 크기 | `isActive:true` / `"cell":"c2","column":38,…,"columns":37` / resize 30 뒤 `"column":53,"columns":22` | 같다 | 같음 | 53 = 75 - 22 |
| T90 | E placement zoom | c2 zoom: 0 · 0 · 0 · 0, isActive false / unzoom: 0,5,37,34 / select c1: isActive true / c1 zoom: `"column":0,"row":5,"columns":75,"rows":34,"isActive":true` | 같다 | 같음 | |
| T91 | E placement 다른 탭 | `moved c1 to tab w2`, break 뒤 readPlacement 한 줄 `"tab":"w2","requestId":"grid-w2","cell":"c1","column":0,"row":5,"columns":75,"rows":34,"isActive":true`, 탭 줄 `main   w2` | 같다 | 같음 | k10 기대의 「w2 를 그리기 전 columns · rows 0」 줄은 두 판 모두 없었다(break 가 w2 를 바로 보여 준다) |
| T92 | E pane-grid 없이 member mod 만 | `built for usage-gauge,…`, grid pane 줄 0, prompt 위 band `Weekly N-day window … NN% / NNN% [-]` · 막대 · `Resets in …`, 실패 hook 0 | 같다 | 같음 | |
| T93 | E Client 가 없는 surface | 실행하지 않음 | 실행하지 않음 | 실행하지 못함 | `e.surface` 가 terminal · desktop 이 아닌 surface 를 창 없이 띄우는 방법이 없다(k10 표 T93 과 같은 이유) |
| T106 | E `readShownTab` | 시작 `"main"`, `/grid new w2` 뒤 `"w2"`, `select main` 뒤 `"main"`. 전체 줄 `null` → `"main"` → `"w2"` → `"main"`. pane-grid 없이 `null` | 체크포인트 값은 같다. 전체 줄 `"main"` → `"w2"` → `"main"`(시작 직후 `null` 줄이 없다) | 다름 | 두 번 돌려 두 번 모두 같은 차이. 재현: `zsh E.zsh <TREE> T106`. 원인으로 보이는 커밋 c16cdd4(session.start: watchShown 주기를 reload 앞으로). tgt 는 pane-grid 의 1초 주기가 reload 전에 걸려 아래 mod 의 첫 poll(1초 뒤)보다 먼저 SHOWN 을 쓴다. base 는 두 주기가 거의 같은 때 걸려 아래 mod 의 첫 읽기가 SHOWN 쓰기 전이라 `null`. 사용자가 보는 화면 차이는 없고 시작 직후 약 1초 동안의 readShownTab 값만 다르다. k11 c11 3 · 4절에 없는 차이다. 증거 `out/E/tgt/T106-order.log` |
| T118 | 포크 filetree, [REPO, mod] | `built for pane-grid,filetree,…`, c1 에 filetree 트리(`■ proj` · `⑂ main` · `▸ ■ .git`), c2 `filetree (move from c1)`, 실패 hook 0, filetree log 줄 0, `layout revision=N tabs=main placed=filetree` | 같다 | 같음 | |
| T119 | 포크 filetree, [mod, REPO] | `built for filetree,pane-grid,…`, 화면 · log T118 과 같다 | 같다 | 같음 | |
| T120 | 포크 flightdeck, [REPO, mod] | `built for pane-grid,flightdeck,…`, c1 에 deck(`— IDLE` · `session log` · `nothing yet`), 실패 hook 0 | 같다 | 같음 | |
| T121 | 포크 flightdeck, [mod, REPO] | `built for flightdeck,pane-grid,…`, 화면 T120 과 같음, log `ui.open flightdeck flightdeck (unasked, 170 columns): placed`(시작 때 자기 pane 한 번, k1 결과의 알려진 한계와 같다) | 같다 | 같음 | |
| T122 | 포크 inbox, [REPO, mod] | `built for pane-grid,inbox,…`, c1 에 `Asks  Finds  PRs` · `Nothing needed`, 실패 hook 0 | 같다 | 같음 | |
| T123 | 포크 inbox, [mod, REPO] | `built for inbox,pane-grid,…`, 화면 T122 와 같음 | 같다 | 같음 | |
| T124 | 포크 md-preview, [REPO, mod] | `built for pane-grid,md-preview,…`, c1 `[ Prev ] [ Next ] [ Before ]` · `No Markdown edits yet. /md <path> opens a file.` | 같다 | 같음 | |
| T125 | 포크 md-preview, [mod, REPO] | `built for md-preview,pane-grid,…`, 화면 T124 와 같음 | 같다 | 같음 | |
| T126 | 포크 terminal-browser, [REPO, mod] | `built for pane-grid,terminal-browser,…`, c1 `Run /browser [url] to open a page here` | 같다 | 같음 | 브라우저는 띄우지 않았다 |
| T127 | 포크 terminal-browser, [mod, REPO] | `built for terminal-browser,pane-grid,…`, 화면 T126 과 같음 | 같다 | 같음 | |
