"""
Configuration for Streamlit LinkedIn Post Manager
Loads environment variables for Airtable and Modal API access
"""

import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent directory (for local development)
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Also try to load from project root
env_root = Path(__file__).parent.parent / ".env"
if env_root.exists():
    load_dotenv(env_root)

# Airtable Configuration
AIRTABLE_API_KEY: str = os.getenv("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID: str = os.getenv("AIRTABLE_BASE_ID", "")
AIRTABLE_LINKEDIN_TABLE_ID: str = os.getenv("AIRTABLE_LINKEDIN_TABLE_ID", "")

# Construct full Airtable API base URL
AIRTABLE_API_URL: str = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_LINKEDIN_TABLE_ID}"

# Modal Configuration
MODAL_WEBHOOK_BASE_URL: str = os.getenv("MODAL_WEBHOOK_BASE_URL", "")

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
    """
    required = [
        ("AIRTABLE_API_KEY", AIRTABLE_API_KEY),
        ("AIRTABLE_BASE_ID", AIRTABLE_BASE_ID),
        ("AIRTABLE_LINKEDIN_TABLE_ID", AIRTABLE_LINKEDIN_TABLE_ID),
        ("MODAL_WEBHOOK_BASE_URL", MODAL_WEBHOOK_BASE_URL),
    ]

    missing = [name for name, value in required if not value]

    if missing:
        print(f"❌ Missing configuration: {', '.join(missing)}")
        return False

    return True
