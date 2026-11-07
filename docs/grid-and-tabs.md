# 그리드 분할 · 탭 조사와 규약 mod 세 개의 수정 범위

2026-11-06 조사. 엔진은 Claude Code 2.1.318 이고, 엔진 API 는 `verification/r2-hidden-tab/.claude-plugin/types/claude-code/index.d.ts`(엔진이 mod 옆에 놓는 타입 정의, 17,421줄)에서 읽었다. 이 문서의 「확인했다」는 그 파일이나 세 저장소의 코드를 읽어 확인했다는 뜻이고, 실행해서 확인한 것은 「실행했다」로 적는다.

같은 날 사용자 결정 세 가지:

1. **`docs/direction.md` §3.1 규약 방식으로 진행한다.** 남의 mod 는 라이선스가 허락하면 fork 해서 같은 규약 hook 을 넣는다. 수정 대상은 사용자의 mod 세 개다.
2. **분할 UX 는 tmux 의 것을 쓴다**(§2).
3. **탭은 엔진의 pane 탭이다.** 탭 하나가 배치 하나이고, 탭을 바꾸면 다른 mod 배치가 보인다. 규약 hook 을 넣은 mod 는 pane-grid 가 없을 때 지금처럼 자기 pane 을 쓴다(§4 에서 실행해 확인했다).

같은 날 §4 결과를 보고 내린 사용자 결정 네 가지:

4. **분할 · 탭 조작 수단은 `hotkey` 와 slash 명령 둘 다다**(§2.3).
5. **칸이 넘치면 칸마다 스크롤한다**(§3.4). 엔진의 pane 스크롤은 pane 에 하나뿐이므로 pane-grid 가 만든다.
6. **grid 에 넣은 mod 는 자기 자리(pane · band)에 그리지 않는다**(§3.5).
7. **`docs/direction.md` 의 3.2 · 3.3(남의 mod 를 고치지 않고 쓰는 방식)을 계획에서 뺐다.** R4 · R7 · R8 도 함께 뺐다.

같은 날 R20 · R21 결과를 보고 내린 사용자 결정 네 가지(§6 에 두었던 권하는 안을 모두 채택했다):

8. **uhd-kanban 은 board 읽기와 애니메이션을 나눈다**(§5.2). board 읽기는 보임과 상관없이 돌고, 애니메이션만 pane-grid 의 `shown` 을 `state.set` hook 으로 받아 멈춘다.
9. **pane-grid 의 state 타입은 pane-grid 저장소 하나에만 둔다.** 세 mod 는 읽은 값의 `version` 필드를 실행 중에 검사한다.
10. **hotkey 글자는 §2.3 의 표대로다.**
11. **`verification/harness-probe/` 는 근거로 남긴다.**

| mod | 저장소 | 그리는 곳 |
|---|---|---|
| `usage-gauge` 0.2.0 | `/Users/uhd/LOCAL/01-01_Projects/plugin-usage-gauge` | `AbovePrompt`(prompt 위 band). pane 이 없다 |
| `uhd-kanban` 0.10.4 | `/Users/uhd/LOCAL/01-01_Projects/skill-kanban/plugins/uhd-kanban` | pane `uhd-kanban-board` |
| `pending-questions` | `/Users/uhd/LOCAL/01-01_Projects/plugin-pending-questions` | pane `pending-questions` |

## 1. 엔진이 주는 것

