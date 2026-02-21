#!/usr/bin/env python3
"""
Test script for Stages 6-7 (Quality Control & Root Cause Analysis)
Tests quality control evaluation and self-annealing capabilities
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

from execution.post_generation_pipeline import (
    PostGenerationPipeline,
    TopicOutput,
    ResearchOutput,
    FrameworkOutput,
    ContentOutput,
)

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Sample user profile
TEST_PROFILE = {
    "expertise": "AI automation consultant",
    "target_audience": "small business owners, solopreneurs",
    "tone": "practical, approachable, authentic",
    "avoid": ["jargon", "corporate speak", "hype"],
    "past_topics": ["AI automation", "productivity", "workflow optimization"]
}

def get_sample_compliant_content():
    """Generate sample content that should PASS quality control"""
    return ContentOutput(
        post_content="""Are you still struggling with repetitive tasks?

I see this constantly with small business owners. They're manually managing workflows that could be automated.

The challenge? Many businesses are still managing AI agents manually, wasting time and resources on repetitive tasks.

Master AI agents to unlock new opportunities in your field.

Here's why it matters:
• Implementation requires clear understanding of foundational concepts and best practices
• Most organizations see 30-50% efficiency gains when properly executed
• Real-world success depends on strategic planning and stakeholder alignment
• Continuous iteration and measurement are essential for long-term results

I worked with several clients on this, and the results were transformative. One team reduced their manual work by 40% in just 8 weeks.

Real-world applications:
• Enterprise adoption of AI agents across departments
• Small business optimization using automation approaches
• Startup scaling with machine learning methodologies

Here's how to get started:
1. Assess current state and identify optimization opportunities
2. Define clear success metrics and KPIs
3. Build business case with ROI projections
4. Execute pilot program with 1-2 teams

The numbers don't lie:
• 86% of organizations report measurable ROI within 12 months (McKinsey, 2025)
• Average time to implementation: 4-8 weeks (Gartner)
• Success rate improves 40% with executive sponsorship

The companies seeing the biggest ROI are those who:
✓ Started with one small workflow
✓ Measured results carefully
✓ Scaled what worked
✓ Continued iterating

The opportunity cost of NOT doing this? That's what keeps me up at night. Every day you delay is another day wasted on repetitive work.

What's been your experience with AI agents? I'm genuinely curious what's holding you back. Drop your thoughts in the comments - I read every single one.

#LinkedIn #AIagents #ProfessionalGrowth #Innovation""",
        character_count=1637,
        hook="Are you still struggling with repetitive tasks?",
        cta="What's been your experience with AI agents? I'm genuinely curious what's holding you back. Drop your thoughts in the comments - I read every single one.",
        framework_used="PAS",
        engagement_optimizations=[
            "Hook poses relatable question",
            "Includes specific data points",
            "Real-world example provided",
            "Question-based CTA",
            "Relevant hashtags"
        ]
    )

def get_sample_non_compliant_content():
    """Generate sample content that should FAIL quality control"""
    return ContentOutput(
        post_content="This is a short post that is not long enough to meet LinkedIn standards.",
        character_count=60,
        hook="Short hook",
        cta="Follow for more",
        framework_used="PAS",
        engagement_optimizations=[]
    )

def get_sample_framework():
    """Get sample framework"""
    return FrameworkOutput(
        framework="PAS",
        reasoning="Problem-Agitate-Solution works best for pain-point content",
        structure={
            "hook": "Opening hook",
            "body_1": "Problem section",
            "body_2": "Solution section",
            "cta": "Call to action"
        }
    )

