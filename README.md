# Claude Code Workspace Template

A ready-to-use template for setting up Claude Code with a personal workspace
that supports multiple projects.

## Quick Start

1. **Clone or copy** this template
2. **Fill in your global context** — edit `context/about.md` with who you are
3. **Rename and configure your projects** — each folder in `projects/` is a project
4. **Start Claude Code** in the root or inside any project folder

## How It Works

This template has two layers:

### Global (root level)
Your personal identity, preferences, and tools that apply to everything you do.
Claude reads these every conversation.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Global instructions for Claude |
| `MEMORY.md` | What Claude remembers about you |
| `context/about.md` | Who you are, your role, preferences |
| `context/stack.md` | Tools you use across all projects |
| `.claude/settings.json` | Global permission rules |
| `.claude/commands/` | Slash commands available everywhere |
| `.claude/skills/` | Skills available everywhere |
| `.mcp.json` | MCP server connections |

### Per-Project (`projects/<name>/`)
Each project is self-contained. When you open Claude Code inside a project folder,
it loads both the global context AND the project-specific context.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project-specific instructions |
| `MEMORY.md` | What Claude remembers about this project |
| `context/about.md` | What the project is, team, URLs |
| `context/stack.md` | Tech stack and architecture |
| `.claude/settings.json` | Project-specific permissions |
| `.claude/commands/` | Project-specific slash commands |
| `.claude/skills/` | Project-specific skills |

## Setting Up a New Project

1. Copy any project folder in `projects/` and rename it
2. Edit `CLAUDE.md` — write the rules for this specific project
3. Edit `context/about.md` — describe what the project is
4. Edit `context/stack.md` — list the tech stack
5. Optionally add project-specific skills in `.claude/skills/`
6. Start coding

## Directory Structure

```
workspace-root/
├── .claude/                          # Global config
│   ├── settings.json
│   ├── commands/
│   ├── channels/
│   └── skills/
├── context/                          # Who you are
│   ├── about.md
│   └── stack.md
├── projects/
│   ├── project-one/                  # Each project is self-contained
│   │   ├── .claude/
│   │   │   ├── settings.json
│   │   │   ├── commands/
│   │   │   ├── skills/
│   │   │   └── channels/
│   │   ├── context/
│   │   │   ├── about.md
│   │   │   └── stack.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── src/
│   ├── project-two/
│   └── project-three/
├── .mcp.json
├── CLAUDE.md                         # Global instructions
├── MEMORY.md                         # Global memory
└── README.md                         # This file
```

## Tips

- **Global skills** (in root `.claude/skills/`) are available in every project
- **Project skills** (in `projects/<name>/.claude/skills/`) only apply to that project
- **MEMORY.md** at the root tracks personal preferences; each project has its own
- **MCP servers** in the root `.mcp.json` are available globally — add project-specific
  ones inside each project if needed
- When you `cd` into a project folder and run Claude Code, it picks up both the
  root `CLAUDE.md` and the project's `CLAUDE.md` automatically
