export type PostStatus =
  | 'pending_review'
  | 'approved'
  | 'scheduled'
  | 'posted'
  | 'rejected'

export interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  image_prompt: string | null
  status: PostStatus
  scheduled_for: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatePostInput {
  title: string
  content: string
  image_prompt?: string
}

export interface UpdatePostInput {
  title?: string
  content?: string
  image_url?: string | null
  image_prompt?: string | null
  status?: PostStatus
  scheduled_for?: string | null
}
