# Image Upload Debugging Guide

## Problem Summary
Recently generated post images are saving temporary Replicate URLs instead of permanent Supabase Storage URLs. Error messages were not visible to users when storage upload failed.

## Changes Made

### 1. Storage Upload Validation ✅
The Supabase storage upload mechanism is **working correctly**. This was verified with a test script that:
- Successfully uploaded test image to "generated-images" bucket
- Generated permanent public URL: `https://ehybwxxbrsykykiygods.supabase.co/storage/v1/object/public/generated-images/...`
- Confirmed URL is accessible (HTTP 200)

**Test script**: `test_storage_upload.py` (can be run locally to verify storage anytime)

### 2. Improved Error Handling & Visibility

#### Post Editor (`streamlit_app/components/post_editor.py`)
- Added visual dividers (horizontal lines) around error/success messages to make them stand out
- Added detailed console logging at each step:
  - Replicate image download progress
  - Download status code and byte count
  - Storage upload call parameters
  - Upload result details
  - Database update response
  - Whether rerun will/won't happen
- Validation that downloaded image is not empty
- Validation that HTTP download succeeds (status 200)
- 30-second timeout on Replicate URL download

#### Supabase Client (`streamlit_app/utils/supabase_client.py`)
- Validation that image_bytes is not empty
- Validation that storage response is not None
- Validation that public URL is generated successfully
- Added error type information to error responses
- More granular logging showing response type at each stage
- Comprehensive error tracing with traceback

### 3. Expected Behavior After Changes

When generating an image:
1. **If image generation succeeds and storage upload succeeds:**
   - ✅ Success message displayed in green
   - 📸 Image URL shown in code box
   - App reruns to show updated image

2. **If image generation succeeds but storage upload FAILS:**
   - ❌ Error message displayed prominently with visual dividers
   - Full error details shown for debugging
   - ⚠️ Warning about fallback to temporary Replicate URL
   - 📸 Replicate URL shown (will expire in ~7 days)
   - **App does NOT rerun** so error message stays visible

3. **If there's an exception at any stage:**
   - ❌ Full exception message displayed
   - 📋 Complete traceback shown in code box
   - Console logs show where failure occurred

## How to Test

1. **Open Streamlit app**: Run the app normally
2. **Navigate to a post**: Go to Posts section, find a post, edit it
3. **Click "Generate Image" button**: Wait for process to complete
4. **Check for messages**: Look for error messages with dividers around them
5. **Check console logs**: Look at the server console for debug output with `[DEBUG]` prefix

## What We're Looking For

If image upload still fails, the error message will tell us WHY:
- **"Failed to download image from Replicate: HTTP XXX"** → Replicate URL is bad
- **"Downloaded image has no data (0 bytes)"** → Replicate didn't return image data
- **"Upload response is None"** → Storage upload returned invalid response
- **"Failed to generate public URL"** → URL generation failed
- Other error messages will explain the specific issue

## Console Logs to Review

Run the Streamlit app and watch the server console (where you ran `streamlit run app.py`). You'll see logs like:

```
[DEBUG] Downloading image from: https://replicate.delivery/...
[DEBUG] Download response status: 200
[DEBUG] Downloaded 245832 bytes
[DEBUG] Generated filename: 20260214_163539_abc123.jpg
[DEBUG] Calling upload_image_to_storage()...
[DEBUG] Uploading image to Supabase Storage: 20260214_163539_abc123.jpg
[DEBUG] Image size: 245832 bytes
[DEBUG] Calling storage.from_('generated-images').upload()...
[DEBUG] Upload response type: <class 'UploadResponse'>
[DEBUG] Upload response: UploadResponse(path='...', full_path='...', fullPath='...')
[DEBUG] Getting public URL for: 20260214_163539_abc123.jpg
[DEBUG] Public URL: https://ehybwxxbrsykykiygods.supabase.co/storage/v1/object/public/generated-images/...
[DEBUG] Image uploaded to storage successfully: https://...
[DEBUG] Updating database with image URL: https://...
[DEBUG] Database update response: <Response [...]>
[DEBUG] Upload succeeded, calling st.rerun()
```

If something fails, look for:
- `[DEBUG] ERROR uploading image to storage: ...`
- `[DEBUG] Error type: ...`
- `[DEBUG] Traceback:` followed by detailed Python traceback

## Next Steps

1. **Test image generation** with the updated code
2. **Look for error messages** in the Streamlit UI with dividers
3. **Check console logs** to see detailed debug output
4. **Report the error message** you see - this will tell us exactly what's failing

If no error messages appear and storage upload still fails silently, there might be:
- An issue with Streamlit session state
- A Streamlit-specific rendering issue
- An edge case we haven't covered yet

In that case, let me know the exact error message from the console logs and we can debug further.

## Files Modified
- `streamlit_app/components/post_editor.py` - Added validation, logging, visual separators
- `streamlit_app/utils/supabase_client.py` - Added validation, better error details
- `test_storage_upload.py` - New test script to verify storage functionality

## Commits Made
- "Improve image storage error handling and visibility"
- "Add comprehensive debugging to image upload workflow"
- "Add robust error handling and validation for image download/upload"
