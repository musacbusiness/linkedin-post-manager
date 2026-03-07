# LinkedIn Post Manager Architecture

## AI 7-Stage Pipeline

Planned port from `linkedin_automation/` Python backend:
1. **Topic** — User input topic or keyword
2. **Research** — Gather information, search for context
3. **Outline** — Structure the post (hook, main points, CTA)
4. **Draft** — Generate initial post content
5. **Refine** — Improve tone, engagement, clarity
6. **Format** — Add emojis, line breaks, hashtags
7. **Optimize** — Final review and optimization for LinkedIn algorithm

Currently blocked by Anthropic SDK import error in `src/lib/ai/pipeline.ts`.

## React Query Integration

- `use-posts.ts` hook for CRUD operations
- API routes: `/api/posts` (GET/POST), `/api/posts/[id]` (PATCH/DELETE), `/api/posts/schedule` (POST)
- Query invalidation on mutations (Create, Update, Delete)
- Optimistic UI updates for instant feedback
- Real-time subscriptions planned for Phase 4

## Supabase Database

- `posts` — Post records (title, content, status, scheduled_time, image_url)
- `post_images` — Generated image metadata (Replicate URLs)
- `profiles` — User profile data (name, bio, profile_pic)
- `scheduled_posts` — Cron job metadata (execution time, result status)

Auth: Supabase Auth with @supabase/ssr (cookie-based sessions)
RLS: All tables protected by user_id or organization_id filters

## API Routes

- `/api/auth` — Session management
- `/api/posts/*` — CRUD and scheduling
- `/api/generate/*` — AI content generation (planned)
- `/api/cron/*` — Scheduled post publishing (planned)
- `/api/settings/*` — User preferences (planned)

## Image Generation

- Replicate integration for AI image generation
- Currently working: Replicate API key configured, model webhooks set up
- Images stored with URLs returned directly (no local storage)

## Component Structure

- **Layout**: Sidebar, Header (consistent with Visuo theme)
- **Pages**: Dashboard (stats), Posts (list + filters), Calendar (planned), System Health
- **Components**: CreatePostMenu, PostEditor (React Hook Form), PostList (TanStack Table)
- **Styling**: Tailwind CSS v4 + Visuo design tokens (glassmorphism, purple theme)
