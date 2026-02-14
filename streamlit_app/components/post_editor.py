"""
Full-Page Post Editor Component
Displays a post in full-page edit mode with back button
"""

import streamlit as st
from datetime import datetime
from typing import Dict, Optional
import requests
from io import BytesIO


def format_date(date_str: Optional[str]) -> str:
    """Format ISO datetime string to readable format"""
    if not date_str:
        return "—"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y %I:%M %p")
    except:
        return date_str


def render_post_editor(post: Dict, clients: Dict = None) -> None:
    """
    Render a full-page post editor with back button

    Args:
        post: Post data dictionary
        clients: Dictionary of API clients (supabase, modal, etc.)
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")

    # Header with back button
    col_back, col_title = st.columns([0.1, 0.9])
    with col_back:
        if st.button("← Back", key=f"back_editor_{record_id}", help="Return to posts"):
            st.session_state["editing_post"] = None
            st.rerun()

    with col_title:
        st.title("✏️ Edit Post")

    st.divider()

    # Main content area
    col_image, col_form = st.columns([1.2, 1.8])

    with col_image:
        st.markdown("### 📸 Post Image")

        image_url = fields.get("Image URL")
        if image_url:
            try:
                st.image(image_url, use_column_width=True)
            except:
                st.info("📸 Image unavailable")
        else:
            st.info("No image yet")

        st.divider()

        # Show appropriate button text based on whether image exists
        button_text = "🎨 Regenerate Image" if image_url else "🎨 Generate Image"
        if st.button(button_text, key=f"regen_img_full_{record_id}", use_container_width=True):
            if clients and "replicate" in clients:
                try:
                    # Get image prompt from post or generate from title/content
                    image_prompt = fields.get("Image Prompt", "")
                    if not image_prompt:
                        # Generate a prompt from title and content
                        title = fields.get("Title", "LinkedIn Post")
                        content_preview = fields.get("Post Content", "")[:100]
                        image_prompt = f"Professional LinkedIn post image for: {title}. {content_preview}"

                    with st.spinner("🎨 Generating image... This may take a minute"):
                        result = clients["replicate"].generate_image(image_prompt)

                    if result.get("success"):
                        replicate_url = result.get("image_url")
                        # Ensure URL is a string (not FileOutput object)
                        replicate_url = str(replicate_url)

                        # Download image from Replicate and upload to Supabase Storage
                        try:
                            with st.spinner("💾 Uploading image to storage..."):
                                # Download image from Replicate URL
                                print(f"[DEBUG] Downloading image from: {replicate_url[:50]}...")
                                img_response = requests.get(replicate_url, timeout=30)
                                print(f"[DEBUG] Download response status: {img_response.status_code}")

                                if img_response.status_code != 200:
                                    raise Exception(f"Failed to download image from Replicate: HTTP {img_response.status_code}")

                                image_bytes = img_response.content
                                print(f"[DEBUG] Downloaded {len(image_bytes)} bytes")

                                if not image_bytes or len(image_bytes) == 0:
                                    raise Exception("Downloaded image has no data (0 bytes)")

                                # Generate filename based on timestamp
                                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                filename = f"{timestamp}_{record_id[:8]}.jpg"
                                print(f"[DEBUG] Generated filename: {filename}")

                                # Upload to Supabase Storage
                                print(f"[DEBUG] Calling upload_image_to_storage()...")
                                storage_result = clients["supabase"].upload_image_to_storage(image_bytes, filename)
                                print(f"[DEBUG] Storage result: {storage_result}")

                                if storage_result.get("success"):
                                    storage_url = storage_result.get("url")
                                    final_url = storage_url
                                    success_msg = "✅ Image generated and stored in Supabase Storage!"
                                    upload_failed = False
                                    print(f"[DEBUG] Storage upload succeeded: {final_url}")
                                else:
                                    # Fallback: use Replicate URL but show warning
                                    error_msg = storage_result.get('error', 'Unknown error')
                                    print(f"[DEBUG] Storage upload FAILED: {error_msg}")
                                    st.divider()
                                    st.error(f"❌ Storage upload failed")
                                    st.error(f"Error: {error_msg}")
                                    st.error(f"Full details: {storage_result}")
                                    st.divider()
                                    st.warning("Using temporary Replicate URL as fallback (will expire in ~7 days)")
                                    final_url = replicate_url
                                    success_msg = "Image generated (using temporary URL)"
                                    upload_failed = True

                                # Save the image URL to database
                                print(f"[DEBUG] Updating database with image URL: {final_url}")
                                response = clients["supabase"].client.table("posts").update({
                                    "image_url": final_url,
                                    "image_prompt": image_prompt,
                                    "updated_at": datetime.now().isoformat()
                                }).eq("id", record_id).execute()
                                print(f"[DEBUG] Database update response: {response}")

                                st.divider()
                                st.success(success_msg)
                                st.info("📸 Image URL:")
                                st.code(final_url, language="url")
                                st.divider()

                                # Only rerun if upload succeeded (no persistent error to show)
                                if not upload_failed:
                                    print(f"[DEBUG] Upload succeeded, calling st.rerun()")
                                    st.rerun()
                                else:
                                    print(f"[DEBUG] Upload failed, NOT calling st.rerun()")
                        except Exception as e:
                            print(f"[DEBUG] EXCEPTION in image upload block: {str(e)}")
                            import traceback
                            error_trace = traceback.format_exc()
                            print(f"[DEBUG] Traceback: {error_trace}")
                            st.divider()
                            st.error(f"Error saving image: {str(e)}")
                            st.code(error_trace)
                            st.divider()
                    else:
                        st.error(f"Image generation failed: {result.get('error', 'Unknown error')}")

                except Exception as e:
                    st.error(f"Error generating image: {str(e)}")
            else:
                st.error("❌ Replicate client not available")

        st.divider()

        # Display saved image URL
        if image_url:
            st.markdown("### 🔗 Image URL")
            st.code(image_url, language="url")
            st.caption("This URL is saved in your database and will be used for the LinkedIn post")

    with col_form:
        st.markdown("### 📝 Content")

        # Title input
        edited_title = st.text_input(
            "Post Title",
            value=fields.get("Title", ""),
            placeholder="Enter post title...",
            key=f"title_input_full_{record_id}"
        )

        # Content textarea
        edited_content = st.text_area(
            "Post Content",
            value=fields.get("Post Content", ""),
            height=300,
            placeholder="Enter post content...",
            key=f"content_input_full_{record_id}"
        )

        # Character count
        char_count = len(edited_content)
        max_chars = 3000
        st.caption(f"📊 {char_count} / {max_chars} characters")

        if char_count > max_chars:
            st.warning(f"⚠️ Content exceeds recommended limit by {char_count - max_chars} characters")

    st.divider()

    # Action buttons
    st.markdown("### 💾 Actions")
    button_col1, button_col2, button_col3 = st.columns(3)

    with button_col1:
        if st.button("💾 Save Changes", key=f"save_full_{record_id}", use_container_width=True):
            if clients and "supabase" in clients:
                try:
                    response = clients["supabase"].client.table("posts").update({
                        "title": edited_title,
                        "post_content": edited_content,
                        "updated_at": datetime.now().isoformat()
                    }).eq("id", record_id).execute()
                    st.success("✅ Changes saved successfully!")
                    st.session_state["editing_post"] = None
                    st.rerun()
                except Exception as e:
                    st.error(f"Error saving changes: {str(e)}")
            else:
                st.error("❌ Supabase client not available")

    with button_col2:
        if st.button("🔄 Discard Changes", key=f"discard_full_{record_id}", use_container_width=True):
            st.session_state["editing_post"] = None
            st.rerun()

    with button_col3:
        st.empty()

    st.divider()

    # Metadata section
    st.markdown("### 📋 Post Details")

    meta_col1, meta_col2 = st.columns(2)

    with meta_col1:
        status = fields.get("Status", "Unknown")
        st.markdown(f"**Status:** `{status}`")
        created = format_date(fields.get("Created", ""))
        st.markdown(f"**Created:** {created}")

    with meta_col2:
        scheduled_time = fields.get("Scheduled Time")
        if scheduled_time:
            scheduled = format_date(scheduled_time)
            st.markdown(f"**Scheduled:** {scheduled}")
        st.markdown(f"**ID:** `{record_id}`")
