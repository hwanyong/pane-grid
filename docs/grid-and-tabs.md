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
10. **hotkey 글자는 §2.3 의 표대로다.** 2026-11-11 사용자 결정(카드 k11, k10 finding F61)으로 탭 이름 바꾸기의 `r` 을 뺐다. Button `hotkey` 로는 새 이름을 입력받을 수 없어 `/grid rename <name>` 으로만 한다(`hooks/register.tsx` 의 `TOOLBAR` 위 주석). 구현은 처음부터 `r` 이 없었고 이 표만 고치지 않았던 것을 맞췄다.
11. **`verification/harness-probe/` 는 근거로 남긴다.**

같은 날 구현 전에 정한 세 가지. 사용자가 다른 안을 고르지 않아 권하는 안으로 진행한다:

12. **배치 파일은 `~/.claude/pane-grid/layout.json` 하나다.** 어느 프로젝트를 열어도 같은 배치다. 2026-11-10 결정 20 으로 바꿨다.
13. **slash 명령은 `/grid` 하나에 하위 명령을 붙인다**(`/grid split -h` · `/grid new <이름>` · `/grid select <이름>`).
14. **배치 파일이 없으면 칸 하나짜리 빈 탭 `main` 을 연다.** 어느 mod 도 grid 에 넣지 않으므로 세 mod 는 지금처럼 자기 자리에 그린다.

2026-11-07 사용자 결정 세 가지(§4.1 7회차를 보고 내렸다):

15. **로드 순서와 무관하게 칸을 채운다(slot 방식, §3.7).** 「slot 방식 구현」. 사용자의 mod 세 개도 함께 고친다.
16. **칸의 둥근 테두리를 지우고 끌어서 크기를 바꾸는 분할선을 넣는다(§3.8).** 「각 슬롯의 라운드 박스 테두리는 지우고 크기 제어가 가능한 분할선만 추가해서 공간 효율성을 올리자.」
17. **칸 아무 곳이나 클릭하면 그 칸이 활성 칸이 된다(§3.8).** 「키보드(o: next) 나 클릭으로 일일이 포커스를 제어하는게 힘들다.」

2026-11-07 사용자 결정 두 가지:

18. **칸에서 뺀 mod 가 자기 pane 을 다시 열면서 보이는 탭이 바뀌는 동작을 그대로 둔다**(§4.1 「칸에서 빼기」). §4.2 에 남아 있던 항목이다.
19. **엔진의 탭 줄과 hotkey 줄 사이, hotkey 줄과 grid 사이에 끌 수 없는 구분선을 하나씩 둔다(§3.8).** 「탭 버튼과 hotkey 버튼 사이에 구분선(이동 불가), hotkey 버튼과 슬롯 사이에 구분선(이동 불가) 두곳에 추가해.」

2026-11-10 사용자 결정 한 가지(결정 12 를 바꾼다, 카드 k8):

20. **배치는 프로젝트마다 따로 저장한다**(§3.1).
    - 프로젝트 파일은 `<설정 디렉터리>/pane-grid/projects/<이름>/layout.json` 이다. 설정 디렉터리는 `CLAUDE_CONFIG_DIR`, 없으면 `$HOME/.claude` 다. 저장소 안에는 파일을 만들지 않는다.
    - 프로젝트 키는 주 작업 트리다. worktree 와 하위 디렉터리에서 시작한 세션이 같은 저장소의 배치를 쓴다. git 밖이면 `$.session.root()` 다.
    - 프로젝트 파일이 없으면 global 파일 `<설정 디렉터리>/pane-grid/layout.json` 을 읽고, 처음 배치를 바꿀 때 프로젝트 파일을 만들어 거기에 쓴다. global 파일에는 쓰지 않고 새 프로젝트의 초기값으로만 읽는다.
    - 설정 디렉터리 아래 global 파일이 없고 `$HOME/.claude/pane-grid/layout.json` 이 있으면 그것을 초기값으로 읽는다(쓰지 않는다). 0.4.x 는 `CLAUDE_CONFIG_DIR` 과 무관하게 그 경로에 썼으므로, 이것이 없으면 `CLAUDE_CONFIG_DIR` 을 쓰는 사람의 배치가 0.5.0 에서 빈 칸 하나로 바뀐다. 2026-11-10 메인 세션의 검토(카드 k8 의 c6 코멘트)로 더했다.
    - 같은 프로젝트를 연 다른 세션이 파일을 바꿨으면 덮어쓰지 않는다. 저장 전에 파일의 `mtimeMs` 를 마지막으로 읽거나 쓴 값과 비교하고, 다르면 다시 읽고 알린다.
    - 결정의 원문은 키를 `(await $.session.repo())?.root ?? await $.session.root()` 로 적었다. `repo()` 가 shell `cd` 를 따라가는 것을 실행해 확인한 뒤(§4.1 11회차) 같은 날 메인 세션의 확인(카드 k8 의 c3 코멘트)으로 `$.session.root()` 에서 위로 `.git` 을 찾는 방식으로 바꿨다(§3.1).

| mod | 저장소 | 그리는 곳 |
|---|---|---|
| `usage-gauge` 0.2.0 | `/Users/uhd/LOCAL/01-01_Projects/plugin-usage-gauge` | `AbovePrompt`(prompt 위 band). pane 이 없다 |
| `uhd-kanban` 0.10.5 | `/Users/uhd/LOCAL/01-01_Projects/skill-kanban/plugins/uhd-kanban` | pane `uhd-kanban-board` |
| `pending-questions` 0.1.7 | `/Users/uhd/LOCAL/01-01_Projects/plugin-pending-questions` | pane `pending-questions` |

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
| 최소 크기 | 너비 10 · 4 · 2 · 1 로 줄여 가며 나누자 `no space for a new pane` 로 거부됐다 | 거부하지 않는다. 나누기는 칸 크기를 보지 않으므로 pane 이 좁으면 너비나 높이가 0 인 칸이 생기고, 그 칸은 제목도 내용도 보이지 않는다. 2026-11-11 사용자 결정(카드 k11, k10 finding F20)으로 거부를 구현하지 않고 이 칸을 지금 동작으로 고쳤다 |
| 활성 표시 | 활성 pane 의 테두리가 기본 초록이다 | 활성 칸의 `borderColor` |

### 2.2 window(tmux 의 탭)

| tmux 동작 | tmux 실측 | pane-grid 에서 |
|---|---|---|
| 상태 줄 | `[session] ` 다음 `#I:#W#{flags}`. `*` 가 지금 window, `-` 가 직전 window | 엔진의 pane 탭 막대. 지금 탭은 엔진이 반전으로 그린다 |
| `new-window` | 새 window 를 연다 | 새 배치 = 새 id 로 `$.ui.open({ id: 'grid-<이름>', title })` |
| `rename-window` | 이름을 바꾼다 | pane id 가 `grid-<탭 이름>` 이므로 옛 id 의 pane 을 `$.ui.close` 하고 새 id `grid-<새 이름>` 으로 `$.ui.open` 한다. 규약 mod 가 받는 `requestId` 도 바뀐다. 2026-11-11 사용자 결정(카드 k11, k10 finding F21)으로 지금 동작을 유지하고 이 칸을 고쳤다 |
| `kill-window` | 지우면 번호에 빈자리가 남고 `move-window -r` 이 다시 매긴다 | `$.ui.close({ id })`. 배치 id 는 이름이라 번호를 다시 매길 일이 없다 |
| `next-window` · `select-window` | 번호 · 이름으로 고른다 | 사람이 탭을 클릭한다. 코드로 바꾸는 것은 prompt 가 키를 가질 때만 된다(§1 「탭 전환」) |
| `break-pane` · `join-pane` | pane 을 새 window 로 옮기고 다시 합친다 | 칸을 새 배치로 옮기고, 다른 배치로 합친다 |

### 2.3 키 바인딩

tmux 기본 바인딩은 prefix(`C-b`) 다음 한 글자다: `%` 좌우 나누기 · `"` 위아래 나누기 · `o` 다음 pane · 화살표 pane 고르기 · `C-화살표` 크기 · `z` zoom · `x` 지우기(확인) · `{` `}` 교환 · `Space` 다음 배치 · `M-1`~`M-5` preset · `!` break-pane · `c` 새 window · `n` `p` 다음 · 이전 window · `0`~`9` window 고르기 · `,` 이름 바꾸기 · `&` window 지우기 · `q` 번호 표시.

엔진에서 옮길 수 있는 수단은 두 가지이고, 둘 다 쓴다(결정 4). 같은 동작을 두 수단이 함께 부르도록 동작 함수 하나에 두 입구를 단다.

| 수단 | 동작 조건 | tmux 와 다른 점 |
|---|---|---|
| `hotkey` | 그 grid pane 이 포커스를 가졌을 때. `ctrl+x tab` 이 prefix 자리에 온다 | 숫자 · 영문 소문자만 받는다. `%` `"` `{` `}` `!` `,` `&` 는 쓸 수 없어 글자를 다시 정해야 한다. 포커스가 풀릴 때까지 계속 동작한다(tmux prefix 는 한 번) |
| slash 명령(`/grid split -h` 같은 `command.run`) | prompt 에서 | 사람의 명령이 연 pane 은 asked 라 너비 제한이 없다. 명령 뒤 `focus` 가 받아들여져 탭이 바뀌었다(R19, §4) |

