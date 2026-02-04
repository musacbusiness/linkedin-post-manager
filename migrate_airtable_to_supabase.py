#!/usr/bin/env python3
"""
Migrate existing posts from Airtable to Supabase
Run this script once to transfer all your existing data
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

from utils.airtable_client import AirtableClient
from utils.supabase_client import SupabaseClient


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def transform_airtable_to_supabase(airtable_record):
    """
    Transform Airtable record format to Supabase format

    Airtable format:
    {
        "id": "rec...",
        "fields": {
            "Title": "...",
            "Post Content": "...",
            ...
        }
    }

    Supabase format:
    {
        "title": "...",
        "post_content": "...",
        ...
    }
    """
    fields = airtable_record.get("fields", {})

    # Field mapping: Airtable PascalCase → Supabase snake_case
    supabase_record = {
        "title": fields.get("Title", "Untitled"),
        "post_content": fields.get("Post Content", ""),
        "image_url": fields.get("Image URL"),
        "status": fields.get("Status", "Draft"),
        "scheduled_time": fields.get("Scheduled Time"),
        "posted_time": fields.get("Posted"),
        "linkedin_url": fields.get("LinkedIn URL"),
        "revision_prompt": fields.get("Revision Prompt"),
        "revision_type": fields.get("Revision Type"),
        "notes": fields.get("Notes"),
        "topic": fields.get("Topic"),
        "source": "migrated_from_airtable",
    }

    # Remove None values to avoid issues
    return {k: v for k, v in supabase_record.items() if v is not None}


def main():
    """Run migration"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "  Airtable → Supabase Migration".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")

    # Step 1: Connect to Airtable
    print_section("Step 1: Connecting to Airtable")

    try:
        airtable_client = AirtableClient()
        print("✅ Airtable client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Airtable client: {e}")
        return False

    # Step 2: Connect to Supabase
    print_section("Step 2: Connecting to Supabase")

    try:
        supabase_client = SupabaseClient()
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {e}")
        return False

    # Step 3: Fetch all posts from Airtable
    print_section("Step 3: Fetching Posts from Airtable")

    try:
        airtable_posts = airtable_client.get_all_posts()
        print(f"✅ Retrieved {len(airtable_posts)} posts from Airtable")

        if not airtable_posts:
            print("\n⚠️  No posts found in Airtable. Nothing to migrate.")
            return True

    except Exception as e:
        print(f"❌ Failed to fetch posts from Airtable: {e}")
        return False

    # Step 4: Migrate posts to Supabase
    print_section("Step 4: Migrating Posts to Supabase")

    successful = 0
    failed = 0
    failed_posts = []

    for idx, airtable_post in enumerate(airtable_posts, 1):
        try:
            # Transform the record
            supabase_post = transform_airtable_to_supabase(airtable_post)

            # Create in Supabase
            result = supabase_client.create_post(supabase_post)

            title = supabase_post.get("title", "Untitled")[:50]
            print(f"  ✅ [{idx}/{len(airtable_posts)}] {title}")
            successful += 1

        except Exception as e:
            title = airtable_post.get("fields", {}).get("Title", "Untitled")[:50]
            print(f"  ❌ [{idx}/{len(airtable_posts)}] {title} - Error: {str(e)[:50]}")
            failed += 1
            failed_posts.append((title, str(e)))

    # Step 5: Summary
    print_section("Migration Summary")

    print(f"✅ Successful:  {successful} posts")
    print(f"❌ Failed:      {failed} posts")
    print(f"📊 Total:       {len(airtable_posts)} posts")

    if failed_posts:
        print("\n⚠️  Failed posts:")
        for title, error in failed_posts[:5]:  # Show first 5
            print(f"  - {title}: {error[:40]}")
        if len(failed_posts) > 5:
            print(f"  ... and {len(failed_posts) - 5} more")

    # Step 6: Verify
    print_section("Verifying Migration")

    try:
        supabase_count = supabase_client.get_posts_count()
        print(f"✅ Supabase now has {supabase_count} posts")

        if supabase_count == successful:
            print("\n🎉 Migration successful!")
            print(f"\n✅ Next steps:")
            print(f"   1. Refresh your Streamlit app")
            print(f"   2. You should now see {successful} posts")
            print(f"   3. Verify all posts migrated correctly")
            print(f"   4. (Optional) Delete old Airtable posts when confident")
            return True
        else:
            print(f"\n⚠️  Count mismatch: Migrated {successful} but Supabase shows {supabase_count}")
            return False

    except Exception as e:
        print(f"❌ Failed to verify: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
