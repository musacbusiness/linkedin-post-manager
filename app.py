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
from utils.supabase_client import SupabaseClient
from utils.modal_client import ModalClient
from components.post_table import (
    render_post_table,
    create_status_filter,
    create_search_box,
    filter_posts,
    format_date,
)
from components.post_editor import render_post_editor
from components.revision_interface import render_revision_interface, display_revision_status
from components.calendar_view import render_calendar_view
from components.batch_operations import render_batch_operations_toolbar
from components.analytics_dashboard import render_analytics_dashboard
from components.advanced_search import render_advanced_search, display_search_results
from components.diagnostics import render_diagnostics

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
    """Initialize API clients (cached for session)"""
    return {
        "airtable": SupabaseClient(),  # Drop-in replacement for Airtable
        "modal": ModalClient(),
    }


@st.cache_data(ttl=30)
def cache_analytics_aggregates(total_posts, status_counts_tuple):
    """Cache analytics calculations for 30 seconds"""
    status_counts = dict(status_counts_tuple)
    return {
        "total": total_posts,
        "status_counts": status_counts,
        "draft": status_counts.get("Draft", 0),
        "pending": status_counts.get("Pending Review", 0),
        "approved": status_counts.get("Approved - Ready to Schedule", 0),
        "scheduled": status_counts.get("Scheduled", 0),
        "posted": status_counts.get("Posted", 0),
        "rejected": status_counts.get("Rejected", 0),
    }


def check_password():
    """Optional: Returns True if authentication is disabled or user entered correct password"""
    # Check if authentication is enabled via environment variable
    app_password = os.getenv("APP_PASSWORD")

    # If no password is set, skip authentication
    if not app_password:
        return True

    # Password authentication enabled
    def password_entered():
        if st.session_state.get("password") == app_password:
            st.session_state["password_correct"] = True
            del st.session_state["password"]
        else:
            st.session_state["password_correct"] = False

    if st.session_state.get("password_correct", False):
        return True

    st.text_input(
        "🔒 Enter app password:",
        type="password",
        on_change=password_entered,
        key="password",
    )

    if "password_correct" in st.session_state and not st.session_state["password_correct"]:
        st.error("❌ Incorrect password")

    return False


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
    """Handle approve button action - Plan B: Direct status update (no Modal webhooks)"""
    airtable_client = clients["airtable"]

    with st.spinner("⏳ Approving post..."):
        try:
            # Update Airtable status to "Approved - Ready to Schedule"
            # Modal's post_scheduler_exact_minute() cron will find this and handle scheduling
            airtable_client.update_status(record_id, "Approved - Ready to Schedule")
            st.success("✅ Post approved! Will be scheduled by the posting system.")
            st.info("Your post is now approved and will be posted on schedule.")

        except Exception as e:
            st.error(f"❌ Error approving post: {str(e)}")


def handle_reject_action(record_id: str, clients):
    """Handle reject button action - Plan B: Direct status update (no Modal webhooks)"""
    airtable_client = clients["airtable"]

    with st.spinner("⏳ Rejecting post..."):
        try:
            # Update Airtable status to "Rejected"
            # Modal's cleanup_scheduled_deletions() cron will handle scheduling deletion
            airtable_client.update_status(record_id, "Rejected")
            st.success("✅ Post rejected and marked for deletion.")
            st.info("This post will be automatically deleted in 7 days.")

        except Exception as e:
            st.error(f"❌ Error rejecting post: {str(e)}")


def display_filtered_posts_with_actions(posts, clients):
    """Display filtered posts with action buttons"""
    if not posts:
        st.warning("No posts to display")
        return

    st.write(f"### Showing {len(posts)} posts")

    # Display each post as an interactive row
    for post in posts:
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
                image_url = fields.get("Image URL")
                if image_url:
                    try:
                        st.image(image_url, width=200, use_container_width=False)
                    except Exception as e:
                        st.warning(f"Could not load image: {str(e)[:50]}...")
                        st.write(f"[View Image]({image_url})" if image_url.startswith("http") else "Invalid image URL")

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


