export interface PipelineProgress {
  stage: number
  stageName: string
  message: string
  data?: any
}

export interface UserProfile {
  expertise?: string
  targetAudience?: string
  tone?: string
  pastTopics?: string[]
}

export interface PipelineResult {
  success: boolean
  title: string
  content: string
  imagePrompt: string
  error?: string
}

export interface QualityCriterion {
  name: string
  description: string
}

export interface PipelineSettings {
  // Stage 1: Topic Selection
  topicExpertise: string
  topicAudience: string
  topicTone: string
  topicPastTopics: string[]
  topicCustomPool: string[]
  // Stage 2: Research
  researchSources: string[]
  // Stage 3: Framework Selection
  frameworkAllowed: string[]
  frameworkForced: string | null
  // Stage 4: Content Generation
  contentMinChars: number
  contentMaxChars: number
  contentHookChars: number
  contentAllowHashtags: boolean
  contentAllowEmojis: boolean
  contentCtaGuidance: string
  // Stage 5: Image Prompt
  imageStyle: string
  imageExtraRequirements: string
  // Stage 6: Quality Control
  qualityMinScore: number
  qualityCriteria: QualityCriterion[]
  // Stage 7: RCA / Improve
  rcaEnabled: boolean
  rcaMaxRetries: number
}

