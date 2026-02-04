-- Supabase Schema for LinkedIn Post Manager
-- Run this SQL in your Supabase dashboard (SQL Editor)
-- It creates the posts table with all necessary fields

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Content Fields
  title TEXT NOT NULL,
  post_content TEXT NOT NULL,
  image_url TEXT,

  -- Status Management
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft',
    'Pending Review',
    'Approved - Ready to Schedule',
    'Scheduled',
    'Posted',
    'Rejected'
  )),

  -- Scheduling
  scheduled_time TIMESTAMP WITH TIME ZONE,
  posted_time TIMESTAMP WITH TIME ZONE,
  linkedin_url TEXT,

  -- Revision/Feedback
  revision_prompt TEXT,
  revision_type TEXT,
  notes TEXT,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  topic TEXT,
  source TEXT DEFAULT 'manual'
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- Create index on scheduled_time for date range queries
CREATE INDEX IF NOT EXISTS posts_scheduled_time_idx ON posts(scheduled_time);

-- Enable Row Level Security (optional, for multi-user support)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (optional)
-- Create policy "Allow all operations for authenticated users" ON posts
-- FOR ALL USING (auth.role() = 'authenticated');

-- Allow all operations for anonymous users (for public access)
CREATE POLICY "Allow all operations" ON posts
FOR ALL USING (true);