| 필요한 것 | 엔진의 API | 근거(`index.d.ts`) |
|---|---|---|
| 칸 나누기 | `Box` 의 `flexDirection` · `width`/`height`(수 또는 `"50%"` 같은 문자열) · `flexGrow` · `gap` · `borderStyle` · `overflow: "hidden"` | `BoxProps` 928행 |
| 탭 요소 | 없다. `terminal` 표면의 요소는 `Box` · `Text` · `Button` · `Input` · `Select` · `Link` · `Code` · `Markdown` · `Client` · `Raster` · `Image` 이다 | `Elements` 3976행 |
| 엔진의 pane 탭 | pane 이 둘 이상 열리면 엔진이 pane 마다 탭을 그린다. 탭 글자는 `$.ui.open` 의 `title` 이고, 열린 id 를 다시 열면 title 만 바뀐다 | `PaneOpenArgs` 7759행 |
| 탭 전환 | 사람이 탭을 클릭하거나 Tab 으로 탭에 가서 Enter 를 누른다. `$.ui.open({ focus: true })` 는 요청일 뿐이고, prompt 가 키를 갖고 입력창이 비어 있을 때만 받아들여진다. pane 이 키를 갖고 있으면 거부된다 | `PaneOpenArgs.focus` 7783행 |
| 탭 전환 알림 | 없다. `$.ui.panes()` 의 `isShown` 을 읽어야 하고, 그 목록에는 **자기 plugin 의 pane 만** 나온다 | `UiPane` |
| 칸 너비를 mod 에 알리기 | `e.props.bodyColumns` 는 pane 전체 너비이고 hook 이 바꾸면 거부된다. 대신 `$.state` 를 쓴다: **어느 plugin 이든 남의 값을 읽을 수 있고, 쓰는 것은 주인만 한다. `ui.render` 중에 읽으면 그 값이 바뀔 때 엔진이 그 그림을 다시 그린다** | `state` 3525행 |
| state 선언 | 자기가 쓰는 key 는 manifest 의 `types` 계약(`declare module 'claude-code' { interface PluginState { ... } }`)에 선언해야 `claude plugin validate` 를 통과한다. 남의 state 를 읽는 쪽은 선언하지 않는다 | `claude plugin validate` 출력 |
| 여러 `requestId` 를 한 hook 으로 받기 | matcher 의 값에 배열(any-of)과 RegExp 를 쓸 수 있다: `requestId: ['pending-questions', /^grid/]` | `Matcher` 6044행 |
| pane 너비 | dock 은 terminal 열의 45% 이하, 24열 이상이다. 사람이 연 것이 아니면(unasked) 144열 미만에서는 열리지 않고 기다린다(그 id 를 사람이 연 적이 있으면 110열). 사람의 명령 · prompt · press 가 연 것(asked)은 너비와 상관없이 열린다 | `PaneOpenArgs` 2521행 · 7759행 |
| pane 세로 이동 | pane 단위 하나다(`e.props.scroll` 의 `offset` · `bodyRows`, 엔진이 정한다). 칸마다 따로 세로로 움직이는 API 는 없다 | `SiteScroll` |
| 키보드 | `ctrl+x tab` · 클릭 · 받아들여진 `focus` 가 site 에 포커스를 준다. 포커스가 pane 에 있으면 Tab 이 그 pane 의 요소를 차례로 옮겨 간다. `hotkey` 는 숫자 한 개 또는 영문 소문자 한 글자이고 그 site 가 포커스를 가진 동안만 동작하며, 겹치면 나중 것이 이긴다. `action` 은 엔진에 이미 있는 keybinding action 이름만 받는다(모르는 이름은 거부). 세 mod 모두 `hotkey` 를 쓰지 않는다(`grep -n hotkey` 0건) | `ButtonProps.hotkey` · `ButtonProps.action` |

## 2. tmux 실측과 pane-grid 대응

tmux 3.7c 를 `tmux -L pgux -f /dev/null`(사용자 설정을 읽지 않는 별도 서버), 120열 × 40행 창에서 실행했다. 값은 `display -p '#{window_layout}'` · `list-panes -F` · `list-windows` 출력에서 읽었다.

### 2.1 pane 분할(같은 창 안)

| tmux 동작 | tmux 실측 | pane-grid 에서 |
|---|---|---|
| `split-window -h` | 활성 pane 을 좌우로 반 나눈다. 120열이 60 + 구분선 1 + 59 가 됐다 | 활성 칸을 좌우 노드로 나눈다(`Box flexDirection="row"`). 구분선은 `gap={1}` 또는 칸 `borderStyle` |
| `split-window -v` | 활성 pane 을 위아래로 나눈다 | 위아래 노드(`flexDirection="column"`) |
| `split-window -l 10` | 새 pane 크기를 정한다 | 칸 크기를 열 · 행 수 또는 % 로 적는다 |
| 배치 문자열 | 트리다. `{}` 는 좌우, `[]` 는 위아래, 노드마다 `폭x높이,x,y[,id]`. 예: `120x40,0,0{60x40,0,0,0,59x40,61,0[59x20,61,0,1,59x19,61,21,2]}` | `layout.json` 에 같은 트리를 JSON 으로 둔다. 노드 종류(`row` · `column` · 칸) · 비율 · 칸 id |
| `pane_index` · `pane_id` | `pane_index` 는 위치 순서로 다시 매겨지고 `pane_id`(`%n`)는 바뀌지 않는다 | 칸 id 는 고정하고, 번호는 트리 위치로 매긴다 |
| `kill-pane` | 지운 pane 의 공간을 형제가 받는다 | 칸을 지우면 형제 노드가 그 비율을 받는다 |
| `resize-pane -x 80` | 경계가 움직이고 형제 하위 트리 전체가 줄어든다(오른쪽 두 pane 이 함께 39열) | 노드 비율을 바꾼다 |
| `resize-pane -Z` | 활성 pane 이 창 전체를 쓰고(`window_zoomed_flag=1`) 나머지 pane 의 geometry 는 그대로 남는다 | 칸 하나만 그리고 트리는 그대로 둔다. 탭 title 에 zoom 표시 |
| `swap-pane` | 두 pane 의 내용을 바꾼다 | 두 칸의 mod 를 바꾼다 |
| `select-layout` | `even-horizontal` 30/29/29/29열 · `even-vertical` 10/9/9/9행 · `main-vertical` 왼쪽 80열 + 오른쪽 39열 세로 쌓기 · `main-horizontal` 위 24행 + 아래 나누기 · `tiled` 2 × 2 | 같은 다섯 가지를 트리 계산 함수로 둔다 |
| 최소 크기 | 너비 10 · 4 · 2 · 1 로 줄여 가며 나누자 `no space for a new pane` 로 거부됐다 | 칸 최소 열 수 미만이면 나누기를 거부한다 |
| 활성 표시 | 활성 pane 의 테두리가 기본 초록이다 | 활성 칸의 `borderColor` |

