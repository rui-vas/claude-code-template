#!/usr/bin/env bun
/**
 * Two-way channel with reply tool, sender gating, and permission relay.
 *
 * Setup:
 *   1. bun add @modelcontextprotocol/sdk zod
 *   2. Add to .mcp.json: { "mcpServers": { "webhook": { "command": "bun", "args": ["./webhook-two-way.ts"] } } }
 *   3. claude --dangerously-load-development-channels server:webhook
 *
 * Test (3 terminals):
 *   Terminal 1: claude --dangerously-load-development-channels server:webhook
 *   Terminal 2: curl -N localhost:8788/events
 *   Terminal 3: curl -d "list the files here" -H "X-Sender: dev" localhost:8788
 *
 * Permission relay test:
 *   curl -d "yes <id>" -H "X-Sender: dev" localhost:8788
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// --- Outbound: SSE stream for curl -N listeners on /events ------------------
const listeners = new Set<(chunk: string) => void>()
function send(text: string) {
  const chunk =
    text
      .split('\n')
      .map((l) => `data: ${l}\n`)
      .join('') + '\n'
  for (const emit of listeners) emit(chunk)
}

// --- Sender allowlist -------------------------------------------------------
// Gate on sender identity, not room/chat identity.
// In production, load from a config file or pairing flow.
const allowed = new Set(['dev'])

// --- MCP Server -------------------------------------------------------------
const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {}, // opt in to permission relay
      },
      tools: {},
    },
    instructions:
      'Messages arrive as <channel source="webhook" chat_id="...">. ' +
      'Reply with the reply tool, passing the chat_id from the tag.',
  },
)

// --- Reply tool -------------------------------------------------------------
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'reply',
      description: 'Send a message back over this channel',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: {
            type: 'string',
            description: 'The conversation to reply in',
          },
          text: { type: 'string', description: 'The message to send' },
        },
        required: ['chat_id', 'text'],
      },
    },
  ],
}))

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as {
      chat_id: string
      text: string
    }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

// --- Permission relay -------------------------------------------------------
const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  send(
    `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
      `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  )
})

await mcp.connect(new StdioServerTransport())

// --- HTTP server ------------------------------------------------------------
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i
let nextId = 1

Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url)

    // GET /events: SSE stream for watching replies and permission prompts
    if (req.method === 'GET' && url.pathname === '/events') {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(': connected\n\n')
          const emit = (chunk: string) => ctrl.enqueue(chunk)
          listeners.add(emit)
          req.signal.addEventListener('abort', () => listeners.delete(emit))
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Gate on sender
    const body = await req.text()
    const sender = req.headers.get('X-Sender') ?? ''
    if (!allowed.has(sender)) return new Response('forbidden', { status: 403 })

    // Check for permission verdict before treating as chat
    const m = PERMISSION_REPLY_RE.exec(body)
    if (m) {
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: {
          request_id: m[2].toLowerCase(),
          behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
        },
      })
      return new Response('verdict recorded')
    }

    // Normal chat: forward to Claude
    const chat_id = String(nextId++)
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: { content: body, meta: { chat_id, path: url.pathname } },
    })
    return new Response('ok')
  },
})
