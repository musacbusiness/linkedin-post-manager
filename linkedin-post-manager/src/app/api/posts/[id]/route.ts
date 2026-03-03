import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/[id] - Fetch a single post
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] GET /api/posts/[id] called with ID:', params.id)
    const supabase = await createClient()

    // Check auth (skip in debug mode)
    const debugMode = process.env.DEBUG_AUTH === 'true'
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !debugMode) {
      console.log('[API] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user && debugMode) {
      console.log('[API] DEBUG MODE: Allowing unauthenticated access')
    }

    console.log('[API] Authenticated user ID:', user.id)
    console.log('[API] Querying posts table for post ID:', params.id)

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('[API] Database query error:', error.code, error.message)
      if (error.code === 'PGRST116') {
        console.log('[API] Post not found (PGRST116)')
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      console.error('[API] Supabase error details:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API] Successfully retrieved post from database')
    console.log('[API] Post object keys:', post ? Object.keys(post) : 'post is null')
    console.log('[API] Post ID:', post?.id)
    console.log('[API] Post title:', post?.title)
    console.log('[API] Post content length:', post?.post_content ? post.post_content.length : 0)
    console.log('[API] Post content exists:', !!post?.post_content)
    console.log('[API] Returning response:', { post })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    console.error('[API] Error type:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(
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

    const body = await request.json()

    // Update post
    const { data: post, error } = await supabase
      .from('posts')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      console.error('Error updating post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
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

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
