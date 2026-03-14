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

export interface ImagePromptOutput {
  prompt: string
  negativePrompt: string
  aspectRatio: '1:1' | '4:5' | '1.91:1'
  resolution: '1080x1080' | '1080x1350' | '1200x627'
  format: 'PNG' | 'JPEG'
  cfgScale: number
  steps: number
  sampler: string
  selectedMode?: string
}

export interface PipelineResult {
  success: boolean
  title: string
  content: string
  imagePrompt: string
  imagePromptMetadata?: ImagePromptOutput
  pillar?: string
  framework?: string
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
  imageGenerationModel: string  // 'production' | 'testing'
  imageExtraRequirements: string
  // Stage 6: Quality Control
  qualityMinScore: number
  qualityCriteria: QualityCriterion[]
  // Stage 7: RCA / Improve
  rcaEnabled: boolean
  rcaMaxRetries: number
  // Rotation tracking
  recentPillars?: string[]
  recentFrameworks?: string[]
  recentModes?: string[]
}

// ─── Directive constants ────────────────────────────────────────────────────

const PILLARS = `
PILLAR A — Practical AI Usage Tips
Prompting techniques, workflow patterns, tool configurations.
Example angles: how to write prompts that get consistent outputs, chain-of-thought vs single-shot, system prompt design, using Claude/ChatGPT as a thinking partner, prompt templates for business functions, before/after prompt examples.

PILLAR B — AI Product & Feature Spotlights
New capabilities and tools explained through a practitioner lens.
Example angles: new feature deep-dives (Claude, ChatGPT memory, Gemini context windows), tool walkthroughs with real use cases, "I tested [feature] for a week", MCP and connecting AI to business tools, AI coding assistants compared, local model deployment.

PILLAR C — AI Model Comparisons & Analysis
Honest breakdowns of strengths, weaknesses, best-fit scenarios.
Example angles: Claude vs GPT vs Gemini for specific tasks, open-source vs closed-source tradeoffs, when smaller models outperform larger ones, benchmark scores vs real-world usability, cost-per-task analysis, model selection framework.

PILLAR D — Business Process Automation
Identifying which processes are ripe for automation and how to build systems.
Example angles: 5 business processes every niche should automate first, auditing workflows for automation potential, Make.com/Zapier/n8n step-by-step flows, CRM automation, document processing pipelines, ROI math for automation.

PILLAR E — Strategic AI Adoption (Systems vs. Over-Reliance)
The difference between robust AI systems and dangerous dependency.
Example angles: AI-assisted vs AI-dependent, why copy-pasting ChatGPT outputs isn't a strategy, building systems with human checkpoints, black-box automation risks, building AI literacy in teams, avoiding vendor lock-in.

PILLAR F — The Case for AI & Automation (Benefits & ROI)
Making the business case grounded in real outcomes.
Example angles: time saved vs value created, case studies before/after automation, compounding effect of small automations, "we saved 20 hours/week" breakdowns, why winning companies started small, cost of NOT automating.`

const FRAMEWORK_TEMPLATES: Record<string, string> = {
  'VALUE-STACK': `VALUE-STACK framework (best for Pillar A & D — tips, how-tos, step-by-step):
HOOK: Surprising stat, counterintuitive claim, or specific result (max 210 chars)
CONTEXT: Why this matters right now (1-2 sentences)
VALUE DELIVERY: The core insight or framework — 60% of the post. Use numbered steps OR a clear before/after. Include one specific, concrete example. Show the "how," not just the "what."
TAKEAWAY: Single-sentence distillation of the key lesson
CTA: Conversation-starter question or "save this for later"`,

  'CONTRAST-BRIDGE': `CONTRAST-BRIDGE framework (best for Pillar C & E — comparisons, nuanced takes):
HOOK: Present the tension or misconception (max 210 chars)
SIDE A: Present the common belief or Option A (with empathy — don't straw-man)
THE PIVOT: "But here's what most people miss..."
SIDE B: Present the reality, the better option, or the nuance
THE BRIDGE: How to think about this going forward / a framework for deciding
CTA: Ask which side the audience falls on, or what their experience has been`,

  'STORY-LESSON': `STORY-LESSON framework (best for Pillar E & F — real experience, case studies):
HOOK: Set the scene with a specific moment or detail (max 210 chars)
THE STORY: What happened — 3-5 sentences max. Include a specific detail that makes it feel real (a number, a quote, a tool name). Build to the moment of realization or failure.
THE LESSON: What this taught you — this is the real value
THE PRINCIPLE: Generalize it — why this matters beyond your specific situation
CTA: "Have you experienced something similar?" or share your version`,

  'PAS-ADAPT': `PAS-ADAPT framework (best for Pillar D & F — making the case for a solution):
HOOK: Name a specific, recognizable pain point (max 210 chars)
PROBLEM: Describe the problem in vivid, relatable terms (audience should nod along)
AGITATE: Show the cost of ignoring it — use a specific number or scenario, not vague fear
SOLUTION: Present your approach as education, NOT a sales pitch. Include one actionable step they can take today.
RESULT: What changes when you solve this — paint the after state
CTA: "What's the one process in your business that's begging to be automated?"`,

  'VSQ': `VSQ (Value-Signal-Question) framework (best for Pillar B — feature spotlights, new tools):
HOOK: "[Tool/Feature] just changed the game for [specific use case]" (max 210 chars)
VALUE: What it does and why it matters — explain like the reader has 30 seconds
SIGNAL: What this tells us about where AI/automation is heading — connect to a bigger trend
QUESTION: Turn it into a discussion — "Are you using this yet?" or "What would you use this for?"`,
}

