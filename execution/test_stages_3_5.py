#!/usr/bin/env python3
"""
Test script for Stages 3-5 (Framework Selection, Content Generation, Image Prompt)
Tests implementations independently with sample data from Stages 1-2
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

def get_sample_topic_and_research():
    """Generate sample Topic and Research for testing Stages 3-5"""
    topic = TopicOutput(
        topic="Building AI agents for workflow automation",
        relevance_score=0.87,
        keywords=["AI agents", "automation", "productivity"],
        suggested_angle="practical implementation"
    )

    research = ResearchOutput(
        key_points=[
            "AI agents automate repetitive tasks by learning from patterns",
            "Most effective for high-volume, rule-based workflows",
            "Can reduce operational costs by 30-50%",
            "Requires clear understanding of workflows and success metrics"
        ],
        use_cases=[
            "Email triage and response automation",
            "Data entry and spreadsheet automation",
            "Customer support ticket routing"
        ],
        misconceptions=[
            "Myth: AI agents replace human jobs entirely - Reality: They augment human capabilities",
            "Myth: Requires extensive AI knowledge - Reality: Low-code solutions exist"
        ],
        implementation_steps=[
            "Identify repetitive workflows in your business",
            "Map out the workflow steps and decision points",
            "Select appropriate automation tools",
            "Test with a pilot project on one workflow",
            "Measure results and expand to other workflows"
        ],
        data_points=[
            "30-50% cost reduction on workflow tasks (McKinsey, 2025)",
            "85% accuracy achievable with modern AI agents",
            "4-8 week typical implementation timeline"
        ],
        sources=[
            "McKinsey Automation Study 2025",
            "Gartner AI Implementation Guide",
            "Harvard Business Review"
        ]
    )

    return topic, research


def test_stage_3_framework_selection():
    """Test Stage 3: Framework Selection"""
    logger.info("=" * 70)
    logger.info("TESTING STAGE 3: FRAMEWORK SELECTION")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    topic, research = get_sample_topic_and_research()

    try:
        logger.info(f"\nTopic: {topic.topic}")
        framework = pipeline._select_framework(topic, research, TEST_PROFILE)

        logger.info(f"✅ Framework: {framework.framework}")
        logger.info(f"   Reasoning: {framework.reasoning[:100]}...")
        logger.info(f"   Structure Keys: {list(framework.structure.keys())}")

        return {
            "success": True,
            "framework": framework.framework,
            "reasoning": framework.reasoning
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def test_stage_4_content_generation():
    """Test Stage 4: Content Generation"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING STAGE 4: CONTENT GENERATION")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    topic, research = get_sample_topic_and_research()

    try:
        # Get framework first
        logger.info(f"\nTopic: {topic.topic}")
        framework = pipeline._select_framework(topic, research, TEST_PROFILE)
        logger.info(f"Using framework: {framework.framework}")

        # Generate content
        content = pipeline._generate_content(topic, research, framework, TEST_PROFILE)

        logger.info(f"✅ Content Generated:")
        logger.info(f"   Character Count: {content.character_count} (target: 1,300-1,900)")
        logger.info(f"   Hook Length: {len(content.hook)} (max: 210)")
        logger.info(f"   Framework Used: {content.framework_used}")
        logger.info(f"   Hook Preview: {content.hook[:100]}...")
        logger.info(f"   CTA: {content.cta[:80]}...")
        logger.info(f"   Optimizations: {len(content.engagement_optimizations)} applied")

        # Character count validation
        char_count_valid = 1300 <= content.character_count <= 1900
        hook_valid = len(content.hook) <= 210

        logger.info(f"\n   ✓ Character count valid: {char_count_valid}")
        logger.info(f"   ✓ Hook length valid: {hook_valid}")

        return {
            "success": char_count_valid and hook_valid,
            "character_count": content.character_count,
            "hook_length": len(content.hook),
            "framework": content.framework_used
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def test_stage_5_image_prompt():
    """Test Stage 5: Image Prompt Generation"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING STAGE 5: IMAGE PROMPT GENERATION")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()
    topic, research = get_sample_topic_and_research()

    try:
        # Generate content (needed for image prompt)
        logger.info(f"\nTopic: {topic.topic}")
        framework = pipeline._select_framework(topic, research, TEST_PROFILE)
        content = pipeline._generate_content(topic, research, framework, TEST_PROFILE)

        # Generate image prompt
        image_prompt = pipeline._generate_image_prompt(topic, content)

        logger.info(f"✅ Image Prompt Generated:")
        logger.info(f"   Prompt Length: {len(image_prompt.image_prompt)} chars")
        logger.info(f"   Style Tags: {', '.join(image_prompt.style_tags)}")
        logger.info(f"   Negative Prompt: {image_prompt.negative_prompt[:80]}...")
        logger.info(f"   Prompt Preview: {image_prompt.image_prompt[:150]}...")

        return {
            "success": len(image_prompt.image_prompt) > 100,
            "prompt_length": len(image_prompt.image_prompt),
            "style_tags_count": len(image_prompt.style_tags)
        }

    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def test_full_stages_1_to_5_flow():
    """Test complete flow from Stage 1 to Stage 5"""
    logger.info("\n" + "=" * 70)
    logger.info("TESTING FULL FLOW: STAGE 1 → STAGE 5")
    logger.info("=" * 70)

    pipeline = PostGenerationPipeline()

    try:
        logger.info(f"\nProfile: {TEST_PROFILE['expertise']}")
        logger.info(f"Target Audience: {TEST_PROFILE['target_audience']}")

        # Stage 1: Select Topic
        logger.info("\n[Stage 1] Selecting topic...")
        topic = pipeline._select_topic(TEST_PROFILE)
        logger.info(f"✅ Selected: {topic.topic}")

        # Stage 2: Conduct Research
        logger.info("\n[Stage 2] Conducting research...")
        research = pipeline._conduct_research(topic, TEST_PROFILE)
        logger.info(f"✅ Research: {len(research.key_points)} key points")

        # Stage 3: Select Framework
        logger.info("\n[Stage 3] Selecting framework...")
        framework = pipeline._select_framework(topic, research, TEST_PROFILE)
        logger.info(f"✅ Framework: {framework.framework}")

        # Stage 4: Generate Content
        logger.info("\n[Stage 4] Generating content...")
        content = pipeline._generate_content(topic, research, framework, TEST_PROFILE)
        logger.info(f"✅ Content: {content.character_count} chars")

        # Stage 5: Generate Image Prompt
        logger.info("\n[Stage 5] Generating image prompt...")
        image_prompt = pipeline._generate_image_prompt(topic, content)
        logger.info(f"✅ Image Prompt: {len(image_prompt.image_prompt)} chars")

        # Display complete output
        logger.info("\n" + "=" * 70)
        logger.info("COMPLETE PIPELINE OUTPUT:")
        logger.info("=" * 70)

        output = {
            "stage_1": {
                "topic": topic.topic,
                "relevance_score": topic.relevance_score,
                "keywords": topic.keywords
            },
            "stage_2": {
                "key_points_count": len(research.key_points),
                "use_cases_count": len(research.use_cases)
            },
            "stage_3": {
                "framework": framework.framework,
                "structure_keys": list(framework.structure.keys())
            },
            "stage_4": {
                "character_count": content.character_count,
                "hook_length": len(content.hook),
                "framework_used": content.framework_used,
                "post_preview": content.post_content[:200]
            },
            "stage_5": {
                "image_prompt_length": len(image_prompt.image_prompt),
                "style_tags": image_prompt.style_tags
            }
        }

        logger.info(json.dumps(output, indent=2))

        # Validation
        char_count_valid = 1300 <= content.character_count <= 1900
        hook_valid = len(content.hook) <= 210

        return {
            "success": char_count_valid and hook_valid,
            "stages_completed": 5,
            "character_count": content.character_count,
            "full_output": output
        }

    except Exception as e:
        logger.error(f"❌ Flow test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    logger.info("🚀 Starting Stage 3-5 Tests...\n")

    # Run tests
    stage3_result = test_stage_3_framework_selection()
    stage4_result = test_stage_4_content_generation()
    stage5_result = test_stage_5_image_prompt()
    flow_result = test_full_stages_1_to_5_flow()

    # Final summary
    logger.info("\n" + "=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)

    logger.info(f"Stage 3 (Framework):     {'✅ PASS' if stage3_result['success'] else '❌ FAIL'}")
    logger.info(f"Stage 4 (Content):       {'✅ PASS' if stage4_result['success'] else '❌ FAIL'}")
    logger.info(f"Stage 5 (Image Prompt):  {'✅ PASS' if stage5_result['success'] else '❌ FAIL'}")
    logger.info(f"Full Flow (1-5):         {'✅ PASS' if flow_result['success'] else '❌ FAIL'}")

    if stage4_result['success']:
        logger.info(f"\n📊 Content Statistics:")
        logger.info(f"   Character Count: {stage4_result['character_count']} (target: 1,300-1,900)")
        logger.info(f"   Hook Length: {stage4_result['hook_length']} (max: 210)")

    logger.info("=" * 70)

    # Exit with appropriate code
    all_pass = all([
        stage3_result['success'],
        stage4_result['success'],
        stage5_result['success'],
        flow_result['success']
    ])
    sys.exit(0 if all_pass else 1)
