-- Add name and profile_image to social_connections
ALTER TABLE social_connections
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_connection_id UUID NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,
    platform_post_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    posted_at TIMESTAMPTZ,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(social_connection_id, platform_post_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_posts_connection_id ON social_posts(social_connection_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at);

-- Create social_analysis table
CREATE TABLE IF NOT EXISTS social_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    social_connection_id UUID NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,
    big_five_scores JSONB NOT NULL,
    analyzed_posts JSONB,
    strengths TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, social_connection_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_analysis_user_id ON social_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_social_analysis_connection_id ON social_analysis(social_connection_id);
