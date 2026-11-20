#!/usr/bin/env bash
# Measures the size of the current task against its line budget.
#
# Usage:   bash scripts/diff-size.sh [base]        (default base: main)
#          DIFF_LIMIT=300 bash scripts/diff-size.sh
#
# Counts lines ADDED in source code since the branch left the base, including
# uncommitted and untracked files. Deleted lines, tests, docs, data files and
# lockfiles are reported but don't count toward the budget.
# Branches named mech/* (mechanical changes: renames, codemods, generated
# files) are reported but never fail.
set -euo pipefail

BASE="${1:-main}"
LIMIT="${DIFF_LIMIT:-300}"
# GitHub Actions checks out pull requests detached, so prefer its branch name
BRANCH="${GITHUB_HEAD_REF:-$(git rev-parse --abbrev-ref HEAD)}"
MERGE_BASE="$(git merge-base "$BASE" HEAD)"

classify() {
  case "$1" in
    package-lock.json|*/package-lock.json|*.lock) echo excluded ;;
    scripts/data/*|scripts/eval/*.json|db/migrations/*) echo excluded ;;
    __tests__/*|e2e/*|*.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx|*/test_*.py) echo tests ;;
    *.md) echo docs ;;
    *) echo source ;;
  esac
}

# Plain variables, so this runs on the Bash 3.2 that ships with macOS
ADD_source=0; ADD_tests=0; ADD_docs=0; ADD_excluded=0
DELETED=0
FILES=0

add_lines() {  # add_lines <kind> <count>
  case "$1" in
    source) ADD_source=$(( ADD_source + $2 )) ;;
    tests) ADD_tests=$(( ADD_tests + $2 )) ;;
    docs) ADD_docs=$(( ADD_docs + $2 )) ;;
    excluded) ADD_excluded=$(( ADD_excluded + $2 )) ;;
  esac
}

# Tracked changes: committed on this branch plus uncommitted edits
while IFS=$'\t' read -r add del path; do
  [ -z "${path:-}" ] && continue
  [ "$add" = "-" ] && continue   # binary file
  add_lines "$(classify "$path")" "$add"
  DELETED=$(( DELETED + del ))
  FILES=$(( FILES + 1 ))
done < <(git diff --numstat "$MERGE_BASE" --)

# New files not yet added to git
while IFS= read -r path; do
  [ -z "$path" ] && continue
  lines=$(wc -l < "$path" | tr -d ' ')
  add_lines "$(classify "$path")" "$lines"
  FILES=$(( FILES + 1 ))
done < <(git ls-files --others --exclude-standard)

echo "Task size on $BRANCH (vs $BASE)"
echo "  source lines added:  $ADD_source / $LIMIT"
echo "  test lines added:    $ADD_tests (not counted)"
echo "  doc lines added:     $ADD_docs (not counted)"
echo "  data/lock added:     $ADD_excluded (not counted)"
echo "  lines deleted:       $DELETED (not counted)"
echo "  files touched:       $FILES"

if [ "$ADD_source" -gt "$LIMIT" ]; then
  if [[ "$BRANCH" == mech/* ]]; then
    echo "Over budget, but allowed: mechanical branch."
    exit 0
  fi
  echo "OVER BUDGET by $(( ADD_source - LIMIT )) lines. Split the task before committing."
  exit 1
fi
echo "Within budget."
