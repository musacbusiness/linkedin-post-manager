"""
Airtable API Client for LinkedIn Post Manager
Handles all CRUD operations for posts stored in Airtable
"""

import requests
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import time
from config import AIRTABLE_API_URL, AIRTABLE_API_KEY, CACHE_TTL


class AirtableClient:
    """Client for interacting with Airtable API"""

    def __init__(self, api_key: str = None, api_url: str = None):
        """
        Initialize Airtable client with API credentials

        Args:
            api_key: Airtable API key
            api_url: Airtable API base URL
        """
        self.api_key = api_key or AIRTABLE_API_KEY
        self.api_url = api_url or AIRTABLE_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        self.timeout = 10  # Request timeout in seconds
        self._cache: Dict[str, tuple] = {}  # Cache storage (key, (data, timestamp))

    def _make_request(
        self,
        method: str,
        endpoint: str = "",
        json_data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Airtable API with error handling

        Args:
            method: HTTP method (GET, POST, PATCH, DELETE)
            endpoint: Additional URL path (e.g., "record_id")
            json_data: JSON payload for POST/PATCH
            params: Query parameters

        Returns:
            Response JSON data

        Raises:
            Exception: On API error
        """
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url

        try:
            if method == "GET":
                response = requests.get(
                    url, headers=self.headers, params=params, timeout=self.timeout
                )
            elif method == "POST":
                response = requests.post(
                    url, headers=self.headers, json=json_data, timeout=self.timeout
                )
            elif method == "PATCH":
                response = requests.patch(
                    url, headers=self.headers, json=json_data, timeout=self.timeout
                )
            elif method == "DELETE":
                response = requests.delete(
                    url, headers=self.headers, timeout=self.timeout
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            raise Exception(f"Request timeout after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise Exception(f"API error: {str(e)}")

    def get_all_posts(self, status_filter: Optional[str] = None) -> List[Dict]:
        """
        Fetch all posts from Airtable, optionally filtered by status

        Args:
            status_filter: Optional status to filter by (e.g., "Scheduled")

        Returns:
            List of post records with all fields
        """
        # Check cache first
        cache_key = f"all_posts_{status_filter}"
        if cache_key in self._cache:
            data, timestamp = self._cache[cache_key]
            if time.time() - timestamp < CACHE_TTL:
                return data

        try:
            records = []
            offset = None

            # Paginate through all records
            while True:
                params = {}
                if offset:
                    params["offset"] = offset

                response = self._make_request("GET", params=params)

                if "records" in response:
                    for record in response["records"]:
                        # Apply status filter if specified
                        if status_filter:
                            if record.get("fields", {}).get("Status") == status_filter:
                                records.append(record)
                        else:
                            records.append(record)

                # Check if more records exist
                offset = response.get("offset")
                if not offset:
                    break

            # Cache the result
            self._cache[cache_key] = (records, time.time())
            return records

        except Exception as e:
            print(f"Error fetching posts: {e}")
            return []

    def get_post(self, record_id: str) -> Optional[Dict]:
        """
        Get single post by record ID

        Args:
            record_id: Airtable record ID

        Returns:
            Post record or None if not found
        """
        try:
            response = self._make_request("GET", endpoint=record_id)
            return response
        except Exception as e:
            print(f"Error fetching post {record_id}: {e}")
            return None

    def update_post(self, record_id: str, fields: Dict[str, Any]) -> Dict:
        """
        Update post fields (PATCH operation)

        Args:
            record_id: Airtable record ID
            fields: Dictionary of field names and values to update

        Returns:
            Updated record data
        """
        try:
            payload = {"fields": fields}
            response = self._make_request("PATCH", endpoint=record_id, json_data=payload)

            # Invalidate cache
            self._clear_cache()

            return response
        except Exception as e:
            print(f"Error updating post {record_id}: {e}")
            raise

    def update_status(self, record_id: str, new_status: str) -> Dict:
        """
        Convenience method to update only the status field

        Args:
            record_id: Airtable record ID
            new_status: New status value

        Returns:
            Updated record data
        """
        return self.update_post(record_id, {"Status": new_status})

    def request_revision(
        self, record_id: str, prompt: str, revision_type: str = "Both"
    ) -> Dict:
        """
        Write revision request to Airtable

        Args:
            record_id: Airtable record ID
            prompt: Revision prompt describing desired changes
            revision_type: "Post Only", "Image Only", or "Both"

        Returns:
            Updated record data
        """
        fields = {
            "Revision Prompt": prompt,
            "Revision Type": revision_type,
        }
        return self.update_post(record_id, fields)

    def get_scheduled_posts(
        self, start_date: datetime, end_date: datetime
    ) -> List[Dict]:
        """
        Get posts scheduled within a date range

        Args:
            start_date: Start of date range
            end_date: End of date range

        Returns:
            List of scheduled posts
        """
        try:
            all_posts = self.get_all_posts(status_filter="Scheduled")
            scheduled = []

            for post in all_posts:
                scheduled_time_str = post.get("fields", {}).get("Scheduled Time")
                if scheduled_time_str:
                    try:
                        # Parse ISO format timestamp
                        scheduled_time = datetime.fromisoformat(
                            scheduled_time_str.replace("Z", "+00:00")
                        )
                        if start_date <= scheduled_time <= end_date:
                            scheduled.append(post)
                    except ValueError:
                        continue

            return scheduled
        except Exception as e:
            print(f"Error fetching scheduled posts: {e}")
            return []

    def create_post(self, fields: Dict[str, Any]) -> Dict:
        """
        Create a new post record in Airtable

        Args:
            fields: Dictionary of field values for new post

        Returns:
            Created record data
        """
        try:
            payload = {"fields": fields}
            response = self._make_request("POST", json_data=payload)

            # Invalidate cache
            self._clear_cache()

            return response
        except Exception as e:
            print(f"Error creating post: {e}")
            raise

    def delete_post(self, record_id: str) -> bool:
        """
        Delete a post record from Airtable

        Args:
            record_id: Airtable record ID

        Returns:
            True if successful
        """
        try:
            self._make_request("DELETE", endpoint=record_id)

            # Invalidate cache
            self._clear_cache()

            return True
        except Exception as e:
            print(f"Error deleting post {record_id}: {e}")
            return False

    def _clear_cache(self):
        """Clear all cached data to ensure fresh data on next fetch"""
        self._cache.clear()

    def get_posts_by_status(self, statuses: List[str]) -> List[Dict]:
        """
        Get all posts with any of the specified statuses

        Args:
            statuses: List of status values to include

        Returns:
            List of matching posts
        """
        try:
            all_posts = self.get_all_posts()
            matching = [
                post for post in all_posts
                if post.get("fields", {}).get("Status") in statuses
            ]
            return matching
        except Exception as e:
            print(f"Error fetching posts by status: {e}")
            return []

    def get_posts_count(self) -> int:
        """
        Get total count of posts in database

        Returns:
            Number of posts
        """
        try:
            all_posts = self.get_all_posts()
            return len(all_posts)
        except Exception as e:
            print(f"Error getting posts count: {e}")
            return 0