### 2.2 window(tmux 의 탭)

| tmux 동작 | tmux 실측 | pane-grid 에서 |
|---|---|---|
| 상태 줄 | `[session] ` 다음 `#I:#W#{flags}`. `*` 가 지금 window, `-` 가 직전 window | 엔진의 pane 탭 막대. 지금 탭은 엔진이 반전으로 그린다 |
| `new-window` | 새 window 를 연다 | 새 배치 = 새 id 로 `$.ui.open({ id: 'grid-<이름>', title })` |
| `rename-window` | 이름을 바꾼다 | 같은 id 로 다시 `$.ui.open` 해 title 을 바꾼다 |
| `kill-window` | 지우면 번호에 빈자리가 남고 `move-window -r` 이 다시 매긴다 | `$.ui.close({ id })`. 배치 id 는 이름이라 번호를 다시 매길 일이 없다 |
| `next-window` · `select-window` | 번호 · 이름으로 고른다 | 사람이 탭을 클릭한다. 코드로 바꾸는 것은 prompt 가 키를 가질 때만 된다(§1 「탭 전환」) |
| `break-pane` · `join-pane` | pane 을 새 window 로 옮기고 다시 합친다 | 칸을 새 배치로 옮기고, 다른 배치로 합친다 |

### 2.3 키 바인딩

tmux 기본 바인딩은 prefix(`C-b`) 다음 한 글자다: `%` 좌우 나누기 · `"` 위아래 나누기 · `o` 다음 pane · 화살표 pane 고르기 · `C-화살표` 크기 · `z` zoom · `x` 지우기(확인) · `{` `}` 교환 · `Space` 다음 배치 · `M-1`~`M-5` preset · `!` break-pane · `c` 새 window · `n` `p` 다음 · 이전 window · `0`~`9` window 고르기 · `,` 이름 바꾸기 · `&` window 지우기 · `q` 번호 표시.

엔진에서 옮길 수 있는 수단은 두 가지이고, 둘 다 쓴다(결정 4). 같은 동작을 두 수단이 함께 부르도록 동작 함수 하나에 두 입구를 단다.

| 수단 | 동작 조건 | tmux 와 다른 점 |
|---|---|---|
| `hotkey` | 그 grid pane 이 포커스를 가졌을 때. `ctrl+x tab` 이 prefix 자리에 온다 | 숫자 · 영문 소문자만 받는다. `%` `"` `{` `}` `!` `,` `&` 는 쓸 수 없어 글자를 다시 정해야 한다. 포커스가 풀릴 때까지 계속 동작한다(tmux prefix 는 한 번) |
| slash 명령(`/grid split -h` 같은 `command.run`) | prompt 에서 | 사람의 명령이 연 pane 은 asked 라 너비 제한이 없다. 명령 뒤 입력창이 비므로 `focus` 가 받아들여질 수 있다(R19) |

tmux 글자 중 `hotkey` 로 쓸 수 없는 것을 대신하는 글자(결정 10):

| tmux | 동작 | `hotkey` |
|---|---|---|
| `%` | 좌우 나누기 | `v` |
| `"` | 위아래 나누기 | `s` |
| `{` `}` | 칸 교환 | `w` |
| `!` | 칸을 새 탭으로 옮기기(break-pane) | `b` |
| `,` | 탭 이름 바꾸기 | `r` |
| `&` | 탭 지우기 | `k` |

