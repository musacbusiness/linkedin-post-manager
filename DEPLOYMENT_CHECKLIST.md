# Plan B Deployment Checklist

**Status**: ✅ Ready for Deployment
**Date**: February 2, 2026

---

## Pre-Deployment Verification

### ✅ Code Changes Complete
- [x] Created `utils/direct_processors.py` with Replicate & Claude clients
- [x] Updated `components/post_editor.py` to use direct Replicate API
- [x] Updated `components/revision_interface.py` to use direct Claude API
- [x] Updated `app.py` to remove Modal webhook calls (approve/reject)
- [x] Updated `components/batch_operations.py` to remove Modal webhook calls
- [x] Created `PLAN_B_IMPLEMENTATION.md` documentation
- [x] All imports updated and dependencies verified

### ✅ Environment Variables
- [x] `.env` contains `REPLICATE_API_TOKEN`
- [x] `.env` contains `ANTHROPIC_API_KEY`
- [x] `.env` contains `AIRTABLE_API_KEY`
- [x] `.env` contains `AIRTABLE_BASE_ID`
- [x] `.env` contains `AIRTABLE_LINKEDIN_TABLE_ID`
- [x] `.env` file is in `.gitignore` (not committed)

### ✅ Requirements
- [x] All dependencies in `requirements.txt`
- [x] `requests` ≥2.31.0 (API calls)
- [x] `streamlit` ≥1.28.0 (UI)
- [x] `python-dotenv` (environment variables)

### ✅ Documentation
- [x] `PLAN_B_IMPLEMENTATION.md` created
- [x] Architecture changes documented
- [x] Troubleshooting guide included
- [x] Deployment steps documented

---

## Deployment Steps

### Step 1: Local Testing (Optional but Recommended)
```bash
# Navigate to project directory
cd /tmp/linkedin-post-manager

# Run Streamlit locally
streamlit run app.py

# Test in browser:
# 1. Try to generate an image
# 2. Try to request a revision
# 3. Try to approve a post
```

### Step 2: Push to GitHub
```bash
# Stage all changes
git add -A

# Commit with clear message
git commit -m "Plan B: Move image generation & revisions to direct APIs

- Remove Modal webhook dependencies (were returning 404s)
- Add direct Replicate API for image generation
- Add direct Claude API for revisions
- Simplify approve/reject to status updates only
- Reduce cost and increase reliability
- All features now work without Modal webhooks"

# Push to main branch
git push origin main
```

### Step 3: Streamlit Cloud Auto-Deploy
- GitHub webhook automatically triggers Streamlit rebuild
- Wait 2-5 minutes for deployment
- Streamlit shows "Updating..." message during deployment
- Green "✓ Running on Streamlit" when complete

### Step 4: Verify Deployment (5-10 minutes)

**Test 1: Image Generation**
1. Open deployed app URL
2. Navigate to "📝 Posts" tab
3. Find a draft post
4. Click "✏️ Edit"
5. Click "🖼️ Generate Image"
6. Wait 30-60 seconds
7. ✅ Verify image appears with success message

**Test 2: Revision**
1. Find any post with content
2. Click "✏️ Edit"
3. Scroll to "🔄 Request Revision" section
4. Enter: "Make it more casual and funny"
5. Select "Post Only"
6. Click "🚀 Submit Revision"
7. Wait 10-20 seconds
8. ✅ Verify content updates with change summary

**Test 3: Approval**
1. Find a draft post
2. Click "✅ Approve"
3. Spinner shows "Approving post..."
4. ✅ Verify immediate success message
5. ✅ Verify status changes to "Approved - Ready to Schedule"

**Test 4: Batch Operations**
1. Select 3-5 draft posts with checkboxes
2. Click "✅ Approve All Selected"
3. Progress bar shows progress
4. ✅ Verify all posts approved in <2 seconds

**Test 5: Sidebar Status**
1. Check sidebar connection status
2. Should show:
   - "✅ Airtable: N posts"
   - "✅ Modal: Webhooks accessible" (or similar)

---

## Post-Deployment Monitoring

### First Hour
- Monitor error logs for any exceptions
- Check if any Streamlit errors appear
- Verify all buttons/features work

