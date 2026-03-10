import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/generate-batch - Generate batch of posts
// Called by cron job to automatically generate posts if needed
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth via cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      console.log('[GENERATE-BATCH] Unauthorized cron call (wrong secret)')
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get request body
    const body = await request.json().catch(() => ({}))
    const count = body.count || 3

    console.log(`[GENERATE-BATCH] Starting batch generation (${count} posts)`)

    // Get current post count in Pending Review or Scheduled status
    const { data: existingPosts, error: countError } = await supabase
      .from('posts')
      .select('id, status')
      .in('status', ['Pending Review', 'Scheduled'])

    if (countError) {
      console.error('[GENERATE-BATCH] Error counting posts:', countError)
      return NextResponse.json(
        { error: 'Failed to count posts', details: countError.message },
        { status: 500 }
      )
    }

    const currentCount = existingPosts?.length || 0
    const targetCount = 21
    const neededCount = Math.max(0, targetCount - currentCount)

    if (neededCount === 0) {
      console.log(`[GENERATE-BATCH] Already have ${currentCount} posts, no generation needed`)
      return NextResponse.json({
        success: true,
        message: 'Already have enough posts',
        currentCount,
        targetCount,
        generatedCount: 0,
      })
    }

    const generateCount = Math.min(count, neededCount)
    console.log(`[GENERATE-BATCH] Current: ${currentCount}, Target: ${targetCount}, Generating: ${generateCount}`)

    // Pillar rotation: cycle A→F across batch loop
    const PILLARS = ['A', 'B', 'C', 'D', 'E', 'F']
    const PILLAR_FRAMEWORK: Record<string, string> = {
      A: 'VALUE-STACK',
      B: 'VSQ',
      C: 'CONTRAST-BRIDGE',
      D: 'PAS-ADAPT',
      E: 'CONTRAST-BRIDGE',
      F: 'STORY-LESSON',
    }
    const FRAMEWORK_TEMPLATES: Record<string, string> = {
      'VALUE-STACK': `HOOK: Surprising stat, counterintuitive claim, or specific result (max 210 chars)
CONTEXT: Why this matters right now (1-2 sentences)
VALUE DELIVERY: The core insight or framework — 60% of the post. Use numbered steps OR a clear before/after. Include one specific, concrete example.
TAKEAWAY: Single-sentence distillation of the key lesson
CTA: Conversation-starter question or "save this for later"`,
      'VSQ': `HOOK: "[Tool/Feature] just changed the game for [specific use case]" (max 210 chars)
VALUE: What it does and why it matters — explain like the reader has 30 seconds
SIGNAL: What this tells us about where AI/automation is heading — connect to a bigger trend
QUESTION: Turn it into a discussion — "Are you using this yet?" or "What would you use this for?"`,
      'CONTRAST-BRIDGE': `HOOK: Present the tension or misconception (max 210 chars)
SIDE A: Present the common belief or Option A (with empathy — don't straw-man)
THE PIVOT: "But here's what most people miss..."
SIDE B: Present the reality, the better option, or the nuance
THE BRIDGE: How to think about this going forward
CTA: Ask which side the audience falls on, or what their experience has been`,
      'PAS-ADAPT': `HOOK: Name a specific, recognizable pain point (max 210 chars)
PROBLEM: Describe the problem in vivid, relatable terms
AGITATE: Show the cost of ignoring it — use a specific number or scenario
SOLUTION: Present your approach as education, NOT a sales pitch. Include one actionable step.
RESULT: What changes when you solve this
CTA: "What's the one process in your business that's begging to be automated?"`,
      'STORY-LESSON': `HOOK: Set the scene with a specific moment or detail (max 210 chars)
THE STORY: What happened — 3-5 sentences max. Include a specific detail that makes it feel real.
THE LESSON: What this taught you
THE PRINCIPLE: Generalize it — why this matters beyond your specific situation
CTA: "Have you experienced something similar?" or share your version`,
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Generate posts using Claude
    const generatedPosts = []
    for (let i = 0; i < generateCount; i++) {
      try {
        console.log(`[GENERATE-BATCH] Generating post ${i + 1}/${generateCount}`)

        const pillar = PILLARS[i % PILLARS.length]
        const framework = PILLAR_FRAMEWORK[pillar]
        const frameworkTemplate = FRAMEWORK_TEMPLATES[framework]

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-6',
            max_tokens: 2048,
            messages: [
              {
                role: 'user',
                content: `You are a content engine for an AI & automation consultancy. Write a LinkedIn post for Pillar ${pillar}.

CONTENT PILLAR ${pillar} FOCUS:
${pillar === 'A' ? 'Practical AI Usage Tips — prompting techniques, workflow patterns, tool configurations' : ''}
${pillar === 'B' ? 'AI Product & Feature Spotlights — new capabilities and tools explained through a practitioner lens' : ''}
${pillar === 'C' ? 'AI Model Comparisons & Analysis — honest breakdowns of strengths, weaknesses, best-fit scenarios' : ''}
${pillar === 'D' ? 'Business Process Automation — identifying which processes are ripe for automation and how to build systems' : ''}
${pillar === 'E' ? 'Strategic AI Adoption — the difference between robust AI systems and dangerous dependency' : ''}
${pillar === 'F' ? 'The Case for AI & Automation — making the business case grounded in real outcomes' : ''}

FRAMEWORK: ${framework}
${frameworkTemplate}

VOICE PROFILE:
- Practitioner-first — lead with "here's what I built/tested/broke," not "here's what the industry says"
- Conversational authority — write like you're explaining to a smart peer over coffee
- Anti-fluff — zero buzzword salads
- Plain English — if a technical term is necessary, explain it in the same sentence

HARD CONSTRAINTS:
- Total length: 1300–1900 characters (including spaces)
- Hook (first line): max 210 characters
- Paragraphs: max 2-3 sentences each
- Hashtags: add 3-5 relevant hashtags as the FINAL line only, separated by a blank line
- NO hashtags in the post body
- NO emojis
- CTA: end with a specific, low-friction question — NEVER "Thoughts?" or "Agree?"

DO NOT use: leverage, synergies, game-changer, disrupt, unlock, transformative, seamlessly
DO NOT start with: "In today's world..." or "AI is transforming..."

Return ONLY a JSON object:
{
  "title": "post title max 80 chars",
  "post_content": "the full LinkedIn post text",
  "pillar": "${pillar}",
  "framework": "${framework}"
}`,
              },
            ],
          }),
        })

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.statusText}`)
        }

        const apiData = await response.json()
        const responseText = apiData.content[0]?.type === 'text' ? apiData.content[0].text : ''

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Could not parse JSON from Claude response')
        }

        const postData = JSON.parse(jsonMatch[0])

        // Insert into database
        const { data: newPost, error: insertError } = await supabase
          .from('posts')
          .insert({
            title: postData.title || 'Generated Post',
            post_content: postData.post_content || '',
            status: 'Pending Review',
            generation_metadata: { pillar: postData.pillar || pillar, framework: postData.framework || framework },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error(`[GENERATE-BATCH] Error inserting post ${i + 1}:`, insertError)
          continue
        }

        console.log(`[GENERATE-BATCH] Created post ${newPost.id} [Pillar ${pillar}, ${framework}]`)
        generatedPosts.push(newPost)
      } catch (error) {
        console.error(`[GENERATE-BATCH] Error generating post ${i + 1}:`, error)
        continue
      }
    }

    console.log(`[GENERATE-BATCH] Successfully generated ${generatedPosts.length} posts`)

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedPosts.length} posts`,
      currentCount,
      targetCount,
      generatedCount: generatedPosts.length,
      posts: generatedPosts.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
      })),
    })
  } catch (error) {
    console.error('[GENERATE-BATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
