# Channels Setup Guide

Channels let external systems push events into a Claude Code session —
alerts, webhooks, chat messages — so Claude can react to things happening
outside the terminal.

> Requires Claude Code v2.1.80+, claude.ai login (not API keys).
> Team/Enterprise orgs must explicitly enable channels.

## What is a Channel?

A channel is an MCP server that runs locally, spawned by Claude Code as a
subprocess over stdio. It bridges external systems into your session:

- **One-way**: forward alerts, CI failures, monitoring events to Claude
- **Two-way**: chat bridges (Telegram, Discord, iMessage) where Claude can reply

## Quick Start

### 1. Install the MCP SDK

```bash
# Using Bun (recommended — built-in HTTP server + TypeScript)
bun add @modelcontextprotocol/sdk

# Or Node.js
npm install @modelcontextprotocol/sdk
```

### 2. Create a Channel Server

See the examples in this folder:
- `webhook-one-way.ts` — minimal webhook receiver (one-way)
- `webhook-two-way.ts` — webhook with reply tool (two-way)

### 3. Register in .mcp.json

Add your channel server to the project's `.mcp.json`:

```json
{
  "mcpServers": {
    "webhook": { "command": "bun", "args": ["./webhook.ts"] }
  }
}
```

### 4. Test During Research Preview

Custom channels need the development flag during the preview:

```bash
claude --dangerously-load-development-channels server:webhook
```

## Built-in Channels (Research Preview)

These are included and approved in the research preview:

| Channel   | Type    | Description                        |
|-----------|---------|------------------------------------|
| Telegram  | Two-way | Chat bridge with pairing flow      |
| Discord   | Two-way | Chat bridge with pairing flow      |
| iMessage  | Two-way | Auto-detects your addresses        |
| fakechat  | Two-way | Local web UI for testing           |

Enable with: `claude --channels plugin:telegram@claude-plugins-official`

## Channel Architecture

```
External System  →  Your Channel Server (local)  →  Claude Code (stdio)
     (HTTP POST)       (MCP server, spawned          (receives <channel>
                        as subprocess)                 tags in context)
```

## Key Concepts

### Capabilities Declaration

Every channel must declare `claude/channel` in its capabilities:

```ts
capabilities: {
  experimental: { 'claude/channel': {} },  // required — registers listener
  tools: {},                                // optional — for two-way channels
}
```

### Notification Format

Push events with `mcp.notification()`:

```ts
await mcp.notification({
  method: 'notifications/claude/channel',
  params: {
    content: 'build failed on main',           // event body
    meta: { severity: 'high', run_id: '1234' } // becomes tag attributes
  }
})
```

Arrives in Claude's context as:

```
<channel source="webhook" severity="high" run_id="1234">
build failed on main
</channel>
```

### Instructions Field

The `instructions` string in the Server constructor is added to Claude's
system prompt. Tell Claude what events to expect and how to handle them:

```ts
instructions: 'Events from webhook arrive as <channel source="webhook">. '
            + 'They are one-way: read them and act, no reply expected.'
```

## Security: Gate Inbound Messages

Always check the sender before emitting events — an ungated channel is a
prompt injection vector:

```ts
const allowed = new Set(['trusted-sender-id'])

if (!allowed.has(message.from.id)) return  // drop silently
await mcp.notification({ ... })
```

Gate on sender identity, not room/chat identity (in group chats, anyone in
the room could inject messages).

## Permission Relay (v2.1.81+)

Two-way channels can opt in to receive tool-approval prompts remotely.
Add `claude/channel/permission: {}` to capabilities, then handle
`notifications/claude/channel/permission_request` to forward prompts.

The user replies with `yes <id>` or `no <id>`, and your server emits
a `notifications/claude/channel/permission` verdict back to Claude Code.

Only enable this on channels with authenticated senders.

## Telegram Channel Setup

The `telegram.ts` channel bridges Telegram messages into your Claude Code session
(two-way: Claude can reply back).

### Step-by-step

1. **Create a Telegram bot**
   - Open Telegram, search for `@BotFather`, send `/newbot`
   - Follow the prompts — you'll get a bot token like `123456:ABC-DEF...`

2. **Find your Telegram user ID**
   - Start the channel without setting `TELEGRAM_ALLOWED_IDS`
   - Send a message to your bot
   - Check the Claude Code stderr output — it logs the rejected sender ID
   - That number is your user ID

3. **Configure the channel**
   - Edit `.mcp.json` at the workspace root:
   ```json
   {
     "mcpServers": {
       "telegram": {
         "command": "bun",
         "args": ["./.claude/channels/telegram.ts"],
         "env": {
           "TELEGRAM_BOT_TOKEN": "123456:ABC-DEF...",
           "TELEGRAM_ALLOWED_IDS": "your-user-id"
         }
       }
     }
   }
   ```
   - For multiple allowed users, comma-separate the IDs: `"123,456,789"`

4. **Install dependencies**
   ```bash
   bun add @modelcontextprotocol/sdk zod
   ```

5. **Launch**
   ```bash
   claude --dangerously-load-development-channels server:telegram
   ```

6. **Test it** — send a message to your bot on Telegram. It should appear in
   your Claude Code session, and Claude can reply back.

### Features

- **Two-way messaging**: Claude receives your Telegram messages and replies back
- **Sender gating**: only allowed user IDs can interact (security against prompt injection)
- **Permission relay**: Claude can ask for tool approval via Telegram
- **Long message splitting**: responses over 4096 chars are auto-chunked
- **Long polling**: no webhook or public URL needed — works behind NAT/firewalls

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_ALLOWED_IDS` | Yes | Comma-separated Telegram user IDs to allow |

## Further Reading

- Example implementations: https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins
- MCP protocol: https://modelcontextprotocol.io
- Packaging as a plugin: publish to a marketplace, users install with `/plugin install`