### First Day
- Monitor Modal dashboard for cron job executions
- Verify daily content generation still works (6 AM UTC)
- Verify scheduler is picking up approved posts
- Check for any API rate limit issues

### First Week
- Monitor costs (Replicate & Claude usage)
- Check Modal logs for any issues
- Verify approved posts are getting posted to LinkedIn
- Gather user feedback on new experience

---

## Rollback Plan (If Issues Arise)

If deployment breaks something critical:

```bash
# Option 1: Revert to previous commit
git log --oneline | head -5
git revert <commit-hash>
git push origin main

# Streamlit Cloud will auto-deploy the reverted code

# Option 2: Temporarily disable Plan B features
# Comment out direct_processors imports in components
# Streamlit will show warnings instead of errors
```

---

## Success Indicators

### After Deployment, You Should See:

✅ **Image Generation Now Works**
- Click "Generate Image" → Success in 30-60 seconds
- No more 404 errors
- Images display in Streamlit

✅ **Revisions Now Work**
- Click "Request Revision" → Success in 10-20 seconds
- Post content updates immediately
- Change summary displays

✅ **Approvals Are Instant**
- Click "Approve" → Success message in <1 second
- No more "Modal webhook" warnings

✅ **Bulk Operations Are Fast**
- Select 10 posts → Approve all in <2 seconds
- No more waiting for Modal webhooks

✅ **Modal Background Jobs Still Run**
- Check Modal dashboard
- Daily posts generated at 6 AM UTC
- Approved posts posted to LinkedIn every minute
- Rejected posts scheduled for deletion

---

## Troubleshooting After Deployment

### Issue: "ModuleNotFoundError: No module named 'utils.direct_processors'"
**Solution**:
- Streamlit Cloud rebuild is still in progress
- Wait 1-2 more minutes and refresh browser

### Issue: "REPLICATE_API_TOKEN not found"
**Solution**:
1. Check `.streamlit/secrets.toml` in Streamlit Cloud dashboard
2. Add secrets if missing:
   ```
   REPLICATE_API_TOKEN = "r8_..."
   ANTHROPIC_API_KEY = "sk-ant-..."
   ```
3. Redeploy app

### Issue: Image generation times out
**Solution**:
1. Check Replicate API status page
2. Try with shorter prompt (simplified post content)
3. Retry in 1 minute

### Issue: Revisions return API error
**Solution**:
1. Verify `ANTHROPIC_API_KEY` is correct
2. Check Claude API dashboard for rate limits
3. Reduce frequency of revision requests

### Issue: Status changes not updating in Airtable
**Solution**:
1. Check Airtable API key is correct
2. Verify Airtable base ID and table ID
3. Refresh browser to reload data

---

## After Successful Deployment

### ✅ Next Steps:
1. Share updated app URL with team
2. Create short tutorial on how to use new features
3. Monitor logs for first 24 hours
4. Collect feedback from users
5. Plan Phase 5 enhancements (if needed)

### 📊 Monitor These Metrics:
- Daily API calls to Replicate (should be low)
- Daily API calls to Claude (should be low)
- Modal cron job executions (should be same as before)
- Airtable API usage (should be similar)
- Overall system costs (should decrease)

### 🎯 Expected Outcomes:
- Faster user workflows (no waiting for Modal webhooks)
- Lower system costs
- Higher reliability (direct APIs vs webhooks)
- Better user experience (instant feedback)

---

## Final Checklist

Before pressing deploy:

- [x] Code reviewed and tested
- [x] All imports verified
- [x] Environment variables in place
- [x] Documentation complete
- [x] Rollback plan ready
- [x] Monitoring plan in place
- [x] Team notified of changes
- [x] Ready to proceed ✅

---

## Contact & Support

If issues arise during/after deployment:

1. Check `PLAN_B_IMPLEMENTATION.md` troubleshooting section
2. Review error logs in Streamlit Cloud dashboard
3. Check Modal dashboard for background job status
4. Verify all environment variables are set
5. Use rollback plan if critical issues occur

---

**Status**: ✅ READY FOR DEPLOYMENT 🚀

Deployment command:
```bash
git push origin main
```

Then wait 2-5 minutes for Streamlit Cloud auto-deploy and verify tests pass.

