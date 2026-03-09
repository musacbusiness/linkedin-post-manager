import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { schedulePostDelivery } from '@/lib/qstash'

// POST /api/posts/[id]/schedule-custom - Schedule a post for a specific time
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

    // Get scheduled time from request body
    const body = await request.json()
    const { scheduledTime } = body

    if (!scheduledTime) {
      return NextResponse.json({ error: 'scheduledTime is required' }, { status: 400 })
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

    // Update post with scheduled time and status
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Scheduled',
        scheduled_time: scheduledTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error scheduling post:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule post' },
        { status: 500 }
      )
    }

    console.log(`Scheduled post ${params.id} for ${scheduledTime}`)

    // Schedule QStash delivery at exact time
    await schedulePostDelivery(params.id, scheduledTime)

    return NextResponse.json({
      success: true,
      message: 'Post scheduled for custom time',
      scheduledTime,
    })
  } catch (error) {
    console.error('Schedule custom error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
