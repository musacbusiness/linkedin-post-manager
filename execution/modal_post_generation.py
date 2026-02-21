#!/usr/bin/env python3
"""
Modal Cron Job for Daily LinkedIn Post Generation

Runs daily at 9 AM to generate posts and maintain 21-post queue in Supabase.
Uses the PostGenerationPipeline to automatically generate and quality-control posts.

Scheduled: Daily at 9:00 AM UTC
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import dependencies
import modal
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from execution.post_generation_pipeline import PostGenerationPipeline

# Create Modal app
app = modal.App(
    name="linkedin-post-generation",
    image=modal.Image.debian_slim()
    .pip_install([
        "langchain",
        "langchain-community",
        "huggingface_hub",
        "tenacity",
        "pydantic",
        "anthropic",
        "python-dotenv",
        "supabase"
    ])
)


def get_supabase_client():
    """Initialize Supabase client"""
    try:
        from supabase import create_client

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")

        if not url or not key:
            logger.error("❌ Supabase credentials missing from .env")
            return None

        client = create_client(url, key)
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase client: {str(e)}")
        return None


def get_active_post_count(supabase_client) -> int:
    """Get count of active (not scheduled/posted) posts in Supabase"""
    try:
        response = supabase_client.table("posts") \
            .select("id") \
            .in_("status", ["Pending Review", "Approved", "Scheduled"]) \
            .execute()

        return len(response.data) if response.data else 0
    except Exception as e:
        logger.error(f"❌ Failed to query post count: {str(e)}")
        return 0


def save_generated_post(supabase_client, post_data: Dict) -> bool:
    """Save generated post to Supabase"""
    try:
        insert_data = {
            "title": post_data.get("title", "")[:200],  # Truncate if needed
            "content": post_data.get("post_content", ""),
            "image_prompt": post_data.get("image_prompt", ""),
            "status": "Pending Review",
            "metadata": json.dumps(post_data.get("metadata", {})),
            "created_at": post_data.get("created_at"),
        }

        response = supabase_client.table("posts").insert(insert_data).execute()

        if response.data:
            logger.info(f"✅ Post saved to Supabase: {insert_data['title']}")
            return True
        else:
            logger.error(f"❌ Failed to save post (no response data)")
            return False

    except Exception as e:
        logger.error(f"❌ Failed to save post to Supabase: {str(e)}")
        return False


def get_past_topics(supabase_client) -> List[str]:
    """Get list of past topics from Supabase to avoid repetition"""
    try:
        response = supabase_client.table("posts") \
            .select("title") \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()

        if response.data:
            return [post.get("title", "") for post in response.data if post.get("title")]
        return []
    except Exception as e:
        logger.warning(f"⚠️  Failed to retrieve past topics: {str(e)}")
        return []


@app.function(
    schedule=modal.Period(days=1),  # Run daily
    timeout=600,  # 10 minutes max
)
def generate_daily_posts():
    """
    Main Modal function: Generate posts to maintain 21-post queue
    Runs daily at scheduled time
    """

    logger.info("=" * 80)
    logger.info("🚀 LINKEDIN POST GENERATION CRON JOB STARTED")
    logger.info(f"Run time: {datetime.now().isoformat()}")
    logger.info("=" * 80)

    # Initialize clients
    supabase = get_supabase_client()
    if not supabase:
        logger.error("❌ Cannot proceed without Supabase client")
        return {
            "success": False,
            "error": "Supabase client initialization failed",
            "timestamp": datetime.now().isoformat()
        }

    # Get current queue status
    active_posts = get_active_post_count(supabase)
    target_count = 21
    deficit = max(0, target_count - active_posts)

    logger.info(f"\n📊 QUEUE STATUS")
    logger.info(f"   Current active posts: {active_posts}/{target_count}")
    logger.info(f"   Posts to generate: {deficit}")

    if deficit <= 0:
        logger.info("✅ Queue is full, no generation needed today")
        return {
            "success": True,
            "generated": 0,
            "skipped": True,
            "reason": "Queue already full",
            "active_posts": active_posts,
            "timestamp": datetime.now().isoformat()
        }

    # Get past topics to avoid repetition
    past_topics = get_past_topics(supabase)
    logger.info(f"\n📚 Past topics (for context): {len(past_topics)} recent posts")

    # Load user profile from environment or use default
    user_profile = {
        "expertise": os.getenv("USER_EXPERTISE", "AI automation consultant"),
        "target_audience": os.getenv("USER_TARGET_AUDIENCE", "small business owners, solopreneurs"),
        "tone": os.getenv("USER_TONE", "practical, approachable, authentic"),
        "avoid": os.getenv("USER_AVOID", "jargon, corporate speak, hype").split(","),
        "past_topics": past_topics[-10:] if past_topics else []  # Last 10 topics
    }

    logger.info(f"\n👤 USER PROFILE")
    logger.info(f"   Expertise: {user_profile['expertise']}")
    logger.info(f"   Target Audience: {user_profile['target_audience']}")

    # Initialize pipeline
    pipeline = PostGenerationPipeline()

    # Generate posts
    generated_count = 0
    failed_count = 0
    error_posts = []

    logger.info(f"\n🔄 GENERATING {deficit} POSTS...")
    logger.info("=" * 80)

    for i in range(deficit):
        try:
            logger.info(f"\n[{i+1}/{deficit}] Generating post...")

            # Run full pipeline
            result = pipeline.run(user_profile)

            if result.get("success"):
                post_data = result.get("data", {})

                # Attempt to save to Supabase
                if save_generated_post(supabase, post_data):
                    generated_count += 1
                    logger.info(f"✅ Post {i+1} complete and saved")
                else:
                    failed_count += 1
                    error_posts.append({
                        "post_num": i + 1,
                        "error": "Failed to save to Supabase"
                    })
                    logger.error(f"❌ Post {i+1} generated but failed to save")
            else:
                failed_count += 1
                error_msg = result.get("error", "Unknown error")
                error_posts.append({
                    "post_num": i + 1,
                    "error": error_msg
                })

                # Check if it's a quality control failure
                if result.get("status") == "NON_COMPLIANT":
                    logger.warning(
                        f"⚠️  Post {i+1} failed quality control\n"
                        f"   Root cause: {result.get('root_cause', 'Unknown')}\n"
                        f"   Solution: {result.get('solution', 'N/A')}"
                    )
                else:
                    logger.error(f"❌ Post {i+1} generation failed: {error_msg}")

        except Exception as e:
            failed_count += 1
            error_posts.append({
                "post_num": i + 1,
                "error": str(e)
            })
            logger.error(f"❌ Post {i+1} crashed: {str(e)}")

    # Generate summary report
    logger.info("\n" + "=" * 80)
    logger.info("📋 GENERATION SUMMARY")
    logger.info("=" * 80)

    logger.info(f"\n✅ Successfully generated: {generated_count}")
    logger.info(f"❌ Failed to generate: {failed_count}")
    logger.info(f"📊 Success rate: {generated_count/deficit*100:.1f}%" if deficit > 0 else "N/A")

    final_queue_count = active_posts + generated_count
    logger.info(f"\n📈 FINAL QUEUE STATUS")
    logger.info(f"   Posts before: {active_posts}")
    logger.info(f"   Posts generated: {generated_count}")
    logger.info(f"   Posts after: {final_queue_count}")

    if error_posts:
        logger.warning(f"\n⚠️  FAILED POSTS DETAILS:")
        for error in error_posts:
            logger.warning(f"   Post {error['post_num']}: {error['error']}")

    logger.info("\n" + "=" * 80)
    logger.info("✅ CRON JOB COMPLETE")
    logger.info("=" * 80)

    return {
        "success": True,
        "generated": generated_count,
        "failed": failed_count,
        "target": deficit,
        "initial_queue": active_posts,
        "final_queue": final_queue_count,
        "timestamp": datetime.now().isoformat(),
        "errors": error_posts if error_posts else []
    }


def run_local():
    """Local test version (non-Modal)"""
    logger.info("Testing post generation locally...")

    # Initialize clients
    supabase = get_supabase_client()
    if not supabase:
        logger.error("❌ Cannot proceed without Supabase client")
        return {
            "success": False,
            "error": "Supabase client initialization failed",
            "timestamp": datetime.now().isoformat()
        }

    # Get current queue status
    active_posts = get_active_post_count(supabase)
    target_count = 21
    deficit = max(0, target_count - active_posts)

    logger.info(f"\n📊 QUEUE STATUS")
    logger.info(f"   Current active posts: {active_posts}/{target_count}")
    logger.info(f"   Posts to generate: {deficit}")

    if deficit <= 0:
        logger.info("✅ Queue is full, no generation needed")
        return {
            "success": True,
            "generated": 0,
            "skipped": True,
            "reason": "Queue already full",
            "active_posts": active_posts,
            "timestamp": datetime.now().isoformat()
        }

    # For testing: generate just 1-2 posts
    test_deficit = min(deficit, 2)

    logger.info(f"\n🔄 GENERATING {test_deficit} POSTS...")
    logger.info("=" * 80)

    pipeline = PostGenerationPipeline()

    user_profile = {
        "expertise": os.getenv("USER_EXPERTISE", "AI automation consultant"),
        "target_audience": os.getenv("USER_TARGET_AUDIENCE", "small business owners, solopreneurs"),
        "tone": os.getenv("USER_TONE", "practical, approachable, authentic"),
        "avoid": os.getenv("USER_AVOID", "jargon, corporate speak, hype").split(","),
        "past_topics": get_past_topics(supabase)[-10:] if supabase else []
    }

    generated_count = 0
    failed_count = 0

    for i in range(test_deficit):
        try:
            logger.info(f"\n[{i+1}/{test_deficit}] Generating test post...")

            result = pipeline.run(user_profile)

            if result.get("success"):
                post_data = result.get("data", {})
                logger.info(f"✅ Test post {i+1} generated: {post_data.get('title', 'N/A')[:60]}...")
                logger.info(f"   Chars: {post_data.get('metadata', {}).get('character_count', 0)}")
                logger.info(f"   Quality: {post_data.get('metadata', {}).get('overall_quality', 'N/A')}/10")
                generated_count += 1
            else:
                failed_count += 1
                logger.error(f"❌ Test post {i+1} failed: {result.get('error', 'Unknown error')}")

        except Exception as e:
            failed_count += 1
            logger.error(f"❌ Test post {i+1} crashed: {str(e)}")

    logger.info("\n" + "=" * 80)
    logger.info("✅ LOCAL TEST COMPLETE")
    logger.info("=" * 80)

    return {
        "success": generated_count > 0,
        "generated": generated_count,
        "failed": failed_count,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    """Local test entrypoint"""
    result = run_local()
    logger.info(f"\nFinal Result: {json.dumps(result, indent=2)}")
    sys.exit(0 if result.get("success") else 1)
