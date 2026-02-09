"""
Post Card Component - Grid-based post display with actions
"""

import streamlit as st
from datetime import datetime
from typing import Dict, List, Optional


def format_date(date_str: Optional[str]) -> str:
    """Format ISO datetime string to readable format"""
    if not date_str:
        return "—"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y %I:%M %p")
    except:
        return date_str


def get_status_color(status: str) -> str:
    """Get color for status badge"""
    status_colors = {
        "🔵 Pending Review": "#4169E1",
        "🟢 Approved": "#32CD32",
        "❌ Rejected": "#DC143C",
        "Pending Review": "#4169E1",
        "Approved": "#32CD32",
        "Rejected": "#DC143C",
    }
    return status_colors.get(status, "#808080")


def render_status_badge(status: str) -> None:
    """Render status badge"""
    color = get_status_color(status)
    st.markdown(
        f"""
        <div style='background-color: {color}; color: white; padding: 4px 12px;
        border-radius: 16px; font-size: 11px; font-weight: bold; display: inline-block;'>
        {status}
        </div>
        """,
        unsafe_allow_html=True
    )


def render_scheduled_indicator(scheduled_time: Optional[str]) -> None:
    """Render scheduled time indicator"""
    if not scheduled_time:
        return

    try:
        dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
        time_str = dt.strftime("%b %d at %I:%M %p")

        st.markdown(
            f"""
            <div style='background-color: #E8F0FE; color: #1967D2; padding: 4px 8px;
            border-radius: 8px; font-size: 10px; display: inline-block; margin-top: 4px;'>
            📅 Scheduled: {time_str}
            </div>
            """,
            unsafe_allow_html=True
        )
    except:
        st.caption(f"📅 Scheduled: {scheduled_time[:16]}")


def render_post_card(post: Dict, selected: bool = False) -> Dict:
    """
    Render a single post as a card with actions

    Returns a dict with action results
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    results = {
        "selected": selected,
        "action": None,
        "record_id": record_id,
    }

    with st.container():
        # Top row: checkbox + status + actions
        col_check, col_status, col_actions = st.columns([0.5, 2, 1.5])

        with col_check:
            selected = st.checkbox(
                "Select",
                value=selected,
                label_visibility="collapsed",
                key=f"select_{record_id}",
            )
            results["selected"] = selected

        with col_status:
            status = fields.get("Status", "Unknown")
            render_status_badge(status)
            scheduled_time = fields.get("Scheduled Time")
            if scheduled_time:
                render_scheduled_indicator(scheduled_time)

        with col_actions:
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("✅", key=f"approve_{record_id}", help="Approve"):
                    results["action"] = "approve"
            with col2:
                if st.button("❌", key=f"reject_{record_id}", help="Reject"):
                    results["action"] = "reject"
            with col3:
                if st.button("✏️", key=f"edit_{record_id}", help="Edit"):
                    results["action"] = "edit"

        # Title and content
        st.write(f"**{fields.get('Title', 'Untitled')[:60]}**")

        # Image if available
        image_url = fields.get("Image URL")
        if image_url:
            try:
                st.image(image_url, width=150)
            except:
                st.caption("📸 Image unavailable")

        # Post content preview
        content = fields.get("Post Content", "")
        if content:
            st.caption(content[:150] + ("..." if len(content) > 150 else ""))

        # Bottom info
        col1, col2 = st.columns([2, 1])
        with col1:
            created = format_date(fields.get("Created"))
            st.caption(f"📅 Created: {created}")
        with col2:
            if st.button("▼ View", key=f"expand_{record_id}", use_container_width=True):
                results["action"] = "expand"

        st.divider()

    return results


def render_posts_grid(posts: List[Dict]) -> List[Dict]:
    """
    Render posts as a grid of cards (2 per row)

    Returns list of action results
    """
    if not posts:
        st.info("No posts found")
        return []

    results = []

    # Render cards in 2-column grid
    for i in range(0, len(posts), 2):
        col1, col2 = st.columns(2)

        with col1:
            if i < len(posts):
                result = render_post_card(posts[i])
                results.append(result)

        with col2:
            if i + 1 < len(posts):
                result = render_post_card(posts[i + 1])
                results.append(result)

    return results
