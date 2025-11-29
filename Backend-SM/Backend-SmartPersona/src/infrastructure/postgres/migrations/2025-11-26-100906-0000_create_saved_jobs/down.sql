-- Drop saved_jobs table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'saved_jobs'
        AND table_schema = 'public'
    ) THEN
        DROP TABLE saved_jobs;
        RAISE NOTICE 'Dropped saved_jobs table';
    ELSE
        RAISE NOTICE 'saved_jobs table does not exist';
    END IF;
END $$;
