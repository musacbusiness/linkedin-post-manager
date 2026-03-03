import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    // Generate posts using Claude
    const generatedPosts = []
    for (let i = 0; i < generateCount; i++) {
      try {
        console.log(`[GENERATE-BATCH] Generating post ${i + 1}/${generateCount}`)

        const message = await anthropic.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Generate a professional LinkedIn post about business, innovation, productivity, or leadership.

Requirements:
- Title: A catchy headline (max 50 chars)
- Content: Engaging post text (200-300 chars), use line breaks for readability
- Make it valuable and thought-provoking
- Include relevant emojis
- Professional but not boring

Format your response as JSON:
{
  "title": "...",
  "content": "..."
}`,
            },
          ],
        })

        // Extract the text content
        const responseText =
          message.content[0].type === 'text' ? message.content[0].text : ''

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
            post_content: postData.content || '',
            status: 'Pending Review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error(`[GENERATE-BATCH] Error inserting post ${i + 1}:`, insertError)
          continue
        }

        console.log(`[GENERATE-BATCH] Created post ${newPost.id}`)
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
