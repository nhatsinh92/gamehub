#!/usr/bin/env bash
# Queues one spike issue per game idea, then starts the first one.
#   .github/scripts/spike-batch.sh ideas.txt
# One idea per line (blank lines and lines starting with # are skipped); the
# line is the issue title and body. issue-to-spike runs them one at a time.
set -eu
[ -f "${1:-}" ] || { echo "usage: $0 <ideas.txt>" >&2; exit 2; }
gh label create ai-spike --color 5319e7 --description "AI builds a playable spike" --force >/dev/null
gh label create ai-spike-queue --color d4c5f9 --description "Waiting for an ai-spike run" --force >/dev/null
while IFS= read -r idea || [ -n "$idea" ]; do
  case "$idea" in ''|'#'*) continue ;; esac
  gh issue create --title "spike: $idea" --body "$idea" --label ai-spike-queue
done < "$1"
# shortcut: a run already in progress starts the next one itself; only kick when idle.
busy=$(gh run list --workflow issue-to-spike.yml --json status --jq '[.[] | select(.status != "completed")] | length')
if [ "$busy" = 0 ]; then
  next=$(gh issue list --label ai-spike-queue --state open --json number --jq 'sort_by(.number) | .[0].number // empty')
  [ -z "$next" ] || gh issue edit "$next" --remove-label ai-spike-queue --add-label ai-spike
fi
