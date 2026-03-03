'use client'

import NextImage from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { usePosts, useDeletePost, useUpdatePost, useSchedulePost } from '@/hooks/use-posts'
import { useRealtimePosts } from '@/hooks/use-realtime-posts'
import { useState } from 'react'
import { Search, Plus, Trash2, CheckCircle, XCircle, Calendar, Clock, Sparkles } from 'lucide-react'
import { Post } from '@/types/post'

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Defensive: wrap useToast in try-catch
  let showToast: ((type: any, title: string, message?: string) => void) | null = null
  try {
    const toastHook = useToast()
    showToast = toastHook?.showToast || null
  } catch (err) {
    console.error('useToast error:', err)
    showToast = () => {} // Fallback no-op function
  }

  // Enable real-time updates for live post changes
  useRealtimePosts()

  const { data: posts, isLoading, error } = usePosts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  })

  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()
  const schedulePost = useSchedulePost()

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost.mutateAsync(id)
        if (showToast) {
          showToast('success', 'Post deleted', 'The post has been permanently deleted')
        }
      } catch (err) {
        if (showToast) {
          showToast('error', 'Delete failed', err instanceof Error ? err.message : 'Failed to delete post')
        }
      }
    }
  }

  const handleApprove = async (post: Post) => {
    try {
      await updatePost.mutateAsync({
        id: post.id,
        data: { status: 'approved' },
      })
      if (showToast) {
        showToast('success', 'Post approved', 'You can now schedule this post')
      }
    } catch (err) {
      if (showToast) {
        showToast('error', 'Approval failed', err instanceof Error ? err.message : 'Failed to approve post')
      }
    }
  }

  const handleReject = async (post: Post) => {
    try {
      await updatePost.mutateAsync({
        id: post.id,
        data: { status: 'rejected' },
      })
      if (showToast) {
        showToast('warning', 'Post rejected', 'The post has been marked as rejected')
      }
    } catch (err) {
      if (showToast) {
        showToast('error', 'Rejection failed', err instanceof Error ? err.message : 'Failed to reject post')
      }
    }
  }

  const handleSchedule = async (id: string) => {
    try {
      await schedulePost.mutateAsync(id)
      if (showToast) {
        showToast('success', 'Post scheduled', 'Your post has been scheduled successfully')
      }
    } catch (err) {
      if (showToast) {
        showToast('error', 'Scheduling failed', err instanceof Error ? err.message : 'Failed to schedule post')
      }
    }
  }

  // Defensive: ensure statusOptions is always an array
  const statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'posted', label: 'Posted' },
    { value: 'rejected', label: 'Rejected' },
  ]

  // Defensive: ensure posts is always an array
  const safePosts = Array.isArray(posts) ? posts : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
          <p className="text-gray-400">Manage your LinkedIn posts</p>
        </div>
        <div className="flex gap-3">
          <Link href="/posts/generate">
            <Button variant="secondary" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Generate with AI
            </Button>
          </Link>
          <Link href="/posts/new">
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-accent focus:ring-2 focus:ring-purple-accent/20 transition-all"
        >
          {Array.isArray(statusOptions) && statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <div className="p-6">
            <p className="text-red-400">Error loading posts. Please try again.</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && safePosts.length === 0 && (
        <Card hoverable>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No posts found</p>
            <Link href="/posts/new">
              <Button variant="primary">Create First Post</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Posts Grid */}
      {!isLoading && !error && safePosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safePosts.map((post) => (
            <Card key={post.id} hoverable>
              <div className="relative">
                {/* Image Preview */}
                <div className="h-48 bg-gray-900 rounded-t-xl overflow-hidden relative">
                  {post.image_url ? (
                    <NextImage
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-600 text-sm">No image</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                        post.status === 'pending_review'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : post.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : post.status === 'scheduled'
                          ? 'bg-blue-500/20 text-blue-400'
                          : post.status === 'posted'
                          ? 'bg-purple-accent/20 text-purple-light'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {post.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {post.post_content}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    {post.scheduled_for && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.scheduled_for).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {post.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(post)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(post)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {post.status === 'approved' && (
                      <button
                        onClick={() => handleSchedule(post.id)}
                        disabled={schedulePost.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        {schedulePost.isPending ? 'Scheduling...' : 'Auto-Schedule'}
                      </button>
                    )}
                    {post.status !== 'pending_review' && post.status !== 'approved' && (
                      <Link href={`/posts/${post.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full">
                          Edit
                        </Button>
                      </Link>
                    )}
                    {post.status === 'approved' && (
                      <Link href={`/posts/${post.id}`} className="flex-shrink-0">
                        <Button variant="secondary">
                          Edit
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-4 py-2 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
