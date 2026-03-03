# Auto-Posting Cron Job Setup (Vercel)

This document explains how the automatic post scheduling and sending works using Vercel Cron Jobs.

## Overview

The system uses **Vercel's built-in Cron Jobs** to automatically check for and post scheduled posts every minute, and generate new posts daily. When you schedule a post for a specific time, the cron job will automatically:

1. Check the database for posts where `status = 'Scheduled'` and `scheduled_time <= now`
2. Send each due post to the make.com webhook
3. Update the post status to `'Posted'`

Additionally, every day at 9 AM UTC, the system generates new posts to maintain a pool of 21+ posts in "Pending Review" or "Scheduled" status.

## Why Vercel Cron Jobs?

- ✅ Built-in to Vercel (no extra services needed)
- ✅ Free tier includes unlimited cron jobs
- ✅ Minimal usage impact (1,441 invocations/month out of 1M allowed)
- ✅ Simple configuration via `vercel.json`
- ✅ Automatic retry on failures
- ✅ Can monitor in Vercel dashboard

## Components

### 1. **Auto-Post API Route**
- **File**: `src/app/api/posts/auto-post/route.ts`
- **Purpose**: Fetches due posts and sends them to make.com
- **Endpoint**: `GET /api/posts/auto-post`
- **Authentication**: Checks `x-cron-secret` header
- **Called by**: Vercel Cron Job every minute

### 2. **Post Generation API Route**
- **File**: `src/app/api/posts/generate-batch/route.ts`
- **Purpose**: Generates new posts to maintain 21+ post pool
- **Endpoint**: `POST /api/posts/generate-batch`
- **Authentication**: Checks `x-cron-secret` header
- **Called by**: Vercel Cron Job daily at 9 AM UTC

### 3. **Vercel Configuration**
- **File**: `vercel.json`
- **Contains**: Cron job schedule definitions
- **Auto-deployed** with your app to Vercel

## Local Development

### Testing the Endpoints

1. Open your browser console (F12)
2. Test auto-post endpoint:
   ```javascript
   fetch('/api/posts/auto-post', {
     method: 'GET',
     headers: { 'x-cron-secret': 'your-secure-cron-secret-here' }
   }).then(r => r.json()).then(console.log)
   ```

3. Test post generation:
   ```javascript
   fetch('/api/posts/generate-batch', {
     method: 'POST',
     headers: { 'x-cron-secret': 'your-secure-cron-secret-here' },
     body: JSON.stringify({ count: 3 })
   }).then(r => r.json()).then(console.log)
   ```

### Environment Variables

