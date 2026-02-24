import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to real-time post updates from Supabase
 * Automatically refreshes React Query cache when posts change
 */
export function useRealtimePosts() {
  const queryClient = useQueryClient()

  // Use ref to maintain stable supabase client reference
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    // Subscribe to all changes in the posts table
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Realtime update:', payload)

          // Invalidate posts queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['posts'] })

          // If it's an UPDATE or DELETE, also invalidate the specific post
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            const postId = (payload.old as any)?.id || (payload.new as any)?.id
            if (postId) {
              queryClient.invalidateQueries({ queryKey: ['posts', postId] })
            }
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient])
}
