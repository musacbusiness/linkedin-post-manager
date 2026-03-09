import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { autoSchedulePost } from '@/lib/utils/scheduling'
import { schedulePostDelivery } from '@/lib/qstash'

// POST /api/posts/[id]/approve - Approve a post and auto-schedule it
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

    // Update post status to Approved
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error approving post:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Auto-schedule the post
    const scheduleResult = await autoSchedulePost(supabase, params.id)

    if (!scheduleResult.success) {
      return NextResponse.json(
        { error: scheduleResult.error || 'Failed to schedule post' },
        { status: 500 }
      )
    }

    // Schedule QStash delivery at exact time
    await schedulePostDelivery(params.id, scheduleResult.scheduledTime!)

    return NextResponse.json({
      success: true,
      message: 'Post approved and scheduled',
      scheduledTime: scheduleResult.scheduledTime,
    })
  } catch (error) {
    console.error('Approve API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
