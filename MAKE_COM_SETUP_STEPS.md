# Make.com Setup - Step-by-Step Guide

## Prerequisites

Before starting, gather these values:

```
SUPABASE_URL: https://ehybwxxbrsykykiygods.supabase.co
SUPABASE_KEY: [YOUR-SUPABASE-ANON-KEY from .env]
LINKEDIN_ACCESS_TOKEN: [Get from LinkedIn API console]
LINKEDIN_PERSON_ID: urn:li:person:[YOUR-ID]
```

---

## PART 1: Get LinkedIn Credentials

### Step 1: Create LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**
3. Fill in:
   - **App name**: LinkedIn Post Manager
   - **LinkedIn Page**: Select your company page
   - **App logo**: Upload any image
4. Accept terms and create
5. Go to **Settings** tab
6. Copy **Client ID** and **Client Secret**

### Step 2: Get Access Token

**Option A: Using Make.com LinkedIn Connector (EASIER)**
- Make.com will handle OAuth automatically
- Just authorize when prompted

**Option B: Manual (ADVANCED)**
1. Use LinkedIn OAuth 2.0 flow
2. Get authorization code
3. Exchange for access token
4. Token valid for ~60 days

For now, use **Option A** (Make.com handles it)

### Step 3: Find Your LinkedIn Person ID

1. Go to your LinkedIn profile
2. Check URL: `linkedin.com/in/your-username/`
3. Person ID format: `urn:li:person:ABC123XYZ`
4. If needed, use LinkedIn API to get it

---

## PART 2: Create Make.com Scenario

### Step 1: Create New Scenario

1. Go to https://make.com
2. Click **Create a new scenario**
3. **Name it**: "LinkedIn Auto Post"
4. Click **Create**

### Step 2: Add Clock Trigger

1. Click the **+** (add module)
2. Search for **Schedule (Clock)**
3. Select it
4. **Configure:**
   - **Repeat every**: 5 minutes
   - **Time zone**: Your timezone (e.g., America/New_York)
5. Click **OK**

**Result**: Scenario will run every 5 minutes

---

## PART 3: Query Supabase for Ready Posts

### Step 1: Add HTTP Request Module

1. Click **+** after the clock
2. Search for **HTTP**
3. Select **Make a request**

### Step 2: Configure GET Request

**Method**: GET

**URL**:
```
https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts
```

**Headers** (add these):

| Key | Value |
|-----|-------|
| `apikey` | `[YOUR-SUPABASE-KEY]` |
| `Authorization` | `Bearer [YOUR-SUPABASE-KEY]` |
| `Content-Type` | `application/json` |

**Query string** (add as parameters):

```
select=id,title,post_content,image_url,scheduled_time
status=eq.Approved
posted_at=is.null
scheduled_time=lte.2026-02-15T23:59:59
order=scheduled_time.asc
```

**Advanced options:**
- Parse response: **YES** (JSON)

### Step 3: Test the Query

1. Click **Run once** (play button)
2. Check output - should show array of posts ready to post
3. Scroll down to see the response data

**Example response:**
```json
[
  {
    "id": "abc-123",
    "title": "My Post Title",
    "post_content": "Post content here",
    "image_url": "https://...",
    "scheduled_time": "2026-02-15T09:20:00"
  }
]
```

---

## PART 4: Iterate Through Posts

### Step 1: Add Iterator Module

1. Click **+** after HTTP module
2. Search for **Iterator**
3. Select it

### Step 2: Configure Iterator

**Array**: Click in field, then select:
- **body** from the HTTP module response

This makes the scenario repeat once for each post found

**Result**: Each post will be processed individually

---

## PART 5: Post to LinkedIn

### Option A: Using Make.com LinkedIn Connector (RECOMMENDED)

#### Step 1: Add LinkedIn Module

1. Click **+** after Iterator
2. Search for **LinkedIn**
3. Select **Post a share** (or similar)

#### Step 2: Connect Your LinkedIn Account

1. Click **Add connection**
2. Login with LinkedIn
3. Authorize the app
4. Select your profile/page

#### Step 3: Configure Post Content

Map these fields:

| Field | Source |
|-------|--------|
| **Text** | `post_content` from HTTP module |
| **Image** | `image_url` from HTTP module |
| **Visibility** | PUBLIC |

#### Step 4: Test

1. Click **Run once**
2. Check LinkedIn - post should appear!
3. Copy the post ID from response

---

### Option B: Manual HTTP POST (ADVANCED)

If Make.com LinkedIn connector not available:

#### Step 1: Add HTTP Module

1. Click **+** after Iterator
2. Search for **HTTP**
3. Select **Make a request**

#### Step 2: Configure LinkedIn API Call

**Method**: POST

**URL**:
```
https://api.linkedin.com/v2/ugcPosts
```

