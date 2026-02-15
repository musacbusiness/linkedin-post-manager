"""
Supabase Client for LinkedIn Post Manager
Drop-in replacement for Airtable API client
"""

import os
import random
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta


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

    def schedule_post(self, record_id: str) -> Dict:
        """
        Auto-schedule post to random time in next available window

        Scheduling windows (user's local timezone):
        - 8:00 AM - 10:00 AM
        - 12:00 PM - 2:00 PM
        - 5:00 PM - 7:00 PM

        Returns:
            Dictionary with success status and scheduled time
        """
        try:
            # Get all posts to check for scheduling conflicts
            all_posts = self.get_all_posts()
            scheduled_times = []
            for post in all_posts:
                scheduled_time = post.get("fields", {}).get("Scheduled Time")
                if scheduled_time:
                    try:
                        # Parse and strip timezone info to make it naive (comparable with now)
                        dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                        # Convert to naive datetime by removing timezone info
                        naive_dt = dt.replace(tzinfo=None)
                        scheduled_times.append(naive_dt)
                    except:
                        pass

            # Define 3 daily time windows (start_hour, end_hour)
            windows = [
                (8, 10),   # 8:00 AM - 10:00 AM
                (12, 14),  # 12:00 PM - 2:00 PM
                (17, 19),  # 5:00 PM - 7:00 PM
            ]

            now = datetime.now()
            scheduled_datetime = None

            # Look ahead up to 30 days to find an available slot
            for days_ahead in range(30):
                check_date = now + timedelta(days=days_ahead)

                # Try each window for this day
                for start_hour, end_hour in windows:
                    # Random time within window (2-hour range)
                    random_hour = random.randint(start_hour, end_hour - 1)
                    random_minute = random.randint(0, 59)
                    candidate_time = check_date.replace(
                        hour=random_hour,
                        minute=random_minute,
                        second=0,
                        microsecond=0
                    )

                    # Skip past times
                    if candidate_time <= now:
                        continue

                    # Check if slot is available (no post within 30 minutes)
                    slot_available = True
                    for existing_time in scheduled_times:
                        time_diff = abs((candidate_time - existing_time).total_seconds())
                        if time_diff < 1800:  # 30 minutes
                            slot_available = False
                            break

                    if slot_available:
                        scheduled_datetime = candidate_time
                        break

                if scheduled_datetime:
                    break

            if not scheduled_datetime:
                return {
                    "success": False,
                    "error": "No available time slots in next 30 days"
                }

            # Update post with scheduled time and Approved status
            response = self.client.table("posts").update({
                "status": "Approved",
                "scheduled_time": scheduled_datetime.isoformat(),
                "updated_at": now.isoformat()
            }).eq("id", record_id).execute()

            print(f"[DEBUG] Scheduled post {record_id} for {scheduled_datetime.isoformat()}")
            return {
                "success": True,
                "scheduled_time": scheduled_datetime.isoformat(),
                "data": response.data
            }

        except Exception as e:
            print(f"[DEBUG] Error scheduling post {record_id}: {str(e)}")
            return {"success": False, "error": str(e)}

    def upload_image_to_storage(self, image_bytes: bytes, filename: str) -> Dict:
        """
        Upload image to Supabase Storage bucket and return permanent public URL

        Args:
            image_bytes: Image file as bytes
            filename: Name for the file (e.g., "image.jpg")

        Returns:
            Dictionary with success status and public URL
        """
        try:
            bucket_name = "generated-images"

            if not image_bytes or len(image_bytes) == 0:
                raise Exception("Image data is empty (0 bytes)")

            # Upload the file to storage
            response = self.client.storage.from_(bucket_name).upload(
                filename,
                image_bytes,
                {"content-type": "image/jpeg"}
            )

            if response is None:
                raise Exception("Storage upload returned no response")

            # Get the permanent public URL
            public_url = self.client.storage.from_(bucket_name).get_public_url(filename)

            if not public_url:
                raise Exception("Failed to generate public URL from storage")

            return {
                "success": True,
                "url": public_url,
                "filename": filename
            }
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            # For Streamlit Cloud debugging
            print(f"[IMAGE_UPLOAD_ERROR] {filename}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_trace
            }