tmux 글자 중 `hotkey` 로 쓸 수 없는 것을 대신하는 글자(결정 10):

| tmux | 동작 | `hotkey` |
|---|---|---|
| `%` | 좌우 나누기 | `v` |
| `"` | 위아래 나누기 | `s` |
| `{` `}` | 칸 교환 | `w` |
| `!` | 칸을 새 탭으로 옮기기(break-pane) | `b` |
| `,` | 탭 이름 바꾸기 | `-`(`/grid rename <name>` 으로만 한다. 결정 10) |
| `&` | 탭 지우기 | `k` |

나머지(`o` · `z` · `x` · `c` · `q`)는 tmux 글자를 그대로 쓴다. 탭을 바꾸는 `n` · `p` · `0` ~ `9` 는 `hotkey` 로 두지 않는다. `hotkey` 는 grid pane 이 키를 가진 동안만 동작하고, 그때 `$.ui.open({ focus: true })` 는 거부되기 때문이다(§4 「코드로 탭 바꾸기」). 탭 전환은 클릭 · Tab + Enter 와 slash 명령으로 한다(R19 에서 실행해 확인했다).

## 3. 설계안

### 3.1 배치 상태: `pane-grid` 가 하나만 가진다

- `pane-grid` 가 이 세션의 프로젝트 파일(결정 20)을 읽어, 그 결과를 자기 state `{ plugin: 'pane-grid', key: 'layout' }` 에 쓴다. 프로젝트 파일이 없으면 global 파일을 읽는다. state 는 세션마다 따로 있으므로 규약 mod 가 읽는 key 와 값의 모양은 결정 20 전과 같다.
- 값에는 배치(탭)마다 §2.1 의 트리가 들어가고, 칸마다 대상 mod 이름 · 칸 너비(열 수) · 칸 높이(행 수)가 들어간다.
- 칸 너비는 `pane-grid` 가 `e.props.bodyColumns` 와 트리 비율로 계산한다. 규약 mod 는 계산하지 않고 이 값을 읽는다. 계산 규칙이 mod 마다 복사되면 SSOT 가 깨지기 때문이다.
- 규약 mod 는 `grid` 요청을 그릴 때 이 값을 읽는다. 읽은 것만으로 구독이 걸려서, `pane-grid` 가 값을 다시 쓰면 규약 mod 의 칸도 다시 그려진다(R11).
- 사람이 hotkey · 명령으로 배치를 바꾸면 `pane-grid` 가 프로젝트 파일에 다시 써서 파일이 SSOT 로 남는다. global 파일에는 쓰지 않는다.
- 프로젝트 키(`projectOf`)는 `$.session.root()` 를 symbolic link 를 따라간 경로로 바꾸고, 거기서 위로 `.git` 을 찾아 정한다. `.git` 이 디렉터리면 그 디렉터리가 주 작업 트리다. 파일이면 그 `gitdir:` 이 가리키는 git 디렉터리의 `commondir` 로 공통 git 디렉터리를 찾고, 그 이름이 `.git` 이면 그 위가 주 작업 트리다(worktree). `commondir` 가 없으면(submodule) `.git` 파일이 있는 디렉터리다. 끝까지 없으면 root 다. `$.session.repo()` 를 쓰지 않는 것은 그 값이 shell `cd` 를 따라가기 때문이다. 작업 디렉터리 안의 중첩 저장소로 `cd` 하면 그 저장소를 냈다(11회차).
- 프로젝트 디렉터리 이름은 `<주 작업 트리의 마지막 이름>-<주 작업 트리 경로의 SHA-256 앞 16자리 hex>` 다(예: `plugin-pane-grid-…`). 마지막 이름에서 `A-Za-z0-9._-` 밖의 글자는 `-` 로 바꾼다. `~/.claude/projects/` 의 규칙(`/` · `.` · `_` → `-`)은 서로 다른 경로가 같은 이름이 되므로 쓰지 않았다. hash 는 그 충돌을 막고, 마지막 이름은 사람이 디렉터리를 알아보게 한다. 프로젝트 파일에는 원래 경로를 `"project"` 로 함께 적는다. 읽을 때는 이 필드를 보지 않으므로 파일 형식의 `version` 은 1 그대로다.
- `/cd` · worktree 이동으로 `$.session.root()` 가 바뀌면 1초 poll(`watchShown`)이 그것을 보고 키를 다시 정한다. 키가 바뀌었으면 새 프로젝트의 파일을 읽고 toast 로 알린다. 엔진은 이 이동을 mod 에 알리지 않는다. `classic.CwdChanged` hook 을 건 probe 는 `/cd` 에서도 shell `cd` 에서도 불리지 않았다(11회차). root 가 그대로인 shell `cd` 에서는 키를 다시 정하지 않는다.
- 저장 전에 프로젝트 파일의 `mtimeMs`(`$.fs.stat`)를 이 세션이 마지막으로 읽거나 쓴 값과 비교한다. 다르면(다른 세션이 쓰거나 지웠으면) 쓰지 않고 파일을 다시 읽어 state 와 pane 을 다시 만들고, `refused: another session changed this project's layout; …` 를 낸다. slash 명령은 이 글을 명령 출력으로, hotkey · 빈 칸 선택지의 누름과 분할선 끌기는 toast 로 낸다. `mtimeMs` 는 파일을 읽기 전에 잰다. 읽은 뒤에 재면 그 사이에 다른 세션이 쓴 것을 이 세션이 읽은 것으로 여겨 덮어쓸 수 있다.
- `$.state` 는 세션 id 마다 따로 있다. `/clear` 는 같은 프로세스를 새 세션 id 로 이어 가고 `session.start` 를 다시 부르지 않으므로(`SessionEndInput.reason` 문서), 그 뒤 `layout` · `scroll` · `shown` 이 비어 있다. `ensureLayout` 이 `layout` 이 빈 것을 보면 프로젝트 파일(없으면 global 파일)에서 다시 만든다. 부르는 곳은 grid pane 의 render(render 가 끝난 뒤 `$.clock.after(0)`) · 1초 poll(`watchShown`) · slash 명령과 hotkey(`runAction`) 세 곳이다. grid 탭이 가려져 있으면 render 가 불리지 않으므로 poll 이 되살린다. 칸 스크롤 위치는 되살리지 않는다(10회차).
- 칸마다의 스크롤 위치(§3.4)는 `layout` 이 아니라 다른 key `{ plugin: 'pane-grid', key: 'scroll' }` 에 쓴다. `layout` 을 쓸 때마다 모든 규약 mod 의 `state.set` hook(§3.5)이 실행되기 때문이다. R20 실행에서 스크롤 위치를 `layout` 에 함께 썼더니 휠 한 칸마다 member 의 hook 이 실행됐다(4회차 실행: 휠 29회, member hook 30회, `verification/logs/r20-run4.log`).

### 3.2 탭: 배치마다 엔진 pane 하나

- 배치 하나를 `$.ui.open({ id: 'grid-<이름>', title: '<이름>' })` 으로 연다. 규약 mod 의 matcher 는 `requestId: /^grid-/` 다.
- 가려진 탭은 다시 그려지지 않는다. 다시 보일 때 엔진이 하는 일은 R17 에서 실행해 확인했다: **가려진 동안 그 그림이 읽은 state 가 바뀌었으면 보일 때 `ui.render` 를 실행하고, 바뀌지 않았으면 실행하지 않고 지난 결과를 쓴다.** 그래서 내용이 state 로만 정해지면 `isShown` 을 주기적으로 읽지 않아도 다시 보일 때 최신이다.
- uhd-kanban `hooks/register.tsx` 191행 주석(「다시 보일 때 render 없이 지난 결과를 쓴다」)은 바뀐 것이 없을 때의 관찰과 맞는다.

### 3.3 규약 mod 의 hook

