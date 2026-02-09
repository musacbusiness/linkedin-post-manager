#!/usr/bin/env python3
"""
Test script to verify Streamlit app setup and API connectivity
Run this before deployment to ensure everything is configured correctly
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all required modules can be imported"""
    print("\n=== Testing Imports ===")
    try:
        import config
        print("✅ config module imported")
    except Exception as e:
        print(f"❌ Failed to import config: {e}")
        return False

    try:
        from utils.airtable_client import AirtableClient
        print("✅ AirtableClient imported")
    except Exception as e:
        print(f"❌ Failed to import AirtableClient: {e}")
        return False

    try:
        from utils.modal_client import ModalClient
        print("✅ ModalClient imported")
    except Exception as e:
        print(f"❌ Failed to import ModalClient: {e}")
        return False

    try:
        from components.post_table import render_post_table
        print("✅ post_table components imported")
    except Exception as e:
        print(f"❌ Failed to import post_table: {e}")
        return False

    return True


def test_config():
    """Test configuration is properly loaded"""
    print("\n=== Testing Configuration ===")
    import config

    if not config.validate_config():
        print("❌ Configuration validation failed")
        return False

    print(f"✅ AIRTABLE_API_KEY: {'***' + config.AIRTABLE_API_KEY[-10:] if config.AIRTABLE_API_KEY else 'NOT SET'}")
    print(f"✅ AIRTABLE_BASE_ID: {config.AIRTABLE_BASE_ID}")
    print(f"✅ AIRTABLE_LINKEDIN_TABLE_ID: {config.AIRTABLE_LINKEDIN_TABLE_ID}")
    print(f"✅ MODAL_WEBHOOK_BASE_URL: {config.MODAL_WEBHOOK_BASE_URL}")
    print(f"✅ CACHE_TTL: {config.CACHE_TTL}s")

    return True


def test_airtable_connection():
    """Test Airtable API connectivity"""
    print("\n=== Testing Airtable Connection ===")
    from utils.airtable_client import AirtableClient

    try:
        client = AirtableClient()
        posts_count = client.get_posts_count()
        print(f"✅ Airtable connected! Found {posts_count} posts")
        return True
    except Exception as e:
        print(f"❌ Airtable connection failed: {e}")
        return False


def test_modal_webhooks():
    """Test Modal webhook accessibility"""
    print("\n=== Testing Modal Webhooks ===")
    from utils.modal_client import ModalClient

    try:
        client = ModalClient()
        health = client.health_check()
        if health["success"]:
            print(f"✅ Modal webhooks accessible")
            print(f"   Status: {health['message']}")
            return True
        else:
            print(f"❌ Modal webhooks not accessible: {health['message']}")
            return False
    except Exception as e:
        print(f"❌ Modal health check failed: {e}")
        return False


def test_airtable_sample():
    """Test fetching sample posts from Airtable"""
    print("\n=== Testing Sample Data ===")
    from utils.airtable_client import AirtableClient

    try:
        client = AirtableClient()
        posts = client.get_all_posts()

        if posts:
            print(f"✅ Fetched {len(posts)} posts from Airtable")
            # Show sample post
            sample = posts[0]
            fields = sample.get("fields", {})
            print(f"   Sample: {fields.get('Title', 'Untitled')[:50]}")
            print(f"   Status: {fields.get('Status', 'Unknown')}")
            return True
        else:
            print("⚠️  No posts found in Airtable (this might be normal if table is empty)")
            return True  # Not a failure if table is empty
    except Exception as e:
        print(f"❌ Failed to fetch sample data: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 50)
    print("Streamlit LinkedIn Post Manager - Setup Verification")
    print("=" * 50)

    tests = [
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("Airtable Connection", test_airtable_connection),
        ("Modal Webhooks", test_modal_webhooks),
        ("Sample Data", test_airtable_sample),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Unexpected error in {name}: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! App is ready to deploy.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
