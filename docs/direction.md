# pane-grid 작업 방향

2026-11-06 에 작성했다. 아래 수는 그날 Claude Code 2.1.318 에서 실행한 결과이고, 엔진이 바뀌면 다시 확인한다.

## 1. 목적

Claude Code 의 mod(function hooks plugin)는 `$.ui.open` 으로 pane 을 연다. 엔진은 pane 을 한 번에 하나만 보여 주고 나머지는 탭으로 둔다(타입 정의 `Pane` 의 문서: 「one shown, the rest tabs」). pane 하나를 나눠 여러 mod 의 내용을 함께 배치하는 mod `pane-grid` 를 만든다.

사용자가 정한 범위: **배치 대상에는 사용자가 수정할 수 없는 mod 가 들어간다.**

이 문서의 용어는 다음과 같다.

| 용어 | 뜻 |
|---|---|
| 대상 mod | `pane-grid` 가 pane 하나에 배치하는 다른 mod |
| 규약 mod | 수정할 수 있어서 `pane-grid` 규약 hook(§3.1)을 넣은 대상 mod |
| 수정 불가 mod | 코드를 바꿀 수 없는 대상 mod. 마켓플레이스에서 설치한 남의 mod 등 |
| 상호작용 요소 | 누르거나 입력하는 요소: `Button` · `Input` · `Select` · `onLinkPress` 를 준 `Markdown` |

## 2. 엔진 제약 (test harness 에서 측정)

`claude plugin test` 로 측정했다. 이것은 엔진의 test harness 이고 실제 터미널 세션이 아니다. 실제 세션에서 다시 확인하는 항목은 §4 에 있다.

| 확인한 것 | 결과 | 출력 · 근거 | 시험 폴더 |
|---|---|---|---|
| 엔진에 pane 분할 API 가 있는가 | 없다 | 타입 정의 `Pane` 문서 | - |
| `pane-grid` 의 `ui.render` hook(`{ component: 'Pane' }`)이 다른 mod 의 pane 그리기 요청도 받는가 | 받는다 | `$.ui.log` 의 `heard a` · `heard b` | `snapshot` |
| `next({ ...e, requestId: '<다른 id>' })` 로 다른 pane 의 트리를 받는가 | 거부된다 | `next() passed an argument with a changed requestId (the envelope is the engine's; a rewrite keeps surface, component, requestId, viewport)` | (그날 scratchpad 에서 실행, 저장 안 함) |
| 다른 render 에서 저장한 트리를 `grid` pane 에 그리는가 | 상호작용 요소가 없으면 그려진다. 있으면 hook 이 실패하고 엔진이 대신 그린다 | `returned a Button it did not draw (child-a#1); a render hook may keep the ones next(e) returned, not address another plugin's` | `snapshot` |
| `pane-grid` 의 `ui.press` hook 이 `next()` 에 다른 mod 의 `plugin` · `element` · `requestId` 를 넘겨 그 mod 의 `onPress` 를 실행하는가 | 거부된다 | `next() passed an argument with a plugin other than the one that drew the element` | `press-proxy` |
| `Client` 요소로 다른 mod 의 surface module 을 그리는가 | 안 된다. `module` 은 자기 플러그인 안의 경로만 받는다 | 타입 정의 `ClientProps.module` 문서 | - |
| 규약 mod 가 `grid` pane 을 hook 해 `slot:<plugin>` Box 를 채우면 그 Button 이 눌리는가 | 눌리고 규약 mod 의 `onPress` 가 실행된다 | `PRESS OK` · `pressed a` | `cooperative` |
| 수정 불가 mod 의 pane `a` 를 그릴 때 `next(e)` 트리와 pane `b` 의 저장한 트리를 한 Box 에 나란히 그리면, `a` 의 Button 이 눌리는가 | 눌린다 | `["hello from a","hello from b"]` · `PRESS OK` · `pressed a` | `host-in-member` |

시험 폴더는 `verification/harness-probe/<이름>/` 이다. `claude plugin test verification/harness-probe/<이름>` 으로 다시 실행한다.

판정 규칙을 한 줄로 줄이면: **한 render 안에서 그 render 의 `next(e)` 가 반환한 상호작용 요소만 남길 수 있다.** 다른 render 에서 저장한 트리는 글자로만 쓸 수 있고, 다른 mod 의 handler 를 대신 실행할 수 없다.

