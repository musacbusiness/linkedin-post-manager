'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGenerationStore } from '@/store/generation-store'

// Runs in the dashboard layout so it persists across page navigation.
// Reads from the global store, executes SSE fetches, and updates the store.
export function GenerationManager() {
  const store = useGenerationStore()
  const queryClient = useQueryClient()
  const isRunning = useRef(false)

  useEffect(() => {
    if (!store.isGenerating || isRunning.current) return
    isRunning.current = true

    async function runSingle(index: number): Promise<void> {
      store.updatePost(index, { status: 'running' })

      try {
        const response = await fetch('/api/generate/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: store.topic || undefined }),
        })

        if (!response.ok || !response.body) {
          store.updatePost(index, { status: 'error', errorMessage: 'Failed to start generation' })
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
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
                store.updatePost(index, { status: 'error', errorMessage: evt.message })
                break
              }

              if (evt.message) {
                store.updatePost(index, {
                  steps: [...useGenerationStore.getState().posts[index].steps, evt.message],
                })
              }

              if (evt.stage === 7 && evt.data?.postId) {
                store.updatePost(index, { status: 'done', postId: evt.data.postId })
                // Refresh posts list as each one completes
                queryClient.invalidateQueries({ queryKey: ['posts'] })
              }
            } catch {
              // skip invalid JSON fragments
            }
          }

          if (hasError) break
        }

        // If stream ended without a stage-7 success and no explicit error, mark error
        const current = useGenerationStore.getState().posts[index]
        if (current.status === 'running') {
          store.updatePost(index, { status: 'error', errorMessage: 'Generation ended unexpectedly' })
        }
      } catch (err) {
        store.updatePost(index, {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    async function runAll() {
      const { count } = useGenerationStore.getState()
      for (let i = 0; i < count; i++) {
        await runSingle(i)
      }
      // Final cache refresh after all done
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      isRunning.current = false
    }

    runAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isGenerating])

  return null
}
