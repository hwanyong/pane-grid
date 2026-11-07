# pane 이벤트 순서와 실패 지점

이 문서는 Claude Code 2.1.318 의 mod 엔진에서 pane 하나가 열리고, 그려지고, 눌리는 순서를 그림 두 장으로 설명한다. 그리고 그 순서 중 어느 단계에서 `pane-grid` 의 목표가 거부되는지를 시험 결과와 함께 적는다. 측정 날짜는 2026-11-06 이고, 시험 절차와 전체 결과는 `docs/direction.md` §2 · §4.1 에 있다.

그림은 `docs/images/build.py` 가 SVG 를 만들고 Chrome headless 로 PNG(2배 해상도)를 만든다. 고칠 때는 `build.py` 의 글자를 고치고 `python3 docs/images/build.py` 를 다시 실행한다.

## 1. 구조

![구조 그림. 왼쪽 큰 상자는 Claude Code 엔진(호스트 프로세스)이고 다섯 칸으로 나뉜다. 첫째 칸 ① ui.render 연쇄: 그리기 요청 1개는 pane 1개(requestId)에 대응한다. envelope(surface, component, requestId, viewport)는 엔진이 정하고 hook 이 바꾸면 거부된다. 실행 순서는 @inline(--plugin-dir, CLAUDE_CODE_PLUGIN_DIRS), 설치본, builtin, core 순서다. 설치본끼리의 순서는 enabledPlugins 키 순서 또는 installedAt 이고 어느 쪽인지 정해지지 않았다. next 를 부르지 않고 답하면 그보다 index 가 큰 hook 은 실행되지 않는다. 둘째 칸 ② 반환 트리 검사: 상호작용 요소(Button, Input, Select)는 그 요청 안에서 직접 그린 것과 next(e) 로 받은 것만 허용되고, 어기면 hook 실패로 처리되어 엔진이 대신 그린다. 셋째 칸 ③ ui.press 처리: 트리의 Button 은 press: { plugin, handle } 만 갖고, core 가 handle 로 그 Button 을 그린 mod 의 worker 에서 onPress 를 실행한다. next() 에 다른 plugin 이나 element 를 넣으면 거부된다. 넷째 칸 ④ 그리기 요청 생성: 보이는 pane 1개에만 ui.render 요청을 만들고, 보이지 않는 pane(isShown false)에는 $.ui.invalidate 를 불러도 요청이 없다. 다섯째 칸(점선) terminal 표면: 보이는 pane 1개와 나머지 탭이 있고 분할 API 는 없다. 오른쪽에는 세로선 하나에서 worker 상자 다섯 개로 화살표가 나간다. index 0 pane-grid@inline(초록): ui.render hook 이 모든 Pane 요청을 받고, 자기 onPress 함수는 이 worker 안에만 있다. index 1 usage-gauge 와 index 2 uhd-kanban: next(e) 로 넘긴다. index 3 pending-questions: requestId 'pending-questions' 는 직접 답한다. index 4 filetree(수정 불가 mod): requestId 'filetree' 는 next 를 부르지 않고 직접 답하고, onPress 함수는 이 worker 안에만 있다. 아래 설명 네 줄: $ 호출과 이벤트는 worker 마다 MessagePort 1개로 오간다. 오가는 것은 순수 데이터뿐이고 함수는 넘어가지 않는다. worker 끼리는 직접 호출, import, 메모리 공유가 없다. 순서와 index 는 R1c 실행의 next.trace 와 debug log 에서 읽었다.](images/pane-structure.png)

그림의 사실 세 가지가 뒤의 실패를 모두 설명한다.

