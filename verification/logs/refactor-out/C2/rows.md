# 묶음 C2 결과 (대화형 입력: 탭 · 빈 칸 선택지 · divider 끌기 · 칸 스크롤 · 페이지 키)

- 스크립트: `/Users/uhd/.claude/jobs/2d2d4469/tmp/scripts/C2.zsh <TREE>`(세션 7개, `ONLY="<번호>"` 로 일부만). 실행 기록: `out/C2-<TREE>-run.txt`.
- 대조: `zsh compare.zsh C2` 결과 `summary: same=18 diff=0 missing=0`. 흔들림 확인으로 base 를 한 번 더 돌린 `base2`(`tmp/base2` 는 `tmp/base` 의 symlink)도 `compare.zsh C2 base base2` 가 `same=18 diff=0`.
- 사용자 `~/.claude/pane-grid/layout.json` SHA-256: 모든 실행의 전후 `1dca3aebdfa19b977e8a6b4ed3812e0d312357071abc32de70170837427918c5`.
- 정규화: grid pane 쪽 화면만(첫 줄 `│` 오른쪽), usage-gauge 의 숫자 → `#` · 막대 `█░` → `<bar>`, filetree 의 수정 시각 → `YYYY-MM-DD hh:mm`, 엔진 log 는 `ui.scroll … by <값>` 의 by 값만(ms · 「N more times」 요약 줄 제거).
- 엔진 동작(두 트리 같음): 휠 방향이 바뀐 직후의 첫 휠 이벤트는 엔진이 전달하지 않았다(log 에 `ui.scroll` 줄이 없다). 그래서 방향이 바뀌는 자리는 같은 휠을 두 번 보내고, 전달된 by 값을 행 파일의 `engine:` 줄에 남겼다.

