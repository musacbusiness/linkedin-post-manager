# Supabase Setup Guide

This guide walks you through migrating from Airtable to Supabase for the LinkedIn Post Manager.

## Why Supabase?

- ✅ **Unlimited API requests** (vs Airtable's limited free tier)
- ✅ **PostgreSQL** (rock-solid, battle-tested)
- ✅ **500MB free storage** (enough for thousands of posts)
- ✅ **No rate limits** on free tier
- ✅ **Easy migration** from Airtable
- ✅ **Better scalability**

---

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Sign Up"**
3. Create account with GitHub or email
4. Create a new project:
   - **Name**: `linkedin-post-manager`
   - **Password**: Strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free

5. Wait 2-3 minutes for project to initialize

---

## Step 2: Get Your Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key (under "Project API keys")

3. Save these securely - you'll need them soon

---

## Step 3: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of `supabase_schema.sql` from this repo
4. Paste into the query editor
5. Click **"Run"**
6. Verify success (you should see the table created)

---

## Step 4: Configure Environment Variables

### Local Development

Add to your `.env` file:

```bash
# Supabase (replaces Airtable)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key

# Remove old Airtable variables (or keep for migration)
# AIRTABLE_API_KEY=...
# AIRTABLE_BASE_ID=...
# AIRTABLE_LINKEDIN_TABLE_ID=...
```

### Streamlit Cloud

1. Go to your Streamlit app settings
2. Click **"Secrets"**
3. Add:

```toml
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-public-key"
```

---

## Step 5: Install Dependencies

```bash
pip install supabase
```

Or add to `requirements.txt`:

```
supabase>=0.0.100
```

---

## Step 6: Update Streamlit App

Update `app.py` to use Supabase instead of Airtable:

**Change this:**
```python
from utils.airtable_client import AirtableClient

@st.cache_resource
def init_clients():
    return {
        "airtable": AirtableClient(),
        "modal": ModalClient(),
    }
```

**To this:**
```python
from utils.supabase_client import SupabaseClient

@st.cache_resource
def init_clients():
    return {
        "airtable": SupabaseClient(),  # Drop-in replacement!
        "modal": ModalClient(),
    }
```

That's it! The SupabaseClient has the same interface as AirtableClient, so no other changes needed.

---

## Step 7: Migrate Data from Airtable (Optional)

If you have existing posts in Airtable:

### Option A: Manual Export/Import

1. **Export from Airtable**:
   - Open your Airtable base
   - Select all records
   - Copy and paste into CSV or JSON

2. **Import to Supabase**:
   - In Supabase, go to **Table Editor**
   - Click **posts** table
   - Click **"Import data"**
   - Upload CSV or JSON file
   - Map columns to match schema

### Option B: Python Migration Script

Create `migrate_to_supabase.py`:

```python
import os
import json
from utils.airtable_client import AirtableClient
from utils.supabase_client import SupabaseClient

# Connect to both
airtable = AirtableClient()
supabase = SupabaseClient()

# Get all posts from Airtable
posts = airtable.get_all_posts()

# Transform to Supabase format
for post in posts:
    fields = post.get("fields", {})

    supabase_post = {
        "title": fields.get("Title", ""),
        "post_content": fields.get("Post Content", ""),
        "image_url": fields.get("Image URL"),
        "status": fields.get("Status", "Draft"),
        "scheduled_time": fields.get("Scheduled Time"),
        "posted_time": fields.get("Posted", None),
        "linkedin_url": fields.get("LinkedIn URL"),
        "revision_prompt": fields.get("Revision Prompt"),
        "revision_type": fields.get("Revision Type"),
        "notes": fields.get("Notes"),
        "topic": fields.get("Topic"),
    }

    try:
        supabase.create_post(supabase_post)
        print(f"✅ Migrated: {supabase_post['title']}")
    except Exception as e:
        print(f"❌ Error: {e}")

print(f"\n✅ Migration complete! {len(posts)} posts transferred.")
```

Run it:
```bash
python migrate_to_supabase.py
```

---

## Step 8: Test the Connection

Create `test_supabase.py`:

```python
from utils.supabase_client import SupabaseClient

client = SupabaseClient()

# Test 1: Count posts
count = client.get_posts_count()
print(f"✅ Posts in database: {count}")

# Test 2: Get all posts
posts = client.get_all_posts()
print(f"✅ Retrieved {len(posts)} posts")

# Test 3: Search
results = client.search_posts("automation")
print(f"✅ Search results: {len(results)} posts")

print("\n✅ Supabase client is working!")
```

Run it:
```bash
python test_supabase.py
```

---

## Step 9: Deploy to Streamlit Cloud

1. Push code to GitHub:
   ```bash
   git add -A
   git commit -m "Migrate from Airtable to Supabase"
   git push origin main
   ```

2. Streamlit will auto-deploy

3. Update Streamlit Secrets with Supabase credentials

4. Refresh app - should now show posts from Supabase!

---

## Field Mapping Reference

| Airtable Field | Supabase Column | Type | Notes |
|---|---|---|---|
| Record ID | id | UUID | Auto-generated |
| Title | title | TEXT | Post title |
| Post Content | post_content | TEXT | Main content |
| Image URL | image_url | TEXT | Link to image |
| Status | status | TEXT | Draft, Scheduled, etc. |
| Scheduled Time | scheduled_time | TIMESTAMP | ISO 8601 format |
| Posted | posted_time | TIMESTAMP | When posted to LinkedIn |
| LinkedIn URL | linkedin_url | TEXT | Post URL on LinkedIn |
| Revision Prompt | revision_prompt | TEXT | AI revision request |
| Revision Type | revision_type | TEXT | Post/Image/Both |
| Notes | notes | TEXT | Audit trail |
| Created | created_at | TIMESTAMP | Auto-set |
| Updated | updated_at | TIMESTAMP | Auto-updated |

---

## Troubleshooting

### "Supabase credentials missing"
**Solution**:
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_KEY`
- Restart Streamlit app
- Check Streamlit Secrets if using Cloud

### "Connection refused"
**Solution**:
- Verify Supabase project is active
- Check credentials are correct (copy-paste from dashboard)
- Ensure project isn't paused (Supabase pauses free projects after 1 week of inactivity)

### "Table doesn't exist"
**Solution**:
- Run the SQL schema again in Supabase SQL Editor
- Check that schema was executed successfully

### "Migration lost some data"
**Solution**:
- Export original Airtable data to CSV first
- Keep Airtable as backup until you verify all posts migrated
- Check field names match exactly (case-sensitive)

---

## What's Different from Airtable?

### ✅ What's Better
- Unlimited API requests
- Much faster queries
- Better for complex filtering
- PostgreSQL > spreadsheet model
- Row-level security available
- Full-text search capable

### ⚠️ What's Different
- UUIDs instead of Airtable record IDs (transparent to you)
- Snake_case columns (title) instead of Title
- No built-in UI editor (but you have Streamlit!)
- Manual schema vs Airtable's drag-and-drop

---

## Next Steps

1. ✅ Create Supabase account
2. ✅ Create database schema
3. ✅ Add environment variables
4. ✅ Install dependencies
5. ✅ Update `app.py`
6. ✅ Migrate data (if needed)
7. ✅ Test connection
8. ✅ Deploy!

---

## Support

For issues:
1. Check [Supabase docs](https://supabase.com/docs)
2. Check Supabase status page for outages
3. Try deleting and recreating the project
4. Contact Supabase support (very responsive!)

---

**You're all set!** Your LinkedIn Post Manager now runs on Supabase with unlimited API requests. 🚀
