CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    milestone_id UUID,
    session_type TEXT NOT NULL DEFAULT 'study',
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    performance_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);