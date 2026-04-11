#!/usr/bin/env bun
/**
 * Telegram two-way channel for Claude Code.
 *
 * Bridges Telegram messages into Claude Code sessions via MCP channels,
 * and lets Claude reply back through the Telegram Bot API.
 *
 * Setup:
 *   1. Create a bot with @BotFather on Telegram — copy the token
 *   2. Message your bot so it has a chat to work with
 *   3. Set environment variables (see below)
 *   4. bun add @modelcontextprotocol/sdk zod
 *   5. Add to .mcp.json (see below)
 *   6. claude --dangerously-load-development-channels server:telegram
 *
 * Environment variables:
 *   TELEGRAM_BOT_TOKEN  — required, the token from @BotFather
 *   TELEGRAM_ALLOWED_IDS — comma-separated list of allowed user/chat IDs
 *                          (send /start to your bot, check logs for your ID)
 *
 * .mcp.json entry:
 *   {
 *     "mcpServers": {
 *       "telegram": {
 *         "command": "bun",
 *         "args": ["./.claude/channels/telegram.ts"],
 *         "env": {
 *           "TELEGRAM_BOT_TOKEN": "your-bot-token-here",
 *           "TELEGRAM_ALLOWED_IDS": "your-telegram-user-id"
 *         }
 *       }
 *     }
 *   }
 *
 * Finding your Telegram user ID:
 *   1. Start the channel without TELEGRAM_ALLOWED_IDS set
 *   2. Send a message to your bot
 *   3. Check stderr output — it logs rejected sender IDs
 *   4. Add your ID to TELEGRAM_ALLOWED_IDS and restart
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// --- Config ------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`

const allowedIds = new Set(
  (process.env.TELEGRAM_ALLOWED_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

function isAllowed(id: number): boolean {
  if (allowedIds.size === 0) return false // deny all if no allowlist
  return allowedIds.has(String(id))
}

// --- Telegram Bot API helpers ------------------------------------------------

async function tgRequest(method: string, body?: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string }
  if (!json.ok) {
    throw new Error(`Telegram API error (${method}): ${json.description}`)
  }
  return json.result
}

async function sendMessage(chatId: string | number, text: string, parseMode?: string) {
  return tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    ...(parseMode ? { parse_mode: parseMode } : {}),
  })
}

// --- MCP Server --------------------------------------------------------------

const mcp = new Server(
  { name: 'telegram', version: '0.1.0' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},
      },
      tools: {},
    },
    instructions:
      'Messages from Telegram arrive as <channel source="telegram" chat_id="..." sender="..." username="...">. ' +
      'Reply using the telegram_reply tool, passing the chat_id from the tag. ' +
      'Keep replies concise — Telegram has a 4096 character message limit. ' +
      'For long responses, break them into multiple reply calls.',
  },
)

// --- Reply tool --------------------------------------------------------------

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'telegram_reply',
      description: 'Send a reply message back to a Telegram chat',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: {
            type: 'string',
            description: 'The Telegram chat ID to reply to (from the channel tag)',
          },
          text: {
            type: 'string',
            description: 'The message text to send (max 4096 chars)',
          },
        },
        required: ['chat_id', 'text'],
      },
    },
  ],
}))

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'telegram_reply') {
    const { chat_id, text } = req.params.arguments as {
      chat_id: string
      text: string
    }
    // Split long messages at Telegram's 4096 char limit
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += 4096) {
      chunks.push(text.slice(i, i + 4096))
    }
    for (const chunk of chunks) {
      await sendMessage(chat_id, chunk)
    }
    return { content: [{ type: 'text', text: `sent to chat ${chat_id}` }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

// --- Permission relay --------------------------------------------------------

const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

// Track which chat to send permission requests to (most recent active chat)
let lastActiveChatId: string | null = null

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  if (!lastActiveChatId) return
  const msg =
    `🔐 Claude wants to run: ${params.tool_name}\n\n` +
    `${params.description}\n\n` +
    `Preview: ${params.input_preview}\n\n` +
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`
  await sendMessage(lastActiveChatId, msg)
})

// --- Connect MCP transport ---------------------------------------------------

await mcp.connect(new StdioServerTransport())

// --- Telegram long polling ---------------------------------------------------

const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i
let offset = 0

async function poll() {
  while (true) {
    try {
      const updates = (await tgRequest('getUpdates', {
        offset,
        timeout: 30, // long poll — Telegram holds connection for 30s
      })) as Array<{
        update_id: number
        message?: {
          message_id: number
          from?: { id: number; first_name?: string; username?: string }
          chat: { id: number; type: string }
          text?: string
          date: number
        }
      }>

      for (const update of updates) {
        offset = update.update_id + 1
        const msg = update.message
        if (!msg?.text) continue

        const senderId = msg.from?.id ?? 0
        const chatId = String(msg.chat.id)

        // Gate on sender identity
        if (!isAllowed(senderId)) {
          console.error(
            `[telegram] rejected message from user ${senderId} ` +
              `(${msg.from?.username ?? 'unknown'}). ` +
              `Add ${senderId} to TELEGRAM_ALLOWED_IDS to allow.`,
          )
          continue
        }

        lastActiveChatId = chatId

        // Handle /start command
        if (msg.text === '/start') {
          await sendMessage(
            chatId,
            `Connected! Your user ID is ${senderId}. ` +
              `Messages you send here will be forwarded to your Claude Code session.`,
          )
          continue
        }

        // Check for permission verdict
        const m = PERMISSION_REPLY_RE.exec(msg.text)
        if (m) {
          await mcp.notification({
            method: 'notifications/claude/channel/permission',
            params: {
              request_id: m[2].toLowerCase(),
              behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
            },
          })
          await sendMessage(chatId, `Permission ${m[1].toLowerCase().startsWith('y') ? 'granted' : 'denied'}.`)
          continue
        }

        // Forward message to Claude
        const senderName = msg.from?.first_name ?? 'Unknown'
        const username = msg.from?.username ?? ''

        await mcp.notification({
          method: 'notifications/claude/channel',
          params: {
            content: msg.text,
            meta: {
              chat_id: chatId,
              sender: senderName,
              username,
              sender_id: String(senderId),
            },
          },
        })
      }
    } catch (err) {
      console.error('[telegram] polling error:', err)
      // Back off on error before retrying
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

console.error('[telegram] channel started, polling for messages...')
poll()
