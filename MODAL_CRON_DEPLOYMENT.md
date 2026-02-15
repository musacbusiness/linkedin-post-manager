# Modal Cron Job Deployment Guide

## Overview

The `modal_cron_posting.py` is a scheduled cron job that runs every 5 minutes on Modal infrastructure to:

1. **Query Supabase** for posts ready to post (scheduled_time ≤ NOW and posted_at IS NULL)
2. **Send to Make.com** webhook with post data (record_id, title, content, image_url)
3. **Make.com handles** posting to LinkedIn and updating Supabase with posted_at + linkedin_url

This replaces Streamlit's inability to run background tasks—Modal runs the job continuously in the cloud.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Streamlit App (User Interface)                          │
│ - Create post → Generate image → Approve               │
│ - Auto-schedule post to random time in 3 windows       │
│ - Save to Supabase (scheduled_time, posted_at=NULL)    │
└────────────────┬────────────────────────────────────────┘
                 ↓ (polls every 5 minutes)
┌─────────────────────────────────────────────────────────┐
│ Modal Cron Job (runs every 5 minutes)                   │
│ 1. Query Supabase:                                      │
│    SELECT * FROM posts                                  │
│    WHERE status="Approved"                              │
│    AND posted_at IS NULL                                │
│    AND scheduled_time <= NOW                            │
│ 2. For each post, send webhook to Make.com              │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Make.com Automation                                     │
│ 1. Receive webhook with post data                       │
│ 2. Post to LinkedIn via LinkedIn API                    │
│ 3. Extract LinkedIn post URL from response              │
│ 4. HTTP PATCH to Supabase:                              │
│    UPDATE posts SET:                                    │
│      posted_at = NOW()                                  │
│      linkedin_url = <extracted URL>                     │
│    WHERE id = record_id                                 │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Supabase Database (UPDATED)                             │
│ - posted_at = timestamp                                 │
│ - linkedin_url = LinkedIn post URL                      │
└────────────────┬────────────────────────────────────────┘
                 ↓ (auto-refresh)
┌─────────────────────────────────────────────────────────┐
│ Streamlit App (Auto-detects update)                     │
│ Shows: ✅ Posted: [time] • [View on LinkedIn]           │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Modal account** - Free tier available at https://modal.com
2. **Environment variables set in Modal** (see setup below)
3. **Make.com webhook URL** - From your existing scenario
4. **Supabase credentials** - Already in your .env

---

## Installation

### Step 1: Install Modal CLI

```bash
pip install modal
```

### Step 2: Authenticate Modal

```bash
modal token new
```

This will:
- Open browser to Modal dashboard
- Generate API token
- Store locally in `~/.modal/token`

Verify with:
```bash
modal status
```

---

## Deployment

### Step 3: Create Modal Environment Secrets

Modal needs your credentials to run the cron job. Create them in Modal dashboard:

**Option A: Via CLI**
```bash
modal secret create linkedin-posting \
  --key SUPABASE_URL \
  --value "https://ehybwxxbrsykykiygods.supabase.co"

modal secret create linkedin-posting \
  --key SUPABASE_KEY \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."

modal secret create linkedin-posting \
  --key MAKE_LINKEDIN_WEBHOOK_URL \
  --value "https://hook.us2.make.com/yr7mo2xefqdjsr3vt6i44tgvajw22i09"
```

**Option B: Via Modal Dashboard**
1. Go to https://modal.com/secrets
2. Create new secret: `linkedin-posting`
3. Add 3 environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `MAKE_LINKEDIN_WEBHOOK_URL`

### Step 4: Deploy the Cron Job

```bash
cd /Users/musacomma/Agentic\ Workflow
modal deploy modal_cron_posting.py
```

**Expected output:**
```
✓ Created app 'linkedin-posting-cron'
✓ Mounted 1 volume 'posting-log'
✓ Scheduled function 'check_and_post_scheduled_posts' every 5 minutes
✓ Deployment complete
```

### Step 5: Monitor the Cron Job

View logs from Modal dashboard:
```bash
modal logs linkedin-posting-cron
```

Or check the log file:
```bash
modal volume ls posting-log
```

---

## How It Works

### Cron Job Execution (Every 5 Minutes)

1. **Query Supabase** for posts where:
   - `status = "Approved"`
   - `posted_at IS NULL`
   - `scheduled_time <= NOW`

2. **For each post:**
   - Extract: `record_id`, `title`, `post_content`, `image_url`
   - Send webhook to Make.com with this data

3. **Webhook payload:**
   ```json
   {
     "record_id": "550e8400-e29b-41d4-a716-446655440000",
     "title": "Building in Public: How Automation Changed Eve",
     "content": "For the past 3 months...",
     "image_url": "https://supabase-storage.../generated-images/...",
     "timestamp": "2026-02-15T09:20:00"
   }
   ```

4. **Make.com receives webhook:**
   - LinkedIn module posts with title/content/image
   - Extracts LinkedIn post URL
   - HTTP PATCH to Supabase updates `posted_at` and `linkedin_url`

