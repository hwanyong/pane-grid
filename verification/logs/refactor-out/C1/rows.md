# 묶음 C1 결과 (대화형, tmux detached)

스크립트: `scripts/C1.zsh <TREE>`(본 시험), `scripts/C1-T116i.zsh <base|tgt>`(T116 hook 호출 확인용 사본), `scripts/C1-T116re.zsh`(T116 정규식 값),
`scripts/C1-T114.zsh` · `scripts/C1-T114-loop.zsh`(T114 반복), `scripts/C1-bisect-archive.zsh`(T114 반복에 쓴 k11 중간 커밋 풀기).
`scripts/C1.zsh` 를 base · tgt 에 두 번씩 돌렸다. 둘째 회차의 `zsh compare.zsh C1` 결과는 `same=17 diff=1 missing=0` 이고, 다른 행은 T35 하나다.
첫 회차와 둘째 회차는 T35(스크립트에 자동 완성 줄을 더했다)와 T114(아래 비고)를 빼고 같았다.
실패한 hook 줄(`hook skipped|(command|scroll|press|message|render) failed`)은 모든 세션에서 0줄이었다.

| id | 시험 | 기준선 출력 | 대상 출력 | 판정 | 비고 |
|---|---|---|---|---|---|
| T35 | `/grid` 명령 등록 · 설명 · 인자 안내 | 자동 완성 `❯ /grid  pane-grid: split panes into a grid of mods, tmux style`, `/grid ` 뒤 안내 `<split\|kill\|next\|place\|swap\|zoom\|resize\|layout\|new\|select\|rename\|close\|break\|list\|reload\|help>`, log `$.command.register (pane-grid): /grid listed` | 설명 · log 는 같다. 안내 `<split\|kill\|next\|select-cell\|place\|swap\|…\|help>` | 다름(의도) | k11 c11 3절 F60 행 · 4절 T35 행(f0cea8b). 자동 완성 목록은 prompt 위에 그려진다 |
| T100 | hotkey 줄의 label | `v: split-h s: split-v o: next z: zoom x: kill w: swap b: break c: new tab` / `k: close tab q: list` | 같다 | 같음 | k10 기대와 같다 |
| T57a | 칸 누름(activate) | log `action select-cell c2: active cell c2`. `c2 -` 앞 SGR `\x1b[1m\x1b[38;5;72m`(굵게 · 초록), `c1 -` 앞 `\x1b[38;5;246m`(회색) | 같다 | 같음 | |
| T57b | hotkey q | toast `pane-grid: * main active=c2 {c1:50,c2:50}` | 같다 | 같음 | |
| T57c | hotkey o | toast `pane-grid: active cell c1` | 같다 | 같음 | |
| T57d | hotkey v | toast `pane-grid: split c1 into c1 and c3`, 화면 `c1 - │c3 - │c2 -` | 같다 | 같음 | |
| T57e | hotkey s | toast `pane-grid: split c3 into c3 and c4`, c3 아래 `c4 -` | 같다 | 같음 | |
| T57f | hotkey z 두 번 | toast `pane-grid: zoomed c4`, `ui.open pane-grid grid-main (asked, 170 columns): placed` 1줄, 칸 제목 `c4 -` 하나. 둘째 toast `pane-grid: unzoomed`, 칸 네 개 | 같다 | 같음 | log 줄에 title 글자는 없다 |
| T57g | hotkey w | toast `pane-grid: swapped c4 and c2`, list `* main active=c4 {c1:25,[c3:50,c2:50]:25,c4:50}` | 같다 | 같음 | |
| T57h | hotkey x | toast `pane-grid: removed c4`, list `* main active=c2 {c1:25,[c3:50,c2:50]:75}` | 같다 | 같음 | |
| T57i | hotkey b | toast `pane-grid: moved c2 to tab w2; it is behind main, click its tab to show it`, 탭 줄 `main   w2` | 같다 | 같음 | 두 회차 모두 suffix 가 붙었다 |
| T57j | hotkey c | toast `pane-grid: opened tab w3; it is behind main, click its tab to show it`, 탭 줄 `main   w2   w3` | 같다 | 같음 | |
| T57k | hotkey k | 누른 pane 은 main. toast `pane-grid: closed main`, 탭 줄 `w2   w3`, `press failed` 0줄 | 같다 | 같음 | |
| T58 | hotkey k 거부(탭 하나) | `/grid reload` → `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json`, toast `pane-grid: the last tab cannot be closed` | 같다 | 같음 | |
| T114 | 첫 탭이 아닌 탭 close | `g new` 두 번 → `opened tab w2` · `opened tab w3`. 대화형 `select w2` → `showing w2`, `close` → `closed w2`(suffix 는 지움), list `* main active=c1 {c1:50,c2:50}` / `  w3 active=c4 c4` | 같다 | 같음 | close 응답 끝의 `; it is behind w3, click its tab to show it` 는 두 판 모두 붙기도 하고 안 붙기도 한다. suffix 없음: base 13번 중 5번, tgt 9번 중 4번(out/C1r/*/T114.txt, out/C1/*/T114.raw). k11 중간 커밋 f0cea8b · a147478 · c16cdd4 · 10ad989 · 3ba5537 에서도 두 가지가 다 나왔다. 2초 뒤 보이는 탭은 모든 회차에서 main(`c1 - │c2 -`). showTab 이 `$.ui.open(focus)` 바로 뒤 `$.ui.panes()` 를 읽는 시점 문제로 리팩터링 전부터 있었다. 첫 회차는 base 에 붙고 tgt 에 없어 compare 가 DIFF 를 냈고, 둘째 회차는 반대였다 |
| T116 | ui.press 의 element 필터 | ① 리터럴 `/^(place\|hotkey):/`. ② pending-questions 가 grid 칸 c2 에 그린 Button(element `mode`)을 누르면 사본의 hook 첫 줄 log 0줄, dispatch 줄 `ui.press pending-questions/mode in Pane from terminal: settled`, `Mode: manual` → `Mode: auto`. 대조군 hotkey q 는 log `T116 press hook called: hotkey:q` 1줄, toast `pane-grid: * main active=c2 {c1:50,c2=pending-questions:50}` | ① `PRESS_KEY` 를 tsx 로 import 한 값 source `^(place:\|hotkey:)`, flags 없음, RegExp 객체. 열 개 문자열의 test 결과가 base 리터럴과 모두 같다. ② 같다(0줄 / 1줄) | 같음 | `claude plugin validate` 의 `element=?` 는 정적 표시만 다르다. 실행 때 엔진은 그 RegExp 로 거른다. 정규식 source 문자는 다르지만(`place:\|hotkey:` 와 `(place\|hotkey):`) 맞는 문자열의 집합이 같다(a42b576 F66). 사본은 inst/C1-base · inst/C1-tgt(ui.press hook 첫 줄에 log 한 줄만 더했다). debug log 의 `hooks module pane-grid@inline, pending-questions@inline ui.press settled` 줄은 worker 의 module 목록이라 호출 여부를 가르지 못해 사본으로 확인했다 |
