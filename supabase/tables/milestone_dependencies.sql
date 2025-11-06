CREATE TABLE milestone_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL,
    depends_on_milestone_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(milestone_id,
    depends_on_milestone_id)
);