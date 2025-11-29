-- Remove description column from company_posts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE company_posts DROP COLUMN description;
        RAISE NOTICE 'Removed description column from company_posts table';
    ELSE
        RAISE NOTICE 'description column does not exist in company_posts table';
    END IF;
END $$;

