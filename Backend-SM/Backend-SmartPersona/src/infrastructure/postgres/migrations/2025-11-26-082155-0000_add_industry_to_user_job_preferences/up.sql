-- Add industry column to user_job_preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_job_preferences' 
        AND column_name='industry'
    ) THEN
        ALTER TABLE user_job_preferences ADD COLUMN industry VARCHAR(255);
        RAISE NOTICE 'Added industry column to user_job_preferences table';
    ELSE
        RAISE NOTICE 'industry column already exists in user_job_preferences table';
    END IF;
END $$;
