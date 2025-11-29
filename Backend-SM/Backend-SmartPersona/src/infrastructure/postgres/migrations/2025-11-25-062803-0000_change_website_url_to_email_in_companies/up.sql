-- Change website_url to email in companies table
DO $$
BEGIN
    -- Check if email column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        -- Add email column
        ALTER TABLE companies
        ADD COLUMN email VARCHAR(255);
        
        RAISE NOTICE 'Added email column to companies table';
    ELSE
        RAISE NOTICE 'email column already exists in companies table';
    END IF;
    
    -- Check if website_url column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'website_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE companies
        DROP COLUMN website_url;
        
        RAISE NOTICE 'Removed website_url column from companies table';
    ELSE
        RAISE NOTICE 'website_url column does not exist in companies table';
    END IF;
END
$$;
