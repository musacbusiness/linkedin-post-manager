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
            scheduled_time = fields.get("Scheduled Time")
            if scheduled_time:
                render_scheduled_indicator(scheduled_time)

        with col_actions:
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("✅", key=f"approve_{record_id}", help="Approve"):
                    if clients and "supabase" in clients:
                        try:
                            result = clients["supabase"].update_status(record_id, "Approved")
                            if result.get("success"):
                                st.session_state[action_key] = "approve_success"
                                st.success("✅ Status updated in database, refreshing...")
                                st.rerun()
                            else:
                                st.error(f"Failed to update: {result.get('error', 'Unknown error')}")
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
                    # Open expanded view for editing
                    st.session_state[expand_key] = True
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

        # Expanded view with full details and editing
        if st.session_state[expand_key]:
            st.divider()

            # Header with title and close button
            col_title, col_close = st.columns([0.95, 0.05])
            with col_title:
                st.markdown("### ✏️ Edit Post")
            with col_close:
                if st.button("✕", key=f"close_expand_{record_id}", help="Close"):
                    st.session_state[expand_key] = False
                    st.rerun()

            st.divider()

            # Main content: Image on left, form fields on right
            col_image, col_form = st.columns([1, 1.5])

            with col_image:
                st.markdown("**📸 Post Image**")
                image_url = fields.get("Image URL")
                if image_url:
                    try:
                        st.image(image_url, use_column_width=True)
                    except:
                        st.info("📸 Image unavailable")
                else:
                    st.info("No image yet")

                if st.button("🎨 Regenerate Image", key=f"regen_img_{record_id}", use_container_width=True):
                    st.info("🖼️ Image regeneration coming soon!")

            with col_form:
                st.markdown("**📝 Content**")

                edited_title = st.text_input(
                    "Post Title",
                    value=fields.get("Title", ""),
                    placeholder="Enter post title...",
                    key=f"title_input_{record_id}"
                )

                edited_content = st.text_area(
                    "Post Content",
                    value=fields.get("Post Content", ""),
                    height=150,
                    placeholder="Enter post content...",
                    key=f"content_input_{record_id}"
                )

                # Character count
                char_count = len(edited_content)
                st.caption(f"📊 {char_count} characters")

            st.divider()

            # Action buttons
            button_col1, button_col2, button_col3 = st.columns(3)

            with button_col1:
                if st.button("💾 Save Changes", key=f"save_{record_id}", use_container_width=True):
                    if clients and "supabase" in clients:
                        try:
                            response = clients["supabase"].client.table("posts").update({
                                "title": edited_title,
                                "post_content": edited_content,
                                "updated_at": datetime.now().isoformat()
                            }).eq("id", record_id).execute()
                            st.success("✅ Changes saved!")
                            st.session_state[expand_key] = False
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error saving changes: {str(e)}")

            with button_col2:
                if st.button("🔄 Discard Changes", key=f"discard_{record_id}", use_container_width=True):
                    st.session_state[expand_key] = False
                    st.rerun()

            with button_col3:
                st.empty()

            st.divider()

            # Metadata section
            st.markdown("**📋 Post Details**")

            meta_col1, meta_col2 = st.columns(2)

            with meta_col1:
                status = fields.get("Status", "Unknown")
                st.markdown(f"**Status:** {status}")
                created = format_date(fields.get("Created", ""))
                st.markdown(f"**Created:** {created}")

            with meta_col2:
                scheduled_time = fields.get("Scheduled Time")
                if scheduled_time:
                    scheduled = format_date(scheduled_time)
                    st.markdown(f"**Scheduled:** {scheduled}")
                st.markdown(f"**ID:** `{record_id}`")

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
