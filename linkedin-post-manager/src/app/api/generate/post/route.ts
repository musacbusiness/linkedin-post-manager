import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PostGenerationPipeline, UserProfile } from '@/lib/ai/pipeline'

// POST /api/generate/post - Generate post with AI pipeline (Server-Sent Events)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse user profile from request
    const body = await request.json()
    const userProfile: UserProfile = {
      expertise: body.expertise || 'technology',
      targetAudience: body.targetAudience || 'professionals',
      tone: body.tone || 'professional',
      pastTopics: body.pastTopics || [],
    }

    // Check for Anthropic API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initialize the pipeline
          const pipeline = new PostGenerationPipeline(anthropicApiKey)

          // Run the pipeline with progress callback
          const result = await pipeline.run(userProfile, (progress) => {
            // Send progress update as SSE
            const data = JSON.stringify(progress)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          })

          if (result.success) {
            // Save generated post to Supabase
            const { data: newPost, error: insertError } = await supabase
              .from('posts')
              .insert({
                title: result.title,
                content: result.content,
                image_prompt: result.imagePrompt,
                status: 'pending_review',
              })
              .select()
              .single()

            if (insertError) {
              console.error('Failed to save post:', insertError)
              const errorData = JSON.stringify({
                stage: -1,
                stageName: 'Error',
                message: 'Failed to save post to database',
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            } else {
              // Send success with post ID
              const successData = JSON.stringify({
                stage: 7,
                stageName: 'Complete',
                message: 'Post saved successfully!',
                data: { postId: newPost.id },
              })
              controller.enqueue(encoder.encode(`data: ${successData}\n\n`))
            }
          } else {
            // Send error
            const errorData = JSON.stringify({
              stage: -1,
              stageName: 'Error',
              message: result.error || 'Generation failed',
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          }
        } catch (error) {
          console.error('Pipeline error:', error)
          const errorData = JSON.stringify({
            stage: -1,
            stageName: 'Error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
