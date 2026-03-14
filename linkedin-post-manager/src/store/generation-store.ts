import { create } from 'zustand'

export interface PostProgress {
  steps: string[]
  status: 'pending' | 'running' | 'done' | 'error'
  postId?: string
  errorMessage?: string
}

interface GenerationState {
  isGenerating: boolean
  count: number
  topic: string
  posts: PostProgress[]
  // Actions
  startGeneration: (count: number, topic: string) => void
  updatePost: (index: number, update: Partial<PostProgress>) => void
  clearGeneration: () => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
  isGenerating: false,
  count: 0,
  topic: '',
  posts: [],

  startGeneration: (count, topic) =>
    set({
      isGenerating: true,
      count,
      topic,
      posts: Array.from({ length: count }, () => ({ steps: [], status: 'pending' })),
    }),

  updatePost: (index, update) =>
    set((state) => ({
      posts: state.posts.map((p, i) => (i === index ? { ...p, ...update } : p)),
    })),

  clearGeneration: () =>
    set({ isGenerating: false, count: 0, topic: '', posts: [] }),
}))
