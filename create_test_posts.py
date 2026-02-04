#!/usr/bin/env python3
"""
Create sample test posts in Supabase to verify app works
Run this to populate Supabase with demo data
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

from utils.supabase_client import SupabaseClient


def main():
    print("\n" + "="*60)
    print("  Creating Test Posts in Supabase")
    print("="*60 + "\n")

    # Initialize Supabase client
    try:
        supabase = SupabaseClient()
        print("✅ Connected to Supabase\n")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return False

    # Sample posts
    test_posts = [
        {
            "title": "🤖 AI Automation is Changing LinkedIn",
            "post_content": "AI is transforming how we work on LinkedIn. Automation tools help us save time on repetitive tasks while staying authentic.",
            "status": "Draft",
            "topic": "AI & Automation",
        },
        {
            "title": "📊 Data-Driven Decision Making",
            "post_content": "Making decisions based on data rather than intuition leads to better outcomes. Here's why analytics matter in 2025.",
            "status": "Pending Review",
            "topic": "Analytics",
        },
        {
            "title": "🎯 Setting Goals for the New Year",
            "post_content": "New year, new goals! Here's my framework for setting realistic and achievable objectives.",
            "status": "Approved - Ready to Schedule",
            "topic": "Goals",
        },
        {
            "title": "💡 Productivity Tips for Remote Teams",
            "post_content": "Working remotely requires discipline and structure. These 5 tips have helped me stay productive.",
            "status": "Draft",
            "topic": "Productivity",
        },
        {
            "title": "🚀 Building Better Products",
            "post_content": "Product development is as much art as it is science. Here's how we approach it at our company.",
            "status": "Scheduled",
            "scheduled_time": "2025-02-10T09:00:00+00:00",
            "topic": "Product Development",
        },
    ]

    # Create posts
    created = 0
    for post in test_posts:
        try:
            result = supabase.create_post(post)
            title = post.get("title", "Untitled")[:50]
            status = post.get("status", "Draft")
            print(f"✅ Created: {title} [{status}]")
            created += 1
        except Exception as e:
            title = post.get("title", "Untitled")[:50]
            print(f"❌ Failed: {title} - {str(e)[:50]}")

    print(f"\n{'='*60}")
    print(f"✅ Successfully created {created} test posts!")
    print(f"{'='*60}\n")

    print("Next steps:")
    print("  1. Refresh your Streamlit app")
    print("  2. You should now see the test posts")
    print("  3. Verify all features work (edit, generate image, etc.)")
    print("\n💡 When Airtable quota resets, run: python3 migrate_airtable_to_supabase.py")
    print("   to migrate your 18 real posts from Airtable.\n")

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
