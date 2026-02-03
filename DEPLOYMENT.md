# Streamlit LinkedIn Post Manager - Deployment Guide

Complete guide to deploy the event-driven Streamlit frontend with Modal webhook integration.

## Overview

The deployment involves three steps:
1. Update and deploy Modal app with Streamlit webhooks
2. Get Modal webhook URL
3. Deploy Streamlit app to Streamlit Community Cloud

**Current Status: Phase 1 Foundation Complete**
- ✅ Streamlit app structure created
- ✅ Airtable client built
- ✅ Modal client built
- ✅ Modal webhook endpoints added
- ✅ Test verification created
- ⏳ Ready for deployment

---

## Step 1: Deploy Updated Modal App with Streamlit Webhooks

### What Changed

Added new FastAPI endpoint (`streamlit_webhooks()`) to handle event-driven triggers:
- `POST /schedule` - Trigger scheduling for approved posts
- `POST /generate-image` - Trigger image generation
- `POST /revise` - Trigger post revision
- `POST /reject` - Trigger post rejection
- `GET /health` - Health check for Streamlit

### Deployment Process

1. **Navigate to Modal app directory:**
```bash
cd "/Users/musacomma/Agentic Workflow"
```

2. **Deploy updated Modal app:**
```bash
modal deploy cloud/modal_linkedin_automation.py
```

3. **Wait for deployment to complete** (typically 1-2 minutes)

4. **Verify deployment succeeded:**
```bash
modal app list
```

You should see `linkedin-automation` in the list with status "live"

### Get Modal Webhook URL

After successful deployment:

1. **Open Modal dashboard:** https://modal.com/apps/linkedin-automation
2. **Look for the webhook URL** (usually shown in the app details)
3. **Format:** `https://<username>--linkedin-automation-<hash>.modal.run`
4. **Note the Streamlit webhook endpoint:** `https://<username>--linkedin-automation-<hash>.modal.run`

### Test Modal Webhooks

Before deploying Streamlit, verify Modal webhooks work:

```bash
# Test health check
curl -X GET https://<username>--linkedin-automation-<hash>.modal.run/health

# Should return: {"status":"healthy","message":"Streamlit webhooks operational"}

# Test schedule endpoint
curl -X POST https://<username>--linkedin-automation-<hash>.modal.run/schedule \
  -H "Content-Type: application/json" \
  -d '{"record_id": "recXXXXXXXXXXXXXX"}'

# Should return success response
```

---

## Step 2: Update .env File with Modal Webhook URL

1. **Open .env file:**
```bash
nano "/Users/musacomma/Agentic Workflow/.env"
```

2. **Find this line:**
```
MODAL_WEBHOOK_BASE_URL=
```

3. **Add your Modal webhook URL:**
```
MODAL_WEBHOOK_BASE_URL=https://<username>--linkedin-automation-<hash>.modal.run
```

4. **Save and exit** (Ctrl+X, then Y, then Enter)

5. **Verify update:**
```bash
grep MODAL_WEBHOOK_BASE_URL "/Users/musacomma/Agentic Workflow/.env"
```

---

## Step 3: Verify Local Streamlit Setup

Before deploying to cloud, test locally:

1. **Navigate to Streamlit app:**
```bash
cd "/Users/musacomma/Agentic Workflow/streamlit_app"
```

2. **Run setup verification:**
```bash
python3 test_setup.py
```

Expected output:
```
==================================================
SUMMARY
==================================================
✅ PASS: Imports
✅ PASS: Configuration
✅ PASS: Airtable Connection
✅ PASS: Modal Webhooks
✅ PASS: Sample Data

Total: 5/5 tests passed

🎉 All tests passed! App is ready to deploy.
```

3. **Run Streamlit locally:**
```bash
streamlit run app.py
```

You should see:
- App loads at `http://localhost:8501`
- Posts display in table
- API status shows in sidebar
- No errors in console

---

## Step 4: Deploy Streamlit to Community Cloud

### Prerequisites
- GitHub account with access to this repo
- Streamlit account (free)
- Modal webhook URL configured in .env

### Deployment Steps

1. **Commit changes to GitHub:**
```bash
cd "/Users/musacomma/Agentic Workflow"
git add streamlit_app/
git add .env
git add cloud/modal_linkedin_automation.py
git commit -m "Add Streamlit LinkedIn Post Manager frontend with event-driven webhooks"
git push origin main
```

2. **Go to Streamlit Cloud:** https://share.streamlit.io

3. **Click "New app"** → "From existing repo"

4. **Configure deployment:**
   - Repository: Select your repo
   - Branch: `main`
   - Main file path: `streamlit_app/app.py`
   - Click "Deploy"

