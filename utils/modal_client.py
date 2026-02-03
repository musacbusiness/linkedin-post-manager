"""
Modal Webhook Client for LinkedIn Post Manager
Triggers Modal functions directly via HTTP webhooks instead of polling
"""

import requests
from typing import Dict, Optional, Any
from config import MODAL_WEBHOOK_BASE_URL


class ModalClient:
    """Client for triggering Modal webhook functions"""

    def __init__(self, base_url: str = None):
        """
        Initialize Modal client with webhook base URL

        Args:
            base_url: Modal webhook base URL
        """
        self.base_url = base_url or MODAL_WEBHOOK_BASE_URL
        self.timeout = 30  # 30 second timeout for Modal execution
        self.headers = {"Content-Type": "application/json"}

    def _trigger_webhook(self, endpoint: str, record_id: str) -> Dict[str, Any]:
        """
        Make HTTP POST request to Modal webhook

        Args:
            endpoint: Webhook endpoint (e.g., "schedule", "generate-image")
            record_id: Airtable record ID to process

        Returns:
            Response data with success status and result
        """
        url = f"{self.base_url}/{endpoint}"
        payload = {"record_id": record_id}

        try:
            response = requests.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=self.timeout,
            )

            # Always return response status even if HTTP error
            return {
                "success": response.status_code in (200, 201, 202),
                "status_code": response.status_code,
                "data": response.json() if response.text else {},
                "error": None if response.ok else response.text,
            }

        except requests.exceptions.Timeout:
            return {
                "success": False,
                "status_code": None,
                "data": {},
                "error": f"Request timeout after {self.timeout}s",
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "status_code": None,
                "data": {},
                "error": f"Request failed: {str(e)}",
            }
        except Exception as e:
            return {
                "success": False,
                "status_code": None,
                "data": {},
                "error": f"Unexpected error: {str(e)}",
            }

    def trigger_image_generation(self, record_id: str) -> Dict[str, Any]:
        """
        Trigger image generation for a specific post

        This function:
        1. Takes the post content from Airtable
        2. Generates an image prompt using Claude
        3. Generates image using Replicate API
        4. Saves image URL to Airtable

        Args:
            record_id: Airtable record ID

        Returns:
            Response dict with success status and image URL or error
        """
        response = self._trigger_webhook("generate-image", record_id)

        if response["success"]:
            response["message"] = "Image generation triggered successfully"
            if "image_url" in response.get("data", {}):
                response["image_url"] = response["data"]["image_url"]

        return response

    def trigger_scheduling(self, record_id: str) -> Dict[str, Any]:
        """
        Trigger auto-scheduling for approved post

        This function:
        1. Finds next available time slot
        2. Updates post status to "Scheduled"
        3. Sets Scheduled Time field
        4. Prepares for LinkedIn posting

        Args:
            record_id: Airtable record ID

        Returns:
            Response dict with success status and scheduled time or error
        """
        response = self._trigger_webhook("schedule", record_id)

        if response["success"]:
            response["message"] = "Post scheduled successfully"
            if "scheduled_time" in response.get("data", {}):
                response["scheduled_time"] = response["data"]["scheduled_time"]

        return response

    def trigger_revision(self, record_id: str) -> Dict[str, Any]:
        """
        Trigger revision processing for a post

        This function:
        1. Reads the Revision Prompt from Airtable
        2. Uses Claude API to revise post content
        3. Optionally regenerates image if needed
        4. Updates post with revised content
        5. Clears Revision Prompt field (marks as complete)
        6. Logs changes in Notes field

        Args:
            record_id: Airtable record ID

        Returns:
            Response dict with success status and revision changes or error
        """
        response = self._trigger_webhook("revise", record_id)

        if response["success"]:
            response["message"] = "Revision processed successfully"
            if "changes" in response.get("data", {}):
                response["changes"] = response["data"]["changes"]

        return response

    def trigger_rejection(self, record_id: str) -> Dict[str, Any]:
        """
        Trigger rejection handling for a post

        This function:
        1. Updates post status to "Rejected"
        2. Schedules post for deletion (7 days from now)
        3. Logs rejection reason in Notes

        Args:
            record_id: Airtable record ID

        Returns:
            Response dict with success status and deletion date or error
        """
        response = self._trigger_webhook("reject", record_id)

        if response["success"]:
            response["message"] = "Post rejected successfully"
            if "scheduled_deletion" in response.get("data", {}):
                response["scheduled_deletion"] = response["data"]["scheduled_deletion"]

        return response

    def health_check(self) -> Dict[str, Any]:
        """
        Check if Modal webhooks are accessible

        Returns:
            Response dict with connectivity status
        """
        try:
            url = self.base_url
            response = requests.head(url, timeout=5)
            return {
                "success": True,
                "message": "Modal webhooks accessible",
                "status_code": response.status_code,
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Modal webhooks not accessible: {str(e)}",
                "status_code": None,
            }
