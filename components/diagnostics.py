"""
Diagnostics Component
Tests and verifies system connections
"""

import streamlit as st
import requests


def render_diagnostics(clients) -> None:
    """
    Render system diagnostics panel

    Args:
        clients: Dictionary with airtable_client and modal_client
    """
    try:
        modal_client = clients["modal"]
        airtable_client = clients["airtable"]

        # Show configuration first
        st.write("**Modal Webhook URL:**")
        st.code(modal_client.base_url)

        st.write("**Endpoints:**")
        st.write(f"- Health: `{modal_client.base_url}/health`")
        st.write(f"- Schedule: `{modal_client.base_url}/schedule`")
        st.write(f"- Image: `{modal_client.base_url}/generate-image`")
        st.write(f"- Revise: `{modal_client.base_url}/revise`")
        st.write(f"- Reject: `{modal_client.base_url}/reject`")

        st.divider()

        # Test buttons
        col1, col2 = st.columns(2)

        with col1:
            if st.button("🏥 Test Health Check"):
                try:
                    response = requests.get(
                        f"{modal_client.base_url}/health",
                        timeout=5
                    )
                    st.write(f"**Status:** {response.status_code}")
                    if response.ok:
                        st.success("✅ Webhooks are live!")
                        st.json(response.json())
                    else:
                        st.error(f"❌ Error: {response.text}")
                except Exception as e:
                    st.error(f"❌ Connection error: {str(e)}")

        with col2:
            if st.button("🖼️ Test Image Endpoint"):
                try:
                    response = requests.post(
                        f"{modal_client.base_url}/generate-image",
                        json={"record_id": "test"},
                        timeout=5
                    )
                    st.write(f"**Status:** {response.status_code}")
                    if response.status_code == 404:
                        st.error("❌ Endpoint not found - may not be deployed")
                    elif response.status_code == 500:
                        st.error("❌ Server error - function crashed")
                    else:
                        st.info(f"Response: {response.text[:100]}")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

        st.divider()
        st.write("**Airtable Status:**")
        try:
            count = airtable_client.get_posts_count()
            st.success(f"✅ Connected - {count} posts")
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")

    except Exception as e:
        st.error(f"Error initializing diagnostics: {str(e)}")
