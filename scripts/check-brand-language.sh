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
  # pulse_region is a real, already-seeded WordPress taxonomy (Africa /
  # Caribbean / Diaspora UK / Diaspora US / Diaspora Europe / Global) —
  # renaming the *values* needs a data migration, not a code edit, so these
  # files intentionally still say "Diaspora UK" etc. Only the *messaging*
  # wrapped around them (prompts, page copy) was in scope for this pass.
  'class-culture-pulse\.php:.*pulse_region taxonomy'
  'pulse-wordpress\.ts:.*"Diaspora (UK|US|Europe)"'
  'pulse-gemini\.ts:.*(Diaspora (UK|US|Europe)|region:.*Africa)'
  'pulse-rss\.ts:6:.*skews heavily'                # deliberate self-flag, see CLAUDE.md follow-up note
  'pulse-rss\.ts:.*Diaspora (UK|US)'                # RSS feed-source section comments, same taxonomy tie-in
  'pulse-rss\.ts:.*UK & US diaspora'

  # Seed-topic lists: one specific item among many, or a section-header
  # comment for the list — not brand-messaging prose. (The list's overall
  # regional balance is a separate, larger follow-up — see CLAUDE.md.)
  'quotes-seeder\.ts:.*// Literature — Diaspora'
  'directory-tools\.php:.*Diaspora aesthetics'
  'auto-populate/route\.ts:.*Diaspora aesthetics'
  'auto-populate/route\.ts:.*Other African & Diaspora'
  'auto-populate/data\.ts:.*Cultural Identity and Diaspora'   # a real quote's attributed source title

  # Africa edition pages, deliberately symmetric with the UK edition's
  # "rooted in Britain" / US edition's "American lens" copy — not a default.
  'EditionNewsletterHub\.tsx:.*diasporic lens'
  'magazine/africa/page\.tsx:.*diasporic lens'

  # Trivia/crossword content: factual questions, answers, explanations, and
  # clues about specific real people/places/works — not brand framing.
  # (The topic *pool*'s overall regional balance is a separate, larger
  # follow-up — see CLAUDE.md.)
  'trivia/daily/route\.ts:.*explanation:'
  'trivia/daily/route\.ts:.*question:'
  'trivia/daily/route\.ts:159:.*// Diaspora, Identity'
  'trivia/daily/route\.ts:.*"[A-Z][a-z]+ .*(diaspora|diasporic|worldwide)[^"]*",?$'  # single topic-pool entries
  'crossword/daily/route\.ts:.*clue:'
  'crossword/daily/route\.ts:.*Pre-built puzzle bank'          # describes existing (already-flagged) content, not new copy

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
