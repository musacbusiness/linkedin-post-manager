# Make.com LinkedIn Posting Guide

## Overview
This guide explains how to set up a Make.com automation that:
1. Polls for posts ready to publish (scheduled_time has arrived)
2. Posts to LinkedIn API
3. Updates Supabase with `posted_at` timestamp and LinkedIn URL
4. Streamlit app automatically reflects the status

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Streamlit App                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. User approves post → Auto-schedules                  │ │
│ │ 2. Sets scheduled_time to random 8-10am/12-2pm/5-7pm   │ │
│ │ 3. Saves to Supabase                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database (posts table)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ status: "Approved"                                      │ │
│ │ scheduled_time: "2026-02-15T09:20:00"                   │ │
│ │ posted_at: NULL (until Make.com updates)                │ │
│ │ linkedin_url: NULL (until Make.com updates)             │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Make.com Automation                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Trigger: Every 5 minutes                             │ │
│ │ 2. Query Supabase for posts where:                      │ │
│ │    - scheduled_time <= NOW                              │ │
│ │    - posted_at IS NULL                                  │ │
│ │ 3. For each post:                                       │ │
│ │    a. Get title, content, image_url                     │ │
│ │    b. Post to LinkedIn API                              │ │
│ │    c. Get LinkedIn post URL                             │ │
│ │    d. Update Supabase:                                  │ │
│ │       - posted_at = NOW                                 │ │
│ │       - linkedin_url = LinkedIn URL                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database (UPDATED)                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ status: "Approved"                                      │ │
│ │ scheduled_time: "2026-02-15T09:20:00"                   │ │
│ │ posted_at: "2026-02-15T09:20:15" ✅ UPDATED             │ │
│ │ linkedin_url: "https://linkedin.com/feed/..." ✅ SET    │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Streamlit App (Auto-Refreshes)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Shows: ✅ Posted: Feb 15 at 09:20 AM                    │ │
│ │ Link: [View on LinkedIn →] (clickable)                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Make.com Automation Setup

### Step 1: Create New Scenario

1. Go to **Make.com → Create new scenario**
2. Name it: `LinkedIn Auto-Post to App` or similar
3. Choose trigger: **Schedule (Clock)**
   - Run every **5 minutes**
   - Time zone: Your timezone

### Step 2: Add HTTP Module to Query Supabase

1. Click **+** to add module
2. Search for **HTTP**
3. Select **Make a request**

**Configuration:**
```
URL: https://your-supabase-url/rest/v1/posts?select=*&scheduled_time=lte.{NOW}&posted_at=is.null

Method: GET

Headers:
  Content-Type: application/json
  apikey: your-supabase-anon-key
  Authorization: Bearer your-supabase-anon-key

Query Parameters:
  select: *
  scheduled_time: lte.{NOW}
  posted_at: is.null
```

**Example URL:**
```
https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts?select=*&scheduled_time=lte.2026-02-15T09:25:00&posted_at=is.null
```

### Step 3: Parse Response

1. Add **JSON module** to parse response
2. Map the posts array from HTTP response

### Step 4: Loop Through Posts

1. Add **Iterator** module
2. Set to iterate over posts array
3. For each post:
   - Extract: title, post_content, image_url, id

### Step 5: Post to LinkedIn API

1. Add **HTTP** module for LinkedIn
2. Use LinkedIn Share API endpoint:

**Configuration:**
```
URL: https://api.linkedin.com/v2/ugcPosts

Method: POST

Headers:
  Authorization: Bearer {YOUR_LINKEDIN_ACCESS_TOKEN}
  Content-Type: application/json
  LinkedIn-Version: 202401

Body (JSON):
{
  "author": "urn:li:person:{YOUR_LINKEDIN_PERSON_ID}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "{post_content}"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "media": "urn:li:digitalmediaAsset:{ASSET_URN}"
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Note:** LinkedIn API is complex. If you need help with this step, consider using:
- **Make.com's LinkedIn connector** (simpler)
- A wrapper service like **Buffer** or **Hootsuite**

### Step 6: Extract LinkedIn Post URL

After successful post, Make.com returns a URN. Format it as:
```
https://www.linkedin.com/feed/update/{POST_ID}
```

### Step 7: Update Supabase Record

1. Add **HTTP** module for Supabase update
2. Update the post record:

**Configuration:**
```
URL: https://your-supabase-url/rest/v1/posts?id=eq.{POST_ID}

Method: PATCH

Headers:
  Content-Type: application/json
  apikey: your-supabase-anon-key
  Authorization: Bearer your-supabase-anon-key

