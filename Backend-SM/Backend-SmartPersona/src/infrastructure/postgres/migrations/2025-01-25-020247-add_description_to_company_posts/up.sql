-- Add description column to company_posts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE company_posts ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to company_posts table';
    ELSE
        RAISE NOTICE 'description column already exists in company_posts table';
    END IF;
END $$;