## 3. 설계 후보

2026-11-06 사용자 결정: **구현 방식은 규약 방식(3.1)이다.**

3.1 은 대상 mod 에 규약 hook 을 넣어야 하므로 수정 불가 mod 는 3.1 만으로 배치할 수 없다. 같은 날 사용자 결정: **규약 mod 는 3.1 로, 수정 불가 mod 는 3.2 로 처리한다.** 3.2 의 화면 규칙(지금 보이는 탭의 수정 불가 mod 만 누를 수 있다)도 이 선택지에 적혀 있었다. 3.3 은 3.2 가 실제 세션에서 막힐 때만 쓴다.

같은 날 뒤이은 사용자 결정: **3.2 · 3.3 을 계획에서 뺐다.** 남의 mod 는 라이선스가 허락하면 fork 해서 3.1 의 hook 을 넣는다(`docs/grid-and-tabs.md` 결정 1 · 7). 3.2 · 3.3 에만 걸린 R4 · R7 · R8 도 뺐다. 아래 3.2 · 3.3 절과 R1 ~ R3 결과는 그 결정의 근거로 남긴다.

같은 날 사용자 결정: **`pane-grid` 는 `CLAUDE_CODE_PLUGIN_DIRS` 로 불러온다.** 설치본은 먼저 설치된 mod 보다 아래에 놓여 3.2 가 동작하지 않았다(§4.1 R1b). 이 변수 없이 시작한 세션(데스크톱 앱 등)에는 `pane-grid` 가 로드되지 않는다. 2026-11-07 에 이 결정을 대체했다. pane-grid 0.3.0 은 로드 순서와 무관하게 칸을 채우므로(`docs/grid-and-tabs.md` 결정 15 · §3.7) 마켓플레이스 설치본으로 쓴다(README 「How do I install it?」).

### 3.1 규약 mod: `slot:<plugin>` 규약

pane-grid 0.3.0 에서 이 절의 두 경우를 모두 구현했다(`docs/grid-and-tabs.md` §3.7, 실행 결과는 §4.1 8회차). 처음 설계와 다른 것은 세 가지다. pane id 는 `grid` 하나가 아니라 배치마다 `grid-<이름>` 이고 규약 mod 의 matcher 는 `requestId: /^grid-/` 다. 빈 칸의 선택지도 `choices:<칸 id>` Box 로 같은 두 경우를 처리한다. pane-grid 0.2.0 은 `cell:*` 쪽만 구현해서 pane-grid 가 규약 mod 보다 먼저 로드되어야 했다(§4.1 7회차). 규약 mod 를 만드는 절차는 `docs/add-pane-grid-cell.md` 가 갖는다. 아래는 2026-11-06 의 처음 설계로 남긴다.

- `pane-grid` 가 pane `grid` 를 열고 배치 정보에 따라 `key="slot:<plugin>"` Box 를 행 · 열로 그린다.
- 규약 mod 는 `{ component: 'Pane', requestId: 'grid' }` 를 hook 한다. `next(e)` 결과에 자기 `slot:<plugin>` 이 있으면 그 Box 를 채우고, 없으면 `key="cell:<plugin>"` Box 를 덧붙여 반환한다.
- `pane-grid` 는 `next(e)` 결과에서 `cell:*` Box 를 모아 제자리에 둔다.
- 두 경우를 함께 처리하는 이유는 같은 `user` tier 안의 플러그인 실행 순서를 mod 가 정하지 못하기 때문이다. `cell:*` 쪽(규약 mod 가 아래)은 `cooperative` 에서 확인했고, `slot:*` 쪽(규약 mod 가 위)은 2026-11-06 에는 코드만 있고 실행하지 않았다(2026-11-07 에 실행했다, `docs/grid-and-tabs.md` §4.1 8회차).
- 모든 대상 mod 의 상호작용 요소가 동시에 눌린다.

### 3.2 수정 불가 mod: 대상 pane 안에 나란히 그리기 (뺐다)

