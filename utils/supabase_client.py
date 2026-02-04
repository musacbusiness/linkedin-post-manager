"""
Supabase Client for LinkedIn Post Manager
Drop-in replacement for Airtable with unlimited API requests
"""

from supabase import create_client, Client
from typing import List, Dict, Optional, Any
from datetime import datetime
import time
import os


class SupabaseClient:
    """Client for interacting with Supabase PostgreSQL database"""

    # Field mapping: Supabase snake_case → Airtable PascalCase
    FIELD_MAP = {
        "title": "Title",
        "post_content": "Post Content",
        "image_url": "Image URL",
        "status": "Status",
        "scheduled_time": "Scheduled Time",
        "posted_time": "Posted",
        "linkedin_url": "LinkedIn URL",
        "revision_prompt": "Revision Prompt",
        "revision_type": "Revision Type",
        "notes": "Notes",
        "created_at": "Created",
        "updated_at": "Updated",
        "topic": "Topic",
        "source": "Source",
    }

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize Supabase client with credentials

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase anon/public key
        """
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL", "")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY", "")

        if not self.supabase_url or not self.supabase_key:
            raise Exception(
                "Supabase credentials missing. Set SUPABASE_URL and SUPABASE_KEY "
                "in environment variables or pass them to __init__"
            )

        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self._cache: Dict[str, tuple] = {}
        self.cache_ttl = 30  # 30 seconds cache

    def _clear_cache(self):
        """Clear all cached data"""
        self._cache.clear()

    def _to_airtable_format(self, record: Dict) -> Dict:
        """
        Convert Supabase record to Airtable format for compatibility.

        Transforms snake_case fields to PascalCase nested in 'fields' key.

        Args:
            record: Supabase record

        Returns:
            Airtable-formatted record
        """
        fields = {}
        for supabase_key, value in record.items():
            if supabase_key == "id":
                continue  # id stays at top level
            airtable_key = self.FIELD_MAP.get(supabase_key, supabase_key)
            fields[airtable_key] = value

        return {
            "id": record.get("id"),
            "fields": fields,
        }

    def _to_airtable_format_batch(self, records: List[Dict]) -> List[Dict]:
        """Convert list of records to Airtable format"""
        return [self._to_airtable_format(record) for record in records]

    def get_all_posts(self, status_filter: Optional[str] = None) -> List[Dict]:
        """
        Fetch all posts from Supabase, optionally filtered by status

        Args:
            status_filter: Optional status to filter by

        Returns:
            List of post records in Airtable format
        """
        # Check cache first
        cache_key = f"all_posts_{status_filter}"
        if cache_key in self._cache:
            data, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return data

        try:
            if status_filter:
                response = (
                    self.client.table("posts")
                    .select("*")
                    .eq("status", status_filter)
                    .order("created_at", desc=True)
                    .execute()
                )
            else:
                response = (
                    self.client.table("posts")
                    .select("*")
                    .order("created_at", desc=True)
                    .execute()
                )

            records = response.data or []
            # Convert to Airtable format for compatibility
            formatted_records = self._to_airtable_format_batch(records)

            # Cache the result
            self._cache[cache_key] = (formatted_records, time.time())
            return formatted_records

        except Exception as e:
            print(f"Error fetching posts: {e}")
            return []

    def get_post(self, record_id: str) -> Optional[Dict]:
        """
        Get single post by ID

        Args:
            record_id: Post ID (UUID)

        Returns:
            Post record in Airtable format or None if not found
        """
        try:
            response = (
                self.client.table("posts")
                .select("*")
                .eq("id", record_id)
                .single()
                .execute()
            )
            return self._to_airtable_format(response.data) if response.data else None
        except Exception as e:
            print(f"Error fetching post {record_id}: {e}")
            return None

    def update_post(self, record_id: str, fields: Dict[str, Any]) -> Dict:
        """
        Update post fields

        Args:
            record_id: Post ID
            fields: Dictionary of field names and values to update

        Returns:
            Updated record data
        """
        try:
            # Add updated_at timestamp
            fields["updated_at"] = datetime.utcnow().isoformat()

            response = (
                self.client.table("posts")
                .update(fields)
                .eq("id", record_id)
                .execute()
            )

            # Invalidate cache
            self._clear_cache()

            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error updating post {record_id}: {e}")
            raise

    def update_status(self, record_id: str, new_status: str) -> Dict:
        """
        Convenience method to update only the status field

        Args:
            record_id: Post ID
            new_status: New status value

        Returns:
            Updated record data
        """
        return self.update_post(record_id, {"status": new_status})

    def request_revision(
        self, record_id: str, prompt: str, revision_type: str = "Both"
    ) -> Dict:
        """
        Write revision request to database

        Args:
            record_id: Post ID
            prompt: Revision prompt
            revision_type: "Post Only", "Image Only", or "Both"

        Returns:
            Updated record data
        """
        fields = {
            "revision_prompt": prompt,
            "revision_type": revision_type,
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
            List of scheduled posts in Airtable format
        """
        try:
            response = (
                self.client.table("posts")
                .select("*")
                .eq("status", "Scheduled")
                .gte("scheduled_time", start_date.isoformat())
                .lte("scheduled_time", end_date.isoformat())
                .execute()
            )

            return self._to_airtable_format_batch(response.data or [])
        except Exception as e:
            print(f"Error fetching scheduled posts: {e}")
            return []

    def create_post(self, fields: Dict[str, Any]) -> Dict:
        """
        Create a new post record

        Args:
            fields: Dictionary of field values for new post

        Returns:
            Created record data
        """
        try:
            # Add timestamps
            now = datetime.utcnow().isoformat()
            fields["created_at"] = now
            fields["updated_at"] = now

            response = self.client.table("posts").insert(fields).execute()

            # Invalidate cache
            self._clear_cache()

            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error creating post: {e}")
            raise

    def delete_post(self, record_id: str) -> bool:
        """
        Delete a post record

        Args:
            record_id: Post ID

        Returns:
            True if successful
        """
        try:
            self.client.table("posts").delete().eq("id", record_id).execute()

            # Invalidate cache
            self._clear_cache()

            return True
        except Exception as e:
            print(f"Error deleting post {record_id}: {e}")
            return False

    def get_posts_by_status(self, statuses: List[str]) -> List[Dict]:
        """
        Get all posts with any of the specified statuses

        Args:
            statuses: List of status values to include

        Returns:
            List of matching posts in Airtable format
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
            response = (
                self.client.table("posts")
                .select("id", count="exact")
                .execute()
            )
            return response.count or 0
        except Exception as e:
            print(f"Error getting posts count: {e}")
            return 0

    def search_posts(self, query: str) -> List[Dict]:
        """
        Search posts by title or content

        Args:
            query: Search query string

        Returns:
            List of matching posts in Airtable format
        """
        try:
            # Note: This is a basic search. For better full-text search,
            # you might want to use Supabase's native full-text search
            all_posts = self.get_all_posts()
            query_lower = query.lower()

            matching = [
                post for post in all_posts
                if query_lower in post.get("fields", {}).get("Title", "").lower()
                or query_lower in post.get("fields", {}).get("Post Content", "").lower()
            ]
            return matching
        except Exception as e:
            print(f"Error searching posts: {e}")
            return []
