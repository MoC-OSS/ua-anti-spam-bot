#!/usr/bin/env sh
set -eu

LINK_PATH=".agents/skills"
TARGET="../.claude/skills"

mkdir -p .agents

if [ -L "$LINK_PATH" ]; then
  CURRENT_TARGET="$(readlink "$LINK_PATH")"

  if [ "$CURRENT_TARGET" = "$TARGET" ]; then
    echo "Codex skills symlink already correct"
    exit 0
  fi

  rm "$LINK_PATH"
  ln -s "$TARGET" "$LINK_PATH"
  echo "Codex skills symlink recreated"
  exit 0
fi

if [ -e "$LINK_PATH" ]; then
  echo "Error: $LINK_PATH exists and is not a symlink" >&2
  exit 1
fi

ln -s "$TARGET" "$LINK_PATH"
echo "Codex skills symlink created"
