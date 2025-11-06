-- Migration: create_book_chapters_table
-- Created at: 1761726533


-- Create book_chapters table for storing chapter/section breakdowns
CREATE TABLE IF NOT EXISTS book_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  learning_objectives TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER,
  start_page INTEGER,
  end_page INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_book_chapters_book_id ON book_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chapters_user_id ON book_chapters(user_id);

-- Enable RLS
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own chapters
CREATE POLICY "Users can view own chapters" ON book_chapters
  FOR SELECT USING (auth.uid() = user_id);

-- Allow insert via edge function (anon and service_role)
CREATE POLICY "Allow insert via edge function" ON book_chapters
  FOR INSERT WITH CHECK (
    auth.role() IN ('anon', 'service_role')
  );

-- Allow users to update their own chapters
CREATE POLICY "Users can update own chapters" ON book_chapters
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own chapters
CREATE POLICY "Users can delete own chapters" ON book_chapters
  FOR DELETE USING (auth.uid() = user_id);

-- Update books table RLS policies
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;

-- Create comprehensive RLS policies for books
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert via edge function" ON books
  FOR INSERT WITH CHECK (
    auth.role() IN ('anon', 'service_role')
  );

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);
;