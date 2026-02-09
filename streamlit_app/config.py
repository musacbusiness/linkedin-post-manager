"""
Configuration for Streamlit LinkedIn Post Manager
Loads environment variables for Supabase and Modal API access
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

# Supabase Configuration
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# Modal Configuration
MODAL_WEBHOOK_BASE_URL: str = os.getenv("MODAL_WEBHOOK_BASE_URL", "")

# Cache TTL (in seconds)
CACHE_TTL: int = 30  # Refresh Airtable data every 30 seconds

# Pagination
POSTS_PER_PAGE: int = 20

# LinkedIn Post Status Values (Simplified 3-status system)
# - Pending Review: Posts awaiting review
# - Approved: Posts scheduled/posted (tracked via scheduled_time and posted_at fields)
# - Rejected: Posts deleted (moved to audit table, not shown in UI)
POST_STATUSES = {
    "Pending Review": "🔵 Pending Review",
    "Approved": "🟢 Approved",
    "Rejected": "❌ Rejected",
}

# Status Colors for UI
STATUS_COLORS = {
    "🔵 Pending Review": "#4169E1",
    "🟢 Approved": "#32CD32",
    "❌ Rejected": "#DC143C",
}

# Time windows for auto-scheduling (start_hour, end_hour) - user's local timezone
TIME_WINDOWS = [
    (8, 10),   # 8:00 AM - 10:00 AM
    (12, 14),  # 12:00 PM - 2:00 PM
    (17, 19),  # 5:00 PM - 7:00 PM
]

# Audit retention period (days) - how long to keep deleted posts in audit table
AUDIT_RETENTION_DAYS = 7

# Posted post retention period (days) - how long to keep posted posts before deleting
POSTED_RETENTION_DAYS = 7

def validate_config() -> bool:
    """
    Validate that all required configuration is set.
    Returns True if all required vars are present, False otherwise.
    """
    required = [
        ("SUPABASE_URL", SUPABASE_URL),
        ("SUPABASE_KEY", SUPABASE_KEY),
        ("MODAL_WEBHOOK_BASE_URL", MODAL_WEBHOOK_BASE_URL),
    ]

    missing = [name for name, value in required if not value]

    if missing:
        print(f"❌ Missing configuration: {', '.join(missing)}")
        return False

    return True