| 단계 | 규약 mod 가 하는 일 |
|---|---|
| ① | `{ component: 'Pane', requestId: /^grid-/ }` 를 hook 한다 |
| ② | `pane-grid` 의 `layout` 을 읽고 `next(e)` 를 부른다. 그 결과에 `offerChoice` 로 자기 선택지 Button 을 더한다(§3.7). 이 배치에 자기 칸이 없으면 그것을 반환한다 |
| ③ | 자기 pane 을 그리는 함수와 **같은 함수**를 칸 너비로 불러 `key="cell:<plugin>"` Box 를 만든다 |
| ④ | `fillSlot` 으로 그 Box 를 pane-grid 가 그린 `slot:<plugin>` Box 에 넣는다. slot 이 없으면(pane-grid 보다 뒤에 로드) `next(e)` 결과 뒤에 덧붙여 반환하고, pane-grid 가 그 Box 를 받아 칸 자리에 놓는다(§3.7) |

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
- 칸 내용의 전체 행 수는 엔진이 알려 주지 않는다. `e.contentRows` 는 pane 트리 전체의 행 수였다(칸 높이 6 · 머리 줄 1 · 아래 줄 1 의 8). 칸의 `offset` 상한을 정하려면 규약 mod 가 자기 행 수를 자기 state 에 적는다. 2026-11-11 사용자 결정(카드 k11 의 c8, k10 finding F57)으로 상한을 두지 않는다. 위(먼저 로드)에 있는 규약 mod 가 `offerChoice` 로 빈 칸에 더한 Button 수를 pane-grid 의 render 가 알 수 없어서, pane-grid 가 직접 그리는 빈 칸의 행 수도 정할 수 없다. 내용보다 많이 휠을 내리면 칸이 비고, 넘은 만큼 올리면 다시 보인다.
- `{}` 반환이 pane 창을 붙잡는지는 시험하지 못했다. 시험 pane 의 `contentRows`(8)가 `bodyRows`(38)보다 작아 pane 창이 움직일 수 없었다. pane-grid 는 칸 높이 합을 `bodyRows` 와 같게 그리므로 같은 조건이다.

#### 자기 행을 스스로 스크롤하는 규약 mod(0.4.0)

위 ⑤ 의 `marginTop` 은 `cell:` Box 전체를 민다. filetree 처럼 머리 줄(경로 · branch · 검색 줄)을 고정하고 그 아래 목록만 자기 `ui.scroll` hook 으로 움직이는 mod 는, 칸에 놓으면 휠이 pane-grid 에 가서 머리 줄이 칸 밖으로 밀리고 목록은 움직이지 않았다(0.3.2 와 filetree `pane-grid-cell` 브랜치, 2026-11-07 tmux 실행). 0.4.0 에서 그런 mod 가 자기 칸의 `ui.scroll` 을 받게 했다.

| 단계 | 하는 쪽 | 하는 일 |
|---|---|---|
| ① | 규약 mod | `cell:<plugin>` Box 안에 빈 Box `scrollsKey(plugin)`(`scrolls:<plugin>`)를 그린다 |
| ② | pane-grid | grid render 에서 `next(e)` 결과의 `cell:` Box 마다 그 Box 가 있는지 보고 `run.scrolling` 에 모은다. 모듈 변수라 다시 불러오면 비고, 다음 render 에서 다시 모인다 |
| ③ | pane-grid | `layout.placed[plugin]` 에 `column` · `row`(칸 내용의 왼쪽 위, pane 본문 좌표)와 `isActive`(활성 칸이거나 zoom 한 칸)를 더 쓴다 |
| ④ | 양쪽 | 읽기 모듈의 `isScrollIn(placement, e)` 로 그 `ui.scroll` 이 그 칸의 것인지 정한다. 휠이면 `e.pointer` 가 칸 내용 안에 있는가, 스크롤 키면 `isActive` 다. 두 쪽이 같은 함수를 쓴다(pane-grid 는 `skills/add-pane-grid-cell/pane-grid.ts` 를 import 한다) |
| ⑤ | pane-grid | 휠 아래 칸이 `run.scrolling` 의 mod 칸이면 `isScrollIn` 이 참일 때 `next(e)` 를 부르고, 거짓일 때(칸 제목 줄) `{}` 를 반환한다. 그 칸의 `scroll` 값은 바꾸지 않는다 |
| ⑥ | 규약 mod | `ui.scroll` hook 의 matcher 에 `/^grid-/` 를 더하고, `isScrollIn` 이 참이면 지금처럼 자기 행을 움직이고 `{}` 를 반환한다. 거짓이면 `next(e)` 다 |

로드 순서마다 갈리는 것은 ⑤ 하나다. 규약 mod 가 pane-grid 보다 먼저 로드되면 그 mod 의 hook 이 먼저 실행되어 자기 칸의 event 를 `next(e)` 없이 끝내므로, pane-grid 는 그 event 를 받지 않는다. 이때 pane-grid 는 ① 의 Box 를 볼 수 없지만(그 mod 의 `cell:` Box 는 pane-grid 가 반환한 뒤에 slot 에 들어간다) 볼 필요가 없다.

칸에 놓인 mod 가 바뀌면 그 칸의 `scroll` 값을 지운다(`hooks/register.tsx` 의 `dropStaleScroll`, `publish` 가 부른다). 칸 id 마다 놓인 mod 를 쓰기 전후로 견주어 달라졌거나 없어진 칸이 대상이다. 지우지 않으면 앞의 mod 를 민 `marginTop` 이 새 mod 에 남는다. 스스로 스크롤하는 mod 의 칸은 ⑤ 때문에 그 값이 다시 늘지 않는다. `swap` 은 칸 id 와 mod 를 함께 옮기므로(`hooks/tree.ts` 의 `swap`) 값이 지워지지 않는다.

0.4.0 에서 함께 고친 것: zoom 한 칸의 `columns` · `rows` 가 zoom 하기 전 칸 크기로 쓰여 있었다. `placements` 는 `geometry` 의 칸 사각형을 썼는데 zoom 한 칸은 grid 전체(`gridRect`)에 그려진다. 지금은 zoom 한 칸에 `gridRect` 를 쓴다.

2026-11-07 tmux 실행(200x50, 70개 파일을 둔 시험 저장소, filetree `pane-grid-cell` 브랜치):

| 확인한 것 | 결과 |
|---|---|
| pane-grid 먼저 로드, filetree 칸 위 휠 아래 3칸 | 머리 줄 5행은 그대로이고 목록이 9행 내려갔다(filetree 는 한 칸에 3행씩 움직인다) |
| 같은 칸의 제목 줄 위 휠 | 화면이 바뀌지 않았다 |
| 빈 칸 위 휠 2칸 | 빈 칸의 안내 문구가 2행 위로 밀렸다(지금까지의 `marginTop`) |
| 그 빈 칸(`scroll` 값 2)에 `/grid place filetree c1` | debug log 에 `scroll reset for c1` 이 찍혔고 filetree 가 첫 행부터 그려졌다 |
| filetree 먼저 로드, 같은 휠 | 머리 줄은 그대로이고 목록이 9행 내려갔다. 옆 빈 칸 휠은 그 칸만 밀었다 |
| 두 실행의 debug log | `pane-grid` · `filetree` 의 hook 실패 줄 0건 |

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

### 3.6 빈 칸의 선택지

2026-11-07 사용자 제안(「빈 칸이 열리면 선택 가능한 플러그인을 보여주는 것은 어떨까?」)으로 넣었다. 빈 칸은 `/grid place <plugin>` 안내 한 줄 대신 지금 불러온 규약 mod 를 Button 으로 늘어놓는다.

| 항목 | 정한 것 |
|---|---|
| 선택지의 출처 | 두 곳이다. pane-grid 보다 뒤에 로드된 mod 는 pane-grid 의 grid pane `ui.render` hook 이 `await next(e)` 뒤 읽는 `next.trace` 에서 고른다(그 render 에서 실행된 hook 의 plugin 이름 중 tier 가 `prepend` · `user` · `append` 이고 `pane-grid` · `engine` 이 아닌 것). 먼저 로드된 mod 는 trace 에 남지 않으므로 그 mod 가 `offerChoice` 로 `choices:<칸 id>` Box 에 자기 Button 을 더한다(§3.7) |
| 누르면 | `place <plugin> <칸 id>`. 그 칸에 놓고 그 칸을 활성으로 한다. 다른 칸에 있던 같은 mod 는 비운다(결정 6). 다른 칸에 있는 mod 는 `(move from c1)` 처럼 지금 칸을 붙여 적는다 |
| hotkey | 활성 칸의 선택지에만 `1` ~ `9`. 칸마다 붙이면 같은 숫자가 겹치고, 엔진은 같은 hotkey 의 Button 중 나중에 그린 것을 누른다. 활성이 아닌 칸의 선택지는 클릭으로 누른다 |
| 선택지가 0개 | `no grid-ready mod is loaded`. 이 Text 는 key 를 받지 못하므로 key `none:<칸 id>` 의 Box 에 담는다. `offerChoice` 는 Button 을 더할 때 그 Box 를 뺀다 |
| 한계 | grid pane 의 `ui.render` 에 걸리는 hook 을 가진 mod 는 규약 mod 가 아니어도 선택지에 나온다(matcher 없이 모든 `ui.render` 를 hook 하는 mod). 그런 mod 를 놓으면 칸에 `<plugin> draws nothing here` 가 그려진다 |

`/grid place` 는 칸 id 를 두 번째 인자로 받도록 넓혔다(`place <plugin>|- [<id>]`). 생략하면 전처럼 활성 칸이다.

### 3.7 로드 순서와 무관한 칸 채우기(slot)

결정 15 에 따라 넣었다. §4.1 7회차에서 규약 mod 가 pane-grid 보다 먼저 로드되면 칸이 비었다. 먼저 로드된 mod 의 hook 이 바깥에서 실행되어, pane-grid 가 칸을 모을 때 그 mod 의 `cell:` Box 가 아직 없기 때문이다.

