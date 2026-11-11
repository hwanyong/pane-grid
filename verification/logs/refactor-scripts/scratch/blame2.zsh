# 앞 blame.zsh 에서 빈 범위로 실패한 줄을 다시 찾는다.
W=/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k12
L(){ print "== $1 :: $2"; git -C $W log --oneline -s -L "$1:$2" main..HEAD }
L '/^const partStarts/,+1' hooks/tree.ts
L '/^export const allCells/,+1' hooks/tree.ts
L '/^export const VERBS/,+1' hooks/actions.ts
L '/SHARE_MAX}>            set/,+1' hooks/actions.ts
L '/^const activate/,+1' hooks/actions.ts
L '/^export const checkOutcome/,+1' hooks/actions.ts
L '/replaceTab(base, activate/,+1' hooks/actions.ts
L '/^const applyVerb/,+1' hooks/actions.ts
L '/^const MIN_PART/,+1' hooks/tree.ts
L '/^export const newCellId/,+2' hooks/tree.ts
