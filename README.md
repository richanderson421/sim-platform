# SimHub MVP

Multi-tenant instructional simulation platform MVP.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Auth.js (NextAuth) + Prisma adapter
- PostgreSQL + Prisma
- Vercel-ready

## Features in scaffold
- RBAC-ready schema (admin/owner/TA/player)
- GameType + immutable GameTypeVersion snapshots
- GameInstance lifecycle entities
- Enrollment request workflow (request + approve/deny endpoint)
- Round submissions + validation + scoring (config-driven engine)
- CSV export endpoints
- Audit log table and helper
- Seeded sample game type + instance

## Local setup
1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres and set `DATABASE_URL`.
3. Generate + migrate + seed:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
4. Run app:
   ```bash
   npm run dev
   ```

## Test & quality
```bash
npm run lint
npm run typecheck
npm run test
```

## Deploy (Vercel)
1. Create managed Postgres (Neon/Supabase/Vercel Postgres).
2. Set env vars in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
3. Run migrations in CI/CD before switching traffic.

## Safe deploy steps
1. `prisma migrate deploy`
2. health check
3. promote deployment
4. run smoke tests: auth, enrollment approval, submission, export

## Notes
- MVP engine is config-driven (JSON). 
- Code-driven plugin path: add `src/lib/engine/plugins/*.ts` implementing a strict interface; use `GameTypeVersion.engineKey` in next iteration.
