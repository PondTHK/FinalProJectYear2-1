-- Remove industry column from user_job_preferences
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='user_job_preferences' 
        AND column_name='industry'
    ) THEN
        ALTER TABLE user_job_preferences DROP COLUMN industry;
        RAISE NOTICE 'Removed industry column from user_job_preferences table';
    ELSE
        RAISE NOTICE 'industry column does not exist in user_job_preferences table';
    END IF;
END $$;
