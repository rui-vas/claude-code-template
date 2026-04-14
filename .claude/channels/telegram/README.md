# Telegram Channel

Two-way Telegram bridge for Claude Code. Send messages to your bot from
anywhere, and Claude responds back through the Telegram Bot API.

## Files in this folder

| File | Purpose |
|---|---|
| `server.ts` | The MCP channel server (polls Telegram, forwards to Claude, exposes `telegram_reply` tool) |
| `start.sh` | Launcher script that loads `.env` and starts Claude with the channel enabled |
| `com.claude.telegram-channel.plist` | macOS LaunchAgent for running 24/7 |
| `logs/` | Runtime logs (git-ignored) |

## Features

- **Two-way messaging**: Claude receives your Telegram messages and replies back
- **Sender gating**: only allowed user IDs can interact (prevents prompt injection)
- **Permission relay**: Claude can ask for tool approval via Telegram (`yes <id>` / `no <id>`)
- **Long message splitting**: responses over 4096 chars are auto-chunked
- **Long polling**: no webhook or public URL needed — works behind NAT/firewalls

## One-time setup

### 1. Create a Telegram bot

- Open Telegram, search for `@BotFather`, send `/newbot`
- Follow the prompts — you'll get a bot token like `123456:ABC-DEF...`
- Send a message to your new bot so it has a chat to work with

### 2. Fill in `.env` at the project root

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_IDS=your-telegram-user-id
```

**Finding your Telegram user ID:** leave `TELEGRAM_ALLOWED_IDS` empty, launch the
channel, and send your bot a message. The stderr log will say
`rejected message from user <your-id>`. Add that ID and restart.

For multiple allowed users: `TELEGRAM_ALLOWED_IDS=123,456,789`.

### 3. Install dependencies

```bash
# Install Bun if you don't have it
curl -fsSL https://bun.sh/install | bash

# Install MCP SDK + zod
bun add @modelcontextprotocol/sdk zod
```

### 4. Register the MCP server with Claude Code

```bash
claude mcp add telegram ~/.bun/bin/bun -- ./.claude/channels/telegram/server.ts
```

Verify it's registered:

```bash
claude mcp list
```

## Running

### Foreground (manual, for testing)

```bash
claude --dangerously-load-development-channels server:telegram
```

Send a message to your bot — it should appear in Claude's context, and Claude
can reply using the `telegram_reply` tool.

### Background (always-on, via `start.sh`)

```bash
./.claude/channels/telegram/start.sh
```

Logs go to `.claude/channels/telegram/logs/telegram-YYYY-MM-DD.log`.

### 24/7 as a macOS service (Mac mini setup)

1. **Edit the plist** — open
   `.claude/channels/telegram/com.claude.telegram-channel.plist` and change
   the path in `ProgramArguments` to match where you cloned this repo.

2. **Install the LaunchAgent**:
   ```bash
   cp .claude/channels/telegram/com.claude.telegram-channel.plist \
      ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.claude.telegram-channel.plist
   ```

3. **Verify it's running**:
   ```bash
   launchctl list | grep claude.telegram
   tail -f /tmp/claude-telegram.err.log
   ```

4. **To stop/remove**:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.claude.telegram-channel.plist
   rm ~/Library/LaunchAgents/com.claude.telegram-channel.plist
   ```

## Permissions (avoiding `yes <id>` prompts)

When Claude wants to run a tool, it normally asks for approval. For always-on
Telegram use, you don't want to walk back to the laptop to approve things —
so `.claude/settings.json` is pre-configured to auto-allow most tools
(`Read`, `Write`, `Edit`, `Bash(*)`, `WebFetch`, `WebSearch`, etc.).

Truly destructive commands are still blocked: `rm -rf /`, `git push --force`,
`git reset --hard`. Edit `.claude/settings.json` to tighten or loosen this.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_ALLOWED_IDS` | Yes | Comma-separated Telegram user IDs to allow |
