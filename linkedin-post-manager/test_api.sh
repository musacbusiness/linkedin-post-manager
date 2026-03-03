#!/bin/bash

# Get environment variables
source .env.local

# Test 1: Check if we can fetch posts without auth
echo "=== Test 1: GET /api/posts (no auth) ==="
curl -s -X GET http://localhost:3000/api/posts | jq . 2>/dev/null || echo "Failed or no JSON"

echo ""
echo "=== Test 2: Check Supabase connection ==="
curl -s -X GET \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/posts?select=*" | jq . 2>/dev/null | head -50
