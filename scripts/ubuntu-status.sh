#!/usr/bin/env bash
# Poll a detached Ubuntu dispatch (see ubuntu-dispatch.sh).
#
#   scripts/ubuntu-status.sh <branch> [--tail N] [--fetch]
#
# Prints the tail of the remote log and whether the run is COMPLETE or RUNNING.
# With --fetch (and when COMPLETE), fetches the branch back to the Mac.
set -euo pipefail

BRANCH="${1:?Usage: ubuntu-status.sh <branch> [--tail N] [--fetch]}"
shift || true
HOST="ubuntu-test"
TAIL=25
FETCH=0
while [ $# -gt 0 ]; do
  case "$1" in
    --tail) TAIL="${2:-25}"; shift 2 ;;
    --fetch) FETCH=1; shift ;;
    *) shift ;;
  esac
done

STATUS="$(ssh -o BatchMode=yes "$HOST" "
  echo '===== log tail ($BRANCH) ====='
  tail -n $TAIL ~/.cpd-log-$BRANCH.log 2>/dev/null || echo '(no log yet)'
  echo '===== state ====='
  if [ -f ~/.cpd-done-$BRANCH ]; then echo COMPLETE; else echo RUNNING; fi
")"
echo "$STATUS"

if [ "$FETCH" = "1" ] && printf '%s' "$STATUS" | grep -q '^COMPLETE$'; then
  echo "▶ fetching ubuntu/$BRANCH → Mac"
  git fetch -q ubuntu
  echo "  git diff main..ubuntu/$BRANCH   &&   git merge ubuntu/$BRANCH"
fi
