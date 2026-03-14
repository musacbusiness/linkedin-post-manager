import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/mark-posted - Called by make.com after successful LinkedIn publish
// Auth: MAKE_WEBHOOK_SECRET header (shared secret, not user session)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify request is from make.com via shared secret
    const secret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.MAKE_WEBHOOK_SECRET

    if (!expectedSecret) {
      console.error('[MARK-POSTED] MAKE_WEBHOOK_SECRET env var not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (secret?.trim() !== expectedSecret?.trim()) {
      console.error('[MARK-POSTED] Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const linkedin_url = body?.linkedin_url ?? null

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updateData: Record<string, string | null> = {
      status: 'Posted',
      updated_at: new Date().toISOString(),
    }
    if (linkedin_url) {
      updateData.linkedin_url = linkedin_url
    }
    if (body?.posted_at) {
      updateData.posted_at = body.posted_at
    } else {
      updateData.posted_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      console.error('[MARK-POSTED] Error updating post:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`[MARK-POSTED] Post ${params.id} marked as Posted`)
    return NextResponse.json({ success: true, postId: params.id })
  } catch (error) {
    console.error('[MARK-POSTED] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
