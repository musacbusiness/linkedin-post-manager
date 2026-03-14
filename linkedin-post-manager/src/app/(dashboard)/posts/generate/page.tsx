'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface PostProgress {
  steps: string[]
  status: 'pending' | 'running' | 'done' | 'error'
  postId?: string
  errorMessage?: string
}

export default function GeneratePostPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [posts, setPosts] = useState<PostProgress[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runSingleGeneration(index: number): Promise<string | null> {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, status: 'running' } : p))
    )

    const response = await fetch('/api/generate/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topic.trim() || undefined }),
    })

    if (!response.ok || !response.body) {
      const msg = 'Failed to start generation'
      setPosts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, status: 'error', errorMessage: msg } : p))
      )
      return null
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let postId: string | null = null
    let hasError = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))

          if (evt.stage === -1) {
            hasError = true
            setPosts((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, status: 'error', errorMessage: evt.message } : p
              )
            )
            break
          }

          if (evt.message) {
            setPosts((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, steps: [...p.steps, evt.message] } : p
              )
            )
          }

          if (evt.stage === 7 && evt.data?.postId) {
            postId = evt.data.postId
          }
        } catch {
          // skip invalid JSON fragments
        }
      }

      if (hasError) break
    }

    if (!hasError && postId) {
      setPosts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, status: 'done', postId } : p))
      )
      return postId
    }

    return null
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsGenerating(true)

    // Initialise all slots as pending
    setPosts(Array.from({ length: count }, () => ({ steps: [], status: 'pending' })))

    const completedIds: string[] = []

    for (let i = 0; i < count; i++) {
      const id = await runSingleGeneration(i)
      if (id) completedIds.push(id)
    }

    setIsGenerating(false)

    if (completedIds.length === 0) {
      setError('All generations failed. Check the errors above.')
      showToast('error', 'Generation failed', 'No posts were created')
      return
    }

    const succeeded = completedIds.length
    const failed = count - succeeded

    showToast(
      failed === 0 ? 'success' : 'warning',
      `${succeeded} post${succeeded !== 1 ? 's' : ''} generated`,
      failed > 0 ? `${failed} failed` : undefined
    )

    // Single post → go straight to editor; multiple → go to posts list
    if (count === 1 && completedIds[0]) {
      router.push(`/posts/${completedIds[0]}`)
    } else {
      router.push('/posts')
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
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

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

            {/* Progress Display */}
            {posts.length > 0 && (
              <div className="space-y-3">
                {posts.map((post, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 transition-colors ${
                      post.status === 'running'
                        ? 'border-purple-accent/40 bg-purple-accent/5'
                        : post.status === 'done'
                        ? 'border-green-600/40 bg-green-600/5'
                        : post.status === 'error'
                        ? 'border-red-600/40 bg-red-600/5'
                        : 'border-gray-700 bg-gray-900/40'
                    }`}
                  >
                    {/* Post header */}
                    <div className="flex items-center gap-2 mb-2">
                      {post.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      ) : post.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-purple-light animate-spin shrink-0" />
                      ) : post.status === 'error' ? (
                        <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          post.status === 'done'
                            ? 'text-green-400'
                            : post.status === 'running'
                            ? 'text-purple-light'
                            : post.status === 'error'
                            ? 'text-red-400'
                            : 'text-gray-500'
                        }`}
                      >
                        Post {i + 1}{count > 1 ? ` of ${count}` : ''}
                        {post.status === 'done' && ' — Done'}
                        {post.status === 'error' && ' — Failed'}
                        {post.status === 'pending' && ' — Waiting'}
                      </span>
                    </div>

                    {/* Steps */}
                    {post.steps.length > 0 && (
                      <div className="space-y-1 ml-6">
                        {post.steps.map((step, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-gray-400">
                            <div
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                j === post.steps.length - 1 && post.status === 'running'
                                  ? 'bg-purple-accent animate-pulse'
                                  : 'bg-gray-600'
                              }`}
                            />
                            {step}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error message */}
                    {post.status === 'error' && post.errorMessage && (
                      <p className="ml-6 mt-1 text-xs text-red-400">{post.errorMessage}</p>
                    )}
                  </div>
                ))}
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
                    Generate {count > 1 ? `${count} Posts` : 'Post'}
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
                <strong>Note:</strong> Each post runs a 7-stage AI pipeline (~1–2 min each).
                {count > 1
                  ? ` ${count} posts will take roughly ${Math.round(count * 1.5)}–${count * 2} minutes total.`
                  : ' Posts are saved as Pending Review when complete.'}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