const UNIVERSAL_NEGATIVE_PROMPT = '(text:1.5), (words:1.5), (letters:1.5), (numbers:1.4), (readable:1.4), (legible:1.4), watermark, signature, logo, label, caption, illustration, digital art, vector art, cartoon, anime, 3D render, CGI, painting, drawing, sketch, stock photo pose, looking at camera, fake smile, staged handshake, thumbs up, bad anatomy, deformed hands, extra fingers, missing fingers, disfigured, ugly, blurry, low quality, low resolution, pixelated, oversaturated, plastic skin, airbrushed, uncanny valley, cyberpunk neon, fantasy, sci-fi, futuristic hologram, glowing elements'

// ─── Pipeline class ─────────────────────────────────────────────────────────

export class PostGenerationPipeline {
  private apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }
    this.apiKey = apiKey
    console.log('PostGenerationPipeline initialized successfully')
  }

  private async callAnthropicAPI(userMessage: string, maxTokens = 1024): Promise<string> {
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
        model: 'claude-opus-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: userMessage }],
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
      const topicResult = await this.selectTopic(userProfile, settings)
      const { topic, pillar, recommendedFramework } = topicResult
      onProgress({ stage: 1, stageName: 'Topic Selection', message: `Selected: ${topic} [Pillar ${pillar}]`, data: topicResult })

      // Stage 2: Research
      onProgress({ stage: 2, stageName: 'Research', message: 'Conducting research...' })
      const research = await this.conductResearch(topic, settings)
      onProgress({ stage: 2, stageName: 'Research', message: `Found ${research.keyPoints.length} key points`, data: research })

      // Stage 3: Framework Selection
      onProgress({ stage: 3, stageName: 'Framework Selection', message: 'Selecting framework...' })
      let framework: string
      if (settings?.frameworkForced) {
        framework = settings.frameworkForced
        onProgress({ stage: 3, stageName: 'Framework Selection', message: `Using forced framework: ${framework}`, data: { framework } })
      } else {
        framework = await this.selectFramework(topic, pillar, recommendedFramework, settings)
        onProgress({ stage: 3, stageName: 'Framework Selection', message: `Using ${framework}`, data: { framework } })
      }

      // Stage 4: Content Generation
      onProgress({ stage: 4, stageName: 'Content Generation', message: 'Writing post...' })
      const content = await this.generateContent(topic, research, framework, userProfile, settings)
      onProgress({ stage: 4, stageName: 'Content Generation', message: `Generated ${content.length} characters`, data: { content } })

      // Stage 5: Image Prompt
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Creating image prompt...' })
      let imagePromptResult = await this.generateImagePrompt(topic, content, pillar, settings)
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Image prompt created', data: { imagePrompt: imagePromptResult.prompt } })

      // Stage 6: Quality Control (includes image-post alignment check)
      onProgress({ stage: 6, stageName: 'Quality Control', message: 'Evaluating quality...' })
      const qualityResult = await this.qualityControl(content, framework, settings, imagePromptResult.prompt)

      // If image alignment failed, regenerate image prompt before continuing
      if (qualityResult.imageAlignmentFailed) {
        onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Regenerating image prompt for better content alignment...' })
        imagePromptResult = await this.generateImagePrompt(topic, content, pillar, settings)
        onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Image prompt regenerated', data: { imagePrompt: imagePromptResult.prompt } })
      }

      onProgress({ stage: 6, stageName: 'Quality Control', message: `Score: ${qualityResult.score}/10${qualityResult.autoFailed ? ' (auto-fail triggered)' : ''}${qualityResult.imageAlignmentFailed ? ' (image regenerated)' : ''}`, data: qualityResult })

      if (qualityResult.compliant) {
        onProgress({ stage: 7, stageName: 'Complete', message: 'Post generation complete!', data: { success: true } })
        return {
          success: true,
          title: topic.substring(0, 80),
          content,
          imagePrompt: imagePromptResult.prompt,
          imagePromptMetadata: imagePromptResult,
          pillar,
          framework,
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

        const maxRetries = settings?.rcaMaxRetries || 2
        let improvedContent = content
        let currentQuality = qualityResult

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          onProgress({ stage: 7, stageName: 'Root Cause Analysis', message: `Improving content (attempt ${attempt + 1}/${maxRetries})...`, data: currentQuality })
          improvedContent = await this.improveContent(improvedContent, currentQuality.issues, framework, userProfile, settings)
          currentQuality = await this.qualityControl(improvedContent, framework, settings)

          if (currentQuality.compliant) {
            onProgress({ stage: 7, stageName: 'Complete', message: 'Improved post passed quality check!', data: { success: true } })
            return {
              success: true,
              title: topic.substring(0, 80),
              content: improvedContent,
              imagePrompt: imagePromptResult.prompt,
              imagePromptMetadata: imagePromptResult,
              pillar,
              framework,
            }
          }
        }

        // Still not compliant — return best version with flag for human review
        onProgress({ stage: 7, stageName: 'Complete', message: `Quality check failed after ${maxRetries} retry. Returning best version for human review.`, data: { success: true, humanReviewRequired: true } })
        return {
          success: true,
          title: topic.substring(0, 80),
          content: improvedContent,
          imagePrompt: imagePromptResult.prompt,
          imagePromptMetadata: imagePromptResult,
          pillar,
          framework,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onProgress({ stage: -1, stageName: 'Error', message: errorMessage })
      return { success: false, title: '', content: '', imagePrompt: '', error: errorMessage }
    }
  }

  // ─── Stage 1: Topic Selection ─────────────────────────────────────────────

  private async selectTopic(
    profile: UserProfile,
    settings?: PipelineSettings
  ): Promise<{ topic: string; pillar: string; recommendedFramework: string }> {
    const expertise = settings?.topicExpertise || profile.expertise || 'AI and automation consulting'
    const audience = settings?.topicAudience || profile.targetAudience || 'business owners and professionals'
    const tone = settings?.topicTone || profile.tone || 'practitioner'
    const pastTopics = settings?.topicPastTopics || profile.pastTopics || []
    const customPool = settings?.topicCustomPool || []
    const recentPillars = settings?.recentPillars || []
    const recentFrameworks = settings?.recentFrameworks || []

    const allPillars = ['A', 'B', 'C', 'D', 'E', 'F']
    const underrepresented = allPillars.filter(p => !recentPillars.includes(p))
    const pillarPriority = underrepresented.length > 0 ? underrepresented : allPillars

    const prompt = `You are a content strategist for an AI & automation consultancy. Select a LinkedIn post topic following this decision tree.

AUTHOR CONTEXT:
- Expertise: ${expertise}
- Target audience: ${audience}
- Tone: ${tone}
${pastTopics.length ? `- Topics recently covered (avoid repeating): ${pastTopics.join(', ')}` : ''}

CONTENT PILLARS (pick ONE):
${PILLARS}

DECISION TREE:
1. Prioritize pillars NOT recently covered. Recent pillars used: [${recentPillars.join(', ') || 'none'}]
   → Prioritize from: [${pillarPriority.join(', ')}]
2. Check: Is there a major AI development worth spotlighting? If yes, consider Pillar B or C.
3. Avoid using the same framework as recent posts. Recent frameworks: [${recentFrameworks.join(', ') || 'none'}]
4. Select a specific topic angle from the chosen pillar's examples.
${customPool.length > 0 ? `\nCANDIDATE TOPICS TO CONSIDER:\n${customPool.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : ''}

AVAILABLE FRAMEWORKS (pick the best fit):
- VALUE-STACK: best for Pillar A & D
- CONTRAST-BRIDGE: best for Pillar C & E
- STORY-LESSON: best for Pillar E & F
- PAS-ADAPT: best for Pillar D & F
- VSQ: best for Pillar B

Return ONLY a JSON object, no explanation:
{
  "topic": "one specific sentence describing the exact post topic and angle",
  "pillar": "A|B|C|D|E|F",
  "recommendedFramework": "VALUE-STACK|CONTRAST-BRIDGE|STORY-LESSON|PAS-ADAPT|VSQ"
}`

    const text = await this.callAnthropicAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback if JSON parse fails
      return { topic: text.substring(0, 100), pillar: 'A', recommendedFramework: 'VALUE-STACK' }
    }
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        topic: parsed.topic || text.substring(0, 100),
        pillar: parsed.pillar || 'A',
        recommendedFramework: parsed.recommendedFramework || 'VALUE-STACK',
      }
    } catch {
      return { topic: text.substring(0, 100), pillar: 'A', recommendedFramework: 'VALUE-STACK' }
    }
  }

  // ─── Stage 2: Research ────────────────────────────────────────────────────

  private async conductResearch(
    topic: string,
    settings?: PipelineSettings
  ): Promise<{ keyPoints: string[]; useCases: string[]; dataPoints: string[]; sources: string[] }> {
    const additionalSources = settings?.researchSources || []

    const prompt = `You are a research assistant for an AI & automation content engine. Research this LinkedIn post topic: "${topic}"

PRIMARY SOURCES to draw from (check these first):
- Anthropic Blog (anthropic.com/news) — Claude features, research, safety
- OpenAI Blog (openai.com/blog) — GPT updates, API changes
- Simon Willison's Blog (simonwillison.net) — practitioner LLM coverage
- Ethan Mollick's Substack (oneusefulthing.org) — research-backed AI in work
- Hugging Face Blog (huggingface.co/blog) — open-source model releases
- McKinsey Digital — AI adoption data, business impact studies
- Stanford HAI AI Index (aiindex.stanford.edu) — comprehensive AI trends
- Make.com Blog, Zapier Blog, n8n Blog — automation templates and guides

SECONDARY SOURCES (for specific topics):
- MIT Technology Review, TechCrunch AI, Ars Technica AI
- Papers With Code (paperswithcode.com) — benchmark data
- LMSYS Chatbot Arena — model comparison rankings
- Harvard Business Review — strategic AI adoption
${additionalSources.length > 0 ? `\nADDITIONAL FOCUS AREAS: ${additionalSources.join(', ')}` : ''}

REQUIREMENTS:
- All content must feel current (post-2023)
- Data points MUST cite a specific source (even if approximate)
- Use cases should be concrete and specific, not generic
- Key points should be non-obvious insights, not basic facts
- Be concise — each array item max 1-2 sentences

Return ONLY a valid JSON object with NO markdown fences, NO preamble:
{
  "keyPoints": ["3 non-obvious insights about the topic"],
  "useCases": ["2 concrete, specific real-world use cases"],
  "dataPoints": ["2 data points or stats, each citing a source e.g. 'According to McKinsey 2024...'"],
  "sources": ["2-3 sources referenced"]
}`

    const text = await this.callAnthropicAPI(prompt, 2048)

    // Extract JSON — handle markdown fences and partial responses
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[Stage 2] Could not find JSON in research response, using fallback')
      return {
        keyPoints: [`Key insight about ${topic}`],
        useCases: [`Practical application of ${topic}`],
        dataPoints: [],
        sources: [],
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        keyPoints: parsed.keyPoints || [],
        useCases: parsed.useCases || [],
        dataPoints: parsed.dataPoints || [],
        sources: parsed.sources || [],
      }
    } catch {
      console.warn('[Stage 2] JSON parse failed, using fallback')
      return {
        keyPoints: [`Key insight about ${topic}`],
        useCases: [`Practical application of ${topic}`],
        dataPoints: [],
        sources: [],
      }
    }
  }

  // ─── Stage 3: Framework Selection ────────────────────────────────────────

  private async selectFramework(
    topic: string,
    pillar: string,
    recommendedFramework: string,
    settings?: PipelineSettings
  ): Promise<string> {
    const allowedFrameworks = settings?.frameworkAllowed || ['VALUE-STACK', 'CONTRAST-BRIDGE', 'STORY-LESSON', 'PAS-ADAPT', 'VSQ']
    const recentFrameworks = settings?.recentFrameworks || []

    const frameworkDescriptions: Record<string, string> = {
      'VALUE-STACK': 'VALUE-STACK — tips, how-tos, step-by-step breakdowns (best for Pillar A & D)',
      'CONTRAST-BRIDGE': 'CONTRAST-BRIDGE — comparisons, challenging assumptions, nuanced takes (best for Pillar C & E)',
      'STORY-LESSON': 'STORY-LESSON — real experience, case studies, observations (best for Pillar E & F)',
      'PAS-ADAPT': 'PAS-ADAPT — problem/solution, making the business case (best for Pillar D & F)',
      'VSQ': 'VSQ (Value-Signal-Question) — new tool or feature spotlights (best for Pillar B)',
    }

    const available = allowedFrameworks.filter(f => !recentFrameworks.includes(f))
    const options = (available.length > 0 ? available : allowedFrameworks)
      .map(f => frameworkDescriptions[f] || f)
      .join('\n- ')

    const prompt = `Choose the best LinkedIn post framework for this topic and pillar.

Topic: "${topic}"
Content Pillar: ${pillar}
Topic Selection recommended: ${recommendedFramework}
Frameworks used recently (avoid if possible): ${recentFrameworks.join(', ') || 'none'}

Available frameworks:
- ${options}

Return ONLY the framework name exactly as written (e.g. VALUE-STACK, CONTRAST-BRIDGE, STORY-LESSON, PAS-ADAPT, or VSQ).`

    const result = await this.callAnthropicAPI(prompt)
    // Normalize to exact framework name
    const normalized = result.trim().toUpperCase().replace(/[^A-Z\-]/g, '')
    const match = allowedFrameworks.find(f => normalized.includes(f.replace('-', '')) || result.toUpperCase().includes(f))
    return match || recommendedFramework || 'VALUE-STACK'
  }

  // ─── Stage 4: Content Generation ─────────────────────────────────────────

  private async generateContent(
    topic: string,
    research: { keyPoints: string[]; useCases: string[]; dataPoints: string[]; sources?: string[] },
    framework: string,
    _profile: UserProfile,
    settings?: PipelineSettings
  ): Promise<string> {
    const minChars = settings?.contentMinChars ?? 1300
    const maxChars = settings?.contentMaxChars ?? 1900
    const hookChars = settings?.contentHookChars ?? 210
    const allowEmojis = settings?.contentAllowEmojis ?? false
    const ctaGuidance = settings?.contentCtaGuidance || ''

    const frameworkTemplate = FRAMEWORK_TEMPLATES[framework] || FRAMEWORK_TEMPLATES['VALUE-STACK']

    const prompt = `You are a content engine for an AI & automation consultancy. Write a LinkedIn post that sounds like it was written by a hands-on practitioner who has actually deployed these tools, hit real walls, and learned from them.

TOPIC: "${topic}"

RESEARCH:
Key insights:
${research.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Use cases:
${research.useCases.map(u => `- ${u}`).join('\n')}

Data points:
${research.dataPoints.map(d => `- ${d}`).join('\n')}

VOICE PROFILE:
- Confident but not arrogant — share what you know, admit what you don't
- Practitioner-first — lead with "here's what I built/tested/broke," not "here's what the industry says"
- Conversational authority — write like you're explaining to a smart peer over coffee
- Anti-fluff — zero buzzword salads, no "leverage synergies" language
- Plain English — if a technical term is necessary, explain it in the same sentence
- Tone mix: 70% educational / 20% opinionated / 10% personal

FRAMEWORK TO USE:
${frameworkTemplate}

HARD CONSTRAINTS:
- Total length: ${minChars}–${maxChars} characters (including spaces)
- Hook (first line): max ${hookChars} characters — must work as a standalone teaser before "see more"
- Paragraphs: max 2-3 sentences each, single line breaks between paragraphs
- Hashtags: add 3-5 relevant hashtags as the FINAL line only, separated from body by a blank line
- NO hashtags anywhere in the post body
${allowEmojis ? '- Minimal emoji use (max 2-3 per post, only if they add clarity, NONE in the hook)' : '- NO emojis anywhere in the post'}
- NO external links in the post body (say "link in comments" if needed)
${ctaGuidance ? `- CTA guidance: ${ctaGuidance}` : '- CTA: end with a specific, low-friction question the reader actually wants to answer — NEVER "Thoughts?" or "Agree?"'}

DO:
- Lead with a specific, concrete detail (a number, a tool name, a result)
- Include at least one "I tested/built/saw" moment (frame as first-person experience)
- Use line breaks aggressively — LinkedIn is mobile-first
- Write hooks that create an information gap — reader MUST click "see more" for the payoff
- Ground opinions in evidence — cite a source, a benchmark, or a personal observation
- Reference specific tools by name (Claude, GPT-4, Make.com, n8n) — specificity builds credibility
- Vary sentence length — mix short punchy lines with longer explanatory ones

DON'T:
- Start with "In today's world..." / "AI is transforming..." / "As we all know..."
- Use passive voice in the hook
- Write content that could have been written in 2022 — it must feel current
- Include more than one main idea
- Talk AT the audience instead of WITH them
- Use "I" more than 3 times in the first 3 sentences
- Pad with transition phrases ("That being said," "At the end of the day," "Moving forward")
- Use these buzzwords: leverage, synergies, game-changer, disrupt, unlock, transformative, seamlessly

AVOID THESE AUTOMATIC FAIL CONDITIONS:
- Generic hook that could apply to any industry
- No specific example, number, or concrete detail anywhere in the post
- CTA that is "Thoughts?" / "Agree?" / "What do you think?"
- More than 3 buzzwords (leverage, synergy, game-changer, disrupt, unlock)
- Reads like a sales pitch

LINKEDIN ALGORITHM AWARENESS:
- First 2 lines are everything — the hook must work in isolation
- Write to provoke comments, not just likes — controversial (but defensible) takes perform better
- Use narrative tension and information gaps to keep people reading (dwell time matters)
- Native text currently outperforms image posts — write as if the text is the primary asset

BEFORE YOU RETURN THE POST — SELF-CHECK (fix any failures before returning):
□ Count the first line character by character. Is it under ${hookChars} characters? If not, shorten it.
□ Count the entire post character by character. Is total length between ${minChars} and ${maxChars}? If not, expand or trim.
□ Read the CTA (last line before hashtags). Does it say "Thoughts?", "Agree?", or "What do you think?" — if yes, replace it with a specific question tied to the topic.
□ Scan for: leverage, synergy, game-changer, disrupt, unlock, transformative. If 2+ appear, remove them.
□ Find the most specific example, number, or tool name in the post. If there isn't one, add it.

Return ONLY the post content. No preamble, no metadata, no explanations. Do NOT include a self-check report.`

    return await this.callAnthropicAPI(prompt, 2048)
  }

  // ─── Stage 5: Image Prompt ────────────────────────────────────────────────

  private async generateImagePrompt(
    topic: string,
    content: string,
    pillar: string,
    settings?: PipelineSettings
  ): Promise<ImagePromptOutput> {
    const extraReqs = settings?.imageExtraRequirements || ''

    const recentModesNote = settings?.recentModes?.length
      ? `\nRECENT MODES USED (do NOT repeat the immediately prior mode; avoid using the same mode more than once per 3 posts): ${settings.recentModes.slice(-3).join(', ')}`
      : ''

    const prompt = `You are an image art director for an AI & automation LinkedIn content brand. Select the best visual mode from the 6 below, write a complete Stable Diffusion prompt for it, and return JSON.

POST TOPIC: "${topic}"
CONTENT PILLAR: ${pillar}
FULL POST:
"${content}"${recentModesNote}

━━━ THE 6 VISUAL MODES ━━━

MODE 1: EDITORIAL PHOTO
Best for: team collaboration, client story posts, human element is the point.
Connection: The scenario depicted matches the post scenario — people, body language, environment ARE the story. Do NOT rely on screen content.
Prompt template: [Scene matching post scenario], [specific body language], [environment context], modern bright office with natural light, photorealistic, RAW photo, [lens spec], shallow depth of field, editorial photography, natural candid moment, 8K UHD
Negative: (text:1.5), (words:1.5), (letters:1.5), watermark, logo, illustration, cartoon, stock photo pose, looking at camera, fake smile, staged, bad anatomy, deformed hands, blurry, low quality, oversaturated, dark moody, cyberpunk, neon, fantasy

MODE 2: CLEAN DIAGRAM
Best for: process/workflow, framework, system architecture, steps and connections.
Connection: The diagram IS the post's concept visualized. Viewer sees structure and immediately understands the post's framework.
Prompt template: Clean technical diagram on a dark [navy/charcoal] background, [specific diagram — nodes, arrows, flow, layout], modern flat design with subtle depth and soft glowing accents, [2-3 color palette], minimalist infographic style, no photorealistic elements, sharp clean vector-like aesthetic, professional presentation quality, highly detailed, crisp lines, 8K
Negative: text, words, readable labels, letters, numbers, photorealistic, people, faces, hands, office, desk, 3D render, cartoon, busy, cluttered, blurry, low quality, watermark

MODE 3: VISUAL METAPHOR (Concrete, Not Abstract)
Best for: posts with a specific analogy in the hook, contrast posts, cautionary posts, one vivid image captures the whole idea.
Connection: The metaphor is OBVIOUS — one mental leap maximum. If you must explain it, pick something simpler.
Prompt template: [Concrete metaphor object described in vivid detail], [setting grounding it in professional/tech context], photorealistic with slightly heightened dramatic lighting, [lighting emphasizing the metaphor], clean composition with strong focal point, shot on [lens spec], [depth of field], cinematic quality, editorial photography, 8K UHD
Negative: text, words, letters, watermark, logo, cartoon, illustration, abstract art, digital art, bad anatomy, deformed, blurry, low quality, oversaturated, busy background, cluttered

MODE 4: BOLD DATA VISUAL
Best for: ROI/results posts with a key number, benchmark/performance posts, trend posts.
Connection: The data visual represents the post's key metric or trend directly. No axis labels — bar heights and color tell the story.
Prompt template: Stylized [chart/graph type] data visualization, [specific description of data pattern], [color palette matching the data story], dark [navy/charcoal/black] background, modern data visualization design aesthetic, clean geometric shapes with subtle glow and shadow effects, minimalist with high visual impact, no axis labels no readable text just pure visual data shapes, professional presentation quality, crisp edges, 8K
Negative: text, words, letters, numbers, labels, axis labels, readable characters, photorealistic, people, faces, office, 3D render, cartoon, blurry, low quality, watermark, busy, too many elements

MODE 5: SPLIT FRAME
Best for: before/after transformation, comparison posts, old vs. new contrast.
Connection: Each half represents one side of the post's argument. Visual contrast between halves IS the message.
Prompt template: Split-frame image divided vertically down the center, left half shows [the "before" or "bad" state described vividly], right half shows [the "after" or "good" state described vividly], [left half — desaturated/warm/chaotic visual treatment], [right half — vibrant/cool/clean visual treatment], the contrast between the two halves is stark and immediate, [photorealistic or illustrated], clean composition, professional quality, 8K
Negative: (text:1.5), (words:1.5), (letters:1.5), watermark, logo, cartoon, bad anatomy, deformed, blurry, low quality, no clear division between halves

MODE 6: ICONIC OBJECT
Best for: posts centered on a specific tool or concept, minimalist single-point posts, pattern-breaking feed variety.
Connection: The object IS the concept, or directly represents the key tool/idea.
Prompt template: [Single object described in detail] photographed on a [clean background], dramatic [lighting type] creating strong shadows and highlights, the object is the sole focal point centered in the frame, [material/texture details], product photography style, shot on macro lens, very shallow depth of field, studio quality, photorealistic, high-end commercial photography aesthetic, 8K UHD
Negative: text, words, letters, watermark, logo, multiple objects, busy background, people, hands holding the object, cartoon, illustration, blurry, low quality, flat lighting

━━━ MODE SELECTION LOGIC ━━━

Step 1 — Check for natural fit:
  Does the hook use a specific analogy or metaphor? → Mode 3 (Visual Metaphor) — depict it literally
  Does the post describe a step-by-step process or framework? → Mode 2 (Clean Diagram)
  Does the post explicitly contrast two things (before/after, A vs B)? → Mode 5 (Split Frame)
  Does the post lead with a dramatic number or metric? → Mode 4 (Bold Data Visual)
  Is the post a story about a person, team, or client? → Mode 1 (Editorial Photo)
  Is it a single sharp philosophical point? → Mode 6 (Iconic Object) or Mode 3

Step 2 — Check rotation: avoid repeating the immediately prior mode; aim for variety across 3 posts.

Step 3 — Defaults: process/tip posts → Mode 2; story posts → Mode 1; any number present → Mode 4.

━━━ UNIVERSAL RULES ━━━
- 3-Second Rule: image must communicate ONE clear idea — topic, concept, OR emotional tone
- ABSOLUTE: No readable text in any generated image. Period. If text is needed to make it work, the concept is wrong.
- Color palette: dark navy (#0F172A) or charcoal bg + teal (#00BCD4) / amber (#FFB300) / green (#4CAF50) / red (#EF5350) accents
- The "What's This Post About?" test: stranger sees only this image + first line of post → do they get the gist?
${extraReqs ? `\nADDITIONAL REQUIREMENTS: ${extraReqs}` : ''}

━━━ QC — SCORE 1-10 (average must be 7+) ━━━
Post Connection | 3-Second Clarity | Scroll-Stop Power | Text-Free | Mode Appropriateness | Feed Variety

Auto-fail (regenerate immediately if any apply):
- Any visible text artifacts
- Image could be swapped onto a different post and still make sense
- Multi-leap abstract metaphor (trees for growth, galaxies for scale, etc.)
- Same visual mode as the immediately preceding post
- Mood mismatch (dark/dystopian for positive post, bright/upbeat for cautionary)

Return ONLY a JSON object (no markdown, no explanation):
{
  "selectedMode": "Mode N: NAME",
  "modeRationale": "one sentence why this mode fits this specific post",
  "prompt": "full SD prompt following the mode's template",
  "negativePrompt": "mode-specific negatives combined with universal text suppression",
  "aspectRatio": "1:1",
  "resolution": "1080x1080",
  "format": "JPEG",
  "cfgScale": 7,
  "steps": 40,
  "sampler": "DPM++ 2M Karras"
}`

    const text = await this.callAnthropicAPI(prompt, 1536)
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return {
        prompt: text.substring(0, 500),
        negativePrompt: UNIVERSAL_NEGATIVE_PROMPT,
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'JPEG',
        cfgScale: 7,
        steps: 40,
        sampler: 'DPM++ 2M Karras',
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      // Always ensure universal negatives are included — model may omit them
      const negativePrompt = parsed.negativePrompt
        ? `${parsed.negativePrompt}, ${UNIVERSAL_NEGATIVE_PROMPT}`
        : UNIVERSAL_NEGATIVE_PROMPT

      return {
        prompt: parsed.prompt || text.substring(0, 500),
        negativePrompt,
        aspectRatio: parsed.aspectRatio || '1:1',
        resolution: parsed.resolution || '1080x1080',
        format: parsed.format || 'JPEG',
        cfgScale: parsed.cfgScale ?? 7,
        steps: parsed.steps ?? 40,
        sampler: parsed.sampler || 'DPM++ 2M Karras',
        selectedMode: parsed.selectedMode || undefined,
      }
    } catch {
      return {
        prompt: text.substring(0, 500),
        negativePrompt: UNIVERSAL_NEGATIVE_PROMPT,
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'JPEG',
        cfgScale: 7,
        steps: 40,
        sampler: 'DPM++ 2M Karras',
      }
    }
  }

  // ─── Stage 6: Quality Control ─────────────────────────────────────────────

  private async qualityControl(
    content: string,
    framework: string,
    settings?: PipelineSettings,
    imagePrompt?: string
  ): Promise<{ compliant: boolean; score: number; issues: string[]; autoFailed: boolean; imageAlignmentFailed: boolean }> {
    // Cap at 7.0 max — scoring above this causes consistent first-attempt failures
    // since Claude's self-evaluation calibration clusters 7-8 for good content
    const minScore = Math.min(settings?.qualityMinScore ?? 7, 7.0)

    const imageAlignmentSection = imagePrompt ? `
IMAGE PROMPT TO EVALUATE:
"${imagePrompt}"

7. Image-Post Alignment (1-10): Can a stranger shown ONLY the image (no post text) write a 5-word caption that roughly matches the post topic?
  Scoring guide:
  9-10: Image directly depicts elements named in the post. Zero ambiguity.
  7-8: Clear one-leap metaphor — most viewers get it quickly.
  5-6: Thematically related but requires thought to connect. Risky.
  3-4: Metaphor buried — aesthetically consistent but disconnected (e.g. glowing tree for "automation stacking").
  1-2: No discernible connection to the post content.
  Score 7+ if a workplace-adjacent viewer can connect image to topic in one step. Score below 7 if it requires 2+ mental leaps.` : ''

    const prompt = `Evaluate this LinkedIn post for quality. Score each criterion 1-10 using the calibration scale below.

POST:
"${content}"

Framework used: ${framework}
Character count: ${content.length}

SCORING SCALE (use this as your reference — do not be harsher than this):
5 = mediocre, typical generic AI content
6 = below average, serviceable but forgettable
7 = good quality, would perform well on LinkedIn — this is the target baseline
8 = high quality, outperforms most posts in this category
9 = excellent, top 10% of LinkedIn content
10 = near perfect, rarely achievable — only for genuinely exceptional posts

Score 7 or above if the criterion is solidly met. Score 8+ only if it's genuinely exceptional. Do not default to 6 for average performance — if it meets the criterion, score it at least 7.

SCORING CRITERIA:
1. Hook Power (1-10): Does the first line stop the scroll? Is it specific, unexpected, or pattern-breaking? Score 7 if it's specific and non-generic. Score 8+ if it's genuinely surprising or pattern-breaking.
2. Value Density (1-10): Does every sentence earn its place? Score 7 if there's minimal filler. Score 8+ if every single sentence adds new information.
3. Engagement Potential (1-10): Is this written to provoke saves, comments, and shares? Score 7 if it has a solid CTA and interesting take. Score 8+ if it's genuinely thought-provoking.
4. CTA Strength (1-10): Does it end with a specific ask the reader wants to respond to? Score 7 if it's a real question tied to the topic. Score 8+ if it's creative and highly specific.
5. Tone Authenticity (1-10): Does it sound like a practitioner with real experience? Score 7 if it's conversational and grounded. Score 8+ if it has unmistakably human, experience-based voice.
6. Length Compliance (1-10): The post is ${content.length} characters. Hook should be ≤210 chars, total 1300–1900. Score 10 if all constraints are hit. Score 7 if length is within 10% of range. Score 5 if significantly out of range.
${imageAlignmentSection}

AUTOMATIC FAIL CONDITIONS (only trigger if clearly and obviously violated — do not over-apply):
- Hook is completely generic with zero specificity AND could apply to literally any industry → autoFail: true
- Post contains ZERO specific examples, numbers, tool names, or concrete details anywhere → autoFail: true
- CTA is literally and exactly "Thoughts?" or "Agree?" or "What do you think?" (not variations) → autoFail: true
- Post contains 4+ of these exact buzzwords: leverage, synergy, game-changer, disrupt, unlock → autoFail: true
- Post is explicitly promoting a product/service and reads as an ad → autoFail: true

Return ONLY a JSON object:
{
  "scores": {
    "hookPower": number,
    "valueDensity": number,
    "engagementPotential": number,
    "ctaStrength": number,
    "toneAuthenticity": number,
    "lengthCompliance": number${imagePrompt ? ',\n    "imageAlignment": number' : ''}
  },
  "score": number (average of all ${imagePrompt ? '7' : '6'} criteria),
  "autoFail": boolean,
  "autoFailReasons": ["list any triggered automatic fail conditions"],
  "issues": ["list specific, actionable issues — map each to a criterion name"]
}`

    const text = await this.callAnthropicAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { compliant: true, score: 8.5, issues: [], autoFailed: false, imageAlignmentFailed: false }
    }

    try {
      const result = JSON.parse(jsonMatch[0])
      const autoFailed = result.autoFail === true
      const score = typeof result.score === 'number' ? result.score : 8.5
      const compliant = !autoFailed && score >= minScore
      const imageAlignmentScore = result.scores?.imageAlignment
      const imageAlignmentFailed = imagePrompt !== undefined && typeof imageAlignmentScore === 'number' && imageAlignmentScore < 7
      return {
        compliant,
        score,
        issues: result.issues || result.autoFailReasons || [],
        autoFailed,
        imageAlignmentFailed,
      }
    } catch {
      return { compliant: true, score: 8.5, issues: [], autoFailed: false, imageAlignmentFailed: false }
    }
  }

  // ─── Stage 7: RCA / Improve ───────────────────────────────────────────────

  private async improveContent(
    content: string,
    issues: string[],
    framework: string,
    profile: UserProfile,
    settings?: PipelineSettings
  ): Promise<string> {
    const tone = settings?.topicTone || profile.tone || 'practitioner'

    const diagnosisMap: Record<string, string> = {
      'hook': 'Hook Power is low → Rewrite the first line ONLY. Make it specific, unexpected, or pattern-breaking. Max 210 characters. No passive voice.',
      'value': 'Value Density is low → Remove filler sentences. Every sentence must add new, specific information. Cut anything that restates what was already said.',
      'engagement': 'Engagement Potential is low → Rewrite the CTA with a specific, interesting question that a real practitioner would want to answer.',
      'cta': 'CTA Strength is low → Replace the ending. Never use "Thoughts?" or "Agree?". Ask a specific, low-friction question tied to the post topic.',
      'tone': 'Tone Authenticity is low → Add one first-person practitioner detail: a specific tool you used, a number you saw, a scenario you encountered.',
      'length': 'Length Compliance is low → Adjust to hit 1300–1900 characters. Hook must be under 210 characters. Use short paragraphs with line breaks.',
    }

    // Build targeted fix instructions from issues
    const fixInstructions = issues.map(issue => {
      const lowerIssue = issue.toLowerCase()
      for (const [key, instruction] of Object.entries(diagnosisMap)) {
        if (lowerIssue.includes(key)) return instruction
      }
      return `Fix: ${issue}`
    })

    const prompt = `Improve this LinkedIn post. Fix ONLY the specific issues identified. Do NOT rewrite the entire post.

ORIGINAL POST:
"${content}"

Framework: ${framework}
Tone: ${tone}

ISSUES TO FIX (targeted — do not change anything else):
${fixInstructions.map((f, i) => `${i + 1}. ${f}`).join('\n')}

RULES:
- Make surgical fixes only — preserve the structure and voice of what works
- Do not introduce new buzzwords: leverage, synergy, game-changer, disrupt, unlock
- Keep hashtags as the final line, separated by a blank line
- Total length must stay 1300–1900 characters
- Hook must stay under 210 characters

Return ONLY the improved post content. No preamble or explanations.`

    return await this.callAnthropicAPI(prompt, 2048)
  }
}