- `pane-grid` 는 모든 pane 의 render 를 hook 한다. 대상 mod 의 pane 이 그려질 때 그 render 의 `next(e)` 트리(누를 수 있음)를 해당 영역에 두고, 나머지 대상 mod 의 영역에는 각자의 마지막 트리를 둔다.
- 다른 render 에서 저장한 트리에 상호작용 요소가 있으면 엔진이 거부하므로, 그 요소를 `Text` 로 바꿔 그려야 한다. 바꿔 그린 트리가 통과하는지는 측정하지 않았다(R8 은 3.2 와 함께 뺐다).
- 결과: **지금 보이는 탭의 대상 mod 만 누를 수 있고, 나머지는 글자로만 보인다.** 탭을 바꾸면 누를 수 있는 대상이 바뀐다.
- 조건: `pane-grid` 의 hook 이 대상 mod 의 hook 보다 위에서 실행되어야 한다. 수정 불가 mod 의 render hook 은 대개 `next(e)` 를 부르지 않으므로, 아래에 있으면 `pane-grid` 의 hook 이 호출되지 않는다.

### 3.3 저장한 트리만 그리기 (뺐다)

3.2 에서 누를 수 있는 영역을 빼고 전부 글자로 그리는 방법이다. 대상 pane 이 탭으로 열려 있어야 하고, 그 pane 이 다시 그려질 때만 내용이 바뀐다. 3.2 가 실제 세션에서 막힐 때만 쓴다.

### 3.4 배치 정보: 설정 파일

2026-11-06 사용자 결정: **배치 정보(어느 mod 를 어느 영역에 몇 % 너비로 둘지)는 설정 파일에 둔다.** slash command 로 정하지 않는다.

정하지 않은 것은 다음과 같다. 기본값을 적어 두고 R10 결과를 보고 확정한다.

| 항목 | 기본값 | 다른 후보 · 이유 |
|---|---|---|
| 형식 | JSON 파일 하나 | manifest 의 `userConfig` 는 `settings.json` 의 `pluginConfigs` 에 저장되고, 바뀌면 엔진이 module 을 다시 불러온다. 다만 필드가 낱개 값이라 행 · 열 · 너비가 중첩된 배치를 담기 어렵다 |
| 경로 | `${CLAUDE_CONFIG_DIR ?? $HOME/.claude}/pane-grid/layout.json` | `pending-questions` 가 런타임 데이터를 같은 위치(`.../pending-questions/`)에 둔다. 프로젝트별 배치가 필요하면 작업 폴더의 파일을 함께 읽는다 |
| 읽는 방법 | `$.fs.read`(절대 경로를 받고 4 MiB 까지 읽는다) | - |
| 다시 읽는 시점 | `$.fs.stat` 의 `mtimeMs` 가 바뀌었을 때 | `$.fs` 에 파일 감시 API 가 없다(타입 정의 `fs` 에서 확인). 확인하는 시점은 R10 에서 정한다 |

## 4. 검증 순서 (실제 세션)

구현 전에 아래를 차례로 확인한다. 각 항목은 시험 mod 를 `verification/<이름>/` 에 두고 실제 세션에서 실행한다.

실행 방법은 `plugin-pending-questions/docs/handoff.md` §2 에서 확인한 절차를 따른다.

- `tmux` 세션 안에서 `claude --plugin-dir verification/<이름> --debug-file <로컬 디스크의 로그 경로>` 로 시작하고, 끝난 뒤 로그를 `verification/logs/` 로 복사한다. R1 은 로그를 이 세션의 scratchpad(로컬 디스크)에 썼다.
- 프롬프트는 `tmux send-keys -l` 로 글자를 보내고, 몇 초 뒤 `Enter` 를 따로 보낸다.
- `--debug-file` 로그를 `--plugin-dir` 로 준 폴더 안에 두지 않는다. `--debug-file` 은 로그 옆에 심볼릭 링크 `latest` 를 만들고, 그 폴더가 SMB 위에 있으면 `command.run` 이 호출되지 않았다.
- 판정은 `$.ui.log` 줄 · debug log · `tmux capture-pane` 출력으로 한다. 시험마다 실패 출력을 한 번 일부러 만들어 확인한다(`~/.claude/CLAUDE.md` §8 ③).

