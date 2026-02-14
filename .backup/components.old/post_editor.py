"""
Post Editor Component
Allows editing post content and generating images with direct Replicate API
"""

import streamlit as st
from typing import Dict, Any
from utils.direct_processors import generate_image_from_post
import requests
from io import BytesIO


def _download_and_cache_image(image_url: str, cache_key: str) -> bytes:
    """Download and cache image in session state"""
    try:
        if cache_key not in st.session_state:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            st.session_state[cache_key] = response.content
        return st.session_state[cache_key]
    except Exception as e:
        st.warning(f"Could not cache image: {str(e)[:50]}")
        return None


def _display_image_with_fallback(image_url: str, caption: str = "", width: int = 400):
    """Display image with multiple fallback methods"""
    if not image_url:
        return

    # Try method 1: Download and display from cache
    try:
        cache_key = f"image_cache_{image_url.split('/')[-1]}"
        image_data = _download_and_cache_image(image_url, cache_key)
        if image_data:
            st.image(image_data, caption=caption, width=width, use_container_width=False)
            return
    except Exception as e:
        pass

    # Try method 2: Display directly from URL
    try:
        st.image(image_url, caption=caption, width=width, use_container_width=False)
        return
    except Exception as e:
        pass

    # Fallback: Show link
    st.warning("⚠️ Image could not be displayed, but it exists:")
    st.write(f"[🔗 View Image in Browser]({image_url})")


def render_post_editor(post: Dict[str, Any], clients) -> bool:
    """
    Render post editor interface for editing and generating images

    Args:
        post: Post record from Airtable
        clients: Dictionary with airtable_client and modal_client

    Returns:
        True if changes were saved, False otherwise
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    st.subheader("✏️ Edit Post")

    # Create tabs for organization
    edit_tab, image_tab = st.tabs(["📝 Content", "🖼️ Image"])

    # CONTENT TAB
    with edit_tab:
        # Create form for editing
        with st.form(key=f"edit_form_{record_id}"):
            # Title field
            title = st.text_input(
                "Post Title:",
                value=fields.get("Title", ""),
                help="The main heading for your post"
            )

            # Content field
            content = st.text_area(
                "Post Content:",
                value=fields.get("Post Content", ""),
                height=250,
                help="Main body text for your post"
            )

            # Form buttons
            col1, col2 = st.columns(2)

            with col1:
                submit_button = st.form_submit_button("💾 Save Changes", use_container_width=True)

            with col2:
                st.form_submit_button("❌ Cancel", use_container_width=True)

            # Handle save
            if submit_button:
                airtable_client = clients["airtable"]

                update_fields = {
                    "Title": title,
                    "Post Content": content,
                }

                try:
                    with st.spinner("💾 Saving changes..."):
                        airtable_client.update_post(record_id, update_fields)
                    st.success("✅ Post updated successfully!")
                    return True
                except Exception as e:
                    st.error(f"❌ Error saving post: {str(e)}")
                    return False

    # IMAGE TAB
    with image_tab:
        current_image_url = fields.get("Image URL", "")

        # Display current image
        st.write("**Current Image:**")
        if current_image_url:
            _display_image_with_fallback(current_image_url, caption="Current Image", width=400)
        else:
            st.info("No image yet. Generate one below! 👇")

        st.divider()

        # Image generation section
        st.write("**Generate New Image:**")

        col1, col2 = st.columns([2, 1])

        with col1:
            custom_prompt = st.text_input(
                "Custom Image Prompt (optional)",
                placeholder="Leave empty to use post content as prompt",
                help="Describe what image you want to generate"
            )

        with col2:
            generate_button = st.button("🖼️ Generate Image", use_container_width=True, key=f"gen_btn_{record_id}")

        # Handle image generation
        if generate_button:
            airtable_client = clients["airtable"]

            try:
                with st.spinner("⏳ Generating image... (30-60 seconds)"):
                    # If custom prompt provided, we need to handle it differently
                    if custom_prompt:
                        # For custom prompts, we'll call the Claude client to create a prompt
                        from utils.direct_processors import ReplicateClient

                        replicate = ReplicateClient()
                        image_url = replicate.generate_image(custom_prompt)

                        if image_url:
                            # Update Airtable with new image
                            airtable_client.update_post(record_id, {
                                "Image URL": image_url,
                                "Status": "Pending Review"
                            })
                            st.success("✅ Image generated successfully!")
                            _display_image_with_fallback(image_url, caption="Generated Image", width=400)
                        else:
                            st.error("❌ Failed to generate image")
                    else:
                        # Use default method (post content)
                        response = generate_image_from_post(airtable_client, record_id)

                        if response.get("success"):
                            st.success("✅ Image generated successfully!")
                            _display_image_with_fallback(response.get("image_url"), caption="Generated Image", width=400)
                        else:
                            st.error(f"❌ Image generation failed: {response.get('error')}")
            except Exception as e:
                st.error(f"❌ Error generating image: {str(e)}")
                with st.expander("🔧 Debug Info"):
                    st.write(f"**Error Details:** {str(e)}")
                    st.write(f"**Record ID:** {record_id}")


def render_quick_editor_modal(post: Dict[str, Any], clients):
    """
    Quick inline editor for rapid edits

    Args:
        post: Post record from Airtable
        clients: Dictionary with airtable_client and modal_client
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    col1, col2 = st.columns([3, 1])

    with col1:
        new_content = st.text_area(
            f"Edit: {fields.get('Title', 'Post')}",
            value=fields.get("Post Content", ""),
            height=150,
            key=f"quick_edit_{record_id}"
        )

    with col2:
        if st.button("Save", key=f"quick_save_{record_id}", use_container_width=True):
            try:
                clients["airtable"].update_post(record_id, {"Post Content": new_content})
                st.success("✅ Saved!")
            except Exception as e:
                st.error(f"Error: {str(e)}")
