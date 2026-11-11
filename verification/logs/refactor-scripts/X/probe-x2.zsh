GROUP=X; TREE=${1:-base}; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup
reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"column","children":[{"node":{"kind":"cell","id":"c1"},"size":98},{"node":{"kind":"cell","id":"c2"},"size":1},{"node":{"kind":"cell","id":"c3"},"size":1}]},"active":"c1"}]}'
S=t; up t $PROJ $REPO
cap > $J/scripts/X/probe-x2.cap
T kill-server
