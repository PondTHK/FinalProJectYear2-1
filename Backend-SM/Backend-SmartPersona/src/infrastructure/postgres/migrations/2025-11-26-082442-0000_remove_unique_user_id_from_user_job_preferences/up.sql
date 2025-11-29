-- Remove UNIQUE constraint on user_id to allow multiple job preferences per user
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'user_job_preferences_user_id_unique'
        AND table_name = 'user_job_preferences'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE user_job_preferences
        DROP CONSTRAINT user_job_preferences_user_id_unique;
        RAISE NOTICE 'Removed user_job_preferences_user_id_unique constraint';
    ELSE
        RAISE NOTICE 'user_job_preferences_user_id_unique constraint does not exist';
    END IF;
END $$;