나머지(`o` · `z` · `x` · `c` · `q`)는 tmux 글자를 그대로 쓴다. 탭을 바꾸는 `n` · `p` · `0` ~ `9` 는 `hotkey` 로 두지 않는다. `hotkey` 는 grid pane 이 키를 가진 동안만 동작하고, 그때 `$.ui.open({ focus: true })` 는 거부되기 때문이다(§4 「코드로 탭 바꾸기」). 탭 전환은 클릭 · Tab + Enter 와 slash 명령(R19)으로 한다.

## 3. 설계안

### 3.1 배치 상태: `pane-grid` 가 하나만 가진다

- `pane-grid` 가 `~/.claude/pane-grid/layout.json` 을 읽어, 그 결과를 자기 state `{ plugin: 'pane-grid', key: 'layout' }` 에 쓴다.
- 값에는 배치(탭)마다 §2.1 의 트리가 들어가고, 칸마다 대상 mod 이름 · 칸 너비(열 수) · 칸 높이(행 수)가 들어간다.
- 칸 너비는 `pane-grid` 가 `e.props.bodyColumns` 와 트리 비율로 계산한다. 규약 mod 는 계산하지 않고 이 값을 읽는다. 계산 규칙이 mod 마다 복사되면 SSOT 가 깨지기 때문이다.
- 규약 mod 는 `grid` 요청을 그릴 때 이 값을 읽는다. 읽은 것만으로 구독이 걸려서, `pane-grid` 가 값을 다시 쓰면 규약 mod 의 칸도 다시 그려진다(R11).
- 사람이 hotkey · 명령으로 배치를 바꾸면 `pane-grid` 가 `layout.json` 에 다시 써서 파일이 SSOT 로 남는다.
- 칸마다의 스크롤 위치(§3.4)는 `layout` 이 아니라 다른 key `{ plugin: 'pane-grid', key: 'scroll' }` 에 쓴다. `layout` 을 쓸 때마다 모든 규약 mod 의 `state.set` hook(§3.5)이 실행되기 때문이다. R20 실행에서 스크롤 위치를 `layout` 에 함께 썼더니 휠 한 칸마다 member 의 hook 이 실행됐다(4회차 실행: 휠 29회, member hook 30회, `verification/logs/r20-run4.log`).

### 3.2 탭: 배치마다 엔진 pane 하나

- 배치 하나를 `$.ui.open({ id: 'grid-<이름>', title: '<이름>' })` 으로 연다. 규약 mod 의 matcher 는 `requestId: /^grid-/` 다.
- 가려진 탭은 다시 그려지지 않는다. 다시 보일 때 엔진이 하는 일은 R17 에서 실행해 확인했다: **가려진 동안 그 그림이 읽은 state 가 바뀌었으면 보일 때 `ui.render` 를 실행하고, 바뀌지 않았으면 실행하지 않고 지난 결과를 쓴다.** 그래서 내용이 state 로만 정해지면 `isShown` 을 주기적으로 읽지 않아도 다시 보일 때 최신이다.
- uhd-kanban `hooks/register.tsx` 191행 주석(「다시 보일 때 render 없이 지난 결과를 쓴다」)은 바뀐 것이 없을 때의 관찰과 맞는다.

### 3.3 규약 mod 의 hook

| 단계 | 규약 mod 가 하는 일 |
|---|---|
| ① | `{ component: 'Pane', requestId: /^grid-/ }` 를 hook 한다 |
| ② | `pane-grid` 의 `layout` 을 읽는다. 이 배치에 자기 칸이 없으면 `next(e)` 를 그대로 반환한다 |
| ③ | 자기 pane 을 그리는 함수와 **같은 함수**를 칸 너비로 불러 `key="cell:<plugin>"` Box 를 만든다 |
| ④ | `next(e)` 결과에 그 Box 를 덧붙여 반환한다. `pane-grid` 가 hook 목록 맨 위(index 0)이므로 그 Box 를 받아 트리의 칸 자리에 놓는다 |

③ 때문에 세 mod 모두 render 본문을 「너비를 받아 트리를 반환하는 함수」로 떼어 내야 한다. 자기 pane hook 과 `grid` hook 은 그 함수를 함께 쓴다.

### 3.4 칸마다 스크롤

엔진의 스크롤은 pane 본문 하나에 창 하나다(`e.props.scroll` 의 `offset`). 칸마다 따로 움직이는 창은 엔진에 없다. 그 대신 엔진은 「hook 이 자기 행을 직접 스크롤하는」 경로를 준다(`index.d.ts` 4233행 `ui.scroll`, 15698행 `UiScrollInput`).

