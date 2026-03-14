import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PostGenerationPipeline, UserProfile, PipelineSettings } from '@/lib/ai/pipeline'

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
    const forcedTopic = (body.topic as string)?.trim() || undefined
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

    // Fetch pipeline settings for this user
    let pipelineSettings: PipelineSettings | undefined
    const { data: settingsRow } = await supabase
      .from('pipeline_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (settingsRow) {
      // Map database columns to camelCase
      pipelineSettings = {
        topicExpertise: settingsRow.topic_expertise,
        topicAudience: settingsRow.topic_audience,
        topicTone: settingsRow.topic_tone,
        topicPastTopics: settingsRow.topic_past_topics || [],
        topicCustomPool: settingsRow.topic_custom_pool || [],
        researchSources: settingsRow.research_sources || [],
        frameworkAllowed: settingsRow.framework_allowed || ['VALUE-STACK', 'CONTRAST-BRIDGE', 'STORY-LESSON', 'PAS-ADAPT', 'VSQ'],
        frameworkForced: settingsRow.framework_forced,
        contentMinChars: settingsRow.content_min_chars,
        contentMaxChars: settingsRow.content_max_chars,
        contentHookChars: settingsRow.content_hook_chars,
        contentAllowHashtags: settingsRow.content_allow_hashtags,
        contentAllowEmojis: settingsRow.content_allow_emojis,
        contentCtaGuidance: settingsRow.content_cta_guidance,
        imageGenerationModel: settingsRow.image_style,
        imageExtraRequirements: settingsRow.image_extra_requirements,
        // Cap qualityMinScore at 7.0 and rcaMaxRetries at 2 regardless of stored values
        // to ensure first-attempt pass rate and prevent SSE timeouts from excessive retries
        qualityMinScore: Math.min(settingsRow.quality_min_score ?? 7, 7.0),
        qualityCriteria: settingsRow.quality_criteria,
        rcaEnabled: settingsRow.rca_enabled,
        rcaMaxRetries: Math.min(settingsRow.rca_max_retries ?? 2, 2),
      }
    }

    // Query last 3 posts for pillar/framework rotation context
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('generation_metadata')
      .order('created_at', { ascending: false })
      .limit(3)

    if (recentPosts && recentPosts.length > 0) {
      const recentPillars: string[] = []
      const recentFrameworks: string[] = []
      for (const post of recentPosts) {
        const meta = post.generation_metadata as Record<string, string> | null
        if (meta?.pillar) recentPillars.push(meta.pillar)
        if (meta?.framework) recentFrameworks.push(meta.framework)
      }
      pipelineSettings = {
        ...(pipelineSettings || {} as PipelineSettings),
        recentPillars,
        recentFrameworks,
      }
    }

    // Merge forced topic if provided by the user
    if (forcedTopic) {
      pipelineSettings = {
        ...(pipelineSettings || {} as PipelineSettings),
        forcedTopic,
      }
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
          }, pipelineSettings)

          if (result.success) {
            // Save generated post to Supabase with Pending Review status
            const { data: newPost, error: insertError } = await supabase
              .from('posts')
              .insert({
                title: result.title,
                post_content: result.content,
                image_prompt: result.imagePrompt,
                status: 'Pending Review',
                generation_metadata: {
                  pillar: result.pillar,
                  framework: result.framework,
                  imagePromptMetadata: result.imagePromptMetadata,
                },
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
