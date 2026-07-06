#!/usr/bin/env bash
# Color Palette Detector collab — dispatch a task to the Ubuntu worker
# (Claude Code over Tailscale). Leader = this Mac.
#
#   scripts/ubuntu-dispatch.sh "<self-contained task prompt>" [branch]
#
# DETACHED model: the remote runner is launched with `setsid` so it survives an
# ssh disconnect / a killed dispatch (long claude -p runs won't be orphaned — the
# commit + push tail always runs). Poll progress with:
#   scripts/ubuntu-status.sh <branch>
#
# Safety: the worker runs --permission-mode acceptEdits (files only, no arbitrary
# shell). THIS SCRIPT runs the checks (install / lint / build / test). Nothing is
# auto-merged: every change returns on a branch for the leader to review:
#   git diff main..ubuntu/<branch>   &&   git merge ubuntu/<branch>
set -euo pipefail

TASK="${1:?Usage: ubuntu-dispatch.sh \"<task>\" [branch]}"
BRANCH="${2:-task-$(date +%Y%m%d-%H%M%S)}"
HOST="ubuntu-test"
MODEL="${MODEL:-sonnet}"
WORKDIR="\$HOME/color-palette-detector"
TASK_B64="$(printf '%s' "$TASK" | base64 | tr -d '\n')"

echo "▶ push main → ubuntu"
git push -q ubuntu main

echo "▶ stage detached runner on Ubuntu (branch=$BRANCH, model=$MODEL)"
# Write the runner file on the remote (heredoc, no premature expansion of $).
ssh -o BatchMode=yes "$HOST" "cat > ~/.cpd-run-$BRANCH.sh" <<REMOTE
#!/usr/bin/env bash
set -e
cd $WORKDIR
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
git commit -q -m 'ubuntu worker: $BRANCH'
git push -q -u origin '$BRANCH'
echo 'PUSHED $BRANCH'
touch ~/.cpd-done-$BRANCH
REMOTE

echo "▶ launch (detached, survives disconnect)"
ssh -o BatchMode=yes "$HOST" "
  chmod +x ~/.cpd-run-$BRANCH.sh
  rm -f ~/.cpd-done-$BRANCH
  setsid bash ~/.cpd-run-$BRANCH.sh > ~/.cpd-log-$BRANCH.log 2>&1 < /dev/null &
  echo \"LAUNCHED (log: ~/.cpd-log-$BRANCH.log)\"
"

echo "▶ dispatched. Poll with:  scripts/ubuntu-status.sh $BRANCH"
echo "  when COMPLETE:  git fetch ubuntu && git diff main..ubuntu/$BRANCH && git merge ubuntu/$BRANCH"
