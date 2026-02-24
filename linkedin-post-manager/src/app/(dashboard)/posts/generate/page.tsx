'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function GeneratePostPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setProgress([])
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() || undefined }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate post')
      }

      const data = await response.json()
      
      showToast('success', 'Post generated', 'Your AI-generated post is ready for review')
      
      // Redirect to the edit page for the newly created post
      if (data.post?.id) {
        router.push(`/posts/${data.post.id}`)
      } else {
        router.push('/posts')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate post'
      setError(errorMessage)
      showToast('error', 'Generation failed', errorMessage)
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Generate Post with AI</h1>
          <p className="text-gray-400">Let AI create a LinkedIn post for you</p>
        </div>
      </div>

      {/* Form */}
      <Card hoverable>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-accent" />
            AI Post Generator
          </CardTitle>
          <CardDescription>
            Provide a topic or leave blank for AI to choose
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic">
                Topic (Optional)
              </Label>
              <Input
                id="topic"
                type="text"
                placeholder="e.g., AI in Healthcare, Remote Work Tips..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500">
                Leave blank to let AI choose a trending topic
              </p>
            </div>

            {/* Progress Display */}
            {isGenerating && progress.length > 0 && (
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-3">Generation Progress:</h4>
                <div className="space-y-2">
                  {progress.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-purple-accent rounded-full animate-pulse" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isGenerating}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Post
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={isGenerating}
              >
                Cancel
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> AI generation uses a 7-stage pipeline to create high-quality 
                LinkedIn posts. This may take 1-2 minutes.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
