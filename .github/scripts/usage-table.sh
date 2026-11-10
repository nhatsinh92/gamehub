#!/usr/bin/env bash
# Prints $AI/usage.tsv (written by run-claude.sh) as a Markdown table.
set -u
f="$AI/usage.tsv"
[ -s "$f" ] || { echo "_No Claude usage recorded._"; exit 0; }
awk -F'\t' '
  BEGIN { print "| Step | Turns | Input | Cache write | Cache read | Output | Est. cost (USD) |"
          print "|---|---|---|---|---|---|---|" }
  { printf "| %s | %s | %s | %s | %s | %s | %s |\n", $1, $2, $3, $4, $5, $6, $7
    turns += $2; out += $6; cost += $7 }
  END { printf "| **Total** | %d |  |  |  | %d | %.2f |\n", turns, out, cost
        print ""
        print "_Cost is the API-price estimate Claude Code reports; on a Pro/Max subscription it is usage against the plan limit, not a bill._" }
' "$f"
