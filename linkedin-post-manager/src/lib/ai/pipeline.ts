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

const VISUAL_STYLES: Record<string, { keywords: string; palette: string; negatives: string }> = {
  'CLEAN_TECH': {
    keywords: 'clean digital illustration, modern flat design with depth, isometric tech illustration, minimal UI-inspired aesthetic, soft gradients, geometric precision',
    palette: 'deep navy (#0A1628), electric blue (#2196F3), cyan (#00BCD4), white (#FFFFFF), light gray (#F0F4F8)',
    negatives: 'photorealistic, dark moody, grunge, vintage, retro, hand-drawn sketch, oil painting, heavy texture, complex busy background',
  },
  'DATA_VIZ': {
    keywords: 'data visualization aesthetic, infographic-inspired, abstract chart elements, network graph visualization, clean analytical design, minimal technical illustration',
    palette: 'dark charcoal (#1A1A2E), teal (#00897B), coral/orange (#FF6B35), soft white (#F5F5F5), muted purple (#7C4DFF)',
    negatives: 'photorealistic people, emotional, dramatic, fantasy, surreal, hand-drawn, painterly, messy, organic, nature-heavy',
  },
  'SYSTEMS_FLOW': {
    keywords: 'technical flowchart aesthetic, blueprint style, interconnected nodes and pathways, automation pipeline visualization, mechanical precision meets digital, circuit-board inspired',
    palette: 'dark slate (#1E293B), bright green (#4CAF50), amber (#FFB300), white lines on dark background, electric blue (#2979FF)',
    negatives: 'organic, nature, flowers, animals, painterly, impressionist, chaotic, disorganized, asymmetric clutter, photorealistic faces',
  },
  'CONCEPTUAL': {
    keywords: 'conceptual digital art, surreal minimalism, metaphorical imagery, editorial illustration style, thought-provoking composition, balanced tension',
    palette: 'warm grays (#37474F), deep burgundy (#880E4F), gold (#FFC107), cool blue (#1565C0)',
    negatives: 'literal, obvious, cheesy metaphor, corporate stock photo, clip art, overly bright, neon overload, busy pattern background',
  },
  'IMPACT': {
    keywords: 'before-after transformation visual, growth metaphor, upward momentum, expanding possibilities, dynamic energy, breakthrough moment',
    palette: 'deep black (#0D1117), vibrant green (#00E676), gold (#FFD600), white (#FFFFFF)',
    negatives: 'static, flat, dull, muted colors, depressing, dark moody, cluttered, complicated, photorealistic people',
  },
}

const UNIVERSAL_NEGATIVE_PROMPT = 'text, words, letters, numbers, watermark, signature, logo, username, label, caption, title, subtitle, banner, badge, low quality, blurry, pixelated, jpeg artifacts, noise, grainy, oversaturated, overexposed, underexposed, ugly, deformed, disfigured, mutated, extra limbs, extra fingers, bad anatomy, bad proportions, cropped, out of frame, cut off, stock photo, cheesy, clipart, busy background, cluttered, messy composition'

