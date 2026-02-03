# API Reference

Complete technical reference for the LinkedIn Post Manager APIs.

---

## Airtable Client API

### Class: `AirtableClient`

Location: `utils/airtable_client.py`

#### Methods

##### get_all_posts()
```python
def get_all_posts(self, status_filter: Optional[str] = None) -> List[Dict]:
```

**Purpose**: Fetch all posts from Airtable (with 30-second cache)

**Parameters**:
- `status_filter` (str, optional): Filter by status (e.g., "Scheduled")

**Returns**: List of post records

**Raises**: Exception on API error

**Example**:
```python
client = AirtableClient()
all_posts = client.get_all_posts()  # All posts
scheduled = client.get_all_posts(status_filter="Scheduled")  # Scheduled only
```

**Cache**: 30-second TTL

---

##### get_post()
```python
def get_post(self, record_id: str) -> Optional[Dict]:
```

**Purpose**: Get a single post by ID

**Parameters**:
- `record_id` (str): Airtable record ID (e.g., "rec123...")

**Returns**: Post record dict or None if not found

**Example**:
```python
post = client.get_post("rec123456789")
print(post["fields"]["Title"])
```

---

##### update_post()
```python
def update_post(self, record_id: str, fields: Dict[str, Any]) -> Dict:
```

**Purpose**: Update post fields (PATCH operation)

**Parameters**:
- `record_id` (str): Airtable record ID
- `fields` (dict): Fields to update (e.g., {"Title": "New title"})

**Returns**: Updated record

**Raises**: Exception on API error

**Example**:
```python
updated = client.update_post("rec123", {
    "Title": "Updated Title",
    "Post Content": "Updated content"
})
```

**Cache**: Invalidates all caches

---

##### update_status()
```python
def update_status(self, record_id: str, new_status: str) -> Dict:
```

**Purpose**: Update post status field

**Parameters**:
- `record_id` (str): Airtable record ID
- `new_status` (str): New status value

**Valid Statuses**:
- "Draft"
- "Pending Review"
- "Approved - Ready to Schedule"
- "Scheduled"
- "Posted"
- "Rejected"

**Returns**: Updated record

**Example**:
```python
client.update_status("rec123", "Approved - Ready to Schedule")
```

---

##### request_revision()
```python
def request_revision(self, record_id: str, prompt: str,
                    revision_type: str = "Both") -> Dict:
```

**Purpose**: Write revision request to Airtable

**Parameters**:
- `record_id` (str): Airtable record ID
- `prompt` (str): Revision instructions
- `revision_type` (str): "Post Only" / "Image Only" / "Both"

**Returns**: Updated record

**Example**:
```python
client.request_revision(
    "rec123",
    "Make the hook more engaging",
    "Post Only"
)
```

---

##### get_scheduled_posts()
```python
def get_scheduled_posts(self, start_date: datetime,
                       end_date: datetime) -> List[Dict]:
```

**Purpose**: Get posts scheduled within a date range

**Parameters**:
- `start_date` (datetime): Start of date range
- `end_date` (datetime): End of date range

**Returns**: List of scheduled posts

**Cache**: 15-second TTL per date range

**Example**:
```python
from datetime import datetime, timedelta
today = datetime.now()
tomorrow = today + timedelta(days=1)
posts = client.get_scheduled_posts(today, tomorrow)
```

---

##### create_post()
```python
def create_post(self, fields: Dict[str, Any]) -> Dict:
```

**Purpose**: Create a new post record

**Parameters**:
- `fields` (dict): Field values for new post

**Returns**: Created record

**Example**:
```python
post = client.create_post({
    "Title": "New Post",
    "Post Content": "Content here",
    "Status": "Draft"
})
```

---

##### delete_post()
```python
def delete_post(self, record_id: str) -> bool:
```

**Purpose**: Delete a post record

**Parameters**:
- `record_id` (str): Airtable record ID

**Returns**: True if successful

**Example**:
```python
success = client.delete_post("rec123")
```

---

##### get_posts_by_status()
```python
def get_posts_by_status(self, statuses: List[str]) -> List[Dict]:
```

**Purpose**: Get posts matching any of specified statuses

**Parameters**:
- `statuses` (list): List of status values

**Returns**: Matching posts

**Cache**: 15-second TTL

**Example**:
```python
posts = client.get_posts_by_status(["Draft", "Pending Review"])
```

---

##### get_posts_count()
```python
def get_posts_count(self) -> int:
```

**Purpose**: Get total post count

**Parameters**: None

**Returns**: Number of posts