**Headers**:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer [ACCESS-TOKEN]` |
| `Content-Type` | `application/json` |
| `LinkedIn-Version` | `202401` |

**Body** (JSON mode):

```json
{
  "author": "urn:li:person:[YOUR-PERSON-ID]",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "{{post_content}}"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "media": "urn:li:digitalmediaAsset:[ASSET-ID]"
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Complex - requires media upload first**

---

## PART 6: Extract LinkedIn Post URL

### Step 1: Parse Response

If using Make.com LinkedIn module, extract:
- **Post URL** from response
- Usually in format: `https://www.linkedin.com/feed/update/xxxxxxxxx/`

### Step 2: Format URL

1. Click **+** after LinkedIn module
2. Search for **Text Formatter** or **String Functions**
3. Extract/format the LinkedIn URL

**Example URL format**:
```
https://www.linkedin.com/feed/update/6945612345678901234
```

---

## PART 7: Update Supabase Record

### Step 1: Add HTTP PATCH Module

1. Click **+** after URL extraction
2. Search for **HTTP**
3. Select **Make a request**

### Step 2: Configure PATCH Request

**Method**: PATCH

**URL**:
```
https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts?id=eq.{{id}}
```

Note: Replace `{{id}}` with the post ID from Iterator

**Headers**:

| Key | Value |
|-----|-------|
| `apikey` | `[YOUR-SUPABASE-KEY]` |
| `Authorization` | `Bearer [YOUR-SUPABASE-KEY]` |
| `Content-Type` | `application/json` |

**Body** (JSON mode):

```json
{
  "posted_at": "{{now}}",
  "linkedin_url": "{{linkedin_post_url}}",
  "updated_at": "{{now}}"
}
```

Replace `{{linkedin_post_url}}` with actual URL from Step 6

### Step 3: Test

1. Click **Run once**
2. Check Supabase:
   - `posted_at` should have timestamp
   - `linkedin_url` should have LinkedIn link
3. Refresh Streamlit app - should show "✅ Posted"

---

## COMPLETE SCENARIO FLOW

```
┌──────────────┐
│ CLOCK        │ Every 5 minutes
│ (Trigger)    │
└──────┬───────┘
       ↓
┌──────────────────┐
│ HTTP GET         │ Query Supabase for posts
│ (Query posts)    │ WHERE posted_at IS NULL
└──────┬───────────┘
       ↓
┌──────────────────┐
│ ITERATOR         │ Loop through each post
│ (For each post)  │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ LINKEDIN MODULE  │ Post to LinkedIn
│ (Post)           │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ HTTP PATCH       │ Update Supabase
│ (Update record)  │ Set posted_at + linkedin_url
└──────────────────┘
```

---

## Configuration Summary

### Supabase Connection

**GET Query** (HTTP Module 1):
```
GET https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts
Headers:
  apikey: [KEY]
  Authorization: Bearer [KEY]
Parameters:
  select: id,title,post_content,image_url,scheduled_time
  status: eq.Approved
  posted_at: is.null
```

### LinkedIn Connection

**Method**: Use Make.com LinkedIn connector (simpler)
- Or: Manual HTTP POST to `/v2/ugcPosts`

### Supabase Update

**PATCH** (HTTP Module 3):
```
PATCH https://ehybwxxbrsykykiygods.supabase.co/rest/v1/posts?id=eq.{{id}}
Headers:
  apikey: [KEY]
  Authorization: Bearer [KEY]
Body:
  {
    "posted_at": "{{now}}",
    "linkedin_url": "{{linkedin_url}}"
  }
```

---

## Testing Checklist

- [ ] Clock trigger configured (every 5 minutes)
- [ ] HTTP GET query returns posts
- [ ] Iterator loops through results
- [ ] LinkedIn connection authorized
- [ ] Post appears on LinkedIn
- [ ] Supabase record updated with `posted_at`
- [ ] Streamlit app shows "✅ Posted" status
- [ ] LinkedIn URL link is clickable in app

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No posts returned | Check: scheduled_time <= NOW, posted_at IS NULL, status = Approved |
| LinkedIn posting fails | Verify access token is valid, person ID correct |
| Supabase update fails | Check API key, URL format, PATCH syntax |
| Scenario doesn't run | Ensure clock trigger is enabled, check execution history |
| Wrong LinkedIn account | Re-authorize connection with correct LinkedIn account |

---

## Environment Variables to Add to Make.com

Store these in Make.com **Variables** for security:

1. Go to scenario settings
2. Click **Variables**
3. Add:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://ehybwxxbrsykykiygods.supabase.co` |
| `SUPABASE_KEY` | `[your-key]` |
| `LINKEDIN_ACCESS_TOKEN` | `[your-token]` |
| `LINKEDIN_PERSON_ID` | `urn:li:person:[your-id]` |

Then reference as: `{{SUPABASE_URL}}`, etc.

---

## Save & Enable

1. Click **Save** (top right)
2. Toggle **Enabled** (bottom left) to turn on automation
3. Scenario will now run every 5 minutes
4. Check **Execution history** for logs

---

## Verify It Works

### In Streamlit App:

1. Approve a post (auto-schedules)
2. Wait 5 minutes for Make.com to run
3. Post should appear on LinkedIn
4. Refresh Streamlit app
5. Status should show: **✅ Posted: [time] • View on LinkedIn**

### In Make.com:

1. Check **Execution history**
2. All modules should be green (success)
3. Look for errors in red boxes

### In Supabase:

1. Check posts table
2. Find your post
3. Verify:
   - `posted_at` = current timestamp
   - `linkedin_url` = LinkedIn post link

---

## Next Steps

1. **Setup steps 1-3** first (Get credentials)
2. **Build scenario** steps 4-7 (Create in Make.com)
3. **Test with one post**
4. **Enable** for production
5. **Monitor** execution history for issues

If you get stuck on any step, let me know the error and I can help troubleshoot!
