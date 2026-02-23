'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { usePost, useUpdatePost } from '@/hooks/use-posts'
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const { data: post, isLoading } = usePost(postId)
  const updatePost = useUpdatePost()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setImagePrompt(post.image_prompt || '')
      setImageUrl(post.image_url)
    }
  }, [post])

  async function handleGenerateImage() {
    if (!imagePrompt.trim()) {
      setError('Please enter an image prompt')
      return
    }

    setIsGeneratingImage(true)
    setError(null)

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setImageUrl(data.imageUrl)

      // Auto-save the generated image URL to the post
      await updatePost.mutateAsync({
        id: postId,
        data: { image_url: data.imageUrl, image_prompt: imagePrompt },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await updatePost.mutateAsync({
        id: postId,
        data: {
          title,
          content,
          image_prompt: imagePrompt || null,
        },
      })

      router.push('/posts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-accent animate-spin" />
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
                {imageUrl ? (
                  <NextImage
                    src={imageUrl}
                    alt="Post preview"
                    fill
                    className="object-cover"
                  />
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

              {/* Generate Button */}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                isLoading={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
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
              <CardTitle>Post Content</CardTitle>
              <CardDescription>Edit your post details</CardDescription>
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
                    {content.length} / 3000 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={updatePost.isPending}
                  >
                    {updatePost.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    disabled={updatePost.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
