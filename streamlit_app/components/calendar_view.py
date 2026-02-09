"""
Calendar Component - Interactive calendar view for scheduled posts
"""

import streamlit as st
from datetime import datetime, timedelta
from typing import List, Dict, Optional


def format_date(date_str: Optional[str]) -> str:
    """Format ISO datetime string to readable format"""
    if not date_str:
        return "—"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y %I:%M %p")
    except:
        return date_str


def render_calendar_view(posts: List[Dict]):
    """Render interactive calendar for viewing scheduled posts"""
    # Date selector
    col1, col2, col3 = st.columns(3)

    with col1:
        selected_date = st.date_input(
            "📅 Select a date to view scheduled posts:",
            value=datetime.now().date(),
            key="calendar_date"
        )

    # Get posts for selected date
    posts_for_date = []
    for post in posts:
        scheduled_time = post.get("fields", {}).get("Scheduled Time")
        if scheduled_time:
            try:
                post_dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                if post_dt.date() == selected_date:
                    posts_for_date.append(post)
            except:
                pass

    # Sort by time
    posts_for_date.sort(
        key=lambda p: datetime.fromisoformat(
            p.get("fields", {}).get("Scheduled Time", "").replace("Z", "+00:00")
        )
    )

    # Display calendar view
    st.divider()
    st.subheader(f"📅 Posts Scheduled for {selected_date.strftime('%B %d, %Y')}")

    if not posts_for_date:
        st.info("No posts scheduled for this date")
    else:
        st.write(f"**{len(posts_for_date)} post(s) scheduled**")
        st.divider()

        for post in posts_for_date:
            fields = post.get("fields", {})
            scheduled_time = fields.get("Scheduled Time")

            # Parse time
            try:
                post_dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                time_str = post_dt.strftime("%I:%M %p")
            except:
                time_str = "Unknown time"

            # Display post preview
            col1, col2, col3 = st.columns([3, 1, 1])

            with col1:
                st.write(f"**🕘 {time_str} - {fields.get('Title', 'Untitled')[:50]}**")
                st.caption(fields.get("Post Content", "")[:150] + "...")

            with col2:
                if st.button("👁️", key=f"preview_{post['id']}", help="Preview"):
                    with st.expander(f"Preview: {fields.get('Title', 'Untitled')}"):
                        st.write(fields.get("Post Content", ""))
                        if fields.get("Image URL"):
                            st.image(fields.get("Image URL"), width=200)

            with col3:
                status = fields.get("Status", "")
                if status == "Approved":
                    st.success("✅")
                else:
                    st.warning("⏳")

            st.divider()


def render_calendar_mini(posts: List[Dict]):
    """
    Render a mini month view showing which days have posts
    """
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    # Get all dates with posts this month
    posts_by_date = {}
    for post in posts:
        scheduled_time = post.get("fields", {}).get("Scheduled Time")
        if scheduled_time:
            try:
                post_dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                if post_dt.month == current_month and post_dt.year == current_year:
                    date_key = post_dt.date()
                    if date_key not in posts_by_date:
                        posts_by_date[date_key] = []
                    posts_by_date[date_key].append(post)
            except:
                pass

    st.subheader(f"📆 {now.strftime('%B %Y')} Calendar")

    # Simple calendar grid
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    st.write(" | ".join(days_of_week))

    # Calculate first day of month and number of days
    first_day = datetime(current_year, current_month, 1)
    num_days = (datetime(current_year, current_month + 1 if current_month < 12 else 1, 1) - first_day).days

    # Calendar display
    col1, col2, col3, col4, col5, col6, col7 = st.columns(7)
    cols = [col1, col2, col3, col4, col5, col6, col7]

    # Add empty cells for days before month starts
    start_weekday = first_day.weekday()  # 0=Monday
    for i in range(start_weekday):
        with cols[i]:
            st.write("")

    # Add days of month
    for day in range(1, num_days + 1):
        col_idx = (start_weekday + day - 1) % 7
        date_obj = datetime(current_year, current_month, day).date()
        post_count = len(posts_by_date.get(date_obj, []))

        with cols[col_idx]:
            if post_count > 0:
                st.markdown(f"**{day}** 📍\n({post_count})")
            else:
                st.write(str(day))
