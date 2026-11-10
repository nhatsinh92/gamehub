#!/usr/bin/env bash
# Prints $AI/usage.tsv (written by run-claude.sh) as a Markdown table.
# "Tokens" = input + cache write + cache read + output: everything the model
# processed. Output alone is a small part; cache reads are most of the volume
# but are billed at a fraction of the input price, so cost follows a different shape.
set -u
f="$AI/usage.tsv"
[ -s "$f" ] || { echo "_No Claude usage recorded._"; exit 0; }
awk -F'\t' '
  BEGIN { print "| Step | Turns | Input | Cache write | Cache read | Output | Tokens | Est. cost (USD) | Cost share |"
          print "|---|---|---|---|---|---|---|---|---|" }
  { n++; step[n] = $1; tu[n] = $2; in_[n] = $3; cw[n] = $4; cr[n] = $5; out[n] = $6; c[n] = $7
    tok[n] = $3 + $4 + $5 + $6
    T_tu += $2; T_in += $3; T_cw += $4; T_cr += $5; T_out += $6; T_tok += tok[n]; T_c += $7 }
  END {
    for (i = 1; i <= n; i++)
      printf "| %s | %s | %s | %s | %s | %s | %d | %.2f | %.0f%% |\n", step[i], tu[i], in_[i], cw[i], cr[i], out[i], tok[i], c[i], (T_c > 0 ? 100 * c[i] / T_c : 0)
    printf "| **Total** | %d | %d | %d | %d | %d | **%d** | **%.2f** | 100%% |\n", T_tu, T_in, T_cw, T_cr, T_out, T_tok, T_c
    print ""
    print "_Cost is the API-price estimate Claude Code reports; on a Pro/Max subscription it is usage against the plan limit, not a bill._" }
' "$f"
