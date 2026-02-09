"""
Post Table Component for LinkedIn Post Manager
Displays posts in an interactive table with filtering and quick actions
"""

import streamlit as st
import pandas as pd
from typing import List, Dict, Optional, Callable
from datetime import datetime


def format_date(date_str: Optional[str]) -> str:
    """Format ISO datetime string to readable format"""
    if not date_str:
        return "—"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y %I:%M %p")
    except:
        return date_str


def render_post_table(
    posts: List[Dict],
    on_approve: Optional[Callable] = None,
    on_reject: Optional[Callable] = None,
    on_edit: Optional[Callable] = None,
    on_revise: Optional[Callable] = None,
    status_filter: Optional[str] = None,
) -> Optional[str]:
    """
    Render interactive post table with action buttons

    Args:
        posts: List of post records from Airtable
        on_approve: Callback when approve button clicked
        on_reject: Callback when reject button clicked
        on_edit: Callback when edit button clicked
        on_revise: Callback when revise button clicked
        status_filter: Optional status to filter posts by

    Returns:
        Selected post ID if row clicked, None otherwise
    """
    if not posts:
        st.info("No posts found")
        return None

    # Filter by status if specified
    if status_filter:
        posts = [
            p for p in posts
            if p.get("fields", {}).get("Status") == status_filter
        ]

    if not posts:
        st.info(f"No posts with status: {status_filter}")
        return None

    # Prepare data for display
    table_data = []
    for post in posts:
        fields = post.get("fields", {})
        table_data.append({
            "ID": post.get("id", ""),
            "Title": fields.get("Title", "Untitled")[:50],  # Truncate for display
            "Status": fields.get("Status", "Unknown"),
            "Created": format_date(fields.get("Created")),
            "Scheduled": format_date(fields.get("Scheduled Time")),
            "Posted": format_date(fields.get("Posted")),
        })

    df = pd.DataFrame(table_data)

    # Display table
    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
        key="posts_table",
    )

    # Action buttons
    st.write("### Actions")
    cols = st.columns(5)

    with cols[0]:
        if st.button("✅ Approve", use_container_width=True):
            if on_approve:
                # Would need post selection in real implementation
                st.info("Select a post to approve")

    with cols[1]:
        if st.button("❌ Reject", use_container_width=True):
            if on_reject:
                st.info("Select a post to reject")

    with cols[2]:
        if st.button("✏️ Edit", use_container_width=True):
            if on_edit:
                st.info("Select a post to edit")

    with cols[3]:
        if st.button("🔄 Revise", use_container_width=True):
            if on_revise:
                st.info("Select a post to revise")

    with cols[4]:
        if st.button("🖼️ Preview", use_container_width=True):
            st.info("Select a post to preview")

    return None


def render_post_row(post: Dict) -> None:
    """
    Render a single post as an expandable row

    Args:
        post: Post record from Airtable
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    with st.expander(f"📄 {fields.get('Title', 'Untitled')}"):
        col1, col2 = st.columns([2, 1])

        with col1:
            st.write("**Content:**")
            st.write(fields.get("Post Content", ""))

        with col2:
            st.write("**Status:**")
            st.write(f"🔹 {fields.get('Status', 'Unknown')}")
            st.write("**Created:**")
            st.write(format_date(fields.get("Created")))

        if fields.get("Image URL"):
            st.image(fields.get("Image URL"), width=300)

        return record_id


def create_status_filter() -> Optional[str]:
    """
    Create a dropdown filter for post status

    Returns:
        Selected status or None for all
    """
    import sys
    import os
    from pathlib import Path

    # Add parent directory to path if not already there
    parent_dir = str(Path(__file__).parent.parent)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    from config import POST_STATUSES

    statuses = ["All"] + list(POST_STATUSES.keys())
    selected = st.selectbox(
        "Filter by Status:",
        statuses,
        key="status_filter",
    )

    return None if selected == "All" else selected


def create_search_box() -> str:
    """
    Create a search box for post titles and content

    Returns:
        Search query string
    """
    return st.text_input(
        "🔍 Search posts (title or content):",
        key="search_box",
    )


def filter_posts(
    posts: List[Dict],
    search_query: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict]:
    """
    Filter posts by search query and/or status

    Args:
        posts: List of posts to filter
        search_query: Search string to match against title/content
        status: Status to filter by

    Returns:
        Filtered list of posts
    """
    filtered = posts

    # Filter by status
    if status:
        filtered = [
            p for p in filtered
            if p.get("fields", {}).get("Status") == status
        ]

    # Filter by search query
    if search_query and search_query.strip():
        query = search_query.lower().strip()
        filtered = [
            p for p in filtered
            if query in p.get("fields", {}).get("Title", "").lower()
            or query in p.get("fields", {}).get("Post Content", "").lower()
        ]

    return filtered
