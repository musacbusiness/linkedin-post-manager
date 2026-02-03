"""
Calendar View Component
Shows scheduled posts on a monthly calendar
"""

import streamlit as st
import calendar
from datetime import datetime, timedelta
from typing import Dict, List, Any


def render_calendar_view(posts: List[Dict[str, Any]]) -> None:
    """
    Render calendar view of scheduled posts

    Args:
        posts: List of post records from Airtable
    """
    st.subheader("📅 Posting Calendar")

    # Get today's date
    today = datetime.now()

    # Month/Year selector
    col1, col2, col3 = st.columns([1, 2, 1])

    with col1:
        if st.button("◀ Previous", use_container_width=True):
            st.session_state.calendar_month = st.session_state.get("calendar_month", today.month) - 1
            if st.session_state.calendar_month < 1:
                st.session_state.calendar_month = 12
                st.session_state.calendar_year = st.session_state.get("calendar_year", today.year) - 1

    with col2:
        display_month = st.session_state.get("calendar_month", today.month)
        display_year = st.session_state.get("calendar_year", today.year)
        month_name = calendar.month_name[display_month]
        st.write(f"### {month_name} {display_year}")

    with col3:
        if st.button("Next ▶", use_container_width=True):
            st.session_state.calendar_month = st.session_state.get("calendar_month", today.month) + 1
            if st.session_state.calendar_month > 12:
                st.session_state.calendar_month = 1
                st.session_state.calendar_year = st.session_state.get("calendar_year", today.year) + 1

    display_month = st.session_state.get("calendar_month", today.month)
    display_year = st.session_state.get("calendar_year", today.year)

    # Get scheduled posts for this month
    scheduled_posts = get_scheduled_posts_for_month(posts, display_month, display_year)

    # Render calendar grid
    render_calendar_grid(scheduled_posts, display_month, display_year)

    # Show posts for this month
    st.write("### Posts Scheduled This Month")
    if scheduled_posts:
        for post in scheduled_posts:
            display_scheduled_post(post)
    else:
        st.info("No posts scheduled for this month")


def get_scheduled_posts_for_month(
    posts: List[Dict[str, Any]],
    month: int,
    year: int
) -> List[Dict[str, Any]]:
    """
    Get posts scheduled for a specific month

    Args:
        posts: All posts
        month: Month number (1-12)
        year: Year

    Returns:
        Posts scheduled for that month
    """
    scheduled = []

    for post in posts:
        fields = post.get("fields", {})
        status = fields.get("Status", "")
        scheduled_time_str = fields.get("Scheduled Time", "")

        # Only include scheduled or posted items
        if status not in ["Scheduled", "Posted"]:
            continue

        if not scheduled_time_str:
            continue

        try:
            # Parse ISO format timestamp
            scheduled_time = datetime.fromisoformat(scheduled_time_str.replace("Z", "+00:00"))

            # Check if it's in the requested month/year
            if scheduled_time.month == month and scheduled_time.year == year:
                scheduled.append(post)
        except (ValueError, TypeError):
            continue

    return sorted(
        scheduled,
        key=lambda p: datetime.fromisoformat(
            p.get("fields", {}).get("Scheduled Time", "").replace("Z", "+00:00")
        )
    )


def render_calendar_grid(
    scheduled_posts: List[Dict[str, Any]],
    month: int,
    year: int
) -> None:
    """
    Render calendar grid for the month

    Args:
        scheduled_posts: Posts scheduled for this month
        month: Month number
        year: Year
    """
    # Get calendar for month
    cal = calendar.monthcalendar(year, month)

    # Create posts by date mapping
    posts_by_date = {}
    for post in scheduled_posts:
        fields = post.get("fields", {})
        scheduled_time_str = fields.get("Scheduled Time", "")

        try:
            dt = datetime.fromisoformat(scheduled_time_str.replace("Z", "+00:00"))
            day = dt.day
            if day not in posts_by_date:
                posts_by_date[day] = []
            posts_by_date[day].append(post)
        except (ValueError, TypeError):
            continue

    # Display calendar
    cols = st.columns(7)
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # Header
    for col, day in zip(cols, days):
        col.write(f"**{day}**")

    # Calendar grid
    for week in cal:
        cols = st.columns(7)
        for col, day in zip(cols, week):
            if day == 0:
                col.write("")
            else:
                # Check if posts scheduled for this day
                posts_on_day = posts_by_date.get(day, [])

                if posts_on_day:
                    # Show day with indicator
                    day_text = f"**{day}** 📌"
                    col.info(day_text)
                else:
                    col.write(f"{day}")


def display_scheduled_post(post: Dict[str, Any]) -> None:
    """
    Display a scheduled post in a card

    Args:
        post: Post record
    """
    fields = post.get("fields", {})
    scheduled_time_str = fields.get("Scheduled Time", "")

    try:
        dt = datetime.fromisoformat(scheduled_time_str.replace("Z", "+00:00"))
        time_str = dt.strftime("%a, %b %d at %I:%M %p")
    except (ValueError, TypeError):
        time_str = "Time pending"

    # Create expander for post details
    with st.expander(f"📱 {fields.get('Title', 'Untitled')} - {time_str}"):
        col1, col2 = st.columns([2, 1])

        with col1:
            st.write("**Content:**")
            st.write(fields.get("Post Content", "")[:300])

        with col2:
            if fields.get("Image URL"):
                st.image(fields.get("Image URL"), width=150)

        # Additional info
        st.caption(f"Status: {fields.get('Status', 'Unknown')}")
        if fields.get("LinkedIn Post URL"):
            st.caption(f"[View on LinkedIn]({fields.get('LinkedIn Post URL')})")
