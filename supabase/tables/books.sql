CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size INTEGER,
    cover_image_url TEXT,
    ai_analysis JSONB,
    ai_processing_status TEXT DEFAULT 'pending',
    ai_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);