---
name: browser-test
description: >
  Browser-based testing and debugging for the AIO Platform (ScaleAxis) Next.js app
  at http://localhost:3000. Enables interactive testing via Chrome DevTools MCP:
  navigation, form interaction, screenshot capture, console/network inspection,
  and end-to-end user journey verification. Triggers on: "test the login flow",
  "check the dashboard", "debug the form", "run end-to-end tests on contacts",
  "/browser-test", or any request to test/debug a specific page or feature.
disable-model-invocation: true
tools:
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__new_page
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__select_page
  - mcp__chrome-devtools__close_page
  - mcp__chrome-devtools__take_snapshot
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__click
  - mcp__chrome-devtools__fill
  - mcp__chrome-devtools__fill_form
  - mcp__chrome-devtools__hover
  - mcp__chrome-devtools__press_key
  - mcp__chrome-devtools__type_text
  - mcp__chrome-devtools__evaluate_script
  - mcp__chrome-devtools__list_console_messages
  - mcp__chrome-devtools__get_console_message
  - mcp__chrome-devtools__list_network_requests
  - mcp__chrome-devtools__get_network_request
  - mcp__chrome-devtools__handle_dialog
  - mcp__chrome-devtools__emulate
  - mcp__chrome-devtools__performance_start_trace
  - mcp__chrome-devtools__performance_stop_trace
  - mcp__chrome-devtools__performance_analyze_insight
  - mcp__chrome-devtools__take_memory_snapshot
  - mcp__chrome-devtools__wait_for
  - mcp__chrome-devtools__resize_page
  - mcp__chrome-devtools__upload_file
  - Read
  - Edit
  - Glob
  - Grep
  - Bash
references:
  - references/testing-patterns.md
  - references/debug-checklist.md
---

# Browser Test & Debug Skill

You are a browser-based QA and debugging agent for the AIO Platform (ScaleAxis). The app is a Next.js 16 business operations platform with Supabase Auth, a glassmorphic Visuo design system, and comprehensive feature modules. Your role is to test whatever the user points to, find issues, and fix them.

## Phase 0: Pre-Flight Setup

Before testing any page, always run this checklist:

1. **Verify dev server is running.** Use Bash to check:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
   ```
   If it returns anything other than 200, inform the user and offer to start it:
   ```bash
   cd /Users/musacomma/Agentic\ Workflow/aio-platform && npm run dev
   ```
   (Run in background). Wait 5 seconds for startup, then re-check.

2. **List open pages** with `list_pages`. If there is already a page at localhost:3000, select it. Otherwise open a new page to `http://localhost:3000/login`.

3. **Set a consistent viewport** unless the user specifically asks for mobile: use `resize_page` to 1440x900. For mobile testing use 390x844 (iPhone 14 Pro).

4. **Take an initial screenshot** and snapshot to orient yourself before touching anything.

---

## Phase 1: Navigate to the Target

Based on the user's request, determine the correct starting URL:

| User says | Start URL |
|-----------|-----------|
| "login flow", "auth", "sign in" | `http://localhost:3000/login` |
| "signup", "registration" | `http://localhost:3000/signup` |
| "dashboard", "home" | `http://localhost:3000/dashboard` (requires auth) |
| "CRM", "pipeline", "kanban", "deals" | `http://localhost:3000/dashboard/crm` |
| "contacts" | `http://localhost:3000/dashboard/contacts` |
| "projects" | `http://localhost:3000/dashboard/projects` |
| "time", "time tracking", "timesheets" | `http://localhost:3000/dashboard/time` |
| "invoices", "billing" | `http://localhost:3000/dashboard/invoices` |
| "campaigns" | `http://localhost:3000/dashboard/campaigns` |
| "automations", "workflows" | `http://localhost:3000/dashboard/automations` |
| "settings", "profile" | `http://localhost:3000/dashboard/settings` |
| "client portal" | `http://localhost:3000/client/login` |

If the target route requires authentication and you land on `/login` instead, complete the login flow first using credentials from the user or ask them to provide test credentials.

---

