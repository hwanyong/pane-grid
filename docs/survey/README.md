# Survey of Claude Code mods that draw a pane

`pane-mods-2026-11-09.tsv` lists the 218 mods that draw a `Pane` and whose repository has 20 or more GitHub stars, sorted by `repo_stars` from high to low. These are the candidates for grid-ready forks.

## Source

`data/mods.json` of [karanb192/awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods), generated 2026-11-09T12:19:42Z by a scan that ran Claude Code 2.1.319. The scan clones each repository and runs `claude plugin validate`; it runs no mod code. How the scan finds mods and grades them is in that repository's [SCANNING.md](https://github.com/karanb192/awesome-claude-code-mods/blob/main/SCANNING.md).

## Columns

| Column | Meaning |
|---|---|
| `repo_stars` | GitHub stars of the repository at scan time |
| `kind` | `mod`, or `builtin` for a mod that ships with Claude Code (`anthropics/claude-code`) |
| `repo` | GitHub `owner/name` of the repository |
| `mod` | Plugin name of the mod |
| `draws` | Components the mod renders, comma-separated (`Pane`, `PromptHint`, ...) |
| `pane_request_ids` | `requestId` values of the mod's `ui.render` hooks on `Pane`. `[None]` means the hook's matcher has no `requestId`; `'?'` is copied as the scan recorded it in `hooks[].matcher.requestId` |
| `reach_level` | The scan's reach level, 0 to 3: 0 draws and remembers, 1 reads, 2 writes files, runs processes or drives Claude, 3 reaches the network. `None` means the scan could not grade it |
| `validate` | Result of `claude plugin validate`: `passed`, `warnings` or `failed` |
| `pushed_at` | Date of the repository's last push |
| `description` | The mod's description, cut to 150 characters |

## Limits

- `repo_stars` counts the repository, not the mod. A repository that holds several mods (for example `hamzafer/claude-code-mods`) gives every one of them the same number, so the star count does not say which mod people use.
- The list is what the scan found on 2026-11-09. A mod added or changed after that, or one the scan did not find, is not in it.
