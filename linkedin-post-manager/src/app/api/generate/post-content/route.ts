import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// POST /api/generate/post-content - Rewrite content of an existing post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Fetch the existing post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('title, post_content, generation_metadata')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const meta = post.generation_metadata as Record<string, any> | null
    const pillar = meta?.pillar || ''
    const framework = meta?.framework || ''

    const prompt = `You are a content engine for an AI & automation consultancy. Rewrite the LinkedIn post below with a completely fresh take — different hook, different opening angle, different sentence structures — while keeping the same core topic and insights.

ORIGINAL POST TITLE: "${post.title}"
CONTENT PILLAR: ${pillar || 'AI & automation'}
FRAMEWORK USED: ${framework || 'VALUE-STACK'}

ORIGINAL POST:
"${post.post_content}"

REWRITE RULES:
- Start with a completely different hook (different first line, different angle in)
- Keep the same core insight and topic — do not invent new claims
- Maintain the same total length range (1300–1900 characters)
- Hook (first line) must be under 210 characters
- Same paragraph/line-break structure for mobile readability
- Hashtags on the final line only (3-5, same topic area)
- NO emojis
- NO external links
- Voice: confident practitioner — "here's what I tested/built" framing, not client stories

VOICE PROFILE:
- Conversational authority — explaining to a smart peer over coffee
- Anti-fluff — zero buzzword salads
- 70% educational / 20% opinionated / 10% personal
- Lead with a specific concrete detail (number, tool name, result)

DON'T:
- Start with "In today's world..." / "AI is transforming..." / generic AI openers
- Use passive voice in the hook
- Reference clients, client work, or "a client of mine"
- Repeat the same opening sentence structure as the original
- Use: leverage, synergies, game-changer, disrupt, unlock, transformative

SELF-CHECK before returning:
□ Is the hook under 210 chars?
□ Is total length 1300–1900 chars?
□ Does the CTA end with a specific question (not "Thoughts?" or "Agree?")?

Return ONLY the rewritten post content. No preamble, no labels, no explanation.`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'Failed to regenerate content' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text?.trim()

    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Post content regeneration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate content' },
      { status: 500 }
    )
  }
}
