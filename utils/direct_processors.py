"""
Direct API Processors - Call Replicate & Claude directly from Streamlit
Eliminates Modal webhook dependency for synchronous operations
"""

import requests
import os
from typing import Dict, Any, Optional
import time
import json

# Try to import Streamlit for secrets
try:
    import streamlit as st
    _STREAMLIT_AVAILABLE = True
except ImportError:
    _STREAMLIT_AVAILABLE = False


def _get_secret(key: str, default: str = "") -> str:
    """Get secret from Streamlit secrets or environment variables"""
    if _STREAMLIT_AVAILABLE:
        try:
            return st.secrets.get(key) or os.getenv(key, default)
        except:
            return os.getenv(key, default)
    return os.getenv(key, default)


class ReplicateClient:
    """Direct client for Replicate image generation API"""

    def __init__(self):
        self.api_token = _get_secret("REPLICATE_API_TOKEN")
        if not self.api_token:
            raise Exception("REPLICATE_API_TOKEN not found in Streamlit secrets or environment variables")
        self.base_url = "https://api.replicate.com/v1"
        self.headers = {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json"
        }

    def generate_image(self, prompt: str) -> Optional[str]:
        """
        Generate image using Replicate's Stable Diffusion API

        Args:
            prompt: Image generation prompt

        Returns:
            Image URL or None if failed
        """
        try:
            # Use Stable Diffusion 3 Medium (most reliable)
            # Model: stable-diffusion-3-medium
            model = "stability-ai/stable-diffusion-3-medium"

            prediction_payload = {
                "version": "2b017d9b67edd2ee1401c165221e92c5d566e50cf889147fba93b79e9b2b9e30",
                "input": {
                    "prompt": prompt,
                    "num_inference_steps": 25,
                    "guidance_scale": 7.5
                }
            }

            # Submit prediction
            response = requests.post(
                f"{self.base_url}/predictions",
                headers=self.headers,
                json=prediction_payload,
                timeout=30
            )

            if response.status_code != 201:
                raise Exception(f"Failed to create prediction: {response.status_code} - {response.text}")

            prediction = response.json()
            prediction_id = prediction.get("id")

            if not prediction_id:
                raise Exception(f"No prediction ID returned: {prediction}")

            # Poll for completion (max 5 minutes)
            max_polls = 60
            poll_count = 0

            while poll_count < max_polls:
                response = requests.get(
                    f"{self.base_url}/predictions/{prediction_id}",
                    headers=self.headers,
                    timeout=30
                )

                if response.status_code != 200:
                    raise Exception(f"Failed to get prediction: {response.status_code} - {response.text}")

                prediction = response.json()
                status = prediction.get("status")

                if status == "succeeded":
                    outputs = prediction.get("output", [])
                    if outputs and len(outputs) > 0:
                        return outputs[0]
                    return None

                elif status == "failed":
                    error = prediction.get("error", "Unknown error")
                    raise Exception(f"Image generation failed: {error}")

                # Still processing, wait and retry
                poll_count += 1
                time.sleep(5)

            raise Exception("Image generation timed out after 5 minutes")

        except requests.exceptions.RequestException as e:
            raise Exception(f"Replicate API request error: {str(e)}")
        except Exception as e:
            raise Exception(f"Image generation error: {str(e)}")


class ClaudeClient:
    """Direct client for Claude API for content revision"""

    def __init__(self):
        self.api_key = _get_secret("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise Exception("ANTHROPIC_API_KEY not found in Streamlit secrets or environment variables")
        self.base_url = "https://api.anthropic.com/v1"
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

    def revise_content(self, original_content: str, revision_prompt: str) -> Dict[str, str]:
        """
        Revise post content using Claude API

        Args:
            original_content: Original post content
            revision_prompt: User's revision instructions

        Returns:
            Dict with revised_content and change_summary
        """
        try:
            system_prompt = """You are an expert LinkedIn content strategist. Your job is to revise LinkedIn posts based on user feedback.

Rules:
1. Keep the post professional and on-brand
2. Maintain the core message
3. Improve engagement (use hooks, emojis, specific examples)
4. Keep it concise (LinkedIn best practices)
5. Return ONLY the revised post content, no explanations"""

            user_message = f"""Original post:
{original_content}

Revision request:
{revision_prompt}

Please revise the post according to the feedback."""

            payload = {
                "model": "claude-opus-4-5-20251101",  # Use best model for quality
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": user_message}
                ]
            }

            response = requests.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()

            if result.get("stop_reason") != "end_turn":
                raise Exception("Claude request did not complete successfully")

            revised_content = result["content"][0]["text"].strip()

            # Generate change summary
            summary_payload = {
                "model": "claude-opus-4-5-20251101",
                "max_tokens": 256,
                "system": "Summarize what changed in the revision in 1-2 sentences.",
                "messages": [
                    {"role": "user", "content": f"Original: {original_content}\n\nRevised: {revised_content}"}
                ]
            }

            summary_response = requests.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=summary_payload,
                timeout=30
            )
            summary_response.raise_for_status()
            summary_result = summary_response.json()
            change_summary = summary_result["content"][0]["text"].strip()

            return {
                "revised_content": revised_content,
                "change_summary": change_summary,
                "original_content": original_content
            }

        except requests.exceptions.RequestException as e:
            raise Exception(f"Claude API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Content revision error: {str(e)}")


