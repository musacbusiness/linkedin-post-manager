"""
LinkedIn Post Manager - Streamlit Frontend
Main application entry point for managing LinkedIn posts
Sidebar navigation with 4 sections: Dashboard, Posts, Calendar, System Health
"""

import streamlit as st
import sys
import os
import json
from pathlib import Path
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))  # Add grandparent for execution module

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
    """Initialize API clients (cached for session)

    Version: 4 (flux-schnell model for testing)
    """
    clients = {
        "supabase": SupabaseClient(),
        "modal": ModalClient(),
    }

    # Try to initialize Replicate (optional - only if API token is set)
    try:
        from utils.replicate_client import ReplicateClient
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

    # Check if we're creating a new post - if so, show creation form
    if "creating_post" in st.session_state and st.session_state["creating_post"]:
        render_create_post_form(clients)
        return

    # Check if we're AI generating a post - if so, show generation form
    if "ai_generating_post" in st.session_state and st.session_state["ai_generating_post"]:
        render_ai_generate_post_form(clients)
        return

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

    # New Post button at the top
    col1, col2, col3 = st.columns([2.5, 1, 0.8])
    with col1:
        st.write("")  # Spacing
    with col2:
        st.write("")  # Spacing
    with col3:
        if st.button("➕ New Post", key="new_post_btn", use_container_width=True):
            st.session_state["post_creation_choice"] = True
            st.rerun()

    st.divider()

    # Show post creation choice modal if button was clicked
    if "post_creation_choice" in st.session_state and st.session_state["post_creation_choice"]:
        render_post_creation_choice_modal()
        return

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


def render_post_creation_choice_modal():
    """Render a modal to choose between manual creation or AI generation"""
    st.markdown("### 📌 Create New Post")
    st.write("How would you like to create your post?")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### ✍️ Create Manually")
        st.write("Write your own post content with title and optional image prompt.")
        if st.button("📝 Manual Creation", key="choice_manual", use_container_width=True):
            st.session_state["post_creation_choice"] = False
            st.session_state["creating_post"] = True
            st.rerun()

    with col2:
        st.markdown("#### 🤖 AI Generation")
        st.write("Let AI automatically generate a post using the 7-stage pipeline.")
        if st.button("🚀 AI Generate", key="choice_ai", use_container_width=True):
            st.session_state["post_creation_choice"] = False
            st.session_state["ai_generating_post"] = True
            st.rerun()

    st.divider()

    if st.button("← Cancel", key="choice_cancel", use_container_width=True):
        st.session_state["post_creation_choice"] = False
        st.rerun()


def render_create_post_form(clients):
    """Render a form to create a new post manually"""
    col_back, col_title = st.columns([0.1, 0.9])
    with col_back:
        if st.button("← Back", key="back_create_post", help="Return to posts"):
            st.session_state["creating_post"] = False
            st.rerun()

    with col_title:
        st.title("✏️ Create New Post")

    st.divider()

    # Create form columns
    col1, col2 = st.columns([1.2, 1.8])

    with col1:
        st.markdown("### 📸 Post Image (Optional)")
        st.info("You can add an image after saving the post, or during editing")

    with col2:
        st.markdown("### 📝 Post Content")

        # Title input
        post_title = st.text_input(
            "Post Title",
            placeholder="Enter post title...",
            key="create_post_title"
        )

        # Content textarea
        post_content = st.text_area(
            "Post Content",
            value="",
            height=300,
            placeholder="Enter post content...",
            key="create_post_content"
        )

        # Character count
        char_count = len(post_content)
        max_chars = 3000
        st.caption(f"📊 {char_count} / {max_chars} characters")

        if char_count > max_chars:
            st.warning(f"⚠️ Content exceeds recommended limit by {char_count - max_chars} characters")

        st.divider()

        # Image prompt textarea
        st.markdown("**🎨 Image Prompt (Optional)**")
        image_prompt = st.text_area(
            "Image Prompt",
            value="",
            height=120,
            placeholder="Enter image prompt for AI image generation (used by Stable Diffusion)...",
            key="create_post_image_prompt",
            label_visibility="collapsed"
        )

    st.divider()

    # Action buttons
    st.markdown("### 💾 Actions")
    button_col1, button_col2, button_col3 = st.columns(3)

    with button_col1:
        if st.button("💾 Create Post", key="save_new_post", use_container_width=True):
            if not post_title or not post_content:
                st.error("❌ Post title and content are required")
            else:
                try:
                    from datetime import datetime

                    # Save new post to Supabase
                    supabase = clients["supabase"]
                    response = supabase.client.table("posts").insert({
                        "title": post_title[:200],
                        "post_content": post_content,
                        "image_prompt": image_prompt if image_prompt else None,
                        "status": "Pending Review",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }).execute()

                    if response.data:
                        st.success("✅ Post created successfully!")
                        st.session_state["creating_post"] = False
                        st.rerun()
                    else:
                        st.error("❌ Failed to create post")
                except Exception as e:
                    st.error(f"❌ Error creating post: {str(e)}")

    with button_col2:
        if st.button("❌ Discard", key="discard_new_post", use_container_width=True):
            st.session_state["creating_post"] = False
            st.rerun()

    with button_col3:
        st.empty()

    st.divider()

    # Info section
    st.markdown("### ℹ️ Tips")
    st.info(
        "💡 **Best Practices**:\n\n"
        "• Keep posts between 1,300-1,900 characters for optimal LinkedIn engagement\n"
        "• Start with a compelling hook (first 210 characters)\n"
        "• Use line breaks and bullet points for readability\n"
        "• End with a question to drive comments\n"
        "• Add 3-5 relevant hashtags\n\n"
        "After creating, you can edit the post to add images or make changes."
    )


