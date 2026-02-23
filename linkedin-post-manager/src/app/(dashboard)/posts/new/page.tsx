'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreatePost } from '@/hooks/use-posts'

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const createPost = useCreatePost()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await createPost.mutateAsync({
        title,
        content,
        image_prompt: imagePrompt || undefined,
      })

      router.push('/posts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Create Post</h1>
        <p className="text-gray-400">Write and publish a new LinkedIn post</p>
      </div>

      <Card hoverable>
        <CardHeader>
          <CardTitle>New Post</CardTitle>
          <CardDescription>Create a new post for your LinkedIn profile</CardDescription>
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
                rows={8}
                required
              />
              <p className="text-xs text-gray-500">
                {content.length} / 3000 characters
              </p>
            </div>

            {/* Image Prompt (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">
                Image Prompt (Optional)
              </Label>
              <Textarea
                id="imagePrompt"
                placeholder="Describe the image you want to generate (e.g., 'A modern office with people collaborating')..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Leave blank to create post without an image
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={createPost.isPending}
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
