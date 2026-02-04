"""
Post Editor Component
Allows editing post content and generating images with direct Replicate API
"""

import streamlit as st
from typing import Dict, Any
from utils.direct_processors import generate_image_from_post


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

        # Image URL field
        image_url = st.text_input(
            "Image URL:",
            value=fields.get("Image URL", ""),
            help="URL to the post image (optional)"
        )

        # Image preview
        if image_url:
            try:
                st.image(image_url, width=300, caption="Current Image", use_container_width=False)
            except Exception as e:
                st.warning(f"Could not load image preview")
                if image_url.startswith("http"):
                    st.write(f"[View Image]({image_url})")

        # Form buttons
        col1, col2, col3 = st.columns(3)

        with col1:
            submit_button = st.form_submit_button("💾 Save Changes", use_container_width=True)

        with col2:
            generate_image = st.form_submit_button("🖼️ Generate Image", use_container_width=True)

        with col3:
            st.form_submit_button("❌ Cancel", use_container_width=True)

        # Handle save
        if submit_button:
            airtable_client = clients["airtable"]

            update_fields = {
                "Title": title,
                "Post Content": content,
            }

            if image_url:
                update_fields["Image URL"] = image_url

            try:
                with st.spinner("💾 Saving changes..."):
                    airtable_client.update_post(record_id, update_fields)
                st.success("✅ Post updated successfully!")
                return True
            except Exception as e:
                st.error(f"❌ Error saving post: {str(e)}")
                return False

        # Handle image generation
        if generate_image:
            airtable_client = clients["airtable"]

            try:
                with st.spinner("⏳ Generating image with Replicate API... (30-60 seconds)"):
                    # Call direct Replicate API (no Modal dependency)
                    response = generate_image_from_post(airtable_client, record_id)

                    if response.get("success"):
                        st.success("✅ Image generated successfully!")
                        try:
                            st.image(response.get("image_url"), width=400, caption="Generated Image", use_container_width=False)
                        except Exception as e:
                            st.warning("Image generated but could not display preview")
                            image_url = response.get("image_url")
                            if image_url and image_url.startswith("http"):
                                st.write(f"[View Generated Image]({image_url})")
                    else:
                        st.error(f"❌ Image generation failed")
                        st.error(f"Error: {response.get('error')}")

                        # Debug info
                        with st.expander("🔧 Debug Info"):
                            st.write(f"**Record ID:** {record_id}")
                            st.write(f"**Response:** {response}")
            except Exception as e:
                st.error(f"❌ Error generating image: {str(e)}")


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
