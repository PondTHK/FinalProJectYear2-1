-- Revert: Change email back to website_url in companies table
DO $$
BEGIN
    -- Check if website_url column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'website_url'
        AND table_schema = 'public'
    ) THEN
        -- Add website_url column back
        ALTER TABLE companies
        ADD COLUMN website_url VARCHAR(500);
        
        RAISE NOTICE 'Added website_url column back to companies table';
    ELSE
        RAISE NOTICE 'website_url column already exists in companies table';
    END IF;
    
    -- Check if email column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE companies
        DROP COLUMN email;
        
        RAISE NOTICE 'Removed email column from companies table';
    ELSE
        RAISE NOTICE 'email column does not exist in companies table';
    END IF;
END
$$;