def generate_image_from_post(airtable_client, record_id: str) -> Dict[str, Any]:
    """
    Generate image for a post directly using Replicate API

    Args:
        airtable_client: Airtable client to fetch post and update results
        record_id: Airtable record ID

    Returns:
        Response dict with success status and image_url
    """
    try:
        # Fetch post from Airtable
        post = airtable_client.get_post(record_id)
        if not post:
            return {"success": False, "error": "Post not found"}

        fields = post.get("fields", {})
        content = fields.get("Post Content", "")

        if not content:
            return {"success": False, "error": "Post content is empty"}

        # Generate image prompt using Claude (brief summary for image prompt)
        claude = ClaudeClient()
        try:
            prompt_payload = {
                "model": "claude-opus-4-5-20251101",
                "max_tokens": 150,
                "system": "Create a detailed, visual image prompt for DALL-E based on this LinkedIn post content. Focus on visual elements, mood, and style.",
                "messages": [
                    {"role": "user", "content": f"LinkedIn post: {content[:500]}"}
                ]
            }

            prompt_response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers=claude.headers,
                json=prompt_payload,
                timeout=30
            )
            prompt_response.raise_for_status()
            prompt_result = prompt_response.json()
            image_prompt = prompt_result["content"][0]["text"].strip()
        except Exception as e:
            # Fallback: use simplified prompt if Claude fails
            image_prompt = f"Professional LinkedIn post illustration: {content[:100]}"

        # Generate image
        replicate = ReplicateClient()
        image_url = replicate.generate_image(image_prompt)

        if not image_url:
            return {"success": False, "error": "Failed to generate image"}

        # Update Airtable with image URL
        airtable_client.update_post(record_id, {
            "Image URL": image_url,
            "Status": "Pending Review"
        })

        return {
            "success": True,
            "image_url": image_url,
            "message": "Image generated successfully"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "status_code": 500
        }


def revise_post_content(airtable_client, record_id: str) -> Dict[str, Any]:
    """
    Revise post content directly using Claude API

    Args:
        airtable_client: Airtable client to fetch post and update results
        record_id: Airtable record ID (must have Revision Prompt set)

    Returns:
        Response dict with success status and changes
    """
    try:
        # Fetch post from Airtable
        post = airtable_client.get_post(record_id)
        if not post:
            return {"success": False, "error": "Post not found"}

        fields = post.get("fields", {})
        content = fields.get("Post Content", "")
        revision_prompt = fields.get("Revision Prompt", "")
        notes = fields.get("Notes", "")

        if not content:
            return {"success": False, "error": "Post content is empty"}

        if not revision_prompt:
            return {"success": False, "error": "No revision prompt provided"}

        # Revise content using Claude
        claude = ClaudeClient()
        revision_result = claude.revise_content(content, revision_prompt)

        revised_content = revision_result["revised_content"]
        change_summary = revision_result["change_summary"]

        # Update Airtable
        update_fields = {
            "Post Content": revised_content,
            "Revision Prompt": "",  # Clear revision prompt (indicates completion)
            "Notes": f"{notes}\n\n[Revision] {change_summary}" if notes else f"[Revision] {change_summary}"
        }

        airtable_client.update_post(record_id, update_fields)

        return {
            "success": True,
            "changes": change_summary,
            "original": content,
            "revised": revised_content,
            "message": "Post revised successfully"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "status_code": 500
        }
