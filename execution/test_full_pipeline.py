#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for Full 7-Stage Pipeline
Tests with 10 different topics to validate quality and self-annealing
"""

import os
import sys
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
from typing import Dict

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from execution.post_generation_pipeline import PostGenerationPipeline

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test user profiles with different expertise areas
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

def test_full_pipeline_single_run(profile: Dict, run_number: int) -> Dict:
    """Run the full 7-stage pipeline for a single profile"""
    pipeline = PostGenerationPipeline()

    try:
        logger.info(f"\n{'='*70}")
        logger.info(f"Run {run_number}/10: {profile['name']}")
        logger.info(f"{'='*70}")

        # Run the full pipeline through the run() method
        result = pipeline.run(profile)

        if result.get("success"):
            data = result.get("data", {})
            return {
                "run": run_number,
                "profile": profile["name"],
                "success": True,
                "topic": data.get("title", ""),
                "character_count": data.get("metadata", {}).get("character_count", 0),
                "relevance_score": data.get("metadata", {}).get("relevance_score", 0),
                "status": data.get("status", ""),
                "created_at": data.get("created_at", "")
            }
        else:
            # Pipeline failed quality control, check root cause
            return {
                "run": run_number,
                "profile": profile["name"],
                "success": False,
                "status": result.get("status", "FAILED"),
                "failed_checks": result.get("failed_checks", []),
                "root_cause": result.get("root_cause", "Unknown"),
                "message": result.get("message", "")
            }

    except Exception as e:
        logger.error(f"❌ Run {run_number} failed with error: {str(e)}")
        return {
            "run": run_number,
            "profile": profile["name"],
            "success": False,
            "error": str(e)
        }

def run_full_end_to_end_tests():
    """Run full end-to-end pipeline tests with all 10 profiles"""
    logger.info("\n")
    logger.info("🚀" * 35)
    logger.info("FULL END-TO-END PIPELINE TEST (10 PROFILES)")
    logger.info("🚀" * 35)

    results = []
    start_time = datetime.now()

    for i, profile in enumerate(TEST_PROFILES, 1):
        result = test_full_pipeline_single_run(profile, i)
        results.append(result)

        # Log result summary
        if result["success"]:
            logger.info(f"✅ Run {i} PASSED")
            logger.info(f"   Topic: {result['topic'][:60]}...")
            logger.info(f"   Chars: {result['character_count']} (target: 1,300-1,900)")
            logger.info(f"   Relevance: {result['relevance_score']}")
        else:
            logger.info(f"❌ Run {i} FAILED")
            if "failed_checks" in result:
                logger.info(f"   Status: {result['status']}")
                logger.info(f"   Failed Checks: {result['failed_checks']}")
                logger.info(f"   Root Cause: {result['root_cause']}")

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    # Generate summary report
    logger.info("\n" + "=" * 70)
    logger.info("END-TO-END TEST SUMMARY")
    logger.info("=" * 70)

    passed = sum(1 for r in results if r.get("success", False))
    failed = len(results) - passed

    logger.info(f"\n📊 Results:")
    logger.info(f"   Total Runs: {len(results)}")
    logger.info(f"   Passed: {passed} ({passed/len(results)*100:.1f}%)")
    logger.info(f"   Failed: {failed} ({failed/len(results)*100:.1f}%)")
    logger.info(f"   Duration: {duration:.1f} seconds ({duration/len(results):.1f}s per run)")

    if passed > 0:
        passed_results = [r for r in results if r.get("success")]
        avg_char_count = sum(r.get("character_count", 0) for r in passed_results) / len(passed_results)
        avg_relevance = sum(r.get("relevance_score", 0) for r in passed_results) / len(passed_results)

        logger.info(f"\n📈 Passed Run Statistics:")
        logger.info(f"   Avg Character Count: {avg_char_count:.0f}")
        logger.info(f"   Avg Relevance Score: {avg_relevance:.2f}")

    if failed > 0:
        failed_results = [r for r in results if not r.get("success")]
        logger.info(f"\n⚠️  Failed Runs:")
        for fr in failed_results:
            logger.info(f"   - {fr['profile']}: {fr.get('status', 'ERROR')}")
            if "root_cause" in fr:
                logger.info(f"     Root Cause: {fr['root_cause']}")

    logger.info("\n" + "=" * 70)
    logger.info("DETAILED RESULTS")
    logger.info("=" * 70)

    for i, result in enumerate(results, 1):
        logger.info(f"\nRun {i}: {result['profile']}")
        logger.info(json.dumps(result, indent=2))

    logger.info("\n" + "=" * 70)
    logger.info("✅ END-TO-END TEST COMPLETE")
    logger.info("=" * 70)

    return {
        "total_runs": len(results),
        "passed": passed,
        "failed": failed,
        "pass_rate": passed / len(results) * 100,
        "duration_seconds": duration,
        "results": results
    }

if __name__ == "__main__":
    logger.info("Starting Full End-to-End Pipeline Tests")
    logger.info(f"Test Time: {datetime.now().isoformat()}")

    summary = run_full_end_to_end_tests()

    # Exit with status code
    sys.exit(0 if summary["passed"] >= 8 else 1)  # Expect at least 80% pass rate
