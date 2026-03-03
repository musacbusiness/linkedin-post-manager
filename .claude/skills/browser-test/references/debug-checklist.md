# AIO Platform - Systematic Debugging Checklist

A step-by-step diagnostic approach for common issues in the AIO Platform.

---

## Level 1: Quick Health Check

Run these 5 steps first before any deeper investigation:

**Step 1 - Server running?**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Expected: 200. If not: `cd /Users/musacomma/Agentic\ Workflow/aio-platform && npm run dev`

**Step 2 - Environment variables set?**
```bash
cat /Users/musacomma/Agentic\ Workflow/aio-platform/.env.local | grep -v "^#" | grep "="
```
Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Step 3 - Any TypeScript errors?**
```bash
cd /Users/musacomma/Agentic\ Workflow/aio-platform && npx tsc --noEmit 2>&1 | head -50
```

**Step 4 - Console clean on page load?**
Use `list_console_messages(types: ["error", "warn"])` immediately after navigation.

**Step 5 - All network requests successful?**
Use `list_network_requests()` and look for any non-2xx status codes.

---

## Level 2: Authentication Issues

### Symptom: Redirected to /login unexpectedly

**Cause tree:**
1. **No session cookie** - User not logged in. Solution: Complete login flow.
2. **Expired session** - Supabase session expired. Solution: Login again. Check if middleware is refreshing sessions correctly in `src/middleware.ts`.
3. **Missing user in database** - Auth user exists but no profile. Check Supabase dashboard.

**Diagnostic script:**
```javascript
() => {
  const allCookies = document.cookie.split(';').map(c => c.trim());
  const supabaseCookies = allCookies.filter(c => c.startsWith('sb-'));
  return {
    hasSBCookies: supabaseCookies.length > 0,
    cookieNames: supabaseCookies.map(c => c.split('=')[0])
  };
}
```

**Source files to check:**
- `/Users/musacomma/Agentic Workflow/aio-platform/src/middleware.ts`
- `/Users/musacomma/Agentic Workflow/aio-platform/src/lib/supabase/server.ts`

### Symptom: 401 from API routes

**Source:** API routes call `supabase.auth.getUser()`. If returns no user → 401.

Check the pattern in any API route - they all follow:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Fix:** Ensure the request includes the session cookie. If testing with `evaluate_script` or direct fetch, the cookie is automatically included.

---

## Level 3: Data Loading Issues

### Symptom: Page shows empty state despite data existing in DB

**Checklist:**
1. Check network tab for the data-fetching API call: `list_network_requests(resourceTypes: ["fetch"])`
2. Check if the request was made at all (it may be conditional on some state)
3. Check the response body with `get_network_request(reqid)`
4. Verify the API route queries the right table with the right `user_id` filter
5. Check if Supabase RLS (Row Level Security) is blocking the query

**Diagnostic for contacts page (pattern applies to all):**
```javascript
async () => {
  const resp = await fetch('/api/contacts');
  const data = await resp.json();
  return { status: resp.status, count: Array.isArray(data) ? data.length : 'not array', data: data };
}
```

### Symptom: Spinner never disappears (infinite loading)

**Cause tree:**
1. **API call never completes** - Check network for pending request
2. **API call fails silently** - Error was caught but `setLoading(false)` not in finally block
3. **useEffect dependency issue** - Effect not firing

**Find the loading state source:**
Grep for the spinner class:
```
Grep pattern: "animate-spin" in the component files
```
Then read that file to find the `setLoading(false)` call and verify it's in a `finally` block.

### Symptom: Data appears then disappears (flicker)

Usually a React Query cache invalidation issue or a `useEffect` running multiple times.

**Check:** Is `useRealtimePosts` or a similar realtime hook subscribed? Realtime updates trigger re-fetches. Check if there's an `INSERT` event causing a re-render that clears optimistic state.

---

## Level 4: Form & Validation Issues

### Symptom: Form submits but nothing happens

**Checklist:**
1. Check if submit button is actually `disabled` - `evaluate_script(() => document.querySelector('button[type="submit"]').disabled)`
2. Check if `e.preventDefault()` is being called (it should be on all form handlers)
3. Check network tab for the POST request - was it made?
4. Check console for error in the submit handler
5. Look for `alert()` calls - they may be hidden behind a dialog

**Common pattern in this app:** Several forms use `alert()` instead of toast. After form submission, use `handle_dialog(action: "accept")` to dismiss.

### Symptom: Calculated totals don't update in invoice form

The invoice form recalculates totals in the `updateItem` function when `quantity` or `unit_price` change. The `amount` field is set as: `updated[index].quantity * updated[index].unit_price`.

**Diagnostic script:**
```javascript
() => {
  // Find all amount display divs in invoice items
  const amounts = document.querySelectorAll('[class*="bg-gray-50"][class*="rounded-lg"] .font-medium');
  return Array.from(amounts).map(el => el.textContent);
}
```

---

## Level 5: CRM Kanban-Specific Issues

### Symptom: Kanban shows wrong number of stages / stages disappear

This is the Safari 4-finger swipe / window focus bug documented in CLAUDE.md.

**Diagnostic:**
```javascript
() => {
  const kanban = document.querySelector('[class*="overflow-x-auto"]');
  if (!kanban) return 'Kanban container not found';
  return {
    clientWidth: kanban.clientWidth,
    scrollWidth: kanban.scrollWidth,
    scrollLeft: kanban.scrollLeft
  };
}
```

