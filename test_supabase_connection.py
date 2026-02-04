#!/usr/bin/env python3
"""
Test script for Supabase connection and schema validation
Run this after deploying the Supabase schema to verify everything is working
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

from utils.supabase_client import SupabaseClient


def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_credentials():
    """Test 1: Verify Supabase credentials are set"""
    print_section("Test 1: Checking Supabase Credentials")

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url:
        print("❌ SUPABASE_URL not found in environment")
        return False

    if not key:
        print("❌ SUPABASE_KEY not found in environment")
        return False

    print(f"✅ SUPABASE_URL: {url[:50]}...")
    print(f"✅ SUPABASE_KEY: {key[:20]}...{key[-10:]}")
    return True


def test_connection():
    """Test 2: Initialize Supabase client"""
    print_section("Test 2: Initializing Supabase Client")

    try:
        client = SupabaseClient()
        print("✅ Supabase client initialized successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {e}")
        return None


def test_table_exists(client):
    """Test 3: Check if posts table exists"""
    print_section("Test 3: Checking if 'posts' Table Exists")

    try:
        count = client.get_posts_count()
        print(f"✅ Posts table exists with {count} records")
        return True
    except Exception as e:
        print(f"❌ Failed to query posts table: {e}")
        print("\n💡 Solution: You need to run supabase_schema.sql in your Supabase dashboard:")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Go to SQL Editor")
        print("   4. Click 'New Query'")
        print("   5. Copy & paste contents of supabase_schema.sql")
        print("   6. Click 'Run'")
        return False


def test_create_post(client):
    """Test 4: Create a test post"""
    print_section("Test 4: Creating Test Post")

    try:
        test_post = {
            "title": "🧪 Test Post - Supabase Connection Verified",
            "post_content": "This is a test post created during connection verification. You can delete this.",
            "status": "Draft",
            "topic": "Testing",
        }

        created = client.create_post(test_post)
        test_id = created.get("id")

        print(f"✅ Test post created successfully")
        print(f"   ID: {test_id}")
        print(f"   Title: {created.get('title', 'N/A')}")

        return test_id
    except Exception as e:
        print(f"❌ Failed to create test post: {e}")
        return None


def test_read_posts(client):
    """Test 5: Read all posts"""
    print_section("Test 5: Reading All Posts")

    try:
        posts = client.get_all_posts()
        print(f"✅ Successfully fetched {len(posts)} posts")

        if posts:
            print("\n   Sample posts:")
            for post in posts[:3]:
                title = post.get("fields", {}).get("Title", "Untitled")
                status = post.get("fields", {}).get("Status", "Unknown")
                print(f"   - {title[:50]} [{status}]")

        return True
    except Exception as e:
        print(f"❌ Failed to read posts: {e}")
        return False


def test_update_post(client, post_id):
    """Test 6: Update a post"""
    print_section("Test 6: Updating Test Post")

    if not post_id:
        print("⏭️  Skipped (no test post to update)")
        return False

    try:
        updated = client.update_post(post_id, {
            "status": "Pending Review",
            "notes": "Updated during connection test"
        })

        print(f"✅ Post updated successfully")
        print(f"   Status: {updated.get('status', 'N/A')}")
        print(f"   Notes: {updated.get('notes', 'N/A')}")

        return True
    except Exception as e:
        print(f"❌ Failed to update post: {e}")
        return False


def test_search_posts(client):
    """Test 7: Search posts"""
    print_section("Test 7: Searching Posts")

    try:
        results = client.search_posts("test")
        print(f"✅ Search completed, found {len(results)} matching posts")

        if results:
            print("\n   Results:")
            for result in results[:3]:
                title = result.get("fields", {}).get("Title", "Untitled")
                print(f"   - {title[:60]}")

        return True
    except Exception as e:
        print(f"❌ Failed to search posts: {e}")
        return False


def test_delete_post(client, post_id):
    """Test 8: Delete test post"""
    print_section("Test 8: Cleaning Up (Deleting Test Post)")

    if not post_id:
        print("⏭️  Skipped (no test post to delete)")
        return True

    try:
        success = client.delete_post(post_id)
        if success:
            print(f"✅ Test post deleted successfully")
            return True
        else:
            print(f"⚠️  Delete returned False (check manually)")
            return False
    except Exception as e:
        print(f"❌ Failed to delete post: {e}")
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "  Supabase Connection & Schema Validation Test".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")

    results = {}

    # Test 1: Credentials
    if not test_credentials():
        print("\n❌ Credentials check failed. Cannot continue.")
        return False

    # Test 2: Connection
    client = test_connection()
    if not client:
        print("\n❌ Connection failed. Cannot continue.")
        return False

    # Test 3: Table exists
    results["table_exists"] = test_table_exists(client)
    if not results["table_exists"]:
        print("\n❌ Posts table not found. Please run supabase_schema.sql first.")
        return False

    # Test 4: Create post
    test_post_id = test_create_post(client)
    results["create"] = test_post_id is not None

    # Test 5: Read posts
    results["read"] = test_read_posts(client)

    # Test 6: Update post
    results["update"] = test_update_post(client, test_post_id)

    # Test 7: Search posts
    results["search"] = test_search_posts(client)

    # Test 8: Delete post
    results["delete"] = test_delete_post(client, test_post_id)

    # Summary
    print_section("Test Summary")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"Passed: {passed}/{total}")
    print()

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {test_name}")

    print()

    if passed == total:
        print("🎉 All tests passed! Supabase is properly configured and ready to use.")
        print("\n✅ Next steps:")
        print("   1. Update app.py to use SupabaseClient (already done)")
        print("   2. Push code to GitHub: git push origin main")
        print("   3. Streamlit Cloud will auto-deploy the updated app")
        print("   4. Add SUPABASE_URL and SUPABASE_KEY to Streamlit Secrets")
        print("   5. Refresh your Streamlit app")
        return True
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
