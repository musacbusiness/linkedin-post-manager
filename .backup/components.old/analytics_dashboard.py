"""
Analytics Dashboard Component
Shows metrics and visualizations for LinkedIn post performance
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter


def render_analytics_dashboard(posts: List[Dict[str, Any]]) -> None:
    """
    Render comprehensive analytics dashboard

    Args:
        posts: List of post records from Airtable
    """
    if not posts:
        st.info("No posts available for analytics")
        return

    st.subheader("📊 Analytics Dashboard")

    # Key metrics
    st.write("### Key Metrics")
    display_key_metrics(posts)

    # Status distribution
    st.write("### Posts by Status")
    col1, col2 = st.columns(2)

    with col1:
        display_status_pie_chart(posts)

    with col2:
        display_status_bar_chart(posts)

    # Timeline metrics
    st.write("### Publishing Timeline")
    display_publishing_timeline(posts)

    # Approval metrics
    st.write("### Approval Rate")
    display_approval_metrics(posts)

    # Topic analysis
    st.write("### Content Themes")
    display_topic_analysis(posts)


def display_key_metrics(posts: List[Dict[str, Any]]) -> None:
    """Display key performance metrics"""
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric(
            label="Total Posts",
            value=len(posts),
            help="All posts in database",
        )

    with col2:
        draft_count = status_counts.get("Draft", 0)
        st.metric(
            label="Drafts",
            value=draft_count,
            help="Posts awaiting review",
        )

    with col3:
        scheduled_count = status_counts.get("Scheduled", 0)
        posted_count = status_counts.get("Posted", 0)
        st.metric(
            label="Ready to Publish",
            value=scheduled_count + posted_count,
            help="Scheduled or already posted",
        )

    with col4:
        posted_count = status_counts.get("Posted", 0)
        st.metric(
            label="Published",
            value=posted_count,
            help="Posts live on LinkedIn",
        )

    with col5:
        rejected_count = status_counts.get("Rejected", 0)
        st.metric(
            label="Rejected",
            value=rejected_count,
            help="Posts marked for deletion",
        )


def display_status_pie_chart(posts: List[Dict[str, Any]]) -> None:
    """Display pie chart of post statuses"""
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    fig = go.Figure(
        data=[
            go.Pie(
                labels=list(status_counts.keys()),
                values=list(status_counts.values()),
                hole=0.3,
            )
        ]
    )

    fig.update_layout(
        title="Status Distribution",
        height=400,
        margin=dict(l=0, r=0, t=30, b=0),
    )

    st.plotly_chart(fig, use_container_width=True)


def display_status_bar_chart(posts: List[Dict[str, Any]]) -> None:
    """Display bar chart of post statuses"""
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    statuses = list(status_counts.keys())
    counts = list(status_counts.values())

    fig = go.Figure(data=[go.Bar(x=statuses, y=counts, marker_color="rgba(10, 102, 194, 0.7)")])

    fig.update_layout(
        title="Status Count",
        xaxis_title="Status",
        yaxis_title="Number of Posts",
        height=400,
        margin=dict(l=0, r=0, t=30, b=0),
        showlegend=False,
    )

    st.plotly_chart(fig, use_container_width=True)


def display_publishing_timeline(posts: List[Dict[str, Any]]) -> None:
    """Display publishing timeline"""
    # Group posts by week
    weekly_counts = {}

    for post in posts:
        created_str = post.get("fields", {}).get("Created", "")
        if not created_str:
            continue

        try:
            created_date = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            week_start = created_date - timedelta(days=created_date.weekday())
            week_key = week_start.strftime("%Y-W%W")

            weekly_counts[week_key] = weekly_counts.get(week_key, 0) + 1
        except (ValueError, TypeError):
            continue

    if weekly_counts:
        weeks = sorted(weekly_counts.keys())
        counts = [weekly_counts[week] for week in weeks]

        fig = go.Figure(
            data=[go.Scatter(x=weeks, y=counts, mode="lines+markers", line_shape="linear")]
        )

        fig.update_layout(
            title="Posts Created Over Time",
            xaxis_title="Week",
            yaxis_title="Number of Posts",
            height=350,
            margin=dict(l=0, r=0, t=30, b=0),
            hovermode="x unified",
        )

        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No date data available for timeline")


def display_approval_metrics(posts: List[Dict[str, Any]]) -> None:
    """Display approval rate and workflow metrics"""
    col1, col2, col3 = st.columns(3)

    # Calculate workflow metrics
    status_counts = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    total_posts = len(posts)
    approved_posts = status_counts.get("Approved - Ready to Schedule", 0)
    scheduled_posts = status_counts.get("Scheduled", 0)
    posted_posts = status_counts.get("Posted", 0)
    rejected_posts = status_counts.get("Rejected", 0)

    approval_rate = (
        (approved_posts + scheduled_posts + posted_posts) / total_posts * 100
        if total_posts > 0
        else 0
    )

    with col1:
        st.metric(
            label="Approval Rate",
            value=f"{approval_rate:.1f}%",
            help="Percentage of posts approved/published",
        )

    with col2:
        rejection_rate = rejected_posts / total_posts * 100 if total_posts > 0 else 0
        st.metric(
            label="Rejection Rate",
            value=f"{rejection_rate:.1f}%",
            help="Percentage of posts rejected",
        )

    with col3:
        avg_time_to_schedule = calculate_avg_time_to_schedule(posts)
        st.metric(
            label="Avg Time to Schedule",
            value=f"{avg_time_to_schedule:.1f} days",
            help="Average days from created to scheduled",
        )


def display_topic_analysis(posts: List[Dict[str, Any]]) -> None:
    """Display most common topics/keywords"""
    from collections import Counter
    import re

    # Extract titles and count common words
    all_words = []

    for post in posts:
        title = post.get("fields", {}).get("Title", "").lower()
        content = post.get("fields", {}).get("Post Content", "").lower()

        # Combine and extract words
        text = f"{title} {content}"
        words = re.findall(r"\b\w{4,}\b", text)  # Words 4+ chars
        all_words.extend(words)

    # Filter out common words
    common_words = {
        "that", "this", "with", "from", "have", "been", "post", "your", "what",
        "more", "when", "where", "which", "about", "would", "through", "could",
        "into", "some", "just", "time", "want", "like", "make", "than", "them",
        "their", "there", "these", "those", "other", "such", "same", "then",
    }

    filtered_words = [w for w in all_words if w not in common_words and len(w) > 3]
    word_counts = Counter(filtered_words)
    top_words = word_counts.most_common(10)

    if top_words:
        words = [w[0].capitalize() for w in top_words]
        counts = [w[1] for w in top_words]

        fig = go.Figure(
            data=[
                go.Bar(
                    x=words,
                    y=counts,
                    marker_color="rgba(50, 205, 50, 0.7)",
                )
            ]
        )

        fig.update_layout(
            title="Top 10 Keywords",
            xaxis_title="Keywords",
            yaxis_title="Frequency",
            height=350,
            margin=dict(l=0, r=0, t=30, b=0),
            showlegend=False,
        )

        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Not enough content for topic analysis")


def calculate_avg_time_to_schedule(posts: List[Dict[str, Any]]) -> float:
    """Calculate average time from creation to scheduling"""
    times_to_schedule = []

    for post in posts:
        fields = post.get("fields", {})
        created_str = fields.get("Created", "")
        scheduled_str = fields.get("Scheduled Time", "")

        if not created_str or not scheduled_str:
            continue

        try:
            created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            scheduled = datetime.fromisoformat(scheduled_str.replace("Z", "+00:00"))

            time_diff = (scheduled - created).days
            if time_diff >= 0:
                times_to_schedule.append(time_diff)
        except (ValueError, TypeError):
            continue

    if times_to_schedule:
        return sum(times_to_schedule) / len(times_to_schedule)
    else:
        return 0.0