**Expected values:**
- `clientWidth`: Should match ~(viewport - 256px sidebar) for desktop
- If `clientWidth` is 0 or very small: layout issue, check flexbox

**Source of truth for calculation:** `/Users/musacomma/Agentic Workflow/aio-platform/src/app/dashboard/crm/page.tsx`, lines 56-79.

### Symptom: Scrollbar thumb width = 0 or stuck at minimum (30px)

Check the `[Scrollbar]` console debug messages:
```
list_console_messages(types: ["log"])
```
Then filter for messages starting with "[Scrollbar]". They show: `scrollbarWidth`, `totalStages`, `visibleStageCount`, `currentStageOffset`.

If `scrollbarWidth` is 0: The scrollbar container has no width. Check flexbox layout - the scrollbar uses `flex-1 min-w-0`.

**Source:** `/Users/musacomma/Agentic Workflow/aio-platform/src/app/dashboard/crm/page.tsx`, lines 347-378.

### Symptom: Arrow buttons don't respond to clicks

Check if they are in disabled state:
```javascript
() => {
  const buttons = document.querySelectorAll('button[title="Scroll left"], button[title="Scroll right"]');
  return Array.from(buttons).map(b => ({
    title: b.title,
    disabled: b.disabled,
    opacity: getComputedStyle(b).opacity
  }));
}
```

---

## Level 6: Visual / UI Issues

### Symptom: Glassmorphic styles not applying (no blur, no transparency)

**Check:**
1. Is dark mode active? The gradient overlay is `dark:block hidden` - only shows in dark mode
2. Check `backdrop-filter` support: `evaluate_script(() => CSS.supports('backdrop-filter', 'blur(10px)'))`
3. Verify Tailwind CSS loaded: `evaluate_script(() => getComputedStyle(document.body).getPropertyValue('--tw-bg-opacity') !== '')`

### Symptom: Purple brand color not showing

The brand color is `#6b4ceb` (CSS: `bg-[#6b4ceb]`). If it's not showing:
1. Check Tailwind config includes the arbitrary value support
2. Look for `bg-brand-purple` class - this may be a custom utility defined in globals.css

**Check the CSS variables:**
```javascript
() => {
  const style = getComputedStyle(document.documentElement);
  return {
    primaryColor: style.getPropertyValue('--color-brand-purple') || 'not defined as CSS var',
    bodyBg: getComputedStyle(document.body).backgroundColor
  };
}
```

### Symptom: Animations not running (Framer Motion)

The CRM page uses Framer Motion `motion.div` with `pageVariants`. If animations are not showing:
1. Check if `useReducedMotion` is returning `true` - this disables animations per user system preference
2. Check if `prefersReducedMotion` system setting is enabled on the test machine

**Diagnostic:**
```javascript
() => window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

---

## Level 7: Performance Issues

### Collecting a Performance Trace

For any page suspected of being slow:

1. Navigate to the target URL first
2. `performance_start_trace(reload: true, autoStop: true)`
3. Interact with the page (scroll, click, navigate)
4. `performance_stop_trace()`
5. Review the insights, especially:
   - `LCPBreakdown` - Largest Contentful Paint
   - `DocumentLatency` - Time to first byte
   - `RenderBlocking` - Scripts/styles blocking render

### Common Performance Issues in This App

**Dashboard stats slow to load:**
- Stats are in a Suspense boundary with `revalidate = 30`
- First load fetches 4 Supabase queries in parallel via `Promise.all`
- Network tab should show 4 simultaneous requests to Supabase REST API

**CRM Kanban with many deals:**
- Each stage renders a column with deal cards
- If many deals: check if virtual scrolling is implemented in `KanbanBoard`
- Memory snapshot can reveal if deal card components are being properly unmounted on navigation

### Memory Leak Check

Run when suspecting memory leaks (after extensive navigation):
```
take_memory_snapshot(filePath: "/tmp/aio-heap-snapshot.heapsnapshot")
```
Then look for detached DOM nodes or retained React component trees.

---

## Error Pattern Quick Reference

| Error message | Likely cause | File to check |
|--------------|-------------|---------------|
| "Unauthorized" in API response | Supabase session missing | `src/lib/supabase/server.ts` |
| "Failed to fetch contacts/deals/etc" | Supabase query error or RLS | `src/app/api/[resource]/route.ts` |
| "Failed to fetch pipelines" | No pipelines or API error | `src/app/api/pipelines/route.ts` |
| React hydration error | Server/client HTML mismatch | The relevant page component |
| "window is not defined" | Server-side code calling browser API | Check if component needs `'use client'` |
| `NEXT_PUBLIC_SUPABASE_URL` undefined | Missing env variable | `.env.local` |
| "new row violates row-level security" | Missing RLS policy | Supabase dashboard → policies |
| "duplicate key value" | Inserting record with conflicting unique key | API route's insert logic |

---

## Fix Workflow

When you identify a bug and have a fix ready:

1. **Read the full file** first to understand context
2. **Apply minimal edit** - change only what's needed to fix the issue
3. **Reload the page**: `navigate_page(type: "reload", ignoreCache: true)`
4. **Wait for content**: `wait_for(["expected text after fix"])`
5. **Check console again**: `list_console_messages(types: ["error", "warn"])` - verify error is gone
6. **Check network**: Verify the previously-failing request now returns 200
7. **Take screenshot**: Document the fixed state
8. **Report**: Include before/after in the test report