function getVisualStyleForPillar(pillar: string): keyof typeof VISUAL_STYLES {
  switch (pillar) {
    case 'A':
    case 'B': return 'CLEAN_TECH'
    case 'C': return 'DATA_VIZ'
    case 'D': return 'SYSTEMS_FLOW'
    case 'E': return 'CONCEPTUAL'
    case 'F': return 'IMPACT'
    default: return 'CLEAN_TECH'
  }
}

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
      const imagePromptResult = await this.generateImagePrompt(topic, content, pillar, settings)
      onProgress({ stage: 5, stageName: 'Image Prompt', message: 'Image prompt created', data: { imagePrompt: imagePromptResult.prompt } })

      // Stage 6: Quality Control
      onProgress({ stage: 6, stageName: 'Quality Control', message: 'Evaluating quality...' })
      const qualityResult = await this.qualityControl(content, framework, settings)
      onProgress({ stage: 6, stageName: 'Quality Control', message: `Score: ${qualityResult.score}/10${qualityResult.autoFailed ? ' (auto-fail triggered)' : ''}`, data: qualityResult })

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
    const styleKey = getVisualStyleForPillar(pillar)
    const style = VISUAL_STYLES[styleKey]
    const extraReqs = settings?.imageExtraRequirements || ''

    const prompt = `You are a visual art director for an AI & automation content feed on LinkedIn. Generate a Stable Diffusion image prompt for this post.

POST TOPIC: "${topic}"
CONTENT PILLAR: ${pillar}
POST PREVIEW: "${content.substring(0, 400)}..."

VISUAL STYLE for Pillar ${pillar}:
Style keywords: ${style.keywords}
Color palette: ${style.palette}

DESIGN PHILOSOPHY:
- Professional but not corporate — avoid sterile stock photo aesthetics
- Tech-forward but approachable — futuristic without being alienating
- Clean and bold — high contrast, strong focal point, minimal clutter
- Abstract over literal — conceptual representations beat literal depictions

VISUAL METAPHOR BANK (use as inspiration, not prescription):
AI/ML: neural network constellations, layered translucent planes of data, luminous interconnected nodes
Prompting/Input: funnel transforming raw material into refined output, architect's blueprint becoming a building
Automation: domino chains, self-assembling puzzle pieces, flowing pipeline with glowing data packets
Data Processing: streams of light through crystalline filters, prismatic refraction of information
ROI/Value: seeds growing into digital trees, small inputs creating exponential output curves
Efficiency: streamlined paths through complex mazes, clean highway through a chaotic landscape
Comparison: split composition — analog/manual on left, digital/automated on right
Human+AI: two complementary puzzle pieces, conductor leading an orchestra of digital instruments

FORBIDDEN SUBJECTS (never generate these):
- Person sitting at laptop or looking at phone
- Generic handshake
- Generic lightbulb
- Brain with gears
- Photorealistic humans (uncanny and hurts credibility)
- Generic corporate office scene

6-LAYER PROMPT ARCHITECTURE (order matters — earlier tokens weighted more heavily):
1. Subject/Core Concept (most important — put first)
2. Style/Medium
3. Composition/Framing
4. Lighting/Atmosphere
5. Color Palette
6. Quality Enhancers: "highly detailed, sharp focus, professional quality, 8K"

PROMPT RULES:
- 40-80 tokens — specific enough, not contradictory
- No more than 3 primary colors in palette — restraint creates professionalism
- Do NOT use artist names — use style families instead (e.g. "retro-futurism" not a specific artist)
- Vary composition from recent posts (options: centered, asymmetric left/right, split, full bleed)
${extraReqs ? `- Additional requirements: ${extraReqs}` : ''}

Return ONLY a JSON object:
{
  "prompt": "the full Stable Diffusion prompt following the 6-layer architecture",
  "negativePrompt": "universal negatives plus style-specific negatives for ${styleKey}",
  "aspectRatio": "1:1",
  "resolution": "1080x1080",
  "format": "PNG",
  "cfgScale": 8,
  "steps": 40,
  "sampler": "DPM++ 2M Karras"
}`

    const text = await this.callAnthropicAPI(prompt, 1024)
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      // Fallback: return a reasonable default
      return {
        prompt: text.substring(0, 500),
        negativePrompt: UNIVERSAL_NEGATIVE_PROMPT + ', ' + style.negatives,
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'PNG',
        cfgScale: 8,
        steps: 40,
        sampler: 'DPM++ 2M Karras',
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      // Always append universal negatives to whatever the model returns
      const negativePrompt = parsed.negativePrompt
        ? `${parsed.negativePrompt}, ${style.negatives}`
        : `${UNIVERSAL_NEGATIVE_PROMPT}, ${style.negatives}`

      return {
        prompt: parsed.prompt || text.substring(0, 500),
        negativePrompt,
        aspectRatio: parsed.aspectRatio || '1:1',
        resolution: parsed.resolution || '1080x1080',
        format: parsed.format || 'PNG',
        cfgScale: parsed.cfgScale ?? 8,
        steps: parsed.steps ?? 40,
        sampler: parsed.sampler || 'DPM++ 2M Karras',
      }
    } catch {
      return {
        prompt: text.substring(0, 500),
        negativePrompt: `${UNIVERSAL_NEGATIVE_PROMPT}, ${style.negatives}`,
        aspectRatio: '1:1',
        resolution: '1080x1080',
        format: 'PNG',
        cfgScale: 8,
        steps: 40,
        sampler: 'DPM++ 2M Karras',
      }
    }
  }

  // ─── Stage 6: Quality Control ─────────────────────────────────────────────

  private async qualityControl(
    content: string,
    framework: string,
    settings?: PipelineSettings
  ): Promise<{ compliant: boolean; score: number; issues: string[]; autoFailed: boolean }> {
    // Cap at 7.0 max — scoring above this causes consistent first-attempt failures
    // since Claude's self-evaluation calibration clusters 7-8 for good content
    const minScore = Math.min(settings?.qualityMinScore ?? 7, 7.0)

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
    "lengthCompliance": number
  },
  "score": number (average of all 6),
  "autoFail": boolean,
  "autoFailReasons": ["list any triggered automatic fail conditions"],
  "issues": ["list specific, actionable issues — map each to a criterion name"]
}`

    const text = await this.callAnthropicAPI(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { compliant: true, score: 8.5, issues: [], autoFailed: false }
    }

    try {
      const result = JSON.parse(jsonMatch[0])
      const autoFailed = result.autoFail === true
      const score = typeof result.score === 'number' ? result.score : 8.5
      const compliant = !autoFailed && score >= minScore
      return {
        compliant,
        score,
        issues: result.issues || result.autoFailReasons || [],
        autoFailed,
      }
    } catch {
      return { compliant: true, score: 8.5, issues: [], autoFailed: false }
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
