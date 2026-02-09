"""
LinkedIn Post Manager - Streamlit Frontend
Main application entry point for managing LinkedIn posts
Sidebar navigation with 4 sections: Dashboard, Posts, Calendar, System Health
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
    create_status_filter,
    create_search_box,
    filter_posts,
    format_date,
    render_post_table,
    render_post_row,
)
from components.dashboard import render_dashboard

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
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def init_clients():
    """Initialize API clients (cached for session)"""
    return {
        "supabase": SupabaseClient(),
        "modal": ModalClient(),
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
    st.write("Manage LinkedIn posts efficiently with Supabase and Modal integration")


def render_posts_section(posts, clients):
    """Render the Posts section with filtering and table view"""
    st.title("📝 Posts")

    # Search and filter controls
    col1, col2 = st.columns([2, 1])
    with col1:
        search_query = create_search_box()
    with col2:
        status_filter = create_status_filter()

    st.divider()

    # Filter posts
    filtered_posts = filter_posts(posts, search_query, status_filter)

    if not filtered_posts:
        st.info("No posts match your search or filter criteria")
        return

    st.write(f"**Showing {len(filtered_posts)} of {len(posts)} posts**")

    # Display posts as expandable rows
    for post in filtered_posts:
        render_post_row(post)


def render_calendar_section(posts):
    """Render the Calendar section with basic post schedule view"""
    st.title("📅 Calendar")
    st.write("View posts scheduled by date")
    st.divider()

    if not posts:
        st.info("No posts available")
        return

    # Display posts scheduled for the future
    st.subheader("Scheduled Posts")

    scheduled_posts = [
        p for p in posts
        if p.get("fields", {}).get("Scheduled Time") or p.get("fields", {}).get("Status") == "Approved - Ready to Schedule"
    ]

    if scheduled_posts:
        for post in scheduled_posts:
            fields = post.get("fields", {})
            col1, col2 = st.columns([3, 1])

            with col1:
                title = fields.get("Title", "Untitled")
                scheduled = format_date(fields.get("Scheduled Time", ""))
                status = fields.get("Status", "")
                st.write(f"**{title}**")
                st.caption(f"Scheduled: {scheduled} | Status: {status}")

            with col2:
                if st.button("👁️ View", key=f"view_{post.get('id')}"):
                    st.write(fields.get("Post Content", ""))
    else:
        st.info("No scheduled posts")


def render_system_health_section(clients):
    """Render System Health diagnostics"""
    st.title("⚙️ System Health")
    st.write("Application diagnostics and system information")
    st.divider()

    col1, col2 = st.columns(2)

    # API Status
    with col1:
        st.subheader("🔌 API Connections")

        try:
            supabase_client = clients["supabase"]
            posts = supabase_client.get_all_posts()
            st.success(f"✅ Supabase: Connected ({len(posts)} posts)")
        except Exception as e:
            st.error(f"❌ Supabase: {str(e)[:100]}")

        try:
            modal_client = clients["modal"]
            health = modal_client.health_check()
            if health.get("success"):
                st.success("✅ Modal: Connected")
            else:
                st.warning(f"⚠️ Modal: {health.get('message', 'Not available')}")
        except Exception as e:
            st.error(f"❌ Modal: {str(e)[:100]}")

    # Environment Info
    with col2:
        st.subheader("📊 Environment")
        st.write(f"**Environment:** {os.getenv('STREAMLIT_ENV', 'Local')}")
        st.write(f"**Version:** 0.2.0")
        st.write(f"**Status:** ✅ Running")


def render_sidebar_navigation():
    """Render sidebar navigation and return selected page"""
    with st.sidebar:
        st.title("LinkedIn Post Manager")
        st.divider()

        # Navigation menu
        page = st.radio(
            "Navigation",
            [
                "🏠 Dashboard",
                "📝 Posts",
                "📅 Calendar",
                "⚙️ System Health"
            ],
            label_visibility="collapsed"
        )

        st.divider()

        # Display API status
        with st.expander("🔌 API Status", expanded=False):
            try:
                clients = st.session_state.get("clients")
                if clients:
                    try:
                        posts = clients["supabase"].get_all_posts()
                        st.success(f"✅ Supabase: {len(posts)} posts")
                    except Exception as e:
                        st.error(f"❌ Supabase: {str(e)[:50]}")

                    # Modal status
                    try:
                        modal_health = clients["modal"].health_check()
                        if modal_health.get("success"):
                            st.success("✅ Modal: Operational")
                        else:
                            st.error(f"❌ Modal: {modal_health.get('message', 'Not accessible')[:50]}")
                    except:
                        st.warning("Modal status unavailable")
            except Exception:
                st.warning("Could not load API status")

    return page


def main():
    """Main application"""
    # Check authentication (if enabled)
    if not check_password():
        st.stop()

    # Validate configuration
    if not validate_config():
        st.error("""
        ❌ **Missing required configuration**

        Please add the following to your Streamlit Cloud Secrets:
        - `SUPABASE_URL` - Your Supabase project URL
        - `SUPABASE_KEY` - Your Supabase anon/public key
        - `MODAL_WEBHOOK_BASE_URL` - Your Modal webhook URL

        **How to add secrets:**
        1. Go to your app settings (⋮ menu → Settings)
        2. Click "Secrets"
        3. Add each variable above
        4. Save and restart the app
        """)
        st.stop()

    # Initialize clients with error handling
    try:
        clients = init_clients()
        # Store clients in session state for sidebar access
        st.session_state["clients"] = clients
    except Exception as e:
        st.error(str(e))
        st.stop()

    # Load posts
    try:
        posts = clients["supabase"].get_all_posts()
    except Exception as e:
        st.error(f"Failed to load posts: {e}")
        st.stop()

    # Display header (on all pages)
    display_header()

    # Render sidebar navigation
    page = render_sidebar_navigation()

    # Route to correct page
    if page == "🏠 Dashboard":
        render_dashboard(posts, clients)

    elif page == "📝 Posts":
        render_posts_section(posts, clients)

    elif page == "📅 Calendar":
        render_calendar_section(posts)

    elif page == "⚙️ System Health":
        render_system_health_section(clients)


if __name__ == "__main__":
    main()
