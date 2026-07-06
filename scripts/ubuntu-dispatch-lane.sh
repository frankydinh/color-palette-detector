#!/usr/bin/env bash
# Color Palette Detector collab — dispatch to a NAMED Ubuntu worktree lane
# (parallel-safe). Each lane gets its own worktree (~/color-palette-detector-<lane>)
# backed by the same bare repo, so multiple lanes run CONCURRENTLY without racing.
#
#   scripts/ubuntu-dispatch-lane.sh <lane> "<self-contained task prompt>" [branch]
#
# DETACHED (setsid) — survives ssh disconnect. Poll with:
#   scripts/ubuntu-status.sh <branch>
#
# Safety: worker runs --permission-mode acceptEdits (files only). This script runs
# install / lint / build / test. Nothing auto-merged; leader reviews each branch.
set -euo pipefail

LANE="${1:?Usage: ubuntu-dispatch-lane.sh <lane> \"<task>\" [branch]}"
TASK="${2:?Usage: ubuntu-dispatch-lane.sh <lane> \"<task>\" [branch]}"
BRANCH="${3:-task-$LANE-$(date +%Y%m%d-%H%M%S)}"
HOST="ubuntu-test"
MODEL="${MODEL:-sonnet}"
TASK_B64="$(printf '%s' "$TASK" | base64 | tr -d '\n')"

echo "▶ [$LANE] push main → ubuntu"
git push -q ubuntu main

echo "▶ [$LANE] stage detached runner (branch=$BRANCH, model=$MODEL)"
ssh -o BatchMode=yes "$HOST" "cat > ~/.cpd-run-$BRANCH.sh" <<REMOTE
#!/usr/bin/env bash
set -e
MAIN=\$HOME/color-palette-detector
WT=\$HOME/color-palette-detector-$LANE
cd "\$MAIN"
git fetch -q origin
if [ ! -d "\$WT" ]; then git worktree add -q --detach "\$WT" origin/main; fi
cd "\$WT"
git fetch -q origin
git checkout -q -B '$BRANCH' origin/main
TASK="\$(printf '%s' '$TASK_B64' | base64 -d)"
claude -p "\$TASK" --permission-mode acceptEdits --model '$MODEL'
echo '--- install ---'; npm install --no-audit --no-fund || true
echo '--- lint ---';    npm run -s lint || true
echo '--- build ---';   npm run -s build || true
echo '--- test ---';    npm run -s test --if-present || true
git add -A
if git diff --cached --quiet; then echo 'NO_CHANGES — nothing committed'; touch ~/.cpd-done-$BRANCH; exit 0; fi
git commit -q -m 'ubuntu worker [$LANE]: $BRANCH'
git push -q -u origin '$BRANCH'
echo 'PUSHED $BRANCH'
touch ~/.cpd-done-$BRANCH
REMOTE

echo "▶ [$LANE] launch (detached)"
ssh -o BatchMode=yes "$HOST" "
  chmod +x ~/.cpd-run-$BRANCH.sh
  rm -f ~/.cpd-done-$BRANCH
  setsid bash ~/.cpd-run-$BRANCH.sh > ~/.cpd-log-$BRANCH.log 2>&1 < /dev/null &
  echo \"LAUNCHED (log: ~/.cpd-log-$BRANCH.log)\"
"

echo "▶ [$LANE] dispatched. Poll:  scripts/ubuntu-status.sh $BRANCH"
