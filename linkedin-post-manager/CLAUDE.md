# LinkedIn Post Manager

Next.js 14 app for scheduling, generating, and publishing LinkedIn posts via AI pipeline.

## Dev Commands

```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint
```

**Env**: See `.env.local` (never commit)

## Implementation Status

- ✅ Phase 1: Next.js setup, Visuo theme, UI components, Supabase auth, dashboard layout
- ✅ Phase 2: React Query, posts list/filtering, hooks, API routes (CRUD + schedule)
- ✅ Phase 3: Post editor with React Hook Form, image generation via Replicate
- ⏳ Phase 4: Calendar view, auto-scheduling, Supabase Realtime
- ⏳ Phase 5: AI 7-stage pipeline (port from Python in `linkedin_automation/`)
- ⏳ Phase 6: Mobile optimization, animations, Vercel deployment

## Active Blockers

- `src/lib/ai/pipeline.ts` — Anthropic SDK import error (needs investigation before Phase 5)
- Database status values: use `'Pending Review'` not `'pending_review'` (snake_case causes constraint violation)

## Reference Docs (read when relevant)

- `docs/memory.md` — current implementation state, active blockers, recent decisions
- `docs/architecture.md` — AI pipeline stages, React Query patterns, API routes, DB schema
- `docs/implementation-status.md` — Detailed phase breakdown, what's been built, what remains
