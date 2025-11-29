-- Create user_ai_scores table
CREATE TABLE user_ai_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    recommended_position VARCHAR(255) NOT NULL,
    analysis TEXT NOT NULL,
    education_score INTEGER CHECK (education_score >= 0 AND education_score <= 100),
    experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
    skill_score INTEGER CHECK (skill_score >= 0 AND skill_score <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_ai_scores_user_id ON user_ai_scores(user_id);

-- Create index on score for ranking queries
CREATE INDEX idx_user_ai_scores_score ON user_ai_scores(score DESC);