| 번호 | 확인할 것 | 통과 기준 | 3.x 에 미치는 영향 |
|---|---|---|---|
| R1 | 실행 순서: `pane-grid` 를 `--plugin-dir` 로, 수정 불가 mod 를 설치본으로 함께 띄웠을 때 `pane-grid` 의 hook 이 그 mod 의 pane render 를 받고, `next(e)` 가 그 mod 의 트리를 반환하는가 | `next.trace` 를 로그로 남겨 순서를 읽는다 | 실패하면 3.2 · 3.3 모두 불가 |
| R1b | 실행 순서: `pane-grid` 를 `--plugin-dir` 가 아니라 설치본으로 쓸 때. R1 결과의 가설(설치본 순서 = `settings.json` 의 `enabledPlugins` 키 순서)이 맞는가 | `enabledPlugins` 에서 대상 mod 보다 뒤에 둔 경우와 앞에 둔 경우의 `next.trace` | 설치본 `pane-grid` 가 대상 mod 보다 아래면 3.2 · 3.3 불가 |
| R1c | 설치본 순서를 정하는 값이 `enabledPlugins` 키 순서인가 `installedAt` 인가. `CLAUDE_CODE_PLUGIN_DIRS` 로 불러온 플러그인도 `--plugin-dir` 처럼 설치본보다 앞에 놓이는가(이 부분은 통과, §4.1) | 값 하나만 바꾼 실행의 로드 순서 | `pane-grid` 를 위에 두는 방법(§6) |
| R2 | 보이지 않는 탭의 pane 도 render 가 호출되는가 | 탭 전환 없이 대상 mod 의 내용을 바꾸고 로그를 본다 | 3.2 · 3.3 의 글자 영역 갱신 시점 |
| R3 | `pane-grid` 가 `$.ui.invalidate('ui.render')` 를 부르면 다른 mod 의 pane 도 다시 그려지는가 | 로그의 render 호출 수 | 3.2 · 3.3 의 갱신 방법 |
| R5 | §2 의 거부 두 가지가 실제 세션에서도 같은 메시지로 나오는가 | debug log 의 오류 메시지 | §2 의 판정 규칙 |
| R6 | 너비: 110열 · 144열에서 `bodyColumns` 와 영역별 너비 | `tmux` 창 크기를 바꿔 `e.props.bodyColumns` 를 로그로 남긴다 | 영역 개수 상한 |
| R9 | `cooperative` 의 `slot:*` 쪽(규약 mod 가 위에서 실행되는 순서) | 규약 mod 의 Button 눌림 로그 | 3.1 |
| R10 | 설정 파일을 고친 뒤 배치가 바뀌는 시점. `session.start` · `ui.render` · `$.clock` 중 어디서 `$.fs.stat` 을 확인할지, `CLAUDE_CONFIG_DIR` 을 mod 에서 어떻게 읽는지 | 파일을 고친 시각과 다시 그린 시각을 로그로 남긴다 | 3.4 |

### 4.1 결과

**R1: 통과(2026-11-06).** 시험 mod `verification/r1-order/` 를 `--plugin-dir` 로, `filetree` 0.8.1 을 설치본으로 함께 띄웠다. 화면은 170열 45행의 `tmux` 세션이다. `$.ui.log` 가 남긴 줄은 다음과 같다(`verification/logs/r1.log`).

```
r1: Pane requestId=filetree placement=dock tree=Box(part=filetree) trace=[1:usage-gauge/user/returned 2:uhd-kanban/user/returned 3:pending-questions/user/returned 4:filetree/user/returned]
r1: Pane requestId=pending-questions placement=dock tree=Box(part=pending-questions) trace=[1:usage-gauge/user/returned 2:uhd-kanban/user/returned 3:pending-questions/user/returned]
```

- 시험 mod 의 hook 이 `filetree` 의 pane(`requestId=filetree`) render 를 받았고, `next(e)` 가 `filetree` 의 트리(`part=filetree`)를 반환했다.
- `next.trace` 는 시험 mod 아래에 `usage-gauge` · `uhd-kanban` · `pending-questions` · `filetree` 가 이 순서로 있다고 적었다. 시험 mod 가 가장 바깥(index 0)이다.
- debug log 의 `hooks module pane-grid-r1@inline loaded` 와 `$ built for pane-grid-r1,usage-gauge,uhd-kanban,pending-questions,filetree,...` 줄도 같은 순서다. `--plugin-dir` 로 불러온 플러그인(`@inline`)이 설치본보다 앞에 있었다.
- 설치본 네 개의 순서는 `~/.claude/settings.json` 의 `enabledPlugins` 키 순서(`usage-gauge` → `uhd-kanban` → `pending-questions` → `filetree`)와 같고, `~/.claude/plugins/installed_plugins.json` 의 `installedAt` 순서와도 같다. 둘 중 어느 것이 순서를 정하는지는 이 실행 하나로 가를 수 없다(R1b).
- 한계: 시험 mod 가 아래에 있을 때 이 로그가 나오지 않는 것을 일부러 만들어 확인하지 않았다. R1b 에서 순서를 바꾼 실행이 그 확인을 겸한다.

