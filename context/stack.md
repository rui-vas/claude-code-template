# Tech Stack & Architecture

Replace this file with your actual project's tech stack.
Claude reads this at the start of every conversation so it understands
your codebase without needing to explore it first.

## Example Format

**Language:** TypeScript
**Runtime:** Node.js 20
**Framework:** Express
**Database:** PostgreSQL with Prisma ORM
**Testing:** Vitest
**Deployment:** Docker on Railway

## Architecture Decisions

- API follows REST conventions
- Auth uses JWT tokens stored in httpOnly cookies
- All database access goes through Prisma — no raw SQL
- Environment variables loaded from .env (never committed)
