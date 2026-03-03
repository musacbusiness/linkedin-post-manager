import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/unschedule - Remove a post from scheduling queue
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

    // Verify post exists and is scheduled
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'Scheduled') {
      return NextResponse.json(
        { error: 'Post is not scheduled' },
        { status: 400 }
      )
    }

    // Update post status back to Pending Review and clear scheduled_time
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Pending Review',
        scheduled_time: null,
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Unschedule error:', updateError)
      return NextResponse.json(
        { error: 'Failed to unschedule post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post removed from scheduling queue',
    })
  } catch (error) {
    console.error('Unschedule API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
