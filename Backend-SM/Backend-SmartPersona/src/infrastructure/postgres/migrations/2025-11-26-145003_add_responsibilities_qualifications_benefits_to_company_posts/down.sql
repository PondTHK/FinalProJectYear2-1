-- Remove responsibilities, qualifications, and benefits columns from company_posts table
DO $$
BEGIN
    -- Remove responsibilities column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'responsibilities'
    ) THEN
        ALTER TABLE company_posts DROP COLUMN responsibilities;
        RAISE NOTICE 'Removed responsibilities column from company_posts table';
    ELSE
        RAISE NOTICE 'responsibilities column does not exist in company_posts table';
    END IF;

    -- Remove qualifications column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'qualifications'
    ) THEN
        ALTER TABLE company_posts DROP COLUMN qualifications;
        RAISE NOTICE 'Removed qualifications column from company_posts table';
    ELSE
        RAISE NOTICE 'qualifications column does not exist in company_posts table';
    END IF;

    -- Remove benefits column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_posts' 
        AND column_name = 'benefits'
    ) THEN
        ALTER TABLE company_posts DROP COLUMN benefits;
        RAISE NOTICE 'Removed benefits column from company_posts table';
    ELSE
        RAISE NOTICE 'benefits column does not exist in company_posts table';
    END IF;
END $$;

