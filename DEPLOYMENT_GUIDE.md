# LinkedIn Post Generation - Deployment Guide

## Overview

This guide covers deploying the automated LinkedIn post generation pipeline with daily cron job execution via Modal.

**Current Status**: ✅ All 7-stage pipeline implemented and tested (10/10 end-to-end tests passed)

---

## Phase 1: Pre-Deployment Setup

### 1.1 Verify Environment Configuration

Ensure `.env` file contains all required credentials:

```bash
# Required credentials
ANTHROPIC_API_KEY=sk_test_...
HUGGINGFACE_TOKEN=hf_...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional user profile (if not set, defaults to AI automation consultant)
USER_EXPERTISE=Your expertise here
USER_TARGET_AUDIENCE=Your target audience
USER_TONE=Your tone/style
USER_AVOID=Things to avoid (comma-separated)
```

**Verify:**
```bash
grep -E "ANTHROPIC|HUGGINGFACE|SUPABASE|USER_" .env
```

### 1.2 Update Supabase Schema

Add the following columns to the `posts` table:

```sql
-- Add image_prompt column if not exists
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_prompt TEXT DEFAULT '';

-- Add generation_metadata column if not exists
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Verify the columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('image_prompt', 'metadata');
```

**How to run**:
1. Go to Supabase dashboard (https://supabase.com)
2. Select your project
3. Go to SQL Editor
4. Create new query and paste the SQL above
5. Click "Run"

---

## Phase 2: Local Testing

### 2.1 Test Modal Locally

```bash
# Install Modal CLI
pip install modal

# Authenticate with Modal (one-time setup)
modal token new

# Test the cron job locally
python execution/modal_post_generation.py

# Expected output:
# ============================================================
# 🚀 LINKEDIN POST GENERATION CRON JOB STARTED
# ...
# ============================================================
# ✅ CRON JOB COMPLETE
```

### 2.2 Verify Post Generation

Check that posts were created in Supabase:

```bash
# Query recent posts
curl -X GET "https://YOUR-PROJECT.supabase.co/rest/v1/posts?limit=5&order=created_at.desc" \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json"

# Expected: Array of 5 most recent posts with image_prompt and metadata fields
```

---

## Phase 3: Modal Deployment

### 3.1 Deploy to Modal

```bash
# Deploy the cron job to Modal cloud
modal deploy execution/modal_post_generation.py

# Output should show:
# Deployed! 🎉
# View at: https://modal.com/apps/...
```

### 3.2 Configure Cron Schedule

The cron job is configured to run daily at **9:00 AM UTC**.

To change the schedule, edit `execution/modal_post_generation.py`:

```python
@app.function(
    schedule=modal.Period(days=1),  # Change here:
    # schedule=modal.Period(days=1, hour=14, minute=0)  # For 2 PM UTC
    # schedule=modal.Cron("0 9 * * *")  # For 9 AM UTC (standard cron syntax)
)
def generate_daily_posts():
```

Then redeploy:
```bash
modal deploy execution/modal_post_generation.py
```

### 3.3 Monitor Deployments

```bash
# List all deployed apps
modal app list

# View logs for a specific app
modal logs <app-name>

# View recent runs
modal run execution/modal_post_generation.py --detach

# Stop a running job
modal cancel <job-id>
```

---

## Phase 4: Monitoring & Maintenance

### 4.1 Set Up Alerts

Monitor the cron job for failures:

```bash
# View execution history
modal app logs linkedin-post-generation --tail

# Set up email alerts (in Modal dashboard):
# 1. Go to Modal dashboard
# 2. Navigate to your app
# 3. Settings → Alerts
# 4. Add email for failures
```

### 4.2 Daily Monitoring Checklist

**Every morning, verify**:

1. ✅ Cron job completed successfully
2. ✅ Posts were generated and saved
3. ✅ Quality control passed
4. ✅ Queue maintained 21-post level

**Command to check**:
```bash
# Check last execution
modal app logs linkedin-post-generation | grep -E "CRON JOB|SUCCESS|FAILED" | tail -20

# Count current queue
curl -X GET "https://YOUR-PROJECT.supabase.co/rest/v1/posts?select=id&in=status,[\"Pending Review\",\"Approved\",\"Scheduled\"]" \
  -H "Authorization: Bearer YOUR-ANON-KEY" | jq 'length'
```

### 4.3 Handling Failures

**If cron job fails**:

1. Check logs for error
2. Verify API credentials are still valid
3. Manually trigger generation:
   ```bash
   python execution/modal_post_generation.py
   ```
4. If still failing, check:
   - Anthropic API key validity
   - Supabase connection
   - Rate limits

**If quality control failures increase**:

1. Check `failed_posts` table in Supabase
2. Review failed check criteria
3. Update system prompts if needed (see Root Cause Analysis)
4. Restart cron job:
   ```bash
   modal deploy execution/modal_post_generation.py
   ```

### 4.4 Performance Metrics

Track these metrics weekly:

```sql
-- Count total generated posts
SELECT COUNT(*) as total_generated,
       COUNT(CASE WHEN status = 'Pending Review' THEN 1 END) as pending_review,
       COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
       COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) as scheduled,
       COUNT(CASE WHEN status = 'Posted' THEN 1 END) as posted
FROM posts
WHERE created_at > NOW() - INTERVAL '7 days'
  AND metadata->>'pipeline_version' = 'v1.0';

-- Avg quality score
SELECT AVG((metadata->>'overall_quality')::float) as avg_quality_score,
       MAX((metadata->>'character_count')::int) as max_chars,
       MIN((metadata->>'character_count')::int) as min_chars
FROM posts
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Phase 5: Integration with Streamlit

### 5.1 Update Streamlit UI

Add generation metadata display to `streamlit_app/post_editor.py`:

```python
import streamlit as st
import json

def render_post_metadata(post):
    """Display generation metadata from pipeline"""
    metadata = post.get("metadata", {})

    if isinstance(metadata, str):
        metadata = json.loads(metadata)

    if metadata:
        with st.expander("📊 Generation Details"):
            col1, col2, col3 = st.columns(3)

            with col1:
                st.metric("Framework", metadata.get("framework", "N/A"))
            with col2:
                st.metric("Relevance", f"{metadata.get('relevance_score', 0):.2f}")
            with col3:
                st.metric("Characters", metadata.get("character_count", 0))

            keywords = metadata.get("keywords", [])
            if keywords:
                st.caption(f"**Keywords**: {', '.join(keywords)}")

            quality = metadata.get("overall_quality", "N/A")
            st.caption(f"**Quality Score**: {quality}/10")

            version = metadata.get("pipeline_version", "N/A")
            st.caption(f"**Pipeline Version**: {version}")

# In your post display/editor component:
if post_data:
    render_post_metadata(post_data)
```

### 5.2 Verify Integration

```bash
# Run Streamlit app
streamlit run streamlit_app.py

# Navigate to a generated post
# Should see "Generation Details" section with:
# - Framework (PAS, AIDA, etc.)
# - Relevance score
# - Character count
# - Keywords
# - Quality score
# - Pipeline version
```

---

## Phase 6: Troubleshooting

### Issue: Cron job not running

**Symptoms**: No posts generated, no logs

**Solutions**:
1. Verify deployment: `modal app list`
2. Check Modal token: `modal token show`
3. Redeploy: `modal deploy execution/modal_post_generation.py --force`
4. Check Modal status: https://status.modal.com

### Issue: API key errors (401 Unauthorized)

**Symptoms**:
```
Error code: 401 - {'type': 'error', 'error': {'type': 'authentication_error', 'message': 'invalid x-api-key'}}
```

**Solutions**:
1. Verify API keys in `.env`
2. Check Anthropic API key hasn't expired (https://console.anthropic.com)
3. Check HuggingFace token (https://huggingface.co/settings/tokens)
4. Update `.env` with new credentials
5. Redeploy cron job

### Issue: Posts not saving to Supabase

**Symptoms**:
```
❌ Failed to save post to Supabase
```

**Solutions**:
1. Check Supabase URL and key in `.env`
2. Verify `posts` table exists and has correct schema
3. Check Supabase status: https://status.supabase.com
4. Test connection:
   ```bash
   curl -X GET "https://YOUR-PROJECT.supabase.co/rest/v1/posts?limit=1" \
     -H "Authorization: Bearer YOUR-ANON-KEY"
   ```

### Issue: Quality control failures (high rejection rate)

**Symptoms**:
```
❌ Post failed quality control
```

**Solutions**:
1. Check `failed_posts` table for patterns
2. Review which checks are failing most
3. Update system prompt in `post_generation_pipeline.py` for failing stage
4. Redeploy both:
   - Pipeline code
   - Modal cron job

---

## Phase 7: Scaling & Optimization

### 7.1 Cost Optimization

**Current costs** (~$15-20/month):
- Anthropic API: ~$10/month (QC + RCA)
- HuggingFace: ~$3/month
- Modal: Free tier (includes 100K GB-seconds/month)
- Supabase: Free tier

**To reduce costs**:
- Use Phi-3-Mini for Stage 3 (Framework) instead of Claude
- Cache research results for similar topics
- Increase post generation batch size

**To increase quality** (higher cost, ~$50-100/month):
- Switch to GPT-4o + Perplexity for research
- Use Claude-3.5-Sonnet for all stages
- Reduce retry loop count (currently 3)

### 7.2 Performance Improvements

**Current pipeline speed**: ~1 second per post

**To speed up**:
- Use faster models (Mistral instead of DeepSeek)
- Parallelize stages 1-5 (requires architecture changes)
- Cache topic research by category

**To improve quality**:
- Add human feedback loop
- Implement A/B testing framework
- Track engagement metrics

---

## Deployment Checklist

Before going live, verify:

- [ ] `.env` file has all required credentials
- [ ] Supabase schema updated with image_prompt and metadata columns
- [ ] `modal_post_generation.py` tested locally and passes all posts
- [ ] Modal CLI installed and authenticated
- [ ] Cron schedule configured for desired time
- [ ] Monitoring alerts set up in Modal dashboard
- [ ] Streamlit UI updated to show generation metadata
- [ ] First 3 days monitored and verified working
- [ ] Backup credentials stored securely

---

## Support & Maintenance

**For issues**:
1. Check logs: `modal app logs linkedin-post-generation`
2. Review error patterns in `failed_posts` table
3. Test pipeline locally: `python execution/test_full_pipeline.py`
4. Check API status (Anthropic, Supabase, HuggingFace)

**For enhancements**:
1. Update pipeline stages in `post_generation_pipeline.py`
2. Test with `test_full_pipeline.py`
3. Redeploy: `modal deploy execution/modal_post_generation.py`

**For monitoring**:
- Weekly review of quality metrics
- Monthly cost analysis
- Quarterly performance review

---

## Next Steps

1. ✅ Complete Phase 1: Verify `.env` and Supabase schema
2. ✅ Complete Phase 2: Test Modal locally
3. ⏳ Complete Phase 3: Deploy to Modal cloud
4. ⏳ Complete Phase 4: Monitor for 3 days
5. ⏳ Complete Phase 5: Update Streamlit UI
6. ⏳ Complete Phase 6: Document any issues encountered
7. ⏳ Complete Phase 7: Plan optimization roadmap

**Estimated time to full deployment**: 2-3 hours including testing and monitoring
