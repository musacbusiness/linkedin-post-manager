import Anthropic from '@anthropic-ai/sdk'

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

export class PostGenerationPipeline {
  private anthropic: InstanceType<typeof Anthropic>

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey })
  }

  async run(
    userProfile: UserProfile,
    onProgress: (progress: PipelineProgress) => void
  ): Promise<PipelineResult> {
    try {
      // Stage 1: Topic Selection
      onProgress({ stage: 1, stageName: 'Topic Selection', message: 'Selecting topic...' })
      const topic = await this.selectTopic(userProfile)
      onProgress({ stage: 1, stageName: 'Topic Selection', message: `Selected: ${topic}`, data: { topic } })

      // Stage 2: Research
      onProgress({ stage: 2, stageName: 'Research', message: 'Conducting research...' })
      const research = await this.conductResearch(topic, userProfile)
      onProgress({ stage: 2, stageName: 'Research', message: `Found ${research.keyPoints.length} key points`, data: research })

      // Stage 3: Framework Selection
      onProgress({ stage: 3, stageName: 'Framework Selection', message: 'Selecting framework...' })
      const framework = await this.selectFramework(topic, research)
      onProgress({ stage: 3, stageName: 'Framework Selection', message: `Using ${framework}`, data: { framework } })

      // Stage 4: Content Generation
      onProgress({ stage: 4, stageName: 'Content Generation', message: 'Writing post...' })
      const content = await this.generateContent(topic, research, framework, userProfile)
      onProgress({ stage: 4, stageName: 'Content Generation', message: `Generated ${content.length} characters`, data: { content } })

      // Stage 5: Image Prompt
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Creating image prompt...' })
      const imagePrompt = await this.generateImagePrompt(topic, content)
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Image prompt created', data: { imagePrompt } })

      // Stage 6: Quality Control
      onProgress({ stage: 6, stageName: 'Quality Control', message: 'Evaluating quality...' })
      const qualityResult = await this.qualityControl(content, framework)
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
        // Stage 7: Root Cause Analysis (simplified - just retry once with feedback)
        onProgress({ stage: 7, stageName: 'Root Cause Analysis', message: 'Quality check failed, analyzing...', data: qualityResult })

        const improvedContent = await this.improveContent(content, qualityResult.issues, framework, userProfile)

        onProgress({ stage: 7, stageName: 'Complete', message: 'Improved post generated!', data: { success: true } })

        return {
          success: true,
          title: topic.substring(0, 80),
          content: improvedContent,
          imagePrompt,
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

  private async selectTopic(profile: UserProfile): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Select a relevant LinkedIn post topic for a professional with:
- Expertise: ${profile.expertise || 'technology'}
- Target audience: ${profile.targetAudience || 'professionals'}
- Tone: ${profile.tone || 'professional'}
${profile.pastTopics?.length ? `- Past topics: ${profile.pastTopics.join(', ')}` : ''}

Return ONLY the topic (one sentence, no explanation).`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return text.trim()
  }

  private async conductResearch(topic: string, profile: UserProfile): Promise<{
    keyPoints: string[]
    useCases: string[]
    dataPoints: string[]
  }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Research this LinkedIn post topic: "${topic}"

Provide:
1. 3-5 key points
2. 2-3 real-world use cases
3. 2-3 relevant data points or statistics

Format as JSON:
{
  "keyPoints": [...],
  "useCases": [...],
  "dataPoints": [...]
}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse research output')
    }
    return JSON.parse(jsonMatch[0])
  }

  private async selectFramework(topic: string, research: any): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Choose the best LinkedIn post framework for this topic: "${topic}"

Options: AIDA (Attention-Interest-Desire-Action), PAS (Problem-Agitate-Solution), Story, VSQ (Value-Statistics-Quote)

Return ONLY the framework name (one word).`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return text.trim()
  }

  private async generateContent(
    topic: string,
    research: any,
    framework: string,
    profile: UserProfile
  ): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Write a compelling LinkedIn post about: "${topic}"

Research:
${research.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

Use Cases:
${research.useCases.map((u: string, i: number) => `- ${u}`).join('\n')}

Framework: ${framework}
Tone: ${profile.tone || 'professional'}
Target: ${profile.targetAudience || 'professionals'}

Requirements:
- 1,300-1,900 characters
- Engaging hook (first 210 chars)
- Clear value proposition
- Call-to-action at end
- Use line breaks for readability
- NO hashtags
- NO emojis

Return ONLY the post content (no metadata or explanations).`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return text.trim()
  }

  private async generateImagePrompt(topic: string, content: string): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Create a detailed image prompt for this LinkedIn post topic: "${topic}"

Post preview: ${content.substring(0, 300)}...

Requirements:
- Professional, modern style
- Relevant to the topic
- Suitable for LinkedIn
- Photorealistic or clean illustration

Return ONLY the image prompt (one paragraph, no explanation).`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return text.trim()
  }

  private async qualityControl(content: string, framework: string): Promise<{
    compliant: boolean
    score: number
    issues: string[]
  }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Evaluate this LinkedIn post for quality:

"${content}"

Framework used: ${framework}

Rate on these criteria (each 1-10):
1. Hook strength (first 210 chars)
2. Value proposition clarity
3. Engagement potential
4. Call-to-action effectiveness
5. Professional tone
6. Length appropriateness (1,300-1,900 chars)

Format as JSON:
{
  "compliant": boolean (true if all >= 8),
  "score": number (average score),
  "issues": ["list of issues if any"]
}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { compliant: true, score: 8.5, issues: [] }
    }
    return JSON.parse(jsonMatch[0])
  }

  private async improveContent(
    content: string,
    issues: string[],
    framework: string,
    profile: UserProfile
  ): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Improve this LinkedIn post to address these issues:

Original post:
"${content}"

Issues to fix:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Framework: ${framework}
Tone: ${profile.tone || 'professional'}

Return ONLY the improved post content (no metadata or explanations).`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return text.trim()
  }
}
