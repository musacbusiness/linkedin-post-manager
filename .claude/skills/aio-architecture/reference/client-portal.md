# Client Portal Architecture

## Multi-Tenant Model

Clients access the platform via **secure registration tokens**:

1. Business admin generates invitation link with token (stored in `registration_tokens` table)
2. Client visits `/client/register?token=[uuid]`
3. Client creates account, token is consumed (linked to `client_users`)
4. Client gains access to assigned projects via `client_projects` junction table

**Token Structure**: UUID (128-bit), scoped to specific organization_id

## Credential Management

Clients need to store credentials (API keys, social logins, etc.) securely.

**Encryption**: Credentials stored encrypted in `client_credentials` table:
- Column: `encrypted_value` (AES-256 with Supabase encryption)
- Column: `credential_type` (enum: api_key, social_login, email_password, etc.)
- Column: `label` (user-visible name, e.g., "LinkedIn API")
- Access limited by RLS: user can only see own credentials

**Storage Categories**:
- `social_credentials` — Facebook, Instagram, LinkedIn tokens
- `api_credentials` — Third-party API keys (Zapier, etc.)
- `login_credentials` — Account credentials for external services
- Platform credentials are never stored — only in .env.local

## Permission Model

Role-based access control via `role` column in `client_users`:

- **business_admin**: Owner of account, can invite clients, manage projects, view all data
- **business_user**: Team member, can view/edit assigned projects, cannot manage invites
- **client_user**: External client, can only view projects shared with them

**RLS Enforcement**:
- All client_* tables have policies checking `auth.uid()` + role
- Business users can only see data from their organization
- Clients can only see their own records and shared projects

## File Organization

Files shared with clients organized by category:

- **contracts** — Legal agreements, statements of work
- **scope** — Deliverables, project scope documents
- **credentials** — Encrypted credential storage (see above)
- **deliverables** — Work product files, designs, code, reports

Stored in `client_files` table with `category` enum field.

## Real-Time Messaging

Client-business communication with read receipts:

**Table**: `client_messages`
- Columns: `id`, `conversation_id`, `user_id`, `content`, `created_at`, `read_at`
- Read receipt: if `read_at` is null, message unread; set `read_at = now()` when client reads

**Permissions**: RLS allows users to only see messages in their conversations

## Implementation Files

- Routes: `src/app/client/register/page.tsx`, `src/app/client/dashboard/page.tsx`, `src/app/client/projects/page.tsx`
- API: `src/app/api/client/register`, `src/app/api/client/auth`, `src/app/api/clients/*`
- Components: `src/components/client/*` (portal-specific UI)
