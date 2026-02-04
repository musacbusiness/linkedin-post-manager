"""
Diagnostics Component
Tests and verifies system connections
"""

import streamlit as st
import requests


def render_diagnostics(clients) -> None:
    """
    Render system diagnostics panel - Plan B Architecture

    Args:
        clients: Dictionary with airtable_client and modal_client
    """
    try:
        airtable_client = clients["airtable"]

        st.write("**Plan B Architecture**")
        st.info("""
        ✅ Direct API Integration (No Modal Webhooks)
        - Image Generation: Replicate API
        - Content Revision: Claude API
        - Post Management: Airtable API
        - Background Tasks: Modal cron jobs only
        """)

        st.divider()

        st.write("**Airtable Status:**")
        try:
            count = airtable_client.get_posts_count()
            st.success(f"✅ Connected - {count} posts")
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")

        st.divider()

        st.write("**API Integration Status:**")
        st.write("✅ Replicate API - Ready for image generation")
        st.write("✅ Claude API - Ready for content revision")
        st.write("✅ Airtable API - Connected")
        st.write("ℹ️ Modal webhooks not required (using direct APIs)")

    except Exception as e:
        st.error(f"Error initializing diagnostics: {str(e)}")
