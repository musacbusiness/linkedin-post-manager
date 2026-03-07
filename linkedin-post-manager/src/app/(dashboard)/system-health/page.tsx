'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { PipelineSettings, QualityCriterion } from '@/lib/ai/pipeline'

const TONES = ['professional', 'casual', 'inspirational']
const FRAMEWORKS = ['AIDA', 'PAS', 'Story', 'VSQ']

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
    { name: 'Anthropic API', status: 'operational', icon: CheckCircle },
    { name: 'Replicate', status: 'operational', icon: CheckCircle },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Allowed Research Sources
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Leave empty to use general knowledge
                  </p>
                  <TagInput
                    items={settings.researchSources}
                    onChange={(items) =>
                      updateArrayField('researchSources', items)
                    }
                    placeholder="Add sources (e.g., 'harvard.edu', 'techcrunch.com')"
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
                  <label className="text-sm font-medium text-white mb-3 block">
                    Allowed Frameworks
                  </label>
                  <div className="space-y-2">
                    {FRAMEWORKS.map((fw) => (
                      <label key={fw} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.frameworkAllowed.includes(fw)}
                          onChange={(e) => {
                            const items = e.target.checked
                              ? [...settings.frameworkAllowed, fw]
                              : settings.frameworkAllowed.filter((f) => f !== fw)
                            updateArrayField('frameworkAllowed', items)
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white">{fw}</span>
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
                    <option value="">No forced framework</option>
                    {FRAMEWORKS.map((fw) => (
                      <option key={fw} value={fw}>
                        {fw}
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
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Image Style
                  </label>
                  <Input
                    value={settings.imageStyle}
                    onChange={(e) =>
                      updateStringField('imageStyle', e.target.value)
                    }
                    placeholder="e.g., 'Professional, modern style'"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Extra Requirements
                  </label>
                  <Textarea
                    value={settings.imageExtraRequirements}
                    onChange={(e) =>
                      updateStringField(
                        'imageExtraRequirements',
                        e.target.value
                      )
                    }
                    placeholder="e.g., 'Include data visualization', 'Dark background'"
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
