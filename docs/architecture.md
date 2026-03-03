# Architecture Overview

- Next.js App Router (UI + server routes)
- Auth.js + Prisma adapter for sessions
- PostgreSQL (Prisma)
- Config-driven Game Engine (`src/lib/engine/config-engine.ts`)
- RBAC checks at API boundary (`src/lib/rbac.ts`)
- Audit logging (`AuditLog`)
