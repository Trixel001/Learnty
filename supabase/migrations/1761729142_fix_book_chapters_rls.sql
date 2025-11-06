-- Migration: fix_book_chapters_rls
-- Created at: 1761729142

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Allow insert via edge function" ON book_chapters;

-- Create new INSERT policy that allows service_role
CREATE POLICY "Allow insert for service_role and users"
  ON book_chapters FOR INSERT
  TO public, anon, authenticated, service_role
  WITH CHECK (true);

-- Update SELECT policy to allow service_role
DROP POLICY IF EXISTS "Users can view own chapters" ON book_chapters;

CREATE POLICY "Users can view own chapters"
  ON book_chapters FOR SELECT
  TO public, anon, authenticated, service_role
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
;