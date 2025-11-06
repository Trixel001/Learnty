-- Migration: enhance_s3_methodology_schema
-- Created at: 1761729807

-- Migration: enhance_s3_methodology_schema
-- Enhance existing tables for S3 (Small Simple Steps) methodology

-- 1. Enhance milestones table for S3 features
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id);
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES book_chapters(id);
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'intermediate';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 20;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS key_concepts TEXT[] DEFAULT '{}';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS content_preview TEXT;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completion_score INTEGER DEFAULT 0;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Create milestone dependencies table for prerequisite relationships
CREATE TABLE IF NOT EXISTS milestone_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  depends_on_milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(milestone_id, depends_on_milestone_id)
);

-- 3. Enhance srs_cards table for milestone integration
ALTER TABLE srs_cards ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id);
ALTER TABLE srs_cards ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES book_chapters(id);

-- 4. Add learning session tracking table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  milestone_id UUID REFERENCES milestones(id),
  session_type TEXT NOT NULL DEFAULT 'study', -- study, review, practice
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Add user learning preferences table
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  preferred_session_duration INTEGER DEFAULT 25, -- Pomodoro default
  difficulty_preference TEXT DEFAULT 'adaptive', -- easy, normal, hard, adaptive
  daily_learning_goal INTEGER DEFAULT 60, -- minutes
  review_frequency TEXT DEFAULT 'spaced', -- daily, spaced, intensive
  focus_break_duration INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Update milestones with better defaults and constraints
ALTER TABLE milestones ALTER COLUMN is_completed SET DEFAULT false;
ALTER TABLE milestones ADD CONSTRAINT check_completion_score CHECK (completion_score >= 0 AND completion_score <= 100);
ALTER TABLE milestones ADD CONSTRAINT check_estimated_minutes CHECK (estimated_minutes > 0);

-- 7. Enable RLS on new tables
ALTER TABLE milestone_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for new tables
-- Milestone dependencies: Users can view dependencies for their milestones
CREATE POLICY "Users can view milestone dependencies"
  ON milestone_dependencies FOR SELECT
  TO public, anon, authenticated, service_role
  USING (
    EXISTS (
      SELECT 1 FROM milestones m 
      WHERE m.id = milestone_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage milestone dependencies"
  ON milestone_dependencies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Learning sessions: Users can manage their own sessions
CREATE POLICY "Users can manage own learning sessions"
  ON learning_sessions FOR ALL
  TO public, anon, authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all learning sessions"
  ON learning_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User preferences: Users can manage their own preferences
CREATE POLICY "Users can manage own learning preferences"
  ON user_learning_preferences FOR ALL
  TO public, anon, authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all learning preferences"
  ON user_learning_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. Update existing milestones RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  TO public, anon, authenticated, service_role
  USING (
    (user_id IS NULL OR auth.uid() = user_id OR auth.role() = 'service_role') OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
CREATE POLICY "Users can manage own milestones"
  ON milestones FOR ALL
  TO public, anon, authenticated, service_role
  USING (
    auth.uid() = user_id OR auth.role() = 'service_role' OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    auth.uid() = user_id OR auth.role() = 'service_role' OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    ))
  );;