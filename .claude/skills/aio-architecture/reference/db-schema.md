# AIO Platform Database Schema Reference

## Authentication
- `auth.users` — Supabase Auth managed table, contains email, password_hash, created_at

## Business Management
- `users` — Extended profiles (user_id FK to auth.users, full_name, avatar_url, phone)
- `organizations` — Company/org data (org_id PK, name, slug, plan_tier, billing_email)
- `team_members` — Org membership (user_id FK, org_id FK, role: admin/member, joined_at)

## CRM
- `contacts` — Contact records (contact_id PK, org_id FK, name, email, phone, company, created_by FK)
- `deals` — Sales pipeline deals (deal_id PK, contact_id FK, pipeline_id FK, stage_id FK, amount, probability, created_at, closed_at)
- `deal_stages` — Pipeline stages (stage_id PK, pipeline_id FK, name, position, color)
- `deal_activities` — Activity log (activity_id PK, deal_id FK, activity_type, notes, created_by FK)
- `tasks` — Task records (task_id PK, assigned_to FK, related_deal_id FK, title, description, due_date, status)
- `projects` — Project info (project_id PK, org_id FK, name, description, status, budget, start_date, end_date)

## Time & Finance
- `time_entries` — Time tracking (entry_id PK, user_id FK, project_id FK, duration_hours, date, notes)
- `invoices` — Invoice records (invoice_id PK, client_id FK, invoice_number, issue_date, due_date, total_amount, status)
- `invoice_items` — Line items (item_id PK, invoice_id FK, description, quantity, unit_price, amount)

## Client Portal
- `client_users` — Client portal users (client_user_id PK, org_id FK, email, password_hash, role, created_at)
- `client_projects` — Client-facing projects (client_project_id PK, project_id FK, client_user_id FK, access_level)
- `client_files` — Shared files (file_id PK, client_project_id FK, file_url, category: contracts/scope/deliverables/credentials, uploaded_by FK)
- `client_credentials` — Encrypted credentials (credential_id PK, client_user_id FK, credential_type, label, encrypted_value, created_at)
- `client_messages` — Conversation (message_id PK, conversation_id FK, user_id FK, content, created_at, read_at)
- `registration_tokens` — Client invites (token_id PK, token UUID, org_id FK, created_by FK, expires_at, used_at)
- `client_activities` — Audit log (activity_id PK, client_user_id FK, action, ip_address, created_at)

## Automation
- `automation_rules` — Workflow rules (rule_id PK, org_id FK, trigger_event, action, config JSON, enabled)
- `automation_executions` — Execution log (execution_id PK, rule_id FK, status: success/failed, error_message, executed_at)
- `campaigns` — Marketing campaigns (campaign_id PK, org_id FK, name, status, start_date, end_date, budget)

## Key Constraints
- All tables have `created_at` and `updated_at` timestamps
- RLS (Row-Level Security) enforced on all tables
- Foreign keys maintain referential integrity
- Indexes on: user_id, org_id, contact_id, deal_id, project_id, status fields
- Unique constraints on email, invoice_number per org, tokens
