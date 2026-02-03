"""
Diagnostics Component
Tests and verifies system connections
"""

import streamlit as st
import requests
from typing import Dict, Any


def render_diagnostics(clients) -> None:
    """
    Render system diagnostics panel

    Args:
        clients: Dictionary with airtable_client and modal_client
    """
    st.subheader("🔧 System Diagnostics")

    # Test Airtable connection
    st.write("### Airtable Connection")
    col1, col2 = st.columns([1, 1])

    with col1:
        if st.button("Test Airtable", key="test_airtable"):
            try:
                airtable_client = clients["airtable"]
                count = airtable_client.get_posts_count()
                st.success(f"✅ Connected - {count} posts found")
            except Exception as e:
                st.error(f"❌ Failed: {str(e)}")

    # Test Modal connection
    st.write("### Modal Webhook Connection")
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("Test Health Check", key="test_health"):
            try:
                modal_client = clients["modal"]
                response = requests.get(
                    f"{modal_client.base_url}/health",
                    timeout=10
                )
                st.write(f"**Status Code:** {response.status_code}")
                st.write(f"**Response:** {response.json()}")

                if response.status_code == 200:
                    st.success("✅ Modal webhooks accessible")
                else:
                    st.error(f"❌ Unexpected status: {response.status_code}")
            except Exception as e:
                st.error(f"❌ Connection failed: {str(e)}")

    with col2:
        if st.button("Test Schedule Endpoint", key="test_schedule"):
            try:
                modal_client = clients["modal"]
                url = f"{modal_client.base_url}/schedule"
                response = requests.post(
                    url,
                    json={"record_id": "test-record-id"},
                    timeout=10
                )
                st.write(f"**Status Code:** {response.status_code}")
                st.write(f"**Response:** {response.text[:200]}")

                if response.status_code == 200:
                    st.success("✅ Schedule endpoint working")
                else:
                    st.warning(f"⚠️ Status {response.status_code}")
            except Exception as e:
                st.error(f"❌ Failed: {str(e)}")

    with col3:
        if st.button("Test Image Endpoint", key="test_image"):
            try:
                modal_client = clients["modal"]
                url = f"{modal_client.base_url}/generate-image"
                response = requests.post(
                    url,
                    json={"record_id": "test-record-id"},
                    timeout=10
                )
                st.write(f"**Status Code:** {response.status_code}")
                st.write(f"**Response:** {response.text[:200]}")

                if response.status_code == 200:
                    st.success("✅ Image endpoint working")
                else:
                    st.warning(f"⚠️ Status {response.status_code}")
            except Exception as e:
                st.error(f"❌ Failed: {str(e)}")

    # Show configuration
    st.write("### Configuration")
    with st.expander("View Loaded Configuration"):
        try:
            modal_client = clients["modal"]
            st.write(f"**Modal Webhook Base URL:** `{modal_client.base_url}`")

            airtable_client = clients["airtable"]
            st.write(f"**Airtable API URL:** `{airtable_client.api_url}`")

            st.write("**Endpoints being called:**")
            st.write(f"- Schedule: `{modal_client.base_url}/schedule`")
            st.write(f"- Generate Image: `{modal_client.base_url}/generate-image`")
            st.write(f"- Revise: `{modal_client.base_url}/revise`")
            st.write(f"- Reject: `{modal_client.base_url}/reject`")
            st.write(f"- Health: `{modal_client.base_url}/health`")
        except Exception as e:
            st.error(f"Error loading configuration: {str(e)}")
