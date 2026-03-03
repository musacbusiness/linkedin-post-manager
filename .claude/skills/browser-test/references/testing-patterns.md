# AIO Platform - Testing Patterns Reference

Detailed testing strategies for each feature area of the AIO Platform (ScaleAxis).

---

## Authentication Testing Patterns

### Login Page (`/login`)

**Element identifiers from source:**
- Email input: `id="email"`, type=email, placeholder="you@example.com"
- Password input: `id="password"`, type=password, placeholder="••••••••"
- Submit button: type=submit, text="Sign in" / "Signing in..." (loading state)
- Error container: `bg-red-50 dark:bg-red-900/50` (only visible on error)
- Sign up link: Link to `/signup`

**Test scenarios:**

1. Empty form submission
   - Expected: Browser native validation fires on email field (type=email + required)
   - The form uses native HTML5 validation, not client-side JS validation

2. Invalid email format
   - Fill email with "notanemail", leave password empty
   - Expected: Browser validation error on email field

3. Valid email, wrong password
   - Fill with valid email format + wrong password
   - Click Sign in
   - Expected: Error div appears with Supabase error message (usually "Invalid login credentials")
   - Network: POST to Supabase auth endpoint should return 400

4. Valid credentials
   - Expected: `window.location.href = '/dashboard'` fires (hard redirect)
   - Use `wait_for(["Welcome back"])` to confirm dashboard loaded
   - No console errors

5. Loading state
   - After clicking Sign in, button text should change to "Signing in..."
   - Button should be `disabled` (opacity-50)

**Script to check auth state:**
```javascript
() => {
  const cookies = document.cookie;
  return cookies.includes('sb-') ? 'Has Supabase session cookie' : 'No session cookie found';
}
```

### Signup Page (`/signup`)

**Element identifiers from source:**
- Full name input: `id="fullName"`, type=text
- Email input: `id="email"`, type=email
- Password input: `id="password"`, type=password
- Confirm password input: `id="confirmPassword"`, type=password
- Submit button: text="Sign up" / "Creating account..."

**Validation rules (from source code):**
- Passwords must match (client-side check before Supabase call)
- Password minimum length: 6 characters
- On success: shows confirmation screen with green checkmark, not redirect

**Test scenarios:**
1. Password mismatch - fill new/confirm with different values, expect error
2. Password too short - fill with "abc", expect "Password must be at least 6 characters"
3. Successful signup - expect success state (checkmark + "Check your email")
4. Already registered email - expect Supabase error message

---

## Dashboard Testing Patterns

### Dashboard Home (`/dashboard`)

**Key elements from source:**
- Heading: "Welcome back, [name]!" (Server Component)
- Stats grid: 4 StatCards with titles "Total Contacts", "Active Deals", "Campaigns", "Automations"
- Stats use Suspense with skeleton loading fallback
- Quick Actions grid: 4 links to `/dashboard/contacts/new`, `/dashboard/deals/new`, `/dashboard/campaigns/new`, `/dashboard/automations/new`

**Test scenarios:**
1. Verify all 4 stats cards render with numeric values or "0"
2. Verify Quick Actions links are clickable and navigate correctly
3. Check network for 4 parallel Supabase queries (contacts, deals, campaigns, automations count)
4. Verify Suspense skeleton shows during loading then disappears

**Script to verify stats loaded (not skeletons):**
```javascript
() => {
  const skeletons = document.querySelectorAll('.animate-pulse');
  return { skeletonCount: skeletons.length, loaded: skeletons.length === 0 };
}
```

---

## CRM Kanban Testing Patterns

### Pipeline Page (`/dashboard/crm`)

**Key elements from source:**
- Container: `ref={kanbanRef}` - the main scrollable kanban wrapper
- Scrollbar track: `ref={scrollbarRef}` - has debug title attribute
- Scrollbar thumb: `ref={scrollbarThumbRef}` - blue, draggable
- Left arrow: SVG button, `disabled={currentStageOffset === 0}`
- Right arrow: SVG button, `disabled={currentStageOffset >= stages.length - visibleStageCount}`
- Pipeline selector: `PipelineSelector` component (dropdown)

**Loading redirect:** If no pipelines exist, the page immediately redirects to `/dashboard/crm/templates/wizard`. Test for this.

**Visible stage calculation:** `Math.floor((availableWidth + 16) / (250 + 16))` where `availableWidth = containerWidth - 48`. Verify this at different viewport widths:
- 1440px viewport → expect ~5 stages visible
- 800px viewport → expect ~2-3 stages visible
- 375px viewport → expect 1 stage visible

**Scrollbar debug script:**
```javascript
() => {
  const scrollbar = document.querySelector('[title*="Scrollbar Debug"]');
  return scrollbar ? scrollbar.getAttribute('title') : 'Scrollbar element not found';
}
```

**Test scenarios:**
1. Pipeline loads: verify pipeline name appears in selector
2. Deals load: verify deal cards appear in stage columns
3. Arrow navigation: click right arrow, verify offset changes, verify scrollbar thumb moves right
4. Arrow disable states: when at offset=0, left arrow must be disabled
5. Responsive resize: change viewport width and verify stage count adjusts
6. Scrollbar drag: mousedown on thumb and drag to verify offset changes

**Network calls to verify:**
- GET `/api/pipelines` - should return array of pipelines
- GET `/api/deals?pipeline_id=[id]` - should return deals array

