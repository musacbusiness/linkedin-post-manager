# Debugging: Post Content Not Showing in Form

## Issue
Post content is stored in Supabase but not displaying in the Post Editor form when editing a post.

## Root Cause Investigation

We've added comprehensive logging at three levels to trace the exact point of failure:

### 1. **API Route Level** (`/api/posts/[id]`)
- Logs when request is received
- Logs database query results
- Logs post object structure and content field

### 2. **Hook Level** (`usePost` hook)
- Logs API response status and structure
- Logs extracted post object
- Logs post content field specifically

### 3. **Component Level** (Post Editor page)
- Logs when post data loads
- Logs individual field values
- Logs form initialization

## Testing Instructions

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to the **Console** tab
3. Navigate to a post edit page (e.g., `/posts/[post-id]`)
4. Look for log messages starting with:
   - `[API]` - Server-side logs
   - `[usePost]` - Hook logs
   - `=== Post Editor:` - Component logs

### Step 2: Identify Where Data Flow Breaks

**Scenario 1: No logs appear**
- Problem: Component is not calling the hook
- Check: Is `postId` being extracted correctly from params?

**Scenario 2: `[API]` logs appear but no `[usePost]` logs**
- Problem: API request is not being made from the client
- Check: Network tab for failed `/api/posts/[id]` request

**Scenario 3: `[usePost]` logs show API response but no post object**
- Problem: API is returning malformed response
- Check: Look at `[usePost] Raw API response:` log
- Expected: Should see `{ post: { id, title, content, ... } }`

**Scenario 4: `[usePost]` shows post object with content, but `=== Post Editor:` doesn't log form initialization**
- Problem: Post data is fetched but useEffect is not running
- Check: Is the dependency array correct?

**Scenario 5: All logs appear and content length is > 0, but form field is empty**
- Problem: Form field is not being updated by useState
- Check: Browser state using React DevTools

### Step 3: Network Tab Inspection
1. Open **Network** tab in DevTools
2. Navigate to post edit page
3. Filter for XHR/Fetch requests
4. Look for `GET /api/posts/[post-id]`
5. Check:
   - Status: Should be 200
   - Response: Should show `{ "post": { ... } }`
   - Check if `content` field is present and has value

### Step 4: Expected Log Output

**When everything works correctly, you should see:**

```
[API] GET /api/posts/abc123 called with ID: abc123
[API] Authenticated user ID: user-uuid
[API] Querying posts table for post ID: abc123
[API] Successfully retrieved post from database
[API] Post ID: abc123
[API] Post content length: 487
[API] Post content exists: true
[API] Returning response: { post: { ... } }

[usePost] ===== Starting fetch for post ID: abc123
[usePost] Response status: 200
[usePost] Response ok: true
[usePost] Raw API response: { post: { ... } }
[usePost] Extracted post object: { ... }
[usePost] Post content exists: true
[usePost] Post content length: 487
[usePost] ===== Successfully fetched post

=== Post Editor: Post data loaded ===
Post object: { ... }
Post title: "My Post Title"
Post content: "This is the full post content..."
Post content length: 487
=== Form fields updated ===
```

## Common Issues & Solutions

### Issue 1: "Post not found" error
**Logs show:** `[API] Database query error: PGRST116`
**Cause:** Post ID doesn't exist in database or user doesn't have access
**Solution:**
- Verify post ID is correct
- Check if post exists in Supabase dashboard
- Verify RLS policies allow user to read post

### Issue 2: Unauthorized error
**Logs show:** `[API] No authenticated user found`
**Cause:** Session is not valid or expired
**Solution:**
- Log out and log back in
- Check browser cookies have auth token
- Verify Supabase auth is working

### Issue 3: Post content is null or undefined
**Logs show:** `Post content length: 0` or `Post content exists: false`
**Cause:** Content field is not stored in database
**Solution:**
- Check database schema - does posts table have `content` column?
- Verify post was created with content value
- Check for data type mismatch

## Database Verification

To manually check if post content exists in Supabase:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run:
   ```sql
   SELECT id, title, content, content_length FROM posts WHERE id = 'YOUR_POST_ID';
   ```
4. Verify the `content` field has a value

## Next Steps

Once you've gathered the logs:

1. **Share the console logs** from steps 1-2
2. **Share the network response** from the `/api/posts/[id]` request
3. **Share which scenario** matches your observation
4. We can then pinpoint the exact issue and apply a targeted fix

## Rebuild & Test

```bash
# Rebuild the project
npm run build

# Start dev server
npm run dev

# Dev server runs at http://localhost:3000
```

Then test the post editor page and check console logs.