5. **Wait for app to build and deploy** (2-5 minutes)

6. **Add secrets to Streamlit Cloud:**
   - In app settings, click "Secrets"
   - Add TOML configuration:
   ```toml
   [airtable]
   api_key = "pat..."
   base_id = "app..."
   table_id = "tbl..."

   [modal]
   webhook_base_url = "https://<username>--linkedin-automation-<hash>.modal.run"
   ```

7. **Verify deployment:**
   - Click app URL to open deployed app
   - Check sidebar for API status
   - Posts should load from Airtable
   - Modal webhooks should show as accessible

---

## Verification Checklist

### Phase 1 Deployment Complete ✅

- [ ] Modal app deployed with Streamlit webhooks
- [ ] Modal webhook URL obtained
- [ ] Modal webhook URL added to .env
- [ ] Local test_setup.py passes all tests
- [ ] Local Streamlit app runs without errors
- [ ] GitHub changes committed and pushed
- [ ] Streamlit Cloud app deployed successfully
- [ ] Streamlit app loads and displays posts
- [ ] API status shows in sidebar
- [ ] No errors in Streamlit logs

### Next Steps (Phase 2)

Once Phase 1 deployment is verified:

1. **Test event-driven actions locally:**
   - Click "Approve" button → should trigger Modal webhook
   - Check Streamlit console for webhook calls
   - Verify Airtable updates in real-time

2. **Implement Phase 2 features:**
   - Add status change buttons with event triggers
   - Add post editor with image generation
   - Add revision interface
   - Add calendar view

---

## Troubleshooting

### "Missing configuration: MODAL_WEBHOOK_BASE_URL"

**Solution:**
1. Verify Modal webhook URL is set in .env:
   ```bash
   grep MODAL_WEBHOOK_BASE_URL .env
   ```
2. If empty, redeploy Modal and get URL
3. Update .env with correct URL
4. Restart Streamlit app

### "Modal webhooks not accessible"

**Solution:**
1. Verify Modal app is deployed:
   ```bash
   modal app list
   ```
2. Check webhook URL is correct in .env
3. Test webhook directly:
   ```bash
   curl -X GET https://<webhook-url>/health
   ```
4. If 404, Modal URL is wrong
5. Update .env and restart app

### "Airtable posts not loading"

**Solution:**
1. Verify credentials in .env or Streamlit secrets
2. Test Airtable connection:
   ```bash
   python3 -c "from utils.airtable_client import AirtableClient; print(AirtableClient().get_posts_count())"
   ```
3. If error, check API key and table IDs

### Streamlit Cloud deployment fails

**Solution:**
1. Check Streamlit Cloud logs for errors
2. Verify requirements.txt is present and correct
3. Ensure all imports use relative paths
4. Verify secrets are properly set in Streamlit Cloud
5. Check GitHub repo is accessible

---

## Cost Analysis After Deployment

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Streamlit Community Cloud | $0 | Free tier (1 app) |
| Airtable | $0 | Free tier (18 posts) |
| Modal - Event-driven | ~$1 | Only runs on button clicks |
| **Total Monthly** | **~$1** | 80-90% savings vs polling |

**Previous polling approach cost:** $5-10/month
**Current event-driven approach cost:** ~$1/month
**Monthly savings:** $4-9

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│     Streamlit Cloud (Deployed)          │
│     - Post management UI                │
│     - Filters and search                │
│     - Quick action buttons              │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │ HTTP API Calls  │ (Event-Driven)
        ↓                 ↓
   ┌─────────────┐  ┌──────────────┐
   │  Airtable   │  │  Modal Cloud │
   │  (Database) │  │  (Webhooks)  │
   └─────────────┘  └──────┬───────┘
                           │
                      (Triggers)
                           │
                    ┌──────┴──────┐
                    ↓             ↓
              ┌──────────┐  ┌──────────┐
              │ Replicate│  │   Make   │
              │ (Images) │  │ (LinkedIn)│
              └──────────┘  └──────────┘
```

---

## Rollback Plan (If Issues)

If issues arise after deployment:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Streamlit Cloud auto-redeploys** from main branch (2-5 min)

3. **Keep using Airtable UI temporarily** while fixing issues

4. **Disable new Modal webhooks** by commenting out in modal_linkedin_automation.py if needed

---

## Phase 1 Complete! 🎉

The foundation is complete. After verifying the deployment checklist, you can move to Phase 2 to implement:
- Event-driven status buttons
- Post editor
- Revision interface
- Calendar view
- Analytics dashboard

Continue with Phase 2 tasks for the full feature set.