| 사실 | 근거 | 결과 |
|---|---|---|
| mod 마다 worker 가 따로 있고, 엔진과 worker 사이에는 순수 데이터만 오간다 | debug log 의 `hooks module <이름> loaded (worker, environment N, tier user)` 줄 | 트리 속 Button 은 함수가 아니라 `press: { plugin, handle }` 값이다. 그 handle 로 `onPress` 를 실행할 수 있는 것은 그 Button 을 그린 mod 의 worker 뿐이다 |
| 어느 pane 의 그리기 요청을 만들지는 엔진이 정한다 | §3 의 ✕1 · ✕5 | `pane-grid` 는 받은 요청을 넘기거나 답할 수만 있고, 다른 pane 의 요청을 새로 만들 수 없다 |
| 연쇄의 실행 순서는 불러오는 방법이 정한다 | R1 · R1b · R1c 의 `next.trace` | `pane-grid` 의 index 가 대상 mod 보다 작아야 그 mod 의 pane 요청을 받는다 |

## 2. 이벤트 순서

![순서 그림(sequence diagram). 세로선 다섯 개: 표면(terminal), 엔진, pane-grid(index 0), 중간 mod(index 1 ~ 3), filetree(index 4). 오른쪽에 실패 지점 설명 상자 다섯 개가 빨간 글자로 있다. 실선 화살표는 호출과 이벤트, 점선 화살표는 반환이다. ① filetree 가 엔진에 $.ui.open({ id: 'filetree' }) 를 보낸다. 그 아래 메모: ui.open 연쇄에서 index 가 작은 hook 이 제목 변경과 deny 를 할 수 있다. ② 엔진이 표면에 배치를 보낸다: dock, 보이는 pane 1개, 나머지 탭. ③ 엔진이 보이는 pane 에만 ui.render 요청을 만든다. 여기에 빨간 원 5: 보이지 않는 pane 에는 요청이 없다(R2). invalidate 를 부르거나 파일이 바뀌어도 render 는 0회였고, 보이지 않는 남의 mod 의 새 트리를 받을 수 없다. ④ 엔진이 pane-grid 에 ui.render { component: 'Pane', requestId: 'filetree' } 를 보낸다. 빨간 원 1: requestId 를 바꾼 next() 는 거부된다. next({ ...e, requestId: 'grid' }) 의 결과는 changed requestId (the envelope is the engine's) 오류다. ⑤ pane-grid 가 next(e) 로 중간 mod 에 넘기고, 중간 mod 도 next(e) 로 filetree 에 넘긴다. ⑥ filetree 는 next 를 부르지 않고 직접 답한다. 빨간 원 4: pane-grid 의 index 가 filetree 보다 크면 호출되지 않는다(R1b). 설치본을 나중에 설치하면 index 가 filetree 보다 커지고, 연쇄가 ⑥ 에서 끝나 pane-grid 의 로그가 0줄이다. ⑦ filetree 의 트리가 중간 mod 를 거쳐 pane-grid 로 반환된다. 반환된 트리의 Button 은 press { plugin: 'filetree', handle } 을 갖는다. ⑧ 초록 메모: 이 요청의 next(e) 결과는 그대로 쓸 수 있으므로 저장해 둔 다른 mod 트리와 나란히 그릴 수 있다. 빨간 원 2: 다른 요청에서 저장한 남의 Button 을 넣으면 hook 실패다. 오류는 returned a Button it did not draw (child-a#1); a render hook may keep the ones next(e) returned 이다. ⑨ pane-grid 가 엔진에 트리를 반환하고 엔진이 ② 반환 트리 검사를 한다. ⑩ 엔진이 표면에 그린다. ⑪ 사용자가 Button 을 누르면 표면이 엔진에 ui.press { plugin, element, requestId } 를 보낸다. ⑫ 엔진이 ui.press 연쇄로 pane-grid 를 부른다. 빨간 원 3: plugin 을 바꾼 next() 는 거부된다. 오류는 next() passed an argument with a plugin other than the one that drew the element 이다. ⑬ core 가 handle 로 filetree worker 의 onPress 를 실행한다. ⑭ pane-grid 가 $.ui.invalidate('ui.render') 를 부른다. ⑮ ③ 으로 돌아가 보이는 pane 만 다시 render 된다(R3). 보이지 않는 pane 은 다시 실패 지점 5 에 걸린다. 맨 아래 설명: 빨간 번호의 근거와 시험 폴더는 docs/pane-lifecycle.md 의 표에 있다.](images/pane-lifecycle.png)

| 단계 | 하는 쪽 | 일 |
|---|---|---|
| ① ~ ② | 대상 mod → 엔진 → 표면 | `$.ui.open` 으로 pane 을 연다. 엔진이 배치를 정하고 보이는 pane 1개 외에는 탭으로 둔다 |
| ③ ~ ④ | 엔진 | 보이는 pane 의 `ui.render` 요청을 만들어 index 0 부터 부른다 |
| ⑤ ~ ⑦ | 연쇄 | 각 hook 이 `next(e)` 로 넘기거나 직접 답한다. 직접 답한 hook 에서 연쇄가 끝나고 트리가 거꾸로 반환된다 |
| ⑧ ~ ⑩ | `pane-grid` → 엔진 → 표면 | `pane-grid` 가 트리를 고쳐 반환하고, 엔진이 검사한 뒤 그린다 |
| ⑪ ~ ⑬ | 표면 → 엔진 → 대상 mod | 누름이 `ui.press` 연쇄를 거쳐, core 가 그 Button 을 그린 mod 의 worker 에서 `onPress` 를 실행한다 |
| ⑭ ~ ⑮ | `pane-grid` → 엔진 | `invalidate` 가 ③ 부터 다시 시작하게 한다. 보이는 pane 만 다시 그려진다 |

## 3. 실패 지점

| 번호 | 단계 | `pane-grid` 가 한 일 | 엔진의 응답 | 근거 | 시험 폴더 · 로그 |
|---|---|---|---|---|---|
| ✕1 | ④ ~ ⑤ | 받은 요청의 `requestId` 를 다른 pane 의 것으로 바꿔 `next()` 에 넘겼다 | `next() passed an argument with a changed requestId (the envelope is the engine's; a rewrite keeps surface, component, requestId, viewport)` | test harness | 그날 scratchpad 에서 실행했고 저장하지 않았다 |
| ✕2 | ⑧ ~ ⑨ | 다른 render 에서 저장한 트리(Button 포함)를 `grid` pane 에 넣어 반환했다 | `returned a Button it did not draw (child-a#1); a render hook may keep the ones next(e) returned, not address another plugin's`. hook 실패로 처리되어 엔진이 대신 그렸다 | test harness | `verification/harness-probe/snapshot/` |
| ✕3 | ⑫ | `ui.press` 의 `next()` 에 다른 mod 의 `plugin` · `element` · `requestId` 를 넣었다 | `next() passed an argument with a plugin other than the one that drew the element` | test harness | `verification/harness-probe/press-proxy/` |
| ✕4 | ⑥ | 설치본으로 설치했다. `enabledPlugins` 의 마지막 키였다 | 오류 없음. `pane-grid` 의 `ui.render` hook 이 한 번도 호출되지 않았다(`r1: Pane` 줄 0개) | 실제 세션 R1b | `verification/r1-order/` · `verification/logs/r1b.log` |
| ✕5 | ③ | 2초마다 `$.ui.invalidate('ui.render')` 를 불렀고, 대상 mod 가 보여 주는 폴더에 파일을 만들었다 | 오류 없음. 보이지 않는 pane 의 render 0회 | 실제 세션 R2 | `verification/r2-hidden-tab/` · `verification/logs/r2.log` |

✕1 · ✕2 · ✕3 은 test harness 에서만 확인했다. 실제 세션에서 같은 메시지가 나오는지는 `docs/direction.md` §4 의 R5 에서 확인한다.

✕4 는 피할 수 있다. `CLAUDE_CODE_PLUGIN_DIRS` 로 불러오면 `pane-grid@inline` 이 index 0 에 놓였다(R1c). 나머지 네 가지는 불러오는 방법과 무관하다.

## 4. 왜 현재 목표가 불가능한가

`pane-grid` 의 목표는 pane 하나에 여러 mod 의 pane 을 함께 그리고, 그 각각이 ① 최신 내용을 보이고 ② 눌리게 하는 것이다. 대상 mod 의 종류와 표시 상태에 따라 결과가 갈린다.

| 대상 | ① 최신 내용 | ② 누름 | 막는 실패 지점 |
|---|---|---|---|
| 규약 mod(`docs/direction.md` §3.1 의 hook 을 넣은 mod) | 된다. 규약 mod 가 `grid` 요청을 직접 hook 해 자기 트리를 넣는다 | 된다. 그 요청 안에서 자기가 그린 Button 이다 | 없음(harness `cooperative` 통과. 실제 세션에서 `verification/r11-state/` 로 최신 내용과 누름을 확인했다: `docs/grid-and-tabs.md` §4 의 R11 · R13 일부 · R17) |
| 수정 불가 mod, 지금 보이는 pane | 된다. 그 요청의 `next(e)` 결과다 | 된다. 같은 요청에서 `next(e)` 가 반환한 Button 이다 | 없음(harness `host-in-member` 통과. 실제 세션 확인 R4 는 3.2 와 함께 뺐다) |
| 수정 불가 mod, 보이지 않는 pane | 안 된다. 마지막으로 받은 트리에서 바뀌지 않는다 | 안 된다 | ✕5 · ✕1 이 ①을, ✕2 · ✕3 이 ②를 막는다 |

마지막 줄이 불가능한 이유는 세 가지 구조가 각각 다른 방법을 막기 때문이다.

1. **그리기 요청을 엔진만 만든다(✕5 · ✕1).** 보이지 않는 pane 의 새 트리를 받으려면 그 pane 의 `ui.render` 요청이 있어야 한다. 엔진은 보이는 pane 에만 요청을 만들고(✕5), `pane-grid` 가 받은 요청의 `requestId` 를 바꿔 다른 pane 의 요청으로 쓰는 것은 거부된다(✕1). 그래서 보이지 않는 pane 의 트리는 마지막으로 보였을 때 받은 것뿐이다.
2. **상호작용 요소는 그 요청 안에서 받은 것만 쓸 수 있다(✕2).** 저장해 둔 트리에 Button 이 있으면 반환 트리 검사에서 hook 이 실패한다. 저장한 트리는 상호작용 요소를 `Text` 로 바꿔야 그릴 수 있고, 그 변환이 통과하는지는 측정하지 않았다(R8 은 3.2 와 함께 뺐다).
3. **`onPress` 는 그린 mod 의 worker 에만 있다(✕3).** Button 에는 `{ plugin, handle }` 값만 있고 함수는 worker 사이를 넘어가지 않는다. `pane-grid` 가 누름을 다른 mod 로 넘기는 것은 거부된다. 그래서 수정 불가 mod 의 Button 이 눌리는 것은 그 Button 을 같은 요청의 `next(e)` 로 받았을 때, 곧 그 mod 의 pane 이 보이는 동안뿐이다.

세 가지는 모두 엔진의 검사이거나 엔진의 요청 생성 규칙이다. `pane-grid` 쪽 코드로는 바꿀 수 없고, 대상 mod 를 고칠 수 있으면(규약 mod) 1번과 3번이 처음부터 문제가 되지 않는다.

## 5. 남은 확인

R4 · R8 은 수정 불가 mod 를 고치지 않고 쓰는 방식(`docs/direction.md` 3.2 · 3.3)에만 걸려 있었고, 2026-11-06 사용자 결정으로 그 방식을 빼면서 함께 뺐다. §4 의 수정 불가 mod 두 줄은 그 결정의 근거로 남긴다.

| 번호 | 확인할 것 | 이 문서와의 관계 |
|---|---|---|
| R5 | ✕1 · ✕2 · ✕3 이 실제 세션에서도 같은 메시지로 나오는가 | §3 의 test harness 근거 세 줄 |
| R9 | `cooperative` 의 `slot:*` 쪽을 실제 세션에서 | §4 의 「규약 mod」 줄 |
