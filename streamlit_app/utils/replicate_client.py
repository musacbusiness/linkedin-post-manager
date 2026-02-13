"""
Replicate Client for LinkedIn Post Manager
Handles image generation using Replicate API
"""

import os
import replicate
from typing import Dict, Optional, Any


class ReplicateClient:
    """Client for generating images using Replicate API"""

    def __init__(self, api_token: str = None):
        """
        Initialize Replicate client with API token

        Args:
            api_token: Replicate API token
        """
        # Try to import Streamlit to load secrets
        try:
            import streamlit as st
            token = api_token or st.secrets.get("REPLICATE_API_TOKEN") or os.getenv("REPLICATE_API_TOKEN", "")
        except Exception:
            token = api_token or os.getenv("REPLICATE_API_TOKEN", "")

        if not token:
            raise Exception(
                "❌ Replicate API token missing!\n\n"
                "Add to Streamlit Cloud Secrets or .env:\n"
                "- REPLICATE_API_TOKEN=your_token\n"
            )

        self.api_token = token
        replicate.Client(api_token=self.api_token)

    def generate_image(self, prompt: str, model: str = "google/nano-banana-pro") -> Dict[str, Any]:
        """
        Generate an image using Replicate API

        Args:
            prompt: Image description/prompt
            model: Model to use for generation (default: google/nano-banana-pro)

        Returns:
            Dictionary with success status and image URL or error
        """
        try:
            print(f"[DEBUG] Generating image with prompt: {prompt[:100]}...")

            # Run the model
            output = replicate.run(
                model,
                input={"prompt": prompt}
            )

            # Extract image URL from output
            # Replicate returns FileOutput objects, need to get the .url property
            if isinstance(output, list) and len(output) > 0:
                item = output[0]
                # Handle FileOutput object
                if hasattr(item, 'url'):
                    image_url = str(item.url)
                else:
                    image_url = str(item)
            else:
                # Handle single FileOutput object
                if hasattr(output, 'url'):
                    image_url = str(output.url)
                else:
                    image_url = str(output)

            # Ensure it's a proper string URL
            if not isinstance(image_url, str):
                image_url = str(image_url)

            print(f"[DEBUG] Image generated successfully: {image_url}")

            return {
                "success": True,
                "image_url": image_url,
                "prompt": prompt
            }

        except Exception as e:
            print(f"[DEBUG] Error generating image: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "prompt": prompt
            }

    def health_check(self) -> Dict[str, Any]:
        """Check if Replicate API is accessible"""
        try:
            # Try to list models to verify API access
            print("[DEBUG] Checking Replicate API health...")
            return {
                "success": True,
                "message": "Replicate API accessible",
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Replicate API not accessible: {str(e)}",
            }