| id | 시험 | 기준선 출력 | 대상 출력 | 판정 | 비고 |
|---|---|---|---|---|---|
| T59a | zoom 한 탭의 title `[Z]` | `zoomed c1`, 탭 줄 `main [Z]   w2`. 다시 zoom: `unzoomed`, 탭 줄 `main   w2` | 기준선과 바이트 같음 | 같음 | k10 기대와 맞다 |
| T59b | 탭 누름과 shown | w2 탭 누름 2초 뒤 list 1줄 `  main active=c1 {c1:50,c2:50}`, 2줄 `w2 active=c3 c3` 앞에 `*`(화면에서는 markdown 목록으로 `- w2` 로 그려진다). main 누름 뒤 `* main active=c1 {c1:50,c2:50}` | 같음 | 같음 | 탭 줄 글자는 누름 전후 같다(`main   w2`) |
| T59c | shown 이 null | 보이는 탭 `main   Pending questions`, `built for pane-grid,pending-questions,…`, list `* main active=c1 {c1:50,c2:50}`, failed=0 | 같음 | 같음 | |
| T60 | 빈 칸 선택지 | c1: `1: pending-questions` · `2: usage-gauge`, c2: 숫자 없이 `pending-questions` · `usage-gauge` | 같음 | 같음 | |
| T61 | 숫자 hotkey | hotkey 줄 오른쪽 끝 누름 뒤 키 `2`: toast `pane-grid: placed usage-gauge in c1`, 제목 `c1 usage-gauge`, c2 에 `usage-gauge (move from c1)` | 같음 | 같음 | |
| T62 | 선택지 Button 누름 | 비활성 c1 의 `pending-questions` 첫 누름: `action select-cell c1: active cell c1` 만. 둘째 누름: `action place pending-questions c1: …`, toast `pane-grid: placed pending-questions in c1` | 같음 | 같음 | 차례를 바꿨다: T63 뒤(c1 빈 칸 · 비활성)에서 c1 에 놓았다. k10 의 「c2 에 놓기」와 칸만 다르고 확인하는 것(비활성 칸의 첫 누름은 select-cell 만)은 같다 |
| T63 | 옮기기 | c2 빈 행 누름 `action select-cell c2: active cell c2`, 키 `2`: toast `pane-grid: placed usage-gauge in c2`, c1 이 `empty. place a mod here:` · `usage-gauge (move from c2)` | 같음 | 같음 | |
| T64a | divider 끌기(좌우) | `c2 -` 열 39 → 33, 프로젝트 파일 size 41.89 / 58.11, failed=0 | 같음 | 같음 | k10 의 41.89 와 같다 |
| T64b | 끄는 동안과 놓을 때 | 이동 세 번 뒤 `layout revision=` 3줄 · 프로젝트 파일 없음, 분할선 색 escape `38;5;72`. 뗌 뒤 `layout.json` 생김, size 41.89 / 58.11 | 같음 | 같음 | 색은 256색 72번(초록 계열)이다 |
| T64c | divider 끌기(위아래) | `split c1 into c1 and c3`, `c3 -` 제목 행 24 → 27, column 노드 size 58.82 / 41.18 | 같음 | 같음 | |
| T64d | divider 한계 | `c2 -` 가 열 3(c1 폭 1열), 바깥 size 1.35 / 98.65, failed=0 | 같음 | 같음 | 왼쪽 100칸은 SGR 좌표가 0 이하가 되어 화면 1열까지(dx = 1 - 열) 끌었다. tgt 의 76ca1d2(F2: 자식이 1칸 미만이 되는 끌기는 무시)는 이 입력에서 결과를 바꾸지 않았다(MIN_PART=1 로 같은 자리에서 멈춘다) |
| T65a | 칸 스크롤(휠) | 위아래 c1:5 · c2:95. c1 내용 행 휠 아래(`engine: by 1`): c1 첫 줄 `empty. place a mod here:` → `pending-questions`, c2 그대로. 휠 위 두 번(`by -1` 하나 전달): 되돌아옴 | 같음 | 같음 | 휠 위 첫 번은 엔진이 전달하지 않았다(위 머리말) |
| T65b | 휠 자리 판정 | c1 마지막 행: c1 만 움직임. c2 제목 행: c2 만 움직임(첫 줄이 `1: pending-questions` 로). hotkey 두 줄: 엔진 `by 1` 세 번 전달, 아무 칸도 안 움직임. failed=0 | 같음 | 같음 | |
| T65c | 페이지 키 | c1 누름 `select-cell c1`. `send-keys NPage`: 엔진 `by 39`, c1 만 움직임(빈 행), c2 그대로. `PPage`: `by -39`, 되돌아옴 | 같음 | 같음 | tmux `send-keys NPage/PPage` 로 `ui.scroll` 이 전달되는 것을 log 로 확인했다(k10 의 「조작 방법 미확인」 해소) |
| T65d | 스크롤 초기화 | c1 을 1 스크롤한 뒤 `/grid place usage-gauge c1`: `placed usage-gauge in c1`, log `pane-grid: scroll reset for c1`, usage-gauge 첫 줄 `Weekly #-day window` 부터 | 같음 | 같음 | |
| T65e | 자기 행을 스크롤하는 mod | `$FT`(plugin-filetree 포크, pane-grid-cell 브랜치), 프로젝트에 파일 40개. 목록 행 휠 세 번(`by 1` x3): filetree 목록이 `.git, f01…` → `f09…` 로, 그 위 filetree 머리 행과 c2 제목은 그대로. 제목 행 휠 세 번(`by 1` x3): 아무것도 안 움직임. `scroll failed` 0 | 같음 | 같음 | |
| T101 | 선택지 10개 이상의 숫자 hotkey | grid-ready mod 11개(설치본 8개 + verification 의 r1-order · r2-hidden-tab · harness-probe/snapshot). 활성 c1: `1: filetree` ~ `9: terminal-browser`, `uhd-kanban` · `usage-gauge` 숫자 없음. c2 는 모두 숫자 없음. failed=0 | 같음 | 같음 | 설치본: filetree 0.9.0 · md-preview 0.1.10 · flightdeck 0.6.1 · inbox 0.3.0 · pending-questions 0.3.0 · uhd-kanban 0.14.0 · terminal-browser 0.0.2 · usage-gauge 0.4.0 |
| T102 | 자기 행을 스크롤하는 mod 칸의 페이지 키 | c1 활성에서 NPage(`by 39`): pane-grid 가 c1 을 스크롤, filetree 목록 그대로. c2 제목 누름 `select-cell c2` 뒤 NPage(`by 39`): filetree 목록 `f09…` → `f13…`. PPage(`by -39`): `.git, f01…` | 같음 | 같음 | |