| 단계 | pane-grid 가 하는 일 | 근거 |
|---|---|---|
| ① | 자기 grid pane 의 `ui.scroll` 을 hook 한다: `{ component: 'Pane', requestId: /^grid-/ }` | `ui.scroll` 은 휠 · 스크롤 키 · `$.ui.scroll` 이 pane 창을 움직이기 전에 발생한다 |
| ② | 어느 칸인지 정한다. 휠이면 `e.pointer`(`column` · `row`, 본문 왼쪽 위가 0)를 칸 사각형과 맞춰 본다. 스크롤 키면 `pointer` 가 없으므로 활성 칸이다(tmux 의 활성 pane) | `UiScrollPointer` 15781행 |
| ③ | 그 칸의 `offset` 에 `e.by`(휠 한 칸 ±1, 페이지 키 `bodyRows`)를 더해 `layout` state 에 쓴다 | `UiScrollInput.by` |
| ④ | `next(e)` 를 부르지 않고 `{}` 를 반환한다. pane 창은 움직이지 않고, ③ 의 state 변경으로 grid 가 다시 그려진다 | `ui.scroll` 설명: 「no `next` … leaves it undrawn, so a hook drawing its own rows … moves them by `e.by` and invalidates」 |
| ⑤ | 칸을 그린다. 칸 Box 는 `height`(행 수)와 `overflow="hidden"`, 그 안의 내용 Box 는 `marginTop={-offset}` · `flexShrink={0}` 이다 | R20 에서 실행해 확인했다(§4). `position="absolute"` · `top={-offset}` 은 쓰지 않는다 |

칸 높이의 합을 pane 의 `bodyRows` 와 같게 그리면 pane 창 자체는 움직일 일이 없다. R20 에서 실행해 확인한 것과 남은 것:

- **`position="absolute"` · `top` 음수는 쓸 수 없다.** 칸의 `overflow="hidden"` 은 absolute 내용을 칸 안으로 잘랐다. 그런데 내용의 첫 줄이 pane 본문의 -1 행보다 위로 가지 않았다. pane 맨 위 칸은 offset 3 에서, 13행 아래 칸은 offset 15 에서 그 뒤 offset 을 올려도 화면이 바뀌지 않았다. 엔진 문서에 없는 동작이다.
- **음수 `marginTop` 은 끝까지 밀렸다.** pane-grid 자신의 30줄과 member 가 그린 30줄 모두 offset 26 에서 27 ~ 30번째 줄이 보였고, 칸 바깥(테두리 · 옆 칸 · 아래 줄)에 내용이 나오지 않았다. 다만 `Space`(margin) 타입은 음수를 적지 않았으므로 엔진 판이 바뀔 때마다 이 시험(`verification/r20-scroll/`)을 다시 돌린다.
- 칸 내용의 전체 행 수는 엔진이 알려 주지 않는다. `e.contentRows` 는 pane 트리 전체의 행 수였다(칸 높이 6 · 머리 줄 1 · 아래 줄 1 의 8). 칸의 `offset` 상한을 정하려면 규약 mod 가 자기 행 수를 자기 state 에 적는다.
- `{}` 반환이 pane 창을 붙잡는지는 시험하지 못했다. 시험 pane 의 `contentRows`(8)가 `bodyRows`(38)보다 작아 pane 창이 움직일 수 없었다. pane-grid 는 칸 높이 합을 `bodyRows` 와 같게 그리므로 같은 조건이다.

### 3.5 grid 에 넣은 mod 는 자기 자리에 그리지 않는다

결정 6 에 따라, 규약 mod 는 「`pane-grid` 의 `layout` 에 자기 칸이 있는가」로 자기 자리를 정한다.

| `layout` | 규약 mod 의 자기 자리 |
|---|---|
| `undefined`(pane-grid 가 없다) | 지금처럼 그린다. §4 「독립 동작」에서 실행해 확인했다 |
| 어느 배치에도 자기 칸이 없다 | 지금처럼 그린다 |
| 어느 배치에든 자기 칸이 있다 | pane 은 `$.ui.close` 로 닫고 열지 않는다. band(`usage-gauge`)는 `next(e)` 만 반환한다 |

`layout` 을 render 중에 읽으면 구독이 걸리지만, 그 구독이 다시 실행하는 것은 render 이고 render 는 트리를 반환하는 곳이다. pane 을 여닫는 것을 render 안에서 해도 되는지는 엔진 문서에 없다(`state.set` 은 render 가 그리는 동안 거부된다고 적혀 있다). 그래서 열고 닫는 판정은 `session.start` 와 `layout` 변화를 받는 곳에서 한다. `layout` 변화는 render 밖에서 `state.set` hook 으로 받는다(`index.d.ts` 7472행 `StateSetEvent`). 값의 주인이 아니어도 hook 할 수 있다. R21 에서 실행해 확인했다(§4).