pane-grid 가 그리는 key 는 다섯 가지다(`skills/add-pane-grid-cell/pane-grid.ts` 의 `SLOT_KEY` 등. 규약 mod 와 pane-grid 가 이 파일의 상수를 함께 쓴다).

| key | 그리는 곳 | 누가 채우나 |
|---|---|---|
| `slot:<plugin>` | mod 가 놓인 칸. 그 mod 의 `cell:` Box 를 아래에서 모았으면 그것을, 못 모았으면 안내 Text 를 담는다 | 먼저 로드된 mod 가 `fillSlot` 으로 자기 칸을 넣는다 |
| `choices:<칸 id>` · `choices:<칸 id>:active` | 빈 칸. `place:<칸 id>:<plugin>` Button 을 담는다. `:active` 는 활성 칸이라 hotkey `1` ~ `9` 를 붙인다는 표시다 | 먼저 로드된 mod 가 `offerChoice` 로 자기 Button 을 더한다 |
| `none:<칸 id>` | 선택지가 0개인 빈 칸의 안내 | `offerChoice` 가 Button 을 더할 때 뺀다 |
| `place:<칸 id>:<plugin>` | 선택지 Button | pane-grid 의 `ui.press` hook 이 key 를 읽어 `place <plugin> <칸 id>` 를 실행한다 |
| `hotkey:<글자>` | 도구줄의 hotkey Button | 같은 `ui.press` hook |

정한 것:

- **누름은 `ui.press` hook 하나가 받는다.** 먼저 로드된 mod 가 그린 Button 의 `onPress` 는 그 mod 의 것이라 pane-grid 의 함수를 부를 수 없다. 그래서 pane-grid 의 Button 도 규약 mod 의 Button 도 `onPress` 는 아무것도 하지 않고, pane-grid 의 `ui.press` hook(`{ component: 'Pane', requestId: /^grid-/, element: /^(place|hotkey):/ }`)이 key 로 동작을 정한다. 어느 순서든 같은 입구다.
- **트리는 고쳐 쓴다.** `next(e)` 가 준 트리는 frozen 이므로 `fillSlot` · `offerChoice` 는 바꾸는 노드까지의 경로만 복사한다(템플릿의 `rewrite`). 옮긴 원소의 `part` 표시는 그대로 두었다. 엔진은 바깥 hook 이 다른 plugin 의 원소를 옮겨도 그 원소의 주인을 바꾸지 않았다(Button 이 각자 눌렸다, §4.1 8회차).
- **칸 크기 측정.** 먼저 로드된 mod 가 있으면 pane-grid 의 render 는 그 mod 의 hook 안에서 실행된다. 이때 `$.clock.after(0)` 로 미룬 `layout` 쓰기가 render 실행 중에 불려 `denied: it was made while ui.render is being dispatched` 로 거부됐고, `placement.columns` 가 0 으로 남아 usage-gauge 가 pane 전체 너비(89열)로 그렸다. 그래서 트리 끝에 너비 · 높이 0 의 `Client`(`hooks/measure.tsx`)를 두고, 그 surface module 이 잰 칸 크기를 `post` 하면 `ui.message` hook 이 `layout` 을 쓴다. `ui.message` 는 render 밖이다. `Client` 가 없는 surface 에서는 전처럼 `$.clock.after(0)` 이다.
- **안내 문구.** 놓인 칸에 `cell:` Box 도 채운 slot 도 없으면 trace 를 보고 두 가지로 적는다. trace 에 이름이 있으면 `<plugin> draws nothing here`, 없으면 `<plugin> is not loaded, or its hooks/pane-grid.ts is older than pane-grid 0.3.0` 이다. 먼저 로드된 mod 는 trace 에 없으므로 `fillSlot` 이 없는 옛 `hooks/pane-grid.ts` 와 설치하지 않은 경우를 가를 수 없다.

### 3.8 분할선과 클릭으로 활성화

결정 16 · 17 에 따라 넣었다.

| 항목 | 정한 것 |
|---|---|
| 칸 | 테두리 없이 제목 1행(`CELL_CHROME_ROWS`)과 내용이다. 활성 칸의 제목은 초록 굵은 글자, 나머지는 흐린 글자다. 칸 내용 크기는 사각형 너비 × (높이 - 1) 이다 |
| 분할선 | 칸 사이 1칸(`hooks/tree.ts` 의 `DIVIDER`). 가로 나눔은 `│` 세로줄, 세로 나눔은 `─` 가로줄이다. `Client`(`hooks/divider.tsx`)로 그리고 key 는 `divider:<노드 경로>:<색인>` 이다. 노드 경로는 뿌리 `r` 에서 자식 색인을 붙인 것이다(`r.0.1`) |
| 끌기 | 왼쪽 버튼 `down` 에서 잡고, `move` · `up` 마다 분할선 위치(나눈 노드 안의 칸 수)를 `post` 한다. pane-grid 의 `ui.message` hook 이 `moveDivider` 로 양옆 자식의 크기를 다시 계산해 `layout` 을 쓰고, `up` 에서 `layout.json` 에 쓴다. 양옆은 최소 1칸이다 |
| 크기 단위 | `size` 는 백분율이고 소수 둘째 자리까지 둔다(`normalize` 의 `PRECISION`). `moveDivider` 가 칸 수에서 다시 계산한 크기를 정수로 반올림하지 않고 담기 위해서다 |
| 클릭으로 활성화 | 활성이 아닌 칸 위에 그 칸 크기의 `Client`(`hooks/activate.tsx`, key `activate:<칸 id>`)를 덮는다. `down` 에서 `post` 하면 `ui.message` hook 이 `select-cell` 을 실행하고 `$.ui.open({ id, focus: true })` 로 grid pane 에 키보드 포커스를 준다. 활성 칸에는 덮지 않으므로 그 안의 Button 은 바로 눌린다 |
| Client 가 없는 surface | 분할선은 흐린 Text 줄이고, 크기는 `/grid resize`, 활성 칸은 `/grid select-cell` 로 바꾼다 |
| 고정 구분선(결정 19) | pane 본문 맨 위(엔진의 탭 줄 바로 아래)와 hotkey 줄 아래에 `─` 한 줄씩이다. `Client` 가 아니라 흐린 Text 라 끌 수 없다. grid 위의 행 수는 `HEADER_ROWS`(구분선 1 · hotkey 줄 `TOOLBAR_ROWS` 2 · 구분선 1 = 4)이고, 칸 사각형(`gridRect`)과 휠의 `pointer.row`(`cellAt`)가 같은 값을 뺀다 |

덮는 방식을 고른 이유는 §4.1 8회차의 측정이다. 칸 아래에 깐 `Client` 는 글자 줄을 누른 것을 받지 못했다.

#### 칸 안의 Button `hotkey`(0.4.1)

칸 안에 그린 Button 의 `hotkey` 는 그 칸이 아니라 grid pane 전체에 걸린다. 엔진은 pane 이 키보드를 가진 동안 그 pane 의 모든 Button `hotkey` 를 보고, 같은 글자가 둘이면 나중에 그린 Button 을 누른다. pane-grid 는 hotkey 줄을 `{grid}` 보다 먼저 그리므로(`hooks/register.tsx`) 칸 안의 같은 글자가 이긴다. `autoFocus` 도 같아서, pane 이 키보드를 받으면 그 pane 의 첫 `autoFocus` 요소에 포커스가 간다.

2026-11-07 녹화(`verification/demo/record.py`, filetree `pane-grid-cell` 브랜치 02a6ad9)에서 세 가지가 이것으로 틀렸다. filetree 가 보이지 않게 그린 hotkey 의 `c` 가 툴바의 `c`(new tab)를, `z` 가 `z`(zoom)를 가져갔고, 활성이 아닌 filetree 칸의 `autoFocus` 가 숫자 키를 prompt 로 보냈다.

| 쪽 | 0.4.1 에서 한 것 |
|---|---|
| pane-grid | 툴바 글자를 읽기 모듈의 `TOOLBAR_KEYS` 하나로 두고, `HOTKEYS` 는 그 배열에서 만든다. 규약 mod 는 같은 배열을 읽어 그 글자를 빼고 그린다 |
| 규약 mod | `placement.isActive` 일 때만 Button `hotkey` 와 `autoFocus` 를 그리고, `TOOLBAR_KEYS` 의 글자는 그리지 않는다(`docs/add-pane-grid-cell.md` Step 5) |

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
| R19 | prompt 에서 slash 명령을 실행한 뒤 `$.ui.open({ focus: true })` 로 탭 바꾸기 | **통과.** `/r19 a` · `/r19 b` 는 `command.run` hook 안에서, `/r19 a later` 는 `$.clock.after(300)` 뒤에 열었고 세 번 모두 `isShown` 이 요청한 pane 으로 바뀌었다(`origin=composer`). 그 뒤 입력한 글자는 prompt 에 들어갔다. 탭을 바꾼 뒤에도 키는 prompt 에 남으므로 명령을 이어서 칠 수 있다. 시험 mod 는 `verification/r19-command/`, 로그는 `verification/logs/r19.log` |
| R21 | `layout` 에 자기 칸이 생기고 없어질 때 자기 pane 여닫기 | **통과.** 칸이 생기자 member 의 `state.set` hook 이 실행돼 `$.ui.close` 뒤 `panes()` 가 빈 목록이었다(hook 의 첫 로그에서 close 까지 3 ms). 칸이 빠지자 `$.ui.open` 이 `isPlaced=true` 를 반환했고 `r20m` 은 가려진 탭(`isShown=false`)으로 탭 막대에 다시 나왔다 |

