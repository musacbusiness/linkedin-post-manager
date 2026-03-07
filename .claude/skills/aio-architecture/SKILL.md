---
name: aio-architecture
description: >
  Provides deep architectural reference for AIO Platform. Auto-load when working on:
  CRM Kanban carousel stages, ResizeObserver scroll logic, Safari stage count loss bug,
  scrollbar thumb proportional sizing, Client Portal registration tokens, multi-tenant
  credential storage, deal pipeline stages, client_users table, client_messages,
  Supabase RLS row-level security patterns, or any of these DB tables: contacts, deals,
  deal_stages, client_users, client_projects, client_credentials, registration_tokens,
  time_entries, invoices, invoice_items, automation_rules, campaigns.
user-invocable: false
---

# AIO Platform Architecture Deep Dive

This skill provides detailed architectural references for complex AIO Platform systems.

## Reference Files (read when relevant to current task)

- **`reference/kanban.md`** — CRM Kanban carousel implementation: ResizeObserver setup, stage count formula, Safari fix with `maxMeasuredCountRef`, proportional scrollbar thumb calculation
- **`reference/client-portal.md`** — Multi-tenant Client Portal: registration token flow, credential encryption, permission model (business admin/user/client user), real-time messaging
- **`reference/db-schema.md`** — Complete database schema with all 20+ tables and their relationships: business management, CRM, time & finance, client portal, automation

Load the relevant file when implementing features that touch these areas.
