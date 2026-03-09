export type PostStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Scheduled'
  | 'Post Sent'
  | 'Posted'
  | 'Rejected'

export interface Post {
  id: string
  title: string
  post_content: string
  image_url: string | null
  image_prompt: string | null
  status: PostStatus
  scheduled_time?: string | null
  posted_at?: string | null
  created_at: string
  updated_at: string
  linkedin_url?: string | null
  revision_prompt?: string | null
  revision_type?: string | null
  notes?: string | null
  topic?: string | null
  source?: string
  generation_metadata?: string | null
}

export interface CreatePostInput {
  title: string
  post_content: string
  image_prompt?: string
}

export interface UpdatePostInput {
  title?: string
  post_content?: string
  image_url?: string | null
  image_prompt?: string | null
  status?: PostStatus
  scheduled_time?: string | null
}
