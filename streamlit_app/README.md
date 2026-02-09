# LinkedIn Post Manager - Streamlit Frontend

Event-driven content management for LinkedIn posts using Streamlit, Airtable, and Modal webhooks.

## Architecture Overview

```
Streamlit App → Airtable API → Modal Webhooks → LinkedIn
                    ↑              ↓
                   Data       Automation
```

**Key Features:**
- Real-time post management
- Event-driven Modal triggers (no polling)
- One-click approvals and actions
- Mobile-responsive interface
- Direct integration with existing automation

## Installation (Local Development)

### Prerequisites
- Python 3.10+
- Streamlit account (for deployment)
- Airtable API key
- Modal webhook URL

### Setup Steps

1. **Install dependencies:**
```bash
cd streamlit_app
pip install -r requirements.txt
```

2. **Configure environment variables:**

Create `.streamlit/secrets.toml` with your credentials:
```toml
[airtable]
api_key = "pat..."
base_id = "app..."
table_id = "tbl..."

[modal]
webhook_base_url = "https://yourmodal.modal.run"
```

Or use environment variables:
```bash
export AIRTABLE_API_KEY="pat..."
export AIRTABLE_BASE_ID="app..."
export AIRTABLE_LINKEDIN_TABLE_ID="tbl..."
export MODAL_WEBHOOK_BASE_URL="https://yourmodal.modal.run"
```

3. **Run locally:**
```bash
streamlit run app.py
```

The app will open at `http://localhost:8501`

## Deployment to Streamlit Community Cloud

### Step 1: Prepare GitHub Repository

```bash
# From project root
git add streamlit_app/
git commit -m "Add Streamlit LinkedIn Post Manager frontend"
git push origin main
```

### Step 2: Deploy to Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click "New app" → "From existing repo"
3. Select your GitHub repo
4. Set main file path: `streamlit_app/app.py`
5. Click "Deploy"

### Step 3: Configure Secrets

In Streamlit Cloud dashboard:
1. Click your app
2. Settings → "Secrets"
3. Add your secrets in TOML format:

```toml
[airtable]
api_key = "pat..."
base_id = "app..."
table_id = "tbl..."

[modal]
webhook_base_url = "https://yourmodal.modal.run"
```

### Step 4: Verify Deployment

Check:
- ✅ App loads successfully
- ✅ Posts display from Airtable
- ✅ API status shows in sidebar
- ✅ Modal webhooks are accessible

## File Structure

```
streamlit_app/
├── app.py                          # Main entry point
├── config.py                       # Configuration and constants
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── pages/                          # Multi-page app routes
│   ├── 1_📊_Dashboard.py          # Analytics overview
│   ├── 2_📅_Calendar.py           # Calendar view
│   ├── 3_📝_Posts.py              # Post management
│   └── 4_⚙️_Settings.py           # Configuration
├── components/                     # Reusable UI components
│   ├── post_table.py              # Post table display
│   ├── post_editor.py             # Edit posts
│   ├── revision_interface.py      # Revision UI
│   ├── status_badge.py            # Status display
│   └── calendar_view.py           # Calendar component
├── utils/                          # Utility modules
│   ├── airtable_client.py         # Airtable API wrapper
│   ├── modal_client.py            # Modal webhook client
│   └── formatters.py              # Date/time formatting
└── .streamlit/                     # Streamlit config
    ├── config.toml                # Theme and settings
    └── secrets.toml               # Credentials (not in git)
```

## API Integration

### Airtable Client

```python
from utils.airtable_client import AirtableClient

client = AirtableClient()

# Fetch all posts
posts = client.get_all_posts()

# Update a post
client.update_post(record_id, {"Status": "Scheduled"})

# Request revision
client.request_revision(record_id, "Make the hook more engaging")
```

### Modal Webhooks

```python
from utils.modal_client import ModalClient

modal = ModalClient()

# Trigger image generation
response = modal.trigger_image_generation(record_id)

# Trigger scheduling
response = modal.trigger_scheduling(record_id)

# Trigger revision
response = modal.trigger_revision(record_id)

# Trigger rejection
response = modal.trigger_rejection(record_id)
```

## Event-Driven Architecture

Instead of Modal polling Airtable every 15 minutes (expensive), Streamlit now triggers Modal directly when actions occur:

### Old Approach (Polling - Inefficient)
```
User changes status in Airtable
    ↓
Modal cron checks every 15 min
    ↓ (15 min delay)
Modal executes function
```
**Cost:** $5-10/month just for polling

### New Approach (Event-Driven - Efficient)
```
User clicks button in Streamlit
    ↓
Streamlit updates Airtable
    ↓
Streamlit calls Modal webhook (INSTANT)
    ↓ (0-5 seconds)
Modal executes function
```
**Cost:** $0.50-1/month (80-90% savings)

## Development Phases

### Phase 1: Foundation ✅
- Basic post table
- Airtable integration
- Modal webhook endpoints

### Phase 2: Event-Driven Actions (In Progress)
- Approve/Reject buttons
- Image generation trigger
- Post editor
- Revision interface
- Calendar view

### Phase 3: Enhanced Features (Planned)
- Batch operations
- Analytics dashboard
- Search and filtering
- Mobile optimization

### Phase 4: Polish & Launch (Planned)
- Remove polling cron jobs
- Performance optimization
- Documentation
- User authentication

## Troubleshooting

### "Missing configuration" Error
Check that all environment variables are set:
```bash
echo $AIRTABLE_API_KEY
echo $AIRTABLE_BASE_ID
echo $AIRTABLE_LINKEDIN_TABLE_ID
echo $MODAL_WEBHOOK_BASE_URL
```

### Posts not loading
1. Check Airtable credentials in secrets
2. Verify table ID is correct
3. Check sidebar for API status

### Webhooks not working
1. Verify Modal webhook URL is correct
2. Test with: `curl -X GET https://yourmodal.modal.run/health`
3. Check Modal logs for errors

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Streamlit Cloud | $0/month | Free tier (1 app, 1GB RAM) |
| Airtable | $0/month | Free tier (<1,200 records) |
| Modal | ~$1/month | Event-driven only (vs $10 polling) |
| **Total** | **~$1/month** | **80-90% savings vs polling** |

## Next Steps

1. Deploy app to Streamlit Community Cloud
2. Test Phase 1 features
3. Move to Phase 2 for event-driven actions
4. Gradually deprecate Airtable UI usage

## Support

For issues or questions:
1. Check error messages in Streamlit logs
2. Review API status in sidebar
3. Check Modal and Airtable API status
4. Review code comments for implementation details

---

**Version:** 0.1.0-alpha (Phase 1)
**Status:** Development
**Last Updated:** February 2025
