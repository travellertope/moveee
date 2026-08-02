#!/usr/bin/env bash
#
# check-brand-language.sh
#
# Greps the repo for phrases that re-center the brand on Africa/Black
# diaspora ("African and diaspora culture...") or reach for a geographic
# qualifier ("culture worldwide", "global culture") where the house style is
# just "culture" — see CLAUDE.md's "Brand language — no default geography or
# audience" section for the full rule and rationale.
#
# This is a REVIEW tool, not a hard CI gate: it prints every hit with
# file:line for a human (or an agent) to judge, because a handful of these
# phrases are legitimate in narrow contexts (a specific historical/biographical
# fact, an edition page that is deliberately region-scoped, a WordPress
# taxonomy value that can't be renamed without a data migration). Don't wire
# this into a build that fails on any hit; wire it into a step that posts
# the findings for review (PR comment, pre-commit warning, etc.).
#
# Usage: bash scripts/check-brand-language.sh [path]
#   path defaults to the repo root.

set -uo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT" || exit 1

INCLUDE_GLOBS=(--include="*.ts" --include="*.tsx" --include="*.php" --include="*.html" --include="*.md")

# Known-legitimate hits, excluded so the output stays signal, not noise.
# Each entry is ONE grep -E pattern matched against "path:line:content" —
# keep entries narrow (tied to a specific file/line shape) with a comment
# explaining why, same discipline as the rest of this file. A broad entry
# here is exactly how this kind of language creeps back in unnoticed.
ALLOWLIST=(
  # ── Layer 1: seeded/generated-content instructions — these SHOULD favour
  #    African, Caribbean, and Black diaspora subjects (see CLAUDE.md's
  #    "Brand language" section, point 1). Never neutralize these back to
  #    "draw evenly from everywhere" — that was a real over-correction,
  #    caught and reverted in August 2026. Allowlisted by file, since these
  #    files are entirely AI-prompt/seed-data content with nothing else in
  #    them that this script needs to catch.
  'packages/shared/lib/gemini\.ts:'
  'packages/shared/lib/pulse-gemini\.ts:'
  'packages/shared/lib/crossword-gemini\.ts:'
  'packages/shared/lib/pulse-rss\.ts:'
  'packages/shared/lib/pulse-wordpress\.ts:'
  'packages/shared/lib/quotes-seeder\.ts:'
  'packages/shared/lib/events-seeder\.ts:'
  'class-culture-pulse\.php:'
  'class-culture-directory-tools\.php:.*(Diaspora aesthetics|favouring African)'
  'auto-populate/route\.ts:.*(Diaspora aesthetics|Other African & Diaspora)'
  'auto-populate/data\.ts:.*Cultural Identity and Diaspora'   # a real quote's attributed source title

  # trivia/crossword daily routes mix real page metadata (must stay neutral,
  # NOT allowlisted) with the prompt-building functions and the pre-built
  # topic pool / puzzle bank (SHOULD favour, per layer 1 above) — allowlist
  # only those specific shapes, not the whole file.
  'trivia/daily/route\.ts:.*celebrating culture with a strong focus on African'  # buildDailyPrompt()
  'trivia/daily/route\.ts:.*favours African, Caribbean, and Black diaspora topics'  # TOPIC_POOL section comment
  'trivia/daily/route\.ts:.*explanation:'      # factual answer explanations, not brand framing
  'trivia/daily/route\.ts:.*question:'         # factual trivia questions, not brand framing
  'trivia/daily/route\.ts:159:.*// Diaspora, Identity'
  'trivia/daily/route\.ts:.*"[A-Z][a-z]+ .*(diaspora|diasporic|worldwide)[^"]*",?$'  # single topic-pool entries
  'crossword/daily/route\.ts:.*clue:'                  # factual crossword clues, not brand framing
  'crossword/daily/route\.ts:.*Pre-built puzzle bank'  # describes existing content, matches layer-1 favouring

  # Africa edition pages, deliberately symmetric with the UK edition's
  # "rooted in Britain" / US edition's "American lens" copy — not a default.
  'EditionNewsletterHub\.tsx:.*diasporic lens'
  'magazine/africa/page\.tsx:.*diasporic lens'

  # Standard IP-license legal boilerplate — unrelated to brand scope.
  'terms/page\.tsx:.*worldwide licen[cs]e'
)

EXCLUDE_RE=""
for pat in "${ALLOWLIST[@]}"; do
  if [[ -z "$EXCLUDE_RE" ]]; then EXCLUDE_RE="$pat"; else EXCLUDE_RE="${EXCLUDE_RE}|${pat}"; fi
done

echo "── Scanning for brand-framing language (see CLAUDE.md) ──────────────────"
echo

FOUND=0

check_pattern() {
  local label="$1"
  local pattern="$2"
  local hits
  hits=$(grep -rniE "${INCLUDE_GLOBS[@]}" -- "$pattern" apps culture-community packages 2>/dev/null \
    | grep -v node_modules \
    | grep -vE "$EXCLUDE_RE" \
    || true)
  if [[ -n "$hits" ]]; then
    echo "▸ $label"
    echo "$hits" | sed 's/^/    /'
    echo
    FOUND=$((FOUND + 1))
  fi
}

check_pattern "\"diaspora\" (default-audience framing)" "diaspora"
check_pattern "\"diasporic\" (default-audience framing)" "diasporic"
check_pattern "\"culture worldwide\" / \"worldwide culture\"" "culture worldwide|worldwide culture"
check_pattern "\"global culture\"" "global culture"
check_pattern "\"around the world\" (geography qualifier)" "around the world"
check_pattern "bare \"worldwide\" qualifier" "\bworldwide\b"
check_pattern "\"African and Black\" / \"Black and African\"" "African and Black|Black and African"
check_pattern "\"African and diaspora\" / \"Black and diaspora\"" "African and diaspora|Black and diaspora"

echo "───────────────────────────────────────────────────────────────────────"
if [[ "$FOUND" -eq 0 ]]; then
  echo "No hits outside the allowlist. Clean."
  exit 0
else
  echo "Found $FOUND pattern(s) with hits — review each above."
  echo "Real bug → fix the copy (see CLAUDE.md for the house phrasing)."
  echo "Legitimate exception → add a narrow, commented entry to ALLOWLIST"
  echo "in this script AND explain it in CLAUDE.md, same as the existing entries."
  exit 1
fi
