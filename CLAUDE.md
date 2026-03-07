# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**AIO Platform** (`/aio-platform`) - A comprehensive Next.js 16 business operations platform designed for managing customer relationships, projects, time tracking, invoicing, and workflow automation with a modern glassmorphic UI and real-time collaboration features.

## Tech Stack

- **Framework**: Next.js 16.0.10 with Turbopack
- **Frontend**: React 19.2.1, TypeScript 5
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **Authentication**: Supabase Auth (@supabase/ssr v0.8.0)
- **Database**: Supabase PostgreSQL
- **Forms**: React Hook Form v7.69.0 + Zod v4.2.1 validation
- **Data Management**: @tanstack/react-query v5.90.12 (React Query)
- **Data Tables**: @tanstack/react-table v8.21.3
- **State Management**: Zustand v5.0.9
- **UI Components**: Radix UI (dialog, dropdown, avatar, tooltip)
- **Charts**: recharts v3.6.0 for analytics visualization
- **Icons**: lucide-react v0.562.0
- **Animations**: Framer Motion v12.29.0
- **Notifications**: sonner v2.0.7 for toast messages
- **Utilities**: clsx, tailwind-merge, date-fns
- **Security**: bcryptjs v3.0.3 for password hashing
- **QR Codes**: qrcode.react v4.2.0 for credential codes

## Project Structure

```
aio-platform/
├── src/
│   ├── app/                          # Next.js 16 app router
│   │   ├── api/                      # API routes (RLS-protected queries)
│   │   ├── dashboard/                # Main dashboard layout (Server Component)
│   │   ├── crm/                      # CRM pages (Kanban carousel, deal pipeline)
│   │   ├── contacts/                 # Contacts management
│   │   ├── projects/                 # Project tracking
│   │   ├── time/                     # Time tracking & timesheets
│   │   ├── invoices/                 # Invoice management
│   │   ├── campaigns/                # Marketing campaigns
│   │   ├── automations/              # Workflow automation rules
│   │   ├── settings/                 # User & organization settings
│   │   ├── client/                   # Client portal pages
│   │   ├── login/                    # Authentication pages
│   │   ├── signup/
│   │   └── globals.css               # Tailwind v4 inline config + utilities
│   ├── components/
│   │   ├── ui/                       # Reusable UI components (Button, Card, Dialog, etc.)
│   │   ├── dashboard/                # Dashboard layout (Sidebar, Header, Navigation)
│   │   ├── crm/                      # CRM-specific components (Kanban, Deal cards)
│   │   ├── time/                     # Time tracking components
│   │   ├── client/                   # Client portal components
│   │   ├── animations/               # Framer Motion animation wrappers
│   │   └── table/                    # Data table components
│   ├── lib/
│   │   ├── supabase/                 # Supabase client setup (server.ts, client.ts)
│   │   ├── emails/                   # Email template generators
│   │   ├── animations/               # Reusable animation configs
│   │   └── utils.ts                  # Shared utilities (cn, formatters, etc.)
│   ├── hooks/                        # Custom React hooks (useAuth, useQuery, etc.)
│   ├── types/
│   │   ├── client.ts                 # Client portal data types
│   │   └── pipeline.ts               # Pipeline & deal types
│   └── middleware.ts                 # Next.js middleware (auth, redirects)
├── public/                           # Static assets
├── scripts/                          # Development scripts (dev-clean.sh)
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── eslint.config.mjs                 # ESLint configuration (v9)
├── vitest.config.ts                  # Vitest configuration for testing
├── package.json
└── README.md
```

## Common Development Commands

```bash
cd aio-platform

# Development
npm run dev              # Start dev server (http://localhost:3000 with Turbopack)
npm run dev:clean       # Clean rebuild with fresh node_modules + .next cache

# Building & Running
npm run build            # Production build (Next.js optimized)
npm run start            # Start production server locally

# Code Quality
npm run lint             # Run ESLint (v9 with core-web-vitals + TypeScript)
npm run type-check       # TypeScript strict mode checking (no emit)

# Testing
npm test                 # Run Vitest (watch mode)
npm run test:ui          # Vitest with browser UI dashboard
npm run test:coverage    # Generate coverage report

# Pre-push Validation
npm run pre-push         # Runs: type-check + build (run before git push)

# Git Hooks
npm run prepare          # Install/setup Husky git hooks
```