def test_stage_6_quality_control_pass():
    """Test Stage 6: Quality Control with PASSING content"""
    logger.info("=" * 70)
    logger.info("TESTING STAGE 6: QUALITY CONTROL (PASSING CONTENT)")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    content = get_sample_compliant_content()
    framework = get_sample_framework()

    try:
        logger.info(f"\nEvaluating compliant content ({content.character_count} chars)...")
        quality = pipeline._quality_control(content, framework, TEST_PROFILE)

        logger.info(f"✅ Quality Control Result: {quality.compliance_status}")
        logger.info(f"   Overall Score: {quality.overall_score}/10")
        logger.info(f"   Failed Checks: {len(quality.failed_checks)}")

        # Display individual scores
        logger.info("\n   Quality Scores:")
        for check_name, score_obj in quality.quality_scores.items():
            status = "✓" if score_obj.score >= 8 else "✗"
            logger.info(f"      {status} {check_name}: {score_obj.score}/10")

        return {
            "success": quality.compliance_status == "COMPLIANT",
            "compliance_status": quality.compliance_status,
            "overall_score": quality.overall_score,
            "failed_checks": len(quality.failed_checks)
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def test_stage_6_quality_control_fail():
    """Test Stage 6: Quality Control with FAILING content"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING STAGE 6: QUALITY CONTROL (FAILING CONTENT)")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    content = get_sample_non_compliant_content()
    framework = get_sample_framework()

    try:
        logger.info(f"\nEvaluating non-compliant content ({content.character_count} chars)...")
        quality = pipeline._quality_control(content, framework, TEST_PROFILE)

        logger.info(f"✅ Quality Control Result: {quality.compliance_status}")
        logger.info(f"   Overall Score: {quality.overall_score}/10")
        logger.info(f"   Failed Checks: {len(quality.failed_checks)}")

        if quality.failed_checks:
            logger.info(f"\n   Failed Checks:")
            for check in quality.failed_checks:
                logger.info(f"      ✗ {check}")

        return {
            "success": quality.compliance_status == "NON-COMPLIANT",
            "compliance_status": quality.compliance_status,
            "overall_score": quality.overall_score,
            "failed_checks": quality.failed_checks
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def test_stage_7_root_cause_analysis():
    """Test Stage 7: Root Cause Analysis on failing content"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING STAGE 7: ROOT CAUSE ANALYSIS & SELF-ANNEALING")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    content = get_sample_non_compliant_content()
    framework = get_sample_framework()

    try:
        logger.info(f"\nRunning quality control on non-compliant content...")
        quality = pipeline._quality_control(content, framework, TEST_PROFILE)

        if quality.compliance_status == "COMPLIANT":
            logger.info("❌ Content passed (no RCA needed for this test)")
            return {
                "success": False,
                "error": "Content should fail quality control"
            }

        logger.info(f"Content failed with {len(quality.failed_checks)} failed checks")
        logger.info(f"Running root cause analysis...")

        # Convert quality_scores to dict for RCA
        quality_scores_dict = {
            k: {"score": v.score, "reasoning": v.reasoning}
            for k, v in quality.quality_scores.items()
        }

        # Run RCA
        rca = pipeline._root_cause_analysis(
            failed_post={
                "post_content": content.post_content,
                "framework": framework.framework,
                "character_count": content.character_count
            },
            quality_scores=quality.quality_scores,
            failed_checks=quality.failed_checks
        )

        logger.info(f"✅ Root Cause Analysis Complete")
        logger.info(f"   Root Cause: {rca.root_cause}")
        logger.info(f"   Failing Stage: {rca.failing_stage}")
        logger.info(f"   Failing Model: {rca.failing_model}")
        logger.info(f"   Issues Identified: {len(rca.issues_identified)}")
        logger.info(f"   Solutions Provided: {len(rca.solutions)}")
        logger.info(f"   Action: {rca.action}")
        logger.info(f"   Retry Attempt: {rca.retry_attempt}")

        logger.info(f"\n   Issues:")
        for issue in rca.issues_identified[:2]:
            logger.info(f"      - {issue}")

        logger.info(f"\n   Solutions:")
        for solution in rca.solutions[:2]:
            logger.info(f"      - {solution}")

        logger.info(f"\n   Updated System Prompt Preview:")
        prompt_preview = rca.updated_system_prompt[:200]
        logger.info(f"      {prompt_preview}...")

        return {
            "success": rca.action == "UPDATE_PROMPT_AND_RETRY",
            "root_cause": rca.root_cause,
            "failing_stage": rca.failing_stage,
            "solutions": len(rca.solutions),
            "action": rca.action
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

def test_full_pipeline_with_quality_control():
    """Test complete pipeline from Stage 1 to 6"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING FULL PIPELINE: STAGES 1-6 WITH QUALITY CONTROL")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()

    try:
        logger.info(f"\nProfile: {TEST_PROFILE['expertise']}")

        # Stage 1: Topic
        logger.info("\n[Stage 1] Selecting topic...")
        topic = pipeline._select_topic(TEST_PROFILE)
        logger.info(f"✅ Topic: {topic.topic}")

        # Stage 2: Research
        logger.info("\n[Stage 2] Conducting research...")
        research = pipeline._conduct_research(topic, TEST_PROFILE)
        logger.info(f"✅ Research: {len(research.key_points)} key points")

        # Stage 3: Framework
        logger.info("\n[Stage 3] Selecting framework...")
        framework = pipeline._select_framework(topic, research, TEST_PROFILE)
        logger.info(f"✅ Framework: {framework.framework}")

        # Stage 4: Content
        logger.info("\n[Stage 4] Generating content...")
        content = pipeline._generate_content(topic, research, framework, TEST_PROFILE)
        logger.info(f"✅ Content: {content.character_count} chars")

        # Stage 5: Image Prompt
        logger.info("\n[Stage 5] Generating image prompt...")
        image_prompt = pipeline._generate_image_prompt(topic, content)
        logger.info(f"✅ Image Prompt: {len(image_prompt.image_prompt)} chars")

        # Stage 6: Quality Control
        logger.info("\n[Stage 6] Running quality control...")
        quality = pipeline._quality_control(content, framework, TEST_PROFILE)
        logger.info(f"✅ Quality Result: {quality.compliance_status}")
        logger.info(f"   Overall Score: {quality.overall_score}/10")

        # Stage 7: RCA (if needed)
        if quality.compliance_status == "NON-COMPLIANT":
            logger.info("\n[Stage 7] Running root cause analysis...")
            quality_scores_dict = {
                k: v for k, v in quality.quality_scores.items()
            }
            rca = pipeline._root_cause_analysis(
                failed_post={
                    "post_content": content.post_content,
                    "framework": framework.framework,
                    "character_count": content.character_count
                },
                quality_scores=quality_scores_dict,
                failed_checks=quality.failed_checks
            )
            logger.info(f"✅ RCA: {rca.root_cause}")
        else:
            logger.info("\n[Stage 7] Skipped (content passed quality control)")

        return {
            "success": True,
            "stages_completed": 7,
            "compliance_status": quality.compliance_status,
            "overall_score": quality.overall_score
        }

    except Exception as e:
        logger.error(f"❌ Pipeline test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    logger.info("🚀 Starting Stage 6-7 Tests...\n")

    # Run tests
    stage6_pass = test_stage_6_quality_control_pass()
    stage6_fail = test_stage_6_quality_control_fail()
    stage7 = test_stage_7_root_cause_analysis()
    full_pipeline = test_full_pipeline_with_quality_control()

    # Final summary
    logger.info("\n" + "=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)

    logger.info(f"Stage 6 Pass Test:        {'✅ PASS' if stage6_pass['success'] else '❌ FAIL'}")
    logger.info(f"Stage 6 Fail Test:        {'✅ PASS' if stage6_fail['success'] else '❌ FAIL'}")
    logger.info(f"Stage 7 (RCA):            {'✅ PASS' if stage7['success'] else '❌ FAIL'}")
    logger.info(f"Full Pipeline (1-6):      {'✅ PASS' if full_pipeline['success'] else '❌ FAIL'}")

    if stage6_pass['success']:
        logger.info(f"\n📊 Compliant Content Metrics:")
        logger.info(f"   Overall Score: {stage6_pass['overall_score']}/10")
        logger.info(f"   Failed Checks: {stage6_pass['failed_checks']}")

    if stage6_fail['success']:
        logger.info(f"\n📊 Non-Compliant Content Metrics:")
        logger.info(f"   Overall Score: {stage6_fail['overall_score']}/10")
        logger.info(f"   Failed Checks: {stage6_fail['failed_checks']}")

    if stage7['success']:
        logger.info(f"\n📊 Root Cause Analysis Metrics:")
        logger.info(f"   Failing Stage: {stage7['failing_stage']}")
        logger.info(f"   Solutions Generated: {stage7['solutions']}")
        logger.info(f"   Action: {stage7['action']}")

    logger.info("=" * 70)

    # Exit with appropriate code
    all_pass = all([
        stage6_pass['success'],
        stage6_fail['success'],
        stage7['success'],
        full_pipeline['success']
    ])
    sys.exit(0 if all_pass else 1)
