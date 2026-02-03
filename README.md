# LinkedIn Post Manager - Streamlit Frontend

Event-driven content management for LinkedIn posts using Streamlit, Airtable, and Modal webhooks.

**Status:** ✅ Ready for deployment | Modal webhooks live | All tests passing

---

## Quick Start

### 1. Clone This Repository
```bash
git clone https://github.com/YOUR_USERNAME/linkedin-post-manager.git
cd linkedin-post-manager
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create `.env` file in project root:
```bash
cp .env.example .env
nano .env
```

Fill in your credentials (see `.env.example` for template)

### 4. Run Locally
```bash
streamlit run app.py
```

Opens at `http://localhost:8501`

---

## Deployment to Streamlit Cloud

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy via Streamlit Cloud

1. Go to https://share.streamlit.io
2. Click **"New app"** → **"From existing repo"**
3. Fill in:
   - **Repository:** `YOUR_USERNAME/linkedin-post-manager`
   - **Branch:** `main`
   - **Main file path:** `app.py`
4. Click **Deploy**

### Step 3: Add Secrets

After deployment:
1. Click your app
2. Settings (⚙️) → **"Secrets"**
3. Paste (in TOML format):

```toml
[airtable]
api_key = "your_api_key"
base_id = "your_base_id"
table_id = "your_table_id"

[modal]
webhook_base_url = "https://your-modal-webhook-url.modal.run"
```

4. Click **Save**

---

## Features

### Phase 1: Foundation ✅
- View all posts from Airtable
- Search and filter posts
- Real-time API status
- Verification tests (5/5 passing)

### Phase 2: Event-Driven Actions (Coming)
- Approve/Reject buttons
- Post editor
- Image generation
- Revision interface
- Calendar view

---

## Testing

```bash
python3 test_setup.py
```

All tests should pass (5/5).

---

## Cost

- **Streamlit Cloud:** Free
- **Airtable:** Free
- **Modal:** ~$1/month (80-90% savings vs polling)

---

## Documentation

- **DEPLOYMENT.md** - Step-by-step guide
- **ARCHITECTURE.md** - Technical details

---

**Version:** 1.0.0 | **Status:** Production Ready