### 4.1 구현한 pane-grid 와 규약 mod 세 개로 실행한 것

2026-11-06 에 pane-grid 본체(이 저장소 루트의 `hooks/`)와 세 mod 의 규약 hook 을 구현하고 실제 세션에서 실행했다. 세 mod 는 저장소마다 브랜치 `pane-grid-cell` 에 고쳤다. uhd-kanban 은 설치판이 `skill-kanban/plugins/uhd-kanban` 폴더를 그대로 읽으므로(`claude plugin list` 의 `Read from`) worktree `/Users/uhd/LOCAL/01-01_Projects/skill-kanban.pane-grid-cell` 에서 고쳤다.

세 mod 는 pane-grid 의 state 를 `hooks/pane-grid.ts` 하나로 읽는다. 세 파일에 같은 이름의 함수(`placementIn` · `readPlacement`, uhd-kanban 은 `readShownTab` 도)가 같은 본문으로 있다. `$` 를 받는 함수는 화살표 함수가 아니라 `function` 선언이다. `claude plugin validate` 가 import 너머로는 function 선언으로만 `$` 를 따라가고, `$.state.get` 에 넘기는 참조 상수의 export 도 거부하기 때문이다(그래서 `state.set` matcher 는 각 `register.tsx` 에 리터럴로 다시 적었다). import 너머로 따라가는 것은 2.1.299 부터다. 2.1.289 · 2.1.296 은 import 한 `readPlacement` · `readShownTab` 에 `$` 를 넘기는 hooks module 을 거부했다(2026-11-10, `verification/engine-floor/`). 그보다 오래된 엔진을 지원하는 mod 가 쓸 두 번째 모양은 `docs/add-pane-grid-cell.md` 의 「Engine floor」 절에 있다. pane-grid 의 값은 세 mod 의 계약(`types/index.d.ts`)에 없으므로(결정 9) 엔진 타입은 그 matcher 를 거부한다. 그래서 matcher 값을 `as never` 로 넘기고, hook 안에서는 엔진이 계약 없는 값의 쓰기에 붙이는 타입 `StateWrite` 로 `e` 를 읽는다.

설치판과 겹치지 않도록 `--settings '{"enabledPlugins":{…:false}}'` 로 설치판을 끄고 `--plugin-dir` 로 작업판을 로드했다. tmux 세션(170열 × 45행, 3회차는 200열 × 50행) 안에서 실행했다.

| 회차 | 로드한 것 | 시험 폴더 | 로그 |
|---|---|---|---|
| 1 | pane-grid · usage-gauge | `$CLAUDE_JOB_DIR/tmp/pg2` | `verification/logs/impl-usage-gauge.log` |
| 2 | usage-gauge 만 | 같은 폴더 | `verification/logs/impl-usage-gauge-alone.log` |
| 3 | pane-grid · usage-gauge · uhd-kanban · pending-questions | `$CLAUDE_JOB_DIR/tmp/pg3`(`uhd-kanban init` 으로 만든 보드, 카드 7장) | `verification/logs/impl-three-mods.log` · `impl-three-mods-screen.txt` |
| 4 | 3회차와 같다. 배치 형식을 아래 「tsc 로 고친 것」대로 바꾼 뒤 | 같은 폴더 | `verification/logs/impl-children.log` · `impl-children-screen.txt` |
| 5 | 4회차와 같은 네 mod. 빈 칸 선택지(§3.6)를 넣은 뒤. 설치판 대신 HOME 을 시험 폴더로 바꿔 사용자의 `~/.claude/pane-grid/layout.json` 을 읽지 않았다 | `$CLAUDE_JOB_DIR/tmp/pick` | `verification/logs/impl-choices.log` |
| 6 | pane-grid 와 `tool-calls`(plugin-authoring 스킬의 예제 `pane.tsx` 를 그대로 쓴 pane mod). 그 mod 를 `skills/add-pane-grid-cell` 스킬로 고친 뒤 | `$CLAUDE_JOB_DIR/tmp/skilltest` | `verification/logs/skill-tool-calls.diff` · `skill-tool-calls.log` |
| 7 | 설치본 네 개(usage-gauge · uhd-kanban · pending-questions · pane-grid). 저장소마다 로컬 마켓플레이스로 `claude plugin install` 을 이 순서로 실행했다. `--plugin-dir` 없이 세 번 실행했다 | `$CLAUDE_JOB_DIR/tmp/order` | `verification/logs/install-order.log` |

로그는 debug log 에서 판정에 쓴 줄만 뽑았다. 3회차 로그의 `PGDIAG` 줄은 시험 동안 uhd-kanban 에 넣었다가 지운 진단 줄이다.

| 번호 | 확인한 것 | 결과 |
|---|---|---|
| 칸에 그리기 | `layout.json` 에 칸을 둔 mod 가 grid 칸에 그리는가 | **통과.** usage-gauge 는 c3(32열)에, uhd-kanban 은 c1(31열)에, pending-questions 는 c2(32열)에 그렸다. 셋 모두 `placed[<mod>].columns` 를 너비로 썼다 |
| 자기 자리 | 칸이 있는 동안 자기 자리에 그리지 않는가 | **통과.** usage-gauge 의 band 가 사라졌다. pending-questions 는 `/grid place pending-questions` 뒤 자기 pane 탭이 닫혔다(`ui.close nested in pane-grid#1 > pending-questions#9`). uhd-kanban 은 session 시작 때 자기 pane 을 열지 않았다 |
| 칸에서 빼기 | `/grid place -` 뒤 자기 자리로 돌아가는가 | **통과.** usage-gauge 의 band 가 다시 그려졌다. uhd-kanban 은 자기 pane 이 다시 열렸고(`ui.open uhd-kanban uhd-kanban-board (unasked …): placed`), 보이는 탭도 그 pane 으로 바뀌었다. 다시 넣자 닫혔다 |
| 독립 동작 | pane-grid 없이 usage-gauge 만 | **통과.** `layout.json` 에 칸이 남아 있어도 band 에 그렸다 |
| R12 | grid 칸의 `Raster` 를 `$.ui.blit({ requestId: 'grid-main' })` 로 칠하기 | **통과.** 카드 k7 을 done 으로 옮긴 뒤 재배치 애니메이션이 `blit` 17번으로 재생됐고 `deny` 는 0번이었다 |
| R14 | grid 칸에서 질문 Button 누르기 | **통과.** q1 을 누르자 pending-questions 의 `ui.press` hook 이 AskUserQuestion dialog 를 열었다(`$.tool.call (pending-questions): AskUserQuestion`) |
| R16 | 배치에 자기 칸이 없는 mod | **통과.** 칸 하나짜리 새 배치 `w2` 에서 세 mod 모두 `next(e)` 를 반환해 빈 칸만 그려졌고, 실패한 hook 줄은 0건이었다 |
| R9 | 세 mod 를 한 grid pane 에 | **통과.** 화면은 `impl-three-mods-screen.txt` 다. uhd-kanban 의 접기 Button(`toggle:k1`)과 pending-questions 의 q1 이 각각 눌렸다 |

실행 중 본 것:

- pending-questions 의 맨 윗줄(`Mode: manual` 과 Button 두 개)은 32열 칸에서 `Mode` 글의 너비가 0 이 되어 보이지 않았다. 그 Box 에 `flexWrap="wrap"` 을 넣어 Button 이 다음 줄로 넘어가게 고쳤고, 다시 로드한 뒤 보였다.
- 1회차 세션(진단 줄을 넣기 전)에서는 카드를 두 번 옮겼는데 두 번 모두 재배치 애니메이션 없이 막대만 바뀌었다. 3회차 세션의 세 번째 이동(in-review → to-do)은 `planTransition` 이 null 을 냈다. 빠지거나 더해진 카드도, 상태가 바뀐 lane 도 없으면 계획하지 않는 기존 규칙(`plugins/uhd-kanban/hooks/frames.ts` 171행)이다. 1회차의 두 번은 진단 줄이 없어 원인을 가리지 못했다.

tsc 로 고친 것(4회차 전):

