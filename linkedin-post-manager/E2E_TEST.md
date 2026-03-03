# End-to-End Test: Auto-Posting Flow

This document provides step-by-step instructions to test the complete auto-posting flow from post scheduling to make.com delivery.

## Prerequisites

- Dev server running: `npm run dev`
- Logged into the app (authenticated)
- Access to browser DevTools console (F12)
- Make.com webhook endpoint configured and receiving posts

## Test Scenario

### Step 1: Create a Test Post

1. Go to http://localhost:3000/dashboard
2. Click "New Post" or navigate to `/posts/new`
3. Fill in:
   - **Title**: "Test Auto-Post - [timestamp]"
   - **Content**: "This is a test post to verify auto-posting functionality."
4. Click "Create"
5. **Save the post ID** from the URL (e.g., `/posts/abc-123-def-456`)

### Step 2: Approve and Schedule the Post

1. Navigate to the post: `/posts/[id]`
2. Click "Approve & Schedule"
3. **Verify**: Status changes to "Scheduled" (purple badge)
4. **Note the scheduled time** shown in the UI

### Step 3: Set Post to Past Time (for immediate testing)

Since we need to test immediately, we'll move the scheduled time to the past:

1. Open browser DevTools (F12) → Console tab
2. Run this command to get the post ID from URL:
   ```javascript
   const postId = window.location.pathname.split('/').pop()
   console.log('Post ID:', postId)
   ```

3. Schedule it for 5 minutes ago:
   ```javascript
   const pastTime = new Date(Date.now() - 5 * 60000).toISOString()
   console.log('Scheduling for:', pastTime)

   fetch(`/api/posts/${postId}/schedule-custom`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-cron-secret': 'your-secure-cron-secret-here'
     },
     body: JSON.stringify({ scheduledTime: pastTime })
   })
   .then(r => r.json())
   .then(d => console.log('Scheduled:', d))
   ```

4. **Verify**: Status remains "Scheduled" with past time

### Step 4: Trigger the Auto-Post Cron Job

Since the cron doesn't run automatically on localhost, manually trigger it:

1. In DevTools console, run:
   ```javascript
   fetch('/api/posts/auto-post', {
     method: 'GET',
     headers: {
       'x-cron-secret': 'your-secure-cron-secret-here'
     }
   })
   .then(r => r.json())
   .then(d => {
     console.log('Auto-post result:', d)
     console.log('Posts posted:', d.postedCount)
     if (d.results) {
       d.results.forEach(r => {
         console.log(`- Post ${r.postId}: ${r.success ? '✅ SENT' : '❌ FAILED'}`)
       })
     }
   })
   ```

2. **Check output**: Should show `postedCount: 1` and the post as successful

### Step 5: Verify Post Status Changed

1. Refresh the page or check the post detail
2. **Expected**: Status badge changes to "Posted"
3. **Color**: Should be dark purple/indigo

### Step 6: Verify Make.com Received the Post

1. Go to your Make.com scenario history
2. Look for the most recent execution
3. **Verify webhook received**:
   - JSON body contains: `id`, `title`, `post_content`, `image_url`, `scheduled_time`
   - Example payload:
     ```json
     {
       "id": "abc-123",
       "title": "Test Auto-Post",
       "post_content": "This is a test post...",
       "image_url": null,
       "scheduled_time": "2026-03-03T15:00:00.000Z"
     }
     ```

## Expected Results

✅ **Test Passes If**:
- Post created successfully
- Post scheduled with "Scheduled" status
- Auto-post endpoint triggered successfully
- Post status changes to "Posted"
- Make.com received the webhook payload
- Webhook payload contains all expected fields

## Troubleshooting

### Post not created
- Check browser console for errors
- Verify you're logged in
- Check Supabase connection

### Approval/scheduling fails
- Verify `CRON_SECRET` value is correct
- Check browser console for error messages
- Verify Supabase connection

### Auto-post endpoint returns error
- Check browser console output
- Verify `CRON_SECRET` header is correct
- Check if there are validation errors in the response
- Look for error details in the response body

### Status not updating to "Posted"
- Refresh the page to see updated status
- Check Supabase dashboard to verify status changed in database
- Look at API response for any errors

### Make.com didn't receive webhook
- Verify webhook URL is correct in `.env.local`
- Check Make.com webhook execution history
- Verify the URL is accessible (test with curl)
- Check if Make.com has any filtering or rate limiting
- Look at API logs for webhook response status

## Automated Testing (curl)

If you prefer testing via curl, use this script:

```bash
#!/bin/bash

# 1. Generate a test post
echo "📝 Generating test post..."
RESULT=$(curl -s -X POST http://localhost:3000/api/posts/generate-batch \
  -H "x-cron-secret: your-secure-cron-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"count": 1}')

echo "Generation result: $RESULT"

# 2. Trigger auto-post (finds already scheduled posts)
echo ""
echo "🚀 Triggering auto-post..."
RESULT=$(curl -s -H "x-cron-secret: your-secure-cron-secret-here" \
  http://localhost:3000/api/posts/auto-post)

echo "Auto-post result: $RESULT"

# Check if posts were sent
POSTED=$(echo $RESULT | grep -o '"postedCount":[0-9]*' | cut -d: -f2)
echo ""
echo "✓ Posts sent: $POSTED"
```

## Full Test Timeline

```
T+0:00 - Create post (Title: "Test Auto-Post - [timestamp]")
T+0:30 - Approve & Schedule post
T+1:00 - Move scheduled_time to 5 minutes ago
T+1:30 - Trigger auto-post endpoint manually
T+1:45 - Verify status changed to "Posted"
T+2:00 - Check Make.com webhook execution history
T+2:30 - Verify webhook received payload with all fields
```

## Success Criteria

| Step | Criterion | Status |
|------|-----------|--------|
| 1 | Post created | ✅ |
| 2 | Post approved and scheduled | ✅ |
| 3 | Status shows "Scheduled" | ✅ |
| 4 | Scheduled time moved to past | ✅ |
| 5 | Auto-post endpoint triggered | ✅ |
| 6 | API returns postedCount: 1 | ✅ |
| 7 | Post status changes to "Posted" | ✅ |
| 8 | Make.com webhook executed | ✅ |
| 9 | Webhook payload received correctly | ✅ |

## Notes

- The test uses `x-cron-secret` header to authenticate with protected endpoints
- On production (Vercel), crons run automatically on schedule
- On localhost, crons must be triggered manually for testing
- Timestamps should be in ISO 8601 format (UTC)
- All times are in UTC; adjust for your timezone if testing with scheduled_time in the future
