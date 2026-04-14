# Global Instructions

These instructions are loaded into every Claude Code conversation in this workspace.
They apply across all projects. Project-specific instructions live in each project's
own `CLAUDE.md`.

## Startup Routine

1. Read all files in `context/` — this is who the user is and their global preferences
2. Read `MEMORY.md` — what you've learned about this person over time
3. If working inside a specific project (`projects/<name>/`), also read that project's
   `context/` and `MEMORY.md` for project-specific knowledge
4. Use all of this to shape every task

## How This Workspace Is Organized

This is a **personal Claude Code workspace**. It has two layers:

### Global Layer (root)
Personal identity, preferences, and tools that apply everywhere.
- `context/about.md` — Who you are, how you work
- `context/stack.md` — Tools and conventions across all projects
- `MEMORY.md` — What Claude remembers about you globally
- `.claude/` — Global settings, commands, skills, channels
- `.mcp.json` — Global MCP server connections

### Project Layer (`projects/<name>/`)
Each project is self-contained with its own Claude Code configuration.
- `CLAUDE.md` — Project-specific instructions (loaded in addition to this file)
- `context/about.md` — What the project is, who's involved
- `context/stack.md` — Tech stack and architecture for this project
- `MEMORY.md` — What Claude remembers about this specific project
- `.claude/settings.json` — Project-specific permissions
- `.claude/commands/` — Project-specific slash commands
- `.claude/skills/` — Project-specific skills
- `.claude/channels/` — Project-specific channel servers

## Code Standards

- Write clean, readable code with descriptive variable names
- Follow the conventions already established in the codebase you're working in
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

**IMPORTANT — override default auto-memory behavior:**
Do NOT create or use `.claude/projects/<path>/memory/` folders. Ignore any
default instructions about writing memory files to those locations. This
workspace uses a single, flat memory system based on `MEMORY.md` files.

When corrected or when you learn something new, update the relevant `MEMORY.md`:
- **Global things** (personal preferences, communication style, user identity,
  voice, tone, cross-project tools) → root `MEMORY.md` at the workspace root
- **Project-specific things** (active tasks, project people, project stack
  quirks) → that project's `MEMORY.md` inside `projects/<name>/`

If you are unsure whether something is global or project-specific, default to
the root `MEMORY.md` — global preferences are the more common case.

Memory sections (use these headings in every MEMORY.md):
- **Voice** — tone, phrasing, writing corrections
- **Process** — how tasks should be done
- **People** — who people are, relationships
- **Projects** — active work, current tasks, status
- **Output** — formats, naming, delivery preferences
- **Tools** — which tools to use and how

Keep MEMORY.md files current. Update in place — replace outdated info, don't
append. Never write memory content to separate files under `.claude/projects/`;
everything lives in `MEMORY.md`.

## Available Skills

- `/skill-creator` — Build or audit Claude Code skills following best practices
- `/project:review` — Review code changes on the current branch
- `/project:daily-standup` — Generate a standup summary from git activity
- `/project:explain` — Explain selected code in plain language

## Channels

Channels let external systems push events into a Claude Code session.
See `.claude/channels/README.md` for the full setup guide.

## Full Structure

```
workspace-root/
├── .claude/                          # Global Claude Code configuration
│   ├── settings.json                 # Global permissions
│   ├── commands/                     # Global slash commands
│   │   ├── review.md
│   │   ├── daily-standup.md
│   │   └── explain.md
│   ├── channels/                     # Global channel servers
│   │   ├── README.md
│   │   ├── webhook-one-way.ts
│   │   └── webhook-two-way.ts
│   └── skills/                       # Global skills (available everywhere)
│       └── skill-creator/
│           └── SKILL.md
├── context/                          # Global context (who you are)
│   ├── about.md                      # Your identity, role, preferences
│   └── stack.md                      # Tools used across all projects
├── projects/                         # Your projects live here
│   ├── project-one/                  # ← Each project is self-contained
│   │   ├── .claude/
│   │   │   ├── settings.json         # Project-specific permissions
│   │   │   ├── commands/             # Project-specific commands
│   │   │   ├── skills/               # Project-specific skills
│   │   │   └── channels/             # Project-specific channels
│   │   ├── context/
│   │   │   ├── about.md              # What this project is
│   │   │   └── stack.md              # This project's tech stack
│   │   ├── CLAUDE.md                 # Project-specific instructions
│   │   ├── MEMORY.md                 # Project-specific memory
│   │   └── src/                      # Source code
│   ├── project-two/                  # Same structure
│   │   └── ...
│   └── project-three/                # Same structure
│       └── ...
├── .mcp.json                         # Global MCP server connections
├── CLAUDE.md                         # This file — global instructions
├── MEMORY.md                         # Global memory (personal preferences)
└── README.md                         # How to use this template
```