- 네 플러그인을 `tsc -p <플러그인 폴더> --noEmit`(TypeScript 6.0.3, `noUncheckedIndexedAccess` 켬)로 검사했다. 고치기 전 pane-grid 는 오류가 약 60건이었고 대부분 `GridSplit` 의 `children` 과 `sizes` 를 같은 색인으로 읽는 자리였다. 두 배열의 길이가 같다는 것을 형식이 보장하지 않았기 때문이다.
- `GridSplit` 을 `{ kind, children: GridChild[] }` 로, `GridChild` 를 `{ node, size }` 로 바꿨다(`types/index.d.ts`). `layout.json` 의 나눈 노드도 `children` 의 원소마다 `{ "node": …, "size": … }` 다. `size` 가 없거나 수가 아니면 1 로 두고 합 100 으로 맞춘다. `sizes` 를 쓰는 옛 형식 파일은 `tabs[0].root.children[0].node: not an object` 로 거부한다. 옛 형식은 배포한 적이 없어 판(`version`)을 올리지 않았다.
- `hooks/tree.ts` · `hooks/actions.ts` · `hooks/layout-file.ts` 를 node 26.10.0 으로 직접 실행해 동작 20번(`apply` 호출. 나누기 · 지우기 · 교환 · 비율 · preset 다섯 가지 중 세 가지 · break · close)와 사각형 계산(101열 × 31행에서 나머지 1열 · 1행이 마지막 자식에게 간다), 파일 읽기 · 쓰기 왕복을 확인했다.
- 고친 뒤 네 플러그인 모두 tsc 오류 0건, `claude plugin validate` 통과다.

4회차 결과: `/grid split -h uhd-kanban` · `split -v usage-gauge` · `place pending-questions` · `resize 40` 뒤 `layout.json` 이 새 형식으로 쓰였고, 세 mod 가 칸에 그렸다(c1 26열 = 67열의 40%). `/grid place -` 로 uhd-kanban 을 빼자 자기 pane 이 다시 열렸다. 그래서 `as never` 로 넘긴 matcher 가 실행 중에도 pane-grid 의 `layout` 쓰기를 고른다. debug log 의 `uhd-kanban@inline state.set skipped: re-entry (the plugin's own code raised it; …)` 줄 두 개는 uhd-kanban 이 자기 state 를 쓸 때 엔진이 같은 mod 의 `state.set` hook 을 matcher 를 보기 전에 빼고 남긴 것이다(2.1.319 실행 파일의 그 문자열 앞 코드에서 읽었다). matcher 가 `pane-grid` 라 빼지 않아도 실행되지 않는다.

5회차 결과: 칸 두 개(c1 usage-gauge · c2 빈 칸)로 시작했다. c2 에 선택지 세 개(`1: pending-questions` · `2: uhd-kanban` · `3: usage-gauge (move from c1)`)가 그려졌다. grid pane 을 클릭해 포커스를 준 뒤 `2` 를 누르자 c2 에 uhd-kanban 이 놓였다. `s` 로 c2 를 나눠 생긴 c3 에서 `3` 을 누르자 usage-gauge 가 c1 에서 c3 으로 옮겨졌고, 빈 c1 의 선택지는 hotkey 없이 그려졌다. c1 의 `pending-questions` 를 클릭하자 c1 에 놓였고 pending-questions 자기 pane 탭이 닫혔다. 선택지에 규약 mod 가 아닌 이름은 나오지 않았다(이 시험에서 불러온 user tier mod 는 네 개뿐이다). 실패한 hook 줄은 0건이었다.

6회차 결과: `tool-calls` 저장소에서 `claude -p "/pane-grid:add-pane-grid-cell"` 를 실행했다. 스킬은 `hooks/pane-grid.ts` 를 복사하고 `readShownTab` 을 지웠고(타이머가 없는 mod), 가이드의 Step 1 ~ 4(자기 pane 의 경우)를 적용하고 Step 5 · 6 은 해당 hook 이 없다는 이유로 건너뛰었다. 고친 mod 는 `claude plugin validate` 통과, tsc 오류 0건이었다. 실제 세션에서 빈 칸의 선택지에 `1: tool-calls` 가 그려졌고, `1` 을 누르자 칸에 그려지고 자기 pane 탭이 닫혔다. `/grid place -` 뒤 자기 pane 이 다시 열렸다(`ui.open tool-calls tool-calls (unasked, 200 columns): placed`). 실패한 hook 줄은 0건이었다.

7회차 결과: 1회차 ~ 6회차는 모두 pane-grid 를 `--plugin-dir` 의 첫 폴더로 불러왔고, 설치본은 시험하지 않았다. 세 번 실행했다.

| 실행 | `enabledPlugins` 키 순서 | 로드 순서(`$ built for`) | 칸 |
|---|---|---|---|
| a | 설치한 순서. pane-grid 가 마지막 | usage-gauge → uhd-kanban → pending-questions → pane-grid | 두 칸 모두 `<plugin> draws nothing here` |
| b | pane-grid 키만 맨 앞으로 옮겼다. `installedAt` 은 그대로 | pane-grid → usage-gauge → uhd-kanban → pending-questions | 두 칸 모두 그려졌다 |
| c | a 와 같다. 칸 안내 문구를 고친 `register.tsx` 를 설치본 폴더에 복사한 뒤 | a 와 같다 | 두 칸 모두 `<plugin> is not loaded after pane-grid: install it, or put pane-grid first in enabledPlugins` |

- 설치본의 로드 순서는 `enabledPlugins` 키 순서다. `installedAt` 을 바꾸지 않고 키 순서만 바꿨는데 로드 순서가 따라 바뀌었다. `docs/direction.md` 의 R1c 가 남긴 질문의 답이다.
- 규약 mod 가 pane-grid 보다 먼저 로드되면 규약 mod 의 hook 이 바깥에서 실행된다. pane-grid 의 `next(e)` 결과에 `cell:` Box 가 없고, 규약 mod 는 pane-grid 가 반환한 grid 뒤에 Box 를 덧붙인다. 칸 수집이 실행 순서에 묶여 있다는 뜻이다.
- 빈 칸 선택지(`next.trace`)에도 pane-grid 보다 먼저 로드된 mod 는 나오지 않는다. trace 는 pane-grid 아래에서 실행된 hook 만 적는다.
- 그래서 칸 안내 문구를 두 가지로 나눴다(`hooks/register.tsx` 의 `placedNote`). trace 에 이름이 있는데 Box 가 없으면 `draws nothing here`, trace 에 이름이 없으면 설치하거나 `enabledPlugins` 의 순서를 바꾸라고 적는다. README 의 「Install order matters」 절과 `docs/add-pane-grid-cell.md` Step 7 에 같은 조건을 적었다. 이 문구 · 절은 0.3.0 에서 바뀌었다. 지금 안내 문구는 `hooks/register.tsx` 의 `drawSlot` 과 `UNFILLED_HINT` 가 만들고(§3.7 「안내 문구」), README 의 그 절은 로드 순서와 무관하다는 문단(「How do I install it?」)으로 바뀌었다.

8회차 결과(2026-11-07, 2.1.319): §3.7 · §3.8 을 구현한 pane-grid 0.3.0 과 템플릿을 고친 규약 mod 세 개로, `--plugin-dir` 순서를 바꿔 네 번 실행했다. 배치는 두 열이고 왼쪽 열은 c1 usage-gauge 40 · c2 pending-questions 60, 오른쪽 열은 c3 uhd-kanban 60 · c4 빈 칸 40, 활성 칸 c4 다. 화면은 `tmux` 로 띄우고 클릭 · 끌기는 SGR mouse escape 를 보내서 했다.

| 실행 | 로드 순서 | 확인한 것 | 결과 |
|---|---|---|---|
| memfirst | usage-gauge → pending-questions → uhd-kanban → pane-grid | 세 칸이 slot 으로 채워졌다. c4 에 바깥 mod 세 개가 `offerChoice` 로 더한 선택지 `1` ~ `3`. `2` 를 누르자 c4 에 pending-questions 가 놓였다 | 통과 |
| memfirst | 같다 | c1 의 글자를 클릭하자 c1 이 활성 칸이 됐고 이어 누른 `o` 가 grid pane 에 들어갔다. 비활성 칸 c4 첫 클릭은 활성화만, 두 번째 클릭은 그 자리의 pending-questions `rescan` Button 을 눌렀다 | 통과 |
| memfirst | 같다 | 세로 분할선을 -10 · +15 · -5 칸, 가로 분할선을 +3 · -6 · +6 칸 끌었다. 여섯 번 모두 끈 칸 수만큼 옮겨졌다. `q: list` 도 눌렸다 | 통과 |
| pgfirst | pane-grid → 세 mod | `cell:` Box 수집, `next.trace` 의 선택지와 hotkey `3`, 클릭 활성화, `s` 나누기, 끌기 | 통과 |
| mixed | usage-gauge → pane-grid → 나머지 두 mod | 안쪽 mod 의 선택지 `1` · `2` 와 바깥 mod 의 선택지 `3` 이 한 칸에 그려졌다 | 통과 |
| alone | pane-grid 만 | 놓인 칸은 `<plugin> is not loaded, or its …`, 빈 칸은 `no grid-ready mod is loaded` | 통과 |

네 실행 모두 실패한 hook 줄은 0건이다(`verification/logs/run8-*.log` 는 debug log 에서 네 plugin 의 줄과 `$ built for` 줄만 남긴 것이다).

고치며 본 것:

