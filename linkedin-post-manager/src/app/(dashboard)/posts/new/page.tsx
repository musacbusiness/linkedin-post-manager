'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreatePost } from '@/hooks/use-posts'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const createPost = useCreatePost()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      await createPost.mutateAsync({
        title: title.trim(),
        post_content: content.trim(),
        image_prompt: imagePrompt.trim() || undefined,
      })

      showToast('success', 'Post created', 'Your post has been created successfully')
      router.push('/posts')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post'
      setError(errorMessage)
      showToast('error', 'Creation failed', errorMessage)
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
          <h1 className="text-3xl font-bold text-white mb-2">Create New Post</h1>
          <p className="text-gray-400">Write a new LinkedIn post</p>
        </div>
      </div>

      {/* Form */}
      <Card hoverable>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>Enter your post information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                required
              />
              <p className="text-xs text-gray-500">
                {(content || '').length} / 3000 characters
              </p>
            </div>

            {/* Image Prompt (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">
                Image Prompt (Optional)
              </Label>
              <Textarea
                id="imagePrompt"
                placeholder="Describe the image you want to generate later..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                You can generate an image after creating the post
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={createPost.isPending}
                disabled={createPost.isPending}
              >
                {createPost.isPending ? 'Creating...' : 'Create Post'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={createPost.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
