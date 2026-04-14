# Agents

Subagents are specialized assistants Claude Code can delegate to. Each agent runs in its own context window with its own system prompt and tool permissions.

## Scope

- **Global agents** (this folder, `.claude/agents/`) are available in every project.
- **Project agents** live in `projects/<name>/.claude/agents/` and only load for that project. Project agents with the same name override global ones.

## File format

Each agent is a single markdown file with YAML frontmatter:

```markdown
---
name: agent-name
description: When Claude should delegate to this agent. Be specific — this is how Claude decides to use it.
tools: Read, Grep, Glob
model: sonnet
---

System prompt for the agent goes here. Describe its role, how it should work,
and what its output should look like.
```

**Fields:**
- `name` — lowercase, hyphenated. Matches the filename.
- `description` — when to use it. Written for Claude, not humans.
- `tools` — comma-separated. Omit to inherit all tools. Restrict to what the agent actually needs.
- `model` — `haiku`, `sonnet`, or `opus`. Pick the cheapest model that can do the job.

## Example

See [cfo.md](cfo.md) — a read-only financial analysis agent that scans project finance files and returns CFO-style summaries.

## Adding a new agent

1. Create `<name>.md` in this folder (or in a project's `.claude/agents/`)
2. Write a specific `description` — vague descriptions mean Claude won't delegate
3. Restrict `tools` to the minimum needed
4. Test by asking Claude a task that should trigger it
