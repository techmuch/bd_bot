CREATE TABLE irad_reviews (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES irad_projects(id) ON DELETE CASCADE,
    reviewer_id INT REFERENCES users(id),
    technical_merit INT CHECK (technical_merit BETWEEN 1 AND 10),
    strategic_alignment INT CHECK (strategic_alignment BETWEEN 1 AND 10),
    transition_potential INT CHECK (transition_potential BETWEEN 1 AND 10),
    comments TEXT,
    status TEXT DEFAULT 'draft', -- draft, submitted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, reviewer_id)
);
