import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/send - Send a post to make.com and mark as Posted
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get webhook URL from env var
    const MAKE_COM_WEBHOOK = process.env.MAKE_WEBHOOK_URL
    if (!MAKE_COM_WEBHOOK) {
      console.error('[POST /send] MAKE_WEBHOOK_URL env var not set')
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 500 }
      )
    }

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Prepare payload for make.com
    const payload = {
      id: post.id,
      title: post.title,
      post_content: post.post_content,
      image_url: post.image_url || null,
      scheduled_time: post.scheduled_time,
    }

    console.log('[POST /send] Sending post to make.com:', payload)

    // Send to make.com webhook
    const webhookResponse = await fetch(MAKE_COM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!webhookResponse.ok) {
      console.error('[POST /send] Webhook error:', webhookResponse.status, webhookResponse.statusText)
      const webhookError = await webhookResponse.text()
      console.error('[POST /send] Webhook response:', webhookError)
      return NextResponse.json(
        { error: `Failed to send to make.com: ${webhookResponse.statusText}` },
        { status: 500 }
      )
    }

    console.log('[POST /send] Webhook response status:', webhookResponse.status)

    // Update post status to Posted
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Posted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating post status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post status' },
        { status: 500 }
      )
    }

    console.log(`[POST /send] Post ${params.id} marked as Posted`)

    return NextResponse.json({
      success: true,
      message: 'Post sent to make.com and marked as Posted',
      postId: params.id,
    })
  } catch (error) {
    console.error('[POST /send] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
