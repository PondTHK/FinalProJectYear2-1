-- Create saved_jobs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'saved_jobs'
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE saved_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            post_id UUID NOT NULL REFERENCES company_posts(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        );
        
        -- Create index for faster queries
        CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
        CREATE INDEX idx_saved_jobs_post_id ON saved_jobs(post_id);
        
        RAISE NOTICE 'Created saved_jobs table';
    ELSE
        RAISE NOTICE 'saved_jobs table already exists';
    END IF;
END $$;
