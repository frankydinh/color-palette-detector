#!/usr/bin/env bash
# Color Palette Detector collab — dispatch a task to a NAMED Ubuntu worktree lane
# (parallel-safe). Unlike ubuntu-dispatch.sh (single shared clone — one task at a
# time), each lane gets its own git worktree on the Ubuntu box
# (~/color-palette-detector-<lane>) backed by the same bare repo, so multiple lanes
# can be dispatched CONCURRENTLY without racing on `git checkout`.
#
#   scripts/ubuntu-dispatch-lane.sh <lane> "<self-contained task prompt>" [branch]
#
# Safety: same as ubuntu-dispatch.sh — worker runs --permission-mode acceptEdits
# (files only, no arbitrary shell). This script runs npm install / lint / build.
# Nothing is auto-merged; every change returns on a branch for leader review.
set -euo pipefail

LANE="${1:?Usage: ubuntu-dispatch-lane.sh <lane> \"<task>\" [branch]}"
TASK="${2:?Usage: ubuntu-dispatch-lane.sh <lane> \"<task>\" [branch]}"
BRANCH="${3:-task-$LANE-$(date +%Y%m%d-%H%M%S)}"
HOST="ubuntu-test"
MODEL="${MODEL:-sonnet}"
WT_DIR="\$HOME/color-palette-detector-$LANE"

TASK_B64="$(printf '%s' "$TASK" | base64 | tr -d '\n')"

echo "▶ [$LANE][1/4] push main → ubuntu"
git push -q ubuntu main

echo "▶ [$LANE][2/4] run on Ubuntu worktree (branch=$BRANCH, model=$MODEL)"
ssh -o BatchMode=yes "$HOST" "
  set -e
  MAIN=\$HOME/color-palette-detector
  WT=$WT_DIR
  cd \"\$MAIN\"
  git fetch -q origin
  if [ ! -d \"\$WT\" ]; then
    git worktree add -q --detach \"\$WT\" origin/main
  fi
  cd \"\$WT\"
  git fetch -q origin
  git checkout -q -B '$BRANCH' origin/main
  TASK=\"\$(printf '%s' '$TASK_B64' | base64 -d)\"
  claude -p \"\$TASK\" --permission-mode acceptEdits --model '$MODEL'
  # install AFTER edits so any new devDeps (e.g. a test runner) are picked up
  npm install --no-audit --no-fund || true
  echo '--- lint ---';  npm run -s lint || true
  echo '--- build ---'; npm run -s build || true
  echo '--- test ---';  npm run -s test --if-present || true
  git add -A
  if git diff --cached --quiet; then echo 'NO_CHANGES — nothing committed'; exit 0; fi
  git commit -q -m 'ubuntu worker [$LANE]: $BRANCH'
  git push -q -u origin '$BRANCH'
  echo 'PUSHED $BRANCH'
"

echo "▶ [$LANE][3/4] fetch results → Mac"
git fetch -q ubuntu

echo "▶ [$LANE][4/4] done — review then merge as leader:"
echo "   git diff main..ubuntu/$BRANCH"
echo "   git merge ubuntu/$BRANCH   &&   git push origin main"
