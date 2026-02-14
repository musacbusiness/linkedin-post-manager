"""
Batch Operations Component
Handles bulk selection and operations on multiple posts
"""

import streamlit as st
from typing import List, Dict, Any, Callable


def render_batch_operations_toolbar(posts: List[Dict[str, Any]], clients: Any) -> None:
    """
    Render batch operations toolbar with checkboxes and bulk action buttons

    Args:
        posts: List of post records from Airtable
        clients: Dictionary with airtable and modal clients
    """
    if not posts:
        return

    st.subheader("📦 Batch Operations")

    # Initialize batch selection state
    if "batch_selected_posts" not in st.session_state:
        st.session_state.batch_selected_posts = set()

    # Select All / Deselect All buttons
    col1, col2, col3 = st.columns([1, 1, 3])

    with col1:
        if st.button("☑️ Select All", use_container_width=True):
            st.session_state.batch_selected_posts = set(p.get("id") for p in posts)
            st.rerun()

    with col2:
        if st.button("☐ Clear All", use_container_width=True):
            st.session_state.batch_selected_posts = set()
            st.rerun()

    with col3:
        st.write("")

    # Render checkboxes for each post
    st.write("#### Select Posts to Operate On:")

    for post in posts:
        record_id = post.get("id", "")
        fields = post.get("fields", {})
        title = fields.get("Title", "Untitled")[:40]
        status = fields.get("Status", "Unknown")

        col1, col2 = st.columns([0.5, 5])

        with col1:
            is_selected = st.checkbox(
                label="",
                value=record_id in st.session_state.batch_selected_posts,
                key=f"batch_checkbox_{record_id}",
            )

            if is_selected:
                st.session_state.batch_selected_posts.add(record_id)
            else:
                st.session_state.batch_selected_posts.discard(record_id)

        with col2:
            st.write(f"📄 **{title}** • {status}")

    # Batch action buttons
    if st.session_state.batch_selected_posts:
        selected_count = len(st.session_state.batch_selected_posts)
        st.info(f"✅ {selected_count} post(s) selected")

        st.write("#### Bulk Actions:")
        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("✅ Approve All Selected", use_container_width=True):
                handle_bulk_approve(
                    list(st.session_state.batch_selected_posts), clients
                )

        with col2:
            if st.button("❌ Reject All Selected", use_container_width=True):
                handle_bulk_reject(
                    list(st.session_state.batch_selected_posts), clients
                )

        with col3:
            if st.button("🗑️ Delete All Selected", use_container_width=True):
                st.warning("⚠️ This action cannot be undone")
                if st.button("Confirm Delete"):
                    handle_bulk_delete(
                        list(st.session_state.batch_selected_posts), clients
                    )


def handle_bulk_approve(record_ids: List[str], clients: Any) -> None:
    """
    Handle bulk approve operation - Plan B: Direct status updates (no Modal webhooks)

    Args:
        record_ids: List of record IDs to approve
        clients: Dictionary with airtable client
    """
    airtable_client = clients["airtable"]

    progress_bar = st.progress(0)
    status_text = st.empty()

    for idx, record_id in enumerate(record_ids):
        try:
            status_text.text(f"⏳ Approving {idx + 1} of {len(record_ids)}...")

            # Update Airtable status - Modal's scheduler will pick these up
            airtable_client.update_status(record_id, "Approved - Ready to Schedule")

            progress_bar.progress((idx + 1) / len(record_ids))

        except Exception as e:
            st.error(f"❌ Error approving post {record_id}: {str(e)}")

    st.success(
        f"✅ Successfully approved {len(record_ids)} post(s)! They will be scheduled by the system."
    )
    st.session_state.batch_selected_posts = set()
    st.rerun()


def handle_bulk_reject(record_ids: List[str], clients: Any) -> None:
    """
    Handle bulk reject operation - Plan B: Direct status updates (no Modal webhooks)

    Args:
        record_ids: List of record IDs to reject
        clients: Dictionary with airtable client
    """
    airtable_client = clients["airtable"]

    progress_bar = st.progress(0)
    status_text = st.empty()

    for idx, record_id in enumerate(record_ids):
        try:
            status_text.text(f"⏳ Rejecting {idx + 1} of {len(record_ids)}...")

            # Update Airtable status - Modal's cleanup will pick these up
            airtable_client.update_status(record_id, "Rejected")

            progress_bar.progress((idx + 1) / len(record_ids))

        except Exception as e:
            st.error(f"❌ Error rejecting post {record_id}: {str(e)}")

    st.success(
        f"✅ Successfully rejected {len(record_ids)} post(s)! They will be deleted in 7 days."
    )
    st.session_state.batch_selected_posts = set()
    st.rerun()


def handle_bulk_delete(record_ids: List[str], clients: Any) -> None:
    """
    Handle bulk delete operation

    Args:
        record_ids: List of record IDs to delete
        clients: Dictionary with airtable and modal clients
    """
    airtable_client = clients["airtable"]

    progress_bar = st.progress(0)
    status_text = st.empty()

    for idx, record_id in enumerate(record_ids):
        try:
            status_text.text(f"⏳ Deleting {idx + 1} of {len(record_ids)}...")

            # Delete from Airtable
            airtable_client.delete_post(record_id)

            progress_bar.progress((idx + 1) / len(record_ids))

        except Exception as e:
            st.error(f"❌ Error deleting post {record_id}: {str(e)}")

    st.success(f"✅ Successfully deleted {len(record_ids)} post(s)!")
    st.session_state.batch_selected_posts = set()
    st.rerun()
