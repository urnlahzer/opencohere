#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "This script will stop OpenCohere, remove the installed app, and delete caches, databases, and preferences."
read -r -p "Continue with the full uninstall? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

remove_target() {
  local target="$1"
  if [[ -e "$target" ]]; then
    echo "Removing $target"
    rm -rf "$target" 2>/dev/null || sudo rm -rf "$target"
  fi
}

echo "Stopping running OpenCohere/Electron processes..."
pkill -f "OpenCohere" 2>/dev/null || true
pkill -f "open-cohere" 2>/dev/null || true
pkill -f "Electron Helper.*OpenCohere" 2>/dev/null || true

echo "Removing /Applications/OpenCohere.app (requires admin)..."
remove_target "/Applications/OpenCohere.app"

echo "Purging Application Support data..."
remove_target "$HOME/Library/Application Support/OpenCohere"
remove_target "$HOME/Library/Application Support/open-cohere"
remove_target "$HOME/Library/Application Support/OpenCohere-dev"
remove_target "$HOME/Library/Application Support/com.opencohere"
remove_target "$HOME/Library/Application Support/com.opencohere.OpenCohere"

echo "Removing caches, logs, and saved state..."
remove_target "$HOME/Library/Caches/open-cohere"
remove_target "$HOME/Library/Caches/com.opencohere.OpenCohere"
remove_target "$HOME/Library/Preferences/com.opencohere.OpenCohere.plist"
remove_target "$HOME/Library/Preferences/com.opencohere.helper.plist"
remove_target "$HOME/Library/Logs/OpenCohere"
remove_target "$HOME/Library/Saved Application State/com.opencohere.OpenCohere.savedState"

echo "Cleaning temporary files..."
shopt -s nullglob
for tmp in /tmp/opencohere*; do
  remove_target "$tmp"
done
for crash in "$HOME/Library/Application Support/CrashReporter"/OpenCohere_*; do
  remove_target "$crash"
done
shopt -u nullglob

read -r -p "Remove downloaded Whisper models and caches (~/.cache/whisper, ~/Library/Application Support/whisper)? [y/N]: " wipe_models
if [[ "$wipe_models" =~ ^[Yy]$ ]]; then
  remove_target "$HOME/.cache/whisper"
  remove_target "$HOME/Library/Application Support/whisper"
  remove_target "$HOME/Library/Application Support/OpenCohere/models"
fi

ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  read -r -p "Remove the local environment file at $ENV_FILE? [y/N]: " wipe_env
  if [[ "$wipe_env" =~ ^[Yy]$ ]]; then
    echo "Removing $ENV_FILE"
    rm -f "$ENV_FILE"
  fi
fi

cat <<'EOF'
macOS keeps microphone, screen recording, and accessibility approvals even after files are removed.
Reset them if you want a truly fresh start:
  tccutil reset Microphone com.opencohere.app
  tccutil reset Accessibility com.opencohere.app
  tccutil reset ScreenCapture com.opencohere.app

Full uninstall complete. Reboot if you removed permissions, then reinstall or run npm scripts on a clean tree.
EOF
