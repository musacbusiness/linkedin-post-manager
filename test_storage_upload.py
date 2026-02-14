#!/usr/bin/env python3
"""
Test script to verify Supabase storage upload functionality
Run this to diagnose storage upload issues
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from streamlit_app.utils.supabase_client import SupabaseClient

def test_storage_upload():
    """Test basic storage upload functionality"""
    print("\n" + "="*60)
    print("TESTING SUPABASE STORAGE UPLOAD")
    print("="*60 + "\n")

    try:
        # Initialize Supabase client
        print("[1] Initializing Supabase client...")
        client = SupabaseClient()
        print("✅ Supabase client initialized\n")

        # Create a simple test image (small 100x100 white PNG)
        print("[2] Creating test image...")
        # Simple white PNG: 1x1 pixel
        test_image_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        print(f"✅ Created test image ({len(test_image_bytes)} bytes)\n")

        # Test upload
        print("[3] Testing storage upload...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_{timestamp}.jpg"
        print(f"   Filename: {filename}")
        print(f"   Bucket: generated-images")

        storage_result = client.upload_image_to_storage(test_image_bytes, filename)
        print(f"   Result: {storage_result}\n")

        if storage_result.get("success"):
            print("✅ UPLOAD SUCCESSFUL!")
            print(f"   URL: {storage_result.get('url')}\n")

            # Try to access the URL
            print("[4] Verifying public URL access...")
            import requests
            try:
                response = requests.head(storage_result.get('url'), timeout=5)
                if response.status_code == 200:
                    print(f"✅ URL is accessible (HTTP {response.status_code})\n")
                else:
                    print(f"⚠️  URL returned HTTP {response.status_code}\n")
            except Exception as e:
                print(f"❌ Could not access URL: {e}\n")
        else:
            print("❌ UPLOAD FAILED!")
            print(f"   Error: {storage_result.get('error')}\n")

            # Additional diagnostics
            print("[4] Running diagnostics...")

            # Check if bucket exists
            try:
                print("   Checking if bucket 'generated-images' exists...")
                buckets = client.client.storage.list_buckets()
                bucket_names = [b.name for b in buckets]
                print(f"   Available buckets: {bucket_names}")

                if "generated-images" in bucket_names:
                    print("   ✅ 'generated-images' bucket exists")
                else:
                    print("   ❌ 'generated-images' bucket NOT FOUND")
                    print("   Creating bucket...")
                    client.client.storage.create_bucket("generated-images", options={
                        "public": True,
                        "allowed_mime_types": ["image/jpeg", "image/png", "image/gif"],
                        "file_size_limit": 52428800  # 50MB
                    })
                    print("   ✅ Bucket created")
            except Exception as e:
                print(f"   ❌ Error checking buckets: {e}")

        print("="*60)
        print("TEST COMPLETE")
        print("="*60 + "\n")

    except Exception as e:
        print(f"❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_storage_upload()
