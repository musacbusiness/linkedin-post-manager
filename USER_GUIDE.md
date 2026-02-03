# LinkedIn Post Manager - User Guide

Welcome to the LinkedIn Post Manager! This guide walks you through each feature and how to use them.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Posts](#managing-posts)
4. [Using the Editor](#using-the-editor)
5. [Viewing Your Schedule](#viewing-your-schedule)
6. [Requesting Revisions](#requesting-revisions)
7. [Batch Operations](#batch-operations)
8. [Analytics](#analytics)
9. [Advanced Search](#advanced-search)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Login
The app may require a password if configured by your administrator. Enter the password when prompted.

### First Look
You'll see:
- **Header**: "📱 LinkedIn Post Manager" with event-driven architecture info
- **Quick Stats**: Cards showing counts for Draft, Scheduled, and Posted posts
- **Tab Navigation**: 6 tabs for different features

---

## Dashboard Overview

### Quick Stats Section
Shows at-a-glance metrics:
- 🟡 **Draft**: Posts awaiting review
- 🟢 **Approved**: Posts ready to schedule
- 🟣 **Scheduled**: Posts queued for posting
- ✅ **Posted**: Posts live on LinkedIn

### API Status (Sidebar)
Check if connections are working:
- ✅ **Airtable**: Shows number of posts in database
- ✅ **Modal**: Confirms webhooks are accessible

---

## Managing Posts

### 📋 Posts Tab

The main posts tab lets you search, filter, and manage all your LinkedIn posts.

#### Quick Actions

**For Draft Posts**:
1. Find a post with status "🟡 Draft"
2. Click the expander to open it
3. Click **"✅ Approve"** button
4. Post automatically moves to "🟢 Approved - Ready to Schedule"
5. Modal webhook triggers → Post scheduled instantly

**For Pending Posts**:
1. Find a post with status "🔵 Pending Review"
2. Click **"❌ Reject"** to mark as rejected
3. Post will be deleted after 7 days (automatic)

#### Expandable Post View

When you click on a post, you see:
- **Status Badge**: Current status with emoji
- **Created Date**: When the post was first created
- **Scheduled Date**: When it's scheduled to post
- **Content Preview**: Full post content
- **Image**: Thumbnail if available
- **Action Buttons**: Approve/Reject depending on status

---

## Using the Editor

### ✏️ Editor Tab

Edit post content and trigger image generation.

#### How to Edit a Post

1. Go to **"✏️ Editor"** tab
2. **Select a post** from the dropdown menu
3. The post details appear:
   - Title field (edit text)
   - Content area (edit text)
   - Image URL field
   - Image preview

#### Making Changes

1. Modify the **Title** or **Content** as needed
2. To change the image URL, paste a new URL in the **Image URL** field
3. Click **"Save"** to update the post
4. Success message confirms the update

#### Generating Images

**To generate a new image with AI**:

1. Go to **"✏️ Editor"** tab
2. Select the post you want an image for
3. Click **"🖼️ Generate Image"** button
4. Status changes to "🔵 Pending Review"
5. Wait **30-60 seconds** for image generation
6. Modal AI generates an image based on the post content
7. Image appears in preview when complete
8. Success toast shows when done

**What happens**:
- Image generated using AI based on post title and content
- URL stored in Airtable
- Image updates in real-time

---

## Viewing Your Schedule

### 📅 Calendar Tab

See your posting schedule as a visual monthly calendar.

#### How to Use

1. Go to **"📅 Calendar"** tab
2. **Navigate months**:
   - Click **"◀ Previous"** to go back
   - Click **"Next ▶"** to go forward
   - Current month displays in center

3. **See scheduled posts**:
   - Posts appear on calendar dates with 📌 indicator
   - Blue date cells show days with scheduled posts

4. **Click to expand posts**:
   - Click on a date with posts
   - Expander shows all posts scheduled for that day
   - See title, time, content preview, and image

#### Understanding the Calendar

- **Posts shown**: Only "Scheduled" and "Posted" statuses
- **Time windows**: Posts scheduled at 9 AM, 2 PM, or 8 PM UTC
- **Timezone**: Calendar uses your local timezone
- **Multiple posts**: If multiple posts scheduled same day, they show stacked

---

## Requesting Revisions

### 🔄 Revisions Tab

Ask AI to revise posts based on your feedback.

#### How to Request a Revision

1. Go to **"🔄 Revisions"** tab
2. **Select a post** from dropdown (shows title and current status)
3. **Current Status** displays:
   - Latest revision status
   - Whether revision is in progress
   - Previous revision attempts

4. **Enter your revision request**:
   - Describe what you want changed
   - Example: "Make the hook more engaging" or "Add more emojis"

5. **Select revision type**:
   - 📝 **Post Only**: Revise the text content
   - 🖼️ **Image Only**: Generate new image with updated concept
   - 🔄 **Both**: Revise content AND generate new image

6. Click **"✏️ Submit Revision"**
7. Status shows "Revising..." with spinner
8. Wait **10-20 seconds** for AI processing
9. Success message shows changes made

#### Revision History

- **Previous revisions** shown in expandable section
- **Notes field** contains history of all changes
- AI explains what was modified in each revision

---

## Batch Operations

### 📦 Batch Operations Tab

Handle multiple posts at once without clicking each one individually.

#### Select Posts

1. Go to **"📦 Batch Ops"** tab
2. **Individual selection**:
   - Check boxes next to posts you want
   - Selected posts highlighted

3. **Quick selection**:
   - Click **"☑️ Select All"** → Select all visible posts
   - Click **"☐ Clear All"** → Uncheck all

4. **Live counter** shows "✅ X post(s) selected"

#### Bulk Operations

Once posts are selected:

##### Bulk Approve
- **Button**: "✅ Approve All Selected"
- **What happens**:
  - All selected posts → "Approved - Ready to Schedule"
  - Modal webhooks trigger for each post
  - Posts automatically scheduled
  - Progress bar shows percentage complete
- **Use case**: Approve multiple draft posts at once

##### Bulk Reject
- **Button**: "❌ Reject All Selected"
- **What happens**:
  - All posts → "Rejected" status
  - 7-day deletion timer starts for each
  - Progress bar shows completion
- **Use case**: Reject a batch of posts quickly

##### Bulk Delete
- **Button**: "🗑️ Delete All Selected"
- **Warning**: "This action cannot be undone"
- **Confirmation**: Click "Confirm Delete" to proceed
- **What happens**: Posts permanently removed from Airtable
- **Use case**: Clean up old/test posts

#### Example Workflow

```
Scenario: You have 8 draft posts ready to approve

1. Open Batch Ops tab
2. Click "Select All" → All 8 posts checked
3. Click "Approve All Selected"
4. Progress bar: 1/8 → 2/8 → 3/8...
5. Entire process takes 15-30 seconds
6. All 8 posts now scheduled

Time saved: 8 posts × 5 clicks each = 40 clicks vs 2 clicks
```

---

## Analytics

### 📊 Analytics Tab

Understand your posting pipeline with data and visualizations.

#### Key Metrics (Top Row)

5 counters show current status:
- **Total Posts**: All posts in database
- **Drafts**: Posts awaiting review (🟡)
- **Ready to Publish**: Posts scheduled or posted (🟢)
- **Published**: Posts live on LinkedIn (✅)
- **Rejected**: Posts marked for deletion (❌)

#### Status Distribution Charts

**Pie Chart** (left):
- Donut visualization of all statuses
- Shows percentage of each status
- Hover to see counts

**Bar Chart** (right):
- Vertical bars for each status
- Actual post counts
- Easy to compare volumes

#### Publishing Timeline

**Line chart** showing:
- Posts created per week over time
- X-axis: Weeks (YYYY-W##)
- Y-axis: Number of posts created
- Helps identify content creation patterns
- Spot seasonal trends

#### Approval Metrics

Three key performance indicators:
1. **Approval Rate**: % of posts approved/published
   - Formula: (Approved + Scheduled + Posted) / Total × 100%
   - Target: 80-90% approval rate

2. **Rejection Rate**: % of posts rejected
   - Formula: Rejected / Total × 100%
   - Lower is better

3. **Avg Time to Schedule**: Days from created to scheduled
   - Formula: Average of (Scheduled - Created) for all scheduled posts
   - Lower is better (shows faster approval cycle)

#### Content Themes

**Top 10 Keywords** bar chart:
- Most common words in your posts
- Helps identify content themes
- Filters out common English words
- Shows frequency of each keyword
- Use to understand your main topics

#### Using Analytics

**Common questions answered**:
- "How many posts do I have pending?" → Check Drafts metric
- "What's my approval rate?" → Check Approval Rate metric
- "When am I creating most posts?" → Look at timeline chart
- "What topics do I write about?" → Check Top 10 Keywords

---

## Advanced Search

### Search Features

The advanced search lets you find posts using multiple criteria at once.

#### Text Search

**Search field**: "Search by title or content"

**How it works**:
- Searches post titles AND content
- Case-insensitive (lowercase matches UPPERCASE)
- Partial matches work (search "auto" finds "automation")
- Example: Search "LinkedIn" finds all posts mentioning LinkedIn

#### Status Filter

**Multi-select dropdown**: Filter by status

**Available statuses**:
- 🟡 Draft
- 🔵 Pending Review
- 🟢 Approved - Ready to Schedule
- 🟣 Scheduled
- ✅ Posted
- ❌ Rejected

**How to use**:
- Click dropdown → Check 1+ statuses
- Only posts with selected statuses appear
- Leave empty = show all statuses
- Example: Select "Draft" + "Pending Review" to see posts needing action

#### Date Range Filter

**Preset options**:
- All Time
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range (pick start/end dates)

**How to use**:
- Select preset OR choose "Custom range"
- Custom range shows date pickers for start/end
- Filters by **Created** date
- Example: "Last 7 days" shows posts created in past week

#### Combined Filters

**How it works**:
- All filters use AND logic (must match ALL conditions)
- Example search:
  - Text: "automation"
  - Status: Draft, Pending Review
  - Date: Last 30 days
  - **Result**: Posts with "automation" created in last 30 days that are Draft or Pending Review

#### Search Results

**Result counter**: "📊 Found X of Y posts"

**Expandable cards** show:
- Post title and status
- Created date
- Content preview (first 200 chars)
- Image thumbnail
- Record ID (for debugging)

**Use cases**:
- Find all "automation" posts: Search term, no status/date filter
- See this month's drafts: Status = Draft, Date = Current month
- Find recent pending posts: Status = Pending Review, Date = Last 7 days
- Find scheduled posts for tomorrow: Status = Scheduled, Date = Tomorrow only

---

## Troubleshooting

### Common Issues

#### App Won't Load
- **Check**: Is Airtable connected? (Check sidebar for ✅)
- **Fix**: Verify internet connection, refresh browser
- **If persists**: Check configuration (contact admin)

#### Password Keeps Rejecting
- **Check**: Caps lock is off
- **Check**: Password is exact match (case-sensitive)
- **Fix**: Contact app administrator for password reset

#### Posts Not Showing
- **Check**: Are there any posts in Airtable? (sidebar shows count)
- **Fix**: Try refreshing browser (Ctrl+R or Cmd+R)
- **If empty**: No posts in database - create some in Airtable first

#### Approve Button Not Working
- **Check**: Is post status "Draft"?
- **Check**: Is Modal connection active? (Sidebar shows ✅)
- **Fix**: Try again - Modal may be busy
- **If error**: Screenshot error message and contact admin

#### Image Generation Takes Too Long
- **Expected**: 30-60 seconds is normal
- **Check**: Spinner shows "Generating image..."
- **Wait**: Don't refresh or leave the page
- **If >2 min**: May have timed out - try again

#### Can't Edit Post
- **Check**: Are you in the Editor tab?
- **Check**: Did you click "Save"?
- **Fix**: Make changes then click blue "Save" button
- **Result**: Success toast appears when saved

#### Revision Not Processing
- **Check**: Is Modal connection active? (Sidebar shows ✅)
- **Check**: Did you click "Submit Revision"?
- **Expected**: 10-20 seconds to process
- **Fix**: Try again if times out
- **Note**: Keep browser tab open during revision

#### Calendar Shows No Posts
- **Check**: Are there posts with "Scheduled" status?
- **Fix**: Try approving a post first
- **Note**: Only "Scheduled" and "Posted" posts appear on calendar

#### Batch Operation Not Completing
- **Check**: How many posts selected? (Show at top)
- **Check**: Is progress bar moving?
- **Expected**: ~2-3 seconds per post
- **For 10 posts**: 20-30 seconds total
- **Fix**: Keep browser open during operation

#### Analytics Charts Not Showing
- **Check**: Do you have any posts? (Empty database = no charts)
- **Fix**: Create some posts first
- **Try**: Refresh page (Ctrl+R)
- **If blank**: May need to wait 30 seconds for cache

### Getting Help

**Check before contacting admin**:
1. Refresh browser (Ctrl+R or Cmd+R)
2. Check sidebar for connection status
3. Try the operation again
4. Check that you're using correct tab/feature

**When contacting admin include**:
- What feature were you using? (Posts, Editor, Calendar, etc.)
- What did you try to do?
- What error message appeared?
- Screenshot of error if possible
- When did this start happening?

---

## Tips & Tricks

### Pro Tips

1. **Batch operations are fast**: Use "Select All" + "Approve All" for bulk processing
2. **Advanced search finds posts quick**: Use text + status filters to narrow down
3. **Calendar preview**: Hover over calendar dates to see posts without clicking
4. **Revision history**: Check Notes field to see all revisions made
5. **Check metrics before editing**: Analytics tab shows approval rate

### Keyboard Shortcuts

- Refresh page: **Ctrl+R** (Windows) or **Cmd+R** (Mac)
- Focus search: **Ctrl+F** (opens browser search)

### Workflow Examples

**Daily Management**:
1. Open app (1 min)
2. Check Quick Stats (0.5 min)
3. Go to Advanced Search → Filter "Draft" (1 min)
4. Select all drafts → Bulk Approve (2 min)
5. Check Calendar for schedule (1 min)
6. Done! (5.5 min total)

**Content Revision**:
1. Go to Revisions tab (0.5 min)
2. Select post → Enter revision request (1 min)
3. Choose revision type (0.5 min)
4. Click Submit → Wait for completion (15 sec)
5. Review changes in Editor tab (1 min)
6. Done! (3.2 min total)

**Analytics Review**:
1. Go to Analytics tab (0.5 min)
2. Check key metrics (1 min)
3. Review timeline chart (1 min)
4. Check top keywords (0.5 min)
5. Identify trends and next steps (2 min)
6. Done! (5 min total)

---

## FAQ

**Q: How long until an approved post is scheduled?**
A: Instantly! Modal webhook triggers immediately. Post should be scheduled within 1-3 seconds.

**Q: Can I undo an approval?**
A: No - but you can reject an already-scheduled post. It will be deleted in 7 days.

**Q: How long are rejected posts kept?**
A: 7 days. They're automatically deleted after that. Contact admin if you need to recover one.

**Q: Can multiple people use this app?**
A: Yes, but they all share the same Airtable base. Edits by one person appear immediately for others.

**Q: How often is data updated?**
A: Data refreshes every 30 seconds for performance. Click refresh button to see latest immediately.

**Q: Does this post directly to LinkedIn?**
A: No - it uses Make.com to post when scheduled time arrives. The app just manages scheduling.

**Q: Can I schedule a post for a specific time?**
A: No - Modal auto-selects from 3 daily windows (9 AM, 2 PM, 8 PM UTC). Contact admin to customize.

**Q: What if I make a typo before approving?**
A: Go to Editor tab, select post, fix typo, click Save. Then approve normally.

**Q: Can I see LinkedIn engagement metrics?**
A: Not yet - check LinkedIn directly for likes/comments. Future versions may integrate this.

---

## Support

For issues or feature requests, contact your app administrator.

**Have fun managing your LinkedIn content!** 🎉

