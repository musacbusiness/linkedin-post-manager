import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AnchorConfig } from '@/types/anchor'

// POST /api/generate/image-prompt
// Generates a revised base image prompt + anchor config for an existing post
// based on user feedback. Used by the "Regenerate with new prompt" modal.
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

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('post_content, image_prompt, generation_metadata')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const userPrompt = `You are redesigning a two-stage hybrid LinkedIn image for an AI & automation content brand.

The pipeline works as follows:
- Stage 1: Stable Diffusion generates a clean photorealistic base photo. Screens are INTENTIONALLY BLANK — they are a canvas.
- Stage 2: A visual anchor (bold text/graphic) is composited programmatically onto the photo. This is where the story lives.

POST CONTENT:
"${post.post_content || ''}"

CURRENT SD BASE PROMPT:
"${post.image_prompt || '(none)'}"

USER FEEDBACK (what they want changed):
"${feedback || 'Generate a fresh base image prompt and anchor config that better matches the post'}"

Produce a revised base image prompt AND a new anchor config that addresses the feedback.

BASE IMAGE CATEGORIES (choose one — screens must be intentionally blank):
CLEAN_DESK — Elevated angle, dark blank monitor, minimal desk items, no people, bright window light.
TEAM_HUDDLE — 2–4 professionals, NO screens, open office, large soft-focus space around group.
OVER_THE_SHOULDER — Professional looking at large monitor with SOLID DARK screen. Screen glow on face.
WIDE_OFFICE — Wide architectural shot, professionals soft in background, large open foreground.
HANDS_CLOSE_UP — Close-up of hands on laptop/tablet with SOLID DARK screen. Warm side light.

ANCHOR TYPES (choose one):
big_number   — Post has a standout metric → { "type": "big_number", "number": "20+", "label": "hours/week saved" }
simple_diagram — Post has N named steps → { "type": "simple_diagram", "elements": [{"shape":"box","label":"Step 1"},...], "arrows": true }
before_after — Post contrasts two states → { "type": "before_after", "beforeLabel": "Manual", "afterLabel": "Automated" }
icon_cluster — Post lists tools/items → { "type": "icon_cluster", "items": [{"icon":"file-text","label":"Notes"},...] }
             Available icons: file-text, bar-chart, git-branch, clock, zap, check-circle, x-circle, arrow-right, users, cpu
pull_quote   — Post has a killer 1-liner → { "type": "pull_quote", "quote": "Stack small. Compound big.", "style": "editorial" }

Return ONLY a JSON object:
{
  "sdPrompt": "the revised SD base image prompt (blank screens, photorealistic, editorial photography)",
  "negativePrompt": "(text:1.6),(words:1.6),(letters:1.6),(numbers:1.5),(readable:1.5),(legible:1.5), any content on screen, any interface on screen, illustration, digital art, vector, cartoon, anime, 3D render, stock photo pose, looking at camera, fake smile, staged, bad anatomy, deformed hands, blurry, low quality, oversaturated, dark moody, cyberpunk, neon, fantasy, sci-fi, hologram",
  "anchor": { /* the revised AnchorConfig */ }
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate revised prompt' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const fallbackAnchor: AnchorConfig = {
      type: 'pull_quote',
      quote: (post.post_content || '').split(' ').slice(0, 7).join(' '),
      style: 'modern',
    }

    return NextResponse.json({
      prompt: parsed.sdPrompt || parsed.prompt || '',
      negativePrompt: parsed.negativePrompt || '',
      anchorConfig: (parsed.anchor ?? fallbackAnchor) as AnchorConfig,
      baseCategory: parsed.baseCategory || undefined,
    })
  } catch (error) {
    console.error('[ImagePrompt] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image prompt' },
      { status: 500 }
    )
  }
}
