#!/usr/bin/env bash
# Color Palette Detector collab — dispatch a task to the Ubuntu worker
# (Claude Code over Tailscale). Leader = this Mac. One-way: Mac pushes work,
# Ubuntu executes on a branch, Mac fetches.
#
#   scripts/ubuntu-dispatch.sh "<self-contained task prompt>" [branch]
#
# Safety: the worker runs with --permission-mode acceptEdits — it may create/edit
# FILES only, never run arbitrary shell commands. THIS SCRIPT runs the checks
# (npm install / lint / build). Nothing is auto-merged: every change returns on a
# branch for the leader to review:
#   git diff main..ubuntu/<branch>   &&   git merge ubuntu/<branch>
set -euo pipefail

TASK="${1:?Usage: ubuntu-dispatch.sh \"<task>\" [branch]}"
BRANCH="${2:-task-$(date +%Y%m%d-%H%M%S)}"
HOST="ubuntu-test"
MODEL="${MODEL:-sonnet}"

# base64 keeps the prompt intact across the ssh shell boundary (no quoting surprises)
TASK_B64="$(printf '%s' "$TASK" | base64 | tr -d '\n')"

echo "▶ [1/4] push main → ubuntu"
git push -q ubuntu main

echo "▶ [2/4] run on Ubuntu  (branch=$BRANCH, edits-only, model=$MODEL)"
ssh -o BatchMode=yes "$HOST" "
  set -e
  cd \"\$HOME/color-palette-detector\"
  git fetch -q origin
  git checkout -q -B '$BRANCH' origin/main
  npm install --prefer-offline --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund
  TASK=\"\$(printf '%s' '$TASK_B64' | base64 -d)\"
  claude -p \"\$TASK\" --permission-mode acceptEdits --model '$MODEL'
  echo '--- lint ---';  npm run -s lint  || true
  echo '--- build ---'; npm run -s build || true
  git add -A
  if git diff --cached --quiet; then echo 'NO_CHANGES — nothing committed'; exit 0; fi
  git commit -q -m 'ubuntu worker: $BRANCH'
  git push -q -u origin '$BRANCH'
  echo 'PUSHED $BRANCH'
"

echo "▶ [3/4] fetch results → Mac"
git fetch -q ubuntu

echo "▶ [4/4] done — review then merge as leader:"
echo "   git diff main..ubuntu/$BRANCH"
echo "   git merge ubuntu/$BRANCH   &&   git push origin main"
