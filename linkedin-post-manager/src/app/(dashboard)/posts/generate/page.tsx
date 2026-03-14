'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useGenerationStore } from '@/store/generation-store'

export default function GeneratePostPage() {
  const router = useRouter()
  const { startGeneration, isGenerating } = useGenerationStore()

  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(1)

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    startGeneration(count, topic.trim())
    router.push('/posts')
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
          <p className="text-gray-400">Let AI create LinkedIn posts for you</p>
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
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic (Optional)</Label>
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

            {/* Count Input */}
            <div className="space-y-2">
              <Label>Number of Posts</Label>
              <input
                type="number"
                min={1}
                max={21}
                value={count}
                onChange={(e) => {
                  const val = Math.min(21, Math.max(1, parseInt(e.target.value) || 1))
                  setCount(val)
                }}
                disabled={isGenerating}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-accent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {count > 1 && (
                <p className="text-xs text-gray-500">
                  {topic.trim()
                    ? `All ${count} posts will be written on this topic with different angles`
                    : `AI will choose a different topic for each post`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate {count > 1 ? `${count} Posts` : 'Post'}
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
                <strong>Note:</strong> Each post runs a 7-stage AI pipeline (~1–2 min each).
                {count > 1
                  ? ` ${count} posts will take roughly ${Math.round(count * 1.5)}–${count * 2} minutes total.`
                  : ' You can navigate away — progress is shown on the Posts page.'}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
