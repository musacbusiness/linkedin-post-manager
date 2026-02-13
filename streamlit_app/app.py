"""
LinkedIn Post Manager - Streamlit Frontend
Main application entry point for managing LinkedIn posts
Sidebar navigation with 4 sections: Dashboard, Posts, Calendar, System Health
"""

import streamlit as st
import sys
import os
from pathlib import Path
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import validate_config, POST_STATUSES
from utils.supabase_client import SupabaseClient
from utils.modal_client import ModalClient
from utils.replicate_client import ReplicateClient
from components.post_table import (
    create_status_filter,
    create_search_box,
    filter_posts,
    format_date,
    render_post_table,
    render_post_row,
)
from components.post_card import render_posts_grid, render_post_card
from components.post_editor import render_post_editor
from components.dashboard import render_dashboard
from components.calendar_view import render_calendar_view, render_calendar_mini

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
    clients = {
        "supabase": SupabaseClient(),
        "modal": ModalClient(),
    }

    # Try to initialize Replicate (optional - only if API token is set)
    try:
        clients["replicate"] = ReplicateClient()
    except Exception as e:
        print(f"Warning: Replicate client not available: {str(e)}")
        clients["replicate"] = None

    return clients


def initialize_post_state(posts: List[Dict]):
    """Pre-initialize session state for all posts BEFORE rendering widgets"""
    for post in posts:
        record_id = post.get("id", "")
        expand_key = f"expand_{record_id}"
        select_key = f"select_{record_id}"
        action_key = f"action_{record_id}"

        # Initialize keys if they don't exist
        if expand_key not in st.session_state:
            st.session_state[expand_key] = False
        if select_key not in st.session_state:
            st.session_state[select_key] = False
        if action_key not in st.session_state:
            st.session_state[action_key] = None


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
    """Render the Posts section with card grid view and bulk actions"""
    st.title("📝 Posts")

    # Check if we're editing a post - if so, show full-page editor
    if "editing_post" in st.session_state and st.session_state["editing_post"]:
        editing_post_id = st.session_state["editing_post"]
        # Find the post to edit
        post_to_edit = next((p for p in posts if p.get("id") == editing_post_id), None)
        if post_to_edit:
            render_post_editor(post_to_edit, clients)
            return
        else:
            st.error(f"Post {editing_post_id} not found")
            st.session_state["editing_post"] = None
            st.rerun()

    # Pre-initialize session state for ALL posts (before any widget rendering)
    initialize_post_state(posts)

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

    # Bulk action toolbar
    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        select_all = st.checkbox("📋 Select All", key="select_all")
    with col2:
        st.write("")  # spacing
    with col3:
        st.caption(f"Showing {len(filtered_posts)} of {len(posts)} posts")

    st.divider()

    # Render posts as cards
    card_results = render_posts_grid(filtered_posts, clients)

    # Handle bulk actions
    selected_posts = [r for r in card_results if r.get("selected")]
    if selected_posts:
        st.divider()
        col1, col2, col3 = st.columns([1, 1, 2])
        with col1:
            if st.button(f"✅ Approve {len(selected_posts)}", use_container_width=True):
                st.info(f"Would approve {len(selected_posts)} posts")
        with col2:
            if st.button(f"❌ Reject {len(selected_posts)}", use_container_width=True):
                st.info(f"Would reject {len(selected_posts)} posts")

    # Handle individual actions
    for result in card_results:
        if result.get("action"):
            record_id = result.get("record_id")
            action = result.get("action")
            if action == "approve":
                st.success(f"Approved post {record_id}")
            elif action == "reject":
                st.warning(f"Rejected post {record_id}")
            elif action == "edit":
                st.session_state["editing_post"] = record_id
                st.rerun()
            elif action == "expand":
                st.info(f"Expanding post {record_id}")


def render_calendar_section(posts):
    """Render the Calendar section with interactive calendar view"""
    st.title("📅 Calendar")

    if not posts:
        st.info("No posts available")
        return

    # Get only posts with scheduled times
    scheduled_posts = [
        p for p in posts
        if p.get("fields", {}).get("Scheduled Time")
    ]

    if not scheduled_posts:
        st.info("No posts scheduled yet")
        return

    # Display mini calendar overview
    render_calendar_mini(scheduled_posts)

    st.divider()

    # Display interactive date picker and detailed view
    render_calendar_view(scheduled_posts)


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

        try:
            replicate_client = clients.get("replicate")
            if replicate_client:
                health = replicate_client.health_check()
                if health.get("success"):
                    st.success("✅ Replicate: Connected")
                else:
                    st.warning(f"⚠️ Replicate: {health.get('message', 'Not available')}")
            else:
                st.warning("⚠️ Replicate: Not configured")
        except Exception as e:
            st.error(f"❌ Replicate: {str(e)[:100]}")

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

                    # Replicate status
                    try:
                        replicate_client = clients.get("replicate")
                        if replicate_client:
                            replicate_health = replicate_client.health_check()
                            if replicate_health.get("success"):
                                st.success("✅ Replicate: Ready")
                            else:
                                st.warning(f"⚠️ Replicate: {replicate_health.get('message', 'Not accessible')[:50]}")
                        else:
                            st.warning("Replicate: Not configured")
                    except:
                        st.warning("Replicate status unavailable")
            except Exception:
                st.warning("Could not load API status")

    return page


def main():
    """Main application"""
    # Check authentication (if enabled)
    if not check_password():
        st.stop()

    # Reload configuration from Streamlit secrets (in case they were added after initial import)
    try:
        from config import SUPABASE_URL, SUPABASE_KEY
        # Try to reload from secrets in case they were added
        supabase_url = st.secrets.get("SUPABASE_URL", "") or SUPABASE_URL
        supabase_key = st.secrets.get("SUPABASE_KEY", "") or SUPABASE_KEY
    except Exception:
        pass

    # Validate configuration
    if not validate_config():
        st.error("""
        ❌ **Missing required configuration**

        Please add the following to your Streamlit Cloud Secrets:
        - `SUPABASE_URL` - Your Supabase project URL
        - `SUPABASE_KEY` - Your Supabase anon/public key

        **How to add secrets:**
        1. Go to your app settings (⋮ menu → Settings)
        2. Click "Secrets"
        3. Paste your configuration
        4. Save and restart the app

        (MODAL_WEBHOOK_BASE_URL is optional - only needed if using Modal webhooks)
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
