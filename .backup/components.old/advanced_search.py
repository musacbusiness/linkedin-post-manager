"""
Advanced Search Component
Enhanced search with date range and multiple filter criteria
"""

import streamlit as st
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


def render_advanced_search(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Render advanced search interface with multiple filters

    Args:
        posts: List of post records from Airtable

    Returns:
        Filtered list of posts
    """
    st.subheader("🔍 Advanced Search & Filters")

    # Create filter sections
    col1, col2, col3 = st.columns(3)

    with col1:
        search_query = st.text_input(
            "Search by title or content:",
            key="advanced_search_query",
            placeholder="e.g., 'automation', 'productivity'"
        )

    with col2:
        status_filter = st.multiselect(
            "Filter by status:",
            options=[
                "Draft",
                "Pending Review",
                "Approved - Ready to Schedule",
                "Scheduled",
                "Posted",
                "Rejected",
            ],
            key="advanced_status_filter",
        )

    with col3:
        date_range = st.selectbox(
            "Date range:",
            options=[
                "All Time",
                "Last 7 days",
                "Last 30 days",
                "Last 90 days",
                "Custom range",
            ],
            key="advanced_date_filter",
        )

    # Custom date range picker
    custom_start_date = None
    custom_end_date = None

    if date_range == "Custom range":
        col1, col2 = st.columns(2)
        with col1:
            custom_start_date = st.date_input(
                "Start date:",
                value=datetime.now() - timedelta(days=30),
                key="custom_start_date",
            )
        with col2:
            custom_end_date = st.date_input(
                "End date:",
                value=datetime.now(),
                key="custom_end_date",
            )

    # Apply filters
    filtered_posts = apply_advanced_filters(
        posts,
        search_query=search_query,
        status_filters=status_filter if status_filter else None,
        date_range=date_range,
        custom_start_date=custom_start_date,
        custom_end_date=custom_end_date,
    )

    # Display results summary
    st.info(f"📊 Found {len(filtered_posts)} of {len(posts)} posts")

    return filtered_posts


def apply_advanced_filters(
    posts: List[Dict[str, Any]],
    search_query: Optional[str] = None,
    status_filters: Optional[List[str]] = None,
    date_range: str = "All Time",
    custom_start_date: Optional[datetime] = None,
    custom_end_date: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    Apply all filters to posts

    Args:
        posts: List of posts to filter
        search_query: Text to search for
        status_filters: List of statuses to include
        date_range: Preset date range
        custom_start_date: Custom range start (for "Custom range")
        custom_end_date: Custom range end (for "Custom range")

    Returns:
        Filtered posts list
    """
    filtered = posts

    # Search filter
    if search_query and search_query.strip():
        query = search_query.lower().strip()
        filtered = [
            p for p in filtered
            if query in p.get("fields", {}).get("Title", "").lower()
            or query in p.get("fields", {}).get("Post Content", "").lower()
        ]

    # Status filter
    if status_filters:
        filtered = [
            p for p in filtered
            if p.get("fields", {}).get("Status") in status_filters
        ]

    # Date range filter
    if date_range != "All Time":
        filtered = apply_date_filter(filtered, date_range, custom_start_date, custom_end_date)

    return filtered


def apply_date_filter(
    posts: List[Dict[str, Any]],
    date_range: str,
    custom_start_date: Optional[datetime] = None,
    custom_end_date: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    Filter posts by date range

    Args:
        posts: List of posts to filter
        date_range: Date range preset
        custom_start_date: Start of custom range
        custom_end_date: End of custom range

    Returns:
        Posts within date range
    """
    now = datetime.now()

    # Determine date range
    if date_range == "Last 7 days":
        start_date = now - timedelta(days=7)
        end_date = now
    elif date_range == "Last 30 days":
        start_date = now - timedelta(days=30)
        end_date = now
    elif date_range == "Last 90 days":
        start_date = now - timedelta(days=90)
        end_date = now
    elif date_range == "Custom range" and custom_start_date and custom_end_date:
        start_date = datetime.combine(custom_start_date, datetime.min.time())
        end_date = datetime.combine(custom_end_date, datetime.max.time())
    else:
        return posts

    # Filter by created date
    filtered = []
    for post in posts:
        created_str = post.get("fields", {}).get("Created", "")
        if not created_str:
            continue

        try:
            created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            if start_date <= created <= end_date:
                filtered.append(post)
        except (ValueError, TypeError):
            continue

    return filtered


def display_search_results(filtered_posts: List[Dict[str, Any]]) -> None:
    """
    Display search results in a compact format

    Args:
        filtered_posts: List of filtered posts
    """
    if not filtered_posts:
        st.warning("No posts match your search criteria")
        return

    st.write("### Search Results")

    for post in filtered_posts:
        fields = post.get("fields", {})
        record_id = post.get("id", "")
        title = fields.get("Title", "Untitled")
        status = fields.get("Status", "Unknown")
        created_str = fields.get("Created", "")

        try:
            created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            created_date = created.strftime("%b %d, %Y")
        except:
            created_date = "Unknown"

        # Expandable result item
        with st.expander(f"📄 {title[:50]} • {status} • {created_date}"):
            col1, col2 = st.columns([2, 1])

            with col1:
                content = fields.get("Post Content", "")[:200]
                st.write("**Content Preview:**")
                st.write(content)

            with col2:
                if fields.get("Image URL"):
                    st.image(fields.get("Image URL"), width=150)

            # Additional metadata
            st.caption(f"**Record ID:** {record_id}")
            st.caption(f"**Created:** {created_date}")
            if fields.get("Scheduled Time"):
                st.caption(f"**Scheduled:** {fields.get('Scheduled Time')}")
