#!/usr/bin/env bash
# Decides what a CI job runs (ADR 0063). Each job runs this itself, so no job waits on another.
# full=true: aimed at main (the staging -> main PR, or a push to main): full suites and coverage.
# code=false: a docs-only PR (markdown, wiki/, .claude/): format, lint and wiki check only.
set -euo pipefail

if [ "$BASE_REF" = "main" ] || [ "$REF" = "refs/heads/main" ]; then
  echo "full=true" >> "$GITHUB_OUTPUT"
else
  echo "full=false" >> "$GITHUB_OUTPUT"
fi

if [ "$EVENT_NAME" != "pull_request" ]; then
  echo "code=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

files=$(git diff --name-only "origin/$BASE_REF...HEAD")
echo "Changed files:"
echo "$files"
if echo "$files" | grep -qvE '(\.md$|^wiki/|^\.claude/)'; then
  echo "code=true" >> "$GITHUB_OUTPUT"
else
  echo "code=false" >> "$GITHUB_OUTPUT"
  echo "Docs-only change: running format, lint and wiki check only."
fi
