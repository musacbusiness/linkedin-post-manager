"""
LinkedIn Post Manager - Streamlit Frontend
Main application entry point for managing LinkedIn posts
Replaces Airtable UI with event-driven architecture
"""

import streamlit as st
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import validate_config, POST_STATUSES
from utils.airtable_client import AirtableClient
from utils.modal_client import ModalClient
from components.post_table import (
    render_post_table,
    create_status_filter,
    create_search_box,
    filter_posts,
)

# Page configuration
st.set_page_config(
    page_title="LinkedIn Post Manager",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        color: #0A66C2;
        margin-bottom: 30px;
    }
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
    }
    .metric-card {
        background-color: #F3F2EF;
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
    }
    .success-action {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 8px 12px;
        border-radius: 4px;
        margin: 4px 0;
    }
    .error-action {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 8px 12px;
        border-radius: 4px;
        margin: 4px 0;
    }
    .action-button {
        font-weight: bold;
        border-radius: 6px;
        padding: 8px 16px;
        margin: 4px 0;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def init_clients():
    """Initialize API clients"""
    return {
        "airtable": AirtableClient(),
        "modal": ModalClient(),
    }


def display_header():
    """Display app header with title and subtitle"""
    st.markdown("<h1 class='main-header'>📱 LinkedIn Post Manager</h1>", unsafe_allow_html=True)
    st.write("Event-driven content management with real-time Modal integration")


def display_quick_stats(posts):
    """Display quick stats about posts"""
    if not posts:
        return

    # Count posts by status
    stats = {}
    for post in posts:
        status = post.get("fields", {}).get("Status", "Unknown")
        stats[status] = stats.get(status, 0) + 1

    # Display metrics
    cols = st.columns(len(stats))
    for idx, (status, count) in enumerate(stats.items()):
        with cols[idx % len(cols)]:
            st.metric(label=status, value=count)


def display_posts_table(posts, clients):
    """Display main posts table with filters and event-driven actions"""
    st.subheader("📊 Posts Overview")

    # Filters
    col1, col2 = st.columns([1, 2])
    with col1:
        status_filter = create_status_filter()
    with col2:
        search_query = create_search_box()

    # Filter posts
    filtered_posts = filter_posts(posts, search_query, status_filter)

    # Display posts with action buttons
    if filtered_posts:
        from components.post_table import format_date

        st.info(f"Showing {len(filtered_posts)} of {len(posts)} posts")

        # Display each post as an interactive row
        for post in filtered_posts:
            fields = post.get("fields", {})
            record_id = post.get("id", "")
            title = fields.get("Title", "Untitled")[:60]
            status = fields.get("Status", "Unknown")
            content_preview = fields.get("Post Content", "")[:80] + "..."

            # Create expandable post row
            with st.expander(f"📄 {title} • {status}"):
                col1, col2, col3 = st.columns([2, 1, 1])

                # Content section
                with col1:
                    st.write("**Status:**", status)
                    st.write("**Created:**", format_date(fields.get("Created")))
                    st.write("**Scheduled:**", format_date(fields.get("Scheduled Time")))
                    st.write("**Content Preview:**")
                    st.write(fields.get("Post Content", ""))

                # Image section
                with col2:
                    if fields.get("Image URL"):
                        st.image(fields.get("Image URL"), width=200)

                # Actions section
                with col3:
                    st.write("**Actions:**")

                    # Approve button (only for Draft posts)
                    if status == "Draft":
                        if st.button("✅ Approve", key=f"approve_{record_id}", use_container_width=True):
                            handle_approve_action(record_id, clients)

                    # Reject button (only for Draft/Pending posts)
                    if status in ["Draft", "Pending Review"]:
                        if st.button("❌ Reject", key=f"reject_{record_id}", use_container_width=True):
                            handle_reject_action(record_id, clients)
    else:
        st.warning("No posts match the selected filters")


def handle_approve_action(record_id: str, clients):
    """Handle approve button action with event-driven Modal trigger"""
    airtable_client = clients["airtable"]
    modal_client = clients["modal"]

    with st.spinner("⏳ Approving post..."):
        try:
            # Step 1: Update Airtable status
            airtable_client.update_status(record_id, "Approved - Ready to Schedule")
            st.success("✅ Airtable updated: Status → Approved")

            # Step 2: Trigger Modal webhook for scheduling
            modal_response = modal_client.trigger_scheduling(record_id)

            if modal_response.get("success"):
                st.success("✅ Modal webhook triggered: Scheduling in progress")
                st.info(f"Post will be scheduled shortly. Check back in a moment!")
            else:
                st.warning(f"⚠️ Modal webhook encountered an issue: {modal_response.get('error')}")

        except Exception as e:
            st.error(f"❌ Error approving post: {str(e)}")


def handle_reject_action(record_id: str, clients):
    """Handle reject button action with event-driven Modal trigger"""
    airtable_client = clients["airtable"]
    modal_client = clients["modal"]

    with st.spinner("⏳ Rejecting post..."):
        try:
            # Step 1: Update Airtable status
            airtable_client.update_status(record_id, "Rejected")
            st.success("✅ Airtable updated: Status → Rejected")

            # Step 2: Trigger Modal webhook for rejection handling
            modal_response = modal_client.trigger_rejection(record_id)

            if modal_response.get("success"):
                st.success("✅ Modal webhook triggered: Post will be deleted in 7 days")
            else:
                st.warning(f"⚠️ Modal webhook encountered an issue: {modal_response.get('error')}")

        except Exception as e:
            st.error(f"❌ Error rejecting post: {str(e)}")


def display_quick_actions(clients):
    """Display quick action buttons"""
    st.subheader("⚡ Quick Actions")

    cols = st.columns(4)

    with cols[0]:
        if st.button("✅ Approve Selected", use_container_width=True):
            st.info("Coming in Phase 2: Select posts and approve in bulk")

    with cols[1]:
        if st.button("🖼️ Generate Images", use_container_width=True):
            st.info("Coming in Phase 2: Trigger image generation for pending posts")

    with cols[2]:
        if st.button("📅 View Calendar", use_container_width=True):
            st.info("Coming in Phase 2: Visual calendar view of scheduled posts")

    with cols[3]:
        if st.button("📊 View Analytics", use_container_width=True):
            st.info("Coming in Phase 3: Analytics dashboard with metrics")


def display_api_status(clients):
    """Display status of API connections"""
    with st.sidebar:
        st.subheader("🔌 API Status")

        # Airtable status
        try:
            airtable_status = clients["airtable"].get_posts_count()
            st.success(f"✅ Airtable: {airtable_status} posts")
        except Exception as e:
            st.error(f"❌ Airtable: {str(e)[:50]}")

        # Modal status
        modal_health = clients["modal"].health_check()
        if modal_health["success"]:
            st.success("✅ Modal: Webhooks accessible")
        else:
            st.error(f"❌ Modal: {modal_health.get('message', 'Not accessible')[:50]}")


def display_sidebar_info():
    """Display information in sidebar"""
    with st.sidebar:
        st.markdown("---")
        st.subheader("📖 About This App")
        st.write("""
        This is the new Streamlit-based frontend for managing LinkedIn posts.

        **Features:**
        - 📊 Real-time post management
        - ⚡ Event-driven Modal integration
        - 🎯 One-click approvals and actions
        - 📱 Mobile-responsive design

        **Architecture:**
        - Streamlit → Airtable API → Modal → Make.com → LinkedIn
        """)

        st.markdown("---")
        st.subheader("🚀 Deployment Info")
        st.write(f"""
        **Environment:** {os.getenv('STREAMLIT_ENV', 'Local')}
        **Version:** 0.1.0-alpha
        """)


def main():
    """Main application"""
    # Validate configuration
    if not validate_config():
        st.error("❌ Missing required configuration. Check environment variables.")
        st.stop()

    # Initialize clients
    clients = init_clients()

    # Display header
    display_header()

    # Load posts
    try:
        posts = clients["airtable"].get_all_posts()
    except Exception as e:
        st.error(f"Failed to load posts: {e}")
        st.stop()

    # Display quick stats
    display_quick_stats(posts)

    # Display main posts table
    display_posts_table(posts, clients)

    # Display quick actions
    display_quick_actions(clients)

    # Display API status
    display_api_status(clients)

    # Display sidebar info
    display_sidebar_info()

    # Footer
    st.markdown("---")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.write("✅ **Phase 1:** Foundation")
    with col2:
        st.write("🔄 **Phase 2:** Event-driven actions")
    with col3:
        st.write("📊 **Phase 3:** Advanced features")
    with col4:
        st.write("✨ **Phase 4:** Polish")


if __name__ == "__main__":
    main()
