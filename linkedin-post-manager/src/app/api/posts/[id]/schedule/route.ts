import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { autoSchedulePost } from '@/lib/utils/scheduling'

// POST /api/posts/[id]/schedule - Auto-schedule a post
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

    // Verify post exists and belongs to user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Auto-schedule the post
    const result = await autoSchedulePost(supabase, params.id, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to schedule post' },
        { status: 500 }
      )
    }

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