Body (JSON):
{
  "posted_at": "{CURRENT_TIMESTAMP}",
  "linkedin_url": "{LINKEDIN_POST_URL}",
  "updated_at": "{CURRENT_TIMESTAMP}"
}
```

---

## Example Make.com Scenario (Simplified)

Here's a simplified version using Make.com's built-in connectors:

```
[CLOCK TRIGGER]
  ↓
[SUPABASE - SELECT RECORDS]
  Query: SELECT * FROM posts
         WHERE scheduled_time <= NOW()
         AND posted_at IS NULL
  ↓
[ITERATOR]
  For each post
  ↓
[HTTP - POST TO LINKEDIN]
  POST /ugcPosts with title, content, image
  ↓
[PARSE RESPONSE]
  Extract linkedin_post_id
  ↓
[SUPABASE - UPDATE RECORD]
  UPDATE posts SET:
    - posted_at = NOW()
    - linkedin_url = formatted_linkedin_url
  WHERE id = current_post_id
```

---

## Field Mapping

Your Supabase fields that Make.com needs to handle:

| Field | Type | Purpose | Set By |
|-------|------|---------|--------|
| `status` | varchar | Post status | App (Approved) |
| `scheduled_time` | timestamp | When to post | App (auto-scheduled) |
| `title` | text | Post title | App (user input) |
| `post_content` | text | Post body | App (user input) |
| `image_url` | varchar | Post image URL | App (from Replicate) |
| **`posted_at`** | timestamp | When posted | **Make.com (on success)** |
| **`linkedin_url`** | varchar | LinkedIn post link | **Make.com (on success)** |

---

## Step-by-Step Make.com Setup (Detailed)

### 1. Create Scenario
- New → Scenario
- Name: "Post to LinkedIn"
- Trigger: Schedule (Clock) → Every 5 minutes

### 2. Query for Ready Posts

Module 1: **HTTP - Make a request**

```
GET https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts
```

Headers:
```
apikey: [YOUR-SUPABASE-KEY]
Authorization: Bearer [YOUR-SUPABASE-KEY]
```

URL Parameters:
```
select: id,title,post_content,image_url,scheduled_time
status: eq.Approved
posted_at: is.null
scheduled_time: lte.now()
```

### 3. Parse JSON

Module 2: **JSON → Parse JSON**
- Input: Body from HTTP response

### 4. Iterate Posts

Module 3: **Iterator**
- Array: `body` from HTTP module
- For each item, do next steps...

### 5. Post to LinkedIn

Module 4: **HTTP - POST to LinkedIn**

**OR use Make's LinkedIn connector if available**

### 6. Update Supabase

Module 5: **HTTP - PATCH to Supabase**

```
PATCH https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts?id=eq.[POST_ID]
```

Body:
```json
{
  "posted_at": "{{ now }}",
  "linkedin_url": "https://linkedin.com/feed/update/[POST_ID]",
  "updated_at": "{{ now }}"
}
```

---

## Testing

1. **Manually approve a post** in Streamlit app
2. **Wait 5 minutes** for Make.com to run
3. **Check Streamlit app** - should show "✅ Posted" status
4. **Click "View on LinkedIn"** link to verify

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Posts not showing as posted | Check Make.com execution history for errors |
| LinkedIn posting fails | Verify LinkedIn API credentials and access token |
| Supabase update fails | Check API key and URL in Make.com |
| Scheduled time not triggering | Ensure scheduled_time is in correct format (ISO 8601) |

---

## Environment Variables Needed for Make.com

Store these in Make.com Variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `LINKEDIN_ACCESS_TOKEN` - LinkedIn OAuth access token
- `LINKEDIN_PERSON_ID` - Your LinkedIn person URN

---

## App Changes Made

✅ Added `render_posted_indicator()` function to show posted status
✅ Updated post card to display "✅ Posted" with date/time
✅ Added "View on LinkedIn" link in post editor metadata
✅ Automatically refreshes when you view posts

---

## What User Sees in App

### Before Posting
```
🔵 Approved
📅 Scheduled: Feb 15 at 09:20 AM
```

### After Posting (Auto-Updates)
```
🔵 Approved
✅ Posted: Feb 15 at 09:20 AM • [View on LinkedIn →]
```

---

## Next Steps

1. Get LinkedIn API access
2. Set up Make.com scenario following steps above
3. Test with one post
4. Adjust as needed
5. Run automation continuously

Let me know if you need help setting up Make.com!