- memfirst 첫 실행에서 usage-gauge 막대가 89열로 그려졌다. 원인과 고친 것은 §3.7 「칸 크기 측정」이다. 고친 뒤 `layout revision=2` 가 나왔다.
- 10칸 끌었는데 6칸만 옮겨졌다. `divider.tsx` 가 `onPointer` 를 처음 한 번만 등록해 처음 받은 `props.start` 를 계속 썼다. 부를 때마다 다시 등록하게 고쳤다.

클릭 측정(`verification/click-probe/`, `verification/logs/run8-clickprobe.log`): 칸 하나에 Text 두 줄과 Button 하나를 그리고 `Client` 를 두 가지로 놓아 봤다.

| `Client` 의 자리 | Text 를 클릭 | Button 을 클릭 | 빈 자리를 클릭 |
|---|---|---|---|
| 내용보다 뒤(위에 덮음) | `Client` 가 받는다 | `Client` 가 받고 Button 은 눌리지 않는다 | `Client` 가 받는다 |
| 내용보다 앞(아래에 깖) | 어느 hook 에도 오지 않는다. Text 는 줄 전체 너비로 늘어나 있어 그 줄 어디를 눌러도 같다 | Button 이 눌린다 | `Client` 가 받는다 |

- `Client` 위에서도 마우스 휠은 `ui.scroll` 로 왔다. 칸 스크롤(§3.4)은 그대로다.
- `Client` 를 클릭해도 pane 에 키보드 포커스가 가지 않았다. 이어 누른 `h` 가 prompt 에 입력됐다. `ui.message` hook 에서 `$.ui.open({ id, focus: true })` 를 부르자 다음 `h` 가 pane 의 hotkey 로 눌렸다.
- 한 프레임에 `post` 는 하나만 전달됐다. `down` 과 `up` 을 한꺼번에 보내자 `up` 하나만 왔다.

남은 것: 설치본(`enabledPlugins`) 순서로는 8회차를 다시 실행하지 않았다. 7회차에서 설치본의 로드 순서도 `--plugin-dir` 과 같은 hook 순서를 만든다는 것을 확인했으므로 같은 결과로 본다.

9회차 결과(2026-11-07, 2.1.319): 결정 19 의 고정 구분선과, `runAction` 이 `syncPanes` 를 탭의 pane id · title(`paneSpec`)이 바뀔 때만 부르도록 한 변경을 확인했다. 설치본 pane-grid 를 `--settings` 로 끄고 작업판을 `--plugin-dir` 로 불러, 170열 × 45행 `tmux` 세션에서 실행했다. 다른 mod 는 설치본(usage-gauge · uhd-kanban · pending-questions · filetree)이다. 실행 전에 `~/.claude/pane-grid/layout.json` 의 사본을 두고, 끝난 뒤 되돌려 SHA-256 이 같은 것을 확인했다.

| 확인한 것 | 결과 | 근거 |
|---|---|---|
| 고정 구분선 두 줄 | 엔진 탭 줄 아래 `─` 한 줄, hotkey 두 줄, `─` 한 줄, 그 아래 c2 의 제목이 그려졌다 | `verification/logs/run9-rules-screen.txt`(pane 열만 남겼다) |
| `/grid next` 세 번 | `ui.open pane-grid` 줄이 늘지 않았다(시작 때 1줄 그대로) | `verification/logs/run9-rules-syncpanes.log` |
| `/grid zoom` 두 번(대조군. title 에 `[Z]` 가 붙고 빠진다) | 한 번마다 `ui.open pane-grid grid-main (asked …)` 가 1줄씩 늘었다 | 같은 파일 |

- zoom 쪽에서 줄이 늘었으므로 next 쪽에서 0줄인 것은 `syncPanes` 를 부르지 않은 결과다(로그가 찍히지 않은 것이 아니다).
- 실패한 hook 줄은 0건이었다.
- 시작하고 17초 뒤 filetree 가 자기 pane 을 열어(`ui.open filetree filetree (unasked …)`, 첫 `/grid` 동작보다 앞) 보이는 pane 이 filetree 로 바뀌었다. `/grid` 동작과는 무관하다.
- 휠 위치(`cellAt`): 두 번째 세션에서 c2 와 c3 의 경계에 SGR mouse 휠을 보냈다. 터미널 16행(c2 의 마지막 행)에서는 c2 의 첫 줄만, 18행(c3 의 제목 행)에서는 c3 의 첫 줄만 올라갔다. 16행은 빼는 값이 옛 `TOOLBAR_ROWS`(2)였다면 c3 으로 판정되는 자리라 이 실행이 오프셋 오류를 가른다. `ui.scroll` 2회 모두 실패 줄이 없었다(같은 로그 파일의 `run 2` 절).

10회차 결과(2026-11-07, 2.1.319): `/clear` 뒤 grid pane 이 비는 문제와 그 수정을 확인했다. 170열 × 45행 `tmux` 세션에서 `claude --model haiku` 로 실행했고, 다른 mod 는 설치본(usage-gauge · uhd-kanban · pending-questions · filetree)이다. 수정 전은 설치본 pane-grid 0.3.1, 수정 후는 작업판을 `--plugin-dir` 로 불렀다(로그에 `pane-grid@inline` 만 불려 왔다).

| 확인한 것 | 결과 | 근거 |
|---|---|---|
| 수정 전, grid 탭이 보이는 채로 `/clear` | grid pane 이 탭 줄만 남고 비었다. 이어 `/grid list` 가 `pane-grid has not loaded its layout yet` 을 출력했다. `/grid reload` 뒤 다시 그려졌고 `revision=1` 이었다(`/clear` 전에는 2) | `verification/logs/run10-clear-before.log`, 화면은 `tmux capture-pane` 출력 |
| 수정 후, grid 탭이 보이는 채로 `/clear` | `SessionEnd:clear` 뒤 21 ms 에 `layout state is empty` 줄, 이어 `revision=1` 줄이 한 번씩 나왔다. grid 가 다시 그려졌다 | `verification/logs/run10-clear-after.log` 의 run 1 |
| 수정 후, Files 탭이 보이는 채로 `/clear` | grid pane 의 render 줄(`key=grid-main`) 없이 488 ms 뒤 같은 두 줄이 나왔다. 1초 poll 이 `/clear` 뒤에도 돈다. 보이는 탭은 Files 그대로였고, usage-gauge 가 prompt 위에 자기 band 를 그리지 않았다 | 같은 파일의 run 2 |

- 수정 전 `revision` 이 1 로 돌아간 것으로 `layout` 값이 `/clear` 에서 비었다는 것을 가렸다(`publish` 는 이전 값의 `revision` 에 1 을 더한다).
- 사용자 화면(2026-11-07)에서 grid pane 이 빈 것과 함께 usage-gauge 의 band 가 prompt 위에 나타났다. `layout` 이 비면 규약 mod 는 `readPlacement` 가 `undefined` 라 자기 자리로 돌아가기 때문이다. grid 탭이 가려진 경우도 되살려야 하는 이유다.

11회차 결과(2026-11-10, 2.1.322 · 2.1.299): 결정 20 을 구현한 작업판을 `--plugin-dir` 로 부르고 설치본 pane-grid 는 `--settings '{"enabledPlugins":{"pane-grid@pane-grid":false}}'` 로 껐다. 170열 × 45행 `tmux` 세션이다. 시험 프로젝트는 그 세션의 job tmp 아래 git 저장소 `proj-a` · `proj-b`, `proj-a` 의 worktree `proj-a-wt`, git 밖 디렉터리 `plain` 이다. `proj-b/inner` 는 `proj-b` 안의 중첩 저장소다. 다른 mod 는 설치본이다. 먼저 `verification/cwd-probe/`(1초마다 `cwd` · `root` · `repo()` 를 읽고 `classic.CwdChanged` 를 hook 하는 시험 mod)로 엔진을 쟀다.