## Architecture Patterns

### Authentication Flow
- **Supabase Auth** with email/password + OAuth support
- **Server-side session** management via @supabase/ssr (cookie-based)
- **Middleware** enforces protected routes, redirects unauthenticated users to /login
- **Server Components** validate session, redirect if needed

### Data Management
- **React Query** (@tanstack/react-query) for server state, caching, and synchronization
- **Zustand** for lightweight client state (UI state, modals, etc.)
- **Zod** for runtime validation of API responses and form inputs

### UI Component Pattern
- **Radix UI** primitives for accessibility (Dialog, DropdownMenu, Tooltip, Avatar)
- **Custom components** built on top of Radix for consistent styling
- **Tailwind CSS** for styling with custom utilities layer
- **Framer Motion** for smooth animations and transitions

### API Integration
- **Next.js API Routes** (`/app/api`) handle backend logic
- **Supabase** for real-time database and authentication
- **Claude API** (LinkedIn Post Manager) for content generation
- **Replicate** (LinkedIn Post Manager) for image generation

## Key Implementation Details

### CRM Kanban Board - Deal Pipeline
- **Responsive Carousel Navigation**: Dynamically calculates visible stages based on viewport width
- **ResizeObserver API**: Monitors container size with 50ms debounce for performance
- **Navigation Controls**: Left/right arrows + visual scrollbar thumb for viewport positioning
- **Stage Count Recovery**: Tracks `maxMeasuredCountRef` to prevent stage loss during window focus changes (Safari compatibility)
- **Visible Stages Formula**: `Math.floor((availableWidth + STAGE_GAP) / (STAGE_MIN_WIDTH + STAGE_GAP))`
- **Smooth Scrolling**: Implements `behavior: 'smooth'` for natural viewport transitions
- **Cross-Browser Handling**: Safari-specific visibility change event listener with multiple measurement attempts (100ms, 250ms, 400ms, 600ms, 900ms)
- **Proportional Scrollbar**: Thumb width scales based on content visibility ratio

