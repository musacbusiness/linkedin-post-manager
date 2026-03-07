import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/auto-post - Check for due posts and send them to make.com
// Called by Vercel Cron Job
export async function GET(request: NextRequest) {
  try {
    // Check Vercel cron authorization header
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[AUTO-POST] Unauthorized cron call (wrong secret)')
      // Allow unauthenticated calls for local testing
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Use service role key to bypass RLS (cron has no user session)
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate webhook URL is configured
    const MAKE_COM_WEBHOOK = process.env.MAKE_WEBHOOK_URL
    if (!MAKE_COM_WEBHOOK) {
      console.error('[AUTO-POST] MAKE_WEBHOOK_URL env var not set')
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      )
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
