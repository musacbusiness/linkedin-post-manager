# LinkedIn Post Manager Memory

## Current State
- Phase 1-3: Complete (setup, UI, auth, dashboard, posts list, post editor, image generation)
- Phase 4-6: Pending (calendar, auto-scheduling, AI pipeline port, mobile, deployment)
- Tech: Next.js 14, Supabase, React Query, Anthropic SDK, Replicate

## Active Blockers
- `src/lib/ai/pipeline.ts`: Anthropic SDK import error — fix before Phase 5 AI pipeline
- DB constraint: Status values must be `'Pending Review'` (not `'pending_review'`, snake_case fails)

## Recent Decisions
- Singleton Supabase client pattern (@supabase/ssr cookie-based sessions)
- React Query + Zustand for state (server + UI)
- Replicate for image generation (working), Anthropic for 7-stage AI pipeline (blocked on import error)

## Next Up
- Investigate Anthropic SDK error in pipeline.ts
- Fix database status enum constraint violation
- Phase 4: Calendar view, auto-scheduling logic
- Phase 5: Port Python AI pipeline from linkedin_automation/