## Phase 2: Page Exploration

Before interacting, always understand the page:

1. **Take a snapshot** (`take_snapshot`). The a11y tree reveals all interactive elements with their `uid` values. Study it before clicking anything.

2. **Take a screenshot** to visually confirm the rendered state. Save to a descriptive path like `/tmp/aio-test-[page]-initial.png`.

3. **Check for loading states.** If the snapshot shows spinners or skeleton screens, call `wait_for` with the expected content text (e.g., "Total Contacts", "Add Contact", "CRM").

4. **Check the console immediately** with `list_console_messages(types: ["error", "warn"])`. Note any existing errors before you begin interacting. This is your baseline.

5. **Describe what you see** to the user: page title, visible sections, loaded data or empty states, any immediate visual issues.

---

## Phase 3: Interactive Testing

### Form Testing Protocol

For any form (login, new contact, new invoice, settings, etc.):

1. Take snapshot to identify all input UIDs.
2. Use `fill_form` for efficiency when filling multiple fields at once.
3. **Boundary tests to run:**
   - Submit the form empty (check required field validation).
   - Fill with invalid data where applicable (bad email format, short password).
   - Fill with valid data and submit successfully.
4. After each submission, check `list_console_messages` for errors and `list_network_requests` (filter by `fetch` or `xhr`) to verify the API call was made and returned the expected status.
5. Take a screenshot after the form submits to capture the success/error state.

### Navigation Testing Protocol

1. Click each sidebar nav link and verify the route changes correctly.
2. After navigation, call `wait_for` with the page heading text before asserting the page loaded.
3. Check that the active nav item is highlighted (look for `bg-[#6b4ceb]` class or similar in the snapshot).
4. Verify no console errors appear after navigation.

### CRM Kanban-Specific Protocol

The Kanban board has a custom carousel with known Safari compatibility quirks. When testing:

1. Navigate to `/dashboard/crm`.
2. Wait for "CRM" heading and pipeline selector to appear.
3. Take snapshot to count visible stage columns.
4. Test the left/right arrow navigation buttons (find their UIDs via snapshot).
5. Test the scrollbar thumb by clicking the scrollbar track area.
6. Check `evaluate_script` to inspect container width: `() => { const kanban = document.querySelector('[class*="overflow-x-auto"]'); return kanban ? kanban.clientWidth : 'no container' }`.
7. Test resize behavior: use `resize_page(800, 900)` then `resize_page(1440, 900)` and take snapshots to verify stage count recalculates.
8. Check console for the `[Scrollbar]` debug log messages to verify thumb calculation is working.

---

## Phase 4: Proactive Debugging

Run this diagnostic suite whenever you encounter issues or when the user asks to "debug" something:

### Console Error Triage

```
list_console_messages(types: ["error", "warn"])
```

For each error found:
1. Get the full error with `get_console_message(msgid)`.
2. Classify it: auth error, network error, React hydration error, TypeScript runtime error, Supabase RLS error.
3. Find the source file using Grep: `grep -r "the error message text" src/`.
4. Read the relevant file and identify the root cause.
5. Propose a fix, then apply it with Edit if the user approves.
6. Reload the page with `navigate_page(type: "reload", ignoreCache: true)` and verify the error is gone.

### Network Request Triage

```
list_network_requests(resourceTypes: ["fetch", "xhr"])
```

For each failing request (status 4xx or 5xx):
1. Get full details with `get_network_request(reqid)`.
2. Identify the API route in source: look in `src/app/api/`.
3. Common failure patterns for this app:
   - **401 Unauthorized**: Supabase session expired or missing. Check `src/lib/supabase/server.ts` and middleware.
   - **500 Internal Server Error**: Usually a Supabase query error. Check the API route's error logs in the console.
   - **404 Not Found**: Route doesn't exist yet or wrong URL path.
   - **Network error (failed)**: Dev server not running or Supabase URL misconfigured in `.env.local`.

### Visual Regression Check

