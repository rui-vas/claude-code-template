#!/bin/bash
# Start Claude Code with Telegram channel in always-on mode.
#
# Usage:
#   ./.claude/channels/telegram/start.sh   — run in foreground from project root
#   launchctl load ...                      — run as background service (see README)
#
# Prerequisites:
#   - .env file (at project root) with TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_IDS
#   - bun and claude CLI in PATH
#   - MCP server "telegram" registered (claude mcp add ...)

set -euo pipefail

# Resolve project root (two levels up from this script: telegram/ -> channels/ -> .claude/ -> root)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Ensure bun is in PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Load .env from project root if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Log file lives next to this script
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/telegram-$(date +%Y-%m-%d).log"

echo "[$(date)] Starting Claude Code with Telegram channel..." | tee -a "$LOG_FILE"

exec claude \
  --dangerously-load-development-channels server:telegram \
  --verbose \
  2>&1 | tee -a "$LOG_FILE"
