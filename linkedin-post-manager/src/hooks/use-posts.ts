import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Post, CreatePostInput, UpdatePostInput } from '@/types/post'

// Fetch all posts
export function usePosts(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/posts?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json()
      return data.posts as Post[]
    },
  })
}

// Fetch single post
export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Post ID is required')
      }
      console.log('[usePost] ===== Starting fetch for post ID:', id)
      const response = await fetch(`/api/posts/${id}`)

      console.log('[usePost] Response status:', response.status)
      console.log('[usePost] Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `HTTP ${response.status}`
        console.error('[usePost] API error:', errorMsg)
        console.error('[usePost] Full error data:', errorData)
        throw new Error(`Failed to fetch post: ${errorMsg}`)
      }

      const data = await response.json()
      console.log('[usePost] Raw API response:', data)
      console.log('[usePost] Extracted post object:', data.post)

      if (!data.post) {
        console.error('[usePost] WARNING: API returned data but no post object!')
        console.error('[usePost] Response keys:', Object.keys(data))
        throw new Error('API returned invalid response: no post object found')
      }

      console.log('[usePost] Post ID from response:', data.post.id)
      console.log('[usePost] Post title:', data.post.title)
      console.log('[usePost] Post content exists:', !!data.post.post_content)
      console.log('[usePost] Post content length:', data.post.post_content ? data.post.post_content.length : 0)
      console.log('[usePost] Post status:', data.post.status)
      console.log('[usePost] Post status type:', typeof data.post.status)
      console.log('[usePost] Status === "Pending Review":', data.post.status === 'Pending Review')
      console.log('[usePost] ===== Successfully fetched post')

      return data.post as Post
    },
    enabled: !!id,
    retry: 1,
  })
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create post')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// Update post
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePostInput }) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update post')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] })
    },
  })
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete post')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// Auto-schedule post
export function useSchedulePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/posts/${id}/schedule`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to schedule post')
      }
      return response.json()
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts', id] })
    },
  })
}
