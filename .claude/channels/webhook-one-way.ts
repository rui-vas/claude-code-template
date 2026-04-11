#!/usr/bin/env bun
/**
 * Minimal one-way channel: receives HTTP POSTs and forwards them to Claude.
 *
 * Setup:
 *   1. bun add @modelcontextprotocol/sdk
 *   2. Add to .mcp.json: { "mcpServers": { "webhook": { "command": "bun", "args": ["./webhook-one-way.ts"] } } }
 *   3. claude --dangerously-load-development-channels server:webhook
 *
 * Test:
 *   curl -X POST localhost:8788 -d "build failed on main"
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: { experimental: { 'claude/channel': {} } },
    instructions:
      'Events from the webhook channel arrive as <channel source="webhook">. ' +
      'They are one-way: read them and act, no reply expected.',
  },
)

await mcp.connect(new StdioServerTransport())

Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  async fetch(req) {
    const body = await req.text()
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: body,
        meta: { path: new URL(req.url).pathname, method: req.method },
      },
    })
    return new Response('ok')
  },
})
