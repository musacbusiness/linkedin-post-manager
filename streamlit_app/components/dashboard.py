"""
Dashboard Component - Home page with quick stats, today's posts, and weekly overview
"""

import streamlit as st
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from .post_table import format_date


def render_dashboard(posts: List[Dict], clients: Dict):
    """
    Render the dashboard home page with:
    - Quick stats (all statuses)
    - Today's scheduled posts
    - Post count by status
    """
    st.title("📊 Dashboard")

    # Quick Stats Section
    render_quick_stats(posts)

    st.divider()

    # Today's Scheduled Posts
    render_todays_posts(posts)

    st.divider()

    # Status Distribution
    render_status_distribution(posts)


def render_quick_stats(posts: List[Dict]):
    """Render quick statistics with post counts"""
    st.subheader("🎯 Quick Stats")

    if not posts:
        st.info("No posts available")
        return

    # Count posts by status
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    # Display total posts
    total_posts = len(posts)
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Total Posts", total_posts)

    with col2:
        scheduled_count = sum(1 for p in posts if p.get("fields", {}).get("Scheduled Time"))
        st.metric("Scheduled", scheduled_count)

    with col3:
        posted_count = sum(1 for p in posts if p.get("fields", {}).get("Posted"))
        st.metric("Posted", posted_count)


def render_todays_posts(posts: List[Dict]):
    """Render posts scheduled for today or near future"""
    st.subheader("📅 Upcoming Posts")

    if not posts:
        st.info("No posts available")
        return

    # Find posts with scheduled times
    upcoming_posts = []
    for post in posts:
        scheduled_time = post.get("fields", {}).get("Scheduled Time")
        if scheduled_time:
            try:
                scheduled_dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                if scheduled_dt >= datetime.now():
                    upcoming_posts.append((scheduled_dt, post))
            except:
                pass

    if not upcoming_posts:
        st.info("No upcoming scheduled posts")
        return

    # Sort by scheduled time
    upcoming_posts.sort(key=lambda x: x[0])

    # Display first 5 upcoming posts
    for scheduled_dt, post in upcoming_posts[:5]:
        fields = post.get("fields", {})
        col1, col2 = st.columns([3, 1])

        with col1:
            title = fields.get("Title", "Untitled")
            time_str = scheduled_dt.strftime("%b %d, %I:%M %p")
            st.write(f"**{title[:50]}**")
            st.caption(f"📅 {time_str}")

        with col2:
            if st.button("👁️", key=f"preview_{post.get('id')}", help="Preview post"):
                st.write(fields.get("Post Content", ""))


def render_status_distribution(posts: List[Dict]):
    """Render distribution of posts by status"""
    st.subheader("📊 Posts by Status")

    if not posts:
        st.info("No posts available")
        return

    # Count posts by status
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    if not status_counts:
        st.info("No posts to display")
        return

    # Display as columns
    cols = st.columns(len(status_counts) if len(status_counts) <= 4 else 4)

    for idx, (status, count) in enumerate(status_counts.items()):
        with cols[idx % len(cols)]:
            st.metric(status, count)

    # Display summary
    st.divider()
    st.write("**Summary:**")
    summary_text = " • ".join([f"{status}: {count}" for status, count in status_counts.items()])
    st.caption(summary_text)