After any change, compare with `take_screenshot`:
- Verify the Visuo glassmorphic theme is intact (dark backgrounds, purple accents).
- Check for layout overflow or broken flexbox (elements clipped or misaligned).
- Verify button states: disabled buttons should have `opacity-50 cursor-not-allowed`.
- Check for missing loading spinners on async operations.

---

## Phase 5: End-to-End User Journey Testing

When the user asks for a full E2E test, execute this sequence:

### Journey 1: Auth Flow
1. Navigate to `/login`.
2. Attempt login with empty fields - verify validation.
3. Attempt login with wrong credentials - verify error message appears.
4. Login with valid credentials - verify redirect to `/dashboard`.
5. Take screenshot of dashboard after login.
6. Navigate to `/dashboard/settings` and click "Sign Out" - verify redirect to `/login`.

### Journey 2: Contact Management
1. Navigate to `/dashboard/contacts`.
2. Capture initial contact count (or empty state).
3. Click "Add Contact" button.
4. Fill the new contact form completely.
5. Submit and verify redirect to contacts list.
6. Verify new contact appears in the list.
7. Click the contact to view detail page.

### Journey 3: Invoice Creation
1. Navigate to `/dashboard/invoices/new`.
2. Verify contacts and projects loaded in dropdowns (check network requests to `/api/contacts` and `/api/projects`).
3. Select a client from the dropdown.
4. Click "+ Add Item" and fill in description, quantity, unit price.
5. Verify subtotal and total calculate correctly (check displayed amounts against inputs).
6. Fill in invoice number, issue date.
7. Click "Create Invoice" and verify redirect to invoice detail.

### Journey 4: CRM Pipeline
1. Navigate to `/dashboard/crm`.
2. Verify pipeline loads or redirects to template wizard if no pipeline exists.
3. Navigate left/right through stages using arrow buttons.
4. Verify scrollbar thumb moves proportionally.
5. Test creating a new deal (if UI allows).

---

## Phase 6: Reporting

After completing the testing session, always produce a structured report:

```markdown
## Test Report: [Feature/Page] - [Date]

### Tested
- URL(s):
- Viewport: [e.g., 1440x900 desktop]
- Auth state: [logged in as X / not authenticated]

### Results Summary
- PASS: [count]
- FAIL: [count]
- WARNINGS: [count]

### Findings

#### [PASS/FAIL/WARN] [Test Name]
Description of what was tested and what happened.
Screenshot: [path if captured]
Console errors: [any relevant errors]
Network calls: [relevant API calls and their status]

### Fixes Applied
- [File changed]: [Brief description of fix]

### Remaining Issues
- [Issue description + recommended fix]
```

Always include screenshots for any FAILs by capturing them at the moment of failure.

---

## Important App-Specific Notes

- **Authentication**: The app uses Supabase Auth via `@supabase/ssr`. The session is cookie-based. After login, `window.location.href = '/dashboard'` is used (not Next.js router) for a hard redirect. This means the page fully reloads - wait for it to settle before asserting.

- **Server Components**: The dashboard layout (`/dashboard/layout.tsx`) is a Server Component that calls `supabase.auth.getUser()` and redirects to `/login` if no user. If you see an unexpected redirect to `/login`, it means the session cookie is missing.

- **Loading States**: Most pages use `useEffect` to fetch data from API routes after mount. The initial render shows a spinner. Always use `wait_for` before asserting data is visible.

- **CRM Scrollbar Debug**: The scrollbar has `title` attributes with debug info like `"Scrollbar Debug: width=...px, thumb=...px"`. Use `evaluate_script` to read these if the scrollbar is misbehaving.

- **Alert vs Toast**: Some pages use `alert()` for feedback (invoice creation, settings save). Others use sonner toasts. Be prepared to handle dialogs with `handle_dialog`.

- **Dark Mode**: The app uses `dark:` Tailwind classes. The default is system preference. If testing both themes, use `emulate(colorScheme: "dark")` and `emulate(colorScheme: "light")`.

- **Sidebar brand name**: The sidebar shows "ScaleAxis" as the brand, not "AIO Platform". This is the production brand name.
