#!/bin/sh
# Installs Vairal's git hooks into .git/hooks/.
# Idempotent — safe to run on every `npm install` via package.json `prepare`.

set -eu

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -z "$REPO_ROOT" ]; then
  # Not a git repo (e.g. running inside a tarball) — silently skip
  exit 0
fi

HOOK_DIR="$REPO_ROOT/.git/hooks"
SOURCE_DIR="$REPO_ROOT/scripts/hooks"

# pre-commit (the only one we own; Entire installs commit-msg / post-commit / post-rewrite / pre-push)
if [ -f "$SOURCE_DIR/pre-commit" ]; then
  cp "$SOURCE_DIR/pre-commit" "$HOOK_DIR/pre-commit"
  chmod +x "$HOOK_DIR/pre-commit"
  echo "  ✓ Vairal pre-commit secret scanner installed"
fi
