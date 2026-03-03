import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAKE_COM_WEBHOOK = 'https://hook.us2.make.com/yr7mo2xefqdjsr3vt6i44tgvajw22i09'

// GET /api/posts/auto-post - Check for due posts and send them to make.com
// Can be called by a cron job or manually
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Optional: Check for a cron secret if you want to secure this endpoint
    const cronSecret = request.headers.get('x-cron-secret')
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      console.log('[AUTO-POST] Unauthorized cron call (wrong secret)')
      // Allow unauthenticated calls for local testing
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find all scheduled posts where scheduled_time <= now
    const now = new Date().toISOString()
    const { data: duePost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'Scheduled')
      .lte('scheduled_time', now)

    if (fetchError) {
      console.error('[AUTO-POST] Error fetching due posts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!duePost || duePost.length === 0) {
      console.log('[AUTO-POST] No posts due for posting')
      return NextResponse.json({
        success: true,
        message: 'No posts due for posting',
        postedCount: 0,
      })
    }

    console.log(`[AUTO-POST] Found ${duePost.length} post(s) due for posting`)

    // Send each due post to make.com
    const results = []
    for (const post of duePost) {
      try {
        const payload = {
          id: post.id,
          title: post.title,
          post_content: post.post_content,
          image_url: post.image_url || null,
          scheduled_time: post.scheduled_time,
        }

        console.log(`[AUTO-POST] Sending post ${post.id} to make.com`)

        const webhookResponse = await fetch(MAKE_COM_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!webhookResponse.ok) {
          console.error(
            `[AUTO-POST] Webhook error for post ${post.id}:`,
            webhookResponse.status
          )
          results.push({
            postId: post.id,
            success: false,
            error: `Webhook returned ${webhookResponse.status}`,
          })
          continue
        }

        // Update post status to Posted
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            status: 'Posted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`[AUTO-POST] Error updating post ${post.id}:`, updateError)
          results.push({
            postId: post.id,
            success: false,
            error: `Failed to update status: ${updateError.message}`,
          })
          continue
        }

        console.log(`[AUTO-POST] Post ${post.id} successfully posted`)
        results.push({
          postId: post.id,
          success: true,
          sentAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error(`[AUTO-POST] Error processing post ${post.id}:`, error)
        results.push({
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    console.log(`[AUTO-POST] Completed: ${successCount}/${duePost.length} posts posted`)

    return NextResponse.json({
      success: true,
      message: `Auto-posted ${successCount} of ${duePost.length} posts`,
      postedCount: successCount,
      results,
    })
  } catch (error) {
    console.error('[AUTO-POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
