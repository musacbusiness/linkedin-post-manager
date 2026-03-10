import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings/pipeline - Fetch pipeline settings for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch settings for this user
    const { data, error } = await supabase
      .from('pipeline_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[SETTINGS] Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return settings or defaults if none exist
    if (!data) {
      return NextResponse.json({
        topicExpertise: 'business and technology',
        topicAudience: 'professionals and entrepreneurs',
        topicTone: 'professional',
        topicPastTopics: [],
        topicCustomPool: [],
        researchSources: [],
        frameworkAllowed: ['VALUE-STACK', 'CONTRAST-BRIDGE', 'STORY-LESSON', 'PAS-ADAPT', 'VSQ'],
        frameworkForced: null,
        contentMinChars: 1300,
        contentMaxChars: 1900,
        contentHookChars: 210,
        contentAllowHashtags: true,
        contentAllowEmojis: false,
        contentCtaGuidance: '',
        imageGenerationModel: 'testing',
        imageExtraRequirements: '',
        qualityMinScore: 7,
        qualityCriteria: [
          { name: 'Hook Power', description: 'Stops scroll. Specific, unexpected, pattern-breaking. Makes reader HAVE to click "see more".' },
          { name: 'Value Density', description: 'Every sentence earns its place. No filler, no throat-clearing, no restating the obvious.' },
          { name: 'Engagement Potential', description: 'Written to provoke saves, comments, and shares — not just likes. Asks a question worth answering.' },
          { name: 'CTA Strength', description: 'Specific, low-friction ask the reader actually wants to respond to. Never "Thoughts?" or "Agree?".' },
          { name: 'Tone Authenticity', description: 'Sounds like a real practitioner with real experience. Nothing like corporate AI output.' },
          { name: 'Length Compliance', description: '1300–1900 chars total, hook under 210 chars, proper spacing with short paragraphs.' },
        ],
        rcaEnabled: true,
        rcaMaxRetries: 2,
      })
    }

    // Map database columns to camelCase
    return NextResponse.json({
      topicExpertise: data.topic_expertise,
      topicAudience: data.topic_audience,
      topicTone: data.topic_tone,
      topicPastTopics: data.topic_past_topics || [],
      topicCustomPool: data.topic_custom_pool || [],
      researchSources: data.research_sources || [],
      frameworkAllowed: data.framework_allowed || ['VALUE-STACK', 'CONTRAST-BRIDGE', 'STORY-LESSON', 'PAS-ADAPT', 'VSQ'],
      frameworkForced: data.framework_forced,
      contentMinChars: data.content_min_chars,
      contentMaxChars: data.content_max_chars,
      contentHookChars: data.content_hook_chars,
      contentAllowHashtags: data.content_allow_hashtags,
      contentAllowEmojis: data.content_allow_emojis,
      contentCtaGuidance: data.content_cta_guidance,
      imageGenerationModel: data.image_style,
      imageExtraRequirements: data.image_extra_requirements,
      qualityMinScore: data.quality_min_score,
      qualityCriteria: data.quality_criteria,
      rcaEnabled: data.rca_enabled,
      rcaMaxRetries: data.rca_max_retries,
    })
  } catch (error) {
    console.error('[SETTINGS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/settings/pipeline - Update pipeline settings for authenticated user
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const settings = await request.json()

    // Prepare data for database (convert camelCase to snake_case)
    const dbData = {
      user_id: user.id,
      topic_expertise: settings.topicExpertise,
      topic_audience: settings.topicAudience,
      topic_tone: settings.topicTone,
      topic_past_topics: settings.topicPastTopics,
      topic_custom_pool: settings.topicCustomPool,
      research_sources: settings.researchSources,
      framework_allowed: settings.frameworkAllowed,
      framework_forced: settings.frameworkForced,
      content_min_chars: settings.contentMinChars,
      content_max_chars: settings.contentMaxChars,
      content_hook_chars: settings.contentHookChars,
      content_allow_hashtags: settings.contentAllowHashtags,
      content_allow_emojis: settings.contentAllowEmojis,
      content_cta_guidance: settings.contentCtaGuidance,
      image_style: settings.imageGenerationModel,
      image_extra_requirements: settings.imageExtraRequirements,
      quality_min_score: settings.qualityMinScore,
      quality_criteria: settings.qualityCriteria,
      rca_enabled: settings.rcaEnabled,
      rca_max_retries: settings.rcaMaxRetries,
      updated_at: new Date().toISOString(),
    }

    // Upsert settings (insert or update)
    const { data, error } = await supabase
      .from('pipeline_settings')
      .upsert(dbData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[SETTINGS] Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    console.log('[SETTINGS] Settings updated for user:', user.id)

    // Return updated settings in camelCase
    return NextResponse.json({
      topicExpertise: data.topic_expertise,
      topicAudience: data.topic_audience,
      topicTone: data.topic_tone,
      topicPastTopics: data.topic_past_topics,
      topicCustomPool: data.topic_custom_pool,
      researchSources: data.research_sources,
      frameworkAllowed: data.framework_allowed,
      frameworkForced: data.framework_forced,
      contentMinChars: data.content_min_chars,
      contentMaxChars: data.content_max_chars,
      contentHookChars: data.content_hook_chars,
      contentAllowHashtags: data.content_allow_hashtags,
      contentAllowEmojis: data.content_allow_emojis,
      contentCtaGuidance: data.content_cta_guidance,
      imageGenerationModel: data.image_style,
      imageExtraRequirements: data.image_extra_requirements,
      qualityMinScore: data.quality_min_score,
      qualityCriteria: data.quality_criteria,
      rcaEnabled: data.rca_enabled,
      rcaMaxRetries: data.rca_max_retries,
    })
  } catch (error) {
    console.error('[SETTINGS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
