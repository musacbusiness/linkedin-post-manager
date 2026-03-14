import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/generate/image-prompt
// Generates a revised image prompt for an existing post based on user feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, feedback } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    // Fetch the post's content and current image prompt
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('post_content, image_prompt, generation_metadata')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const currentPrompt = post.image_prompt || ''
    const postContent = post.post_content || ''

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are an editorial photography art director for an AI & automation content brand on LinkedIn. Your image prompts must produce photorealistic photographs that look like they were shot for Fast Company, Wired, or Harvard Business Review. NOT illustrations, NOT abstract art, NOT stock photo poses.`

    const userPrompt = `You need to revise an image prompt for a LinkedIn post based on user feedback.

POST CONTENT:
"${postContent}"

CURRENT IMAGE PROMPT:
"${currentPrompt}"

USER FEEDBACK (what they want changed):
"${feedback || 'Generate a fresh, more content-specific version of the image prompt'}"

Generate a REVISED image prompt that:
1. Directly addresses the user's feedback
2. Still accurately represents THIS post's specific story and content
3. Maintains photorealistic editorial photography style
4. Uses a specific narrative scene (not a generic "person at desk" or "team meeting")
5. The screen/props in the scene must show something specific to this post's topic — not a generic workflow diagram
6. Includes text suppression: "(readable text:1.5), (legible words:1.5), (visible letters:1.4), (text on screen:1.3)" in the negative prompt section

Keep what works from the current prompt. Only change what the feedback asks for.

Return ONLY the revised prompt text — no JSON, no explanation, no preamble. Just the prompt.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const revisedPrompt = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : ''

    if (!revisedPrompt) {
      return NextResponse.json({ error: 'Failed to generate revised prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt: revisedPrompt })
  } catch (error) {
    console.error('Image prompt generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image prompt' },
      { status: 500 }
    )
  }
}
