'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PipelineProgress {
  stage: number
  stageName: string
  message: string
  data?: any
}

export default function GeneratePostPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress[]>([])
  const [generatedPostId, setGeneratedPostId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [expertise, setExpertise] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [tone, setTone] = useState('professional')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setProgress([])
    setGeneratedPostId(null)
    setError(null)

    try {
      const response = await fetch('/api/generate/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertise: expertise || undefined,
          targetAudience: targetAudience || undefined,
          tone: tone || 'professional',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start generation')
      }

      // Read Server-Sent Events
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6))
            setProgress((prev) => [...prev, data])

            // Check if generation completed
            if (data.stage === 7 && data.data?.postId) {
              setGeneratedPostId(data.data.postId)
            }

            // Check for errors
            if (data.stage === -1) {
              setError(data.message)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post')
    } finally {
      setIsGenerating(false)
    }
  }

  const stageNames = [
    'Topic Selection',
    'Research',
    'Framework Selection',
    'Content Generation',
    'Image Prompt',
    'Quality Control',
    'Complete',
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Post Generator</h1>
          <p className="text-gray-400">Generate a LinkedIn post using AI (7-stage pipeline)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Configuration</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="expertise">Your Expertise (optional)</Label>
                <Input
                  id="expertise"
                  type="text"
                  placeholder="e.g., software engineering, product management"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience (optional)</Label>
                <Input
                  id="targetAudience"
                  type="text"
                  placeholder="e.g., tech professionals, startup founders"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="tone">Tone</Label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-accent focus:ring-2 focus:ring-purple-accent/20 transition-all"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                </select>
              </div>

              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Progress Panel */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Progress</h2>

            {progress.length === 0 && !error && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Click "Generate Post" to start</p>
              </div>
            )}

            {/* Progress Steps */}
            <div className="space-y-4">
              {stageNames.map((stageName, index) => {
                const stage = index + 1
                const stageProgress = progress.filter((p) => p.stage === stage)
                const isComplete = stageProgress.length > 0
                const isCurrent = isComplete && stage === progress[progress.length - 1]?.stage
                const latestMessage = stageProgress[stageProgress.length - 1]?.message

                return (
                  <div key={stage} className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-purple-accent/20 text-purple-accent'
                          : 'bg-gray-800 text-gray-600'
                      }`}
                    >
                      {isComplete ? (
                        isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )
                      ) : (
                        <span className="text-xs font-semibold">{stage}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isComplete ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {stageName}
                      </p>
                      {latestMessage && (
                        <p className="text-xs text-gray-400 mt-1">{latestMessage}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Error State */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Generation Failed</p>
                  <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {generatedPostId && (
              <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Post Generated!</p>
                    <p className="text-xs text-green-300 mt-1">
                      Your post has been created and is ready for review
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts/${generatedPostId}`} className="flex-1">
                    <Button variant="primary" className="w-full">
                      Edit Post
                    </Button>
                  </Link>
                  <Link href="/posts" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View All Posts
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
