import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getQStashReceiver } from '@/lib/qstash'

// POST /api/posts/[id]/publish - Called by QStash at scheduled time
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify request is from QStash
    const receiver = getQStashReceiver()
    const body = await request.text()

    const isValid = await receiver.verify({
      signature: request.headers.get('upstash-signature') ?? '',
      body,
    })

    if (!isValid) {
      console.error('[PUBLISH] Invalid QStash signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key — no user session in this context
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const MAKE_COM_WEBHOOK = process.env.MAKE_WEBHOOK_URL
    if (!MAKE_COM_WEBHOOK) {
      console.error('[PUBLISH] MAKE_WEBHOOK_URL env var not set')
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 })
    }

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !post) {
      console.error('[PUBLISH] Post not found:', params.id)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Guard: skip if already sent or posted
    if (post.status === 'Post Sent' || post.status === 'Posted') {
      console.log(`[PUBLISH] Post ${params.id} already sent, skipping`)
      return NextResponse.json({ success: true, message: 'Already sent' })
    }

    // Send to make.com
    const payload = {
      id: post.id,
      title: post.title,
      post_content: post.post_content,
      image_url: post.image_url || null,
      scheduled_time: post.scheduled_time,
    }

    console.log(`[PUBLISH] Sending post ${params.id} to make.com`)

    const webhookResponse = await fetch(MAKE_COM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!webhookResponse.ok) {
      console.error(`[PUBLISH] Webhook error: ${webhookResponse.status}`)
      return NextResponse.json(
        { error: `Webhook returned ${webhookResponse.status}` },
        { status: 500 }
      )
    }

    // Mark as Post Sent — make.com will update to Posted after successful LinkedIn publish
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'Post Sent', updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateError) {
      console.error('[PUBLISH] Error updating status:', updateError)
      return NextResponse.json({ error: 'Failed to update post status' }, { status: 500 })
    }

    console.log(`[PUBLISH] Post ${params.id} successfully posted`)
    return NextResponse.json({ success: true, postId: params.id })
  } catch (error) {
    console.error('[PUBLISH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
