"""
Configuration for Streamlit LinkedIn Post Manager
Loads environment variables for Airtable and Modal API access
"""

import os
from typing import Optional
from pathlib import Path

# Try to import Streamlit for secrets (Streamlit Cloud)
try:
    import streamlit as st
    _STREAMLIT_AVAILABLE = True
except ImportError:
    _STREAMLIT_AVAILABLE = False

# Try to load from dotenv for local development
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# Load configuration from Streamlit secrets (Cloud) or environment variables (local)
if _STREAMLIT_AVAILABLE:
    try:
        # Try nested format first (TOML sections)
        AIRTABLE_API_KEY: str = st.secrets.get("airtable", {}).get("api_key") or st.secrets.get("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_KEY", "")
        AIRTABLE_BASE_ID: str = st.secrets.get("airtable", {}).get("base_id") or st.secrets.get("AIRTABLE_BASE_ID") or os.getenv("AIRTABLE_BASE_ID", "")
        AIRTABLE_LINKEDIN_TABLE_ID: str = st.secrets.get("airtable", {}).get("table_id") or st.secrets.get("AIRTABLE_LINKEDIN_TABLE_ID") or os.getenv("AIRTABLE_LINKEDIN_TABLE_ID", "")
        MODAL_WEBHOOK_BASE_URL: str = st.secrets.get("modal", {}).get("webhook_base_url") or st.secrets.get("MODAL_WEBHOOK_BASE_URL") or os.getenv("MODAL_WEBHOOK_BASE_URL", "")
    except Exception as e:
        # Fallback: try flat environment variables
        AIRTABLE_API_KEY: str = os.getenv("AIRTABLE_API_KEY", "")
        AIRTABLE_BASE_ID: str = os.getenv("AIRTABLE_BASE_ID", "")
        AIRTABLE_LINKEDIN_TABLE_ID: str = os.getenv("AIRTABLE_LINKEDIN_TABLE_ID", "")
        MODAL_WEBHOOK_BASE_URL: str = os.getenv("MODAL_WEBHOOK_BASE_URL", "")
else:
    # Fallback to environment variables only (for non-Streamlit environments)
    AIRTABLE_API_KEY: str = os.getenv("AIRTABLE_API_KEY", "")
    AIRTABLE_BASE_ID: str = os.getenv("AIRTABLE_BASE_ID", "")
    AIRTABLE_LINKEDIN_TABLE_ID: str = os.getenv("AIRTABLE_LINKEDIN_TABLE_ID", "")
    MODAL_WEBHOOK_BASE_URL: str = os.getenv("MODAL_WEBHOOK_BASE_URL", "")

# Construct full Airtable API base URL
AIRTABLE_API_URL: str = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_LINKEDIN_TABLE_ID}"

# Cache TTL (in seconds)
CACHE_TTL: int = 30  # Refresh Airtable data every 30 seconds

# Pagination
POSTS_PER_PAGE: int = 20

# LinkedIn Post Status Values
POST_STATUSES = {
    "Draft": "🟡 Draft",
    "Pending Review": "🔵 Pending Review",
    "Approved - Ready to Schedule": "🟢 Approved",
    "Scheduled": "🟣 Scheduled",
    "Posted": "✅ Posted",
    "Rejected": "❌ Rejected",
}

# Status Colors for UI
STATUS_COLORS = {
    "🟡 Draft": "#FFD700",
    "🔵 Pending Review": "#4169E1",
    "🟢 Approved": "#32CD32",
    "🟣 Scheduled": "#9370DB",
    "✅ Posted": "#228B22",
    "❌ Rejected": "#DC143C",
}

def validate_config() -> bool:
    """
    Validate that all required configuration is set.
    Returns True if all required vars are present, False otherwise.

    Note: MODAL_WEBHOOK_BASE_URL is optional with Plan B architecture
    (we use direct APIs instead of Modal webhooks)
    """
    required = [
        ("AIRTABLE_API_KEY", AIRTABLE_API_KEY),
        ("AIRTABLE_BASE_ID", AIRTABLE_BASE_ID),
        ("AIRTABLE_LINKEDIN_TABLE_ID", AIRTABLE_LINKEDIN_TABLE_ID),
    ]

    missing = [name for name, value in required if not value]

    if missing:
        print(f"❌ Missing configuration: {', '.join(missing)}")
        return False

    return True
