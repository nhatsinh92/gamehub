#!/usr/bin/env bash
# Runs `claude` with JSON output so every call reports its usage.
#   run-claude.sh <label> <reply-file> <append|write> <claude args...>
# Prints Claude's reply, writes it to <reply-file>, and appends one row to
# $AI/usage.tsv: label, turns, input, cache write, cache read, output tokens,
# estimated cost (USD), result subtype. Exits with claude's exit code.
set -u
label=$1 out=$2 mode=$3
shift 3
json="$AI/$label.json"
rc=0
claude "$@" --output-format json > "$json" || rc=$?
node - "$json" "$out" "$mode" "$label" "$AI/usage.tsv" <<'NODE'
const fs = require("fs");
const [json, out, mode, label, usage] = process.argv.slice(2);
const raw = fs.existsSync(json) ? fs.readFileSync(json, "utf8") : "";
let r = {};
try { r = JSON.parse(raw); } catch { /* not JSON: keep raw text as the reply */ }
const text = (typeof r.result === "string" ? r.result : raw).trimEnd() + "\n";
if (mode === "append") fs.appendFileSync(out, text); else fs.writeFileSync(out, text);
process.stdout.write(text);
const u = r.usage ?? {};
const row = [label, r.num_turns, u.input_tokens, u.cache_creation_input_tokens,
  u.cache_read_input_tokens, u.output_tokens, r.total_cost_usd, r.subtype]
  .map((v) => (v ?? "?")).join("\t");
fs.appendFileSync(usage, row + "\n");
NODE
exit "$rc"