---

## Contacts Testing Patterns

### Contacts List (`/dashboard/contacts`)

**Key elements from source:**
- Heading: "Contacts" h1
- "Add Contact" button with Plus icon, links to `/dashboard/contacts/new`
- Loading spinner: `animate-spin rounded-full border-4 border-t-brand-purple`
- Empty state: "No contacts yet" heading with 👥 emoji
- Contacts table: `ContactsTable` component (TanStack Table)

**Test scenarios:**
1. Empty state renders correctly when no contacts exist
2. "Add Contact" button navigates to new contact form
3. If contacts exist: table renders with correct columns
4. Network call: GET `/api/contacts` returns 200 with array
5. Error state: if API fails, `bg-red-50` error div appears

### New Contact Form (`/dashboard/contacts/new`)

Read the source file to identify exact field IDs:
```bash
cat src/app/dashboard/contacts/new/page.tsx
```

General pattern to follow:
1. Fill all required fields
2. Submit form
3. Verify redirect to contacts list or contact detail
4. Check network: POST to Supabase contacts table via client SDK

---

## Invoice Testing Patterns

### New Invoice Form (`/dashboard/invoices/new`)

**Element identifiers from source:**
- Invoice number: `id="invoice_number"` - auto-generated as "INV-00001"
- Client select: `id="contact_id"` - populated from `/api/contacts` equivalent (direct Supabase)
- Project select: `id="project_id"` - optional, populated from Supabase
- Issue date: `id="issue_date"` - pre-filled with today
- Due date: `id="due_date"` - optional
- Tax rate: `id="tax_rate"` - number input, default 0
- Notes: `id="notes"` - textarea
- "Add Item" button (type=button)
- Item fields: description, quantity, unit price inputs (no IDs, indexed by position)
- Submit: "Create Invoice" button, `disabled={loading || items.length === 0}`

**Important behaviors from source:**
- Submit is disabled until at least 1 line item is added
- When project is selected, `loadTimeEntries` fires and may show "Import N Time Entries" button
- After successful creation, redirects to `/dashboard/invoices/[invoice.id]`
- Uses `alert()` for errors (not toast) - will trigger a browser dialog
- Totals recalculate live as quantity/unit_price change

**Test scenarios:**
1. Submit with no items - submit button should be disabled (opacity-50)
2. Add item, verify subtotal appears
3. Change quantity/price, verify amount updates
4. Remove item, verify it disappears
5. Full form fill + submit - handle potential `alert()` dialog with `handle_dialog`

**Script to verify total calculation:**
```javascript
() => {
  const totalEl = document.querySelector('.text-lg.font-bold span:last-child');
  return totalEl ? totalEl.textContent : 'Total element not found';
}
```

---

## Settings Testing Patterns

### Settings Page (`/dashboard/settings`)

**Tab structure from source:** Profile, Account, Preferences tabs using state (`activeTab`)

**Profile Tab fields:**
- Full Name: type=text, no ID (use label text to find)
- Company Name: type=text
- Phone Number: type=tel
- Timezone: `<select>` with 11 timezone options

**Account Tab:**
- Shows current email address (read-only display)
- Password change form: "New Password" + "Confirm New Password"
- Sign Out button (calls `window.location.href = '/login'`)

**Preferences Tab:**
- 3 checkboxes for notification preferences
- Save button is `disabled` (Coming Soon)

**Test scenarios:**
1. Tab switching - click each tab, verify content changes
2. Profile form submit - uses `alert()` on success/error (handle dialog)
3. Password mismatch - fill new/confirm with different values, expect `alert("New passwords do not match")`
4. Password too short - fill with <8 chars, expect alert
5. Sign out - click button, verify `window.location.href` changes to `/login`

---

## Client Portal Testing Patterns

### Client Registration (`/client/register`)

The client portal uses registration tokens. This flow is:
1. Business sends client an invitation with a token
2. Client visits `/client/register?token=[token]`
3. Client creates their account

**Note:** This requires a valid registration token. To test, either:
- Read source to understand token structure: `src/app/client/register/page.tsx`
- Use the admin flow to generate a token first

### Client Dashboard (`/client/dashboard`)

Separate from the main dashboard. Client users have limited access:
- View their assigned projects
- View shared files
- View invoices
- Message the business

---

## Responsive Testing Patterns

Test these breakpoints for any page:

| Breakpoint | Width | Test focus |
|-----------|-------|------------|
| Mobile S | 375px | Sidebar collapsed, hamburger menu |
| Mobile L | 428px | iPhone Plus/Max |
| Tablet | 768px | Sidebar behavior at md: breakpoint |
| Desktop | 1280px | Standard desktop |
| Wide | 1440px | Primary development width |

**Sidebar behavior:**
- Mobile (<lg): sidebar is `hidden lg:fixed` - not visible, no hamburger implemented yet
- Desktop (lg+): sidebar is fixed 64px wide (w-64 = 256px / 16 = 16rem, actually lg:w-64)
- Content offset: `lg:pl-64` on the main content wrapper

**Viewport emulation commands:**
```
emulate(viewport: {width: 375, height: 812, isMobile: true, hasTouch: true})  // Mobile
emulate(viewport: {width: 1440, height: 900})  // Desktop
emulate(viewport: null)  // Reset to default
```
