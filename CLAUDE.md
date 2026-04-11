# Project Instructions

These instructions are loaded into every Claude Code conversation.
Write them like SOPs — clear, specific, and actionable.

## Startup Routine

1. Read all files in `context/` — this is your foundation
2. Read `MEMORY.md` — this is what you've learned over time
3. Use both to shape every task

## Code Standards

- Write clean, readable code with descriptive variable names
- Follow the conventions already established in this codebase
- Don't add comments unless the logic is genuinely non-obvious
- Don't add features, refactor code, or make "improvements" beyond what was asked

## Git Conventions

- Commit messages: imperative mood, under 72 chars (e.g., "Add user auth endpoint")
- One logical change per commit — don't bundle unrelated changes
- Never commit secrets, .env files, or credentials

## Testing

- Run tests before marking any task as done
- If tests don't exist yet, write them for new functionality
- Test the happy path and at least one edge case

## Memory System

When I correct you or you learn something new, update the relevant
section in `MEMORY.md`:

- **Voice** — tone, phrasing, writing corrections
- **Process** — how I want tasks done
- **People** — who people are, relationships
- **Projects** — active work, current tasks, status
- **Output** — formats, naming, delivery preferences
- **Tools** — which tools to use and how

Keep MEMORY.md current. When something changes, update it in place
— replace outdated info, don't just append below it.

## Available Skills

- `/skill-creator` — Build or audit Claude Code skills following best practices
- `/project:review` — Review code changes on the current branch
- `/project:daily-standup` — Generate a standup summary from git activity
- `/project:explain` — Explain selected code in plain language

## Channels

Channels let external systems push events into a Claude Code session.
See `.claude/channels/README.md` for the full setup guide.

- `webhook-one-way.ts` — Minimal webhook receiver (alerts, CI, monitoring)
- `webhook-two-way.ts` — Full example with reply tool, sender gating, and permission relay

Built-in channels (research preview): Telegram, Discord, iMessage, fakechat.

## Project Structure

```
project-root/
├── .claude/                    # Claude Code configuration (committed to git)
│   ├── settings.json           # Project-level permissions and settings
│   ├── commands/               # Custom slash commands (/project:command-name)
│   │   ├── review.md
│   │   ├── daily-standup.md
│   │   └── explain.md
│   ├── channels/               # Channel server examples and docs
│   │   ├── README.md           # Setup guide for channels
│   │   ├── webhook-one-way.ts  # Minimal one-way webhook receiver
│   │   └── webhook-two-way.ts  # Two-way with reply, gating, permission relay
│   └── skills/                 # Reusable skills (auto-invoked or /skill-name)
│       └── skill-creator/
│           └── SKILL.md
├── context/                    # Reference material loaded at startup
│   ├── about.md                # What this project is, who it's for
│   └── stack.md                # Tech stack, architecture decisions
├── .mcp.json                   # MCP server connections
├── CLAUDE.md                   # This file — project instructions
└── MEMORY.md                   # Persistent memory across conversations
```
