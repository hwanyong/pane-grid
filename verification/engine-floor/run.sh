#!/bin/sh
# Runs `claude plugin validate` on the three engine floor probes with each Claude Code version given.
# Usage: sh verification/engine-floor/run.sh 2.1.289 2.1.296 2.1.299 2.1.322
# Each probe gets a fresh copy of skills/add-pane-grid-cell/pane-grid.ts first, because validate refuses a symlink
# ("hooks/pane-grid.ts is not a regular file"). The copies are in .gitignore.
set -u
here=$(cd "$(dirname "$0")" && pwd)
module="$here/../../skills/add-pane-grid-cell/pane-grid.ts"
for probe in read-placement read-shown-tab own-file; do
  cp "$module" "$here/$probe/hooks/pane-grid.ts"
done

# npx does not always run the package's postinstall, and then every command exits with
# "claude native binary not installed". This runs it in the npx cache folder of that version.
prepare() {
  npx -y "@anthropic-ai/claude-code@$1" --version >/dev/null 2>&1 && return
  for package in "$HOME"/.npm/_npx/*/node_modules/@anthropic-ai/claude-code/package.json; do
    [ "$(node -p "require('$package').version")" = "$1" ] || continue
    (cd "$(dirname "$package")/../../.." && node node_modules/@anthropic-ai/claude-code/install.cjs >/dev/null)
  done
}

for version in "$@"; do
  prepare "$version"
  echo "== $(npx -y "@anthropic-ai/claude-code@$version" --version 2>&1)"
  for probe in read-placement read-shown-tab own-file; do
    echo "-- $probe"
    npx -y "@anthropic-ai/claude-code@$version" plugin validate "$here/$probe" 2>&1 \
      | grep -E 'passed to|not a regular|state reads|hooks:|Validation passed|Validation failed|✘|✔'
  done
done