```tsx
on('state.set', { plugin: 'pane-grid', key: 'layout' }, async ($, e, next) => {
  const result = await next(e)
  await placeOwnPane($, e.value)
  return result
})
```

`placeOwnPane` 은 `$.ui.panes()` 로 자기 pane 이 열렸는지 보고, 칸이 있으면 `$.ui.close`, 없으면 `$.ui.open` 을 부른다. 이 hook 은 pane-grid 의 `state.set` 안에서 실행된다(debug log `state.set nested in pane-grid-r20-host#2`).

## 4. 실행해서 확인한 것

시험 mod 두 개를 `verification/r11-state/` 에 두었다. `host/` 는 pane-grid 역할(배치 state 를 쓰고 pane `r11grid-a`(Grid A) · `r11grid-b`(Grid B)를 연다), `member/` 는 규약 mod 역할(자기 pane `r11m` 과 grid 칸을 그리고 자기 state `count` 를 4초마다 올린다)이다. 실행 명령과 로그:

| 실행 | 명령 | 로그 |
|---|---|---|
| member 만 | `CLAUDE_CODE_PLUGIN_DIRS=verification/r11-state/member claude --debug-file …` | `verification/logs/r11-alone.log` |
| host + member, 1회 | `CLAUDE_CODE_PLUGIN_DIRS=verification/r11-state/host:verification/r11-state/member claude --debug-file …` | `verification/logs/r11-both.log` |
| host + member, 2회(press 시험 추가) | 같은 명령 | `verification/logs/r11-press.log` |

칸 스크롤(R20)과 자기 자리 여닫기(R21)는 시험 mod 두 개를 `verification/r20-scroll/` 에 따로 두었다. `host/` 는 grid pane `r20grid` 에 30줄짜리 칸을 그리고 `ui.scroll` 을 hook 한다. `member/` 는 grid 칸에 30줄을 그리고, `state.set` hook 으로 자기 pane `r20m` 을 여닫는다. 명령은 `CLAUDE_CODE_PLUGIN_DIRS=verification/r20-scroll/host:verification/r20-scroll/member claude --debug-file …` 이고 네 번 실행했다. 칸 그리는 방식을 실행마다 바꿨으므로 지금 코드는 4회차의 것이다.

| 회차 | 칸 그리는 방식 | 로그 |
|---|---|---|
| 1 | 칸 두 개 모두 absolute · `top` 음수. tick 2 에 member 칸을 넣고 tick 20 에 뺐다 | `verification/logs/r20-run1.log` |
| 2 | 1회차와 같다. 칸을 따로 스크롤했다 | `verification/logs/r20-run2.log` |
| 3 | 위 줄: absolute 칸 · 음수 `marginTop` 칸. 6줄 아래 줄: absolute 칸 두 개 | `verification/logs/r20-run3.log` |
| 4 | 3회차에서 아래 줄 member 칸만 음수 `marginTop` 으로 | `verification/logs/r20-run4.log` |

tmux 세션(170열 × 45행) 안에서 실행했고, 탭 전환 · Button 누르기 · 휠은 `tmux send-keys` 로 SGR 마우스 이벤트(휠 아래 `\e[<65;열;행M`, 휠 위 `\e[<64;열;행M`)와 키를 보냈다.

