'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { usePosts, useDeletePost, useUpdatePost, useSchedulePost } from '@/hooks/use-posts'
import { useRealtimePosts } from '@/hooks/use-realtime-posts'
import { useState } from 'react'
import { Search, Plus, Trash2, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react'
import { Post } from '@/types/post'

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Enable real-time updates
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
      await deletePost.mutateAsync(id)
    }
  }

  const handleApprove = async (post: Post) => {
    await updatePost.mutateAsync({
      id: post.id,
      data: { status: 'approved' },
    })
  }

  const handleReject = async (post: Post) => {
    await updatePost.mutateAsync({
      id: post.id,
      data: { status: 'rejected' },
    })
  }

  const handleSchedule = async (id: string) => {
    try {
      await schedulePost.mutateAsync(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule post')
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'posted', label: 'Posted' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
          <p className="text-gray-400">Manage your LinkedIn posts</p>
        </div>
        <Link href="/posts/new">
          <Button variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            Create Post
          </Button>
        </Link>
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
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading posts...</p>
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
      {!isLoading && !error && (!posts || posts.length === 0) && (
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
      {!isLoading && !error && posts && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} hoverable>
              <div className="relative">
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
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

                {/* Image Preview */}
                <div className="h-48 bg-gray-900 rounded-t-xl overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-600 text-sm">No image</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {post.content}
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