def display_phase2_interface(posts, clients):
    """Display Phase 2/3 interface with tabbed navigation"""
    # Initialize session state for selected post
    if "selected_post_id" not in st.session_state:
        st.session_state.selected_post_id = None

    # Create tabs for different views
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "📋 Posts",
        "✏️ Editor",
        "📅 Calendar",
        "🔄 Revisions",
        "📦 Batch Ops",
        "📊 Analytics"
    ])

    with tab1:
        # Advanced search and filtering
        filtered_posts = render_advanced_search(posts)
        st.divider()

        # Display filtered posts with action buttons
        display_filtered_posts_with_actions(filtered_posts, clients)

    with tab2:
        st.subheader("✏️ Post Editor & Image Generation")
        # Select post to edit
        post_options = {}
        for post in posts:
            title = post.get("fields", {}).get("Title", "Untitled")[:50]
            post_id = post.get("id", "")
            post_options[title] = post_id

        selected_title = st.selectbox(
            "Select a post to edit:",
            list(post_options.keys()),
            help="Choose the post you want to edit or generate an image for"
        )

        if selected_title:
            selected_id = post_options[selected_title]
            selected_post = next((p for p in posts if p.get("id") == selected_id), None)

            if selected_post:
                render_post_editor(selected_post, clients)

    with tab3:
        st.subheader("📅 Posting Schedule")
        render_calendar_view(posts)

    with tab4:
        st.subheader("🔄 Request Revisions")
        # Select post for revision
        post_options = {}
        for post in posts:
            title = post.get("fields", {}).get("Title", "Untitled")[:50]
            status = post.get("fields", {}).get("Status", "")
            post_id = post.get("id", "")
            post_options[f"{title} ({status})"] = post_id

        selected_title = st.selectbox(
            "Select a post to revise:",
            list(post_options.keys()),
            help="Choose the post you want to request revisions for"
        )

        if selected_title:
            selected_id = post_options[selected_title]
            selected_post = next((p for p in posts if p.get("id") == selected_id), None)

            if selected_post:
                # Show current status
                display_revision_status(selected_post)
                st.divider()
                # Show revision form
                render_revision_interface(selected_post, clients)

    with tab5:
        st.subheader("📦 Batch Operations")
        st.write("Select multiple posts and perform bulk actions")
        render_batch_operations_toolbar(posts, clients)

    with tab6:
        st.subheader("📊 Analytics Dashboard")
        render_analytics_dashboard(posts)


def display_api_status(clients):
    """Display status of API connections"""
    with st.sidebar:
        st.subheader("🔌 API Status")

        # Supabase status
        try:
            supabase_status = clients["airtable"].get_posts_count()
            st.success(f"✅ Supabase: {supabase_status} posts")
        except Exception as e:
            st.error(f"❌ Supabase: {str(e)[:50]}")

        # Modal status
        modal_health = clients["modal"].health_check()
        if modal_health["success"]:
            st.success("✅ Modal: Webhooks accessible")
        else:
            st.error(f"❌ Modal: {modal_health.get('message', 'Not accessible')[:50]}")


def display_sidebar_info(clients):
    """Display information in sidebar"""
    with st.sidebar:
        st.markdown("---")

        # Diagnostics section
        with st.expander("🔧 System Diagnostics", expanded=False):
            render_diagnostics(clients)

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
        - Streamlit → Supabase (PostgreSQL) → Modal → Make.com → LinkedIn
        """)

        st.markdown("---")
        st.subheader("🚀 Deployment Info")
        st.write(f"""
        **Environment:** {os.getenv('STREAMLIT_ENV', 'Local')}
        **Version:** 0.1.0-alpha
        """)


def main():
    """Main application"""
    # Check authentication (if enabled)
    if not check_password():
        st.stop()

    # Validate configuration
    if not validate_config():
        st.error("❌ Missing required configuration. Check environment variables.")
        st.stop()

    # Initialize clients with error handling
    try:
        clients = init_clients()
    except Exception as e:
        st.error(str(e))
        st.stop()

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

    # Display Phase 2 interface with all features
    display_phase2_interface(posts, clients)

    # Display API status
    display_api_status(clients)

    # Display sidebar info
    display_sidebar_info(clients)

    # Footer
    st.markdown("---")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.write("✅ **Phase 1:** Foundation")
    with col2:
        st.write("✅ **Phase 2:** Event-driven actions")
    with col3:
        st.write("🔲 **Phase 3:** Advanced features")
    with col4:
        st.write("🔲 **Phase 4:** Polish")

    st.caption("Phase 2 Features: Approve/Reject buttons • Post Editor • Image Generation • Calendar View • Revisions")


if __name__ == "__main__":
    main()
