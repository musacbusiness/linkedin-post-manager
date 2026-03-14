'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { usePost, useUpdatePost } from '@/hooks/use-posts'
import { Sparkles, Loader2, Image as ImageIcon, CheckCircle, XCircle, CalendarX } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Defensive: ensure postId is a valid string
  const rawId = params?.id
  const postId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''

  // Defensive: if no valid postId, redirect to posts page
  useEffect(() => {
    if (!postId) {
      console.error('No valid post ID found in params:', params)
      router.push('/posts')
    }
  }, [postId, params, router])

  const { data: post, isLoading, error: fetchError } = usePost(postId)
  const updatePost = useUpdatePost()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generationStep, setGenerationStep] = useState<'idle' | 'prompt' | 'image'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  // Regenerate modal state
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [regenMode, setRegenMode] = useState<'same' | 'new'>('same')
  const [promptFeedback, setPromptFeedback] = useState('')
  // Separate loading states for each action button
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isUnscheduling, setIsUnscheduling] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Defensive: wrap useToast in try-catch
  let showToast: ((type: any, title: string, message?: string) => void) | null = null
  try {
    const toastHook = useToast()
    showToast = toastHook?.showToast || null
  } catch (err) {
    console.error('useToast error:', err)
    showToast = () => {}
  }

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setTitle(post.title || '')
      setContent(post.post_content || '')
      setImagePrompt(post.image_prompt || '')
      setImageUrl(post.image_url || null)
      setImageError(false)
    }
  }, [post])

  // Log fetch errors
  useEffect(() => {
    if (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load post')
    }
  }, [fetchError])

  // Invalidate React Query cache so UI updates immediately without page refresh
  const invalidatePost = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    queryClient.invalidateQueries({ queryKey: ['posts', postId] })
  }

  async function handleGenerateImage(promptOverride?: string) {
    const promptToUse = promptOverride ?? imagePrompt
    if (!promptToUse.trim()) {
      setError('Please enter an image prompt')
      return
    }

    setIsGeneratingImage(true)
    setGenerationStep('image')
    setError(null)
    setImageError(false)

    // Pass anchorConfig from generation_metadata if available
    const anchorConfig = (post?.generation_metadata as any)?.anchorConfig ?? null

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse, anchorConfig }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setImageUrl(data.imageUrl)

      await updatePost.mutateAsync({
        id: postId,
        data: { image_url: data.imageUrl, image_prompt: promptToUse },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
      setGenerationStep('idle')
    }
  }

  async function handleRegenerate() {
    setShowRegenModal(false)

    if (regenMode === 'same') {
      await handleGenerateImage()
      return
    }

    // Generate new prompt first, then generate image with it
    setIsGeneratingImage(true)
    setGenerationStep('prompt')
    setError(null)
    setImageError(false)

    try {
      const promptRes = await fetch('/api/generate/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, feedback: promptFeedback }),
      })

      if (!promptRes.ok) {
        const errData = await promptRes.json()
        throw new Error(errData.error || 'Failed to generate new image prompt')
      }

      const { prompt: newPrompt } = await promptRes.json()
      setImagePrompt(newPrompt)
      setPromptFeedback('')

      // Now generate the image with the new prompt
      setGenerationStep('image')
      const anchorConfig = (post?.generation_metadata as any)?.anchorConfig ?? null
      const imageRes = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt, anchorConfig }),
      })

      if (!imageRes.ok) {
        const errData = await imageRes.json()
        throw new Error(errData.error || 'Failed to generate image')
      }

      const { imageUrl: newImageUrl } = await imageRes.json()
      setImageUrl(newImageUrl)
      setImageError(false)

      await updatePost.mutateAsync({
        id: postId,
        data: { image_url: newImageUrl, image_prompt: newPrompt },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate image')
    } finally {
      setIsGeneratingImage(false)
      setGenerationStep('idle')
    }
  }

  // Auto-save with debounce
  const autoSave = async (titleVal: string, contentVal: string, promptVal: string) => {
    if (!titleVal || !contentVal) return

    setIsSaving(true)
    try {
      await updatePost.mutateAsync({
        id: postId,
        data: {
          title: titleVal,
          post_content: contentVal,
          image_prompt: promptVal || null,
        },
      })
    } catch (err) {
      console.error('Auto-save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (
    setter: (value: string) => void,
    value: string,
    autoSaveValues?: { title?: string; content?: string; prompt?: string }
  ) => {
    setter(value)

    if (saveTimeoutId) clearTimeout(saveTimeoutId)

    const newTimeoutId = setTimeout(() => {
      const saveTitle = autoSaveValues?.title ?? title
      const saveContent = autoSaveValues?.content ?? content
      const savePrompt = autoSaveValues?.prompt ?? imagePrompt
      autoSave(saveTitle, saveContent, savePrompt)
    }, 1500)

    setSaveTimeoutId(newTimeoutId)
  }

  async function handleApprove() {
    setIsApproving(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve post')
      }

      const data = await response.json()
      if (showToast) {
        showToast('success', 'Post approved', `Scheduled for ${new Date(data.scheduledTime).toLocaleString()}`)
      }

      // Update React Query cache immediately so status badge + buttons update without page refresh
      invalidatePost()
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve post'
      setError(errorMessage)
      if (showToast) {
        showToast('error', 'Approval failed', errorMessage)
      }
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    setIsRejecting(true)
    setError(null)

    try {
      await updatePost.mutateAsync({
        id: postId,
        data: { status: 'Rejected' },
      })

      if (showToast) {
        showToast('warning', 'Post rejected', 'The post has been marked as rejected')
      }

      invalidatePost()
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject post'
      setError(errorMessage)
      if (showToast) {
        showToast('error', 'Rejection failed', errorMessage)
      }
    } finally {
      setIsRejecting(false)
    }
  }

  async function handleUnschedule() {
    setIsUnscheduling(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/unschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unschedule post')
      }

      if (showToast) {
        showToast('success', 'Post unscheduled', 'The post has been removed from the scheduling queue')
      }

      // Update React Query cache immediately so approve/reject buttons appear without page refresh
      invalidatePost()
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unschedule post'
      setError(errorMessage)
      if (showToast) {
        showToast('error', 'Unschedule failed', errorMessage)
      }
    } finally {
      setIsUnscheduling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-accent animate-spin" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Error loading post: {fetchError instanceof Error ? fetchError.message : 'Unknown error'}</p>
        <Button variant="primary" onClick={() => router.push('/posts')} className="mt-4">
          Back to Posts
        </Button>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Post not found</p>
        <Button variant="primary" onClick={() => router.push('/posts')} className="mt-4">
          Back to Posts
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Post</h1>
        <p className="text-gray-400">Update your LinkedIn post</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Image Column (2/5) */}
        <div className="lg:col-span-2">
          <Card hoverable className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Post Image</CardTitle>
              <CardDescription>Generate an AI image for your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                {imageUrl && !imageError ? (
                  <NextImage
                    src={imageUrl}
                    alt="Post preview"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => {
                      console.error('Failed to load image:', imageUrl)
                      setImageError(true)
                    }}
                  />
                ) : imageError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-4">
                      <ImageIcon className="w-16 h-16 text-red-500 mx-auto mb-2" />
                      <p className="text-red-400 text-sm mb-2">Failed to load image</p>
                      <p className="text-gray-500 text-xs">Try regenerating the image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No image yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Prompt */}
              <div className="space-y-2">
                <Label htmlFor="imagePrompt">Image Prompt</Label>
                <Textarea
                  id="imagePrompt"
                  placeholder="Describe the image you want to generate..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={4}
                  disabled={isGeneratingImage}
                />
              </div>

              {/* Generate / Regenerate Button */}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (imageUrl) {
                    setRegenMode('same')
                    setPromptFeedback('')
                    setShowRegenModal(true)
                  } else {
                    handleGenerateImage()
                  }
                }}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                isLoading={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {generationStep === 'prompt' ? 'Generating prompt...' : 'Generating image...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {imageUrl ? 'Regenerate Image' : 'Generate Image'}
                  </>
                )}
              </Button>

              {imageUrl && (
                <div className="p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Image URL</p>
                  <p className="text-xs text-gray-300 font-mono break-all">{imageUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Column (3/5) */}
        <div className="lg:col-span-3">
          <Card hoverable>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Post Content</CardTitle>
                {post && (
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      post.status === 'Pending Review'
                        ? 'bg-gray-500/20 text-gray-400'
                        : post.status === 'Approved'
                        ? 'bg-green-500/20 text-green-400'
                        : post.status === 'Scheduled'
                        ? 'bg-purple-accent/20 text-purple-light'
                        : post.status === 'Posted'
                        ? 'bg-purple-accent/20 text-purple-light'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {post.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <CardDescription>Edit your post details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Auto-save Status */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400">Auto-saving</p>
                  <div className="flex items-center gap-2">
                    {isSaving && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                    <span className="text-xs text-gray-500">{isSaving ? 'Saving...' : 'All changes saved'}</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" required>
                    Post Title
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter post title..."
                    value={title}
                    onChange={(e) => handleFieldChange(setTitle, e.target.value, { title: e.target.value })}
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" required>
                    Post Content
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here..."
                    value={content}
                    onChange={(e) => handleFieldChange(setContent, e.target.value, { content: e.target.value })}
                    rows={12}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {(content || '').length} / 3000 characters
                  </p>
                </div>

                {/* Approve/Reject Buttons (for Pending Review) */}
                {post.status === 'Pending Review' && (
                  <div className="border-t border-gray-700 pt-6 mt-6">
                    <p className="text-sm text-gray-400 mb-3">Review & Approve</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving || isRejecting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-accent to-purple-light hover:from-purple-light hover:to-purple-accent text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:from-purple-accent disabled:hover:to-purple-light"
                      >
                        {isApproving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        {isApproving ? 'Approving...' : 'Approve & Schedule'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={isApproving || isRejecting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:hover:bg-red-600"
                      >
                        {isRejecting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        {isRejecting ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Unschedule Button (for Scheduled posts) */}
                {post.status === 'Scheduled' && (
                  <div className="border-t border-gray-700 pt-6 mt-6">
                    <p className="text-sm text-gray-400 mb-3">Scheduled Actions</p>
                    <button
                      type="button"
                      onClick={handleUnschedule}
                      disabled={isUnscheduling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isUnscheduling ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CalendarX className="w-5 h-5" />
                      )}
                      {isUnscheduling ? 'Unscheduling...' : 'Remove from Schedule'}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Regenerate Image Modal */}
      {showRegenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRegenModal(false) }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Regenerate Image</h2>

            {/* Option 1 */}
            <button
              type="button"
              onClick={() => setRegenMode('same')}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                regenMode === 'same'
                  ? 'border-purple-accent bg-purple-accent/10'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <p className={`font-medium text-sm ${regenMode === 'same' ? 'text-purple-light' : 'text-white'}`}>
                Use same image prompt
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Re-run image generation with the current prompt
              </p>
            </button>

            {/* Option 2 */}
            <button
              type="button"
              onClick={() => setRegenMode('new')}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                regenMode === 'new'
                  ? 'border-purple-accent bg-purple-accent/10'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <p className={`font-medium text-sm ${regenMode === 'new' ? 'text-purple-light' : 'text-white'}`}>
                Generate new image prompt
              </p>
              <p className="text-xs text-gray-400 mt-1">
                AI will create a revised prompt based on your feedback
              </p>
            </button>

            {/* Feedback textarea — visible only for "new" mode */}
            {regenMode === 'new' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  What would you like to change?
                </label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-accent resize-none"
                  rows={4}
                  placeholder="e.g. make it show someone working alone at a laptop, no group scenes... or focus more on the before/after transformation..."
                  value={promptFeedback}
                  onChange={(e) => setPromptFeedback(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenMode === 'new' && !promptFeedback.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-accent hover:bg-purple-accent/80 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
