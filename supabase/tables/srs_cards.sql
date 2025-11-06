CREATE TABLE srs_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    book_id UUID,
    milestone_id UUID,
    chapter_id UUID,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    confidence_level INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    next_review TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    interval_days INTEGER DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);