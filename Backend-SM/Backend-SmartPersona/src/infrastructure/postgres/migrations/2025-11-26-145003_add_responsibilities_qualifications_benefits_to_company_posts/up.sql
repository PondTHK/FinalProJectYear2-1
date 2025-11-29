-- Add responsibilities, qualifications, and benefits columns to company_posts table
DO $$
BEGIN
    -- Add responsibilities column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'responsibilities'
    ) THEN
        ALTER TABLE company_posts ADD COLUMN responsibilities TEXT;
        RAISE NOTICE 'Added responsibilities column to company_posts table';
    ELSE
        RAISE NOTICE 'responsibilities column already exists in company_posts table';
    END IF;

    -- Add qualifications column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'qualifications'
    ) THEN
        ALTER TABLE company_posts ADD COLUMN qualifications TEXT;
        RAISE NOTICE 'Added qualifications column to company_posts table';
    ELSE
        RAISE NOTICE 'qualifications column already exists in company_posts table';
    END IF;

    -- Add benefits column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'benefits'
    ) THEN
        ALTER TABLE company_posts ADD COLUMN benefits TEXT;
        RAISE NOTICE 'Added benefits column to company_posts table';
    ELSE
        RAISE NOTICE 'benefits column already exists in company_posts table';
    END IF;
END $$;

