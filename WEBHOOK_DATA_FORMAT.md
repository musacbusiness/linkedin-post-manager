# Webhook Data Format Reference

## Overview

The Modal cron job sends webhooks to Make.com with post data ready to post to LinkedIn. This document shows the exact format and field mappings.

---

## Webhook Payload (Sent by Modal Cron)

### URL
```
POST {{MAKE_LINKEDIN_WEBHOOK_URL}}
```

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "record_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Building in Public: How Automation Changed Everything",
  "content": "For the past 3 months, I've been building an automation system that...",
  "image_url": "https://supabase-storage.../generated-images/20260215_092000_550e8400.jpg",
  "timestamp": "2026-02-15T09:20:00"
}
```

---

## Field Descriptions

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `record_id` | UUID | Supabase `posts.id` | Unique post identifier (Supabase UUID) |
| `title` | String | Supabase `posts.title` | Post title (from Streamlit) |
| `content` | String | Supabase `posts.post_content` | Post body text (from Streamlit) |
| `image_url` | String | Supabase `posts.image_url` | LinkedIn image URL (from Supabase Storage) |
| `timestamp` | ISO DateTime | Modal cron job | When webhook was sent |

---

## Webhook → Make.com Mapping

### In Make.com, the webhook data is accessible as:

```
{{1.record_id}}      → Supabase post UUID
{{1.title}}          → LinkedIn post title
{{1.content}}        → LinkedIn post body text
{{1.image_url}}      → LinkedIn post image URL
{{1.timestamp}}      → When webhook was sent
```

**Module number 1** = Your webhook module (first module in the scenario)

---

## Make.com Scenario Structure

Your Make.com scenario should look like this:

```
┌──────────────────────────────────┐
│ MODULE 1: WEBHOOK (Custom)       │
│ Listen for incoming webhooks     │
│ Data: record_id, title, content, │
│       image_url, timestamp       │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│ MODULE 2: LINKEDIN (Post)        │
│ Post to LinkedIn                 │
│ Title:   {{1.title}}             │
│ Content: {{1.content}}           │
│ Image:   {{1.image_url}}         │
│                                  │
│ Returns: post_url, post_id, etc  │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│ MODULE 3: HTTP (PATCH)           │
│ Update Supabase                  │
│ URL: .../posts?id=eq.{{1.record_id}}
│ Body: {                          │
│   "posted_at": "{{now}}",        │
│   "linkedin_url": "{{2.url}}"    │
│ }                                │
└──────────────┬───────────────────┘
               ↓
┌──────────────────────────────────┐
│ MODULE 4: NOTIFICATION (Optional)│
│ Send push notification           │
│ Message: "Posted to LinkedIn!"   │
└──────────────────────────────────┘
```

---

## Example: Actual Webhook Received by Make.com

When a post is ready, Modal cron sends:

```json
{
  "record_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "5 LinkedIn Automation Tips That Actually Work",
  "content": "Most LinkedIn automation tools are overengineered. Here's what actually works:\n\n1. Focus on value\n2. Be consistent\n3. Engage authentically\n\nI built a system that handles all 3...",
  "image_url": "https://supabase-storage.../generated-images/20260215_092000_a1b2c3d4.jpg",
  "timestamp": "2026-02-15T09:20:15"
}
```

### What Make.com does:

1. **LinkedIn Module** receives `title`, `content`, `image_url`
   - Posts to LinkedIn with these values
   - LinkedIn returns post URL (e.g., `https://linkedin.com/feed/update/7012345678901234567`)

2. **HTTP PATCH Module** receives:
   - `{{1.record_id}}` = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - `{{2.url}}` = LinkedIn post URL from LinkedIn module
   - Sends PATCH to Supabase to update the post record

3. **Supabase gets updated:**
   ```sql
   UPDATE posts SET
     posted_at = '2026-02-15T09:20:15Z',
     linkedin_url = 'https://linkedin.com/feed/update/7012345678901234567'
   WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   ```

4. **Streamlit detects update:**
   - Next refresh shows: "✅ Posted: Feb 15 at 09:20 AM"
   - LinkedIn link is clickable

---

## Webhook Validation (Optional)

To validate webhooks in Make.com, you can:

1. Check that `record_id` is not empty
2. Check that `title` is not empty
3. Check that `image_url` is not empty

---

## Timing

### Timeline for a Single Post:

| Time | What Happens |
|------|--------------|
| T+0 | User approves post in Streamlit |
| T+0 | Post saved to Supabase with `scheduled_time` (e.g., 09:20 AM) |
| T+0 | `posted_at` is NULL |
| 09:20 AM | Modal cron runs (every 5 min) |
| 09:20 AM | Cron finds post where `scheduled_time <= NOW` |
| 09:20 AM | Cron sends webhook to Make.com |
| 09:20 AM+5s | Make.com receives webhook |
| 09:20 AM+10s | LinkedIn module posts to LinkedIn |
| 09:20 AM+15s | HTTP PATCH updates Supabase |
| 09:20 AM+20s | Streamlit shows "✅ Posted" (on next refresh) |

**Total time: ~20 seconds from scheduled time to posted on LinkedIn**

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│ Streamlit App                       │
│ User approves post                  │
│ Auto-schedules to 09:20 AM          │
└──────────────┬──────────────────────┘
               ↓
        Saved to Supabase:
        {
          id: UUID,
          title: "...",
          post_content: "...",
          image_url: "...",
          status: "Approved",
          scheduled_time: "2026-02-15T09:20:00",
          posted_at: NULL ← NOT YET
        }
               ↓ (waits for time)
        Modal Cron at 09:20 AM:
        1. Query posts WHERE scheduled_time <= NOW AND posted_at IS NULL
        2. Found: {{ record above }}
               ↓ (sends webhook)
┌──────────────────────────────────────┐
│ Make.com Webhook Receives:           │
│ {                                    │
│   record_id: UUID,                   │
│   title: "...",                      │
│   content: "...",                    │
│   image_url: "..."                   │
│ }                                    │
└──────────────┬───────────────────────┘
               ↓
        LinkedIn Module Posts:
        - Title: {{1.title}}
        - Content: {{1.content}}
        - Image: {{1.image_url}}
               ↓ (LinkedIn creates post)
        Returns: post_url
               ↓
        HTTP PATCH to Supabase:
        UPDATE posts SET
          posted_at = NOW(),
          linkedin_url = post_url
        WHERE id = {{1.record_id}}
               ↓
        Supabase Updated:
        {
          ... (same fields),
          posted_at: "2026-02-15T09:20:15", ← NOW SET
          linkedin_url: "https://linkedin.com/..."  ← NOW SET
        }
               ↓ (Streamlit detects)
┌──────────────────────────────────────┐
│ Streamlit Shows:                     │
│ ✅ Posted: Feb 15 at 09:20 AM       │
│ [View on LinkedIn →] ← clickable     │
└──────────────────────────────────────┘
```

---

## Database Schema Used

### Posts Table Structure

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,                    -- Unique post ID
    title TEXT,                             -- Post title
    post_content TEXT,                      -- Post body
    image_url VARCHAR,                      -- Image URL (Supabase Storage)
    image_prompt TEXT,                      -- Used to generate image
    status VARCHAR,                         -- "Approved" or "Rejected"
    scheduled_time TIMESTAMP,               -- When to post (set on approve)
    posted_at TIMESTAMP,                    -- When posted (set by Make.com)
    linkedin_url VARCHAR,                   -- LinkedIn post URL (set by Make.com)
    created_at TIMESTAMP,                   -- When created
    updated_at TIMESTAMP                    -- When last modified
);
```

### Key Fields for Workflow:

| Field | Set by | Used by | Purpose |
|-------|--------|---------|---------|
| `scheduled_time` | Streamlit | Modal cron | When to post |
| `posted_at` | Make.com | Streamlit | Shows "✅ Posted" status |
| `linkedin_url` | Make.com | Streamlit | Clickable link to post |

---

## Summary

- **Webhook is sent by**: Modal cron job (every 5 minutes)
- **Webhook contains**: record_id, title, content, image_url, timestamp
- **Webhook goes to**: Your Make.com webhook URL
- **Make.com does**: Post to LinkedIn, extract URL, update Supabase
- **Result**: Streamlit shows "✅ Posted" with clickable LinkedIn link

Everything is automated. User just needs to approve a post—the rest happens automatically.