### Design System: Visuo Aesthetic
- **Color Palette**:
  - Primary: Deep purple (#6b4ceb), Black (#121116)
  - Accents: Light purple (#9378ff), Dark blue (#02071a)
  - Neutrals: 9-level gray scale (from #ddd to #0a0a0a)
- **Visual Effects**:
  - Glassmorphism with backdrop-blur (xl, 2xl, 3xl levels)
  - Purple glow shadows (rgba(107,76,235) at 0.3-0.5 opacity)
  - Gradient overlays (radial for cards, hero backgrounds)
- **Typography**: Geist Sans + Geist Mono font family with all weights
- **Animations**:
  - Fade-in (300ms ease-in-out)
  - Slide-up (400ms ease-out)
  - Glow-pulse (2s infinite)
  - Float (3s infinite)
  - Scale-in (300ms ease-out)
- **Component Pattern**:
  - Glass containers with semi-transparent backgrounds
  - Border using rgba white/purple at 10-20% opacity
  - Hover states with scale transforms and shadow enhancement
  - Focus states with glow rings

### Client Portal System
- **Multi-tenant Architecture**: Clients access projects via secure registration tokens
- **Credential Management**: Encrypted storage of client credentials (social, API, login)
- **File Organization**: Category-based file management (contracts, scope, deliverables, credentials)
- **Real-time Messaging**: Client-business communication with read receipts
- **Permission Model**: Role-based access (business admin, business user, client user)

## Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

### Optional (Email Integration)
```env
SENDGRID_API_KEY=<sendgrid-key>               # Email notifications for invitations
SENDGRID_FROM_EMAIL=noreply@yourdomain.com    # Sender email address
```

See `.env.example` for template. Never commit actual credentials to Git.

## Code Conventions

- **Path Aliases**: `@/*` resolves to `src/*` (both projects)
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **File Organization**: Group by feature/feature-module
- **Server vs Client**: Use `'use client'` for interactive components, keep data fetching in Server Components
- **Error Handling**: Try-catch blocks at API boundaries, user-friendly error messages via toast/dialog
- **Type Safety**: Strict TypeScript mode enabled, Zod for runtime validation

## ESLint Configuration

- **AIO Platform**: ESLint 9 with Next.js core-web-vitals + TypeScript support (eslint.config.mjs)
- **LinkedIn Post Manager**: ESLint 8 with Next.js core-web-vitals (.eslintrc.json)

Run `npm run lint` or `npm lint` to check code quality.

## Testing

**AIO Platform**: Uses Vitest (configured in vitest.config.ts)
- Run tests: `npm test`
- Watch mode: `npm test -- --watch`
- Coverage: `npm run test:coverage`

## Database Schema (Supabase PostgreSQL)

### Authentication
- `auth.users` - User accounts (Supabase Auth managed)

### Business Management
- `users` - Extended user profiles (business owners)
- `organizations` - Organization/company data
- `team_members` - Team member assignments

### CRM
- `contacts` - Contact records (individuals, companies)
- `deals` - Sales pipeline deals
- `deal_stages` - Kanban pipeline stages
- `deal_activities` - Activity log for deals
- `tasks` - Task management
- `projects` - Project information

### Time & Finance
- `time_entries` - Time tracking entries
- `invoices` - Invoice records
- `invoice_items` - Line items for invoices

### Client Portal
- `client_users` - Client portal users (external)
- `client_projects` - Client-facing projects
- `client_files` - Shared files with clients
- `client_credentials` - Encrypted credentials storage
- `client_messages` - Client-business messaging
- `registration_tokens` - Client invitation tokens
- `client_activities` - Client activity audit log

### Automation
- `automation_rules` - Workflow automation definitions
- `automation_executions` - Execution history and logs
- `campaigns` - Marketing campaigns

## Performance Considerations

- **Image Optimization**: Use `next/image` with remote pattern allowlist for external images
- **Code Splitting**: Next.js automatic route-based splitting
- **Bundle Size**: Monitor dependencies, prefer lightweight alternatives
- **Database**: Use indexes on frequently filtered columns, implement pagination
- **Real-time Updates**: Supabase Realtime for live data sync (configured in some components)

## Debugging

- **Chrome DevTools**: React DevTools extension helpful for component inspection
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for TypeScript errors and runtime warnings
- **Supabase Console**: Verify database queries, auth, and real-time subscriptions

## Deployment

Both projects follow standard Next.js deployment:
- **Vercel**: Recommended (native Next.js support, automatic deployments from GitHub)
- **Self-hosted**: `npm run build && npm run start`
- **Environment Variables**: Set via platform UI or `.env.local` (local only, never commit)

See DEPLOYMENT_GUIDE.md for detailed instructions.

## Recent Work Context

### Current Focus Areas
1. **CRM Kanban Board**: Carousel-style deal pipeline with responsive stage navigation and dynamic visibility calculations
2. **Client Portal**: Multi-tenant client management with secure file sharing and messaging
3. **Design System**: Visuo aesthetic implementation with glassmorphism, gradient effects, and smooth animations across all UI

### Known Issues & Solutions
- **Safari 4-Finger Swipe**: Window focus change causes stage count loss in Kanban board
  - **Solution**: Track `maxMeasuredCountRef` with recovery logic - when measured count < max, restore to previous maximum
- **Scrollbar Visibility**: Navigation bar height collapses in flexbox layout
  - **Solution**: Add `min-w-0` to scrollbar container, wrap in flex parent with explicit height, use ResizeObserver with debounce
- **Cross-browser Timing**: Different browsers report container width at different times
  - **Solution**: Multiple measurement attempts at staggered intervals (100ms, 250ms, 400ms, 600ms, 900ms)

## Useful Resources

- Supabase Docs: https://supabase.com/docs
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- Radix UI: https://www.radix-ui.com/docs/primitives/overview/introduction
- React Query: https://tanstack.com/query/latest
- Zod: https://zod.dev

## Notes for Future Development

### Code Organization
- **Type Definitions**: Place domain types in `/src/types` directory, keep React component props in files
- **Feature Isolation**: Group related components, hooks, and utilities by feature folder
- **API Routes**: Use Next.js App Router pattern with RLS (Row-Level Security) for Supabase queries
- **Server vs Client**: Maximize Server Components for data fetching, use `'use client'` sparingly for interactivity

### Development Practices
- **Environment**: Use `.env.local` for local development (never commit). Use `.env.example` as template
- **Testing**: Write tests for complex business logic (calculations, state), use `npm run test:coverage`
- **Performance**: Monitor bundle size, use React Query for data caching, avoid unnecessary re-renders
- **Git Workflow**:
  - Commits: Use conventional format (feat:, fix:, docs:, style:, refactor:, chore:)
  - Branches: Use feature branches (feature/feature-name, bugfix/bug-description)
  - Pull Requests: Include description of changes and testing approach

### Database Practices
- **Row-Level Security**: Always enable RLS policies in Supabase, verify in API routes
- **Relationships**: Use foreign key constraints to maintain data integrity
- **Indexes**: Add indexes on frequently filtered columns (user_id, organization_id, status fields)
- **Real-time**: Use Supabase Realtime for live updates, but implement optimistic UI updates for better UX

### UI/UX Guidelines
- **Accessibility**: Use semantic HTML, ARIA labels for complex components, test with keyboard navigation
- **Mobile-First**: Design components responsive, test on multiple viewport sizes
- **Loading States**: Always show loading spinners and disable buttons during requests
- **Error Handling**: Display user-friendly error messages via sonner toasts, log errors to console for debugging

### Security
- **Never hardcode secrets** in code or commit to repository
- **Validate input** at API boundaries, use Zod for runtime validation
- **Sanitize output** to prevent XSS, especially for user-generated content
- **Check auth** in Server Components and middleware before processing sensitive data

## Agent Task Completion Policy

**When a prompt is provided, the agent MUST complete absolutely every task it can do autonomously. Only escalate/defer tasks to the user that the agent cannot complete.**

### What This Means

1. **Execute fully**: Don't stop at planning, understanding, or asking questions. Execute the implementation end-to-end.
2. **Use all available tools**: Use Read, Glob, Grep, Bash, Edit, Write, and specialized agents (Explore, Plan) to accomplish tasks.
3. **Fix, don't report**: If you find bugs or issues while executing, fix them immediately instead of just reporting them.
4. **Run tests and verify**: After making changes, run tests, lint checks, type checking, and manual verification to ensure the work is complete and correct.
5. **Create commits**: Commit your work to git with proper commit messages (follow conventional commits format).
6. **Only defer when blocked**: Only ask the user or defer work if:
   - The task requires external credentials (API keys, secrets) that aren't configured
   - The task requires user decisions on design/approach that weren't specified
   - The task requires capabilities outside the agent's scope (e.g., running a physical device test)
   - A pre-condition is missing (e.g., a dependency isn't installed and can't be installed)

### High-Autonomy Execution Pattern

Follow this pattern for every prompt:
1. **Understand**: Quickly assess what's being asked
2. **Plan** (if complex): Use the Plan agent to design the approach, then proceed without waiting for approval
3. **Execute**: Implement immediately using all available tools
4. **Verify**: Test the changes work as intended
5. **Commit**: Save work to git
6. **Report**: Summarize what was done

### Examples of Full Completion

- **"Add a new feature"** → Design + implement + test + commit. Don't ask "should I proceed?"
- **"Debug this error"** → Find the bug, fix it, verify the fix, commit. Don't just report the bug.
- **"Refactor this code"** → Read, refactor, test, lint, commit. Do the full job.
- **"Create a script"** → Write the script, test it, commit it. Deliver a complete working solution.

### When to Escalate

Only escalate if one of these is true:
- User hasn't provided required credentials (missing `NEXT_PUBLIC_SUPABASE_URL`, etc.)
- Design decision wasn't specified ("should the button be red or blue?")
- Major architectural choice needed that impacts multiple systems
- External service is unavailable and task requires it
- Task requires privileged operations the agent can't perform