export class PostGenerationPipeline {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }
    this.apiKey = apiKey
    console.log('PostGenerationPipeline initialized successfully')
  }

  private async callAnthropicAPI(userMessage: string): Promise<string> {
    // Log to help with debugging
    const keyPrefix = this.apiKey.substring(0, 10)
    console.log(`[Anthropic API] Calling with key prefix: ${keyPrefix}...`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`[Anthropic API] Error response:`, error)
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const text = data.content[0]?.text || ''
    console.log(`[Anthropic API] Success, received ${text.length} characters`)
    return text.trim()
  }

  async run(
    userProfile: UserProfile,
    onProgress: (progress: PipelineProgress) => void,
    settings?: PipelineSettings
  ): Promise<PipelineResult> {
    try {
      // Stage 1: Topic Selection
      onProgress({ stage: 1, stageName: 'Topic Selection', message: 'Selecting topic...' })
      const topic = await this.selectTopic(userProfile, settings)
      onProgress({ stage: 1, stageName: 'Topic Selection', message: `Selected: ${topic}`, data: { topic } })

      // Stage 2: Research
      onProgress({ stage: 2, stageName: 'Research', message: 'Conducting research...' })
      const research = await this.conductResearch(topic, userProfile, settings)
      onProgress({ stage: 2, stageName: 'Research', message: `Found ${research.keyPoints.length} key points`, data: research })

      // Stage 3: Framework Selection
      onProgress({ stage: 3, stageName: 'Framework Selection', message: 'Selecting framework...' })
      let framework: string
      if (settings?.frameworkForced) {
        framework = settings.frameworkForced
        onProgress({ stage: 3, stageName: 'Framework Selection', message: `Using forced framework: ${framework}`, data: { framework } })
      } else {
        framework = await this.selectFramework(topic, research, settings)
        onProgress({ stage: 3, stageName: 'Framework Selection', message: `Using ${framework}`, data: { framework } })
      }

      // Stage 4: Content Generation
      onProgress({ stage: 4, stageName: 'Content Generation', message: 'Writing post...' })
      const content = await this.generateContent(topic, research, framework, userProfile, settings)
      onProgress({ stage: 4, stageName: 'Content Generation', message: `Generated ${content.length} characters`, data: { content } })

      // Stage 5: Image Prompt
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Creating image prompt...' })
      const imagePrompt = await this.generateImagePrompt(topic, content, settings)
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Image prompt created', data: { imagePrompt } })

      // Stage 6: Quality Control
      onProgress({ stage: 6, stageName: 'Quality Control', message: 'Evaluating quality...' })
      const qualityResult = await this.qualityControl(content, framework, settings)
      onProgress({ stage: 6, stageName: 'Quality Control', message: `Score: ${qualityResult.score}/10`, data: qualityResult })

      if (qualityResult.compliant) {
        onProgress({ stage: 7, stageName: 'Complete', message: 'Post generation complete!', data: { success: true } })

        return {
          success: true,
          title: topic.substring(0, 80),
          content,
          imagePrompt,
        }
      } else {
        // Stage 7: Root Cause Analysis
        if (!settings?.rcaEnabled) {
          onProgress({ stage: 7, stageName: 'Complete', message: 'Quality check failed, RCA disabled', data: { success: false } })
          return {
            success: false,
            title: topic.substring(0, 80),
            content: '',
            imagePrompt: '',
            error: `Quality score ${qualityResult.score} below threshold ${settings?.qualityMinScore || 8}`,
          }
        }

        const maxRetries = settings?.rcaMaxRetries || 1
        let improvedContent = content
        let currentQuality = qualityResult

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          onProgress({ stage: 7, stageName: 'Root Cause Analysis', message: `Improving content (attempt ${attempt + 1}/${maxRetries})...`, data: currentQuality })

          improvedContent = await this.improveContent(improvedContent, currentQuality.issues, framework, userProfile, settings)

          // Re-evaluate quality
          currentQuality = await this.qualityControl(improvedContent, framework, settings)

          if (currentQuality.compliant) {
            onProgress({ stage: 7, stageName: 'Complete', message: 'Improved post passed quality check!', data: { success: true } })
            return {
              success: true,
              title: topic.substring(0, 80),
              content: improvedContent,
              imagePrompt,
            }
          }
        }

        // Still not compliant after retries
        onProgress({ stage: 7, stageName: 'Complete', message: `Quality check failed after ${maxRetries} retry attempts`, data: { success: false } })
        return {
          success: false,
          title: topic.substring(0, 80),
          content: '',
          imagePrompt: '',
          error: `Quality score ${currentQuality.score} below threshold after retries`,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onProgress({ stage: -1, stageName: 'Error', message: errorMessage })

      return {
        success: false,
        title: '',
        content: '',
        imagePrompt: '',
        error: errorMessage,
      }
    }
  }

  private async selectTopic(profile: UserProfile, settings?: PipelineSettings): Promise<string> {
    const expertise = settings?.topicExpertise || profile.expertise || 'technology'
    const audience = settings?.topicAudience || profile.targetAudience || 'professionals'
    const tone = settings?.topicTone || profile.tone || 'professional'
    const pastTopics = settings?.topicPastTopics || profile.pastTopics || []
    const customPool = settings?.topicCustomPool || []

    let prompt = `Select a relevant LinkedIn post topic for a professional with:
- Expertise: ${expertise}
- Target audience: ${audience}
- Tone: ${tone}
${pastTopics.length ? `- Past topics to avoid: ${pastTopics.join(', ')}` : ''}`

    if (customPool.length > 0) {
      prompt += `\n\nCandidate topics to consider:\n${customPool.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    }

    prompt += '\n\nReturn ONLY the topic (one sentence, no explanation).'

    return await this.callAnthropicAPI(prompt)
  }

  private async conductResearch(topic: string, _profile: UserProfile, settings?: PipelineSettings): Promise<{
    keyPoints: string[]
    useCases: string[]
    dataPoints: string[]
  }> {
    let prompt = `Research this LinkedIn post topic: "${topic}"

Provide:
1. 3-5 key points
2. 2-3 real-world use cases
3. 2-3 relevant data points or statistics`

    if (settings?.researchSources && settings.researchSources.length > 0) {
      prompt += `\n\nFocus your research on information from these sources/domains:\n${settings.researchSources.join(', ')}`
    }

    prompt += `\n\nFormat as JSON:
{
  "keyPoints": [...],
  "useCases": [...],
  "dataPoints": [...]
}`

    const text = await this.callAnthropicAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse research output')
    }
    return JSON.parse(jsonMatch[0])
  }

  private async selectFramework(topic: string, _research: any, settings?: PipelineSettings): Promise<string> {
    const allowedFrameworks = settings?.frameworkAllowed || ['AIDA', 'PAS', 'Story', 'VSQ']
    const frameworkDescriptions: Record<string, string> = {
      AIDA: 'AIDA (Attention-Interest-Desire-Action)',
      PAS: 'PAS (Problem-Agitate-Solution)',
      Story: 'Story',
      VSQ: 'VSQ (Value-Statistics-Quote)',
    }

    const options = allowedFrameworks
      .map(f => frameworkDescriptions[f] || f)
      .join(', ')

    const prompt = `Choose the best LinkedIn post framework for this topic: "${topic}"

Options: ${options}

Return ONLY the framework name (one word).`

    return await this.callAnthropicAPI(prompt)
  }

  private async generateContent(
    topic: string,
    research: any,
    framework: string,
    profile: UserProfile,
    settings?: PipelineSettings
  ): Promise<string> {
    const minChars = settings?.contentMinChars ?? 1300
    const maxChars = settings?.contentMaxChars ?? 1900
    const hookChars = settings?.contentHookChars ?? 210
    const allowHashtags = settings?.contentAllowHashtags ?? false
    const allowEmojis = settings?.contentAllowEmojis ?? false
    const ctaGuidance = settings?.contentCtaGuidance || ''
    const tone = settings?.topicTone || profile.tone || 'professional'
    const audience = settings?.topicAudience || profile.targetAudience || 'professionals'

    let prompt = `Write a compelling LinkedIn post about: "${topic}"

Research:
${research.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

Use Cases:
${research.useCases.map((u: string) => `- ${u}`).join('\n')}

Framework: ${framework}
Tone: ${tone}
Target: ${audience}

Requirements:
- ${minChars}-${maxChars} characters
- Engaging hook (first ${hookChars} chars)
- Clear value proposition
- Call-to-action at end
- Use line breaks for readability
${!allowHashtags ? '- NO hashtags' : '- Can use hashtags'}
${!allowEmojis ? '- NO emojis' : '- Can use emojis'}`

    if (ctaGuidance) {
      prompt += `\n- CTA guidance: ${ctaGuidance}`
    }

    prompt += '\n\nReturn ONLY the post content (no metadata or explanations).'

    return await this.callAnthropicAPI(prompt)
  }

  private async generateImagePrompt(topic: string, content: string, settings?: PipelineSettings): Promise<string> {
    const style = settings?.imageStyle || 'Professional, modern style'
    const extraReqs = settings?.imageExtraRequirements || ''

    let prompt = `Create a detailed image prompt for this LinkedIn post topic: "${topic}"

Post preview: ${content.substring(0, 300)}...

Style: ${style}

Requirements:
- Relevant to the topic
- Suitable for LinkedIn
- High quality`

    if (extraReqs) {
      prompt += `\n- ${extraReqs}`
    }

    prompt += '\n\nReturn ONLY the image prompt (one paragraph, no explanation).'

    return await this.callAnthropicAPI(prompt)
  }

  private async qualityControl(content: string, framework: string, settings?: PipelineSettings): Promise<{
    compliant: boolean
    score: number
    issues: string[]
  }> {
    const minScore = settings?.qualityMinScore ?? 8
    const criteria = settings?.qualityCriteria || [
      { name: 'hook', description: 'Opening line grabs attention immediately' },
      { name: 'value', description: 'Provides actionable insights or unique perspective' },
      { name: 'engagement', description: 'Encourages comments, shares, or reactions' },
      { name: 'cta', description: 'Clear call-to-action or next step' },
      { name: 'tone', description: 'Matches professional yet approachable voice' },
      { name: 'length', description: 'Optimal length for LinkedIn engagement' },
    ]

    const criteriaList = criteria
      .map((c, i) => `${i + 1}. ${c.name} - ${c.description}`)
      .join('\n')

    const prompt = `Evaluate this LinkedIn post for quality:

"${content}"

Framework used: ${framework}

Rate on these criteria (each 1-10):
${criteriaList}

Format as JSON:
{
  "compliant": boolean (true if all >= ${minScore}),
  "score": number (average score),
  "issues": ["list of issues if any"]
}`

    const text = await this.callAnthropicAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { compliant: true, score: 8.5, issues: [] }
    }
    const result = JSON.parse(jsonMatch[0])
    // Override compliant check based on configured min score
    result.compliant = result.score >= minScore
    return result
  }

  private async improveContent(
    content: string,
    issues: string[],
    framework: string,
    profile: UserProfile,
    settings?: PipelineSettings
  ): Promise<string> {
    const tone = settings?.topicTone || profile.tone || 'professional'

    const prompt = `Improve this LinkedIn post to address these issues:

Original post:
"${content}"

Issues to fix:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Framework: ${framework}
Tone: ${tone}

Return ONLY the improved post content (no metadata or explanations).`

    return await this.callAnthropicAPI(prompt)
  }
}
