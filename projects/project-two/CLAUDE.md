# Project Two — Instructions

These instructions apply only when Claude is working inside this project.
The root-level CLAUDE.md (your global instructions) also applies.

## What This Project Is

[Describe the project in 1-2 sentences]

## Startup Routine

1. Read `context/` files in this project — they describe this specific project
2. Read `MEMORY.md` in this project — what Claude has learned about this project
3. Check the root `context/about.md` if you need to understand who I am

## Code Standards

- [Add project-specific conventions here]
- [e.g., Use React Server Components by default]
- [e.g., All API routes go in src/app/api/]

## Architecture Rules

- [e.g., Never import from the database layer directly in components]
- [e.g., All state management through Zustand stores]

## Testing

- Run `[your test command]` before marking any task as done
- [Add project-specific testing rules]

## Deployment

- [e.g., Push to main deploys to production via Vercel]
- [e.g., Push to staging branch deploys to preview]

## Project Structure

```
project-two/
├── .claude/
│   ├── settings.json       # Project-specific permissions
│   ├── commands/            # Project-specific slash commands
│   └── skills/              # Project-specific skills
├── context/
│   ├── about.md             # What this project is
│   └── stack.md             # Tech stack for this project
├── CLAUDE.md                # This file — project instructions
├── MEMORY.md                # What Claude remembers about this project
└── src/                     # Your source code goes here
```