5. **Streamlit detects update:**
   - Next time user refreshes, sees "✅ Posted" status
   - LinkedIn URL is clickable

---

## Testing Locally

### Test the cron job without deploying:

```bash
cd /Users/musacomma/Agentic\ Workflow
modal run modal_cron_posting.py
```

This will:
- Connect to your Supabase
- Query for ready posts
- Print what it found
- NOT send to Make.com (to prevent duplicate posts)

---

## Monitoring

### Check Cron Execution

```bash
modal logs linkedin-posting-cron --follow
```

**Example log output:**
```
[2026-02-15T09:15:00] Found 2 posts ready to post
[2026-02-15T09:15:01] ✅ Sent post 550e8400... to Make.com
[2026-02-15T09:15:02] ✅ Sent post 550e8401... to Make.com
[2026-02-15T09:15:03] Cron job completed: {'success': True, 'posts_found': 2, 'posts_processed': 2, ...}
```

### Check for Errors

```bash
modal logs linkedin-posting-cron --follow | grep ERROR
```

### View Posting Log Volume

```bash
modal volume get posting-log posting_cron.log
```

---

## Environment Variables

The cron job reads 3 environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `SUPABASE_URL` | Your Supabase project URL | `.env` |
| `SUPABASE_KEY` | Your Supabase anon key | `.env` |
| `MAKE_LINKEDIN_WEBHOOK_URL` | Your Make.com webhook URL | `.env` or Make.com scenario |

All must be set in Modal secrets for the job to work.

---

## Webhook Configuration in Make.com

Your Make.com scenario should have:

### Webhook Module (receives posts from Modal cron)
```
POST /
Body: record_id, title, content, image_url
```

### LinkedIn Module
```
POST to LinkedIn API
- Title: {{title}}
- Content: {{content}}
- Image: {{image_url}}
```

### HTTP PATCH Module
```
PATCH https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts?id=eq.{{record_id}}
Body: {
  "posted_at": "{{now}}",
  "linkedin_url": "{{linkedin_post_url}}"
}
```

---

## Troubleshooting

### ❌ "Missing environment variables" error

**Cause:** Secrets not set in Modal
**Fix:**
```bash
modal secret create linkedin-posting --key SUPABASE_URL --value "..."
```

### ❌ "No posts ready to post" (but posts exist)

**Check:**
- Is `scheduled_time` in the past? (Should be ≤ NOW)
- Is `status = "Approved"`? (Check Supabase)
- Is `posted_at = NULL`? (Should be empty)

### ❌ "Make.com returned 401" error

**Cause:** Webhook URL invalid or expired
**Fix:**
- Get new webhook URL from Make.com scenario
- Update Modal secret
- Redeploy: `modal deploy modal_cron_posting.py`

### ❌ Posts not appearing on LinkedIn

**Check:**
1. Does cron job log show "Sent to Make.com"?
2. Does Make.com execution history show success?
3. Is `posted_at` field getting updated in Supabase?
4. Refresh Streamlit app to see status update

### ✅ View Real-Time Logs

```bash
modal logs linkedin-posting-cron --follow
```

---

## Update/Redeploy

To change the cron interval (e.g., every 3 minutes instead of 5):

1. Edit `modal_cron_posting.py`:
   ```python
   schedule=modal.Period(minutes=3)  # Changed from 5
   ```

2. Redeploy:
   ```bash
   modal deploy modal_cron_posting.py
   ```

---

## Stopping the Cron Job

To disable the cron job:

```bash
modal app delete linkedin-posting-cron
```

To restart it later:
```bash
modal deploy modal_cron_posting.py
```

---

## Cost

Modal pricing:
- **Free tier**: 100,000 GB-seconds/month (plenty for this use case)
- Cron job runs ~2 seconds every 5 minutes = ~576 executions/day
- Estimate: ~1,152 GB-seconds/month = **Well within free tier**

---

## Next Steps

1. ✅ Deploy cron job: `modal deploy modal_cron_posting.py`
2. ✅ Monitor logs: `modal logs linkedin-posting-cron --follow`
3. ✅ Test with one approved post (wait for scheduled_time)
4. ✅ Verify Supabase gets `posted_at` and `linkedin_url` updates
5. ✅ Check Streamlit shows "✅ Posted" status
6. ✅ Click LinkedIn URL to verify post

---

## Complete End-to-End Test

1. **Streamlit App**: Create and approve a post
2. **Wait 5 minutes** for cron to run (or test locally with `modal run`)
3. **Check Make.com** execution history for webhook receipt
4. **Check Supabase** for `posted_at` and `linkedin_url` fields updated
5. **Refresh Streamlit** - should show "✅ Posted: [time] • [View on LinkedIn]"
6. **Click LinkedIn link** - should open your post on LinkedIn

All data flows:
- ✅ Streamlit → Supabase (on approval)
- ✅ Supabase → Modal cron → Make.com (scheduled time reached)
- ✅ Make.com → LinkedIn (post created)
- ✅ Make.com → Supabase (update posted status)
- ✅ Supabase → Streamlit (auto-refresh shows status)

---

Questions? Check Modal docs: https://modal.com/docs