**Example**:
```python
count = client.get_posts_count()  # Returns: 18
```

---

## Modal Client API

### Class: `ModalClient`

Location: `utils/modal_client.py`

#### Methods

##### trigger_image_generation()
```python
def trigger_image_generation(self, record_id: str) -> dict:
```

**Purpose**: Trigger AI image generation via Modal webhook

**Parameters**:
- `record_id` (str): Airtable record ID

**Returns**: `{"success": bool, "data": dict}` or `{"success": False, "error": str}`

**Expected Duration**: 30-60 seconds

**Example**:
```python
modal = ModalClient()
result = modal.trigger_image_generation("rec123")
if result["success"]:
    print("Image generation started")
```

---

##### trigger_scheduling()
```python
def trigger_scheduling(self, record_id: str) -> dict:
```

**Purpose**: Trigger post scheduling via Modal webhook

**Parameters**:
- `record_id` (str): Airtable record ID

**Returns**: `{"success": bool, "data": dict}` or `{"success": False, "error": str}`

**Expected Duration**: 1-2 seconds

**Response Data**:
```json
{
  "success": true,
  "scheduled_time": "2024-12-31T14:09:00Z"
}
```

**Example**:
```python
result = modal.trigger_scheduling("rec123")
if result["success"]:
    print(f"Scheduled for {result['data']['scheduled_time']}")
```

---

##### trigger_revision()
```python
def trigger_revision(self, record_id: str) -> dict:
```

**Purpose**: Trigger content revision via Modal webhook

**Parameters**:
- `record_id` (str): Airtable record ID (must have Revision Prompt set)

**Returns**: `{"success": bool, "data": dict}` or `{"success": False, "error": str}`

**Expected Duration**: 10-20 seconds

**Response Data**:
```json
{
  "success": true,
  "changes": "Updated hook to be more direct"
}
```

**Example**:
```python
result = modal.trigger_revision("rec123")
if result["success"]:
    print(f"Changes: {result['data']['changes']}")
```

---

##### trigger_rejection()
```python
def trigger_rejection(self, record_id: str) -> dict:
```

**Purpose**: Trigger rejection handling via Modal webhook

**Parameters**:
- `record_id` (str): Airtable record ID

**Returns**: `{"success": bool, "data": dict}` or `{"success": False, "error": str}`

**Expected Duration**: 1-2 seconds

**Response Data**:
```json
{
  "success": true,
  "scheduled_deletion": "2025-01-08"
}
```

**Example**:
```python
result = modal.trigger_rejection("rec123")
if result["success"]:
    print(f"Will be deleted on {result['data']['scheduled_deletion']}")
```

---

## Modal Webhook API

### Endpoints

Base URL: `https://musacbusiness--linkedin-automation-streamlit-webhooks.modal.run`

#### POST /schedule

**Purpose**: Schedule an approved post

**Request**:
```json
{
  "record_id": "rec123456789"
}
```

**Response - Success** (HTTP 200):
```json
{
  "success": true,
  "scheduled_time": "2024-12-31T14:09:00Z",
  "time_window": "2 PM UTC"
}
```

**Response - Error** (HTTP 400/500):
```json
{
  "success": false,
  "error": "Record not found or already scheduled"
}
```

---

#### POST /generate-image

**Purpose**: Generate image for post

**Request**:
```json
{
  "record_id": "rec123456789"
}
```

**Response - Success** (HTTP 200):
```json
{
  "success": true,
  "image_url": "https://replicate.com/...",
  "generation_time_seconds": 45
}
```

**Response - Error** (HTTP 400/500):
```json
{
  "success": false,
  "error": "Failed to generate image"
}
```

---

#### POST /revise

**Purpose**: Revise post content

**Request**:
```json
{
  "record_id": "rec123456789"
}
```

**Response - Success** (HTTP 200):
```json
{
  "success": true,
  "changes": "Updated hook, added emoji, improved flow",
  "original": "Original text here",
  "revised": "Revised text here"
}
```

---

#### POST /reject

**Purpose**: Handle post rejection

**Request**:
```json
{
  "record_id": "rec123456789"
}
```

**Response - Success** (HTTP 200):
```json
{
  "success": true,
  "scheduled_deletion": "2025-01-08",
  "days_until_deletion": 7
}
```

---

#### GET /health

**Purpose**: Health check endpoint

**Request**: None

**Response** (HTTP 200):
```json
{
  "status": "healthy",
  "message": "Streamlit webhooks operational"
}
```

---

## Error Handling

### Common Errors

#### 404 Not Found
```json
{
  "success": false,
  "error": "Record not found"
}
```

