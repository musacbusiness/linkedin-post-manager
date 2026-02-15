"""
Modal Cron Job for LinkedIn Post Publishing
Runs every 5 minutes to check for scheduled posts and send to Make.com
"""

import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional

# Import Modal
import modal

# Initialize Modal app
app = modal.App("linkedin-posting-cron")

# Create a Modal volume for logging
posting_log = modal.Volume.from_name("posting-log", create_if_missing=True)


@app.function(
    schedule=modal.Period(minutes=5),  # Run every 5 minutes
    volumes={"/logs": posting_log},
    secrets=[modal.Secret.from_name("linkedin-posting")]
)
def check_and_post_scheduled_posts():
    """
    Cron job that runs every 5 minutes to:
    1. Query Supabase for posts ready to post (scheduled_time <= NOW and posted_at IS NULL)
    2. Send each post to Make.com webhook
    3. Make.com handles posting to LinkedIn and updating Supabase
    """

    # Get credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    make_webhook_url = os.getenv("MAKE_LINKEDIN_WEBHOOK_URL")

    if not all([supabase_url, supabase_key, make_webhook_url]):
        log_error("Missing environment variables")
        return {"success": False, "error": "Missing credentials"}

    try:
        # Query Supabase for posts ready to post
        posts_ready = query_supabase_for_ready_posts(supabase_url, supabase_key)

        if not posts_ready:
            log_message(f"No posts ready to post at {datetime.now().isoformat()}")
            return {"success": True, "posts_processed": 0, "posts_found": 0}

        log_message(f"Found {len(posts_ready)} posts ready to post")

        # Send each post to Make.com
        processed_count = 0
        error_count = 0

        for post in posts_ready:
            try:
                # Extract post data
                record_id = post.get("id", "")
                title = post.get("title", "")
                content = post.get("post_content", "")
                image_url = post.get("image_url", "")

                # Send to Make.com webhook
                webhook_payload = {
                    "record_id": record_id,
                    "title": title,
                    "content": content,
                    "image_url": image_url,
                    "timestamp": datetime.now().isoformat()
                }

                response = requests.post(
                    make_webhook_url,
                    json=webhook_payload,
                    timeout=30
                )

                if response.status_code in (200, 201, 202, 204):
                    log_message(f"✅ Sent post {record_id} to Make.com")
                    processed_count += 1
                else:
                    error_msg = f"Make.com returned {response.status_code}: {response.text[:200]}"
                    log_error(f"❌ Failed to send post {record_id}: {error_msg}")
                    error_count += 1

            except Exception as e:
                log_error(f"Error processing post {post.get('id', 'unknown')}: {str(e)}")
                error_count += 1

        result = {
            "success": True,
            "posts_found": len(posts_ready),
            "posts_processed": processed_count,
            "posts_failed": error_count,
            "timestamp": datetime.now().isoformat()
        }

        log_message(f"Cron job completed: {result}")
        return result

    except Exception as e:
        error_msg = f"Cron job error: {str(e)}"
        log_error(error_msg)
        return {"success": False, "error": error_msg}


def query_supabase_for_ready_posts(supabase_url: str, supabase_key: str) -> List[Dict]:
    """
    Query Supabase for posts that are scheduled and ready to post

    Filters:
    - status = "Approved"
    - scheduled_time <= NOW
    - posted_at IS NULL

    Returns:
        List of post dictionaries ready to post
    """
    try:
        # Build Supabase REST API query
        url = f"{supabase_url}/rest/v1/posts"

        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        # Query for posts ready to post
        # - scheduled_time must be <= NOW
        # - posted_at must be NULL (not yet posted)
        # - status must be Approved
        now_iso = datetime.now().isoformat()

        params = {
            "select": "*",
            "status": "eq.Approved",
            "posted_at": "is.null",
            "scheduled_time": f"lte.{now_iso}",
            "order": "scheduled_time.asc"
        }

        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=30
        )

        if response.status_code == 200:
            posts = response.json()
            return posts if isinstance(posts, list) else []
        else:
            log_error(f"Supabase query failed: {response.status_code} - {response.text[:200]}")
            return []

    except Exception as e:
        log_error(f"Error querying Supabase: {str(e)}")
        return []


def log_message(message: str):
    """Log a message to the Modal volume"""
    try:
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {message}\n"

        # Write to log file
        with open("/logs/posting_cron.log", "a") as f:
            f.write(log_entry)

        print(log_entry)
    except Exception as e:
        print(f"Error logging message: {str(e)}")


def log_error(error_msg: str):
    """Log an error message"""
    try:
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] ERROR: {error_msg}\n"

        with open("/logs/posting_cron.log", "a") as f:
            f.write(log_entry)

        print(log_entry)
    except Exception as e:
        print(f"Error logging error: {str(e)}")


@app.local_entrypoint()
def run_test():
    """Test the cron job locally"""
    print("Testing LinkedIn posting cron job...")
    print("\nNote: In production, this runs automatically every 5 minutes on Modal")
    print("To deploy, run: modal deploy modal_cron_posting.py")
    print("\nRunning check now...")

    result = check_and_post_scheduled_posts()
    print(f"\nTest result: {json.dumps(result, indent=2)}")