| 확인한 것 | 결과 | 근거 |
|---|---|---|
| probe: `/cd proj-b` | `classic.CwdChanged` 줄이 없었다. 1초 poll 에서 `cwd` · `root` · `repo().root` 가 모두 `proj-b` 로 바뀌었다 | `verification/logs/k8-cwd-probe.log` |
| probe: `proj-b` 에서 `! cd inner` | `CwdChanged` 줄이 없었다. `cwd` 와 `repo().root` 가 `proj-b/inner` 로 바뀌고 `root` 는 `proj-b` 그대로였다 | 같은 파일 |
| probe: `CLAUDE_CONFIG_DIR=<디렉터리> claude -p "/k8probe"` | `$.env.get('CLAUDE_CONFIG_DIR')` 이 그 디렉터리를 냈다. 주지 않으면 `undefined` 였다 | 명령 출력(파일로 남기지 않았다) |
| 프로젝트 파일이 없는 `proj-a` 에서 시작, `/grid split -h` | 시작 때 global 의 칸 네 개가 보였다. 분할 뒤 `projects/proj-a-0952985bc9094c16/layout.json` 이 생겼고(`"project"` 필드, 칸 c1 ~ c5) global 파일의 SHA-256 · mtime 은 그대로였다 | `verification/logs/k8-project-key.log` 의 a1 |
| `proj-b` 에서 시작, `/grid list` | c5 없는 global 의 칸 네 개였다 | 같은 파일의 b1 |
| `proj-a/sub` · `proj-a-wt` 에서 시작 | 둘 다 키가 `proj-a` 였고 `/grid list` 에 c5 가 있었다 | 같은 파일의 s1 · w1 |
| `plain`(git 밖)에서 시작, `/grid split -h` | 키가 `plain` 이었고 `projects/plain-62f36839f35f376c/layout.json` 이 생겼다 | 같은 파일의 n1 |
| `proj-b` 에서 `! cd inner` 뒤 `/cd proj-a-wt` | 키를 다시 정할 때 probe 의 `repo().root` 는 `proj-b/inner` 였고 이어 `proj-a` 가 됐다. pane-grid 는 키를 `proj-a` 로 정하고 `the session moved to …/proj-a; loaded 1 tab(s) from ~/.claude/pane-grid/projects/proj-a-…/layout.json` toast 를 냈다 | 같은 파일의 c1 |
| `/grid reload` · `/clear` 뒤 `/grid list` | reload 는 `loaded 1 tab(s) from ~/.claude/pane-grid/projects/proj-a-…/layout.json` 을 냈다. `/clear` 뒤 `layout state is empty` 줄이 나왔고 `/grid list` 가 프로젝트 파일의 칸 c1 ~ c7 을 냈다 | 같은 파일의 c1 |
| 프로젝트 파일을 `{"version":1,"tabs":[]}` 로 바꾸고 `/grid reload`, 이어 `/grid split -h` | `… is not a valid layout (tabs must be a list of one tab or more); using one empty tab` toast, 분할 뒤 `projects/proj-b-…/layout.invalid.json` 에 그 원문이 남고 `layout.json` 은 칸 c1 · c2 로 다시 쓰였다 | `verification/logs/k8-concurrent.log` 의 x2 |
| 같은 `proj-a` 의 두 세션: `proj-a/sub` 가 `/grid split -v` 로 쓴 뒤 `proj-a-wt` 가 `/grid split -v` | 뒤 세션이 `changed by another session (mtimeMs … -> …); not written` 을 남기고 `refused: another session changed this project's layout; loaded … again, do it once more` 를 냈다. `/grid list` 가 앞 세션의 c6 을 보였다. 같은 명령을 다시 하자 c7 이 쓰였다 | `verification/logs/k8-concurrent.log` 의 w1 |
| 깬 사본(`persist` 의 `mtimeMs` 비교를 `false &&` 로 끈 사본), `proj-b` 의 두 세션: 앞 세션 `/grid split -h`(c7 생김) 뒤 다른 세션 `/grid resize 30` | 뒤 세션이 그대로 써서 파일의 칸이 c1 ~ c6 이 됐다. 앞 세션의 c7 이 사라졌다 | 같은 파일의 x1 · y1 |
| 같은 순서를 작업판으로 | 뒤 세션이 거부했고 파일에 c7 이 남았다 | 같은 파일의 x2 · y2 |
| grid-ready mod | `proj-a-wt` 세션에서 `/grid place filetree c7` 뒤 `/grid zoom` 으로 filetree 가 c7 에 파일 목록을 그렸다. pending-questions · uhd-kanban 도 각 칸에 그렸다 | `tmux capture-pane` 출력(파일로 남기지 않았다) |
| `CLAUDE_CONFIG_DIR` 을 빈 디렉터리로 주고(그 아래 `pane-grid/layout.json` 없음) `proj-a` 에서 `claude -p "/grid list"` · `"/grid reload"` | `$HOME/.claude/pane-grid/layout.json` 의 칸 네 개를 냈고 reload 는 `loaded 1 tab(s) from ~/.claude/pane-grid/layout.json` 이었다 | `verification/logs/k8-config-dir.log` 의 cc1 · cc2 |
| 같은 설정 디렉터리로 `claude -p "/grid split -h"` 뒤 `"/grid reload"` | `<설정 디렉터리>/pane-grid/projects/proj-a-0952985bc9094c16/layout.json` 이 생겼고(칸 c1 ~ c5) reload 가 그 파일을 읽었다. `$HOME/.claude/pane-grid/layout.json` 의 SHA-256 은 시험 전 값 그대로였다 | 같은 파일의 cc4 · cc5 |
| 설정 디렉터리 아래 `pane-grid/layout.json`(칸 다섯 개)이 있을 때 `proj-b` 에서 `/grid reload` · `/grid list` | 그 파일을 읽었다(`$HOME/.claude` 의 것이 아니다) | 같은 파일의 cc6 · cc7 |
| 깬 사본(언제나 설정 디렉터리 아래 파일을 고르는 사본)과 작업판, 빈 설정 디렉터리에서 `/grid list` | 깬 사본은 빈 칸 하나(`c1`)였다(0.5.0 커밋 581254b 의 동작). 작업판은 `$HOME/.claude` 의 칸 네 개였다 | 같은 파일의 cc8 · cc9 |
| 대화형 세션에 `CLAUDE_CONFIG_DIR` 을 준 시험 | 빈 설정 디렉터리에는 로그인 정보가 없어 로그인 화면에서 멈췄다. 그래서 위 네 줄은 `claude -p` 세션으로 확인했다 | `tmux capture-pane` 출력(파일로 남기지 않았다) |
| grid-ready mod 의 member 쪽: `verification/member-probe/`(member 읽기 모듈의 `readPlacement` 값을 1초마다 debug log 에 적는 시험 mod)와 함께 프로젝트 파일이 없는 `proj-b` 에서 `/grid split -h`, `/grid place usage-gauge c5`, `/exit` | usage-gauge 가 c5 에 그렸다. probe 의 마지막 줄은 usage-gauge `cell c5, column 38, row 5, columns 37, rows 7, isActive true`, filetree `cell c4, column 0, row 14, columns 75, rows 16` 이었다 | `verification/logs/k8-member.log` 의 m1 |
| 같은 `proj-b` 에서 새 세션을 열고 아무것도 입력하지 않음(두 번) | usage-gauge 는 c5 에, filetree 는 c4 에 그렸다. probe 가 m1 의 마지막 줄과 같은 값을 냈다. 첫 줄은 탭 크기를 재기 전이라 `columns` · `rows` 가 0 이었다 | 같은 파일의 m2 · m4 |
| 엔진 2.1.299 | `claude plugin validate .` 통과. `proj-a/sub` 에서 `claude -p "/grid list"` 가 같은 키(`proj-a`)와 같은 칸을 냈다 | `verification/logs/k8-project-key.log` 의 v299 |

- `plain` 세션은 도중에 module 을 다시 불러(`pane-grid: 0.4.3` 줄) 그때의 global 파일을 읽었다. 그 사이 다른 세션이 global 파일을 바꿨으므로(`inbox` 칸, `"project"` 필드 없음) `plain` 의 칸 id 가 c1 ~ c7 이 됐다. 프로젝트 파일이 없는 프로젝트가 global 파일을 읽는 결정 20 대로의 동작이다. 이 세션의 코드가 쓰는 파일에는 언제나 `"project"` 필드가 있다.
- 실행하지 않은 것: hotkey · 빈 칸 선택지의 누름과 분할선 끌기에서 거부될 때의 toast. 세 경로 모두 slash 명령과 같은 `persist` 를 거치는 것은 코드를 읽어 확인했다.

녹화(`verification/demo/record.py`)에서 본 것(2.1.319):

- hotkey 줄의 `q: list` 같은 글자는 Button 이다. 그 자리를 클릭하면 그 동작이 실행되고 포커스는 prompt 에 남아 다음 글자 키가 prompt 에 입력됐다. Button 이 없는 자리(hotkey 줄의 오른쪽 끝)를 클릭하면 포커스가 grid pane 으로 옮겨졌다.
- `c`(`/grid new`)로 연 탭은 숨은 탭으로 열렸고 보이는 탭은 바뀌지 않았다. 탭 표시줄의 이름을 클릭하자 보였다.
- 칸에 놓이지 않은 규약 mod 가 자기 pane 을 열면 grid 탭이 숨은 탭이 될 수 있었다. 이때 `/grid select main` 으로 보이게 했다.

### 4.2 남은 확인

| 번호 | 확인할 것 | 통과 기준 |
|---|---|---|
| R13 나머지 | 두 mod 가 같은 key 의 Button 을 한 `grid` 트리에 그릴 때 각각 눌리는가 | 두 mod 의 `onPress` 로그가 따로 나온다 |
| 결정 8 | grid 탭이 가려지면 uhd-kanban 애니메이션이 멈추고, 다시 보이면 다시 시작하는가 | run.status 열에 live 카드가 있는 보드에서, 가려진 동안 `blit` 0번 · 다시 보인 뒤 재개 |

## 5. mod 별 수정 범위

아래 표의 「고칠 것」은 2026-11-06 에 세 저장소의 브랜치 `pane-grid-cell` 에 구현했고, 실행 결과는 §4.1 에 있다. 행 번호는 고치기 전 `main` 의 것이다.

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