| 번호 | 확인한 것 | 결과 |
|---|---|---|
| 독립 동작 | pane-grid 없이 member 만 로드 | **통과.** host state 를 읽으면 `undefined`(version 0)가 나왔고, 자기 pane 이 열려(`isPlaced=true`) 그려졌다. grid hook 은 한 번도 불리지 않았다. 자기 pane 이 보이는 동안 `count.set` 마다 1 ~ 3 ms 뒤 다시 그려졌고, 가려진 동안은 그려지지 않았다 |
| R15 | 남의 state 를 선언 없이 읽는 코드의 로드 | **통과.** member 는 host state 를 선언하지 않고 읽었고 로드됐다. 자기 key 를 선언하지 않으면 `claude plugin validate` 가 `pane-grid-r11-member.count is not declared` 로 실패했다 |
| R11 | host state · member state 가 바뀔 때 grid 다시 그리기 | **통과.** host 의 `state.set` 뒤 2 ms 안에, member 의 `count.set` 뒤 2 ~ 3 ms 안에 grid 가 다시 그려졌다. host 의 render 는 state 를 읽지 않으므로 다시 그린 원인은 member 의 구독이다 |
| R17 | 사람이 탭을 바꿔 다시 보인 grid pane | **통과(두 번 실행).** 가려진 동안 count 가 바뀐 pane 은 클릭 직후 host · member render 가 실행돼 최신 값으로 보였다. 바뀐 것이 없는 pane 은 render 없이 마지막 결과로 보였다 |
| R13 일부 | grid 안에 member 가 그린 Button 누르기 | **통과(클릭 · Tab + Enter).** 차례는 host 의 `ui.press` hook(`plugin=pane-grid-r11-member element=go requestId=r11grid-a`) → member 의 `ui.press` hook → member 의 `onPress` → `count.set` → 2 ms 뒤 다시 그리기였다. 서로 다른 mod 가 **같은 key** 를 그린 경우는 아직 시험하지 않았다 |
| 코드로 탭 바꾸기 | 타이머에서 `$.ui.open({ focus: true })` | tick 1 의 요청(Grid A)은 받아들여졌고, Grid A 가 키를 가진 뒤인 tick 5 의 요청(Grid B)은 보이는 탭을 바꾸지 못했다(`isShown` 이 A 그대로). debug log 에는 `ui.open … (unasked, 170 columns): placed` 만 남았다. §1 「탭 전환」의 문서 내용과 맞는다 |
| R18 | background 로 넘겼다 다시 붙은 세션 | 빈 prompt 에서 Left 를 누르자 대화가 background job 으로 넘어갔고(`Your conversation moved to the background`), Esc 로 다시 붙었다(`[FV-attach] respawnJob`). 그 뒤 pane 은 render 없이 지난 결과를 시간 순서로 다시 내보냈고(tick 1 → 12, 약 2초 간격), 그동안 press 로그는 이 터미널의 debug log 에 남지 않았다. 대화가 다른 프로세스로 옮겨 가 그 프로세스의 로그를 읽지 못했으므로 press 가 전달됐는지는 확인하지 못했다. pane-grid 와 무관한 엔진 동작이고, 시험 뒤 그 job 두 개(`4601a7a8` · `7d6153c4`)는 `claude rm` 으로 지웠다 |
| R20 칸 고르기 | 휠의 `pointer` 로 칸 고르기 | **통과.** 같은 행에서 왼쪽 칸은 `pointer.column` 8, 오른쪽 칸은 46 이었고 `bodyColumns` 는 67 이었다. `column < bodyColumns / 2` 로 고른 칸만 offset 이 바뀌었다. PgUp 은 `pointer` 없이 `by=-38`(`bodyRows`)로 왔다 |
| R20 자르기 | 칸의 `overflow="hidden"` 과 내용 밀기 | absolute 내용은 칸 안으로 잘렸지만 pane 본문 -1 행 위로 가지 않았다. 음수 `marginTop` 은 offset 26(끝)까지 밀렸고 칸 밖으로 나오지 않았다(§3.4) |
| R20 휠 위 | 휠 아래를 보낸 뒤 3초 안에 보낸 첫 휠 위 | 네 번 모두 `ui.scroll` hook 이 실행되지 않았다(debug log 에 줄이 없다). 그다음 휠 위와, 36초 뒤 보낸 휠 위는 `by=-1` 로 왔다. tmux 와 엔진 중 어디서 빠지는지는 가리지 못했다 |
| R21 | `layout` 에 자기 칸이 생기고 없어질 때 자기 pane 여닫기 | **통과.** 칸이 생기자 member 의 `state.set` hook 이 실행돼 `$.ui.close` 뒤 `panes()` 가 빈 목록이었다(hook 의 첫 로그에서 close 까지 3 ms). 칸이 빠지자 `$.ui.open` 이 `isPlaced=true` 를 반환했고 `r20m` 은 가려진 탭(`isShown=false`)으로 탭 막대에 다시 나왔다 |

### 4.1 남은 확인

| 번호 | 확인할 것 | 통과 기준 |
|---|---|---|
| R12 | uhd-kanban 이 `grid` 칸에 그린 `Raster` 를 `$.ui.blit({ requestId: 'grid-<이름>', ... })` 로 칠할 수 있는가 | `deny` 없음, 화면이 바뀐다 |
| R13 나머지 | 두 mod 가 같은 key 의 Button 을 한 `grid` 트리에 그릴 때 각각 눌리는가 | 두 mod 의 `onPress` 로그가 따로 나온다 |
| R14 | pending-questions 의 `ui.press` hook 이 `grid` 에서 눌린 질문 Button 을 받는가 | dialog 가 열린다 |
| R16 | 배치에 자기 칸이 없는 mod 의 hook 이 그리지 않고 넘기는가 | render 로그 |
| R19 | slash 명령 뒤 `$.ui.open({ focus: true })` 로 탭이 바뀌는가 | `isShown` 이 바뀐다 |
| R9 | 규약 mod 세 개를 한 `grid` pane 에 | 화면 캡처와 세 mod 의 누름 로그 |

