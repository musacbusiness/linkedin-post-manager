"""
Revision Interface Component
Allows requesting AI revisions to posts with live status tracking
"""

import streamlit as st
import time
from typing import Dict, Any


def render_revision_interface(post: Dict[str, Any], clients) -> None:
    """
    Render revision request interface

    Args:
        post: Post record from Airtable
        clients: Dictionary with airtable_client and modal_client
    """
    fields = post.get("fields", {})
    record_id = post.get("id", "")
    current_status = fields.get("Status", "Unknown")

    st.subheader("🔄 Request Revision")

    # Show revision history if available
    notes = fields.get("Notes", "")
    if notes:
        st.write("**Recent Changes:**")
        st.info(notes)

    # Revision form
    with st.form(key=f"revision_form_{record_id}"):
        st.write("**What would you like to change?**")

        # Revision prompt
        revision_prompt = st.text_area(
            "Describe the changes you want:",
            placeholder="e.g., 'Make the hook more engaging' or 'Use shorter sentences'",
            height=100,
            help="Be specific about what changes you'd like the AI to make"
        )

        # Revision type
        revision_type = st.radio(
            "What should be revised?",
            ["Post Only", "Image Only", "Both"],
            horizontal=True,
            help="Choose whether to revise just the text, regenerate the image, or both"
        )

        # Submit button
        col1, col2 = st.columns(2)

        with col1:
            submit = st.form_submit_button("🚀 Submit Revision", use_container_width=True)

        with col2:
            st.form_submit_button("❌ Cancel", use_container_width=True)

        if submit and revision_prompt.strip():
            handle_revision_request(
                record_id,
                revision_prompt,
                revision_type,
                clients
            )


def handle_revision_request(
    record_id: str,
    prompt: str,
    revision_type: str,
    clients
) -> None:
    """
    Handle revision request submission

    Args:
        record_id: Airtable record ID
        prompt: Revision prompt
        revision_type: Type of revision
        clients: API clients
    """
    airtable_client = clients["airtable"]
    modal_client = clients["modal"]

    with st.spinner("⏳ Processing revision... (10-20 seconds)"):
        try:
            # Step 1: Save revision request to Airtable
            airtable_client.request_revision(record_id, prompt, revision_type)
            st.success("✅ Airtable updated: Revision prompt saved")

            # Step 2: Trigger Modal webhook
            response = modal_client.trigger_revision(record_id)

            if response.get("success"):
                st.success("✅ Modal webhook triggered: AI is working on your revision")
                st.info("Your post will be updated with the requested changes. Refresh in a moment to see the changes!")

                # Show what was changed
                if "changes" in response.get("data", {}):
                    st.write("**Changes Applied:**")
                    st.write(response["data"]["changes"])
            else:
                st.warning(f"⚠️ Revision processing issue: {response.get('error')}")

        except Exception as e:
            st.error(f"❌ Error submitting revision: {str(e)}")


def display_revision_status(post: Dict[str, Any]) -> None:
    """
    Display current revision status

    Args:
        post: Post record from Airtable
    """
    fields = post.get("fields", {})
    revision_prompt = fields.get("Revision Prompt", "")
    status = fields.get("Status", "Unknown")

    if revision_prompt:
        st.warning("🔄 Revision in progress...")
        st.write(f"**Requested:** {revision_prompt}")
        st.write(f"**Status:** {status}")
    else:
        st.info("✅ No pending revisions")


def show_revision_history(post: Dict[str, Any]) -> None:
    """
    Show revision history from Notes field

    Args:
        post: Post record from Airtable
    """
    fields = post.get("fields", {})
    notes = fields.get("Notes", "")

    if notes:
        st.write("**Revision History:**")
        with st.expander("View previous changes"):
            st.text(notes)
    else:
        st.write("No revision history yet")
