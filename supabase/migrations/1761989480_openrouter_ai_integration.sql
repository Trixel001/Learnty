-- Migration: openrouter_ai_integration
-- Created at: 1761989480

-- Add OpenRouter AI Integration Tables
-- This migration enhances the database for comprehensive AI study features

-- 1. Add content chunks table for better content organization
CREATE TABLE IF NOT EXISTS content_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  chunk_number INTEGER NOT NULL,
  content_text TEXT NOT NULL,
  start_position INTEGER,
  end_position INTEGER,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add AI generated content table
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  generation_model VARCHAR(100) DEFAULT 'deepseek/deepseek-chat-v3.1:free',
  ai_provider VARCHAR(50) DEFAULT 'openrouter',
  quality_score DECIMAL(3,2),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add AI usage logs table for tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enhance books table with AI metadata
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- 5. Enhance srs_cards table with AI generation metadata
ALTER TABLE srs_cards 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generation_id UUID,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_chunks_book_id ON content_chunks(book_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_user_id ON content_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_book_id ON ai_generated_content(book_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- 7. Add RLS policies
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content chunks" ON content_chunks
  FOR SELECT USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can insert own content chunks" ON content_chunks
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can update own content chunks" ON content_chunks
  FOR UPDATE USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can delete own content chunks" ON content_chunks
  FOR DELETE USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can view own AI content" ON ai_generated_content
  FOR SELECT USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can insert own AI content" ON ai_generated_content
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can update own AI content" ON ai_generated_content
  FOR UPDATE USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can delete own AI content" ON ai_generated_content
  FOR DELETE USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can view own AI usage" ON ai_usage_logs
  FOR SELECT USING (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role') AND auth.uid() = user_id);;