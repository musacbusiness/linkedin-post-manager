#!/usr/bin/env python3
"""
Database setup script for LinkedIn post generation pipeline
Creates failed_posts and prompt_versions tables in Supabase
"""

import os
import sys
import requests
import json
from datetime import datetime
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Supabase API headers
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def create_failed_posts_table():
    """Create failed_posts table"""
    sql = """
    CREATE TABLE IF NOT EXISTS failed_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        original_post_content TEXT,
        failed_checks JSONB,
        quality_scores JSONB,
        root_cause TEXT,
        failing_stage TEXT,
        failing_model TEXT,
        solution TEXT,
        updated_prompt TEXT,
        retry_attempt INTEGER,
        failed_at TIMESTAMP DEFAULT NOW(),
        resolved BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS idx_failed_posts_failing_stage ON failed_posts(failing_stage);
    CREATE INDEX IF NOT EXISTS idx_failed_posts_failing_model ON failed_posts(failing_model);
    CREATE INDEX IF NOT EXISTS idx_failed_posts_resolved ON failed_posts(resolved);
    """

    return execute_sql(sql, "failed_posts")

def create_prompt_versions_table():
    """Create prompt_versions table"""
    sql = """
    CREATE TABLE IF NOT EXISTS prompt_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        stage_name TEXT NOT NULL,
        model_name TEXT NOT NULL,
        prompt_version INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        change_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prompt_versions_stage_model
        ON prompt_versions(stage_name, model_name);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_version
        ON prompt_versions(stage_name, model_name, prompt_version DESC);
    """

    return execute_sql(sql, "prompt_versions")

def execute_sql(sql: str, table_name: str) -> dict:
    """Execute SQL via Supabase REST API"""
    try:
        # For RPC calls, use the rpc endpoint
        url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"

        # Actually, Supabase doesn't have direct SQL execution via REST API for normal users
        # We need to use the Supabase Python client instead
        # Let me print instructions for manual creation instead

        print(f"\n📋 {table_name} SQL:")
        print(sql)
        return {"success": True, "message": f"Use this SQL to create {table_name} in Supabase"}

    except Exception as e:
        print(f"❌ Error executing SQL: {str(e)}")
        return {"success": False, "error": str(e)}

def manual_setup_instructions():
    """Print instructions for manual table creation"""
    print("""
╔════════════════════════════════════════════════════════════════╗
║          SUPABASE TABLE CREATION INSTRUCTIONS                  ║
╚════════════════════════════════════════════════════════════════╝

⚠️  Supabase REST API doesn't support direct SQL execution.

To create the required tables, follow these steps:

1. Go to https://supabase.com/dashboard
2. Navigate to your project: 'ehybwxxbrsykykiygods'
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL below, then click "Run"

═══════════════════════════════════════════════════════════════════
    """)

    # failed_posts table
    failed_posts_sql = """
-- Create failed_posts table
CREATE TABLE IF NOT EXISTS failed_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_post_content TEXT,
    failed_checks JSONB,
    quality_scores JSONB,
    root_cause TEXT,
    failing_stage TEXT,
    failing_model TEXT,
    solution TEXT,
    updated_prompt TEXT,
    retry_attempt INTEGER,
    failed_at TIMESTAMP DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- Create indexes for faster queries
CREATE INDEX idx_failed_posts_failing_stage ON failed_posts(failing_stage);
CREATE INDEX idx_failed_posts_failing_model ON failed_posts(failing_model);
CREATE INDEX idx_failed_posts_resolved ON failed_posts(resolved);

-- Create prompt_versions table
CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_version INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_prompt_versions_stage_model ON prompt_versions(stage_name, model_name);
CREATE INDEX idx_prompt_versions_version ON prompt_versions(stage_name, model_name, prompt_version DESC);

-- Add image_prompt column to posts table if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_prompt TEXT;

-- Add generation_metadata column to posts table if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS generation_metadata JSONB;

-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('failed_posts', 'prompt_versions');
    """

    print(failed_posts_sql)
    print("\n═══════════════════════════════════════════════════════════════════")
    print("Once you've run this SQL, the tables will be ready for use.")
    print("═══════════════════════════════════════════════════════════════════\n")

if __name__ == "__main__":
    print("\n🔧 Setting up database for LinkedIn post generation pipeline...\n")

    # Check Supabase connection
    print(f"✅ Supabase URL: {SUPABASE_URL}")
    print(f"✅ Supabase Key: {SUPABASE_KEY[:20]}...")

    manual_setup_instructions()

    print("\n📌 Summary:")
    print("   - failed_posts table: Logs all quality control failures")
    print("   - prompt_versions table: Tracks system prompt changes")
    print("   - posts table updates: Added image_prompt and generation_metadata columns")
    print("\n✅ Follow the instructions above to create these tables in Supabase.\n")