Add to `.env.local`:
```env
CRON_SECRET=your-secure-cron-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Cron jobs only run on production (Vercel). Local development won't trigger them automatically.

## Production Deployment

### Step 1: Ensure Vercel Configuration

Your `vercel.json` file is already set up with:

```json
{
  "crons": [
    {
      "path": "/api/posts/auto-post",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/posts/generate-batch",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Step 2: Set Environment Variables on Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   ```
   CRON_SECRET=your-secure-random-secret-here
   ```
   Use a strong random secret: `openssl rand -hex 32`

3. Ensure these are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ANTHROPIC_API_KEY
   ```

### Step 3: Deploy

Simply push to your repository:
```bash
git add vercel.json
git commit -m "Add Vercel cron jobs for auto-posting and post generation"
git push
```

Vercel automatically reads `vercel.json` and enables the cron jobs.

### Step 4: Verify Deployment

1. Go to Vercel Dashboard → Project
2. Click "Crons" tab to see:
   - `/api/posts/auto-post` (every minute)
   - `/api/posts/generate-batch` (daily at 9 AM)
3. View execution history and logs

## How It Works

### Auto-Posting Flow (Every Minute)

1. **Vercel Cron** triggers `GET /api/posts/auto-post`
2. **API endpoint**:
   - Queries posts where `status='Scheduled'` and `scheduled_time <= now`
   - For each due post, sends to make.com webhook
   - Updates post status to `'Posted'`
   - Logs results
3. **User sees** post status change in dashboard

### Post Generation Flow (Daily at 9 AM UTC)

1. **Vercel Cron** triggers `POST /api/posts/generate-batch`
2. **API endpoint**:
   - Counts posts in "Pending Review" or "Scheduled" status
   - If count < 21, generates (21 - count) posts
   - Uses Claude AI to create engaging LinkedIn content
   - Inserts new posts into database
   - Logs results
3. **User sees** new posts appear in "Pending Review" section

### Scheduling Windows

Posts are auto-scheduled into 3 daily windows:
- **8:00 AM - 10:00 AM**
- **12:00 PM - 2:00 PM**
- **5:00 PM - 8:00 PM**

Only 1 post per window per day. If all windows are full, the next post schedules for the next available day.

## 🔐 Security

Both endpoints check the `x-cron-secret` header:
- Vercel automatically sends `x-cron-secret` header in requests
- Your API validates it matches `CRON_SECRET` environment variable
- Production enforcement when `NODE_ENV=production`

## 🚨 Troubleshooting

### Cron jobs not running

1. **Check Vercel Dashboard**:
   - Go to Project → Crons tab
   - See execution history and any errors

2. **Check logs**:
   - Vercel → Logs tab
   - Filter for `/api/posts/auto-post` or `/api/posts/generate-batch`

3. **Verify configuration**:
   - Ensure `vercel.json` is in repository root
   - Make sure the JSON is valid (use JSON validator)
   - Check that file paths match exactly

### Posts not auto-posting

1. Verify posts have `scheduled_time <= current_time`
2. Check make.com webhook is accessible
3. Verify `MAKE_COM_WEBHOOK` URL is correct
4. Check Vercel logs for webhook errors
5. Test manually: `curl -H "x-cron-secret: ..." https://your-app.vercel.app/api/posts/auto-post`

### Posts not generating

1. Verify you have < 21 posts in Pending Review/Scheduled status
2. Check `ANTHROPIC_API_KEY` is set in Vercel environment
3. Check logs for Claude API errors
4. Verify `CRON_SECRET` matches in Vercel environment variable
5. Check Supabase connection and permissions

### CRON_SECRET mismatch

If you get 401 Unauthorized errors:
- Verify `CRON_SECRET` in Vercel environment variable
- Redeploy after changing the secret
- Restart deployment: `vercel --prod`

## 📊 Cron Job Details

### Auto-Post Cron
- **Path**: `/api/posts/auto-post`
- **Method**: `GET`
- **Schedule**: `* * * * *` (every minute)
- **Timeout**: 30 seconds
- **Usage**: ~1,440 invocations/month

### Post Generation Cron
- **Path**: `/api/posts/generate-batch`
- **Method**: `POST`
- **Schedule**: `0 9 * * *` (daily at 9 AM UTC)
- **Timeout**: 120 seconds
- **Usage**: ~30 invocations/month

### Total Monthly Usage
- ~1,470 function invocations
- Within free tier limits: **1.5M invocations/month allowed**
- No additional cost

## 🔄 Local Testing

To test the full flow locally:

1. Create a post manually in the app
2. Approve & Schedule it
3. Set `scheduled_time` to a past date (DevTools)
4. Call auto-post endpoint:
   ```bash
   curl -H "x-cron-secret: your-secret" http://localhost:3000/api/posts/auto-post
   ```
5. Check if post status changed to "Posted"

## 📝 Deployment Checklist

- [ ] `vercel.json` committed to repository
- [ ] `CRON_SECRET` set in Vercel environment variables
- [ ] `ANTHROPIC_API_KEY` set in Vercel environment variables
- [ ] All Supabase environment variables configured
- [ ] Pushed changes to repository
- [ ] Vercel automatically deployed changes
- [ ] Crons visible in Vercel dashboard
- [ ] First auto-post cycle completed (check logs)
- [ ] First post generation cycle completed (check post count)

## 🎯 Verification

After deployment, verify everything is working:

1. **Check dashboard**:
   ```bash
   # View cron status
   vercel list crons
   ```

2. **Monitor logs**:
   - Vercel Dashboard → Logs
   - Filter by API endpoint name
   - Look for `[AUTO-POST]` or `[GENERATE-BATCH]` log prefixes

3. **Test manually**:
   ```bash
   # Test auto-post (replace with your URL)
   curl -H "x-cron-secret: your-secret" https://your-app.vercel.app/api/posts/auto-post

   # Test post generation
   curl -X POST -H "x-cron-secret: your-secret" \
     -H "Content-Type: application/json" \
     -d '{"count":3}' \
     https://your-app.vercel.app/api/posts/generate-batch
   ```

4. **Check results**:
   - Posts automatically post at scheduled times
   - New posts generated daily at 9 AM
   - Post count maintained at 21+

## 📞 Support

If you encounter issues:

1. Check Vercel logs: Dashboard → Logs
2. Check cron status: Dashboard → Crons
3. Test endpoints manually with curl
4. Verify all environment variables are set
5. Check API endpoint implementations for errors
