# 엔진 하한 시험

`skills/add-pane-grid-cell/pane-grid.ts` 의 `readPlacement($, plugin)` · `readShownTab($)` 를 import 해 `$` 를 넘기는 hooks module 을 어느 Claude Code 버전부터 불러오는지 잰다. 그 결과가 `docs/add-pane-grid-cell.md` 「Engine floor」 절의 하한 2.1.299 다.

| 폴더 | hooks module 의 모양 |
|---|---|
| `read-placement/` | `import { readPlacement } from './pane-grid'` 후 `readPlacement($, PLUGIN)` |
| `read-shown-tab/` | `import { readShownTab } from './pane-grid'` 후 `readShownTab($)` |
| `own-file/` | 가이드의 두 번째 모양. 가이드의 코드 블록대로 같은 파일의 function declaration `readPlacement` · `readShownTab` 이 `$.state.get({ plugin: 'pane-grid', key: … } as never)` 로 읽고 `placementIn` 만 import 한다. hook 본문에서 바로 읽는 것과 같은 파일의 화살표 함수(`openPane`)를 거쳐 부르는 것도 함께 둔다 |

## 돌리는 법

```sh
sh verification/engine-floor/run.sh 2.1.289 2.1.296 2.1.299 2.1.322
```

`run.sh` 는 지금의 `skills/add-pane-grid-cell/pane-grid.ts` 를 세 폴더의 `hooks/pane-grid.ts` 로 복사한 뒤 버전마다 `npx -y @anthropic-ai/claude-code@<버전> plugin validate <폴더>` 를 돌린다. symlink 는 validate 가 `hooks/pane-grid.ts is not a regular file` 로 거부하므로 복사한다. 복사본은 `.gitignore` 에 있다. npx 가 postinstall 을 돌리지 않아 `claude native binary not installed` 로 끝나면 `run.sh` 가 그 버전의 npx 캐시 폴더에서 `install.cjs` 를 돌린다.

## 2026-11-10 결과

전체 출력은 `verification/logs/engine-floor.log` 에 있다. 2.1.297 · 2.1.298 은 npm 에 없다.

| 버전 | `read-placement` | `read-shown-tab` | `own-file` |
|---|---|---|---|
| 2.1.289 | Validation failed | Validation failed | passed |
| 2.1.296 | Validation failed | Validation failed | passed |
| 2.1.299 | passed | passed | passed |
| 2.1.322 | passed | passed | passed |

거부한 버전의 오류 줄(2.1.296, `read-placement`):

```text
compiled line 5 `const placement = await readPlacement($, PLUGIN);`: $ is passed to "readPlacement", imported from "./pane-grid": $ is followed only into a function declared in this same file, never across an import
```
