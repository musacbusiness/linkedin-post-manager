#!/usr/bin/env python3
"""
Test script for Stage 1 (Topic Selection) and Stage 2 (Research)
Tests the implementations independently with sample user profiles
"""

import os
import sys
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from execution.post_generation_pipeline import PostGenerationPipeline, TopicOutput

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sample user profiles for testing
TEST_PROFILES = [
    {
        "expertise": "AI automation consultant",
        "target_audience": "small business owners, solopreneurs",
        "tone": "practical, approachable, authentic",
        "past_topics": ["AI automation", "productivity", "workflow optimization"]
    },
    {
        "expertise": "Software engineer with 10 years experience",
        "target_audience": "developers, tech leads",
        "tone": "technical, analytical, helpful",
        "past_topics": ["Python best practices", "system design", "code quality"]
    },
    {
        "expertise": "Marketing strategist",
        "target_audience": "growth marketers, entrepreneurs",
        "tone": "conversational, data-driven, encouraging",
        "past_topics": ["growth hacking", "content marketing", "customer acquisition"]
    }
]

def test_stage_1_topic_selection():
    """Test Stage 1: Topic Selection"""
    logger.info("=" * 70)
    logger.info("TESTING STAGE 1: TOPIC SELECTION")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    results = []

    for i, profile in enumerate(TEST_PROFILES, 1):
        try:
            logger.info(f"\n[Test {i}/3] Profile: {profile['expertise']}")
            topic = pipeline._select_topic(profile)

            logger.info(f"✅ Topic: {topic.topic}")
            logger.info(f"   Relevance Score: {topic.relevance_score}")
            logger.info(f"   Keywords: {', '.join(topic.keywords)}")
            logger.info(f"   Angle: {topic.suggested_angle}")

            results.append({
                "profile": profile["expertise"],
                "topic": topic.topic,
                "relevance_score": topic.relevance_score,
                "success": True
            })

        except Exception as e:
            logger.error(f"❌ Test {i} failed: {str(e)}")
            results.append({
                "profile": profile["expertise"],
                "success": False,
                "error": str(e)
            })

    # Summary
    logger.info("\n" + "=" * 70)
    passed = sum(1 for r in results if r["success"])
    logger.info(f"Stage 1 Results: {passed}/{len(results)} tests passed")
    logger.info("=" * 70)

    return results


def test_stage_2_research():
    """Test Stage 2: Research"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING STAGE 2: RESEARCH")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    results = []

    for i, profile in enumerate(TEST_PROFILES, 1):
        try:
            logger.info(f"\n[Test {i}/3] Profile: {profile['expertise']}")

            # First get topic from Stage 1
            topic = pipeline._select_topic(profile)
            logger.info(f"   Using topic: {topic.topic}")

            # Then conduct research (Stage 2)
            research = pipeline._conduct_research(topic, profile)

            logger.info(f"✅ Research Complete:")
            logger.info(f"   Key Points: {len(research.key_points)} items")
            for kp in research.key_points[:2]:
                logger.info(f"      - {kp[:80]}...")
            logger.info(f"   Use Cases: {len(research.use_cases)} items")
            logger.info(f"   Misconceptions: {len(research.misconceptions)} items")
            logger.info(f"   Implementation Steps: {len(research.implementation_steps)} items")
            logger.info(f"   Data Points: {len(research.data_points)} items")
            logger.info(f"   Sources: {len(research.sources)} items")

            results.append({
                "profile": profile["expertise"],
                "topic": topic.topic,
                "key_points_count": len(research.key_points),
                "use_cases_count": len(research.use_cases),
                "success": True
            })

        except Exception as e:
            logger.error(f"❌ Test {i} failed: {str(e)}")
            results.append({
                "profile": profile["expertise"],
                "success": False,
                "error": str(e)
            })

    # Summary
    logger.info("\n" + "=" * 70)
    passed = sum(1 for r in results if r["success"])
    logger.info(f"Stage 2 Results: {passed}/{len(results)} tests passed")
    logger.info("=" * 70)

    return results


def test_full_stage_1_to_2_flow():
    """Test complete flow from Stage 1 to Stage 2"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING FULL FLOW: STAGE 1 → STAGE 2")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()

    # Use first test profile
    profile = TEST_PROFILES[0]

    try:
        logger.info(f"\nProfile: {profile['expertise']}")
        logger.info(f"Target Audience: {profile['target_audience']}")

        # Stage 1: Select Topic
        logger.info("\n[Stage 1] Selecting topic...")
        topic = pipeline._select_topic(profile)
        logger.info(f"✅ Selected: {topic.topic}")

        # Stage 2: Conduct Research
        logger.info("\n[Stage 2] Conducting research...")
        research = pipeline._conduct_research(topic, profile)
        logger.info(f"✅ Research complete with {len(research.key_points)} key points")

        # Display complete output
        logger.info("\n" + "=" * 70)
        logger.info("COMPLETE OUTPUT:")
        logger.info("=" * 70)

        output = {
            "stage_1_output": {
                "topic": topic.topic,
                "relevance_score": topic.relevance_score,
                "keywords": topic.keywords,
                "suggested_angle": topic.suggested_angle
            },
            "stage_2_output": {
                "key_points": research.key_points,
                "use_cases": research.use_cases,
                "misconceptions": research.misconceptions,
                "implementation_steps": research.implementation_steps,
                "data_points": research.data_points,
                "sources": research.sources
            }
        }

        logger.info(json.dumps(output, indent=2))

        return {
            "success": True,
            "topic": topic.topic,
            "research_points": len(research.key_points)
        }

    except Exception as e:
        logger.error(f"❌ Flow test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    logger.info("🚀 Starting Stage 1 & 2 Tests...\n")

    # Run tests
    stage1_results = test_stage_1_topic_selection()
    stage2_results = test_stage_2_research()
    flow_result = test_full_stage_1_to_2_flow()

    # Final summary
    logger.info("\n" + "=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)
    stage1_pass = sum(1 for r in stage1_results if r["success"])
    stage2_pass = sum(1 for r in stage2_results if r["success"])

    logger.info(f"Stage 1 (Topic Selection): {stage1_pass}/{len(stage1_results)} ✅")
    logger.info(f"Stage 2 (Research):        {stage2_pass}/{len(stage2_results)} ✅")
    logger.info(f"Full Flow Test:            {'✅ PASS' if flow_result['success'] else '❌ FAIL'}")
    logger.info("=" * 70)

    # Exit with appropriate code
    all_pass = stage1_pass == len(stage1_results) and stage2_pass == len(stage2_results) and flow_result["success"]
    sys.exit(0 if all_pass else 1)
