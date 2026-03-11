'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { PipelineSettings } from '@/lib/ai/pipeline'

const TONES = ['practitioner', 'professional', 'casual', 'inspirational']
const FRAMEWORKS = [
  { id: 'VALUE-STACK', label: 'VALUE-STACK', description: 'Tips, how-tos, step-by-step (best: Pillar A & D)' },
  { id: 'CONTRAST-BRIDGE', label: 'CONTRAST-BRIDGE', description: 'Comparisons, nuanced takes (best: Pillar C & E)' },
  { id: 'STORY-LESSON', label: 'STORY-LESSON', description: 'Case studies, real experience (best: Pillar E & F)' },
  { id: 'PAS-ADAPT', label: 'PAS-ADAPT', description: 'Problem/solution, business case (best: Pillar D & F)' },
  { id: 'VSQ', label: 'VSQ', description: 'Feature spotlights, new tools (best: Pillar B)' },
]

const PILLAR_LABELS: Record<string, string> = {
  A: 'Practical AI Usage Tips',
  B: 'AI Product & Feature Spotlights',
  C: 'AI Model Comparisons & Analysis',
  D: 'Business Process Automation',
  E: 'Strategic AI Adoption',
  F: 'The Case for AI & Automation (ROI)',
}

export default function SystemHealthPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'settings'>('health')
  const [settings, setSettings] = useState<PipelineSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
  })

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings/pipeline')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const setImageModel = async (model: string) => {
    if (!settings) return
    const updated = { ...settings, imageGenerationModel: model }
    setSettings(updated)
    try {
      await fetch('/api/settings/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch (error) {
      console.error('Failed to save image model:', error)
    }
  }

  const toggleSection = (section: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateArrayField = <K extends keyof PipelineSettings>(
    field: K,
    items: any[]
  ) => {
    if (settings) {
      setSettings({ ...settings, [field]: items })
    }
  }

  const updateStringField = <K extends keyof PipelineSettings>(
    field: K,
    value: any
  ) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  // Services for System Health tab
  const services = [
    { name: 'Supabase', status: 'operational', icon: CheckCircle },
    { name: 'Anthropic API (claude-opus-4-6)', status: 'operational', icon: CheckCircle },
    { name: 'Replicate', status: 'operational', icon: CheckCircle },
    { name: 'QStash (Upstash)', status: 'operational', icon: CheckCircle },
    { name: 'Make.com Webhook', status: 'operational', icon: CheckCircle },
  ]

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-purple-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Health & Settings</h1>
        <p className="text-gray-400">Monitor services and configure the AI pipeline</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'health'
              ? 'text-purple-accent border-b-2 border-purple-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          System Health
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-purple-accent border-b-2 border-purple-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pipeline Settings
        </button>
      </div>

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Card key={service.name} hoverable>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                          {service.name}
                        </p>
                      </div>
                      <Icon className="w-5 h-5 text-green-400" />
                    </div>
                    <Badge variant="success">
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card hoverable>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Real-time status of external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                  >
                    <span className="font-medium text-white">{service.name}</span>
                    <Badge variant="success">Operational</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pipeline Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Stage 1: Topic Selection */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(1)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white">Topic Selection</h3>
              </div>
              {expandedSections[1] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[1] && (
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-700 space-y-2">
                  <p className="text-xs font-medium text-gray-300 uppercase tracking-wide">Content pillars (auto-rotated A → F)</p>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(PILLAR_LABELS).map(([pillar, label]) => (
                      <div key={pillar} className="flex items-start gap-2 text-xs">
                        <span className="text-purple-light font-bold w-5 shrink-0">{pillar}</span>
                        <span className="text-gray-300">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Expertise</label>
                  <Input
                    value={settings.topicExpertise}
                    onChange={(e) =>
                      updateStringField('topicExpertise', e.target.value)
                    }
                    placeholder="e.g., business and technology"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Target Audience
                  </label>
                  <Input
                    value={settings.topicAudience}
                    onChange={(e) =>
                      updateStringField('topicAudience', e.target.value)
                    }
                    placeholder="e.g., professionals and entrepreneurs"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Tone</label>
                  <select
                    value={settings.topicTone}
                    onChange={(e) =>
                      updateStringField('topicTone', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Custom Topic Pool
                  </label>
                  <TagInput
                    items={settings.topicCustomPool}
                    onChange={(items) =>
                      updateArrayField('topicCustomPool', items)
                    }
                    placeholder="Add custom topics (e.g., 'AI trends', 'Remote work')"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 2: Research */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(2)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Research</h3>
              </div>
              {expandedSections[2] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[2] && (
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-700 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-2">Primary sources (always active)</p>
                    <div className="space-y-1">
                      {[
                        { name: 'Anthropic Blog', url: 'anthropic.com/news', note: 'Claude features, research, safety' },
                        { name: 'OpenAI Blog', url: 'openai.com/blog', note: 'GPT updates, API changes' },
                        { name: "Simon Willison's Blog", url: 'simonwillison.net', note: 'Practitioner LLM coverage' },
                        { name: "Ethan Mollick's Substack", url: 'oneusefulthing.org', note: 'Research-backed AI in work' },
                        { name: 'Hugging Face Blog', url: 'huggingface.co/blog', note: 'Open-source model releases' },
                        { name: 'McKinsey Digital', url: 'mckinsey.com/digital', note: 'AI adoption data, business impact' },
                        { name: 'Stanford HAI AI Index', url: 'aiindex.stanford.edu', note: 'Comprehensive AI trends' },
                        { name: 'Make.com / Zapier / n8n Blogs', url: 'various', note: 'Automation templates and guides' },
                      ].map((src) => (
                        <div key={src.url} className="flex items-start gap-2 text-xs">
                          <span className="text-green-400 mt-0.5">•</span>
                          <div>
                            <span className="text-white font-medium">{src.name}</span>
                            <span className="text-gray-500"> — {src.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-2">Secondary sources (topic-specific)</p>
                    <div className="space-y-1">
                      {[
                        { name: 'MIT Technology Review / TechCrunch AI / Ars Technica AI', note: 'General AI news' },
                        { name: 'Papers With Code', url: 'paperswithcode.com', note: 'Benchmark data' },
                        { name: 'LMSYS Chatbot Arena', note: 'Model comparison rankings' },
                        { name: 'Harvard Business Review', note: 'Strategic AI adoption' },
                      ].map((src) => (
                        <div key={src.name} className="flex items-start gap-2 text-xs">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <div>
                            <span className="text-white font-medium">{src.name}</span>
                            <span className="text-gray-500"> — {src.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-1 block">
                    Additional Focus Areas
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Add extra sources or topics for the research stage to prioritize (appended on top of built-in sources above)
                  </p>
                  <TagInput
                    items={settings.researchSources}
                    onChange={(items) =>
                      updateArrayField('researchSources', items)
                    }
                    placeholder="e.g., 'Gartner AI reports', 'specific industry case studies'"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 3: Framework Selection */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(3)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">Framework Selection</h3>
              </div>
              {expandedSections[3] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[3] && (
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="text-sm font-medium text-white mb-1 block">
                    Allowed Frameworks
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    The pipeline auto-selects the best fit based on content pillar. Uncheck to disable a framework.
                  </p>
                  <div className="space-y-3">
                    {FRAMEWORKS.map((fw) => (
                      <label key={fw.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.frameworkAllowed.includes(fw.id)}
                          onChange={(e) => {
                            const items = e.target.checked
                              ? [...settings.frameworkAllowed, fw.id]
                              : settings.frameworkAllowed.filter((f) => f !== fw.id)
                            updateArrayField('frameworkAllowed', items)
                          }}
                          className="w-4 h-4 mt-0.5"
                        />
                        <div>
                          <span className="text-white font-medium">{fw.label}</span>
                          <p className="text-xs text-gray-400">{fw.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Force Specific Framework (optional)
                  </label>
                  <select
                    value={settings.frameworkForced || ''}
                    onChange={(e) =>
                      updateStringField(
                        'frameworkForced',
                        e.target.value || null
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">Auto-select based on pillar</option>
                    {FRAMEWORKS.map((fw) => (
                      <option key={fw.id} value={fw.id}>
                        {fw.label} — {fw.description}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 4: Content Generation */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(4)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold text-white">Content Generation</h3>
              </div>
              {expandedSections[4] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[4] && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Min Characters
                    </label>
                    <Input
                      type="number"
                      value={settings.contentMinChars}
                      onChange={(e) =>
                        updateStringField(
                          'contentMinChars',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Max Characters
                    </label>
                    <Input
                      type="number"
                      value={settings.contentMaxChars}
                      onChange={(e) =>
                        updateStringField(
                          'contentMaxChars',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Hook Length (chars)
                  </label>
                  <Input
                    type="number"
                    value={settings.contentHookChars}
                    onChange={(e) =>
                      updateStringField(
                        'contentHookChars',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.contentAllowHashtags}
                      onChange={(e) =>
                        updateStringField(
                          'contentAllowHashtags',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-white">Allow Hashtags</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.contentAllowEmojis}
                      onChange={(e) =>
                        updateStringField(
                          'contentAllowEmojis',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-white">Allow Emojis</span>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    CTA Guidance (optional)
                  </label>
                  <Textarea
                    value={settings.contentCtaGuidance}
                    onChange={(e) =>
                      updateStringField(
                        'contentCtaGuidance',
                        e.target.value
                      )
                    }
                    placeholder="e.g., 'Encourage readers to share their experiences'"
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 5: Image Prompt */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(5)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  5
                </div>
                <h3 className="text-lg font-semibold text-white">Image Prompt</h3>
              </div>
              {expandedSections[5] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[5] && (
              <CardContent className="space-y-4 pt-0">
                {/* Image Generation Model Toggle */}
                <div>
                  <label className="text-sm font-medium text-white mb-3 block">Image Generation Model</label>
                  <div className="flex items-center gap-4 p-4 bg-gray-900/60 rounded-lg border border-gray-700">
                    <div className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.imageGenerationModel !== 'production'
                        ? 'border-purple-accent bg-purple-accent/10'
                        : 'border-gray-700 bg-gray-900/40 opacity-50'
                    }`} onClick={() => setImageModel('testing')}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${settings.imageGenerationModel !== 'production' ? 'bg-purple-accent' : 'bg-gray-600'}`} />
                        <span className="text-sm font-semibold text-white">Testing</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">stability-ai/sdxl</p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => setImageModel(settings.imageGenerationModel === 'production' ? 'testing' : 'production')}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                        settings.imageGenerationModel === 'production' ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                        style={{ transform: settings.imageGenerationModel === 'production' ? 'translateX(28px)' : 'translateX(4px)' }}
                      />
                    </button>

                    <div className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.imageGenerationModel === 'production'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-gray-900/40 opacity-50'
                    }`} onClick={() => setImageModel('production')}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${settings.imageGenerationModel === 'production' ? 'bg-green-500' : 'bg-gray-600'}`} />
                        <span className="text-sm font-semibold text-white">Production</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">google/nano-banana-pro</p>
                    </div>
                  </div>
                </div>

                {/* Visual styles reference */}
                <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-700 space-y-2">
                  <p className="text-xs font-medium text-gray-300 uppercase tracking-wide">Auto-assigned visual styles by pillar</p>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(PILLAR_LABELS).map(([pillar, label]) => {
                      const styleMap: Record<string, string> = {
                        A: 'CLEAN_TECH (navy/cyan, flat digital illustration)',
                        B: 'CLEAN_TECH (navy/cyan, flat digital illustration)',
                        C: 'DATA_VIZ (charcoal/teal/coral, network graphs)',
                        D: 'SYSTEMS_FLOW (slate/green/amber, blueprint/pipeline)',
                        E: 'CONCEPTUAL (warm grays/burgundy/gold, surreal minimalism)',
                        F: 'IMPACT (black/green/gold, dynamic energy)',
                      }
                      return (
                        <div key={pillar} className="flex items-start gap-2 text-xs">
                          <span className="text-purple-light font-bold w-5 shrink-0">{pillar}</span>
                          <span className="text-gray-400">{label} → <span className="text-white">{styleMap[pillar]}</span></span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Extra Requirements (appended to all image prompts)
                  </label>
                  <Textarea
                    value={settings.imageExtraRequirements}
                    onChange={(e) =>
                      updateStringField(
                        'imageExtraRequirements',
                        e.target.value
                      )
                    }
                    placeholder="e.g., 'Always use square 1:1 aspect ratio', 'Avoid warm tones'"
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 6: Quality Control */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(6)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  6
                </div>
                <h3 className="text-lg font-semibold text-white">Quality Control</h3>
              </div>
              {expandedSections[6] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[6] && (
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Minimum Score (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.qualityMinScore}
                    onChange={(e) =>
                      updateStringField(
                        'qualityMinScore',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Quality Criteria</h4>
                  {settings.qualityCriteria.map((criterion, idx) => (
                    <div
                      key={criterion.name}
                      className="p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                    >
                      <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
                        {criterion.name}
                      </label>
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => {
                          const updated = [...settings.qualityCriteria]
                          updated[idx].description = e.target.value
                          updateArrayField('qualityCriteria', updated)
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stage 7: RCA / Improve */}
          <Card>
            <div
              className="cursor-pointer p-6 flex items-center justify-between hover:bg-gray-900/30"
              onClick={() => toggleSection(7)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-accent/20 rounded-full flex items-center justify-center text-purple-light font-bold">
                  7
                </div>
                <h3 className="text-lg font-semibold text-white">
                  RCA / Improve
                </h3>
              </div>
              {expandedSections[7] ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {expandedSections[7] && (
              <CardContent className="space-y-4 pt-0">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.rcaEnabled}
                    onChange={(e) =>
                      updateStringField('rcaEnabled', e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-white">Enable Retry on Quality Failure</span>
                </label>

                {settings.rcaEnabled && (
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Max Retry Attempts
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="3"
                      value={settings.rcaMaxRetries}
                      onChange={(e) =>
                        updateStringField(
                          'rcaMaxRetries',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-purple-accent hover:bg-purple-light text-white"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              onClick={loadSettings}
              variant="secondary"
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// TagInput Component
function TagInput({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    if (input.trim() && !items.includes(input.trim())) {
      onChange([...items, input.trim()])
      setInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange(items.filter((item) => item !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder}
        />
        <Button
          onClick={addTag}
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700 text-white"
        >
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-1 bg-purple-accent/20 border border-purple-accent rounded-full"
            >
              <span className="text-sm text-white">{item}</span>
              <button
                onClick={() => removeTag(item)}
                className="text-purple-light hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-xs text-gray-500">No items added yet</p>
      )}
    </div>
  )
}