## 5. mod 별 수정 범위

### 5.1 `usage-gauge`

| 지금 | 고칠 것 |
|---|---|
| `ui.render` 의 `{ component: 'AbovePrompt' }` hook 하나가 그린다(`hooks/register.tsx` 139행). 너비는 `e.props.bodyColumns` 이다(149행) | 139 ~ 192행의 본문을 `(columns) => 트리` 함수로 떼어 내고, `grid` hook 을 더한다 |
| pane 이 없다 | grid 에 칸이 있으면 band 를 그리지 않고 `next(e)` 만 반환한다(§3.5) |
| 값은 atom `limits` · `now` 이고 `$.clock.every(60000)` 이 갱신한다 | 바꿀 것 없음. render 중에 읽으므로 grid 칸도 함께 다시 그려진다(R11 과 같은 경로) |

### 5.2 `uhd-kanban`

| 지금 | 고칠 것 |
|---|---|
| `{ component: 'Pane', requestId: PANE }` hook 이 `next` 없이 그린다(311행). 너비는 `motion.columns = e.props.bodyColumns`(332행) | 312 ~ 419행을 너비를 받는 함수로 떼어 낸다 |
| 애니메이션이 `$.ui.blit({ requestId: PANE, key, cells })` 로 `Raster` 를 다시 칠한다(185행) | grid 칸에 그렸으면 `requestId` 가 그 grid pane 의 id 여야 한다(R12) |
| 애니메이션(`advance`)이 `$.ui.panes()` 의 `PANE` 항목 `isShown` 으로 보이는지 판단해, 가려지면 멈추고 다시 보이면 다시 그린다(194 ~ 209행, 221행) | `$.ui.panes()` 에는 자기 pane 만 나오므로 grid pane 이 보이는지 알 수 없다. 결정 8: pane-grid 가 자기 `panes()` 로 보이는 탭을 읽어 state `{ plugin: 'pane-grid', key: 'shown' }` 에 적고, uhd-kanban 은 그 값을 `state.set` hook 으로 받아 애니메이션을 멈추고 다시 시작한다(R21 과 같은 경로) |
| board 를 읽는 주기 작업(`tick`, 260행)은 `PANE` 이 열려 있으면 보이든 가려지든 `interval_seconds` 마다 돈다 | 그대로 둔다. 가려진 동안 `view` state 만 바뀌고 다시 보일 때 R17 대로 그려진다. 조건만 「`PANE` 이 열려 있거나 어느 배치에든 자기 칸이 있을 때」로 넓힌다 |
| `motion` 상태(타이머 · 그린 Raster)가 pane 하나 기준이다 | 한 번에 한 곳에만 그리므로(§3.5) 한 벌로 된다. 그리는 곳의 `requestId` 만 바꾼다 |
| session 시작 때 `PANE` 을 연다 | grid 에 칸이 있으면 열지 않는다(§3.5) |

### 5.3 `pending-questions`

| 지금 | 고칠 것 |
|---|---|
| `{ component: 'Pane', requestId: PANE }` hook 이 `next` 없이 그린다(975행). 너비를 쓰지 않는다 | 976 ~ 1048행을 함수로 떼어 내고 `grid` hook 을 더한다 |
| 질문 Button(`q1` …)을 누르면 `ui.press` hook 이 dialog 를 연다. matcher 가 `requestId: PANE` 이다(924행) | matcher 에 grid 의 `requestId` 를 더한다: `requestId: [PANE, /^grid-/]`. 고치지 않으면 grid 칸에서 질문을 눌러도 dialog 가 열리지 않는다. 그 Button 의 `onPress` 가 `() => undefined` 이기 때문이다(988행). press 가 그린 mod 에게 전달되는 것은 R13 일부에서 실행해 확인했다 |
| Button key 가 `mode` · `rescan` · `q<n>` · `q<n>:dismiss` · `q<n>:reopen` 이다 | press 는 `plugin` 으로 갈리므로(R13 일부) 다른 mod 와 key 가 겹쳐도 될 가능성이 높다. 같은 key 시험(R13 나머지) 뒤 정한다 |

## 6. 결정한 것

이 절에 두었던 결정 네 가지(uhd-kanban 의 보임 판단 · state 타입 위치 · hotkey 글자 · `verification/harness-probe/`)는 2026-11-06 에 모두 정했다. 내용은 머리말의 결정 8 ~ 11 이다.