**Cause**: Invalid `record_id`

**Solution**: Verify record ID in Airtable

---

#### 429 Rate Limited
```
HTTP 429 Too Many Requests
```

**Cause**: Exceeded Airtable rate limit (5 req/sec)

**Solution**: Client automatically retries with exponential backoff

---

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Cause**: Modal function crashed or API error

**Solution**: Check Modal logs, retry operation

---

## Caching Strategy

### Client-Side Cache

**Airtable Client**:
```
get_all_posts()          → 30 seconds TTL
get_scheduled_posts()    → 15 seconds TTL
get_posts_by_status()    → 15 seconds TTL
Single record updates    → Cache invalidated immediately
```

**Streamlit Session**:
```
cache_analytics_aggregates()  → 30 seconds TTL
init_clients()                → Session-long TTL
```

### Cache Invalidation

**Automatic**:
- Any `update_post()` call clears Airtable cache
- Tab switch clears Streamlit session cache

**Manual**:
- User can refresh browser to clear all caches
- "Refresh Data" button available in sidebar

---

## Rate Limits

### Airtable
```
Free Tier: 5 requests/second
Pro Tier:  10 requests/second
```

**Status**: ✅ Sufficient for current usage

### Modal
```
Webhooks:  Unlimited calls (pay-per-use)
Functions: Timeout 300 seconds max
Concurrency: Parallel execution supported
```

**Status**: ✅ Sufficient, ~$1/month typical cost

---

## Environment Variables

### Required
```
AIRTABLE_API_KEY              - Bearer token for Airtable
AIRTABLE_BASE_ID              - Base ID (e.g., app...)
AIRTABLE_LINKEDIN_TABLE_ID    - Table ID (e.g., tbl...)
MODAL_WEBHOOK_BASE_URL        - Modal webhook URL
```

### Optional
```
APP_PASSWORD                  - Password for app access (if auth enabled)
STREAMLIT_ENV                 - Environment name (Local/Production)
```

---

## Examples

### Example 1: Approve a Post

```python
from utils.airtable_client import AirtableClient
from utils.modal_client import ModalClient

# Initialize
airtable = AirtableClient()
modal = ModalClient()

# Get a draft post
posts = airtable.get_all_posts(status_filter="Draft")
post_id = posts[0]["id"]

# Approve it
airtable.update_status(post_id, "Approved - Ready to Schedule")

# Trigger scheduling
result = modal.trigger_scheduling(post_id)

if result["success"]:
    print(f"✅ Post scheduled for {result['data']['scheduled_time']}")
else:
    print(f"❌ Error: {result['error']}")
```

### Example 2: Request Revision

```python
# Save revision request
airtable.request_revision(
    record_id="rec123",
    prompt="Make it more conversational",
    revision_type="Post Only"
)

# Trigger revision
result = modal.trigger_revision("rec123")

if result["success"]:
    print(f"✅ Revision complete: {result['data']['changes']}")
```

### Example 3: Batch Operations

```python
# Get all draft posts
drafts = airtable.get_posts_by_status(["Draft"])

# Approve and schedule all
for post in drafts:
    record_id = post["id"]

    # Update status
    airtable.update_status(record_id, "Approved - Ready to Schedule")

    # Trigger scheduling
    modal.trigger_scheduling(record_id)

    print(f"✅ Scheduled {post['fields']['Title']}")
```

---

## Troubleshooting

### API Calls Timing Out

**Symptom**: "Request timeout after 30s"

**Cause**: Modal or Airtable is slow/unavailable

**Solution**:
1. Check Modal dashboard status
2. Retry the operation
3. Check network connection

### Invalid Record ID

**Symptom**: "Record not found"

**Cause**: `record_id` doesn't exist in Airtable

**Solution**:
1. Verify ID is correct
2. Check it exists in Airtable
3. Copy full ID from Airtable

### Revision Not Processing

**Symptom**: Revision status never changes

**Cause**: Revision Prompt not set before triggering

**Solution**:
1. Check Revision Prompt field is filled
2. Ensure revision_type is valid
3. Check Modal webhook is responding

---

## Rate Limit Best Practices

1. **Batch operations** where possible to reduce calls
2. **Cache results** for 15-30 seconds
3. **Don't poll** - use event-driven webhooks instead
4. **Monitor costs** - should be ~$1/month
5. **Profile performance** - check Streamlit logs

---

## Support

For issues:
1. Check this API reference
2. Check PROJECT_STATUS_SUMMARY.md for troubleshooting
3. Check Modal/Airtable status pages
4. Contact system administrator

