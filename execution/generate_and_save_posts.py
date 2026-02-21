#!/usr/bin/env python3
"""
Generate 10 LinkedIn posts and save them to Supabase
"""

import os
import sys
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from execution.post_generation_pipeline import PostGenerationPipeline
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test user profiles
TEST_PROFILES = [
    {
        "name": "AI Consultant",
        "expertise": "AI automation consultant",
        "target_audience": "small business owners, solopreneurs",
        "tone": "practical, approachable, authentic",
        "avoid": ["jargon", "corporate speak", "hype"],
        "past_topics": ["AI automation", "productivity", "workflow optimization"]
    },
    {
        "name": "Software Engineer",
        "expertise": "Senior software engineer with 10 years experience",
        "target_audience": "developers, tech leads, engineering managers",
        "tone": "technical, analytical, helpful",
        "avoid": ["marketing jargon", "oversimplification"],
        "past_topics": ["Python best practices", "system design", "code quality"]
    },
    {
        "name": "Marketing Strategist",
        "expertise": "Growth marketing strategist and GTM expert",
        "target_audience": "growth marketers, startup founders, entrepreneurs",
        "tone": "conversational, data-driven, encouraging",
        "avoid": ["fluff", "vague metrics", "hype without substance"],
        "past_topics": ["growth hacking", "content marketing", "customer acquisition"]
    },
    {
        "name": "Product Manager",
        "expertise": "Product manager with focus on enterprise SaaS",
        "target_audience": "product managers, designers, founders",
        "tone": "thoughtful, strategic, user-centric",
        "avoid": ["jargon", "buzzwords", "corporate speak"],
        "past_topics": ["product strategy", "user research", "roadmap planning"]
    },
    {
        "name": "Data Scientist",
        "expertise": "Data scientist specializing in machine learning and analytics",
        "target_audience": "data scientists, analysts, ML engineers",
        "tone": "analytical, evidence-based, educational",
        "avoid": ["oversimplification", "hype about AI", "lack of rigor"],
        "past_topics": ["machine learning", "data analysis", "statistical modeling"]
    },
    {
        "name": "HR Professional",
        "expertise": "HR leader focused on culture and talent management",
        "target_audience": "HR professionals, team leads, executives",
        "tone": "empathetic, practical, human-centered",
        "avoid": ["corporate jargon", "buzzwords", "disconnected from reality"],
        "past_topics": ["employee engagement", "remote work culture", "hiring strategy"]
    },
    {
        "name": "Sales Director",
        "expertise": "Sales director with B2B SaaS expertise",
        "target_audience": "sales professionals, business development, entrepreneurs",
        "tone": "motivational, practical, results-focused",
        "avoid": ["empty motivation", "unrealistic promises", "jargon"],
        "past_topics": ["sales strategy", "pipeline management", "deal closure"]
    },
    {
        "name": "UX Designer",
        "expertise": "UX/UI designer specializing in user research and design systems",
        "target_audience": "designers, product teams, researchers",
        "tone": "creative, user-focused, evidence-based",
        "avoid": ["design gatekeeping", "ego-driven design", "lack of context"],
        "past_topics": ["user research", "design systems", "accessibility"]
    },
    {
        "name": "Finance Expert",
        "expertise": "Finance and operations leader",
        "target_audience": "founders, CFOs, operations managers",
        "tone": "clear, practical, numbers-focused",
        "avoid": ["overly technical finance jargon", "fear-mongering"],
        "past_topics": ["financial planning", "cash flow management", "SaaS metrics"]
    },
    {
        "name": "Learning Developer",
        "expertise": "Learning and development specialist",
        "target_audience": "HR professionals, trainers, educators, managers",
        "tone": "encouraging, practical, evidence-based",
        "avoid": ["outdated pedagogy", "jargon", "disconnected from work reality"],
        "past_topics": ["employee training", "skill development", "learning culture"]
    }
]

def save_post_to_supabase(supabase, post_data):
    """Save generated post to Supabase"""
    try:
        insert_data = {
            "title": post_data.get("title", "")[:200],
            "post_content": post_data.get("post_content", ""),
            "image_prompt": post_data.get("image_prompt", ""),
            "status": "Pending Review",
            "generation_metadata": json.dumps(post_data.get("metadata", {})),
            "created_at": post_data.get("created_at"),
        }

        response = supabase.table("posts").insert(insert_data).execute()

        if response.data:
            return True, response.data[0].get("id")
        else:
            return False, "No response data"

    except Exception as e:
        return False, str(e)

def main():
    # Initialize Supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        logger.error("❌ Missing Supabase credentials")
        return

    supabase = create_client(url, key)
    logger.info(f"✅ Connected to Supabase")

    # Initialize pipeline
    pipeline = PostGenerationPipeline()

    # Generate and save posts
    saved_count = 0
    failed_count = 0

    logger.info(f"\n🚀 GENERATING AND SAVING 10 POSTS\n")
    logger.info("=" * 80)

    for i, profile in enumerate(TEST_PROFILES, 1):
        logger.info(f"\n[{i}/10] Generating post for {profile['name']}...")

        # Run pipeline
        result = pipeline.run(profile)

        if result.get("success"):
            post_data = result.get("data", {})

            # Save to Supabase
            success, msg = save_post_to_supabase(supabase, post_data)

            if success:
                logger.info(f"✅ Saved to Supabase (ID: {msg})")
                logger.info(f"   Topic: {post_data.get('title', '')[:60]}...")
                logger.info(f"   Chars: {post_data.get('metadata', {}).get('character_count', 0)}")
                saved_count += 1
            else:
                logger.error(f"❌ Failed to save to Supabase: {msg}")
                failed_count += 1
        else:
            logger.error(f"❌ Pipeline failed: {result.get('error', 'Unknown error')}")
            failed_count += 1

    logger.info("\n" + "=" * 80)
    logger.info(f"\n📊 SUMMARY:")
    logger.info(f"   ✅ Successfully saved: {saved_count}/10")
    logger.info(f"   ❌ Failed: {failed_count}/10")
    logger.info(f"\n   Posts are ready in Supabase with status: 'Pending Review'")
    logger.info("\n" + "=" * 80)

if __name__ == "__main__":
    main()
