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


def render_posted_indicator(posted_at: Optional[str], linkedin_url: Optional[str] = None) -> None:
    """Render posted status indicator"""
    if not posted_at:
        return

    try:
        dt = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
        time_str = dt.strftime("%b %d at %I:%M %p")

        if linkedin_url:
            st.markdown(
                f"""
                <div style='background-color: #E8F8F0; color: #0A66C2; padding: 4px 8px;
                border-radius: 8px; font-size: 10px; display: inline-block; margin-top: 4px;'>
                ✅ Posted: {time_str} • <a href="{linkedin_url}" target="_blank">View on LinkedIn</a>
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.markdown(
                f"""
                <div style='background-color: #E8F8F0; color: #0A66C2; padding: 4px 8px;
                border-radius: 8px; font-size: 10px; display: inline-block; margin-top: 4px;'>
                ✅ Posted: {time_str}
                </div>
                """,
                unsafe_allow_html=True
            )
    except:
        st.caption(f"✅ Posted: {posted_at[:16]}")


def render_post_card(post: Dict, clients: Dict = None) -> Dict:
    """
    Render a single post as a card with actions

    NOTE: Session state must be pre-initialized by the caller!

    Returns a dict with action results
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    # Build state keys (must be pre-initialized by caller)
    expand_key = f"expand_{record_id}"
    select_key = f"select_{record_id}"
    action_key = f"action_{record_id}"

    results = {
        "selected": st.session_state.get(select_key, False),
        "action": None,
        "record_id": record_id,
    }

    # Show success messages from previous actions
    action_status = st.session_state.get(action_key)
    if action_status == "approve_success":
        st.success("✅ Post approved!")
        st.session_state[action_key] = None
    elif action_status == "reject_success":
        st.success("✅ Post rejected and deleted!")
        st.session_state[action_key] = None

    with st.container():
        # Top row: checkbox + status + actions
        col_check, col_status, col_actions = st.columns([0.5, 2, 1.5])

        with col_check:
            # Use the checkbox value directly from pre-initialized session_state
            selected = st.checkbox(
                "Select",
                value=st.session_state.get(select_key, False),
                label_visibility="collapsed",
                key=select_key,
            )
            results["selected"] = selected

        with col_status:
            status = fields.get("Status", "Unknown")
            render_status_badge(status)

            # Show posted indicator if post has been published
            posted_at = fields.get("Posted")
            if posted_at:
                linkedin_url = fields.get("LinkedIn URL")
                render_posted_indicator(posted_at, linkedin_url)
            else:
                # Show scheduled indicator if not yet posted
                scheduled_time = fields.get("Scheduled Time")
                if scheduled_time:
                    render_scheduled_indicator(scheduled_time)

        with col_actions:
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("✅", key=f"approve_{record_id}", help="Approve"):
                    if clients and "supabase" in clients:
                        try:
                            # Auto-schedule the post on approval
                            result = clients["supabase"].schedule_post(record_id)
                            if result.get("success"):
                                st.session_state[action_key] = "approve_success"
                                scheduled_time = result.get("scheduled_time", "")
                                if scheduled_time:
                                    try:
                                        dt = datetime.fromisoformat(scheduled_time.replace("Z", "+00:00"))
                                        time_str = dt.strftime("%b %d at %I:%M %p")
                                        st.success(f"✅ Post approved and scheduled for {time_str}!")
                                    except:
                                        st.success("✅ Post approved and scheduled!")
                                else:
                                    st.success("✅ Post approved and scheduled!")
                                st.rerun()
                            else:
                                st.error(f"Failed to approve: {result.get('error', 'Unknown error')}")
                        except Exception as e:
                            st.error(f"Error approving post: {str(e)}")
                    else:
                        st.error("❌ Supabase client not available")
                    results["action"] = "approve"
            with col2:
                if st.button("❌", key=f"reject_{record_id}", help="Reject"):
                    if clients and "supabase" in clients:
                        try:
                            result = clients["supabase"].delete_post(record_id)
                            if result.get("success"):
                                st.session_state[action_key] = "reject_success"
                                st.success("🗑️ Post deleted from database, refreshing...")
                                st.rerun()
                            else:
                                st.error(f"Failed to delete: {result.get('error', 'Unknown error')}")
                        except Exception as e:
                            st.error(f"Error rejecting post: {str(e)}")
                    else:
                        st.error("❌ Supabase client not available")
                    results["action"] = "reject"
            with col3:
                if st.button("✏️", key=f"edit_{record_id}", help="Edit"):
                    # Open full-page editor
                    st.session_state["editing_post"] = record_id
                    results["action"] = "edit"

        # Clickable title to expand post
        title = fields.get('Title', 'Untitled')
        if st.button(f"**{title[:60]}**", key=f"title_expand_{record_id}", use_container_width=True):
            st.session_state[expand_key] = not st.session_state[expand_key]

        # Image if available (only show in collapsed view)
        if not st.session_state[expand_key]:
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

            # Bottom info (collapsed view)
            created = format_date(fields.get("Created"))
            st.caption(f"📅 Created: {created}")

        # Expanded view - preview only (no editing - edit goes to full page)
        if st.session_state[expand_key]:
            st.divider()
            st.markdown("### 📖 Post Preview")

            # Image in expanded view
            image_url = fields.get("Image URL")
            if image_url:
                try:
                    st.image(image_url, width=300)
                except:
                    st.caption("📸 Image unavailable")

            # Full content
            st.markdown("**Title:**")
            st.write(fields.get("Title", "Untitled"))

            st.markdown("**Content:**")
            st.write(fields.get("Post Content", ""))

            # Metadata
            st.divider()
            st.markdown("**Details:**")
            meta_col1, meta_col2 = st.columns(2)

            with meta_col1:
                status = fields.get("Status", "Unknown")
                st.caption(f"Status: {status}")
                created = format_date(fields.get("Created", ""))
                st.caption(f"Created: {created}")

            with meta_col2:
                scheduled_time = fields.get("Scheduled Time")
                if scheduled_time:
                    scheduled = format_date(scheduled_time)
                    st.caption(f"Scheduled: {scheduled}")
                st.caption(f"ID: {record_id}")

            st.divider()

            # Collapse button
            if st.button("▲ Collapse", key=f"collapse_{record_id}", use_container_width=True):
                st.session_state[expand_key] = False
                st.rerun()

        st.divider()

    return results


def render_posts_grid(posts: List[Dict], clients: Dict = None) -> List[Dict]:
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
                result = render_post_card(posts[i], clients)
                results.append(result)

        with col2:
            if i + 1 < len(posts):
                result = render_post_card(posts[i + 1], clients)
                results.append(result)

    return results