def render_ai_generate_post_form(clients):
    """Render a form to AI generate a new post using the pipeline"""
    col_back, col_title = st.columns([0.1, 0.9])
    with col_back:
        if st.button("← Back", key="back_ai_generate_post", help="Return to posts"):
            st.session_state["ai_generating_post"] = False
            st.rerun()

    with col_title:
        st.title("🤖 AI Generate Post")

    st.divider()

    st.markdown("### 🎯 Generation Settings")
    st.write("The AI will generate a LinkedIn post using the 7-stage pipeline.")

    # Optional: Let user specify a topic or let AI choose
    col1, col2 = st.columns([1.5, 1.5])

    with col1:
        topic_input = st.text_input(
            "📌 Topic (Optional)",
            placeholder="Leave blank for AI to choose a topic automatically...",
            key="ai_topic_input",
            help="If specified, AI will generate a post about this topic"
        )

    with col2:
        framework_choice = st.selectbox(
            "🎨 Framework Preference (Optional)",
            ["Auto-Select", "PAS", "AIDA", "VSQ", "SLA", "Storytelling"],
            key="ai_framework_choice",
            help="AI will try to use this framework if compatible with the topic"
        )

    st.divider()

    # Generation info
    with st.expander("ℹ️ How AI Generation Works"):
        st.markdown("""
        The AI uses a 7-stage pipeline to generate high-quality LinkedIn posts:

        1. **Topic Selection** - Chooses a relevant topic (or uses your input)
        2. **Research** - Gathers research and key points
        3. **Framework Selection** - Picks the best writing framework
        4. **Content Generation** - Writes the post (1,300-1,900 characters)
        5. **Image Prompt Generation** - Creates a prompt for image generation
        6. **Quality Control** - Evaluates post against 12 quality criteria
        7. **Root Cause Analysis** - Improves if any criteria aren't met

        Posts are automatically saved with status "Pending Review" for your approval.
        """)

    st.divider()

    # Action buttons
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🚀 Generate Post", key="generate_ai_post", use_container_width=True):
            try:
                with st.spinner("🤖 Generating post... This may take 1-2 minutes"):
                    from execution.post_generation_pipeline import PostGenerationPipeline
                    from datetime import datetime

                    # Initialize pipeline
                    pipeline = PostGenerationPipeline()

                    # Build user profile
                    user_profile = {
                        "expertise": os.getenv("USER_EXPERTISE", "AI automation consultant"),
                        "target_audience": os.getenv("USER_TARGET_AUDIENCE", "small business owners, solopreneurs"),
                        "tone": os.getenv("USER_TONE", "practical, approachable, authentic"),
                        "avoid": os.getenv("USER_AVOID", "jargon, corporate speak, hype").split(","),
                    }

                    # Add topic if specified
                    if topic_input:
                        user_profile["specified_topic"] = topic_input

                    # Add framework preference if not auto-select
                    if framework_choice != "Auto-Select":
                        user_profile["preferred_framework"] = framework_choice.lower()

                    # Generate post
                    result = pipeline.run(user_profile)

                    if result.get("success"):
                        post_data = result.get("data", {})

                        # Save to Supabase
                        supabase = clients["supabase"]
                        response = supabase.client.table("posts").insert({
                            "title": post_data.get("title", "")[:200],
                            "post_content": post_data.get("post_content", ""),
                            "image_prompt": post_data.get("image_prompt", ""),
                            "status": "Pending Review",
                            "generation_metadata": json.dumps(post_data.get("metadata", {})),
                            "created_at": datetime.now().isoformat(),
                            "updated_at": datetime.now().isoformat()
                        }).execute()

                        if response.data:
                            st.success("✅ Post generated and saved successfully!")
                            st.info(
                                f"**Title**: {post_data.get('title', 'N/A')}\n\n"
                                f"**Content**: {post_data.get('post_content', 'N/A')[:300]}...\n\n"
                                f"**Framework**: {post_data.get('metadata', {}).get('framework', 'N/A')}\n\n"
                                f"**Characters**: {post_data.get('metadata', {}).get('character_count', 0)}"
                            )
                            st.session_state["ai_generating_post"] = False
                            st.rerun()
                        else:
                            st.error("❌ Failed to save post to database")
                    else:
                        st.error(f"❌ Generation failed: {result.get('error', 'Unknown error')}")

            except Exception as e:
                st.error(f"❌ Error during generation: {str(e)}")
                st.write("Make sure the post generation pipeline is properly configured.")

    with col2:
        if st.button("❌ Cancel", key="cancel_ai_post", use_container_width=True):
            st.session_state["ai_generating_post"] = False
            st.rerun()

    with col3:
        st.empty()


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
