import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { autoSchedulePost } from '@/lib/utils/scheduling'
import { schedulePostDelivery } from '@/lib/qstash'

// POST /api/posts/[id]/schedule - Auto-schedule a post
export async function POST(
  request: NextRequest,
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

    // Verify post exists
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Read timezone from request body
    let timezone = 'UTC'
    try {
      const body = await request.json()
      if (body?.timezone) timezone = body.timezone
    } catch { /* no body — use UTC */ }

    // Auto-schedule the post in the user's timezone
    const result = await autoSchedulePost(supabase, params.id, timezone)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to schedule post' },
        { status: 500 }
      )
    }

    // Schedule QStash delivery at exact time
    await schedulePostDelivery(params.id, result.scheduledTime!)

    return NextResponse.json({
      success: true,
      scheduledTime: result.scheduledTime,
    })
  } catch (error) {
    console.error('Schedule API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