**R1b: 가설대로 실패(2026-11-06).** 같은 시험 mod 를 로컬 마켓플레이스 `pane-grid`(이 저장소 루트의 `.claude-plugin/marketplace.json`)에 올리고 `claude plugin install pane-grid-r1@pane-grid` 로 user scope 에 설치했다. 설치 뒤 `enabledPlugins` 의 마지막 키가 `pane-grid-r1@pane-grid` 였다. `--plugin-dir` 없이 같은 `tmux` 화면에서 세션을 시작했다(`verification/logs/r1b.log`).

- `r1: loaded` 는 나왔고 `r1: Pane ...` 줄은 0개였다(`grep -c "r1: Pane"`). 시험 mod 의 `ui.render` hook 이 `filetree` · `pending-questions` 의 pane render 에서 호출되지 않았다.
- debug log 의 로드 순서는 `usage-gauge` → `uhd-kanban` → `pending-questions` → `filetree` → `pane-grid-r1` 이었다(`hooks module ... loaded` 줄과 `$ built for` 줄). 시험 mod 가 대상 mod 들보다 아래에 있었고, 대상 mod 의 hook 이 `next(e)` 를 부르지 않아 그 아래가 실행되지 않았다.
- 이 실행이 R1 의 실패 쪽 확인을 겸한다. 아래에 있으면 로그가 0줄이다.
- 끝난 뒤 `claude plugin uninstall pane-grid-r1@pane-grid` 와 `claude plugin marketplace remove pane-grid` 를 실행하고 `marketplace.json` 을 지웠다. `~/.claude/settings.json` 은 설치 전 사본과 `diff` 로 같았다.
- 남은 것: 순서를 정하는 것이 `enabledPlugins` 키 순서인지 `installedAt` 인지는 이번에도 가르지 못했다. 두 값이 같은 순서로 움직였다(R1c). 2026-11-07 에 키 순서만 바꿔 실행해 `enabledPlugins` 키 순서로 확인했다(`docs/grid-and-tabs.md` §4.1 7회차).

**R1c 중 `CLAUDE_CODE_PLUGIN_DIRS`: 통과(2026-11-06).** `--plugin-dir` 도 설치본도 없이, 세션 하나에만 `CLAUDE_CODE_PLUGIN_DIRS=<저장소>/verification/r1-order` 를 주고 시작했다(`verification/logs/r1c.log`).

- debug log 에 `hooks module pane-grid-r1@inline loaded (worker, environment 1, tier user)` 가 나왔고, `$ built for` 줄의 첫 플러그인이 `pane-grid-r1` 이었다.
- `r1: Pane` 줄이 R1 과 같은 두 줄로 나왔다. `filetree` · `pending-questions` 의 pane render 를 받았고 `next(e)` 가 각 mod 의 트리를 반환했다.
- 설정 파일은 바꾸지 않았다.

**R2 · R3: 시험 mod `verification/r2-hidden-tab/` (2026-11-06).** `CLAUDE_CODE_PLUGIN_DIRS` 로 불러왔다. 시험 mod 가 pane `r2` 를 focus 없이 열고, 2초마다 tick 을 올려 `$.ui.invalidate('ui.render')` 를 불렀다. tick 6 에 `r2` 를 `focus: true` 로 다시 열어 보이는 pane 으로 바꿨다. tick 3 과 tick 10 에 저장소 루트에 파일을 하나씩 만들었다(`filetree` 가 보여 주는 폴더). 모든 `Pane` render 를 debug log 에 남겼다(`verification/logs/r2.log`).

| 구간 | 보이는 pane | render 가 호출된 pane |
|---|---|---|
| 시작 직후(tick 0) | `filetree` | `r2` 1회 · `pending-questions` 1회 · `filetree` 7회 |
| tick 1 ~ 5 | `filetree` | tick 마다 `filetree` 1회. `r2` · `pending-questions` 0회 |
| tick 6 ~ 15 | `r2` | tick 마다 `r2` 1회. `filetree` · `pending-questions` 0회 |

