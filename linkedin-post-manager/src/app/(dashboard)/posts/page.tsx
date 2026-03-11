'use client'

import NextImage from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { usePosts, useDeletePost, useUpdatePost } from '@/hooks/use-posts'
import { useRealtimePosts } from '@/hooks/use-realtime-posts'
import { useState, useCallback } from 'react'
import { Search, Trash2, CheckSquare, Square, CheckCircle, ImageIcon, X } from 'lucide-react'
import CreatePostMenu from '@/components/posts/create-post-menu'

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState<string | null>(null) // 'delete' | 'approve' | 'images'
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)

  let showToast: ((type: any, title: string, message?: string) => void) | null = null
  try {
    const toastHook = useToast()
    showToast = toastHook?.showToast || null
  } catch {
    showToast = () => {}
  }

  useRealtimePosts()

  const { data: posts, isLoading, error } = usePosts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  })

  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()

  const safePosts = Array.isArray(posts) ? posts : []

  // ─── Single delete ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost.mutateAsync(id)
        showToast?.('success', 'Post deleted')
      } catch (err) {
        showToast?.('error', 'Delete failed', err instanceof Error ? err.message : 'Failed')
      }
    }
  }

  // ─── Selection logic ──────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === safePosts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(safePosts.map(p => p.id)))
    }
  }, [selectedIds.size, safePosts])

  const clearSelection = () => setSelectedIds(new Set())

  // ─── Bulk Delete ──────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (!confirm(`Delete ${ids.length} post${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkLoading('delete')
    setBulkProgress({ done: 0, total: ids.length })
    let succeeded = 0
    for (const id of ids) {
      try {
        await deletePost.mutateAsync(id)
        succeeded++
      } catch { /* skip failed */ }
      setBulkProgress({ done: succeeded, total: ids.length })
    }
    setBulkLoading(null)
    setBulkProgress(null)
    clearSelection()
    showToast?.('success', `Deleted ${succeeded}/${ids.length} posts`)
  }

  // ─── Bulk Approve ─────────────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds)
    setBulkLoading('approve')
    setBulkProgress({ done: 0, total: ids.length })
    let succeeded = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/posts/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        })
        if (res.ok) succeeded++
      } catch { /* skip */ }
      setBulkProgress({ done: succeeded, total: ids.length })
    }
    setBulkLoading(null)
    setBulkProgress(null)
    clearSelection()
    showToast?.('success', `Approved & scheduled ${succeeded}/${ids.length} posts`)
  }

  // ─── Bulk Generate Images ─────────────────────────────────────────────────
  const handleBulkGenerateImages = async () => {
    const selected = safePosts.filter(p => selectedIds.has(p.id) && p.image_prompt)
    const noPrompt = safePosts.filter(p => selectedIds.has(p.id) && !p.image_prompt)

    if (noPrompt.length > 0 && selected.length === 0) {
      showToast?.('error', 'No image prompts', `${noPrompt.length} selected post${noPrompt.length > 1 ? 's have' : ' has'} no image prompt. Generate the post content first.`)
      return
    }

    setBulkLoading('images')
    setBulkProgress({ done: 0, total: selected.length })
    let succeeded = 0

    for (const post of selected) {
      try {
        // Generate image
        const genRes = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: post.image_prompt }),
        })
        if (!genRes.ok) throw new Error('Generation failed')
        const { imageUrl } = await genRes.json()

        // Save image_url back to post
        await updatePost.mutateAsync({ id: post.id, data: { image_url: imageUrl } })
        succeeded++
      } catch { /* skip */ }
      setBulkProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null)
    }

    setBulkLoading(null)
    setBulkProgress(null)
    clearSelection()

    const msg = noPrompt.length > 0
      ? `Generated ${succeeded}/${selected.length} images. ${noPrompt.length} skipped (no prompt).`
      : `Generated ${succeeded}/${selected.length} images`
    showToast?.('success', 'Bulk image generation complete', msg)
  }

  const statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'Pending Review', label: 'Pending Review' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Posted', label: 'Posted' },
    { value: 'Rejected', label: 'Rejected' },
  ]

  const allSelected = safePosts.length > 0 && selectedIds.size === safePosts.length
  const someSelected = selectedIds.size > 0

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
          <p className="text-gray-400">Manage your LinkedIn posts</p>
        </div>
        <CreatePostMenu />
      </div>

      {/* Filters + Select All row */}
      <div className="flex flex-col md:flex-row gap-4">
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-accent focus:ring-2 focus:ring-purple-accent/20 transition-all"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Select all toggle — only show when posts exist */}
        {safePosts.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white hover:border-purple-accent transition-colors"
          >
            {allSelected
              ? <CheckSquare className="w-4 h-4 text-purple-accent" />
              : <Square className="w-4 h-4 text-gray-400" />}
            <span className="text-sm">{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <PostCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <div className="p-6">
            <p className="text-red-400">Error loading posts. Please try again.</p>
          </div>
        </Card>
      )}

      {/* Empty */}
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
          {safePosts.map((post) => {
            const isSelected = selectedIds.has(post.id)
            return (
              <Card
                key={post.id}
                hoverable
                className={`transition-all duration-150 ${isSelected ? 'ring-2 ring-purple-accent' : ''}`}
              >
                <div className="relative">
                  {/* Checkbox overlay */}
                  <button
                    onClick={() => toggleSelect(post.id)}
                    className="absolute top-3 left-3 z-10 w-6 h-6 rounded flex items-center justify-center bg-gray-900/80 border border-gray-600 hover:border-purple-accent transition-colors"
                    aria-label={isSelected ? 'Deselect post' : 'Select post'}
                  >
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-purple-accent" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>

                  {/* Image Preview */}
                  <div
                    className={`h-48 bg-gray-900 rounded-t-xl overflow-hidden relative cursor-pointer`}
                    onClick={() => toggleSelect(post.id)}
                  >
                    {post.image_url ? (
                      <NextImage src={post.image_url} alt={post.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-sm">No image</p>
                      </div>
                    )}
                    {/* Selection overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-accent/20 pointer-events-none" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 flex-1">
                        {post.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                        post.status === 'Pending Review' ? 'bg-yellow-500/20 text-yellow-400'
                        : post.status === 'Approved' ? 'bg-green-500/20 text-green-400'
                        : post.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-400'
                        : post.status === 'Posted' || post.status === 'Post Sent' ? 'bg-purple-accent/20 text-purple-light'
                        : 'bg-red-500/20 text-red-400'
                      }`}>
                        {post.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-3">{post.post_content}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/posts/${post.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full">Edit</Button>
                      </Link>
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
            )
          })}
        </div>
      )}

      {/* ─── Bulk Action Bar ─────────────────────────────────────────────────── */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            {/* Count + clear */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white font-semibold text-sm whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              {bulkProgress && (
                <span className="text-gray-400 text-xs">
                  — {bulkProgress.done}/{bulkProgress.total} done
                </span>
              )}
            </div>

            <button
              onClick={clearSelection}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-700" />

            {/* Bulk Approve */}
            <button
              onClick={handleBulkApprove}
              disabled={!!bulkLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {bulkLoading === 'approve' ? `Approving…` : 'Approve'}
            </button>

            {/* Bulk Generate Images */}
            <button
              onClick={handleBulkGenerateImages}
              disabled={!!bulkLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-accent hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              {bulkLoading === 'images' ? `Generating…` : 'Generate Images'}
            </button>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={!!bulkLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {bulkLoading === 'delete' ? `Deleting…` : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
