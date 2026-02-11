"""
Supabase Client for LinkedIn Post Manager
Drop-in replacement for Airtable API client
"""

import os
from typing import List, Dict, Optional, Any
from datetime import datetime


class SupabaseClient:
    """Client for interacting with Supabase PostgreSQL database"""

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize Supabase client with credentials

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase anon/public key
        """
        # Try to import Streamlit to load secrets
        try:
            import streamlit as st
            self.supabase_url = supabase_url or st.secrets.get("SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
            self.supabase_key = supabase_key or st.secrets.get("SUPABASE_KEY") or os.getenv("SUPABASE_KEY", "")
        except Exception:
            # Streamlit not available or secrets not accessible, use env vars
            self.supabase_url = supabase_url or os.getenv("SUPABASE_URL", "")
            self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY", "")

        if not self.supabase_url or not self.supabase_key:
            raise Exception(
                "❌ Supabase credentials missing!\n\n"
                "Add to Streamlit Cloud Secrets:\n"
                "- SUPABASE_URL=your_url\n"
                "- SUPABASE_KEY=your_anon_public_key\n"
            )

        # Initialize Supabase client
        try:
            from supabase import create_client
            self.client = create_client(self.supabase_url, self.supabase_key)
        except ImportError:
            raise Exception("supabase-py library not installed. Add to requirements.txt")

        self._cache: Dict[str, tuple] = {}
        self.cache_ttl = 30  # 30 seconds cache

    def get_all_posts(self, status_filter: Optional[str] = None) -> List[Dict]:
        """
        Get all posts from the database, formatted as Airtable-like records

        Args:
            status_filter: Optional status to filter by

        Returns:
            List of posts in Airtable format
        """
        try:
            # Query posts table
            query = self.client.table("posts").select("*")

            if status_filter:
                query = query.eq("status", status_filter)

            response = query.execute()
            posts = response.data

            # Convert to Airtable-like format
            return [self._to_airtable_format(post) for post in posts]
        except Exception as e:
            print(f"Error fetching posts: {str(e)}")
            return []

    def _to_airtable_format(self, record: Dict) -> Dict:
        """Convert Supabase record to Airtable-like format"""
        return {
            "id": record.get("id", ""),
            "fields": {
                "Title": record.get("title", ""),
                "Post Content": record.get("post_content", ""),
                "Image URL": record.get("image_url", ""),
                "Image Prompt": record.get("image_prompt", ""),
                "Status": record.get("status", ""),
                "Scheduled Time": record.get("scheduled_time", ""),
                "Posted": record.get("posted_at", ""),
                "LinkedIn URL": record.get("linkedin_url", ""),
                "Created": record.get("created_at", ""),
                "Updated": record.get("updated_at", ""),
                "Topic": record.get("topic", ""),
                "Source": record.get("source", ""),
            }
        }

    def get_posts_count(self) -> int:
        """Get total count of posts"""
        try:
            response = self.client.table("posts").select("id", count="exact").execute()
            return response.count or 0
        except Exception as e:
            print(f"Error counting posts: {str(e)}")
            return 0

    def update_status(self, record_id: str, new_status: str) -> Dict:
        """Update post status"""
        try:
            response = self.client.table("posts").update(
                {"status": new_status, "updated_at": datetime.now().isoformat()}
            ).eq("id", record_id).execute()
            print(f"[DEBUG] Updated post {record_id} status to '{new_status}'")
            print(f"[DEBUG] Response: {response.data}")
            return {"success": True, "data": response.data}
        except Exception as e:
            print(f"[DEBUG] Error updating post {record_id}: {str(e)}")
            return {"success": False, "error": str(e)}

    def delete_post(self, record_id: str) -> Dict:
        """Delete a post from the database"""
        try:
            response = self.client.table("posts").delete().eq("id", record_id).execute()
            print(f"[DEBUG] Deleted post {record_id}")
            print(f"[DEBUG] Response: {response.data}")
            return {"success": True, "data": response.data}
        except Exception as e:
            print(f"[DEBUG] Error deleting post {record_id}: {str(e)}")
            return {"success": False, "error": str(e)}
