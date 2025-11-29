-- Restore UNIQUE constraint on user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'user_job_preferences_user_id_unique'
        AND table_name = 'user_job_preferences'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE user_job_preferences
        ADD CONSTRAINT user_job_preferences_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Restored user_job_preferences_user_id_unique constraint';
    ELSE
        RAISE NOTICE 'user_job_preferences_user_id_unique constraint already exists';
    END IF;
END $$;