- **R2: 탭 뒤의 pane 은 render 가 호출되지 않는다.** `invalidate` 를 불러도, 그 mod 가 보여 주는 폴더에 파일이 생겨도 같았다(tick 10 에 만든 파일 뒤에도 `filetree` render 0회). `pending-questions` 는 시작 직후 1회 뒤로 한 번도 그려지지 않았다.
- **R3: 이 mod 의 `invalidate` 가 다른 mod 의 보이는 pane 을 다시 그리게 한다.** tick 1 ~ 5 의 `filetree` render 는 매번 tick 의 `invalidate` 로부터 3 ~ 5 ms 뒤였다. 탭 뒤의 pane 은 R2 대로 그려지지 않았다.
- 3.2 에 미치는 영향: 보이지 않는 수정 불가 mod 의 영역은 **그 탭이 마지막으로 보였을 때의 내용에서 멈춘다.** 탭을 바꿔야 그 mod 의 내용이 새로 나온다. 3.1 의 규약 mod 는 `grid` pane 에 직접 그리므로 이 제약이 없다.
- 한계: 시작 직후 `r2` 와 `pending-questions` 가 1회씩 그려진 이유(pane 을 열 때 한 번 그리는 것인지)는 확인하지 않았다.

**결론.** 설치본 `pane-grid` 는 먼저 설치된 수정 불가 mod 보다 아래에 놓이므로 3.2 가 동작하지 않는다. `pane-grid` 를 대상 mod 보다 위에 두는 방법이 필요하다(§6).

## 5. 폴더

| 경로 | 내용 |
|---|---|
| `docs/direction.md` | 이 문서 |
| `docs/grid-and-tabs.md` | 그리드 분할 · 탭의 엔진 API 조사, tmux 실측과 대응, 규약 mod 세 개의 수정 범위, R11 ~ R21 |
| `docs/pane-lifecycle.md` | pane 의 구조 · 이벤트 순서 그림과 실패 지점 ✕1 ~ ✕5 의 근거 표 |
| `docs/images/build.py` | `docs/images/pane-structure.{svg,png}` · `docs/images/pane-lifecycle.{svg,png}` 를 만든다. `python3 docs/images/build.py` 로 다시 만든다 |
| `verification/harness-probe/snapshot/` | §2 의 트리 복사 시험 |
| `verification/harness-probe/press-proxy/` | §2 의 누름 전달 시험 |
| `verification/harness-probe/cooperative/` | §3.1 시험 |
| `verification/harness-probe/host-in-member/` | §3.2 시험. 3.2 는 뺐지만 근거로 남긴다(§6) |
| `verification/r1-order/` | R1 · R1b · R1c 시험 mod. 모든 `Pane` render 의 `next.trace` 를 `$.ui.log` 로 남긴다 |
| `verification/r2-hidden-tab/` | R2 · R3 시험 mod |
| `verification/r11-state/` | 독립 동작 · R11 · R13 일부 · R15 · R17 시험 mod 두 개(`host/` · `member/`) |
| `verification/r19-command/` | slash 명령 뒤 탭 바꾸기(R19) 시험 mod |
| `verification/r20-scroll/` | 칸마다 스크롤(R20) · 자기 pane 여닫기(R21) 시험 mod 두 개(`host/` · `member/`) |
| `verification/logs/` | 실제 세션 debug log 와 `tmux capture-pane` 출력. 판정 근거라 저장소에 올린다(2026-11-07 사용자 결정) |

`verification/harness-probe/` 의 `*.test.tsx` 는 `claude plugin test` 용 파일이다. `~/.claude/CLAUDE.md` §16 은 단위 시험 파일을 쓰지 않도록 정하므로, 이 파일들은 API 가능성을 가르기 위한 측정 기록으로만 두고 구현 확인은 §4 의 실제 세션 실행으로 한다.

## 6. 정한 것

1. `verification/harness-probe/` 는 ✕1 ~ ✕5 와 3.2 · 3.3 을 뺀 결정의 근거로 남긴다(2026-11-06 사용자 결정, `docs/grid-and-tabs.md` 결정 11).
