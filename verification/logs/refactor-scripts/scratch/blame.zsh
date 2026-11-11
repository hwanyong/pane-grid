# hunk 마다 그 줄을 바꾼 k11 커밋을 git log -L 로 찾는다(읽기만 한다).
W=/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k12
L(){ print "== $1 :: $2"; git -C $W log --oneline -s -L "$1:$2" main..HEAD }
L '/^export const normalize/,+8' hooks/tree.ts
L '/^const shrinkBy/,+10' hooks/tree.ts
L '/^const withRest/,+3' hooks/tree.ts
L '/^export const SHARE_MIN/,+1' hooks/tree.ts
L '/^export const mapCells/,+1' hooks/tree.ts
L '/^export const heirOf/,+4' hooks/tree.ts
L '/^const LAYOUTS/,+6' hooks/tree.ts
L '/^export const preset/,+4' hooks/tree.ts
L '/^export const moveDivider/,+8' hooks/tree.ts
L '/^const partStarts/,+0' hooks/tree.ts
L '/^export const allCells/,+0' hooks/tree.ts
L '/^export const swap/,+5' hooks/tree.ts
L '/^import/,+3' hooks/actions.ts
L '/^export const VERBS/,+0' hooks/actions.ts
L '/resize <\$/,+0' hooks/actions.ts
L '/^const activate/,+0' hooks/actions.ts
L '/verb == .next/,+4' hooks/actions.ts
L '/const root = mapCells(own.root/,+1' hooks/actions.ts
L '/if (verb == .resize/,+3' hooks/actions.ts
L '/if (verb == .kill/,+4' hooks/actions.ts
L '/if (verb == .break/,+4' hooks/actions.ts
L '/^export const apply/,+3' hooks/actions.ts
L '/^export const checkOutcome/,+0' hooks/actions.ts
